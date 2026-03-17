export const DEFAULT_OAUTH_APP_ID = "default";
export type OAuthProviderKind = "gmail" | "outlook";

export interface OAuthAppOption {
  id: string;
  provider: OAuthProviderKind;
  label: string;
  source: "env" | "db";
  tenant?: string | null;
  clientId?: string | null;
}
