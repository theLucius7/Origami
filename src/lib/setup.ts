import { getInstallation } from "@/lib/queries/installation";
import { hasGitHubOAuthConfig } from "@/lib/secrets";

function hasRequiredValue(value?: string | null) {
  return Boolean(value?.trim());
}

export async function getSetupStatus() {
  const installation = await getInstallation();

  return {
    installation,
    checks: {
      githubOAuthConfigured: hasGitHubOAuthConfig(),
      databaseConfigured: hasRequiredValue(process.env.TURSO_DATABASE_URL),
      encryptionConfigured: hasRequiredValue(process.env.ENCRYPTION_KEY),
      r2Configured: [
        process.env.R2_ACCESS_KEY_ID,
        process.env.R2_SECRET_ACCESS_KEY,
        process.env.R2_BUCKET_NAME,
        process.env.R2_ENDPOINT,
      ].every(hasRequiredValue),
    },
    isClaimed: Boolean(installation),
    isSetupComplete: Boolean(installation?.setupCompletedAt),
  };
}
