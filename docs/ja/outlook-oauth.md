# Outlook OAuth 詳細設定

このページでは **本番環境の Origami に Outlook / Microsoft 365 を接続する方法** を扱います。

GitHub ログインは Origami に入るための設定です。Outlook OAuth はメールボックスへのアクセス設定です。

## 最終的に `.env` に入れる値

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 公式リファレンス

- Entra アプリ登録  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Redirect URI の追加  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- client secret の管理  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

## Origami が現在要求する scopes

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

## 先にメモしておく値

```txt
本番 URL
https://mail.example.com

Microsoft Redirect URI
https://mail.example.com/api/oauth/outlook

App registration 名
Origami Outlook Production
```

## 行き来する場所

### 場所 A: Microsoft Entra admin center

ここで行うこと：

- アプリ登録
- Authentication 設定
- Client Secret 作成
- Microsoft Graph 権限追加

### 場所 B: Origami の `.env`

ここに値を戻します：

```txt
NEXT_PUBLIC_APP_URL=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

## クリック手順

### 1. Microsoft Entra Admin Center を開く

- <https://entra.microsoft.com>

複数テナントがある場合は、対象テナントに切り替えてください。

### 2. アプリを登録する

次の順に進みます。

1. **Entra ID**
2. **App registrations**
3. **New registration**

推奨名：

```txt
Origami Outlook Production
```

多くの Outlook / Microsoft アカウントを扱うなら、組織アカウントと個人 Microsoft アカウントの両方を含む Supported account types を選ぶのが無難です。

### 3. Web Redirect URI を追加する

次の順に進みます。

1. **Manage**
2. **Authentication**
3. **Add a platform**
4. **Web** を選択

Redirect URI は必ず次です。

```txt
https://mail.example.com/api/oauth/outlook
```

よくあるミス：

- ホーム URL を入れてしまう
- `/api/oauth/outlook` を忘れる
- `NEXT_PUBLIC_APP_URL` と違うドメインを使う

### 4. Client Secret を作成する

次の順に進みます。

1. **Certificates & secrets**
2. **New client secret**

保存する値：

- Application (client) ID
- Client secret Value

### 5. Microsoft Graph 権限を追加する

次の順に進みます。

1. **API permissions**
2. **Add a permission**
3. **Microsoft Graph**
4. **Delegated permissions**

追加する権限：

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

組織ポリシーで必要な場合は **Grant admin consent** もここで処理します。

## `.env` に戻って記入する

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

## テスト前の確認

- 現在の app registration は正しいか
- Web redirect URI は `<APP_URL>/api/oauth/outlook` と一致しているか
- client id / secret はこのアプリのものか
- `Mail.Read`、`Mail.ReadWrite`、`Mail.Send` が権限に含まれているか

## 動作確認方法

デプロイ後：

1. Origami にログイン
2. `/accounts` を開く
3. Outlook アカウント追加を選ぶ
4. Microsoft の認可フローを完了する
5. Origami に戻る

期待する結果：

- `/accounts` に Outlook アカウントが表示される
- 同期できる
- 閲覧できる
- 送信できる

## よくあるエラー

### 1. `AADSTS50011` / redirect URI mismatch

まず確認する 3 点：

- Entra 側の Web redirect URI
- `NEXT_PUBLIC_APP_URL`
- 実際の callback `/api/oauth/outlook`

### 2. Microsoft 認証後に Origami へ戻れない

多くは client id、client secret、redirect URI のいずれかが誤っています。

### 3. 送信時に権限不足エラーが出る

次の権限があるか確認します。

- `Mail.Send`
- `Mail.ReadWrite`

### 4. 組織内で認可が止まる

テナントポリシーまたは admin consent の問題であることが多いです。
