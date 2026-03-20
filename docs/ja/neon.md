# Neon PostgreSQL 詳細設定

このページでは **Origami 本番環境向けの Neon PostgreSQL データベースを用意する方法** だけを説明します。

## このページで手に入るもの

読み終える頃には、次を確認できるはずです。

- 作成済みの Neon project
- Origami 用の database
- `.env` に貼り付けられる完全な `DATABASE_URL`
- `npm run db:setup` を実行できる基本構成

## 最終的に `.env` に入れる値

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## 公式リファレンス

- Neon Docs  
  <https://neon.tech/docs>
- Neon Console  
  <https://console.neon.tech/>
- Neon Pricing  
  <https://neon.tech/pricing>

## 推奨フロー

1. Neon で project を作る
2. デプロイ先に近い region を選ぶ
3. Origami で使う database / branch を確認する
4. ダッシュボードから完全な PostgreSQL 接続文字列をコピーする
5. そのまま `DATABASE_URL` に貼り付ける
6. `npm run db:setup` を実行する

## 主要ステップ

### 1. Neon にログインする

開く場所：

- <https://console.neon.tech/>

### 2. project を作成する

名前の例：

```txt
origami-prod
```

### 3. database / branch を確認する

重要なのは次です。

- 本番がどの project を使うか把握している
- 本番がどの database を使うか把握している
- テスト branch / test DB を向いていない

### 4. 接続文字列をコピーする

例：

```txt
postgresql://user:password@ep-example-pooler.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

> もっとも安全なのは、Neon が表示した接続文字列を**そのまま**コピーすることです。  
> `sslmode=require` を削除したり、host や query parameter を手で組み直したりしないでください。

Origami は現在 `postgres` ドライバを使っており、Neon の pooled / direct URL の両方を利用できます。完全な URL をそのまま使ってください。

### 5. `.env` に入れる

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## 動作確認方法

`DATABASE_URL` を `.env` に入れたあと、次を実行します。

```bash
npm install
npm run db:setup
```

接続が正しければ、正常に完了するはずです。

## よくあるミス

### 1. まだ古い Turso 変数を使っている

Origami は次を使いません。

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

使うのは次です。

- `DATABASE_URL`

### 2. Neon の接続文字列を手で壊してしまう

確認事項：

- URL は Neon ダッシュボードから直接コピーした
- query parameter を削除していない
- 本番 project と開発 project を取り違えていない

### 3. 間違った branch / database を向いている

複数の branch / database がある場合は、次を確認してください。

- `.env` に入っているのはどれか
- デプロイが使っているのはどれか
- `db:setup` が実行されたのはどれか
