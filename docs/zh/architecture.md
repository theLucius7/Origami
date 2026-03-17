# 架构

Origami 是一个基于 Next.js 16 App Router 构建的**单用户、偏无服务器化的统一收件箱**。

当前运行时职责大致分成几层：

- **App Router 页面**：负责渲染
- **`src/app/actions/*` 中的 Server Actions**：处理 UI 触发的内部读写操作
- **Route Handlers**：只用于外部回调或二进制流这类必须走 API Route 的场景
- **`src/lib/*` 中的 queries / services / providers**：处理数据访问、编排逻辑与第三方邮件提供商集成

## 运行时总览

```text
Browser
  -> Next.js Proxy
  -> App Router pages
  -> Server Actions / Route Handlers
  -> Drizzle ORM
  -> Turso

Binary attachments
  -> Cloudflare R2

Mail providers
  -> Gmail API
  -> Microsoft Graph
  -> IMAP/SMTP 预设（QQ / 163 / 126 / Yeah / custom）

Scheduled sync
  -> Vercel Cron
  -> /api/cron/sync
```

## 主要流程

### 1. 鉴权流程

Origami 当前使用**单一 `ACCESS_TOKEN`**。

1. 用户访问 `/login`
2. `POST /api/auth/login` 校验 token
3. 应用把 `origami_token` 写入 `httpOnly` cookie
4. `src/proxy.ts` 保护其余应用页面和大部分 API 路由

当前公开路由主要只有：

- `/login`
- `/api/auth/*`
- `/api/oauth/*`
- `/api/cron/*`

## 2. 收件箱读取流程

收件箱 UI 由服务端渲染初始数据，再配合客户端触发的 Server Actions 完成交互。

- `src/app/(app)/page.tsx` 加载初始 inbox 数据
- `src/lib/queries/emails.ts` 构造筛选查询
- `src/components/inbox/*` 渲染列表和详情 UI

支持的本地筛选包括：

- `account:`
- `from:`
- `subject:`
- `is:read` / `is:unread`
- `is:starred` / `is:unstarred`
- `is:done` / `is:undone`
- `is:archived` / `is:active`
- `is:snoozed` / `is:unsnoozed`

搜索底层由以下几部分组成：

- 结构化 SQL 条件
- 可用时使用 SQLite FTS5
- FTS 不可用时退回 `LIKE`

## 3. 同步流程

同步逻辑按 provider 驱动，但统一收敛到 `src/lib/providers/types.ts` 中的 `EmailProvider` 接口。

```text
Sync trigger
  -> syncAccountById / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist emails into Turso
  -> upload attachments to R2
  -> update sync cursor + lastSyncedAt
```

各 provider 当前使用的 cursor：

- **Gmail**：`historyId`
- **Outlook**：Graph delta / next link cursor
- **QQ**：IMAP UID

首次同步以“只抓元数据”为主，完整正文和附件可以在后续按需补抓。

## 4. 延迟正文补全（Lazy body hydration）

为了降低首次同步成本，Origami 会先保存邮件元数据，在真正打开邮件时再抓取完整正文。

这部分主要由 `src/lib/services/email-service.ts` 处理：

1. 用户打开一封邮件
2. 如果正文缺失，则调用 `provider.fetchEmail(remoteId)`
3. 持久化完整正文与附件元数据
4. 将新发现的附件上传到 R2

这样做能保持 inbox 同步速度，同时又能在查看详情时拿到完整内容。

## 5. 本地分拣模型

Origami 在自己的数据库中保存这些本地状态：

- `local_done`
- `local_archived`
- `local_snooze_until`
- `local_labels`

重要的是：这些本地分拣字段**不会回写**到 Gmail、Outlook 或 QQ。

Read / Star 则单独处理：对于支持的提供商，可以在账号级开启异步回写；即使写回失败，也只按 best-effort 处理，不阻塞本地分拣。

因此 Origami 更像是在外部邮箱之上叠加了一层本地生产力视图，只在值得增加复杂度的状态上做选择性同步。

## 6. 发信流程

Origami 当前支持通过 **Gmail、Outlook 与 IMAP/SMTP 邮箱发送新邮件**。

```text
Compose form
  -> upload attachment to R2 (temporary compose object)
  -> sendMailAction()
  -> provider.sendMail()
  -> store local sent_messages record
  -> store sent_message_attachments metadata
```

当前行为：

- Gmail：通过 Gmail API 发送原始 RFC 2822 MIME
- Outlook：通过 Microsoft Graph `sendMail` 发送 JSON payload
- IMAP/SMTP 邮箱：通过 SMTP 使用邮箱授权码或密码发信

当前限制：

- 还没有 thread-aware reply / forward
- 还没有远程 draft 同步
- Outlook 当前实现下附件仍限制在 3 MB 以下

## 7. 存储布局

### Turso / libSQL

主要表：

- `accounts`
- `emails`
- `attachments`
- `compose_uploads`
- `sent_messages`
- `sent_message_attachments`

### Cloudflare R2

R2 主要存储：

- 收件邮件的附件二进制
- 撰写邮件时的临时上传附件
- 本地已发送记录引用的附件二进制

客户端不会直接拿到原始 R2 object key；下载由应用服务端代理完成。

## 8. 安全边界

- Provider 凭据在写入数据库前会先经过 **AES-256-GCM** 加密
- OAuth client secret 只保留在服务端
- QQ 授权码不会进入客户端 bundle
- `CRON_SECRET` 保护定时同步接口
- 附件访问通过数据库查找 + 服务端流式输出来控制

## 9. 当前范围

Origami 当前聚焦于：

- 统一收件箱阅读
- 本地分拣
- 元数据优先同步
- 最小可用的新邮件发送
- 单用户自托管部署

暂未实现：

- 将 Done / Archive / Snooze / 标签回写到 provider
- QQ 发信
- draft 同步
- thread-aware 回复 / 转发
- 多用户角色或 workspace 能力
