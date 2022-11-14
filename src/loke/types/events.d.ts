import { CustomerStatistics, CustomerTiny, Customer, Currency } from ".";
import { OrganizationTiny, LocationTiny } from "./data";

export type EventName =
  | "customer.created"
  | "customer.updated"
  | "customer.updated-statistics"
  | "payment.completed"
  | "payment.refunded";

export interface CustomerCreatedEvent {
  event: "customer.created";
  organization: OrganizationTiny;
  customer: Customer;
}
export interface CustomerUpdatedEvent {
  event: "customer.updated";
  organization: OrganizationTiny;
  customer: Customer;
}
export interface CustomerUpdatedStatisticsEvent {
  event: "customer.updated-statistics";
  organization: OrganizationTiny;
  customer: CustomerTiny;
  statistics: CustomerStatistics;
}

export interface PaymentLineItem {
  id: string;
  amount: integer;
  label: string;
  quantity: integer;
  type: string;
}

export interface Payment {
  id: string; //	Payment ID
  locationId: string; //	(optional)
  refId: string; //	(optional)
  completedAt: string; //	When the payment was completed
  refundedAt: string; //	(optional) When the payment was refunded
  billingType: string; //
  chargedAmount: integer; //	Portion covered by credit cart
  creditAmount: integer; //	Portion covered by customer credit
  currency: Currency; //
  discountAmount: integer; //	Portion discounted by user promotion
  feeAmount: integer; //
  payoutAmount: integer; //
  state: string; //
  tipAmount: integer; //
  total: integer; //	Total amount covered by payment
  customer: CustomerTiny; // (optional)
  items: PaymentLineItem[];
}
export interface PaymentCompletedEvent {
  event: "payment.completed";
  organization: OrganizationTiny;
  location: LocationTiny;
  payment: Payment;
}
export interface PaymentRefundedEvent {
  event: "payment.refunded";
  organization: OrganizationTiny;
  location: LocationTiny;
  payment: Payment;
}

export type EventDetails =
  | CustomerCreatedEvent
  | CustomerUpdatedEvent
  | CustomerUpdatedStatisticsEvent
  | PaymentCompletedEvent
  | PaymentRefundedEvent;
