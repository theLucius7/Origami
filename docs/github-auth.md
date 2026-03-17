# GitHub Auth 详细配置

这页只讲一件事：**怎么把 Origami 自己的登录配起来**。  
它和 Gmail / Outlook 邮箱接入是两回事：

- **GitHub Auth**：登录 Origami 后台本身
- **Gmail / Outlook OAuth**：把邮箱账号接进 Origami

如果你现在只是想先能打开 Origami，先把这页做完就够了。

## 你最终要填的环境变量

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

其中：

- `NEXT_PUBLIC_APP_URL`：你访问 Origami 的地址
- `GITHUB_CLIENT_ID`：GitHub OAuth App 的 Client ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth App 的 Client Secret
- `GITHUB_ALLOWED_LOGIN`：限制只允许某个 GitHub 用户登录，**公网部署强烈推荐**
- `AUTH_SECRET`：给 session cookie 签名的密钥；不填时会回退到 `ENCRYPTION_KEY`

## 官方参考链接

- GitHub 官方：创建 OAuth App  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## 最简单的理解方式

你可以把 GitHub OAuth App 理解成：

> “告诉 GitHub：当用户在我的 Origami 站点点登录按钮时，请把登录结果安全地回调到这个地址。”

对 Origami 来说，最关键的是这一条：

```txt
Authorization callback URL = <你的应用地址>/api/auth/github/callback
```

比如：

- 本地开发：`http://localhost:3000/api/auth/github/callback`
- 生产环境：`https://mail.example.com/api/auth/github/callback`

## 方案选择：我到底该怎么配？

### 方案 A：只在本地开发

最省心：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

GitHub OAuth App 里填：

- Homepage URL：`http://localhost:3000`
- Authorization callback URL：`http://localhost:3000/api/auth/github/callback`

### 方案 B：本地和生产分开两个 OAuth App（推荐）

推荐你建两个：

1. `Origami Local`
2. `Origami Production`

这样不会发生：

- 本地 callback 改来改去影响生产
- 生产 secret 暴露给本地环境
- 后面自己都忘了哪个 Client ID 对应哪个地址

### 方案 C：公网单用户部署（最推荐）

除了上面的值，再加：

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

这样即使别人先打开你的 `/login`，也不能抢先把实例绑定成 owner。

## 宝宝式步骤：从零开始创建 GitHub OAuth App

### 第 1 步：打开 GitHub 的 OAuth App 页面

依次点击：

1. GitHub 右上角头像
2. **Settings**
3. 左侧最下面 **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

如果你从来没创建过，它可能显示的是 **Register a new application**。

### 第 2 步：填写表单

你会看到几个字段，按下面填：

#### Application name
随便起，但建议一眼能看懂环境：

- `Origami Local`
- `Origami Production`

#### Homepage URL
填你平时访问 Origami 的地址：

- 本地：`http://localhost:3000`
- 生产：`https://mail.example.com`

#### Application description
可填可不填。你可以写：

```txt
Single-user inbox app login for Origami
```

#### Authorization callback URL
这是最重要的一项，必须精确：

- 本地：`http://localhost:3000/api/auth/github/callback`
- 生产：`https://mail.example.com/api/auth/github/callback`

**不要少 `/api/auth/github/callback` 这一段。**

### 第 3 步：注册应用

点 **Register application**。

注册完成后，你会先看到：

- Client ID

这时还没有 Client Secret。

### 第 4 步：生成 Client Secret

在应用详情页里点：

- **Generate a new client secret**

然后把两项复制出来：

- Client ID → `GITHUB_CLIENT_ID`
- Client Secret → `GITHUB_CLIENT_SECRET`

> 注意：Client Secret 只会完整展示一次，先保存好。

## 第 5 步：填进 `.env`

本地开发示例：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

如果你还没有 `AUTH_SECRET`，可以先生成一个随机值，例如：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 第 6 步：启动 Origami

```bash
npm run dev
```

打开：

- `http://localhost:3000`

你会看到 GitHub 登录按钮。

## 第 7 步：首次 owner 绑定

第一次成功登录后：

1. Origami 会检查当前实例是否已经绑定 owner
2. 如果还没绑定，就把当前 GitHub 用户写入 `app_installation`
3. 然后进入 `/setup`
4. 初始化完成后，之后就按这个 GitHub 账号登录

### 一个非常重要的点

Origami 首次绑定后，后续校验的是：

- **GitHub user id**

不是单纯的用户名文本。

所以：

- 你改 GitHub 用户名，通常**不会**导致自己被锁在门外
- 但如果你换成另一个 GitHub 账号，那当然不行

## 常见错误怎么判断

### 1. 点击 GitHub 登录后，回调失败 / callback error

优先检查：

- `NEXT_PUBLIC_APP_URL` 是否写错
- GitHub OAuth App 的 Homepage URL 是否对应当前环境
- Authorization callback URL 是否精确到 `/api/auth/github/callback`
- 你是不是把本地的 Client ID/Secret 填到了生产环境，或者反过来

### 2. 登录页能打开，但就是进不去

看 `GITHUB_ALLOWED_LOGIN`：

- 如果你设置了它，那么**只有那个 GitHub 用户名**能通过这一步
- 这通常不是 bug，而是安全限制在生效

### 3. 我明明是 owner，怎么还是不能登录？

检查你当前登录的 GitHub 账号是不是当初完成首次绑定的那个账号。

### 4. 我第一次绑错人了怎么办？

通常需要清理数据库里的 `app_installation` 记录，然后重新初始化。

如果你不确定要不要这么做，建议先备份数据库。

## 推荐的最终做法

如果你问我“最稳的配法是什么”，我的答案是：

1. **本地一个 GitHub OAuth App**
2. **生产一个 GitHub OAuth App**
3. **公网部署一定设置 `GITHUB_ALLOWED_LOGIN`**
4. **额外设置 `AUTH_SECRET`，不要长期复用 `ENCRYPTION_KEY` 作为 session 签名密钥**

## 下一步看什么

GitHub 登录配好后，通常接下来继续看：

- [Cloudflare R2 / Bucket 详细配置](/r2-storage)
- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)
