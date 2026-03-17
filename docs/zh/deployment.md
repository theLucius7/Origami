# 部署

这份文档描述的是**当前代码里已经落地的部署模型**。

推荐组合：

- **应用运行时**：Vercel
- **数据库**：Turso / libSQL
- **对象存储**：Cloudflare R2
- **邮件提供商**：Gmail API、Microsoft Graph、国内 IMAP/SMTP 预设（QQ / 163 / 126 / Yeah / custom）

## 环境变量

| 变量 | 必填 | 说明 |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | 是 | 用于生成 OAuth 回调地址的公开应用 URL |
| `ACCESS_TOKEN` | 是 | 单用户登录口令 |
| `CRON_SECRET` | 是 | 保护 `GET /api/cron/sync` 的 Bearer 密钥 |
| `ENCRYPTION_KEY` | 是 | 64 位十六进制字符串，用于 AES-256-GCM |
| `TURSO_DATABASE_URL` | 是 | Turso / libSQL 地址 |
| `TURSO_AUTH_TOKEN` | 是 | Turso auth token |
| `R2_ACCESS_KEY_ID` | 是 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | 是 | R2 secret key |
| `R2_BUCKET_NAME` | 是 | 附件 bucket |
| `R2_ENDPOINT` | 是 | R2 的 S3-compatible endpoint |
| `R2_ACCOUNT_ID` | 否 | 当前运行时代码未使用 |
| `GMAIL_CLIENT_ID` | 使用环境变量默认 Gmail 应用时需要 | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | 使用环境变量默认 Gmail 应用时需要 | Google OAuth client secret |
| `OUTLOOK_CLIENT_ID` | 使用环境变量默认 Outlook 应用时需要 | Microsoft OAuth client ID |
| `OUTLOOK_CLIENT_SECRET` | 使用环境变量默认 Outlook 应用时需要 | Microsoft OAuth client secret |

## 1. 准备应用密钥

### ACCESS_TOKEN

这是用户访问应用时唯一需要输入的登录口令。

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### CRON_SECRET

用于保护定时同步接口：

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### ENCRYPTION_KEY

必须是一个 32 字节、以 64 位十六进制字符串表示的 key：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. 配置 Turso

创建 Turso 数据库，并拿到：

- database URL
- auth token

对于全新数据库，推荐直接执行：

```bash
npm run db:setup
```

其他可选路径：

```bash
npm run db:migrate
# 或
npm run db:push
```

说明：

- `db:setup` 是面向全新数据库的推荐单命令初始化路径
- `db:migrate` 会回放历史 migration 链
- `db:push` 使用项目里的包装脚本，以更稳妥地处理 SQLite FTS 场景

## 3. 配置 Cloudflare R2

创建 bucket，然后生成 S3-compatible 凭据。

设置：

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

## 4. 配置 Gmail OAuth

Origami 当前支持两种 Gmail OAuth 应用来源：

- 通过 `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` 提供的**环境变量默认应用**
- 在 `/accounts` 页面里管理的 **数据库应用**

Origami 当前实际需要的 Gmail 能力包括：

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

回调地址：

- 本地：`http://localhost:3000/api/oauth/gmail`
- 生产：`https://your-domain/api/oauth/gmail`

## 5. 配置 Outlook OAuth

Origami 当前支持两种 Outlook OAuth 应用来源：

- 通过 `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` 提供的**环境变量默认应用**
- 在 `/accounts` 页面里管理的 **数据库应用**

Origami 当前请求的 Outlook scopes 包括：

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

## 6. 配置国内 IMAP/SMTP 邮箱

Origami 当前支持基于预设的 **IMAP/SMTP 邮箱接入**：QQ / 163 / VIP 163 / 126 / VIP 126 / Yeah，以及自定义模式。

预设示例：

- QQ：`imap.qq.com:993` + `smtp.qq.com:465`
- 163：`imap.163.com:993` + `smtp.163.com:465`
- 126：`imap.126.com:993` + `smtp.126.com:465`
- Yeah：`imap.yeah.net:993` + `smtp.yeah.net:465`

用户需要提供：

- 邮箱地址
- IMAP/SMTP 授权码或密码
- 使用 `custom` 时对应的服务器配置

目前没有额外的 IMAP/SMTP 应用级环境变量。

## 7. 本地开发流程

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

然后：

1. 打开 `http://localhost:3000`
2. 使用 `ACCESS_TOKEN` 登录
3. 打开 `/accounts`
4. （可选）先在 `/accounts` 中创建数据库版 Gmail / Outlook OAuth 应用
5. 连接 Gmail / Outlook / IMAP/SMTP 邮箱

## 8. Vercel 部署流程

### 推荐步骤

1. 在 Vercel 中导入仓库
2. 配置所有必需环境变量
3. 将 `NEXT_PUBLIC_APP_URL` 设为最终生产 URL
4. 用 `npm run db:setup` 初始化目标数据库（如果你明确想回放完整 migration 历史，也可以用 `npm run db:migrate`）
5. 部署

### 定时同步

`vercel.json` 当前配置：

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

请求头需要：

```http
Authorization: Bearer <CRON_SECRET>
```

## 9. 生产验证清单

- `/login` 可以访问
- 正确的 `ACCESS_TOKEN` 能进入应用
- `/accounts` 页面正常加载
- Gmail OAuth 回调可用
- Outlook OAuth 回调可用
- IMAP/SMTP 账号可以添加
- 手动同步可用
- `/api/cron/sync` 能接受正确的 Bearer 密钥
- 附件下载正常
- Gmail / Outlook / IMAP/SMTP 发信正常
- `audit:prod` 报告生产依赖零漏洞

## 10. 已知部署注意事项

- IMAP/SMTP 发信依赖邮箱授权码或密码；如果发信失败，优先检查是否已开启 IMAP / SMTP，并更新登录凭据
- Done / Archive / Snooze 仍只保存在 Origami 本地；Read / Star 回写是可选能力，并依赖正确的 provider scopes
- Outlook 发信在当前实现下仍限制单个附件小于 3 MB
- provider 回调 URL 必须与实际配置的应用 URL 完全一致
