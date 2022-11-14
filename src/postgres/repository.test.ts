/**
 * @jest-environment node
 */
import { beforeAll, afterAll, describe } from "@jest/globals";
import knexFactory, { Knex } from "knex";
import { randomBytes } from "crypto";

import { PostgresRepository } from "./repository";
import { standardRepoTests } from "../repo/test-helper";
import { name } from "../environment/config";

const dbConfig = require("../../knexfile.js");

export function createTestDb() {
  const schema = "test_" + randomBytes(6).toString("hex");
  const knex = knexFactory({
    ...dbConfig,
    // NOTE: we don't use DATABASE_URL here so we can't accidentally mess up the wrong DB
    connection: process.env.TEST_DATABASE_URL || {
      database: name + "-test",
    },
    searchPath: [schema, "public"],
  });
  return knex
    .raw("CREATE SCHEMA " + schema)
    .then(() => knex.migrate.latest())
    .then(() => ({
      knex,
      schema,
      // seed: seed.bind(null, knex, Promise),
      async cleanup() {
        await knex.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        return knex.destroy();
      },
    }));
}

describe("PostgresRepository", () => {
  let knex: Knex;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const testDb = await createTestDb();
    knex = testDb.knex;
    cleanup = testDb.cleanup;
  });

  afterEach(async () => {
    if (cleanup) await cleanup();
    if (knex) await knex.destroy();
  });

  async function setup() {
    const repository = new PostgresRepository(knex);
    return { repository };
  }

  async function teardown(/* setupResults: { repository: PostgresRepository } */) {
    // nothing to do, but we could create and destroy a test DB per test if suitable
  }

  standardRepoTests(setup, teardown);
});
