# Gmail OAuth 詳細設定

このページでは **本番環境の Origami に Gmail を接続する方法** を扱います。

GitHub ログインは Origami に入るための設定です。Gmail OAuth は Gmail メールボックスへのアクセスを許可する設定です。

## 最終的に `.env` に入れる値

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

## 公式リファレンス

- Google Workspace API を有効化  
  <https://developers.google.com/workspace/guides/enable-apis>
- OAuth consent screen の設定  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- OAuth credentials の作成  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail scopes 参照  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

## Origami が現在要求する Gmail scopes

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

## 先にメモしておく値

```txt
本番 URL
https://mail.example.com

Google OAuth Redirect URI
https://mail.example.com/api/oauth/gmail

Google Cloud Project 名
Origami Gmail Production

Consent Screen App 名
Origami Gmail Production
```

## 行き来する場所

### 場所 A: Google Cloud Console

ここで行うこと：

- project の作成または選択
- Gmail API の有効化
- OAuth consent screen の設定
- Web OAuth client の作成

### 場所 B: Origami の `.env`

ここに値を戻します：

```txt
NEXT_PUBLIC_APP_URL=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```

## クリック手順

### 1. Google Cloud Console を開く

- <https://console.cloud.google.com/>

### 2. 専用 Project を作成または選択する

推奨プロジェクト名：

```txt
Origami Gmail Production
```

### 3. Gmail API を有効化する

次の順に進みます。

1. **APIs & Services**
2. **Library**
3. `Gmail API` を検索
4. 開く
5. **Enable** をクリック

### 4. OAuth consent screen を設定する

よくある導線：

1. **Google Auth platform**
2. **Branding**
3. **Audience**
4. **Data Access**

推奨値：

- **App name**: `Origami Gmail Production`
- **User support email**: あなたのメールアドレス
- **Developer contact email**: あなたのメールアドレス

自分用の自前運用なら、通常は `External` を選び、実際に使う Google アカウントを **Test users** に追加します。

### 5. OAuth Client ID を作成する

- **OAuth client ID**
- アプリ種別：**Web application**

Redirect URI は必ず次です。

```txt
https://mail.example.com/api/oauth/gmail
```

よくあるミス：

- ホーム URL を入れてしまう
- `/api/oauth/gmail` を忘れる
- `NEXT_PUBLIC_APP_URL` と異なるドメインを使う

### 6. Client ID と Client Secret を保存する

表示された 2 つの値をすぐにコピーします。

## `.env` に戻って記入する

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

## テスト前の確認

- 現在の Google Cloud Project は正しいか
- Gmail API は有効か
- consent screen は設定済みか
- OAuth client タイプは **Web application** か
- redirect URI は `<APP_URL>/api/oauth/gmail` と一致しているか
- `.env` の client id / secret はこの client のものか

## 動作確認方法

デプロイ後：

1. Origami にログイン
2. `/accounts` を開く
3. Gmail アカウント追加を選ぶ
4. Google の認可フローを完了する
5. Origami に戻る

期待する結果：

- `/accounts` に Gmail アカウントが表示される
- 同期できる
- 閲覧できる
- 送信できる

## よくあるエラー

### 1. `redirect_uri_mismatch`

まず次の 3 つを比較します。

- Google Cloud 側の redirect URI
- `NEXT_PUBLIC_APP_URL`
- 実際の callback `/api/oauth/gmail`

### 2. 認可画面は開くのに戻りが失敗する

多くは redirect URI の誤り、または `.env` に別の client を入れてしまったケースです。

### 3. testing / app not verified 関連の警告が出る

確認する点：

- Audience は `External` か
- 利用する Google アカウントが **Test users** に入っているか

### 4. 認可成功後に送信権限エラーが出る

必要な scopes を確認します。

- `gmail.send`
- `gmail.modify`
