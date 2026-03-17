import { requireEnv } from "@/config/env";

export function getR2Config() {
  return {
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    bucketName: requireEnv("R2_BUCKET_NAME"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  };
}
