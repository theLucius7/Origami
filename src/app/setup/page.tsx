import { redirect } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSetupStatus } from "@/lib/setup";
import { readSessionFromCookies } from "@/lib/session";

function StatusItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
      <span>{label}</span>
    </li>
  );
}

export default async function SetupPage() {
  const session = await readSessionFromCookies();
  if (!session) redirect("/login");

  const status = await getSetupStatus();
  if (status.isSetupComplete) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>首次初始化</CardTitle>
          <CardDescription>
            当前实例已绑定到 GitHub 用户 <strong>@{session.githubLogin}</strong>。确认基础环境后，即可进入 Origami 主界面继续添加邮箱账号。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-sm font-medium">环境检查</h2>
            <ul className="space-y-2">
              <StatusItem ok={status.checks.githubOAuthConfigured} label="GitHub OAuth 已配置" />
              <StatusItem ok={status.checks.databaseConfigured} label="数据库连接信息已配置" />
              <StatusItem ok={status.checks.encryptionConfigured} label="ENCRYPTION_KEY 已配置" />
              <StatusItem ok={status.checks.r2Configured} label="R2 对象存储已配置" />
            </ul>
          </div>

          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            下一步建议：进入主界面后先前往 <code>/accounts</code>，添加你的第一个 Gmail / Outlook / IMAP/SMTP 账号；如果你想把 GitHub 登录之外的环境变量再减到更少，我们可以继续把 cron secret 和 setup 流程再自动化。
          </div>

          <form action="/api/auth/setup/complete" method="post">
            <Button type="submit">完成初始化并进入 Origami</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
