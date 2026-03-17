# 部署指南

如果你只想走最短路径：**填好 `.env` → `npm run db:setup` → 部署到 Vercel → 在 `/accounts` 里接邮箱。**

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
| `ACCESS_TOKEN` | 是 | 单用户登录口令 |
| `CRON_SECRET` | 是 | `/api/cron/sync` 的 Bearer 密钥 |
| `ENCRYPTION_KEY` | 是 | 64 位十六进制字符串，用于 AES-256-GCM |

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

## 第 3 步：配置 OAuth

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

## 第 4 步：配置 IMAP/SMTP 邮箱

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

## 第 5 步：部署到 Vercel

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

## 生产检查清单

部署后建议逐项确认：

- `/login` 可以访问
- 正确的 `ACCESS_TOKEN` 能进入应用
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

## 已知注意事项

- Done / Archive / Snooze 仍是本地状态，不回写 provider
- Read / Star 回写依赖 provider 能力与 scope
- Outlook 当前仍限制单附件 < 3 MB
- provider callback URL 必须与配置完全一致
