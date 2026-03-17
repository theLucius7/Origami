# 部署指南

本页说明 **Origami 生产环境部署** 的标准流程。

默认场景如下：

- 单实例
- 单 owner
- 公网访问
- Vercel + Turso + Cloudflare R2

如果你只是想先完成一套可上线的配置，请先阅读：

- [快速开始](/quick-start)

如果你要本地开发、调试或修改代码，请改看：

- [开发与调试](/development)

## 生产环境基线

推荐的生产部署组合：

- **运行时**：Vercel
- **数据库**：Turso / libSQL
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

TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

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
- **Authorization callback URL**：`https://mail.example.com/api/auth/github/callback`

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
2. [Turso 数据库详细配置](/turso)
3. [Cloudflare R2 / Bucket 详细配置](/r2-storage)
4. [GitHub Auth 详细配置](/github-auth)
5. [Gmail OAuth 详细配置](/gmail-oauth)
6. [Outlook OAuth 详细配置](/outlook-oauth)

开发、调试与本地运行说明请查看：

- [开发与调试](/development)
