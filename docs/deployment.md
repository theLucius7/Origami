# 部署指南

如果你只想走最短路径：**填好 `.env` → `npm run db:setup` → 部署到 Vercel → GitHub 登录完成 `/setup` → 在 `/accounts` 里接邮箱。**

这份文档会把这条路径展开，并把关键环境变量、OAuth 与生产校验说明清楚。

## 推荐部署组合

- **应用运行时**：Vercel
- **数据库**：Turso / libSQL
- **对象存储**：Cloudflare R2
- **邮件提供商**：Gmail API、Microsoft Graph、国内 IMAP/SMTP

## 第 1 步：准备环境变量

### 应用基础

| 变量 | 必填 | 说明 |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | 是 | 公开访问地址，用于 OAuth callback |
| `GITHUB_CLIENT_ID` | 是 | GitHub 登录 OAuth app client id |
| `GITHUB_CLIENT_SECRET` | 是 | GitHub 登录 OAuth app client secret |
| `ENCRYPTION_KEY` | 是 | 64 位十六进制字符串，用于 AES-256-GCM |
| `GITHUB_ALLOWED_LOGIN` | 否 | 限制允许完成首次绑定 / 登录的 GitHub 用户名 |
| `AUTH_SECRET` | 否 | session 签名密钥；不填时回退到 `ENCRYPTION_KEY` |
| `CRON_SECRET` | 否 | `/api/cron/sync` 的 Bearer 密钥；不填时自动派生 |

### 数据库

| 变量 | 必填 | 说明 |
|---|---:|---|
| `TURSO_DATABASE_URL` | 是 | Turso / libSQL 地址 |
| `TURSO_AUTH_TOKEN` | 是 | Turso auth token |

### 对象存储

| 变量 | 必填 | 说明 |
|---|---:|---|
| `R2_ACCESS_KEY_ID` | 是 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | 是 | R2 secret key |
| `R2_BUCKET_NAME` | 是 | 附件 bucket |
| `R2_ENDPOINT` | 是 | R2 S3-compatible endpoint |
| `R2_ACCOUNT_ID` | 否 | 当前运行时代码未直接使用，保留作运维备注 |

### 默认 OAuth app（可选）

| 变量 | 必填 | 说明 |
|---|---:|---|
| `GMAIL_CLIENT_ID` | 否 | 默认 Gmail OAuth app 的 client id |
| `GMAIL_CLIENT_SECRET` | 否 | 默认 Gmail OAuth app 的 client secret |
| `OUTLOOK_CLIENT_ID` | 否 | 默认 Outlook OAuth app 的 client id |
| `OUTLOOK_CLIENT_SECRET` | 否 | 默认 Outlook OAuth app 的 client secret |

> 不填默认 OAuth app 也可以。你仍然可以在应用的 `/accounts` 页面中创建数据库版 OAuth app。

## 第 2 步：初始化数据库

对于一个**全新数据库**，推荐直接执行：

```bash
npm run db:setup
```

其他路径：

- `npm run db:migrate`：回放历史 migration 链
- `npm run db:push`：按当前 schema 推送

### 为什么推荐 `db:setup`

因为项目已经有历史演进。  
对新部署来说，你真正关心的是“把当前 schema 正确建起来”，而不是先理解所有迁移历史。

## 第 3 步：配置 GitHub 登录

你需要先创建一个 GitHub OAuth App，用于登录到 Origami 本身。

### GitHub OAuth App 里要填什么

在 GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App** 中，至少填写：

- **Application name**：例如 `Origami Local` / `Origami Production`
- **Homepage URL**：你的应用公开地址
- **Authorization callback URL**：`<APP_URL>/api/auth/github/callback`

对应示例：

- 本地：
  - Homepage URL：`http://localhost:3000`
  - Callback URL：`http://localhost:3000/api/auth/github/callback`
- 生产：
  - Homepage URL：`https://mail.example.com`
  - Callback URL：`https://mail.example.com/api/auth/github/callback`

创建后，点击 **Generate a new client secret**，把值填到：

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 推荐的几种 GitHub Auth 配置方式

#### 方案 A：本地开发单独一个 OAuth App（最省事）

适合只在本机调试：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

优点：

- 配置最少
- callback URL 很明确
- 不容易把生产配置弄坏

#### 方案 B：本地 / 生产各自一个 OAuth App（推荐）

推荐把环境拆开：

- `Origami Local` → `http://localhost:3000/api/auth/github/callback`
- `Origami Production` → `https://your-domain/api/auth/github/callback`

