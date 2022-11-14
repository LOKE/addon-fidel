import { Logger } from "@loke/logger";
import { ApiClient, ApiClientFactory } from "../types";
import { LokeAuthAwareApiClient } from "./auth-client";
import { LokeApiClient } from "./client";
import { createTokenRefresher } from "./token-refresher";

export class LokeApiClientFactory implements ApiClientFactory {
  private client: LokeAuthAwareApiClient;
  private pInit: Promise<void>;

  constructor(
    private logger: Logger,
    config: {
      lokeClientId: string;
      lokeClientSecret: string;
      lokeIssuerUrl: string;
    }
  ) {
    const tokenRefresher = createTokenRefresher(config, logger);
    this.client = new LokeAuthAwareApiClient(tokenRefresher, logger);
    this.pInit = this.client.init();
  }

  /**
   * Provides an API client authenticated as a LOKE user
   * @param userAccessToken an access token for the logged in user
   */
  asUser(userAccessToken: string): ApiClient {
    return new LokeApiClient({ accessToken: userAccessToken }, this.logger);
  }

  /**
   * Provides an API client authenticated as the client (using ID and secret)
   */
  async asClient(): Promise<ApiClient> {
    await this.pInit;
    return this.client;
  }
}
