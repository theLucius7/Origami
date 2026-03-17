# Outlook OAuth 詳細設定

このページは **Outlook / Microsoft 365 アカウントを Origami に接続する方法** を説明します。

GitHub ログインとは別です。  
GitHub ログインは Origami に入るため、Outlook OAuth は Outlook メールボックスへのアクセス権を Origami に渡すためのものです。

## Origami が現在要求する Microsoft scopes

現在のコードでは次を要求します。

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

関連コード：

- `src/lib/providers/outlook.ts`

## 最初に大事なポイント: env 既定 Outlook app は `tenant=common`

環境変数ベースの既定 Outlook app は現在：

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

を使います。

このため向いているのは：

- 個人 Outlook / Hotmail / Live アカウント
- tenant をまだ一つに固定したくない場面

もし一つの組織 tenant にきっちり寄せたいなら、通常は：

- 先に GitHub ログインを済ませる
- `/accounts` で **DB 管理の Outlook OAuth app** を作る
- そこで tenant を明示する

の方がきれいです。

## Outlook OAuth の 2 つの設定方法

### 方法 A: 環境変数の既定 Outlook app（まずはこちら推奨）

`.env` に：

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

### 方法 B: DB 管理の Outlook app

後で必要なら：

- tenant を分けたい
- 環境ごとに複数 app を持ちたい
- app 管理を明示的にしたい

場合にこちらを使います。

## 公式リンク

- Microsoft Entra でアプリ登録  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Redirect URI を追加  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- credentials を追加 / 管理  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

## ベビーステップ: Outlook OAuth App をゼロから作る

### Step 1: Microsoft Entra admin center を開く

開く：

- <https://entra.microsoft.com>

### Step 2: アプリを登録する

次へ進みます。

- **Entra ID** → **App registrations** → **New registration**

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### Name は何にする？

環境が分かる名前がおすすめです。

- `Origami Outlook Local`
- `Origami Outlook Production`

#### Supported account types は何を選ぶ？

ここは迷いやすいポイントです。

##### env 既定 Outlook app を使うなら

より広いタイプ、例えば：

- **Accounts in any organizational directory and personal Microsoft accounts**

が比較的合わせやすいです。

##### 特定の会社 / 組織 tenant だけで使うなら

より狭くしても構いません。  
ただしその場合は、Origami 側では DB 管理 Outlook app の方が長期的には扱いやすいです。

### Step 3: Web Redirect URI を追加する

登録後：

- **Manage** → **Authentication**
- **Add a platform**
- **Web** を選ぶ

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

#### Redirect URI は何を入れる？

- ローカル: `http://localhost:3000/api/oauth/outlook`
- 本番: `https://your-domain/api/oauth/outlook`

`/api/oauth/outlook` まで正確に必要です。

### Step 4: Client Secret を作る

次へ：

- **Certificates & secrets**
- **New client secret**

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

保存する値：

- Application (client) ID → `OUTLOOK_CLIENT_ID`
- Client secret Value → `OUTLOOK_CLIENT_SECRET`

> Client secret は通常一回しかフル表示されません。

### Step 5: Microsoft Graph permissions を追加する

次へ：

- **API permissions**
- **Add a permission**
- **Microsoft Graph**
- **Delegated permissions**

そして Origami が必要な権限を追加します。

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

公式参考：

- <https://learn.microsoft.com/en-us/graph/permissions-reference>

### Step 6: Grant admin consent は必要？

tenant のポリシー次第です。

よくあるケース：

- **個人 Microsoft アカウント / 自分だけのテスト**：ユーザー同意で足りることが多い
- **会社 / 学校 tenant**：管理者が **Grant admin consent** を押す必要があることがあります

ユーザー同意が tenant policy で止まるなら、まずここを疑ってください。

### Step 7: `.env` に入れる

ローカル：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

本番：

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 8: Origami 側で Outlook を接続する

1. Origami を起動
2. まず GitHub ログインを完了
3. `/accounts` を開く
4. Outlook アカウントを追加
5. Microsoft の認可フローを完了
6. Origami に戻る

## よくある問題

### 1. `AADSTS50011` / redirect URI mismatch

定番エラーです。まず確認：

- Entra の Web redirect URI
- `NEXT_PUBLIC_APP_URL`
- Origami の callback `/api/oauth/outlook`

が全部一致しているか。

### 2. Microsoft 側ではログインできるが、Origami に戻って失敗する

確認ポイント：

- local と production の client id を取り違えていないか
- client secret をコピーし間違えていないか
- redirect URI から `/api/oauth/outlook` が抜けていないか

### 3. 後で送信時に権限不足になる

次の権限があるか確認してください。

- `Mail.Send`
- `Mail.ReadWrite`

Origami の送信・write-back はこれらに依存します。

### 4. 個人 Microsoft アカウントで認可できない

まず **Supported account types** を確認してください。  
Outlook.com / Hotmail を使いたいのに単一組織 tenant 専用にしていると、変な問題が起きやすいです。

### 5. 会社 tenant のユーザーが同意できない

多くの場合、Origami のバグではなく tenant policy / admin consent の問題です。

## 実運用でのおすすめ

一番安全なのは：

1. local と production で app registration を分ける
2. 最初は env 既定 app で通す
3. tenant を厳密に扱いたいなら DB 管理 Outlook app に切り替える
4. redirect URI を環境ごとに明確に分ける
5. 先に必要権限を全部入れてから Origami 側でテストする

## 次に読むページ

- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