优点：

- callback URL 不串
- 更容易轮换 secret
- 生产排障更清晰

#### 方案 C：公网单用户实例 + `GITHUB_ALLOWED_LOGIN`（强烈推荐）

如果你的实例暴露在公网，建议显式设置：

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

这样即使别人提前打开了 `/login`，也不能完成 owner 绑定。

#### 方案 D：不设置 `GITHUB_ALLOWED_LOGIN`（仅适合完全私有环境）

如果你的服务只在内网、Tailscale、SSH 隧道后面，且你确定不会被其他人先访问，也可以不设置 `GITHUB_ALLOWED_LOGIN`。

但对公网部署来说，这不是推荐方案。

### 首次绑定会发生什么

- 第一次成功登录且满足限制条件的 GitHub 用户，会在数据库里绑定为实例 owner
- 之后登录校验的是 **GitHub user id**，不是用户名文本
- 即使你 later 改了 GitHub login，只要是同一个账号，仍然可以登录

### 常见坑

- `NEXT_PUBLIC_APP_URL` 必须和你在 GitHub OAuth App 里填写的地址一致
- callback URL 必须精确到 `/api/auth/github/callback`
- 改了域名后，记得同时更新 GitHub OAuth App 和环境变量
- 如果你误绑了 owner，通常需要清理 `app_installation` 记录后重新初始化
- 如果想让 session 与加密密钥解耦，建议额外设置 `AUTH_SECRET`

## 第 4 步：配置邮箱 OAuth

### Gmail

Origami 目前使用这些能力：

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

回调地址：

- 本地：`http://localhost:3000/api/oauth/gmail`
- 生产：`https://your-domain/api/oauth/gmail`

### Outlook

Origami 目前使用这些 scopes：

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

回调地址：

- 本地：`http://localhost:3000/api/oauth/outlook`
- 生产：`https://your-domain/api/oauth/outlook`

### OAuth app 管理策略

当前有两种来源：

1. **环境变量默认 app**
2. **数据库版 app**（在 `/accounts` 管理）

推荐策略：

- 个人最小部署：先用环境变量默认 app
- 想分环境 / 分租户 / 分 provider app：再逐步切到数据库版 app

## 第 5 步：配置 IMAP/SMTP 邮箱

Origami 当前支持：

- QQ
- 163 / VIP 163
- 126 / VIP 126
- Yeah
- custom

用户需要提供：

- 邮箱地址
- 授权码或密码
- 使用 custom 时的 IMAP / SMTP host、port、secure 配置

## 第 6 步：部署到 Vercel

建议流程：

1. 将仓库导入 Vercel
2. 把环境变量填进去
3. 把 `NEXT_PUBLIC_APP_URL` 设为最终生产域名
4. 对目标数据库执行 `npm run db:setup`
5. 部署

## 定时同步

`vercel.json` 中已经定义了 cron：

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

请求头要求：

```http
Authorization: Bearer <CRON_SECRET>
```

如果你没有显式填写 `CRON_SECRET`，服务会自动从 `AUTH_SECRET`（或 `ENCRYPTION_KEY`）派生一个等效 secret。**但如果你使用平台 cron（例如 Vercel Cron），仍然推荐显式配置 `CRON_SECRET`**，否则调度器端通常不知道该发哪个 Bearer token。

## 生产检查清单

部署后建议逐项确认：

- `/login` 可以访问
- GitHub 登录成功后能进入 `/setup` 或首页
- `/accounts` 正常加载
- Gmail OAuth callback 可用
- Outlook OAuth callback 可用
- IMAP/SMTP 账号可以添加
- 手动同步可用
- 定时同步接口接受正确 Bearer secret
- 附件上传 / 下载正常
- Compose 与 sent history 正常

## 升级建议

如果你已经有旧环境：

- 保留历史 migration 链
- 新环境优先走 `db:setup`
- 老账号如果要切换 OAuth app，按账号重新授权，不要只改数据库字段

## 详细分步文档

如果你不想只看这一页的摘要版，而是想按按钮一步一步操作，继续看：

- [GitHub Auth 详细配置](/github-auth)
- [Cloudflare R2 / Bucket 详细配置](/r2-storage)
- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)

## 已知注意事项

- Done / Archive / Snooze 仍是本地状态，不回写 provider
- Read / Star 回写依赖 provider 能力与 scope
- Outlook 当前仍限制单附件 < 3 MB
- GitHub / Gmail / Outlook callback URL 都必须与配置完全一致
