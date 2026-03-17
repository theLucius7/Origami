# 快速开始

本页只说明 **生产环境部署的最短可用路径**。

如果你的目标是本地开发、调试、修改代码或验证 OAuth 回调，请不要沿用本页流程，直接查看：

- [开发与调试](/development)

## 推荐部署方案

Origami 当前最稳定的生产组合是：

- **应用运行时**：Vercel
- **数据库**：Turso / libSQL
- **附件存储**：Cloudflare R2
- **登录**：GitHub OAuth App
- **邮箱接入**：Gmail OAuth、Outlook OAuth、IMAP/SMTP

## 部署前准备

开始之前，请先准备以下资源：

- 一个生产域名，例如 `mail.example.com`
- 一个 Turso 数据库
- 一个 Cloudflare R2 bucket
- 一个 GitHub OAuth App（用于登录 Origami）
- 如需接入 Gmail 或 Outlook，对应的 OAuth app

**本页中的 `mail.example.com` 只是示例。实际部署时，请替换为你自己的正式域名。**

建议按以下顺序准备：

1. [创建 Turso 数据库](/turso)
2. [配置 Cloudflare R2](/r2-storage)
3. [配置 GitHub 登录](/github-auth)
4. [按需配置 Gmail OAuth](/gmail-oauth)
5. [按需配置 Outlook OAuth](/outlook-oauth)

## 第 1 步：准备生产环境变量

在项目根目录复制环境变量模板：

```bash
cp .env.example .env
```

然后生成密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把生成的 64 位十六进制字符串先填入 `ENCRYPTION_KEY`。如果你打算单独设置 `AUTH_SECRET` 或 `CRON_SECRET`，可以再各自生成一份新的随机值。

将 `.env` 至少填写为：

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

如果你希望开箱即用 Gmail / Outlook OAuth，再补充：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 第 2 步：完成生产域名对应的 OAuth 配置

所有 OAuth 回调地址都必须使用**最终生产域名**，并与 `NEXT_PUBLIC_APP_URL` 保持一致。

### GitHub 登录

GitHub OAuth App 中填写：

- **Homepage URL**：`https://mail.example.com`
- **Authorization callback URL**：`https://mail.example.com/api/auth/github/callback`

然后将返回的值填入：

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### Gmail（可选）

Google OAuth 的回调地址应为：

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook（可选）

Microsoft OAuth 的回调地址应为：

```txt
https://mail.example.com/api/oauth/outlook
```

如果你还没有完成这些配置，请先按详细文档逐项处理：

- [GitHub Auth 详细配置](/github-auth)
- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)

## 第 3 步：安装依赖并初始化数据库

在填好生产环境变量后，执行：

```bash
npm install
npm run db:setup
```

对于全新数据库，`db:setup` 是推荐入口。

## 第 4 步：部署到 Vercel

推荐流程如下：

1. 将仓库导入 Vercel
2. 在 Vercel 项目中填写与本地一致的生产环境变量
3. 绑定正式域名，例如 `mail.example.com`
4. 触发部署

部署完成后，请再次确认：

- Vercel 中的 `NEXT_PUBLIC_APP_URL` 已设置为 `https://mail.example.com`
- GitHub / Gmail / Outlook OAuth 回调地址全部使用相同域名
- Turso、R2 与应用环境变量来自同一套生产配置

## 第 5 步：执行发布前校验

在发布前，建议至少执行：

```bash
npm run verify
```

该命令会依次执行：

- ESLint
- TypeScript 类型检查
- Vitest 测试
- Next.js 构建
- 文档站构建

## 第 6 步：完成首次登录与初始化

部署完成后，打开你的生产地址：

- `https://mail.example.com`

然后按顺序完成：

1. 使用 GitHub 登录
2. 完成 `/setup`
3. 打开 `/accounts`
4. 添加 Gmail、Outlook 或 IMAP/SMTP 账号
5. 返回首页确认邮件已成功同步

## 第 7 步：完成上线检查

正式投入使用前，至少检查以下项目：

- GitHub 登录可以成功返回 Origami
- `/setup` 可以正常完成
- `/accounts` 页面可正常打开
- Gmail / Outlook OAuth 可以完成授权并回跳
- IMAP/SMTP 账号可以添加
- 附件可以上传与下载
- 同步任务可以正常执行
- 发信流程可用

## 下一步

如果你要继续完善生产部署，建议按以下顺序阅读：

1. [部署指南](/deployment)
2. [Turso 数据库详细配置](/turso)
3. [Cloudflare R2 / Bucket 详细配置](/r2-storage)
4. [GitHub Auth 详细配置](/github-auth)
5. [Gmail OAuth 详细配置](/gmail-oauth)
6. [Outlook OAuth 详细配置](/outlook-oauth)

如果你需要本地调试或二次开发，请查看：

- [开发与调试](/development)
