// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name } = require("./package.json");

module.exports = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NO_DATABASE_SSL === "true"
          ? false
          : { rejectUnauthorized: false },
    }
  : { database: name };
