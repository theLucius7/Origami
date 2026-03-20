# Turso ガイドは移動しました

Origami は **Turso / libSQL** から **Neon / PostgreSQL** へ移行しました。

代わりに次を読んでください。

- [Neon PostgreSQL 詳細設定](/ja/neon)

古いデプロイを更新する場合は、次の旧変数を削除してください。

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

代わりに使うのは次です。

- `DATABASE_URL`
