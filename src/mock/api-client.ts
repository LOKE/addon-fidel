import { ulid } from "ulid";
import {
  ApiClient,
  Customer,
  List,
  ListMember,
  ListOptions,
  ListResponse,
  Location,
  Organization,
  WebhookSubscription,
  WebhookSubscriptionRequest,
} from "../loke/types";

export class MockApiClient implements ApiClient {
  customerLists: Record<string, Record<string, List>> = {};
  customerListMembers: Record<string, Record<string, ListMember>> = {};

  listOrganizations(
    options?: ListOptions | undefined
  ): Promise<ListResponse<Organization>> {
    throw new Error("Method not implemented.");
  }
  getOrganization(organizationId: string): Promise<Organization | null> {
    throw new Error("Method not implemented.");
  }
  listLocations(
    organizationId: string,
    options?: ListOptions | undefined
  ): Promise<ListResponse<Location>> {
    throw new Error("Method not implemented.");
  }
  getLocation(
    organizationId: string,
    locationId: string
  ): Promise<Location | null> {
    throw new Error("Method not implemented.");
  }
  listCustomers(
    organizationId: string,
    query?: { email?: string },
    options?: ListOptions | undefined
  ): Promise<ListResponse<Customer>> {
    throw new Error("Method not implemented.");
  }
  getCustomer(organizationId: string, customerId: string): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async listCustomerLists(
    organizationId: string,
    options?: ListOptions | undefined
  ): Promise<ListResponse<List>> {
    return {
      items: Object.values(this.customerLists[organizationId]),
    };
  }

  async listCustomerListMembers(
    organizationId: string,
    listId: string,
    options?: ListOptions | undefined
  ): Promise<ListResponse<ListMember>> {
    return { items: Object.values(this.customerListMembers[listId]) };
  }

  async removeCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void> {
    const list = this.customerListMembers[listId];
    if (list) delete list[customerId];
  }

  async addCustomerListMember(
    organizationId: string,
    listId: string,
    customerId: string
  ): Promise<void> {
    if (!this.customerListMembers[listId])
      this.customerListMembers[listId] = {};

    this.customerListMembers[listId][customerId] = {
      id: customerId,
      addedAt: new Date().toISOString(),
      firstName: "First" + customerId,
      lastName: "Last" + customerId,
      email: customerId + "@example.com",
      phoneNumber: null,
    };
  }

  listWebhooks(organizationId: string): Promise<WebhookSubscription[]> {
    throw new Error("Method not implemented.");
  }

  subscribeWebhook(
    organizationId: string,
    webhookRef: string,
    subscription: WebhookSubscriptionRequest
  ): Promise<WebhookSubscription[]> {
    throw new Error("Method not implemented.");
  }
  unsubscribeWebhook(
    organizationId: string,
    webhookRef: string
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  adjustCustomerPointsBalance(
    organizationId: string,
    customerId: string,
    reference: string,
    amount: number,
    notes: string
  ): Promise<string> {
    throw new Error("Method not implemented");
  }
}
