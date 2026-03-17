import Link from "next/link";
import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasGitHubOAuthConfig } from "@/lib/secrets";

const errorMessages: Record<string, string> = {
  github_state: "GitHub 登录状态校验失败，请重试。",
  github_not_allowed: "这个 GitHub 账号不在允许名单内。",
  github_not_owner: "这个 GitHub 账号不是当前实例 owner。",
  github_callback: "GitHub 登录失败，请稍后重试。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const githubEnabled = hasGitHubOAuthConfig();
  const error = params.error ? errorMessages[params.error] ?? "登录失败，请重试。" : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Origami</CardTitle>
          <CardDescription>
            单用户实例推荐直接使用 GitHub 登录。首次进入时，首个 owner 会完成实例绑定与初始化。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {githubEnabled ? (
            <Button asChild className="w-full">
              <Link href="/api/auth/github/start">
                <Github className="h-4 w-4" />
                使用 GitHub 登录
              </Link>
            </Button>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              当前还没有配置 GitHub OAuth。请先设置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 和 `NEXT_PUBLIC_APP_URL`。
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            这是单 owner 实例：登录依赖 GitHub OAuth，邮箱账号的 Gmail / Outlook OAuth 仅用于接入邮箱本身，和应用登录是分开的。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
