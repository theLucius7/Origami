# アーキテクチャ

このページでは、現在のコードに実装されている Origami の構成を説明します。

## 全体像

```text
Browser
  -> Next.js Proxy
  -> App Router pages / Server Actions / Route Handlers
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

## 設計方針

### 単一ユーザー優先

Origami は一人のオペレーターが複数 inbox を扱うことに最適化されています。

### ローカル生産性レイヤー優先

- Done / Archive / Snooze はローカル状態
- Read / Star は任意同期状態

### metadata-first 同期

初回同期では軽量メタデータを優先し、本文や添付は必要時に取得します。

## 同期フロー

```text
sync trigger
  -> syncSingleAccount / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist metadata
  -> fetch and store binary data only when needed
  -> update cursor + lastSyncedAt
```

同期モデルには次の意図的な挙動があります。

- 可能な限り remote の `isRead` / `isStarred` を保持し、再同期で状態を既定値に戻さない
- Outlook delta の `@removed` tombstone はローカルの `REMOTE_REMOVED` 状態に変換されるため、remote 側で削除されたメールや Inbox 外へ移動したメールは既定の Inbox 一覧から消える
- 同じ remote message が後で Inbox に戻れば、通常同期で再び表示できる

## 本文補完とランタイム状態

Origami は次の状態を明示的に記録します。

- 本文補完状態（`pending` / `hydrated` / `failed`）
- 直近の本文補完エラー
- Read / Star write-back 状態（`pending` / `success` / `failed`）

これらは Accounts ページに集約されるため、本文補完の失敗なのか、権限不足なのか、write-back 実行失敗なのかをすぐ切り分けられます。

## OAuth app 解決モデル

Gmail / Outlook では次の二系統をサポートします。

- env 既定 app
- DB 管理 app

解決順序：

1. `oauth_app_id` があればそれを使う
2. なければ `default`
3. `default` は環境変数から解決

## 送信フロー

```text
Compose form
  -> upload compose attachments
  -> send action
  -> provider.sendMail()
  -> persist local sent record
```

- Gmail は MIME raw を送信
- Outlook は Graph JSON を送信
- IMAP/SMTP は SMTP で送信

## 保存先の分担

### Turso / libSQL

- accounts
- oauth_apps
- emails
- attachment metadata
- compose uploads
- sent history metadata

### Cloudflare R2

- 添付ファイル本体
- compose 一時アップロード
- sent history 用添付オブジェクト
