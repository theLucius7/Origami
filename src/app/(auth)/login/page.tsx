import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasGitHubOAuthConfig } from "@/lib/secrets";
import { getRequestLocale } from "@/i18n/locale.server";
import { getMessages } from "@/i18n/messages";

function mapLoginError(rawError?: string | null, rawState?: string | null): string | null {
  const normalized = rawError?.trim() || rawState?.trim() || null;
  if (!normalized) return null;

  switch (normalized) {
    case "github_state":
    case "state_not_found":
    case "invalid_callback_request":
      return "github_state";
    case "github_not_allowed":
    case "github_not_owner":
    case "github_callback":
      return normalized;
    default:
      return "github_callback";
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; state?: string }>;
}) {
  const [params, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const messages = getMessages(locale);
  const githubEnabled = hasGitHubOAuthConfig();
  const errorKey = mapLoginError(params.error, params.state);
  const error = errorKey
    ? messages.login.errors[errorKey as keyof typeof messages.login.errors] ?? messages.login.errors.fallback
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{messages.common.brandName}</CardTitle>
          <CardDescription>{messages.login.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {githubEnabled ? (
            <form action="/api/better-auth/sign-in/social" method="post" className="w-full">
              <input type="hidden" name="provider" value="github" />
              <input type="hidden" name="callbackURL" value="/" />
              <input type="hidden" name="errorCallbackURL" value="/login" />
              <Button type="submit" className="w-full">
                <Github className="h-4 w-4" />
                {messages.login.continueWithGitHub}
              </Button>
            </form>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {messages.login.missingConfig}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {messages.login.ownerNotice}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
