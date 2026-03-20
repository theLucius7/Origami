import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDatabaseUrl } from "@/config/db";

async function main() {
  const client = postgres(getDatabaseUrl(), { max: 1, prepare: false });

  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "./drizzle/pg" });
    console.log("Migration complete");
    process.exit(0);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
