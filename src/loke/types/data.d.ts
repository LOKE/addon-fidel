// NOTE: some of these types are reproduced in /types/loke
// For now I think it is OK to have them in both places, but maybe just re-export them from here
// The reason this folder should control the types is that we will want to *make this into a separate module*

// --- PRIMITIVES ---

/** eg: "2012-08-08T02:35:21Z" */
export type DateString = string;
export type UrlString = string;
export type Currency = "AUD" | "GBP" | "NZD" | "SGD";

// --- ORG & LOCATION ---

export interface Organization {
  id: string;
  name: string;
  currency: Currency | null;
  timezone: string | null;
  created: DateString;
}

export interface Location {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  country?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  slug?: string;
  streetAddress?: string;
  streetAddress2?: string;
  timezone?: string;
}

export interface OrganizationTiny {
  id: string;
  name: string;
}

export interface LocationTiny {
  id: string;
  name: string;
}

export interface CustomerTiny {
  /** Unique ID of the Customer */
  id: string;
  /** The Customers email address */
  email: string;
  /** Customer first name or given name */
  firstName: string;
  /** Customer last name or surname */
  lastName: string;
  /** The Customers mobile phone number */
  phoneNumber: string;
}

export interface CustomerStatistics {
  lastPointsEarned: string; //	Date and time of last points earned by the Customer
  lastPointsRedeemed: string; //	Date and time of last redeemed points by the Customer
  lastSpend: string; //	The date of the Customers last spend
  pointsBalance: integer; //	The Customers current points balance
  totalPointsEarned: integer; //	The total points earned over the Customers lifetime
  totalPointsRedeemed: integer; //	Total points earned over lifetime of the Customer
  totalSpend: integer; //	The total spend amount of the Customer, in the lowest common denominator e.g. cents
}

export interface Customer extends CustomerTiny {
  /** Unique ID of the Customer */
  id: string;
  /** The Customers email address */
  email: string;
  /** Customer first name or given name */
  firstName: string;
  /** Customer last name or surname */
  lastName: string;
  /** The Customers mobile phone number */
  phoneNumber: string;
  /** The Customers date of birth in YYYY-MM-DD format */
  dob?: string;
  gender?: string;
  hasAgreedToMarketing: boolean;
  createdAt: DateString;
  updatedAt: DateString;
  // statistics: CustomerStatistics;
}

export interface List {
  id: string;
  createdAt: DateString;
  memberCount: number;
  name: string;
}

export interface ListMember {
  id: string;
  addedAt: DateString;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

export interface Payment {
  /** (optional) Payment ID */
  id?: string;
  locationId?: string;
  refId?: string;
  /** (optional) When the payment was completed */
  completedAt?: DateString;
  /** (optional) When the payment was refunded */
  refundedAt?: string;
  /** integer	Portion covered by credit cart */
  chargedAmount: number;
  /** integer	Portion covered by customer credit */
  creditAmount: number;
  currency?: Currency;
  discount?: string;
  /** integer	Portion discounted by user promotion */
  discountAmount: number;
  /** integer */
  feeAmount: number;
  /** integer */
  payoutAmount: number;
  /** integer */
  deliveryAmount?: number;
  state?: string;
  /** integer */
  tipAmount: number;
  /** integer	Total amount covered by payment */
  total: number;
}
