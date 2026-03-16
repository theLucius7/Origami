# Deployment

本文档说明如何把 Origami 配置完整并部署到 Vercel。

## 1. 部署目标

生产环境目标拓扑：

- 前端与服务端：`Vercel`
- 数据库：`Turso`
- 附件存储：`Cloudflare R2`
- Gmail 接入：`Google OAuth + Gmail API`
- Outlook 接入：`Microsoft OAuth + Graph API`
- QQ 邮箱接入：`IMAP + 授权码`

## 2. 环境变量

建议把所有变量配置在 Vercel Project 的 Environment Variables 中，本地开发则写入 `.env`。

| 变量名 | 必填 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 是 | 应用访问域名，用于 OAuth 回调拼接 |
| `ACCESS_TOKEN` | 是 | 登录口令 |
| `CRON_SECRET` | 是 | 保护 `/api/cron/sync` |
| `ENCRYPTION_KEY` | 是 | 凭据加密密钥，64 位 hex |
| `TURSO_DATABASE_URL` | 是 | Turso 数据库地址 |
| `TURSO_AUTH_TOKEN` | 是 | Turso 访问令牌 |
| `R2_ACCESS_KEY_ID` | 是 | R2 访问密钥 |
| `R2_SECRET_ACCESS_KEY` | 是 | R2 Secret |
| `R2_BUCKET_NAME` | 是 | 附件 bucket |
| `R2_ENDPOINT` | 是 | R2 S3 兼容 endpoint |
| `R2_ACCOUNT_ID` | 否 | 当前代码未直接使用，保留给运维记录或后续扩展 |
| `GMAIL_CLIENT_ID` | Gmail 接入时必填 | Google OAuth Client ID |
| `GMAIL_CLIENT_SECRET` | Gmail 接入时必填 | Google OAuth Client Secret |
| `OUTLOOK_CLIENT_ID` | Outlook 接入时必填 | Microsoft OAuth Client ID |
| `OUTLOOK_CLIENT_SECRET` | Outlook 接入时必填 | Microsoft OAuth Client Secret |

注意：

- `NEXT_PUBLIC_APP_URL` 不要带结尾斜杠
- 生产环境必须设置成真实线上域名
- 本地开发建议使用 `http://localhost:3000`

## 3. 先准备应用级密钥

### 3.1 生成访问口令

这个口令就是你登录 Origami 时输入的密码。可以自己生成一个长随机字符串。

示例：

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

填入：

```env
ACCESS_TOKEN=...
```

### 3.2 生成 Cron 密钥

同样建议使用随机字符串：

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

填入：

```env
CRON_SECRET=...
```

### 3.3 生成加密密钥

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

填入：

```env
ENCRYPTION_KEY=...
```

要求：

- 必须是 64 个 hex 字符
- 对应 32 字节密钥

## 4. 配置 Turso

### 4.1 创建数据库

在 Turso 中创建一个数据库，获取：

- 数据库 URL
- Auth Token

写入：

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=...
```

### 4.2 初始化表结构

在本地执行：

```bash
npm install
npm run db:push
```

说明：

- `drizzle.config.ts` 已经指向 `src/lib/db/schema.ts`
- `db:push` 会按当前 schema 推送到 Turso

## 5. 配置 Cloudflare R2

### 5.1 创建 Bucket

在 Cloudflare R2 中创建一个 bucket，例如：

```env
R2_BUCKET_NAME=origami-attachments
```

### 5.2 创建 S3 兼容密钥

创建 API Token 或 Access Key，拿到：

- `Access Key ID`
- `Secret Access Key`

### 5.3 填写 R2 变量

```env
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCOUNT_ID=<account-id>
```

说明：

- 当前运行时代码主要使用 `R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- `R2_ACCOUNT_ID` 目前未直接参与运行时逻辑

## 6. 配置 Gmail

### 6.1 Google Cloud 配置

需要完成：

1. 创建 Google Cloud Project
2. 启用 Gmail API
3. 配置 OAuth Consent Screen
4. 创建 OAuth 2.0 Client

### 6.2 回调地址

本地：

```text
http://localhost:3000/api/oauth/gmail
```

生产：

```text
https://your-domain.com/api/oauth/gmail
```

### 6.3 Scope

当前代码使用的 Gmail scope：

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/userinfo.email`

### 6.4 环境变量

```env
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

## 7. 配置 Outlook

### 7.1 Microsoft Entra / Azure 配置

需要完成：

