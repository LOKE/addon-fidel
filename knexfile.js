/* eslint-disable */

const dbKit = require("@loke/db-kit");
const dbConnection = require("./db.connection");

module.exports = dbKit.knex.createConfig({
  connection: dbConnection,
  migrationsDirectory: "./src/postgres/migrations",
});
