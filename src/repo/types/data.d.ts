export interface LokeAuthAttempt {
  id: string;
  state: string;
  codeVerifier: string;
  /** Timestamp */
  created: Date;
}

export interface OrgConfig {
  orgId: string;
  pointsForDollarSpent: number;
}

export interface Transaction {
  transactionId: string;
  locationId: string;
  cardId: string;
  brandId: string;
  programId: string;
  lokeOrganizationId: string;
  lokeCustomerId: string;
  pointsAwarded: number;
  amount: number;
  createdAt: string;
  currency: string;
}

export interface Brand {
  id: string;
  name: string;
  websiteURL: string | null;
}
