# 快速开始

这份文档面向第一次接触 Origami 的人。目标不是解释所有历史演进，而是给你一条**最短可用路径**。

## 你需要准备什么

在开始之前，你至少需要：

- Node.js 22+
- 一个 Turso / libSQL 数据库
- 一个 Cloudflare R2 bucket
- 一组用于访问应用的 `ACCESS_TOKEN`
- 如果要接 Gmail / Outlook：对应的 OAuth app

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
ACCESS_TOKEN=your-login-token
CRON_SECRET=your-cron-secret
ENCRYPTION_KEY=64-char-hex-key
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...
```

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

1. 输入 `ACCESS_TOKEN`
2. 进入 `/accounts`
3. 添加 Gmail / Outlook / IMAP/SMTP 账号
4. 回到首页检查是否能看到邮件列表

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

### 为什么登录只要一个 token？

因为 Origami 目前是单用户应用。  
它用 `ACCESS_TOKEN` 保证最小可用的访问控制，而不是一开始就引入复杂用户系统。

### 如果我只想先试，不想配 Gmail / Outlook？

可以直接先接一个 IMAP/SMTP 邮箱，例如 QQ、163 或自定义邮箱。

## 下一步看什么

- 要上线：看 [部署指南](/deployment)
- 想理解内部设计：看 [架构说明](/architecture)
- 想知道为什么有些状态只保存在本地：看 [FAQ](/faq)
