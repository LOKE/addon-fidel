import { Logger } from "@loke/logger";
import { randomBytes } from "crypto";
import { URL } from "url";
import { Issuer, Client, generators, TokenSet } from "openid-client";
import { Router } from "express";

import { Repository } from "../../repo/types";
import { IncomingMessage } from "http";
import { ApiClient } from "../types";

const CALLBACK_PATH = "/auth/callback";

export async function createMiddleware(
  repo: Repository,
  lokeApiClient: ApiClient,
  logger: Logger,
  config: {
    name: string;
    baseUrl: string;
    lokeWebhookSecret: string;
    lokeClientId: string;
    lokeClientSecret: string;
    lokeIssuerUrl: string;
  }
) {
  // TODO: periodically refresh this
  const issuer: Issuer<Client> = await Issuer.discover(config.lokeIssuerUrl);

  async function getTokensForCode(
    req: IncomingMessage,
    state: string,
    codeVerifier: string
  ): Promise<TokenSet> {
    const client: Client = new issuer.Client({
      client_id: config.lokeClientId,
      client_secret: config.lokeClientSecret,
    });

    const params = client.callbackParams(req);

    const url = new URL(CALLBACK_PATH, config.baseUrl);

    const tokenSet = await client.callback(url.toString(), params, {
      state,
      code_verifier: codeVerifier,
    });

    return tokenSet;
  }

  const router = Router();

  router.get("/", async (req, res) => {
    const client: Client = new issuer.Client({
      client_id: config.lokeClientId,
      client_secret: config.lokeClientSecret,
    });

    // state and codeVerifier should be stored for verifying with the callback
    const state: string = randomBytes(20).toString("hex");
    const codeVerifier: string = generators.codeVerifier();
    const codeChallenge: string = generators.codeChallenge(codeVerifier);

    const url: string = client.authorizationUrl({
      redirect_uri: new URL(CALLBACK_PATH, config.baseUrl).toString(),
      // offline indicates that you want a refresh token
      scope: "openid offline",
      prompt: "consent",
      // optionally provide the org, otherwise the user can choose
      // login_hint: org ? `org=${org}` : undefined,
      login_hint: undefined,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    try {
      await repo.createLokeAuthAttempt({
        state,
        codeVerifier,
      });

      return res.redirect(url);
    } catch (_err) {
      const err = _err as Error;

      logger.error(err);
      return res.status(400).json({ message: err.message });
    }
  });

  router.get("/callback", async (req, res) => {
    // const { code, scope, state } = req.query;
    const state = req.query.state as string | undefined;

    try {
      if (!state) {
        throw new Error("Invalid state");
      }

      const lokeAuth = await repo.getLokeAuthAttemptByState(state);

      if (!lokeAuth || lokeAuth.state !== state) {
        throw new Error("LOKE Auth Not Found");
      }

      const codeVerifier: string = lokeAuth.codeVerifier;

      const tokenSet: TokenSet = await getTokensForCode(
        req,
        state,
        codeVerifier
      );

      const { id_token, access_token, refresh_token } = tokenSet;
      if (!id_token || !access_token || !refresh_token) {
        throw new Error("Missing required tokens");
      }

      const claims = tokenSet.claims();

      // console.info("New tokens", id_token, access_token, refresh_token);

      if (!req.session) {
        // To satisfy type checker
        throw new Error("Session not available.");
      }
      req.session.idToken = id_token;
      req.session.accessToken = access_token;
      req.session.claims = claims;

      res.redirect("/organizations");
    } catch (_err) {
      const err: Error = _err as Error;
      logger.error("Error during auth:", err.stack);
      return res.status(400).json({ error: { message: err.message } });
    }
  });

  router.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
  });

  return router;
}
