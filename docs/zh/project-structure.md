# 项目结构

Origami 目前采用的是一种**混合式 Next.js App Router 结构**：

- 路由文件在 `src/app`
- 共享 UI 在 `src/components`
- 业务逻辑在 `src/lib`
- 运行时 / 配置辅助代码在 `src/config`
- 共享客户端 hooks 在 `src/hooks`

## 顶层源码布局

```text
src/
├── app/
├── components/
├── config/
├── hooks/
├── lib/
└── proxy.ts
```

## `src/app/`

`src/app` 包含路由分组、layout、API routes 和 Server Actions。

```text
src/app/
├── (app)/
├── (auth)/
├── actions/
├── api/
├── globals.css
└── layout.tsx
```

### 关键点

- `(app)` 放已鉴权的应用页面
- `(auth)` 当前放登录相关路由组
- `actions/` 存放账户管理、同步、邮件操作、发信流程等 Server Actions
- `api/` 只用于确实需要外部回调或流式输出的场景

## `src/components/`

组件按功能分组，而不是全部平铺在一个目录中。

```text
src/components/
├── accounts/
├── compose/
├── inbox/
├── layout/
├── providers/
├── sent/
├── sync/
└── ui/
```

### 各组职责

- `accounts/` — 账号卡片与添加账号弹窗
- `compose/` — 撰写入口与 compose form
- `inbox/` — inbox 外壳、邮件列表、邮件详情、snooze 弹窗
- `layout/` — 主侧边栏结构
- `providers/` — `ToastProvider` 这类应用级 provider
- `sent/` — 已发送列表与详情视图
- `sync/` — 同步按钮
- `ui/` — shadcn/ui 基础组件

## `src/config/`

集中管理运行时和 provider 配置。

```text
src/config/
├── db.ts
├── env.ts
├── providers.server.ts
├── providers.ts
└── r2.ts
```

### 这里主要放什么

- `env.ts` — 必需环境变量读取 helper
- `db.ts` — Turso / libSQL 连接配置
- `r2.ts` — R2 client 配置
- `providers.ts` — UI 用的 provider 标签与颜色
- `providers.server.ts` — OAuth / provider 的服务端配置

## `src/hooks/`

目前主要用于一些可复用的客户端 hooks。

```text
src/hooks/
└── use-toast.ts
```

## `src/lib/`

这里是主要的业务逻辑层。

```text
src/lib/
├── db/
├── providers/
├── queries/
├── services/
├── account-providers.ts
├── actions.ts
├── auth.ts
├── crypto.ts
├── format.ts
├── r2.ts
└── ...
```

### 关键子目录

#### `src/lib/db/`

- Drizzle schema
- Drizzle db client
- migration runner

#### `src/lib/providers/`

provider 实现以及共用类型：

- Gmail
- Outlook
- IMAP/SMTP provider + QQ 兼容封装
- MIME helpers
- provider interface definitions

#### `src/lib/queries/`

偏读取的数据访问层：

- accounts
- emails
- sent messages

#### `src/lib/services/`

比单一 query 更高一层的写入 / 编排逻辑：

- sync orchestration
- lazy email hydration

## `src/proxy.ts`

应用的全局请求守卫。

它会放行公开的 auth / cron 路由，并用 `ACCESS_TOKEN` 保护主应用。

## 快速定位文件

### 如果你想改 inbox 行为

重点看：

- `src/app/(app)/page.tsx`
- `src/components/inbox/*`
- `src/app/actions/email.ts`
- `src/lib/queries/emails.ts`
- `src/lib/services/email-service.ts`

### 如果你想改同步行为

重点看：

- `src/app/actions/sync.ts`
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### 如果你想改 compose / sent 流程

重点看：

- `src/app/(app)/compose/page.tsx`
- `src/components/compose/*`
- `src/app/actions/send.ts`
- `src/lib/providers/gmail.ts`
- `src/lib/providers/outlook.ts`

### 如果你想改部署 / 运行时配置

重点看：

- `src/config/*`
- `.env.example`
- `vercel.json`
- `drizzle.config.ts`

## 为什么这样组织

这个结构是针对当前项目规模做的折中：

- 共享 UI 更容易找
- Server Actions 仍然贴近 App Router 层
- 数据访问和编排逻辑放在 `lib`
- provider / runtime 配置集中管理，不会散在项目各处

它还不是那种彻底 feature-first 的大一统结构，但对于一个持续长大的 Next.js 应用来说，是个比较稳的中间形态。
