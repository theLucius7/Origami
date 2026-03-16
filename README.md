# Origami

Origami 是一个面向个人使用场景的 Serverless 多邮箱统一收件箱，目标是在一个网页里集中查看 `Gmail`、`Outlook` 和 `QQ 邮箱` 的邮件，并把附件二进制存放到 `Cloudflare R2`，邮件与附件元数据存放到 `Turso`。

## 当前定位

- 单用户工具，不是多租户 SaaS
- 核心能力是收件、同步、阅读、附件下载
- 内部读写优先使用 `Server Actions`
- 仅保留必要的 `Route Handlers`：登录、OAuth 回调、附件代理、Cron

## 已实现能力

- 统一收件箱首页，聚合多个邮箱账号邮件
- 按账号过滤、按关键字搜索、查看已标星邮件
- Gmail OAuth 接入，使用 Gmail API 拉取邮件
- Outlook OAuth 接入，使用 Microsoft Graph API 拉取邮件
- QQ 邮箱 IMAP 接入，使用授权码拉取邮件
- 支持手动同步单个账号或全部账号
- 支持 Vercel Cron 定时同步
- 邮件附件上传到 R2，下载时经由服务端代理
- 访问口令登录，服务端通过 Cookie 或 Bearer Token 鉴权
- 邮箱凭据使用 `AES-256-GCM` 加密后存入数据库

## 技术栈

- `Next.js 16` + `App Router`
- `React 19`
- `Drizzle ORM` + `Turso (libSQL)`
- `Cloudflare R2`
- `googleapis`
- `@microsoft/microsoft-graph-client`
- `imapflow` + `mailparser`
- `Tailwind CSS v4` + `shadcn/ui`

## 文档导航

- [架构文档](docs/ARCHITECTURE.md)
- [项目结构文档](docs/PROJECT-STRUCTURE.md)
- [部署文档](docs/DEPLOYMENT.md)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 复制环境变量

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

### 3. 生成加密密钥

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把输出填入 `.env` 的 `ENCRYPTION_KEY`。

### 4. 填写环境变量

至少需要先准备这些配置：

- `NEXT_PUBLIC_APP_URL`
- `ACCESS_TOKEN`
- `CRON_SECRET`
- `ENCRYPTION_KEY`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`

如果需要接入 Gmail / Outlook，还要填写对应 OAuth 配置。完整说明见 [部署文档](docs/DEPLOYMENT.md)。

### 5. 初始化数据库

```bash
npm run db:push
```

### 6. 启动开发环境

```bash
npm run dev
```

打开 `http://localhost:3000`，输入 `ACCESS_TOKEN` 登录。

## 常用命令

```bash
npm run dev
npm run build
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
```

## 页面与接口概览

页面：

- `/login`：访问口令登录页
- `/`：统一收件箱
- `/accounts`：邮箱账号管理
- `/mail/[id]`：移动端/直达邮件详情页

接口：

- `POST /api/auth/login`：设置登录 Cookie
- `GET /api/oauth/gmail`：Gmail OAuth 回调
- `GET /api/oauth/outlook`：Outlook OAuth 回调
- `GET /api/attachments/[key]`：附件下载代理
- `GET /api/cron/sync`：Vercel Cron 定时同步入口

## 开发说明

- 主页和账号页的数据由 `Server Actions` 直接读取，不经过传统 REST 列表接口
- `src/proxy.ts` 是 Next.js 16 的网关层，负责保护大多数页面和接口
- 附件下载路径使用数据库里的附件记录 `id`，服务端再解析到真正的 `r2ObjectKey`
- 为避免构建期因为数据库环境变量缺失而报错，受保护应用区域使用了动态渲染

## 建议阅读顺序

1. 先看 [项目结构文档](docs/PROJECT-STRUCTURE.md)
2. 再看 [架构文档](docs/ARCHITECTURE.md)
3. 最后按 [部署文档](docs/DEPLOYMENT.md) 配置外部服务并上线
