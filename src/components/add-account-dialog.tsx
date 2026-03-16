"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { addQQAccount } from "@/actions/account";
import { getGmailOAuthUrl, getOutlookOAuthUrl } from "@/actions/oauth";

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [qqEmail, setQQEmail] = useState("");
  const [qqAuthCode, setQQAuthCode] = useState("");
  const [qqName, setQQName] = useState("");
  const [initialFetchLimit, setInitialFetchLimit] = useState("200");
  const [isPending, startTransition] = useTransition();

  function handleAddQQ(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await addQQAccount(
        qqEmail,
        qqAuthCode,
        qqName || undefined,
        Number(initialFetchLimit)
      );
      setQQEmail("");
      setQQAuthCode("");
      setQQName("");
      setInitialFetchLimit("200");
      setOpen(false);
    });
  }

  function handleGmailAuth() {
    startTransition(async () => {
      const url = await getGmailOAuthUrl();
      window.location.href = url;
    });
  }

  function handleOutlookAuth() {
    startTransition(async () => {
      const url = await getOutlookOAuthUrl();
      window.location.href = url;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        添加邮箱
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加邮箱账号</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="gmail">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gmail">Gmail</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
            <TabsTrigger value="qq">QQ 邮箱</TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              点击下方按钮将跳转到 Google 授权页面，授权后自动返回。首次同步默认抓取最近 200 封，可在账号管理页修改。
            </p>
            <Button
              className="w-full"
              onClick={handleGmailAuth}
              disabled={isPending}
            >
              {isPending ? "跳转中..." : "使用 Google 账号授权"}
            </Button>
          </TabsContent>

          <TabsContent value="outlook" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              点击下方按钮将跳转到 Microsoft 授权页面，授权后自动返回。首次同步默认抓取最近 200 封，可在账号管理页修改。
            </p>
            <Button
              className="w-full"
              onClick={handleOutlookAuth}
              disabled={isPending}
            >
              {isPending ? "跳转中..." : "使用 Microsoft 账号授权"}
            </Button>
          </TabsContent>

          <TabsContent value="qq" className="pt-4">
            <form onSubmit={handleAddQQ} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qq-email">QQ 邮箱地址</Label>
                <Input
                  id="qq-email"
                  type="email"
                  placeholder="example@qq.com"
                  value={qqEmail}
                  onChange={(e) => setQQEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qq-auth-code">授权码</Label>
                <Input
                  id="qq-auth-code"
                  type="password"
                  placeholder="在 QQ 邮箱设置中生成授权码"
                  value={qqAuthCode}
                  onChange={(e) => setQQAuthCode(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  QQ 邮箱 → 设置 → 账户 → POP3/IMAP/SMTP 服务 → 生成授权码
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qq-name">显示名称 (可选)</Label>
                <Input
                  id="qq-name"
                  placeholder="用于侧边栏显示"
                  value={qqName}
                  onChange={(e) => setQQName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-fetch-limit">首次同步抓取范围</Label>
                <select
                  id="initial-fetch-limit"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={initialFetchLimit}
                  onChange={(event) => setInitialFetchLimit(event.target.value)}
                >
                  <option value="50">50 封</option>
                  <option value="200">200 封</option>
                  <option value="1000">1000 封</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "添加中..." : "添加 QQ 邮箱"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
