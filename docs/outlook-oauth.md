# Outlook OAuth 详细配置

这页讲的是：**怎么把 Outlook / Microsoft 365 邮箱接入 Origami**。

它和 GitHub 登录不是一回事：

- **GitHub 登录**：负责进入 Origami
- **Outlook OAuth**：负责让 Origami 访问你的 Outlook 邮箱

如果你现在的目标是：

> “我已经能登录 Origami 了，现在我想把 Outlook 或 Microsoft 365 邮箱接进去。”

那就做这页。

---

## 先说结论：你最终要得到什么？

如果你先走最简单的环境变量方案，你最终要把这些值放进 `.env`：

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

通常也会和这个一起出现：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

因为 Microsoft OAuth 的 redirect URI 也要和 Origami 地址对齐。

---

## Origami 目前会请求哪些 Microsoft scopes？

按当前代码，Origami 会请求：

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

相关代码位置：

- `src/lib/providers/outlook.ts`

---

## 先理解一个重要点：默认 env Outlook app 走的是 `tenant=common`

当前环境变量默认 Outlook app 的实现，走的是：

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

这意味着它更适合：

- 个人 Outlook / Hotmail / Live 账号
- 多租户 / 不想绑定单一组织 tenant 的场景

如果你只想绑定某个特定组织 tenant，更推荐：

- 先完成 GitHub 登录
- 再在 Origami `/accounts` 里创建 **数据库版 Outlook OAuth app**
- 把 tenant 精确写成你的 tenant id 或 tenant 域名

---

## 两种配置方式

### 方式 A：环境变量默认 Outlook App（第一次最推荐）

你在 `.env` 里填：

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

### 方式 B：数据库版 Outlook App

如果你后面需要：

- 不同 tenant
- 不同环境分多套 app
- 更细的 app 管理

可以在 Origami 后台 `/accounts` 里创建数据库版 Outlook app。

### 我建议第一次怎么做？

**先用方式 A。**

原因：

- 流程最短
- 变量最少
- 最好排错

---

## 官方参考链接

- 注册 Microsoft Entra 应用  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- 添加 Redirect URI  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- 添加 / 管理 client secret  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

---

## 开始之前，先抄一张表

建议你先把这些值写出来：

### 本地开发

```txt
应用地址（APP URL）
http://localhost:3000

Microsoft Redirect URI
http://localhost:3000/api/oauth/outlook

App registration name
Origami Outlook Local
```

### 生产环境

```txt
应用地址（APP URL）
https://mail.example.com

Microsoft Redirect URI
https://mail.example.com/api/oauth/outlook

App registration name
Origami Outlook Production
```

> 经验建议：本地和生产最好分开两个 app registration。

---

## 如果你看到的界面和本文不完全一样

Microsoft Entra 后台也会改名字和导航位置。你优先认这些关键词：

- `Microsoft Entra admin center`
- `App registrations`
- `New registration`
- `Authentication`
- `Certificates & secrets`
- `API permissions`
- `Delegated permissions`
- `Grant admin consent`

有时 `Entra ID` 的显示也会略有不同，但只要你还在应用注册页面体系里，一般方向就是对的。

---

## 宝宝式步骤：从零开始创建 Outlook OAuth App

### 第 1 步：打开 Microsoft Entra Admin Center

打开：

- <https://entra.microsoft.com>

---

### 第 2 步：注册应用

进入：

- **Entra ID** → **App registrations** → **New registration**

官方文档：

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### Name 怎么填？

建议把环境写清楚：

- `Origami Outlook Local`
- `Origami Outlook Production`

#### Supported account types 怎么选？

这是最容易犹豫的一步。

##### 如果你打算用环境变量默认 Outlook app

推荐优先考虑能覆盖更广账号类型的选项，例如：

- **Accounts in any organizational directory and personal Microsoft accounts**

因为默认 env app 走的是 `tenant=common`，和这种配置更一致。

##### 如果你只给某一个公司 / 组织 tenant 用

你也可以做成更收口的组织内应用。  
但这种情况下，更推荐你后面在 Origami 里改用**数据库版 Outlook app**，并把 tenant 精确写进去，而不是硬走默认 env app。

---

### 第 3 步：添加 Web Redirect URI

注册完成后，进入：

- **Manage** → **Authentication**
- **Add a platform**
- 选择 **Web**

官方文档：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

### Redirect URI 填什么？

必须精确对应 Origami：

- 本地：`http://localhost:3000/api/oauth/outlook`
- 生产：`https://你的域名/api/oauth/outlook`

一定要精确到 `/api/oauth/outlook`。

---

