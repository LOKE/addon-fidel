import { start } from "./server";

start().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
