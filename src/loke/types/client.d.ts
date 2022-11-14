import { TokenSet } from "openid-client";
import { EventName } from ".";
import { Organization, Location, UrlString } from "./data";
import { EventDetails } from "./events";

export interface Logger {
  debug(...params: any[]): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  info(...params: any[]): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  warn(...params: any[]): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  error(...params: any[]): void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface ListOptions {
  autoPage?: boolean;
  after?: string;
}

export interface HttpError {
  statusMessage: string;
  statusCode: number;
  headers: Record<string, string>;
  body:
    | string
    | {
        message: string;
        type: string;
        instance: string;
        documentation: string;
      };
  url: string;
  method: string;
}

export type SyncOrAsync<T> = T | Promise<T>;

export type ListResponse<TItem> = { items: Array<TItem>; cursor?: string };

export interface ApiClientOptions {
  baseUrl?: string;
  accessToken: string;
}

export interface WebhookSubscription {
  events: EventDetails[];
  ref: string;
  url: UrlString;
}

export interface WebhookSubscriptionRequest {
  events: EventName[];
  secret: string;
  url: UrlString;
}

export interface ApiClient {
  listOrganizations(options?: ListOptions): Promise<ListResponse<Organization>>;

  getOrganization(organizationId: string): Promise<Organization | null>;

  listLocations(
    organizationId: string,
    options?: ListOptions
  ): Promise<ListResponse<Location>>;

  getLocation(
    organizationId: string,
    locationId: string
  ): Promise<Location | null>;

  listCustomers(
    organizationId: string,
    query?: { email?: string },
    options?: ListOptions
  ): Promise<ListResponse<Customer>>;

  getCustomer(
    organizationId: string,
    customerId: string
  ): Promise<Customer | null>;

  listCustomerLists(
    organizationId: string,
    options?: ListOptions
  ): Promise<ListResponse<List>>;

  listCustomerListMembers(
    organizationId: string,
    listId: string,
    options?: ListOptions
  ): Promise<ListResponse<ListMember>>;

  removeCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void>;

  addCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void>;

  listWebhooks(organizationId: string): Promise<WebhookSubscription[]>;

  subscribeWebhook(
    organizationId: string,
    webhookRef: string,
    subscription: WebhookSubscriptionRequest
  ): Promise<WebhookSubscription[]>;

  unsubscribeWebhook(organizationId: string, webhookRef: string): Promise<void>;

  adjustCustomerPointsBalance(
    organizationId: string,
    customerId: string,
    reference: string,
    amount: number,
    notes: string
  ): Promise<string>;
}

export interface ApiClientFactory {
  /** Gets a client for a user given their access token */
  asUser(accessToken: string): ApiClient;
  /** Gets a client for a this client (ID and secret) */
  asClient(): Promise<ApiClient>;
}

export type TokenRefresher = () => Promise<TokenSet>;
