import { requireEnv } from "@/config/env";

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}
