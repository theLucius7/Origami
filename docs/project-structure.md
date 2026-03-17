# 项目结构

这一页不是“列目录”，而是帮助你快速判断：**想改什么，应该从哪里下手。**

## 仓库根目录

```text
.
├── docs/                # VitePress 文档站
├── drizzle/             # 历史 SQL migration 与 journal
├── scripts/             # 辅助脚本（按用途分组）
├── src/                 # 应用源码
├── .env.example         # 环境变量模板
├── drizzle.config.ts    # Drizzle 配置
├── eslint.config.mjs    # ESLint flat config
├── next.config.ts       # Next.js 配置
├── package.json         # 依赖与脚本
├── vercel.json          # Vercel cron / 部署配置
└── ...
```

## 根目录里这些文件为什么不算“乱”

因为这里大多数都是标准 Web 项目需要的配置：

- Next.js 自己需要的配置
- Vercel 部署配置
- TypeScript / ESLint / PostCSS 配置
- Drizzle schema / migration 配置

真正和项目业务强相关的内容，还是集中在：

- `src/`
- `docs/`
- `drizzle/`
- `scripts/`

## `scripts/` 现在怎么组织

```text
scripts/
├── README.md
├── bench/
│   └── seed-search-benchmark.mjs
└── db/
    └── push.mjs
```

设计原则是：**把运维辅助脚本留在仓库里，但不要让它们散落在根目录。**

## `src/` 总体结构

```text
src/
├── app/
├── components/
├── config/
├── hooks/
├── lib/
└── proxy.ts
```

### `src/app/`

放：

- App Router 路由
- 页面
- Server Actions
- Route Handlers

### `src/components/`

放界面组件，按功能分组，例如：

- `accounts/`
- `compose/`
- `inbox/`
- `layout/`
- `sent/`
- `sync/`
- `ui/`

### `src/lib/`

这是主要业务逻辑层，重点包括：

- `db/`：schema 与数据库访问基础
- `queries/`：读取型数据访问
- `services/`：更高层的编排逻辑
- `providers/`：Gmail / Outlook / IMAP/SMTP 集成
- `oauth-apps.ts`：OAuth app 解析与管理逻辑

## 想改某个功能时，看哪里

### 改收件箱行为

看：

- `src/app/(app)/page.tsx`
- `src/components/inbox/*`
- `src/app/actions/email.ts`
- `src/lib/queries/emails.ts`
- `src/lib/services/email-service.ts`

### 改账号接入 / OAuth app 管理

看：

- `src/app/(app)/accounts/page.tsx`
- `src/app/actions/account.ts`
- `src/app/actions/oauth-apps.ts`
- `src/components/accounts/*`
- `src/lib/oauth-apps.ts`
- `src/lib/queries/oauth-apps.ts`

### 改同步行为

看：

- `src/app/actions/sync.ts`
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### 改发信 / 已发送历史

看：

- `src/app/(app)/compose/page.tsx`
- `src/components/compose/*`
- `src/app/actions/send.ts`
- `src/lib/queries/sent-messages.ts`
- `src/lib/providers/gmail.ts`
- `src/lib/providers/outlook.ts`
- `src/lib/providers/imap-smtp/provider.ts`

## `drizzle/` 为什么保留很多 migration

因为这代表的是**项目历史升级路径**。  
对于新部署，你不必逐个理解这些 migration；直接用 `npm run db:setup` 即可。

但对于已有环境升级，它们仍然有价值，所以不会粗暴删除。

## 推荐阅读顺序

如果你是新贡献者：

1. 先读 [快速开始](/quick-start)
2. 再读 [架构说明](/architecture)
3. 最后再看这页和具体源码
