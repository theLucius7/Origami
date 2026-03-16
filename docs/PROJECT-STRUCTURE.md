# Project Structure

本文档从目录、职责和维护视角说明 Origami 项目结构。

## 1. 顶层结构

```text
Origami/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── PROJECT-STRUCTURE.md
├── src/
│   ├── actions/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── proxy.ts
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── vercel.json
└── .env.example
```

## 2. `src/` 目录拆解

### 2.1 `src/app/`

负责 App Router 页面和 Route Handlers。

```text
src/app/
├── (auth)/
│   ├── layout.tsx
│   └── login/page.tsx
├── (app)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── accounts/page.tsx
│   └── mail/[id]/page.tsx
├── api/
│   ├── auth/login/route.ts
│   ├── attachments/[key]/route.ts
│   ├── cron/sync/route.ts
│   └── oauth/
│       ├── gmail/route.ts
│       └── outlook/route.ts
├── globals.css
└── layout.tsx
```

职责说明：

- `(auth)`：未登录区域，目前只有登录页
- `(app)`：受 `proxy.ts` 保护的主应用区
- `api/`：仅保留必要的外部入口和二进制流入口
- `layout.tsx`：根布局和全局元信息
- `globals.css`：Tailwind v4 全局样式变量

### 2.2 `src/actions/`

负责所有内部业务动作，主要作为页面与数据层之间的服务边界。

```text
src/actions/
├── account.ts
├── email.ts
├── oauth.ts
└── sync.ts
```

职责说明：

- `account.ts`
  - 读取账号列表
  - 添加 QQ 账号
  - 添加 OAuth 账号
  - 删除账号
  - 更新同步状态
- `email.ts`
  - 查询邮件列表
  - 查询邮件详情
  - 查询附件
  - 标已读
  - 切换星标
  - 统计未读数
- `oauth.ts`
  - 返回 Gmail / Outlook 授权 URL
- `sync.ts`
  - 选择 provider
  - 拉取邮件
  - 写入数据库
  - 上传附件到 R2
  - 更新游标

### 2.3 `src/lib/`

负责底层基础设施与集成。

```text
src/lib/
├── auth.ts
├── crypto.ts
├── format.ts
├── r2.ts
├── utils.ts
├── db/
│   ├── index.ts
│   ├── migrate.ts
│   └── schema.ts
└── providers/
    ├── gmail.ts
    ├── outlook.ts
    ├── qq.ts
    └── types.ts
```

职责说明：

- `db/schema.ts`：Drizzle schema，定义 `accounts`、`emails`、`attachments`
- `db/index.ts`：Turso 客户端与 Drizzle 初始化
- `db/migrate.ts`：迁移入口
- `r2.ts`：R2 上传、下载、删除和 Object Key 构造
- `crypto.ts`：凭据加密/解密
- `format.ts`：时间和文件大小格式化
- `providers/`：邮件来源适配层

### 2.4 `src/components/`

负责 UI 组件和页面组合组件。

```text
src/components/
├── account-card.tsx
├── add-account-dialog.tsx
├── inbox-view.tsx
├── mail-detail.tsx
├── mail-list.tsx
├── sidebar.tsx
├── sync-button.tsx
└── ui/
```

职责说明：

- `sidebar.tsx`：左侧导航、账号列表、同步入口
- `inbox-view.tsx`：统一收件箱的中间容器
- `mail-list.tsx`：邮件列表
- `mail-detail.tsx`：邮件详情与附件区
- `account-card.tsx`：账号卡片
- `add-account-dialog.tsx`：添加 Gmail / Outlook / QQ 账号
- `sync-button.tsx`：手动同步按钮
- `ui/`：shadcn/ui 基础组件

## 3. 路由映射

### 3.1 页面路由

