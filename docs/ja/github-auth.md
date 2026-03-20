# GitHub Auth 詳細設定

このページでは **本番環境の Origami に GitHub ログインを設定する方法** だけを扱います。

これは Origami 自体へのログイン設定であり、Gmail / Outlook のメール接続設定ではありません。

## このページで最終的に揃うもの

このページを終えるころには、次を確認できるはずです。

- Origami ログイン専用の GitHub OAuth App
- 正しい **Homepage URL**
- 正しい **Authorization callback URL**
- `.env` に入れる `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- 明確な `GITHUB_ALLOWED_LOGIN`

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
https://mail.example.com/api/better-auth/callback/github

許可する GitHub login
your-github-login
```

> `mail.example.com` は例です。必ず自分の本番ドメインに置き換えてください。
>
> 最初から一時的な `*.vercel.app` ドメインで本番用 OAuth App を作るのはおすすめしません。後で正式ドメインに切り替えるなら、GitHub 側も更新が必要になります。

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
https://mail.example.com/api/better-auth/callback/github
```

最も多いミスは、ホーム URL をそのまま入れてしまうことです。正しい値には `/api/better-auth/callback/github` が必要です。

### 3. アプリを登録する

- **Register application**

### 4. Client Secret を生成する

アプリ詳細画面で：

- **Generate a new client secret**

次の 2 つを必ずコピーします。

1. **Client ID**
2. **Client Secret**

> Client Secret は作成時が一番取りやすいです。閉じてから慌てないよう、その場で控えてください。

## `.env` に戻って記入する

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=generate-a-random-32-byte-secret
```

`AUTH_SECRET` がまだない場合は、次で生成できます。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## テスト前の確認

- `NEXT_PUBLIC_APP_URL` は本番ドメインか
- GitHub の **Homepage URL** はそれと一致しているか
- GitHub の **Authorization callback URL** は `<APP_URL>/api/better-auth/callback/github` か
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

余裕があれば、さらに次も確認すると安心です。

1. 一度ログアウトして再度ログインできるか
2. owner アカウントで問題なく入り直せるか
3. 関係ない GitHub アカウントが誤って入れないか

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
<APP_URL>/api/better-auth/callback/github
```

### 4. 本番ドメイン変更後に急に壊れた

Origami 側ではなく、GitHub OAuth App に古いドメインが残っていることが多いです。

### 5. 初回セットアップで間違った owner を確定してしまった

これは OAuth App 自体の問題ではなく、初期化を誤った GitHub アカウントで完了したケースです。通常は install 記録を片付けてやり直す必要があります。

## 一言での合格ライン

指定した GitHub アカウントで Origami に正常ログインでき、別アカウントが誤って入れなければ、この設定はほぼ完了です。
