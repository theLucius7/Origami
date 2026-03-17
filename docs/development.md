# 开发与调试

本页说明 **Origami 的本地开发、调试与验证流程**。

这不是生产部署文档。  
如果你要上线实例，请先阅读：

- [快速开始](/quick-start)
- [部署指南](/deployment)

## 适用场景

请在以下场景阅读本页：

- 需要本地运行项目
- 需要修改前端或后端代码
- 需要调试 OAuth 回调
- 需要验证数据库迁移、测试或构建
- 需要贡献代码

## 本地开发环境要求

- Node.js 22+
- npm
- 一套可用的测试用 Turso / libSQL 数据库
- 一套可用的测试用 Cloudflare R2 bucket
- 本地开发专用的 GitHub OAuth App
- 如需测试 Gmail / Outlook，对应的开发 OAuth app

## 本地环境变量

建议使用单独的开发配置，不要直接复用生产密钥。

示例：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000

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
R2_BUCKET_NAME=origami-attachments-dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 本地 OAuth 回调地址

### GitHub

```txt
http://localhost:3000/api/auth/github/callback
```

### Gmail

```txt
http://localhost:3000/api/oauth/gmail
```

### Outlook

```txt
http://localhost:3000/api/oauth/outlook
```

建议为本地开发单独创建一套 OAuth app，不要与生产环境共用。

## 安装与启动

```bash
cp .env.local.example .env
npm install
npm run db:setup
npm run dev
```

默认访问地址：

- `http://localhost:3000`

## 常用命令

```bash
npm run dev
npm run test
npm run lint
npm run build
npm run docs:build
npm run verify
```

## 数据库命令

```bash
npm run db:setup
npm run db:migrate
npm run db:push
```

建议：

- 新测试库优先使用 `db:setup`
- 需要验证历史迁移时再使用 `db:migrate`
- `db:push` 仅用于明确了解影响的情况下

## 调试建议

### OAuth 回调异常

优先检查：

- `NEXT_PUBLIC_APP_URL`
- OAuth 平台中的 callback URL
- 当前运行端口
- 使用的 Client ID / Client Secret 是否属于开发环境

### 数据库异常

优先检查：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- 当前数据库是否已经执行 `db:setup`

### 附件上传异常

优先检查：

- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## 提交前建议

在提交代码前，至少执行：

```bash
npm run verify
```

如果你只改了文档，至少执行：

```bash
npm run docs:build
```