1. 注册应用
2. 添加 Redirect URI
3. 获取 Client ID / Client Secret

### 7.2 回调地址

本地：

```text
http://localhost:3000/api/oauth/outlook
```

生产：

```text
https://your-domain.com/api/oauth/outlook
```

### 7.3 Scope / 权限

当前代码对应的权限与 scope：

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `offline_access`

说明：

- `Mail.Read` 用于读取邮箱内容
- `offline_access` 用于 refresh token
- `User.Read` 用于读取 `/me` 基本资料

### 7.4 环境变量

```env
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 8. 配置 QQ 邮箱

QQ 邮箱不需要额外平台级环境变量，但用户在添加账号时必须提供：

- QQ 邮箱地址
- QQ 邮箱 IMAP 授权码

获取步骤：

1. 登录 QQ 邮箱网页版
2. 打开 设置
3. 进入 账户
4. 开启 POP3/IMAP/SMTP 服务
5. 生成授权码

Origami 不使用 QQ 明文登录密码，使用的是授权码。

## 9. 本地联调顺序

建议顺序：

1. 复制 `.env.example` 到 `.env`
2. 填完整的 Turso / R2 / 应用密钥
3. 如果要测 Gmail / Outlook，再填 OAuth 配置
4. 执行 `npm run db:push`
5. 执行 `npm run dev`
6. 打开 `http://localhost:3000`
7. 输入 `ACCESS_TOKEN`
8. 进入 `/accounts` 添加邮箱

## 10. 部署到 Vercel

### 10.1 导入项目

把仓库导入 Vercel。

建议：

- Framework Preset：Next.js
- Root Directory：仓库根目录

### 10.2 配置环境变量

把第 2 节中的变量全部填入 Vercel。

最少一组生产可运行变量通常是：

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

如果你还没准备好 Gmail / Outlook，也可以先不配对应 OAuth 变量，只先使用 QQ 邮箱。

### 10.3 Cron 配置

项目已经内置 `vercel.json`：

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

说明：

- 每 15 分钟执行一次同步
- 当 Vercel 配置了 `CRON_SECRET` 时，会自动把它以 `Authorization: Bearer <CRON_SECRET>` 发送给 Cron 请求
- 应用中的 `/api/cron/sync` 已经按这个格式校验

### 10.4 首次部署后初始化数据库

在本地执行一次：

```bash
npm run db:push
```

或者在你自己的安全环境里对同一份生产 Turso 执行 schema 推送。

## 11. 上线后验收清单

建议至少验证以下项：

- 能正常打开 `/login`
- 输入 `ACCESS_TOKEN` 后能进入首页
- `/accounts` 页面能打开
- QQ 邮箱可以添加成功
- Gmail OAuth 能正常跳转并回调
- Outlook OAuth 能正常跳转并回调
- 手动同步按钮可用
- 附件能正常下载
- 15 分钟后能看到 Cron 触发结果

## 12. 常见问题

### 12.1 `/api/cron/sync` 返回 401

检查：

- Vercel 是否设置了 `CRON_SECRET`
- 应用代码和 Vercel 环境变量是否一致

### 12.2 OAuth 回调报 redirect mismatch

检查：

- `NEXT_PUBLIC_APP_URL` 是否正确
- Google / Microsoft 后台配置的回调地址是否和实际完全一致
- 是否多了或少了 `/api/oauth/...`
- 是否多了尾部斜杠

### 12.3 附件下载失败

检查：

- R2 endpoint 是否正确
- bucket 名称是否正确
- R2 密钥是否有读权限
- 数据库里是否已经存在附件 metadata

### 12.4 本地能跑，线上 OAuth 不工作

通常是因为：

- 本地和生产用了不同的回调地址
- 生产环境没设置 `NEXT_PUBLIC_APP_URL`
- Google / Microsoft 还没把生产域名加入回调白名单

### 12.5 Outlook 登录后拿不到用户邮箱

确认：

- OAuth scope 包含 `User.Read`
- 应用已同意 `Mail.Read`、`offline_access`、`User.Read`

## 13. 推荐的生产配置顺序

如果你想最快上线，推荐顺序如下：

1. 先配 `ACCESS_TOKEN`、`CRON_SECRET`、`ENCRYPTION_KEY`
2. 接入 Turso
3. 接入 R2
4. 先跑 QQ 邮箱
5. 再配置 Gmail OAuth
6. 最后配置 Outlook OAuth

这样最容易定位问题，也方便逐步验证系统链路。
