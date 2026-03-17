# GitHub Auth 詳細設定

このページは **Origami 本体へのログイン設定** だけを説明します。

メール接続用 OAuth とは別です。

- **GitHub Auth**：Origami にログインするための認証
- **Gmail / Outlook OAuth**：メールアカウントを Origami に接続するための認証

まず Origami に入れる状態まで持っていきたいなら、このページから進めるのが最短です。

## 最終的に設定する環境変数

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

意味は次の通りです。

- `NEXT_PUBLIC_APP_URL`：Origami を開く URL
- `GITHUB_CLIENT_ID`：GitHub OAuth App の Client ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth App の Client Secret
- `GITHUB_ALLOWED_LOGIN`：許可する GitHub login を制限する設定。**公開運用では強く推奨**
- `AUTH_SECRET`：session cookie 署名用の鍵。未設定時は `ENCRYPTION_KEY` にフォールバック

## 公式リンク

- GitHub 公式: OAuth App の作成  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## まず一番シンプルな理解

GitHub OAuth App は、ざっくり言うと次の約束です。

> 「ユーザーが Origami のログインボタンを押したら、認証結果をこの callback URL に返してください」

Origami で一番重要なのはこの値です。

```txt
Authorization callback URL = <アプリURL>/api/auth/github/callback
```

例：

- ローカル: `http://localhost:3000/api/auth/github/callback`
- 本番: `https://mail.example.com/api/auth/github/callback`

## どの構成を選べばいいですか？

### パターン A: ローカル開発だけ

一番簡単です。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

GitHub OAuth App 側には：

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/github/callback`

### パターン B: ローカル用と本番用で OAuth App を分ける（推奨）

おすすめの名前：

1. `Origami Local`
2. `Origami Production`

こうしておくと：

- callback URL を行ったり来たりしない
- 本番 secret をローカルに混ぜにくい
- 後から見てもどの Client ID がどの環境か分かりやすい

### パターン C: 公開単一ユーザー運用（おすすめ）

次も設定してください。

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

これで他人が先に owner を claim するのを防ぎやすくなります。

## ベビーステップ: GitHub OAuth App をゼロから作る

### Step 1: GitHub の OAuth Apps 画面を開く

順番にクリックします。

1. 右上の GitHub アバター
2. **Settings**
3. 左側の **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

初めて作る場合は **Register a new application** と表示されることがあります。

### Step 2: フォームを埋める

#### Application name

環境が分かる名前がおすすめです。

- `Origami Local`
- `Origami Production`

#### Homepage URL

Origami を開く URL を入れます。

- ローカル: `http://localhost:3000`
- 本番: `https://mail.example.com`

#### Application description

任意です。例えば：

```txt
Single-user inbox app login for Origami
```

#### Authorization callback URL

ここが最重要です。正確に入力します。

- ローカル: `http://localhost:3000/api/auth/github/callback`
- 本番: `https://mail.example.com/api/auth/github/callback`

**`/api/auth/github/callback` を省略しないでください。**

### Step 3: アプリを登録する

**Register application** を押します。

登録直後に見えるのは：

- Client ID

Client Secret はまだ別で生成します。

### Step 4: Client Secret を生成する

アプリ詳細ページで：

- **Generate a new client secret**

を押します。

そして次を保存します。

- Client ID → `GITHUB_CLIENT_ID`
- Client Secret → `GITHUB_CLIENT_SECRET`

> Client Secret は通常フル表示が一回だけです。

## Step 5: `.env` に入れる

ローカル例：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

`AUTH_SECRET` がまだない場合は、例えば次で作れます。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Origami を起動する

```bash
npm run dev
```

開く URL：

- `http://localhost:3000`

GitHub ログインボタンが見えるはずです。

## Step 7: 初回 owner バインド

最初のログイン時に Origami は：

1. すでに owner がいるか確認
2. まだいなければ現在の GitHub ユーザーを `app_installation` に保存
3. `/setup` に移動
4. 以後はその owner アカウントでログイン確認

### ここで大事なポイント

初回バインド後、Origami が照合するのは：

- **GitHub user id**

です。login 文字列だけではありません。

そのため：

- GitHub の login 名を変更しても通常は問題ありません
- まったく別の GitHub アカウントに変えた場合は当然入れません

## よくある問題

### 1. ログイン直後に callback error になる

まず確認：

- `NEXT_PUBLIC_APP_URL` が正しいか
- GitHub OAuth App の Homepage URL が環境と一致しているか
- callback URL が `/api/auth/github/callback` まで正確か
- ローカルと本番の Client ID / Secret を取り違えていないか

### 2. ログイン画面は出るが入れない

`GITHUB_ALLOWED_LOGIN` を見てください。

- これが設定されていると、その login だけが通ります
- バグではなく、意図した制限であることが多いです

### 3. owner のはずなのに入れない

最初に owner を claim した GitHub アカウントでログインしているか確認してください。

### 4. 初回に間違った owner を bind してしまった

通常は `app_installation` レコードをクリアして初期化し直す必要があります。

不安なら先に DB をバックアップしてください。

## 実運用でのおすすめ

一番安全なのは：

1. ローカル用 GitHub OAuth App を作る
2. 本番用 GitHub OAuth App を別で作る
3. 公開運用なら必ず `GITHUB_ALLOWED_LOGIN` を入れる
4. `AUTH_SECRET` を明示設定して、長期的には `ENCRYPTION_KEY` と分ける

## 次に読むページ

- [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Outlook OAuth 詳細設定](/ja/outlook-oauth)
