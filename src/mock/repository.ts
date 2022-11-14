import { ulid } from "ulid";

import {
  Brand,
  LokeAuthAttempt,
  OrgConfig,
  Repository,
  Transaction,
} from "../repo/types";

export class MockRepository implements Repository {
  transactions: Record<string, Transaction> = {};
  orgConfigs: Record<string, { pointsForDollarSpent: number; orgId: string }> =
    {};
  authAttempts: Record<string, LokeAuthAttempt> = {};

  // -- OrgConfig --
  async getConfig(
    orgId: string
  ): Promise<{ pointsForDollarSpent: number; orgId: string } | null> {
    return this.orgConfigs[orgId] || null;
  }

  async setConfig(orgId: string, config: OrgConfig): Promise<void> {
    this.orgConfigs[orgId] = { ...config, orgId };
  }

  async clearConfig(orgId: string): Promise<void> {
    delete this.orgConfigs[orgId];
  }

  async createLokeAuthAttempt(
    details: Pick<LokeAuthAttempt, "state" | "codeVerifier">
  ): Promise<LokeAuthAttempt> {
    const attempt: LokeAuthAttempt = {
      ...details,
      id: ulid(),
      created: new Date(),
    };
    this.authAttempts[details.state] = attempt;
    return attempt;
  }

  async getLokeAuthAttemptByState(
    state: string
  ): Promise<LokeAuthAttempt | null> {
    return this.authAttempts[state] || null;
  }

  async destroy(): Promise<void> {
    // no-op
  }

  linkBrandToOrganization(orgId: string, brand: Brand): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getOrganization(
    orgId: string
  ): Promise<{ orgId: string; brand: Brand } | null> {
    throw new Error("Method not implemented.");
  }

  // -- Transactions --
  async createTransaction(
    transaction: Transaction
  ): Promise<{ transaction: Transaction }> {
    this.transactions[transaction.transactionId] = transaction;
    return { transaction };
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return this.transactions[transactionId] || null;
  }

  async getTransactions(orgId: string): Promise<Transaction[]> {
    return Object.values(this.transactions);
  }
}
