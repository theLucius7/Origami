import Link from "next/link";
import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasGitHubOAuthConfig } from "@/lib/secrets";
import { getRequestLocale } from "@/i18n/locale.server";
import { getMessages } from "@/i18n/messages";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const messages = getMessages(locale);
  const githubEnabled = hasGitHubOAuthConfig();
  const error = params.error
    ? messages.login.errors[params.error as keyof typeof messages.login.errors] ?? messages.login.errors.fallback
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
            <Button asChild className="w-full">
              <Link href="/api/auth/github/start">
                <Github className="h-4 w-4" />
                {messages.login.continueWithGitHub}
              </Link>
            </Button>
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
