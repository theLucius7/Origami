# デプロイ

最短ルートは次の通りです。  
**`.env` を埋める → `npm run db:setup` → Vercel にデプロイ → `/accounts` でアカウント接続**

## 推奨構成

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Object storage:** Cloudflare R2
- **Providers:** Gmail API, Microsoft Graph, 国内 IMAP/SMTP

## 環境変数

### App

| 変数 | 必須 | 説明 |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | はい | OAuth callback に使う公開 URL |
| `ACCESS_TOKEN` | はい | 単一ユーザー用ログイントークン |
| `CRON_SECRET` | はい | `/api/cron/sync` 用 Bearer トークン |
| `ENCRYPTION_KEY` | はい | 64 文字の 16 進 AES-256-GCM キー |

### Database

| 変数 | 必須 | 説明 |
|---|---:|---|
| `TURSO_DATABASE_URL` | はい | Turso / libSQL URL |
| `TURSO_AUTH_TOKEN` | はい | Turso token |

### Storage

| 変数 | 必須 | 説明 |
|---|---:|---|
| `R2_ACCESS_KEY_ID` | はい | R2 access key |
| `R2_SECRET_ACCESS_KEY` | はい | R2 secret key |
| `R2_BUCKET_NAME` | はい | 添付用バケット |
| `R2_ENDPOINT` | はい | S3-compatible endpoint |

## DB 初期化

新規データベースでは：

```bash
npm run db:setup
```

他の選択肢：

- `npm run db:migrate`
- `npm run db:push`

## OAuth 設定

### Gmail

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

### Outlook

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

## 本番チェック

- `ACCESS_TOKEN` でログインできる
- `/accounts` が開く
- OAuth callback が動く
- IMAP/SMTP アカウント追加ができる
- 同期が動く
- 添付の upload / download が動く
- compose が動く
- `npm run verify` が通る
