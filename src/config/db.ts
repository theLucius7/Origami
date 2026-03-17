import { requireEnv } from "@/config/env";

export function getDatabaseConfig() {
  return {
    url: requireEnv("TURSO_DATABASE_URL"),
    authToken: process.env.TURSO_AUTH_TOKEN,
  };
}
