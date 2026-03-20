# Turso 資料庫說明已遷移

Origami 現在已經從 **Turso / libSQL** 遷移到 **Neon / PostgreSQL**。

請改看：

- [Neon PostgreSQL 詳細配置](/zh-tw/neon)

如果你是在升級舊部署，請把下面這兩項舊變數移除：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

改為：

- `DATABASE_URL`
