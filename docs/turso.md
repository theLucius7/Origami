# Turso 数据库说明已迁移

Origami 现在已经从 **Turso / libSQL** 迁移到 **Neon / PostgreSQL**。

请改看：

- [Neon PostgreSQL 详细配置](/neon)

如果你是在升级旧部署，请把下面这两项旧变量移除：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

改为：

- `DATABASE_URL`
