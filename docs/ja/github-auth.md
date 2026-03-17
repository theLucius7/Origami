# GitHub Auth 詳細設定

このページでは **本番環境の Origami に GitHub ログインを設定する方法** だけを扱います。

これは Origami 自体へのログイン設定であり、Gmail / Outlook のメール接続設定ではありません。

## 最終的に `.env` に入れる値

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

## 公式リファレンス

- GitHub: OAuth App の作成  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## 先にメモしておく値

```txt
本番 URL
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/auth/github/callback

許可する GitHub login
your-github-login
```

## 行き来する場所

### 場所 A: GitHub 設定画面

ここで行うこと：

- OAuth App の作成
- Homepage URL の入力
- Authorization callback URL の入力
- Client Secret の生成

### 場所 B: Origami の `.env`

ここに値を戻します：

```txt
NEXT_PUBLIC_APP_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ALLOWED_LOGIN=
AUTH_SECRET=
```

## クリック手順

### 1. GitHub の OAuth App 画面を開く

GitHub で次の順に進みます。

1. 右上のアバター
2. **Settings**
3. **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

### 2. OAuth App フォームを入力する

#### Application name

```txt
Origami Production
```

#### Homepage URL

```txt
https://mail.example.com
```

#### Application description

任意ですが、たとえば次のように書けます。

```txt
Single-user inbox login for Origami
```

#### Authorization callback URL

ここは必ず次の値にします。

```txt
https://mail.example.com/api/auth/github/callback
```

ホーム URL をそのまま入れてしまうのが最も多いミスです。正しい値には `/api/auth/github/callback` が必須です。

### 3. アプリを登録する

- **Register application**

### 4. Client Secret を生成する

アプリ詳細画面で：

- **Generate a new client secret**

次の 2 つを必ずコピーします。

1. **Client ID**
2. **Client Secret**

## `.env` に戻って記入する

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

`AUTH_SECRET` がまだない場合は、次で生成できます。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## テスト前の確認

- `NEXT_PUBLIC_APP_URL` は本番ドメインか
- GitHub の **Homepage URL** はそれと一致しているか
- GitHub の **Authorization callback URL** は `<APP_URL>/api/auth/github/callback` か
- `GITHUB_ALLOWED_LOGIN` は GitHub の login 名で、メールアドレスではないか
- `AUTH_SECRET` は空ではないか

## 動作確認方法

デプロイ後、次を開きます。

```txt
https://mail.example.com/login
```

期待する流れ：

1. GitHub ログインをクリック
2. GitHub の認可画面へ移動
3. 認可完了
4. Origami に戻る
5. 初回は `/setup` に進む
6. セットアップ完了後にアプリへ入れる

## よくあるエラー

### 1. GitHub ログイン直後に callback error

まず次の 3 つを確認します。

- `NEXT_PUBLIC_APP_URL`
- GitHub Homepage URL
- GitHub Authorization callback URL

### 2. ログイン画面は開くのに入れない

```txt
GITHUB_ALLOWED_LOGIN=
```

これが設定されている場合、その GitHub login だけがログインできます。

### 3. すべて正しく見えるのに失敗する

次の 3 行を並べて一字ずつ確認してください。

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

正しい callback は必ず：

```txt
<APP_URL>/api/auth/github/callback
```
