# Neon PostgreSQL 详细配置

这页只讲一件事：**怎么为生产环境的 Origami 准备一个可直接使用的 Neon PostgreSQL 数据库**。

## 这页会帮你拿到什么

按这页做完，你应该能拿到并确认这几项：

- 一个已经创建好的 Neon project
- 一个用于 Origami 的数据库
- 一条可直接填回 `.env` 的 `DATABASE_URL`
- 一套可以执行 `npm run db:setup` 的基础配置

## 最终你要填回 `.env` 的值

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## 官方参考

- Neon Docs  
  <https://neon.tech/docs>
- Neon Console  
  <https://console.neon.tech/>
- Neon Pricing  
  <https://neon.tech/pricing>

## 推荐流程

1. 在 Neon 控制台创建 project
2. 选择离部署区域更近的 region
3. 确认给 Origami 使用的 database / branch
4. 从控制台复制完整 PostgreSQL 连接串
5. 原样填入 `DATABASE_URL`
6. 在项目目录执行 `npm run db:setup`

## 关键操作

### 1. 登录 Neon

打开：

- <https://console.neon.tech/>

### 2. 创建 project

建议名称：

```txt
origami-prod
```

### 3. 确认 database / branch

重点不是按钮长什么样，而是确认：

- 生产环境连的是哪个 project
- 生产环境连的是哪个 database
- 不要误连到测试 branch / 测试库

### 4. 复制连接串

常见形式类似：

```txt
postgresql://user:password@ep-example-pooler.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

> 最稳的做法是**原样复制** Neon 给出的完整连接串。  
> 不要手工删掉 `sslmode=require`，也不要自己拼 host、用户名或参数。

Origami 现在使用 `postgres` 驱动，Neon 的 pooled / direct URL 都可以用；保留完整 URL 即可。

### 5. 填入 `.env`

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## 怎么验证配置真的好了

把 `DATABASE_URL` 填进 `.env` 后，在项目目录执行：

```bash
npm install
npm run db:setup
```

如果数据库连接没问题，这一步应该能正常完成。

## 最常见错误

### 1. 还在使用旧的 Turso 变量

Origami 现在不再使用：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

请改为：

- `DATABASE_URL`

### 2. 手工改坏了 Neon 连接串

请确认：

- 连接串直接来自 Neon 控制台
- 没有删掉查询参数
- 没有把 production project 和 development project 搞混

### 3. 连到了错误的 branch 或数据库

如果你同时有多个 branch / database，请务必确认：

- `.env` 里填的是哪一个
- 当前部署连的是哪一个
- `db:setup` 跑的是哪一个
