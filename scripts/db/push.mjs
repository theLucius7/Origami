import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "../../src/lib/db/schema.ts";

const dbUrl = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");

if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = postgres(dbUrl, { max: 1, prepare: false });
const db = drizzle(client, { schema });

async function main() {
  try {
    const result = await pushSchema(schema, db);

    if (result.warnings.length > 0) {
      console.error("Drizzle push has warnings:");
      for (const warning of result.warnings) {
        console.error(warning);
      }
      process.exit(1);
    }

    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            hasDataLoss: result.hasDataLoss,
            statementsToExecute: result.statementsToExecute,
          },
          null,
          2
        )
      );
      return;
    }

    if (result.statementsToExecute.length > 0) {
      await result.apply();
      console.log(`Applied ${result.statementsToExecute.length} schema statement(s).`);
    } else {
      console.log("No schema changes to apply.");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