| 路径 | 文件 | 说明 |
|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` | 输入访问口令 |
| `/` | `src/app/(app)/page.tsx` | 统一收件箱 |
| `/accounts` | `src/app/(app)/accounts/page.tsx` | 邮箱账号管理 |
| `/mail/[id]` | `src/app/(app)/mail/[id]/page.tsx` | 单封邮件详情页 |

### 3.2 Route Handlers

| 路径 | 文件 | 说明 |
|---|---|---|
| `POST /api/auth/login` | `src/app/api/auth/login/route.ts` | 登录并设置 Cookie |
| `GET /api/oauth/gmail` | `src/app/api/oauth/gmail/route.ts` | Gmail OAuth 回调 |
| `GET /api/oauth/outlook` | `src/app/api/oauth/outlook/route.ts` | Outlook OAuth 回调 |
| `GET /api/attachments/[key]` | `src/app/api/attachments/[key]/route.ts` | 附件下载代理 |
| `GET /api/cron/sync` | `src/app/api/cron/sync/route.ts` | 定时同步入口 |

## 4. 关键文件索引

| 文件 | 作用 |
|---|---|
| `src/proxy.ts` | 全局访问控制和 API 保护 |
| `src/app/(app)/layout.tsx` | 主应用三栏布局入口 |
| `src/actions/sync.ts` | 整个同步主链路的核心 |
| `src/lib/db/schema.ts` | 数据模型定义 |
| `src/lib/providers/gmail.ts` | Gmail 适配实现 |
| `src/lib/providers/outlook.ts` | Outlook 适配实现 |
| `src/lib/providers/qq.ts` | QQ 邮箱适配实现 |
| `src/lib/r2.ts` | 附件对象存储入口 |
| `drizzle.config.ts` | Drizzle 配置 |
| `vercel.json` | Vercel Cron 配置 |

## 5. 如果你要改某个功能，应该看哪里

### 5.1 改统一收件箱 UI

优先查看：

- `src/app/(app)/page.tsx`
- `src/components/inbox-view.tsx`
- `src/components/mail-list.tsx`
- `src/components/mail-detail.tsx`
- `src/components/sidebar.tsx`

### 5.2 改账号接入体验

优先查看：

- `src/app/(app)/accounts/page.tsx`
- `src/components/add-account-dialog.tsx`
- `src/components/account-card.tsx`
- `src/actions/account.ts`
- `src/actions/oauth.ts`

### 5.3 改同步逻辑

优先查看：

- `src/actions/sync.ts`
- `src/lib/providers/types.ts`
- `src/lib/providers/gmail.ts`
- `src/lib/providers/outlook.ts`
- `src/lib/providers/qq.ts`

### 5.4 改数据库结构

优先查看：

- `src/lib/db/schema.ts`
- `drizzle.config.ts`

改完后通常需要执行：

```bash
npm run db:push
```

### 5.5 改鉴权逻辑

优先查看：

- `src/proxy.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/api/auth/login/route.ts`

### 5.6 改附件逻辑

优先查看：

- `src/lib/r2.ts`
- `src/actions/sync.ts`
- `src/actions/email.ts`
- `src/app/api/attachments/[key]/route.ts`

## 6. 扩展建议

### 6.1 新增邮箱 provider

建议按这个顺序扩展：

1. 在 `src/lib/providers/` 新增 provider 文件
2. 实现 `EmailProvider` 接口
3. 在 `src/actions/sync.ts` 中接入 `createProvider()`
4. 在 `src/components/add-account-dialog.tsx` 中增加接入入口
5. 在部署文档中补充对应外部服务配置

### 6.2 新增页面

如果是受保护页面，优先放在：

- `src/app/(app)/`

如果是公开页面，优先放在：

- `src/app/(auth)/`
- 或单独路由，但需要评估 `proxy.ts` 白名单

## 7. 维护约定

- 页面尽量只做组合，不堆业务逻辑
- 数据读写优先走 `src/actions/`
- 底层第三方 SDK 封装优先放 `src/lib/`
- 能抽象为 provider 的协议差异不要散落在页面层
- 对外接口尽量少，优先保持内部逻辑在 Server Actions 内部
