exports.up = async (knex) => {
  await knex.schema.createTable("transactions", (table) => {
    table.comment("Record of all transactions");
    table.string("transaction_id").notNullable().primary();
    table.string("loke_customer_id").notNullable();
    table.string("location_id").notNullable();
    table.string("card_id").notNullable();
    table.string("brand_id").notNullable();
    table.string("program_id").notNullable();
    table.string("loke_organization_id").notNullable();
    table.float("points_awarded").notNullable();
    table.float("amount").notNullable();
    table.string("created_at").notNullable();
    table.string("currency").notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("transactions");

};
