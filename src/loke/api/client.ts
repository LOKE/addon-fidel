import { HTTPClient } from "@loke/http-client";
import { URL } from "url";
import { createErrorType } from "@loke/errors";

import {
  Organization,
  Location,
  ApiClientOptions,
  Logger,
  ListOptions,
  ListResponse,
  HttpError,
  SyncOrAsync,
  WebhookSubscription,
  WebhookSubscriptionRequest,
  ApiClient,
  Customer,
  ListMember,
  List,
} from "../types";

/*
NOTE: you will want to use registerMetrics on http-client in your project root
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pluckBody = (res: { body: any }) => res.body;

interface HttpErrorMeta {
  reason?: string | { message: string };
  statusCode: number;
}

const UnauthorizedError = createErrorType<HttpErrorMeta>({
  name: "UnauthorizedError",
  message: "Unauthorized",
  code: "unauthorized",
  help: `Typically happens when access token is invalid
`,
});

const InternalError = createErrorType<HttpErrorMeta>({
  name: "InternalError",
  message: "Internal error",
  code: "internal",
  help: `500 response
`,
});

const BadRequestError = createErrorType<HttpErrorMeta>({
  name: "BadRequestError",
  message: "Bad request error",
  code: "bad_request",
  help: `400 response
`,
});

/**
 * Client to the Loke API.
 * @todo The paging in this client is a bit of a hack job. It should assume less about how nextPage works.
 */
export class LokeApiClient extends HTTPClient implements ApiClient {
  constructor(options: ApiClientOptions, private logger: Logger = console) {
    super({
      baseUrl: options.baseUrl || "https://api.loke.global/",
      headers: { Authorization: `Bearer ${options.accessToken}` },
    });
  }

  async listOrganizations(
    options: ListOptions = {}
  ): Promise<ListResponse<Organization>> {
    const response = await this.request("GET", "/organizations{?after}", {
      after: options.after,
    });

    if (response.nextPage && options.autoPage) {
      return {
        items: response.body.concat(
          (
            await this.listOrganizations({
              autoPage: true,
              after: this.getCursor(response.nextPage),
            })
          ).items
        ),
      };
    }

    return {
      items: response.body,
      cursor: response.nextPage && this.getCursor(response.nextPage),
    };
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    return this.request("GET", "/organizations/{organizationId}", {
      organizationId,
    }).then(pluckBody);
  }

  async listLocations(
    organizationId: string,
    options: ListOptions = {}
  ): Promise<ListResponse<Location>> {
    const response = await this.request(
      "GET",
      "/organizations/{organizationId}/locations{?after}",
      { organizationId, after: options.after }
    );

    if (response.nextPage && options.autoPage) {
      return {
        items: response.body.concat(
          (
            await this.listLocations(organizationId, {
              autoPage: true,
              after: this.getCursor(response.nextPage),
            })
          ).items
        ),
      };
    }

    return {
      items: response.body,
      cursor: response.nextPage && this.getCursor(response.nextPage),
    };
  }

  async getLocation(
    organizationId: string,
    locationId: string
  ): Promise<Location | null> {
    return this.request(
      "GET",
      "/organizations/{organizationId}/locations/{locationId}",
      { organizationId, locationId }
    ).then(pluckBody);
  }

  async listCustomers(
    organizationId: string,
    query?: { email?: string },
    options: ListOptions = {}
  ): Promise<ListResponse<Customer>> {
    const response = await this.request(
      "GET",
      "/organizations/{organizationId}/customers{?email}{after}",
      { organizationId, after: options.after, email: query?.email }
    );

    if (response.nextPage && options.autoPage) {
      return {
        items: response.body.concat(
          (
            await this.listCustomers(organizationId, query, {
              autoPage: true,
              after: this.getCursor(response.nextPage),
            })
          ).items
        ),
      };
    }

    return {
      items: response.body,
      cursor: response.nextPage && this.getCursor(response.nextPage),
    };
  }

  async getCustomer(
    organizationId: string,
    customerId: string
  ): Promise<Customer | null> {
    return this.request(
      "GET",
      "/organizations/{organizationId}/customers/{customerId}",
      { organizationId, customerId }
    ).then(pluckBody);
  }

