import { Brand, LokeAuthAttempt, OrgConfig, Streak, Transaction } from "./data";

export interface Repository {
  /**
   * Creates a new LOKE auth attempt
   */
  createLokeAuthAttempt(
    details: Pick<LokeAuthAttempt, "state" | "codeVerifier">
  ): Promise<LokeAuthAttempt>;

  /**
   * Fetches an existing LOKE auth attempt
   */
  getLokeAuthAttemptByState(state: string): Promise<LokeAuthAttempt | null>;

  getConfig(orgId: string): Promise<OrgConfig | null>;
  setConfig(orgId: string, config: OrgConfig): Promise<void>;
  clearConfig(orgId: string): Promise<void>;

  /**
   * Terminate any connections. Call when no longer needed.
   */
  destroy(): Promise<void>;

  linkBrandToOrganization(orgId: string, brand: Brand): Promise<boolean>;
  getOrganization(
    orgId: string
  ): Promise<{ orgId: string; brand: Brand } | null>;
  createTransaction(
    transaciton: Transaction
  ): Promise<{ transaction: Transaction }>;

  getTransactions(orgId: string): Promise<Transaction[]>;

  getTransactionById(transactionId: string): Promise<Transaction | null>;
}
