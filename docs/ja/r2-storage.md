# Cloudflare R2 / Bucket 詳細設定

このページは **Origami の添付ファイル保存先をどう設定するか** だけを説明します。

Origami は添付を Cloudflare R2 に保存します。メール添付のような大きいバイナリを DB に直接入れない方が扱いやすいためです。

## 最終的に設定する環境変数

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

必要に応じて：

```txt
R2_ACCOUNT_ID=...
```

現在の runtime では必須ではありませんが、トラブルシュートには役立ちます。

## 公式リンク

- Cloudflare R2: bucket 作成  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2: API token / 認証  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare: Account ID の確認  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

## Origami が R2 に本当に必要としているもの

シンプルに言うと 4 つです。

1. bucket 名
2. Access Key ID
3. Secret Access Key
4. S3 互換 endpoint

この 4 つが正しければ、Origami は添付の upload / download ができます。

## ベビーステップ: R2 をゼロから設定する

### Step 1: Cloudflare Dashboard にログイン

開く：

- <https://dash.cloudflare.com/>

### Step 2: Account ID を確認する

まだ Account ID が分からない場合：

1. Cloudflare Dashboard を開く
2. **Account home** または **Workers & Pages** に移動
3. **Account ID** を探す
4. コピーする

公式説明：

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

後で `R2_ENDPOINT` を組み立てる時に使います。

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### Step 3: bucket を作る

開く：

- **R2 Object Storage**

そこで bucket を作成します。

おすすめ名：

- `origami-attachments-dev`
- `origami-attachments-prod`

環境がすぐ分かる名前にしておくと事故が減ります。

> おすすめ: local/dev と production は bucket を分ける。

公式説明：

- <https://developers.cloudflare.com/r2/buckets/create-buckets/>

### Step 4: R2 API token を作る

Cloudflare Dashboard で次へ：

- **R2 Object Storage**
- **Manage R2 API tokens**

そこで次のどちらかを作成します。

- **Create Account API token**
- **Create User API token**

個人運用ならどちらでも動くことが多いですが、最小権限の考え方としては：

- **Object Read & Write**
- さっき作った bucket のみに scope

が安全です。

公式説明：

- <https://developers.cloudflare.com/r2/api/tokens/>

### Step 5: Access Key / Secret Access Key を保存する

token 作成後に表示される：

- **Access Key ID**
- **Secret Access Key**

を保存して、次へ入れます。

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

> Secret は後で再表示されないことが多いので、必ず先に保存してください。

### Step 6: bucket 名を入れる

作成した bucket 名をそのまま入れます。

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

### Step 7: endpoint を入れる

endpoint の形式は：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

例：

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

`R2_ACCOUNT_ID` も残したいなら：

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

## 最小 `.env` 例

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

## 設定後の確認方法

一番簡単なのは：

1. Origami を起動
2. ログイン
3. compose を開く
4. 小さな添付をアップロード
5. 送信または一連のフローを完了
6. 後で添付ダウンロードも確認

upload / download が両方通れば、R2 の設定はほぼ正しいです。

## よくある問題

### 1. endpoint が間違っている

最も多いです。`R2_ENDPOINT` はフルで：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

を入れてください。

### 2. Access Key と Secret を逆に入れた

よくあります。

- `R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` は別物です

### 3. token に object read/write 権限がない

権限が小さすぎると、Origami は起動しても添付 upload が失敗します。

最小推奨：

- **Object Read & Write**
- 対象 bucket に scope

### 4. bucket 名や環境が食い違っている

例えば：

- production が dev bucket を向いている
- bucket 自体が作られていない

この場合、見た目は「upload failure」でも本質は bucket mismatch です。

### 5. 別アカウントの Account ID を使っている

Cloudflare account を複数持っていると起きやすいです。

すると endpoint はもっともらしく見えても、token と bucket が一致しません。

## 実運用でのおすすめ

一番安全なのは：

1. `origami-attachments-dev` と `origami-attachments-prod` を分ける
2. token 権限は **Object Read & Write** のみにする
3. token は単一 bucket に scope する
4. `R2_ACCOUNT_ID` も `.env` に残しておく

## 次に読むページ

- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Outlook OAuth 詳細設定](/ja/outlook-oauth)
