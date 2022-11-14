import { Logger } from "@loke/logger";
import { Issuer, Client, TokenSet, custom } from "openid-client";

// The default timeout of 3500 is causing issues
custom.setHttpOptionsDefaults({ timeout: 7500 });

export function createTokenRefresher(
  config: {
    lokeClientId: string;
    lokeClientSecret: string;
    lokeIssuerUrl: string;
  },
  logger: Logger
) {
  if (!config.lokeClientId) {
    throw new Error("LOKE_CLIENT_ID is required");
  }
  if (!config.lokeClientSecret) {
    throw new Error("LOKE_CLIENT_SECRET is required");
  }

  let issuer: Issuer<Client> | null = null;

  return async function refreshLokeToken(): Promise<TokenSet> {
    if (!issuer) {
      issuer = await Issuer.discover(config.lokeIssuerUrl);
    } else {
      // refresh in background so we keep it up to date, but just use the current one
      Issuer.discover(config.lokeIssuerUrl)
        .then((_issuer) => (issuer = _issuer))
        .catch((err) => {
          logger.warn("Background refresh of LOKE issuer failed - " + err);
        });
    }

    const client: Client = new issuer.Client({
      client_id: config.lokeClientId,
      client_secret: config.lokeClientSecret,
    });

    try {
      const tokenSet: TokenSet = await client.grant({
        grant_type: "client_credentials",
      });

      logger.info("LOKE token refreshed");

      return tokenSet;
    } catch (err) {
      logger.error("Unable to refresh LOKE token", {
        client_id: config.lokeClientId,
        client_secret: config.lokeClientSecret,
      });
      throw err;
    }
  };
}