### 第 4 步：创建 Client Secret

进入：

- **Certificates & secrets**
- **New client secret**

官方文档：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

创建后你要保存两样：

- Application (client) ID → `OUTLOOK_CLIENT_ID`
- Client secret Value → `OUTLOOK_CLIENT_SECRET`

> 注意：client secret 的值通常只会完整显示一次。

---

### 第 5 步：添加 Microsoft Graph 权限

进入：

- **API permissions**
- **Add a permission**
- **Microsoft Graph**
- **Delegated permissions**

然后把 Origami 需要的权限加上：

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

官方参考：

- <https://learn.microsoft.com/en-us/graph/permissions-reference>

### 这一页的目标非常简单

不是去研究所有 Graph 权限，而是确认：

> 你创建的这套 app，至少已经具备 Origami 所需的 Delegated permissions。

---

### 第 6 步：是否需要 Grant admin consent？

这取决于你的租户策略。

常见情况：

- **个人微软账号 / 自己的小范围测试**：通常按用户授权即可
- **公司 / 学校租户**：可能需要管理员额外点 **Grant admin consent**

如果你发现用户授权时被组织策略拦住，优先去这里查。

---

## 第 7 步：把值写进 `.env`

### 本地开发

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 生产环境

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 配完之后，请按这个顺序核对

建议逐项核对：

- 当前看的 app registration 是不是正确那一套？
- **Supported account types** 选得对吗？
- **Authentication** 里的 Web redirect URI 是不是精确等于 `<APP_URL>/api/oauth/outlook`？
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` 是不是来自这套 app？
- `API permissions` 里是否已经有 `Mail.Read`、`Mail.ReadWrite`、`Mail.Send`？
- 如果你在组织 tenant 里使用，是不是需要管理员授予 admin consent？

如果这几项都没问题，Outlook OAuth 大概率就能跑通。

---

## 第 8 步：回到 Origami 里连接 Outlook

1. 启动 Origami
2. 先完成 GitHub 登录
3. 打开 `/accounts`
4. 添加 Outlook 账号
5. 跳去微软授权页
6. 授权后回到 Origami

---

## 你现在应该如何验证“真的配好了”？

按下面这条链路跑：

1. 在 Origami 里点“添加 Outlook 账号”
2. 浏览器跳到 Microsoft 登录 / 授权页
3. 选择账号并授权
4. 自动跳回 Origami
5. `/accounts` 里出现新 Outlook 账号
6. 能正常同步、查看、发信或执行写回能力

只要这条链路通了，Outlook OAuth 基本就是好的。

---

## 最常见的错误，怎么一眼判断？

### 1. `AADSTS50011` / redirect URI mismatch

这是最经典的错误，先检查：

- Entra 里的 Web redirect URI
- `NEXT_PUBLIC_APP_URL`
- Origami 实际使用的 `/api/oauth/outlook`

这三者是否完全对应。

### 2. 能登录微软，但回到 Origami 后失败

优先检查：

- 本地 / 生产是不是用了错的 client id
- client secret 是否复制错
- redirect URI 是否少写了 `/api/oauth/outlook`

### 3. 发信时报缺少权限

检查你是不是把下面这些权限都加了：

- `Mail.Send`
- `Mail.ReadWrite`

Origami 的发信和写回能力都依赖这些权限。

### 4. 个人微软账号无法授权

通常先看你的 **Supported account types** 选得对不对。  
如果你要支持 Outlook.com / Hotmail 这类个人账号，却把应用限制成单一组织 tenant，就会出各种奇怪问题。

### 5. 公司租户里别人授权不过

大概率是租户策略或 admin consent 的问题，不一定是 Origami 本身配置错了。

### 6. 我只想给一个 tenant 用，但默认 env app 感觉别扭

这不是错觉。因为默认 env app 走的是 `tenant=common`。如果你就是要强绑定某个组织 tenant，更推荐：

- 改用数据库版 Outlook app
- 在 Origami 里把 tenant 明确写死

这样逻辑会更干净。

---

## 我推荐的最终做法

如果你问我“最稳的 Outlook 配法是什么”，我的建议是：

1. 本地和生产分两个 app registration
2. 默认 env app 只用在最简单场景
3. 如果涉及特定 tenant，就改用数据库版 Outlook app
4. 一开始就把 redirect URI 分环境写清楚
5. 先把权限加齐，再回 Origami 做授权测试

这是最不容易绕晕自己的方式。

---

## 下一步看什么？

- [Gmail OAuth 详细配置](/gmail-oauth)
- [Cloudflare R2 / Bucket 详细配置](/r2-storage)
