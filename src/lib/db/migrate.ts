import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDatabaseConfig } from "@/config/db";

async function main() {
  const client = createClient(getDatabaseConfig());
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migration complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
