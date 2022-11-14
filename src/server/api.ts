import { randomUUID, createHmac } from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { ApiClient, ApiClientFactory } from "../loke/types";
import { OrgConfig, Repository } from "../repo/types";

export interface ApiRequest extends Request {
  userApiClient?: ApiClient;
}

export function initApi(
  repo: Repository,
  lokeApiClientFactory: ApiClientFactory,
  config: { baseUrl: string; lokeWebhookSecret: string; name: string }
) {
  const router = Router();

  const withUserApiClient = (
    req: ApiRequest,
    res: Response,
    next: NextFunction
  ) => {
    const accessToken = req.session?.accessToken;
    if (!accessToken) {
      return res.status(401).send("Unauthorized");
    }
    const userApiClient = lokeApiClientFactory.asUser(accessToken);
    req.userApiClient = userApiClient;

    next();
  };

  const withOrgAccess = async (
    req: ApiRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.orgId) {
        return res.status(404).send("Not found");
      }
      const org = await req.userApiClient!.getOrganization(req.params.orgId);
      if (!org) {
        // User does not have access to this organization
        return res.status(404).send("Not found");
      }
    } catch (err) {
      return res.status(500).send("Internal error");
    }
    next();
  };

  router.get("/me", (req, res) => {
    res.json(req.session?.claims);
  });

  router.get(
    "/organizations",
    withUserApiClient,
    async (req: ApiRequest, res) => {
      try {
        const apiClient = await lokeApiClientFactory.asClient();

        const [userOrgs, clientOrgs] = await Promise.all([
          // This returns only organizations that the logged on user can access
          req.userApiClient!.listOrganizations({ autoPage: true }),
          // This returns only organizations that are installed for your client ID
          apiClient.listOrganizations({ autoPage: true }),
        ]);

        // We should only show to the user the orgs that they have access to,
        // but typically we only want to show those that are already installed for this client ID
        res.send(
          (
            await Promise.all(
              userOrgs.items.map(async (uo) => {
                const clientOrg = clientOrgs.items.find(
                  (co) => co.id === uo.id
                );
                // Check if the org is already linked to a fidel-brand or not
                const repoOrg = clientOrg
                  ? await repo.getOrganization(clientOrg?.id)
                  : null;

                return {
                  ...uo,
                  installed: Boolean(clientOrg),
                  activated: Boolean(repoOrg),
                };
              })
            )
          ).filter((o) => o.installed)
        );
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  router.put(
    "/fidel/org/:orgId/:brandId",
    withUserApiClient,
    async (req: ApiRequest, res) => {
      const orgRepo = await repo.getOrganization(req.params.orgId);

      if (orgRepo && orgRepo.brand) {
        return res
          .status(400)
          .send("Organization is already linked to a brand in Fidel.");
      }

      const apiClient = await lokeApiClientFactory.asClient();

      const [userOrg, clientOrg] = await Promise.all([
        req.userApiClient!.getOrganization(req.params.orgId),
        apiClient.getOrganization(req.params.orgId),
      ]);

      if (!userOrg || !clientOrg) {
        return res.status(404).send("Not found");
      }

      try {
        await repo.linkBrandToOrganization(clientOrg?.id, req.body);
      } catch (error) {
        res.status(400).send("Error in linking brand");
      }

      return res.status(200).send(true);
    }
  );

  router.get(
    "/fidel/brands",
    withUserApiClient,
    async (req: ApiRequest, res) => {
      try {
        const fidelUrl = `${process.env.FIDEL_BASE_URL}/brands?limit=100&order=desc`;
        const options = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Fidel-Key": process.env.FIDEL_API_KEY ?? "",
          },
        };

        const response = await fetch(fidelUrl, options);
        if (response.status === 200) {
          const json = await response.json();
          res.send(json?.items ?? []);
        } else {
          res.status(response.status).send(response.statusText);
        }
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  router.post(
    "/fidel/location/:orgId",
    withUserApiClient,
    async (req: ApiRequest, res) => {
      // Link org(brand) to locations
      const fidelUrl = `${process.env.FIDEL_BASE_URL}/programs/${process.env.FIDEL_PROGRAM_ID}/locations`;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Fidel-Key": process.env.FIDEL_API_KEY ?? "",
        },
        body: JSON.stringify(req.body),
      };

      try {
        const response = await fetch(fidelUrl, options);
        if (response.status === 201) {
          const json = await response.json();
          res.send(json);
        } else {
          res.status(response.status).send(response.statusText);
        }
      } catch (error) {
        res.status(400).send("Error in creating location!");
      }
    }
  );

  router.get(
    "/organizations/:orgId",
    withUserApiClient,
    async (req: ApiRequest, res) => {
      try {
        const apiClient = await lokeApiClientFactory.asClient();

        const [userOrg, clientOrg] = await Promise.all([
          req.userApiClient!.getOrganization(req.params.orgId),
          apiClient.getOrganization(req.params.orgId),
        ]);

        if (!userOrg) {
          return res.status(404).send("Not found");
        }

        const repoOrg = clientOrg
          ? await repo.getOrganization(clientOrg?.id)
          : null;

        res.send({
          ...userOrg,
          installed: Boolean(clientOrg),
          activated: Boolean(repoOrg),
          brand: repoOrg?.brand ?? null,
        });
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  router.post("/webhooks/:type", async (req, res) => {
    const body = req.body;
    const headers = req.headers;

    if (
      !isSignatureValid(
        {
          signature: headers["x-fidel-signature"] as string,
          timestamp: headers["x-fidel-timestamp"] as string,
        },
        body,
        "wh_ta_430c9ca1-1544-4cbc-847b-78a07d5fdb6b",
        `https://${headers["host"] as string}/api/webhooks/${req.params.type}`
      )
    ) {
      console.log("INVALID SIGNATURE");
    }

    const linkedBrand = await repo.getOrganization(
      body.card.metadata.organizationId
    );
    if (!linkedBrand)
      return res.status(200).send("Brand not linked to any organization");

    if (linkedBrand.brand && linkedBrand.brand.id !== body.brand.id) {
      return res.status(200).send("Brand linked to a different organization");
    }
    const config = await repo.getConfig(body.card.metadata.organizationId);
    const pointsPerDollar = config ? config.pointsForDollarSpent : 1;
    const lokeApiClient = await lokeApiClientFactory.asClient();

    switch (req.params.type) {
      case "transaction.auth":
        await lokeApiClient.adjustCustomerPointsBalance(
          body.card.metadata.organizationId,
          body.card.metadata.customerId,
          randomUUID(),
          body.amount * pointsPerDollar,
          "ADJUSTED FROM FIDEL"
        );

        await repo.createTransaction({
          amount: body.amount,
          brandId: body.brand.id,
          transactionId: body.id,
          createdAt: body.created,
          programId: body.programId,
          locationId: body.location.id,
          lokeCustomerId: body.card.metadata.customerId,
          lokeOrganizationId: body.card.metadata.organizationId,
          cardId: body.card.id,
          pointsAwarded: body.amount * pointsPerDollar,
          currency: body.currency,
        });

        break;

      case "transaction.refund":
        if (body.originalTransactionId) {
          const transaciton = await repo.getTransactionById(
            body.originalTransactionId
          );

          if (!transaciton) return;

          await lokeApiClient.adjustCustomerPointsBalance(
            body.card.metadata.organizationId,
            body.card.metadata.customerId,
            randomUUID(),
            body.amount * pointsPerDollar,
            "ADJUSTED FROM FIDEL"
          );

          await repo.createTransaction({
            amount: body.amount,
            brandId: body.brand.id,
            transactionId: body.id,
            createdAt: body.created,
            programId: body.programId,
            locationId: body.location.id,
            lokeCustomerId: body.card.metadata.customerId,
            lokeOrganizationId: body.card.metadata.organizationId,
            cardId: body.card.id,
            pointsAwarded: body.amount * pointsPerDollar,
            currency: body.currency,
          });
        }

        break;

      default:
        break;
    }

    res.status(200).send({ message: "TRANSACTION RECEIVED" });
  });

  router.get(
    "/transactions/:orgId",
    withUserApiClient,
    withOrgAccess,
    async (req: ApiRequest, res) => {
      try {
        const transactions = await repo.getTransactions(req.params.orgId);
        res.send(transactions);
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  router.get(
    "/fidel/transactions/:orgId",
    withUserApiClient,
    withOrgAccess,
    async (req: ApiRequest, res) => {
      try {
        const apiClient = await lokeApiClientFactory.asClient();

        const [userOrg, clientOrg] = await Promise.all([
          req.userApiClient!.getOrganization(req.params.orgId),
          apiClient.getOrganization(req.params.orgId),
        ]);

        if (!userOrg) {
          return res.status(404).send("Not found");
        }

        const repoOrg = clientOrg
          ? await repo.getOrganization(clientOrg?.id)
          : null;

        if (!repoOrg || !repoOrg.brand) return [];

        const url = `https://api.fidel.uk/v1/brands/${repoOrg.brand.id}/programs/${process.env.FIDEL_PROGRAM_ID}/locations?limit=100`;
        const options = {
          method: "GET",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "Fidel-Key":
              process.env.FIDEL_API_KEY ??
              "sk_test_b6ba9f31-9087-4e66-afcb-4893c02c9ce1",
          },
        };

        const fidelRes = await fetch(url, options);
        const locationArr = await fidelRes.json(); // TODO: Need await here????
        const locations = locationArr.items;

        const locationIds = locations.map((l: any) => l.id);

        const urlForTransactions = `https://api.fidel.uk/v1/programs/${process.env.FIDEL_PROGRAM_ID}/transactions?limit=100`;
        const optionsForTransactions = {
          method: "GET",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "Fidel-Key":
              process.env.FIDEL_API_KEY ??
              "sk_test_b6ba9f31-9087-4e66-afcb-4893c02c9ce1",
          },
        };

        const transactionResFidel = await fetch(
          urlForTransactions,
          optionsForTransactions
        );
        const transactionArr = await transactionResFidel.json(); // TODO: Need await here????
        const transactions = transactionArr.items;

        const transactionsForThisLocation = transactions.filter(
          (t: any) => t.location.id === locationIds[0]
        );
        res.send(transactionsForThisLocation);
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  router.get(
    "/organizations/:orgId/config",
    withUserApiClient,
    withOrgAccess,
    async (req, res) => {
      try {
        const config = await repo.getConfig(req.params.orgId);
        res.send(config);
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  const DEFAULT_CONFIG: Partial<OrgConfig> = {
    pointsForDollarSpent: 1,
  };

  router.put(
    "/organizations/:orgId/config",
    withUserApiClient,
    withOrgAccess,
    async (req, res) => {
      try {
        await repo.setConfig(req.params.orgId, {
          ...DEFAULT_CONFIG,
          ...req.body,
        });
        const config = await repo.getConfig(req.params.orgId);
        res.send(config);
      } catch (err) {
        const error = err as Error & { code?: string };
        const statusCode = error.code === "unauthorized" ? 401 : 500;
        res.status(statusCode).send({ message: error.message });
      }
    }
  );

  return router;
}

interface FidelHeaders {
  signature: string;
  timestamp: string;
}

interface Payload {}

function isSignatureValid(
  fidelHeaders: FidelHeaders,
  payload: Payload,
  secret: string,
  url: string
) {
  function base64Digest(s: string) {
    return createHmac("sha256", secret).update(s).digest("base64");
  }

  /** You can check how much time has passed since the request has been sent */
  /** timestamp - UTC Unix Timestamp (milliseconds) */
  const timestamp = fidelHeaders.timestamp;
  const content = JSON.stringify(payload) + url + timestamp;

  const signature = base64Digest(base64Digest(content));
  return fidelHeaders.signature === signature;
}
