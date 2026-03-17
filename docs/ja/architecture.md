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
