# 架構說明

這一頁描述的是 **Origami 目前已經落地在程式碼中的架構**，不是未來藍圖。

## 總覽

```text
Browser
  -> Next.js Proxy
  -> App Router Pages / Server Actions / Route Handlers
  -> Drizzle ORM
  -> Neon / PostgreSQL

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

如果你只想先抓住最簡單的心智模型，可以先把 Origami 理解成四層：

1. **Web 應用層**：Next.js 頁面、Server Actions、Route Handlers
2. **業務邏輯層**：帳號管理、同步、發信、triage、回寫
3. **Provider 適配層**：Gmail / Outlook / IMAP/SMTP
4. **儲存層**：Neon PostgreSQL 存結構化資料，R2 存附件物件

## 核心設計原則

### 1. 單使用者優先

Origami 不引入複雜的使用者、角色與組織模型。
它的第一優先級是「一個操作者管理多個信箱」。

### 2. 本地生產力層優先

Origami 不試圖把所有 triage 欄位都硬映射到每個 provider。
因此：

- Done / Archive / Snooze：本地狀態
- Read / Star：可選回寫狀態

### 3. metadata-first 同步

首次同步優先抓取：

- subject
- sender
- snippet
- receivedAt
- folder

正文與附件會在使用者真正打開郵件時再補抓。

## 執行時分層

### App Router 頁面

負責路由與首屏渲染，例如：

- `/`
- `/accounts`
- `/compose`
- `/sent`

### Server Actions

負責應用內的讀寫，例如：

- 讀取郵件列表
- 更新 triage 狀態
- 發信
- 管理帳號與 OAuth app

### Route Handlers

只用於必須暴露為 HTTP endpoint 的場景，例如：

- OAuth callback
- 附件下載
- 定時同步入口

## 帳號與 provider 模型

目前主要 provider 類型包括：

- `gmail`
- `outlook`
- `qq`
- `imap_smtp`

其中：

- `qq` 已不再只是只讀特例，本質上是帶兼容封裝的 IMAP/SMTP provider
- `imap_smtp` 是國內與自訂信箱的通用入口

## OAuth app 解析模型

對 Gmail / Outlook，Origami 目前支援：

- 環境變數預設 app
- 資料庫託管 app

解析順序是：

1. 如果帳號指定 `oauth_app_id`，優先解析資料庫中的 app
2. 如果沒有，回退到 `default`
3. `default` 再從環境變數讀取

這個設計的好處是：

- 舊帳號可平滑相容
- 新帳號可依 app 隔離
- 運維可以逐步從 env-only 過渡到 DB-managed app

## 同步流程

```text
Sync trigger
  -> syncSingleAccount / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist emails into database
  -> upload discovered attachments to R2 (if needed)
  -> update cursor + lastSyncedAt
```

不同 provider 的 cursor 語義不同：

- Gmail：`historyId`
- Outlook：Graph delta / nextLink
- IMAP：UID 或基於信箱列表狀態推進

同步模型裡有幾個刻意保留的行為：

- 會盡量保留遠端 `isRead` / `isStarred`，避免重複同步把狀態洗回預設值
- Outlook delta 的 `@removed` tombstone 會被轉成在地 `REMOTE_REMOVED` 狀態，因此遠端已刪除或已移出 Inbox 的郵件不會繼續留在主列表
- 如果同一封遠端郵件之後重新回到 Inbox，正常同步仍能把它帶回可見列表

## 郵件詳情補抓

當使用者打開詳情頁時：

1. 先查本地資料
2. 如果正文缺失，呼叫 `provider.fetchEmail(remoteId)`
3. 把正文 / HTML / 附件元資料補寫回資料庫
4. 必要時把附件物件寫入 R2

這讓 Origami 更像是「先給你快列表，再懶補全文」，而不是「先把所有內容都抓回來才顯示」。

同時，Origami 也會顯式記錄：

- 正文補抓狀態（`pending` / `hydrated` / `failed`）
- 最近一次補抓錯誤
- 已讀 / 星標回寫狀態（`pending` / `success` / `failed`）

這些訊號會聚合到 Accounts 頁面，方便你快速判斷問題是在補抓、權限不足，還是回寫執行失敗。

## 發信流程

```text
Compose form
  -> upload compose attachments
  -> send action
  -> provider.sendMail()
  -> persist local sent record
  -> persist sent attachment records
```

目前行為：

- Gmail：送 RFC 2822 / MIME raw
- Outlook：送 Graph `sendMail` JSON payload
- IMAP/SMTP：走 SMTP 直發

## 資料儲存分工

### Neon / PostgreSQL

保存：

- accounts
- oauth_apps
- emails
- attachments metadata
- compose uploads
- sent_messages
- sent_message_attachments

### Cloudflare R2

保存：

- 收件附件物件
- compose 臨時上傳檔
- sent history 對應附件物件

## 安全邊界

- 憑據在入庫前會用 **AES-256-GCM** 加密
- OAuth client secret 只保留在服務端
- 附件下載走服務端代理，避免把原始 object key 暴露給瀏覽器
- `CRON_SECRET` 保護同步入口
- GitHub owner session 保護應用訪問
- 郵箱 OAuth callback state 會簽名並綁定目前 session

## 如果你在讀程式碼，建議先看哪幾塊

### 想理解「為什麼它能登入」

先看：

- GitHub OAuth 相關 route / session 邏輯
- `src/lib/session*`
- `src/lib/secrets*`

### 想理解「為什麼它能同步郵件」

先看：

- 同步 action / route
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### 想理解「為什麼它能發信和傳附件」

先看：

- compose 頁面與 send action
- provider 的 `sendMail` 實作
- R2 物件儲存邏輯

## 哪些是刻意還沒做的

以下這些不是忘了，而是目前有意識地先收斂範圍：

- 多使用者協作角色
- 所有 triage 欄位的 provider 回寫
- 完整 thread-aware reply / forward
- remote draft sync
- 完整鏡像整個信箱體系

這些功能都很有價值，但也會大幅提高複雜度。Origami 目前優先保證的是：

> 在單使用者場景裡，核心路徑夠快、夠穩、夠容易維護。
