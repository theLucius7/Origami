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
| `GITHUB_CLIENT_ID` | はい | GitHub OAuth app client id |
| `GITHUB_CLIENT_SECRET` | はい | GitHub OAuth app client secret |
| `ENCRYPTION_KEY` | はい | 64 文字の 16 進 AES-256-GCM キー |
| `GITHUB_ALLOWED_LOGIN` | いいえ | 許可する GitHub login を制限する任意設定 |
| `AUTH_SECRET` | いいえ | session 署名鍵。未設定時は `ENCRYPTION_KEY` にフォールバック |
| `CRON_SECRET` | いいえ | `/api/cron/sync` 用 Bearer トークン。明示設定を推奨 |

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

## GitHub Auth 設定

Origami 自体へのログイン用に、GitHub OAuth App を作成します。

### GitHub OAuth App に入れる値

GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App** で、次を設定します。

- **Application name**: `Origami Local` / `Origami Production`
- **Homepage URL**: アプリの URL
- **Authorization callback URL**: `<APP_URL>/api/auth/github/callback`

例：

- ローカル
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/github/callback`
- 本番
  - Homepage URL: `https://mail.example.com`
  - Callback URL: `https://mail.example.com/api/auth/github/callback`

作成後、生成された値を次へ入れます。

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### おすすめの GitHub Auth 構成

#### パターン A: ローカル開発専用の OAuth App

素早く試すだけならこれで十分です。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

#### パターン B: ローカル / 本番で OAuth App を分ける（推奨）

- local: `http://localhost:3000/api/auth/github/callback`
- production: `https://your-domain/api/auth/github/callback`

callback URL の衝突を避けやすく、secret の管理も楽です。

#### パターン C: 公開単一ユーザー運用 + `GITHUB_ALLOWED_LOGIN`

公開 URL で運用するなら、次を設定するのがおすすめです。

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

これで想定外のユーザーが先に owner を claim するのを防ぎやすくなります。

### 初回 owner バインドについて

- 最初に条件を満たしてログインした GitHub ユーザーが owner になります
- 以後は GitHub の user id で照合します
- login 名を変更しても、同じ GitHub アカウントなら通常は継続ログインできます

### よくあるハマりどころ

- `NEXT_PUBLIC_APP_URL` と GitHub 側の URL は一致させる
- callback URL は `/api/auth/github/callback` まで正確に書く
- ドメイン変更時は GitHub 側と env の両方を更新する
- auth 署名を暗号化キーと分離したいなら `AUTH_SECRET` を設定する

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

## さらに詳しいガイド

このページの要約版だけでなく、ボタンごとの手順で見たい場合は次へ進んでください。

- [GitHub Auth 詳細設定](/ja/github-auth)
- [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Outlook OAuth 詳細設定](/ja/outlook-oauth)

## 本番チェック

- GitHub サインイン後に `/setup` またはホームへ進める
- `/accounts` が開く
- OAuth callback が動く
- IMAP/SMTP アカウント追加ができる
- 同期が動く
- 添付の upload / download が動く
- compose が動く
- `npm run verify` が通る
