exports.up = async (knex) => {
  await knex.schema.createTable("org_configs", (table) => {
    table.comment("Config for org");

    table
      .string("org_id")
      .notNullable()
      .comment("ID of the orgaization")
      .primary();
    table
      .float("points_for_dollar_spent")
      .notNullable()
      .comment("Points configuration per dollar spent")
      .default(1);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("org_configs");
};
