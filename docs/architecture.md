# 架构说明

这一页描述的是 **Origami 当前代码中已经落地的架构**，不是未来蓝图。

## 总览

```text
Browser
  -> Next.js Proxy
  -> App Router Pages / Server Actions / Route Handlers
  -> Drizzle ORM
  -> Turso / libSQL

Attachments
  -> Cloudflare R2

Providers
  -> Gmail API
  -> Microsoft Graph
  -> IMAP / SMTP

Scheduled Sync
  -> Vercel Cron
  -> /api/cron/sync
```

## 核心设计原则

### 1. 单用户优先

Origami 不引入复杂的用户、角色和组织模型。  
它把“一个操作员处理多个邮箱”作为第一优先级。

### 2. 本地生产力层优先

Origami 不试图把所有 triage 状态都强行映射到每个 provider。  
因此：

- Done / Archive / Snooze：本地状态
- Read / Star：可选回写状态

### 3. metadata-first

首次同步时优先抓：

- subject
- sender
- snippet
- receivedAt
- folder

正文和附件会在用户打开详情时按需拉取。  
这样可以显著降低首轮同步成本。

## 运行时分层

### App Router 页面

负责首屏渲染和路由层组织，例如：

- `/`
- `/accounts`
- `/compose`
- `/sent`

### Server Actions

负责应用内部读写，例如：

- 获取邮件列表
- 更新 triage 状态
- 发信
- 管理账号和 OAuth app

### Route Handlers

只用于必须暴露为 HTTP endpoint 的场景，例如：

- OAuth callback
- 附件下载
- 定时同步入口

## 账户与 provider 模型

当前 provider 主要有四类：

- `gmail`
- `outlook`
- `qq`
- `imap_smtp`

其中：

- `qq` 已不再只是“只读特例”，本质上是带兼容封装的 IMAP/SMTP provider
- `imap_smtp` 是通用国内/自定义邮箱入口

## OAuth app 解析模型

对于 Gmail / Outlook，Origami 现在使用：

- **env-backed default app**
- **DB-backed app**

解析顺序是：

1. 如果账号指定了 `oauth_app_id`，优先解析数据库中的 app
2. 如果没有，则回退到 `default`
3. `default` 再从环境变量读取

这个设计的意义是：

- 老账号可以平滑兼容
- 新账号可以按 app 隔离
- 运维可以逐步从 env-only 迁移到 DB-backed app

## 同步流程

```text
Sync trigger
  -> syncSingleAccount / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist emails into database
  -> upload discovered attachments to R2 (if needed)
  -> update cursor + lastSyncedAt
```

不同 provider 的 cursor 语义不同：

- Gmail：`historyId`
- Outlook：Graph delta / nextLink
- IMAP：UID / 基于邮箱列表状态推进

当前同步模型还有几个刻意的行为：

- provider 会尽量保留远端 `isRead / isStarred`，避免重复同步把本地状态洗回默认值
- Outlook delta 中的 `@removed` tombstone 会被转换为本地 `REMOTE_REMOVED` 状态，因此远端已删除或已移出 Inbox 的邮件不会继续留在主列表
- 如果同一个 remote message 后续重新回到 Inbox，同步仍然可以把它重新带回可见列表

## 邮件详情补抓

当用户打开详情页时：

1. 先查本地数据库
2. 如果正文缺失，则调用 `provider.fetchEmail(remoteId)`
3. 把正文、HTML、附件元数据补写回数据库
4. 必要时把附件对象写入 R2

这使得 Origami 在真实使用时更像“快列表 + 懒展开”，而不是“先把全世界拉完再给你看”。

与此同时，数据库会显式记录：

- 正文补抓状态（pending / hydrated / failed）
- 最近一次补抓错误
- 已读 / 星标写回的 pending / success / failed

这些状态会聚合到账号页，方便你直接看出某个账号最近是正文补抓异常，还是远端写回权限 / 调用失败。

## 发信流程

```text
Compose form
  -> upload compose attachments
  -> send action
  -> provider.sendMail()
  -> persist local sent_messages record
  -> persist sent_message_attachments
```

当前行为：

- Gmail：发送 RFC 2822 / MIME raw
- Outlook：发送 Graph `sendMail` JSON payload
- IMAP/SMTP：走 SMTP 直发

## 数据存储分工

### Turso / libSQL

保存：

- accounts
- oauth_apps
- emails
- attachments metadata
- compose_uploads
- sent_messages
- sent_message_attachments

### Cloudflare R2

保存：

- 收件附件对象
- compose 临时上传文件
- sent history 对应附件对象

## 安全边界

- 凭据在入库前用 **AES-256-GCM** 加密
- OAuth client secret 只保留在服务端
- 下载通过服务端代理，避免暴露原始对象 key
- `CRON_SECRET` 保护同步入口
- GitHub owner session 保护应用访问
- 邮箱 OAuth callback state 会签名并绑定当前登录 session

## 哪些是故意没做的

当前没有做这些，并不是忘了，而是刻意收敛范围：

- 多用户协作角色系统
- 全 provider 的 Done / Archive / Snooze 回写
- 完整 thread-aware reply / forward
- remote draft sync
- 完整镜像整个邮箱体系

这些能力都很有价值，但也会显著抬高复杂度。Origami 当前优先保证的是：

> 单用户场景下，核心路径足够快、足够稳、足够容易维护。
