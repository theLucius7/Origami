# 部署指南

本页说明 **Origami 生产环境部署** 的标准流程。

默认场景如下：

- 单实例
- 单 owner
- 公网访问
- Vercel + Neon + Cloudflare R2

如果你只是想先完成一套可上线的配置，请先阅读：

- [快速开始](/quick-start)

如果你要本地开发、调试或修改代码，请改看：

- [开发与调试](/development)

## 这页适合谁

这页更适合下面这些人：

- 已经准备正式上线，不想只看“最短路径”
- 想在真正部署前，把关键配置点一次性看清楚
- 害怕 OAuth callback、环境变量、对象存储这些地方漏一项就卡住
- 想知道“为什么这样配”，而不只是照着命令跑

## 部署顺序总览

建议按这个顺序推进：

1. 先确定最终生产域名
2. 再准备 Neon / R2 / GitHub OAuth / Gmail OAuth / Outlook OAuth
3. 然后填写环境变量并执行 `npm run db:setup`
4. 再把项目部署到 Vercel
5. 最后完成首次登录、初始化、账号接入与上线检查

## 生产环境基线

推荐的生产部署组合：

- **运行时**：Vercel
- **数据库**：Neon / PostgreSQL
- **对象存储**：Cloudflare R2
- **登录方式**：GitHub OAuth App
- **邮箱接入**：Gmail OAuth、Outlook OAuth、IMAP/SMTP

## 生产域名要求

在开始部署前，先确定最终生产域名，例如：

```txt
https://mail.example.com
```

该域名会同时用于：

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth callback
- Outlook OAuth callback

**这四处必须保持一致。**

## 环境变量

### 必填变量

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 变量分组速览

如果你想更快检查自己有没有漏项，可以按下面理解：

- **应用基础**：`NEXT_PUBLIC_APP_URL`、`ENCRYPTION_KEY`、`AUTH_SECRET`
- **登录控制**：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_ALLOWED_LOGIN`
- **数据库**：`DATABASE_URL`
- **附件存储**：`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- **定时任务**：`CRON_SECRET`
- **默认邮箱 OAuth app（可选）**：`GMAIL_CLIENT_ID`、`GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID`、`OUTLOOK_CLIENT_SECRET`

### 可选变量

如果你要直接使用默认 OAuth app，再补充：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

如果你不填写这四项，仍然可以在应用内通过 `/accounts` 创建数据库托管的 OAuth app。

## 生产 OAuth 配置要求

### GitHub OAuth App

GitHub OAuth App 需要配置为：

- **Homepage URL**：`https://mail.example.com`
- **Authorization callback URL**：`https://mail.example.com/api/better-auth/callback/github`

建议同时设置：

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

这样可以避免其他用户先占用 owner 绑定。

### Gmail OAuth

Google OAuth 的 redirect URI 应为：

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook OAuth

Microsoft OAuth 的 redirect URI 应为：

```txt
https://mail.example.com/api/oauth/outlook
```

如需逐步点击式说明，请分别查看：

- [GitHub Auth 详细配置](/github-auth)
- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)

## 数据库初始化

对于全新生产数据库，执行：

```bash
npm install
npm run db:setup
```

说明：

- `db:setup` 适用于新环境
- `db:migrate` 仅用于需要回放历史 migration 的场景
- `db:push` 只适合你明确知道自己在做什么时使用

## Vercel 部署流程

推荐按以下顺序执行：

1. 将仓库导入 Vercel
2. 配置生产环境变量
3. 绑定生产域名
4. 部署应用
5. 访问生产地址并完成首次登录

在 Vercel 中至少确认以下配置无误：

- Production 环境变量已完整填写
- `NEXT_PUBLIC_APP_URL` 使用正式域名
- 所有 OAuth 回调地址都已同步更新
- 项目构建使用正确分支

## 最容易踩坑的 6 个点

1. **正式域名还没定，就先去配 OAuth 平台**  
   这会导致后面一改域名，GitHub / Google / Microsoft 全都要返工。
2. **`NEXT_PUBLIC_APP_URL`、浏览器访问地址、各平台 callback 不一致**  
   这是最常见的授权失败原因。
3. **把预览环境或临时域名当成正式域名使用**  
   预览环境适合测试，不适合当长期生产 callback。
4. **全新数据库没有优先执行 `db:setup`**  
   新环境建议从 `npm run db:setup` 开始，而不是直接 `db:migrate` 或 `db:push`。
5. **R2 的 bucket / endpoint / key 不是同一套配置**  
   这类错误往往要到上传附件时才会暴露。
6. **部署后没有立即做完整链路检查**  
   至少走一遍登录、初始化、账号接入、同步、发信和附件上传。

## 定时同步

`vercel.json` 已定义同步任务入口：

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

请求头需要携带：

```http
Authorization: Bearer <CRON_SECRET>
```

生产环境建议显式设置 `CRON_SECRET`。不要依赖自动派生值，以免调度侧与服务侧配置不一致。

## 首次上线流程

部署完成后，使用正式域名访问 Origami，并按以下顺序完成初始化：

1. 使用 GitHub 登录
2. 完成 `/setup`
3. 打开 `/accounts`
4. 添加 Gmail、Outlook 或 IMAP/SMTP 账号
5. 执行首次同步
6. 验证发信与附件能力

## 生产检查清单

上线前建议逐项确认：

- 正式域名可正常访问
- GitHub 登录成功后可进入 `/setup` 或首页
- `/accounts` 页面正常加载
- Gmail OAuth 授权与回跳正常
- Outlook OAuth 授权与回跳正常
- IMAP/SMTP 账号添加正常
- 同步任务正常执行
- 附件上传与下载正常
- 发信功能正常
- 定时同步可正常调用 `/api/cron/sync`

## 上线后第一天建议立刻做的事

1. 用 owner 账号完整登录一次，确认 GitHub session 正常
2. 在 `/accounts` 至少接入一个真实邮箱账号
3. 手动跑一轮同步，确认收件正常
4. 发送一封测试邮件，确认发信链路正常
5. 上传并下载一个附件，确认 R2 链路正常
6. 观察一次定时同步是否成功命中 `/api/cron/sync`

## 发布前校验

建议在发布前执行：

```bash
npm run verify
```

该命令会覆盖：

- lint
- typecheck
- tests
- app build
- docs build

## 升级建议

如果你正在升级既有实例：

- 保留现有 migration 链
- 新环境优先使用 `db:setup`
- 更换 OAuth app 后，按账号重新授权
- 域名变更后，务必同步更新所有 callback 与环境变量

## 相关文档

按生产部署顺序，建议继续阅读：

1. [快速开始](/quick-start)
2. [Neon PostgreSQL 详细配置](/neon)
3. [Cloudflare R2 / Bucket 详细配置](/r2-storage)
4. [GitHub Auth 详细配置](/github-auth)
5. [Gmail OAuth 详细配置](/gmail-oauth)
6. [Outlook OAuth 详细配置](/outlook-oauth)

开发、调试与本地运行说明请查看：

- [开发与调试](/development)
