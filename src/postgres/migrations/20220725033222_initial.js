/* eslint-env node */

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async (knex) => {
  await knex.schema.createTable("auth_attempts", function (table) {
    table.comment("Authentication attempts against the LOKE API");
    table
      .string("state")
      .notNullable()
      .primary()
      .comment("State field for the OAuth attempt");
    table
      .string("code_verifier")
      .notNullable()
      .comment("Code verifier for the OAuth attempt");
    table
      .timestamp("created", { useTz: false })
      .defaultTo(knex.fn.now())
      .notNullable();
  });

  await knex.schema.createTable("organizations", (table) => {
    table.comment("List of enabled organizations");
    table
      .string("org_id")
      .notNullable()
      .comment("ID of the organization")
      .primary();
    table.string("brand_id").comment("Brand ID linked to the organization");
    table.string("brand_name").comment("Brand name linked to the organization");
    table.string("brand_url").comment("Brand URL linked to the organization");
  });
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async (knex) => {
  await knex.schema.dropTable("organizations");
  await knex.schema.dropTable("auth_attempts");
};
