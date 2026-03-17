# Origami ✉️

一个面向**个人**或**小团队单席位**的统一收件箱。  
它把 Gmail、Outlook 和国内 IMAP/SMTP 邮箱聚合到一个界面里，同时尽量保持**隐私友好、可自托管、易于理解**。

[![CI](https://github.com/theLucius7/Origami/actions/workflows/ci.yml/badge.svg)](https://github.com/theLucius7/Origami/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/theLucius7/Origami)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Turso](https://img.shields.io/badge/Database-Turso-4FF8D2?logo=turso&logoColor=111)](https://turso.tech/)
[![Cloudflare R2](https://img.shields.io/badge/Object%20Storage-Cloudflare%20R2-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://l7cp.de/Origami/)

## 文档

文档站默认语言为**中文**，并支持切换到**英文**和**日语**：

- 中文：<https://l7cp.de/Origami/>
- English: <https://l7cp.de/Origami/en/>
- 日本語: <https://l7cp.de/Origami/ja/>

推荐先读：

- [快速开始（生产环境）](https://l7cp.de/Origami/quick-start)
- [部署指南（生产环境）](https://l7cp.de/Origami/deployment)
- [开发环境说明](https://l7cp.de/Origami/development)
- [架构说明](https://l7cp.de/Origami/architecture)
- [FAQ](https://l7cp.de/Origami/faq)

如果你已经准备开始真正部署，推荐按这个顺序看这些“宝宝式教学”页面：

1. [Turso 数据库详细配置](https://l7cp.de/Origami/turso)
2. [Cloudflare R2 / Bucket 详细配置](https://l7cp.de/Origami/r2-storage)
3. [GitHub Auth 详细配置](https://l7cp.de/Origami/github-auth)
4. [Gmail OAuth 详细配置](https://l7cp.de/Origami/gmail-oauth)
5. [Outlook OAuth 详细配置](https://l7cp.de/Origami/outlook-oauth)

## 项目定位

Origami 不是工单系统，也不是多角色协同 helpdesk。它更像是：

- 一个**单用户收件箱工作台**
- 一个在多个邮箱之上叠加的**本地生产力层**
- 一个适合自己部署、自己掌控数据的邮件聚合器

如果你想要的是：

- 统一看多个邮箱
- 做本地分拣（Done / Archive / Snooze）
- 按需开启 Read / Star 回写
- 用 Gmail / Outlook / QQ / 国内邮箱发信
- 低心智负担地跑起来

那它就是为这个场景设计的。

## 核心能力

- 聚合 Gmail、Outlook、QQ 与通用 IMAP/SMTP 邮箱
- 支持账号级 OAuth app 管理（环境变量默认 app + 数据库 app）
- 本地优先 triage：Done / Archive / Snooze 不强绑 provider 行为
- Read / Star 可按账号选择是否回写到支持的邮箱
- 首次同步走 metadata-first，正文和附件按需懒加载
- 支持新邮件发送、附件上传与本地 sent history
- 支持 Vercel Cron 定时同步
- 单 owner `GitHub OAuth` 登录与首次初始化向导

## Provider 支持矩阵

| Provider | 收件 | 发信 | OAuth / 登录方式 | Read / Star 回写 |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | ✅ |
| Outlook | ✅ | ✅ | Microsoft OAuth | ✅ |
| QQ | ✅ | ✅ | IMAP/SMTP 授权码 | ✅ |
| 通用 IMAP/SMTP | ✅ | ✅ | 用户名 + 密码 / 授权码 | ✅（基于 IMAP 标记能力） |

## Golden Path：生产环境最短路径

README 默认只放**正式部署**路径，不再把 `localhost` 混进主流程。  
如果你要本地开发，请直接看：<https://l7cp.de/Origami/development>

### 1. 准备生产环境变量

```bash
cp .env.example .env
npm install
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把生成的 64 位十六进制字符串填到 `ENCRYPTION_KEY`，再补齐 `.env`。

最少通常需要这些分组：

- **应用本身**：`NEXT_PUBLIC_APP_URL`、`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`ENCRYPTION_KEY`
- **可选安全增强**：`AUTH_SECRET`、`GITHUB_ALLOWED_LOGIN`、`CRON_SECRET`
- **数据库**：`TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`
- **对象存储**：`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- **可选的默认 OAuth app**：`GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET`

更详细的变量解释见：<https://l7cp.de/Origami/deployment>

### 2. 用正式域名创建 GitHub OAuth App

1. 在 GitHub 打开 **Settings → Developer settings → OAuth Apps → New OAuth App**
2. 填：
   - **Homepage URL** = `https://mail.example.com`
   - **Authorization callback URL** = `https://mail.example.com/api/auth/github/callback`
3. 生成 client secret
4. 填到 `.env`：

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### 3. 初始化数据库

```bash
npm run db:setup
```

对于**全新数据库**，这是推荐入口。  
`db:migrate` 仍保留，用于历史迁移链回放或升级场景。

### 4. 部署并完成初始化

把仓库导入 Vercel，填入生产环境变量，部署后打开你的正式域名。  
首次会进入 GitHub 登录与 `/setup` 初始化流程。完成后去 `/accounts` 添加邮箱账号。

### 5. 发版前统一验证

```bash
npm run verify
```

它会依次跑：

- lint
- typecheck
- test
- app build
- docs build

## 生产部署建议

推荐组合：

- **应用运行时**：Vercel
- **数据库**：Turso / libSQL
- **附件存储**：Cloudflare R2
- **OAuth / 邮件 API**：Google Gmail API、Microsoft Graph、国内 IMAP/SMTP

一键部署入口：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/theLucius7/Origami)

## 设计原则

### 1. 本地优先，而不是 provider 优先

Origami 把 Done / Archive / Snooze 定义为**本地状态**，而不是强行映射到每个 provider 各自不同的语义。

这样做的好处是：

- UI 一致
- 数据模型更稳
- 不会被 Gmail / Outlook / IMAP 的差异拖垮

### 2. 只在值得的时候做回写

Read / Star 这类状态更接近邮箱本身，因此 Origami 支持按账号开启回写；如果 provider 不支持、scope 不够，依然不阻塞本地操作。

### 3. 先快，再完整

首次同步优先抓元数据，正文与附件在真正打开邮件时再抓。  
这比“第一次就把所有正文和附件拖回来”更适合真实使用。

## 当前限制

- Done / Archive / Snooze 仍只保存在 Origami 本地
- Outlook 当前附件发送路径仍限制单文件小于 3 MB
- 还没有 thread-aware reply / forward
- 还没有 remote draft sync
- 当前主要聚焦 recent inbox，而不是完整镜像整个邮箱体系

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 本地开发 |
| `npm run verify` | 发版前完整验证 |
| `npm run db:setup` | 全新数据库初始化 |
| `npm run db:migrate` | 回放历史迁移链 |
| `npm run db:push` | 按当前 schema 推送数据库 |
| `npm run db:studio` | 打开 Drizzle Studio |
| `npm run docs:dev` | 本地预览文档 |
| `npm run docs:build` | 构建文档站 |

## 安全说明

- Provider 凭据在写入数据库前会经过 **AES-256-GCM** 加密
- 附件内容存储在 **Cloudflare R2**，数据库只保留元数据和对象引用
- 下载通过服务端代理，客户端不会直接拿到原始 R2 object key
- 应用通过单 owner 的 GitHub session cookie 保护访问
- 邮箱 OAuth callback state 会签名并绑定当前登录 session
- 定时同步接口通过 `CRON_SECRET`（或派生 secret）保护

## License

MIT — 见 [LICENSE](./LICENSE)

---

## Codex tools

Codex-related utilities were moved to a separate repository:
https://github.com/zalataraglados-prog/codex-dialogue-manager