  async listCustomerLists(
    organizationId: string,
    options: ListOptions = {}
  ): Promise<ListResponse<List>> {
    const response = await this.request(
      "GET",
      "/organizations/{organizationId}/customer-lists{?after}",
      { organizationId, after: options.after }
    );

    if (response.nextPage && options.autoPage) {
      return {
        items: response.body.concat(
          (
            await this.listCustomerLists(organizationId, {
              autoPage: true,
              after: this.getCursor(response.nextPage),
            })
          ).items
        ),
      };
    }

    return {
      items: response.body,
      cursor: response.nextPage && this.getCursor(response.nextPage),
    };
  }

  async listCustomerListMembers(
    organizationId: string,
    listId: string,
    options: ListOptions = {}
  ): Promise<ListResponse<ListMember>> {
    const response = await this.request(
      "GET",
      "/organizations/{organizationId}/customer-lists/{listId}/members{?after}",
      { organizationId, listId, after: options.after }
    );

    if (response.nextPage && options.autoPage) {
      return {
        items: response.body.concat(
          (
            await this.listCustomerListMembers(organizationId, listId, {
              autoPage: true,
              after: this.getCursor(response.nextPage),
            })
          ).items
        ),
      };
    }

    return {
      items: response.body,
      cursor: response.nextPage && this.getCursor(response.nextPage),
    };
  }

  async removeCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void> {
    await this.request(
      "DELETE",
      "/organizations/{organizationId}/customer-lists/{listId}/members/{customerId}",
      { organizationId, listId, customerId }
    );
  }

  async addCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void> {
    await this.request(
      "PUT",
      "/organizations/{organizationId}/customer-lists/{listId}/members/{customerId}",
      { organizationId, listId, customerId }
    );
  }

  async listWebhooks(organizationId: string): Promise<WebhookSubscription[]> {
    return this.request("GET", "/organizations/{organizationId}/webhooks", {
      organizationId,
    }).then(pluckBody);
  }

  async subscribeWebhook(
    organizationId: string,
    webhookRef: string,
    subscription: WebhookSubscriptionRequest
  ): Promise<WebhookSubscription[]> {
    return this.request(
      "PUT",
      "/organizations/{organizationId}/webhooks/{webhookRef}",
      { organizationId, webhookRef },
      subscription
    ).then(pluckBody);
  }

  async unsubscribeWebhook(
    organizationId: string,
    webhookRef: string
  ): Promise<void> {
    await this.request(
      "DELETE",
      "/organizations/{organizationId}/webhooks/{webhookRef}",
      { organizationId, webhookRef }
    );
  }

  async adjustCustomerPointsBalance(
    organizationId: string,
    customerId: string,
    reference: string,
    amount: number,
    notes: string
  ): Promise<string> {
    const res = await this.request(
      "PUT",
      `/organizations/${organizationId}/customers/${customerId}/points/${reference}`,
      { organizationId, customerId, reference },
      { amount, notes }
    );

    console.log({ res });
    return res;
  }

  /**
   * map response to result
   * @param res http response
   */
  _handlerResponse<ResponseType>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: any
  ): SyncOrAsync<{ body: ResponseType; nextPage?: string }> {
    const { body, headers } = res;
    const nextPage: string = headers["x-next-page"] || "";

    return { body, nextPage };
  }

  /**
   * map response error to result
   * @param  {Object} err            error from http response
   * @param  {Object} err.statusCode http status code
   * @param  {Object} err.response   original http response
   */
  _handlerError(err: Error | HttpError): void {
    if (!("statusCode" in err)) {
      throw err;
    }

    const { message, reason, statusCode } = parseHttpError(err);
    switch (err.statusCode) {
      case 401:
        throw new UnauthorizedError(message, { reason, statusCode });
      case 400:
        throw new BadRequestError(message, { reason, statusCode });
      case 500:
        throw new InternalError(message, { reason, statusCode });
      case 403:
      default:
        this.logger.error(
          "Unexpected status code",
          err.statusCode,
          err.statusMessage,
          err.body
        );
        throw new Error(err.statusMessage);
    }
  }

  private getCursor(path: string) {
    const after = new URL(path, this.baseUrl).searchParams.get("after");
    if (!after) throw new Error("nextPage broken");
    return after;
  }
}

function parseHttpError(err: HttpError) {
  if (typeof err.body === "string") {
    return {
      message: err.statusMessage,
      reason: err.body,
      statusCode: err.statusCode,
    };
  }
  if (typeof err.body === "object" && err.body.message) {
    return {
      message: err.body.message,
      reason: err.body,
      statusCode: err.statusCode,
    };
  }
  return { message: err.statusMessage, statusCode: err.statusCode };
}
