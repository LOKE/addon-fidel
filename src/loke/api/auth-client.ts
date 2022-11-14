import { Logger } from "@loke/logger";
import {
  ApiClient,
  Customer,
  List,
  ListMember,
  ListOptions,
  ListResponse,
  Location,
  TokenRefresher,
  WebhookSubscription,
  WebhookSubscriptionRequest,
} from "../types";
import { LokeApiClient } from "./client";

type MethodName = keyof ApiClient;

export class LokeAuthAwareApiClient implements ApiClient {
  private client: LokeApiClient;

  constructor(private tokenRefresher: TokenRefresher, private logger: Logger) {
    // NOTE: need to initialize/authenticate before requests will work
    this.client = this.createClient("");
  }

  public async init() {
    await this.refreshClient();
  }

  /**
   * Gets a client with the current access token
   */
  private createClient(accessToken: string) {
    return new LokeApiClient({ accessToken }, this.logger);
  }

  /**
   * Gets a client after refreshing the access token
   */
  private async refreshClient() {
    // Step 1: refresh tokens
    const tokens = await this.tokenRefresher();

    // Step 2: calidate tokens
    if (!tokens.access_token) throw new Error("Missing access_token");

    // Step 3: create client
    this.client = this.createClient(tokens.access_token);

    return this.client;
  }

  private proxyClientMethod<TMethod extends MethodName>(
    method: TMethod,
    ...args: Parameters<ApiClient[TMethod]>
  ) {
    // These "as any" casts are required as we are doing tricky stuff here
    // The Parameters declaration above adds a fair amount of safety

    // TODO: could do with a revisit to clean this up. Hard to follow.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = this.client[method].bind(this.client) as any;

    return fn(...args).catch((err: Error & { code?: string }) => {
      if (err.code !== "unauthorized") {
        throw err;
      }

      this.logger.info("Access token unauthorized, trying to refresh");
      // refresh and try again
      return this.refreshClient()
        .catch((err) => {
          this.logger.error("Unable to refresh LOKE tokens, err=", err.message);
          throw err;
        })
        .then((newClient) => {
          this.logger.info("Tokens refreshed, retrying call");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newFn = newClient[method].bind(newClient) as any;
          return newFn(...args);
        });
    });
  }

  listOrganizations(options?: ListOptions) {
    return this.proxyClientMethod("listOrganizations", options);
  }

  getOrganization(organizationId: string) {
    return this.proxyClientMethod("getOrganization", organizationId);
  }

  listLocations(
    organizationId: string,
    options?: ListOptions
  ): Promise<ListResponse<Location>> {
    return this.proxyClientMethod("listLocations", organizationId, options);
  }

  getLocation(
    organizationId: string,
    locationId: string
  ): Promise<Location | null> {
    return this.proxyClientMethod("getLocation", organizationId, locationId);
  }

  listCustomers(
    organizationId: string,
    query?: { email?: string },
    options?: ListOptions
  ): Promise<ListResponse<Customer>> {
    return this.proxyClientMethod(
      "listCustomers",
      organizationId,
      query,
      options
    );
  }

  getCustomer(
    organizationId: string,
    customerId: string
  ): Promise<Customer | null> {
    return this.proxyClientMethod("getCustomer", organizationId, customerId);
  }

  listCustomerLists(
    organizationId: string,
    options?: ListOptions
  ): Promise<ListResponse<List>> {
    return this.proxyClientMethod("listCustomerLists", organizationId, options);
  }

  listCustomerListMembers(
    organizationId: string,
    listId: string,
    options?: ListOptions
  ): Promise<ListResponse<ListMember>> {
    return this.proxyClientMethod(
      "listCustomerListMembers",
      organizationId,
      listId,
      options
    );
  }

  addCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void> {
    return this.proxyClientMethod(
      "addCustomerListMember",
      organizationId,
      listId,
      customerId
    );
  }

  removeCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void> {
    return this.proxyClientMethod(
      "removeCustomerListMember",
      organizationId,
      listId,
      customerId
    );
  }

  listWebhooks(organizationId: string): Promise<WebhookSubscription[]> {
    return this.proxyClientMethod("listWebhooks", organizationId);
  }

  subscribeWebhook(
    organizationId: string,
    webhookRef: string,
    subscription: WebhookSubscriptionRequest
  ): Promise<WebhookSubscription[]> {
    return this.proxyClientMethod(
      "subscribeWebhook",
      organizationId,
      webhookRef,
      subscription
    );
  }

  unsubscribeWebhook(
    organizationId: string,
    webhookRef: string
  ): Promise<void> {
    return this.proxyClientMethod(
      "unsubscribeWebhook",
      organizationId,
      webhookRef
    );
  }

  adjustCustomerPointsBalance(
    organizationId: string,
    customerId: string,
    reference: string,
    amount: number,
    notes: string
  ): Promise<string> {
    return this.proxyClientMethod(
      "adjustCustomerPointsBalance",
      organizationId,
      customerId,
      reference,
      amount,
      notes
    );
  }
}
