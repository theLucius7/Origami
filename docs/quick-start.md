# 快速开始

这份文档面向第一次接触 Origami 的人。目标不是解释所有历史演进，而是给你一条**最短可用路径**。

## 你需要准备什么

在开始之前，你至少需要：

- Node.js 22+
- 一个 Turso / libSQL 数据库
- 一个 Cloudflare R2 bucket
- 一个 GitHub OAuth App（用于登录到 Origami）
- 如果要接 Gmail / Outlook：对应的邮箱 OAuth app

## 第 1 步：安装依赖并复制环境变量模板

```bash
cp .env.example .env
npm install
```

然后生成 `ENCRYPTION_KEY`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把输出结果填进 `.env`。

## 第 2 步：填写 `.env`

### 最少必填

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
ENCRYPTION_KEY=64-char-hex-key
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...
```

### 推荐再补上的变量

```txt
# 可选：只允许指定 GitHub 用户完成首次绑定 / 后续登录
GITHUB_ALLOWED_LOGIN=your-github-login
# 可选：独立 session 签名密钥；留空时默认复用 ENCRYPTION_KEY
AUTH_SECRET=...
# 可选但推荐：定时同步 Bearer secret（如果要接平台 cron，最好显式填写）
CRON_SECRET=...
```

### GitHub OAuth App 最小配置

如果你还没创建 GitHub OAuth App，最快可以这样配：

1. 打开 GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. 填写：
   - **Application name**：`Origami Local`（本地）或 `Origami Prod`（生产）
   - **Homepage URL**：你的应用地址，例如 `http://localhost:3000` 或 `https://mail.example.com`
   - **Authorization callback URL**：`<你的应用地址>/api/auth/github/callback`
3. 创建后点 **Generate a new client secret**
4. 把得到的值填进：
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
5. 如果这是你的个人实例，建议同时设置：
   - `GITHUB_ALLOWED_LOGIN=你的 GitHub 用户名`

示例（本地开发）：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
```

> 推荐把**本地开发**和**生产环境**分成两个 GitHub OAuth App。这样 callback URL 不会互相干扰，也更容易排查问题。

### 如果你希望开箱即用 Gmail / Outlook OAuth

再补：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

> 说明：即使你不填这些默认环境变量，也仍然可以在应用里创建数据库版 OAuth app。

## 第 3 步：初始化数据库

```bash
npm run db:setup
```

对于**新数据库**，优先使用这条命令。  
如果你明确在处理历史升级链，才需要再考虑 `db:migrate`。

## 第 4 步：启动开发服务器

```bash
npm run dev
```

访问：`http://localhost:3000`

然后：

1. 使用 GitHub 登录
2. 完成 `/setup` 初始化
3. 进入 `/accounts`
4. 添加 Gmail / Outlook / IMAP/SMTP 账号
5. 回到首页检查是否能看到邮件列表

## 第 5 步：验证完整性

在准备部署前，建议直接跑：

```bash
npm run verify
```

它会依次验证：

- ESLint
- TypeScript 类型检查
- Vitest 测试
- Next.js build
- 文档站 build

## 常见首次上手问题

### 为什么不是 `db:migrate`？

因为项目已经积累了一串历史 migration。  
对于新库来说，你通常不需要感知这段历史，直接使用 `db:setup` 会更省心。

### 为什么登录走 GitHub？

因为 Origami 现在更适合“单 owner、自托管”的使用方式。  
GitHub OAuth 能在不引入完整多用户系统的前提下，提供比明文 token 更稳的登录和初始化绑定。

### 如果我只想先试，不想配 Gmail / Outlook？

可以直接先接一个 IMAP/SMTP 邮箱，例如 QQ、163 或自定义邮箱。

## 下一步看什么

- 要上线：看 [部署指南](/deployment)
- 想把登录配得很稳：看 [GitHub Auth 详细配置](/github-auth)
- 想把附件存储配清楚：看 [Cloudflare R2 / Bucket 详细配置](/r2-storage)
- 想把 Gmail 接得更稳：看 [Gmail OAuth 详细配置](/gmail-oauth)
- 想把 Outlook 接得更稳：看 [Outlook OAuth 详细配置](/outlook-oauth)
- 想理解内部设计：看 [架构说明](/architecture)
- 想知道为什么有些状态只保存在本地：看 [FAQ](/faq)
