import { Knex } from "knex";
import { camelizeKeys, decamelizeKeys } from "humps";
import { ulid } from "ulid";
import {
  Brand,
  LokeAuthAttempt,
  OrgConfig,
  Repository,
  Transaction,
} from "../repo/types";

function camelizeDatabaseRowOrNull<T>(row: object): T | null {
  if (!row) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return camelizeKeys(row) as any;
}

function camelizeDatabaseRow<T>(row: object): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return camelizeKeys(row) as any;
}

// function camelizeDatabaseRowOrThrow<T>(row: object | undefined): T {
//   if (!row) throw new Error("Not found.");
//   return camelizeKeys(row) as any;
// }

function camelizeFirstRowOrNull<T>(rows: object[]): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return camelizeKeys(rows[0]) as any;
}

function camelizeFirstRowOrThrow<T>(rows: object[]): T {
  if (!rows.length) throw new Error("Not found.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return camelizeKeys(rows[0]) as any;
}

function camelizeRows<T>(rows: object[]): T[] {
  return rows.map((row: object) => camelizeDatabaseRow<T>(row));
}

export class PostgresRepository implements Repository {
  constructor(private knex: Knex) {}

  async destroy(): Promise<void> {
    await this.knex.destroy();
  }

  // -- OrgConfig --

  async getConfig(orgId: string): Promise<OrgConfig | null> {
    const result = await this.knex("org_configs")
      .select("*")
      .where({ orgId })
      .first();

    return camelizeDatabaseRowOrNull(result);
  }

  async setConfig(orgId: string, config: OrgConfig): Promise<void> {
    await this.knex("org_configs")
      .insert(
        decamelizeKeys({
          ...config,
          orgId,
        })
      )
      .onConflict("org_id")
      .merge();
  }

  async clearConfig(orgId: string): Promise<void> {
    await this.knex("org_configs").where({ orgId }).delete();
  }

  // -- LokeAuthAttempt --

  async createLokeAuthAttempt(
    details: Pick<LokeAuthAttempt, "state" | "codeVerifier">
  ): Promise<LokeAuthAttempt> {
    const result = await this.knex("auth_attempts")
      .insert(decamelizeKeys(details))
      .returning("*");

    return camelizeDatabaseRow(result[0]);
  }

  async getLokeAuthAttemptByState(
    state: string
  ): Promise<LokeAuthAttempt | null> {
    const row = await this.knex("auth_attempts").where({ state }).first();
    return camelizeDatabaseRowOrNull(row);
  }

  async linkBrandToOrganization(orgId: string, brand: Brand): Promise<boolean> {
    const row = await this.knex("organizations")
      .insert({
        org_id: orgId,
        brand_id: brand.id,
        brand_name: brand.name,
        brand_url: brand.websiteURL ?? "",
      })
      .returning("*");

    return Boolean(row);
  }

  async getOrganization(
    orgId: string
  ): Promise<{ orgId: string; brand: Brand } | null> {
    const row = await this.knex("organizations")
      .where({ org_id: orgId })
      .first();

    if (!row) return null;
    return {
      orgId: row.orgId,
      brand: {
        id: row.brandId,
        name: row.brandName,
        websiteURL: row.brandUrl,
      },
    };
  }

  async createTransaction(
    transaction: Transaction
  ): Promise<{ transaction: Transaction }> {
    const row = await this.knex("transactions")
      .insert(decamelizeKeys(transaction))
      .returning("*");

    console.log({ row });
    return { transaction };
  }

  async getTransactions(orgId: string): Promise<Transaction[]> {
    const rows = await this.knex("transactions")
      .where({ loke_organization_id: orgId })
      .returning("*");

    return camelizeRows(rows);
  }

  async getTransactionById(transacitonId: string): Promise<Transaction | null> {
    const row = await this.knex("transactions")
      .where({ transaciton_id: transacitonId })
      .first();

    return camelizeDatabaseRowOrNull(row);
  }
}
