# GitHub Auth 详细配置

这页只讲一件事：**怎么把 Origami 自己的登录配起来**。

它和 Gmail / Outlook 邮箱接入不是一回事：

- **GitHub Auth**：登录 Origami 后台本身
- **Gmail / Outlook OAuth**：把邮箱账号接进 Origami

如果你现在的目标只是：

> “先让我把 Origami 打开并成功登录进去。”

那就先把这页做完。

---

## 先说结论：你最终要得到什么？

你最终需要把下面这些值放进 `.env`：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

它们分别表示：

- `NEXT_PUBLIC_APP_URL`：你打开 Origami 的地址
- `GITHUB_CLIENT_ID`：GitHub OAuth App 的 Client ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth App 的 Client Secret
- `GITHUB_ALLOWED_LOGIN`：限制只有某个 GitHub 用户可以登录，**公网部署强烈推荐**
- `AUTH_SECRET`：给登录 session 签名的密钥；不填时会回退到 `ENCRYPTION_KEY`

如果你只想先本地开发，最小可用大致像这样：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

---

## 官方参考链接

- GitHub 官方：创建 OAuth App  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

---

## 先用一句人话理解这件事

GitHub OAuth App 本质上是在告诉 GitHub：

> “当用户在我的站点点『使用 GitHub 登录』时，请把登录结果安全地送回这个 callback 地址。”

对 Origami 来说，最关键的一项是：

```txt
Authorization callback URL = <你的应用地址>/api/auth/github/callback
```

例如：

- 本地开发：`http://localhost:3000/api/auth/github/callback`
- 生产环境：`https://mail.example.com/api/auth/github/callback`

只要这里填错，后面八成就会卡在“登录后回不来”或者“callback error”。

---

## 开始之前，先抄一张表

建议你先在便签里把这些值写出来，再去点控制台。这样最不容易来回切页面时抄错。

### 情况 A：本地开发

```txt
应用地址（APP URL）
http://localhost:3000

GitHub Homepage URL
http://localhost:3000

GitHub Authorization callback URL
http://localhost:3000/api/auth/github/callback

允许登录的 GitHub 用户名
your-github-login
```

### 情况 B：正式部署

```txt
应用地址（APP URL）
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/auth/github/callback

允许登录的 GitHub 用户名
your-github-login
```

> 经验建议：**本地一套 OAuth App，生产一套 OAuth App。** 不要混着用。

---

## 你到底该选哪种配置方案？

### 方案 A：只在本地跑起来

如果你的目标只是先开发、先验证登录通不通，这样最简单：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

GitHub OAuth App 里填：

- Homepage URL：`http://localhost:3000`
- Authorization callback URL：`http://localhost:3000/api/auth/github/callback`

### 方案 B：本地和生产各一个 OAuth App（推荐）

推荐名字：

1. `Origami Local`
2. `Origami Production`

这样能避免：

- callback URL 改来改去
- 把生产 secret 混进本地
- 以后看不懂哪个 Client ID 属于哪个环境

### 方案 C：公网单用户部署（最推荐）

在方案 B 基础上，再加：

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

这样即使别人先打开你的站点，也不能抢先把实例绑定成 owner。

---

## 如果你看到的界面和本文不完全一样

GitHub 后台偶尔会微调文案，但你只要抓住这几个关键词，一般不会迷路：

- `Settings`
- `Developer settings`
- `OAuth Apps`
- `New OAuth App` 或 `Register a new application`

如果按钮名字略有变化，优先认左侧栏目和页面标题，不要死盯某一个按钮翻译。

---

## 宝宝式步骤：从零开始创建 GitHub OAuth App

### 第 1 步：打开 GitHub OAuth App 页面

依次点击：

1. GitHub 右上角头像
2. **Settings**
3. 左侧靠下的 **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

如果你从来没创建过，也可能显示为：

- **Register a new application**

那也是同一个入口。

---

### 第 2 步：填写表单

你会看到几个字段。下面按字段讲。

#### 1) Application name

建议一眼能看懂环境：

- `Origami Local`
- `Origami Production`

#### 2) Homepage URL

填你平时打开 Origami 的地址：

- 本地：`http://localhost:3000`
- 生产：`https://mail.example.com`

#### 3) Application description

可填可不填。你可以直接写：

```txt
Single-user inbox app login for Origami
```

#### 4) Authorization callback URL

这是最关键的字段，必须精确：

- 本地：`http://localhost:3000/api/auth/github/callback`
- 生产：`https://mail.example.com/api/auth/github/callback`

**不要漏掉 `/api/auth/github/callback`。**

如果这里只填成首页地址，后面登录基本就会失败。

---

### 第 3 步：注册应用

点：

- **Register application**

注册后你会立刻看到：

- Client ID

这时候还没有 secret，需要下一步生成。

---

### 第 4 步：生成 Client Secret

在应用详情页里点：

- **Generate a new client secret**

你现在要保存两项：

- Client ID → `GITHUB_CLIENT_ID`
- Client Secret → `GITHUB_CLIENT_SECRET`

> 注意：Client Secret 往往只会完整显示一次。一定先保存好，再关页面。

---

## 第 5 步：把值写进 `.env`

本地开发示例：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

如果你还没有 `AUTH_SECRET`，可以先生成一个随机值：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 我建议你现在逐项核对这 5 个值

- `NEXT_PUBLIC_APP_URL` 是不是你实际打开网站的地址？
- GitHub OAuth App 里的 **Homepage URL** 是不是和它一致？
- GitHub OAuth App 里的 **Authorization callback URL** 是不是等于 `<APP_URL>/api/auth/github/callback`？
- `GITHUB_ALLOWED_LOGIN` 是不是你的 GitHub login，而不是邮箱名？
- `AUTH_SECRET` 有没有设置成一个随机值？

---

## 第 6 步：启动 Origami

```bash
npm run dev
```

然后打开：

- `http://localhost:3000`

你应该会看到 GitHub 登录按钮。

如果你已经是生产部署，就打开自己的正式域名。

---

## 第 7 步：首次 owner 绑定会发生什么？

第一次成功登录后，Origami 会做这几件事：

1. 检查当前实例是否已经绑定 owner
2. 如果还没有，就把当前 GitHub 用户写入 `app_installation`
3. 然后把你带到 `/setup`
4. 初始化完成后，后续就按这个 owner 账号登录

### 一个非常重要的点

后续校验的核心是：

- **GitHub user id**

不是只看用户名文本。

这意味着：

- 你改 GitHub login 名，通常**不会**把自己锁在门外
- 但如果你换了另一个 GitHub 账号，那当然不行

---

## 你现在应该如何验证“真的配好了”？

按下面这个最短路径验证：

1. 打开 Origami 登录页
2. 点击 GitHub 登录
3. 浏览器跳到 GitHub 授权页面
4. 点同意 / 授权
5. 自动回到 Origami
6. 首次安装时进入 `/setup`
7. 完成 setup 后可以进主页或 `/accounts`

只要这条链路完整跑通，GitHub Auth 基本就是正确的。

---

## 最常见的错误，怎么一眼判断？

### 1. 点击 GitHub 登录后，提示 callback error / 回调失败

优先检查这四项：

- `NEXT_PUBLIC_APP_URL` 写对了吗？
- GitHub OAuth App 的 **Homepage URL** 对应当前环境吗？
- **Authorization callback URL** 是否精确到 `/api/auth/github/callback`？
- 你有没有把本地的 Client ID/Secret 填到生产里，或者反过来？

### 2. 登录页能打开，但怎么都进不去

先看 `GITHUB_ALLOWED_LOGIN`：

- 如果你设置了它，那么**只有那个 GitHub login** 能通过
- 这通常不是 bug，而是限制正在生效

### 3. 我明明是 owner，为什么还是被挡住？

检查你当前登录的 GitHub 账号，是不是当初完成首次绑定的那个账号。

### 4. 我第一次绑错人了怎么办？

通常需要清理数据库里的 `app_installation` 记录，然后重新初始化。

如果你不确定，请先备份数据库，再动这一步。

### 5. 回调地址看起来没错，但还是不行

你可以把下面三行写出来逐字对比：

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

其中 callback 必须严格等于：

```txt
<APP_URL>/api/auth/github/callback
```

很多时候不是“整体逻辑错了”，只是少了一个 path。

---

## 我推荐的最终做法

如果你问我“最稳的配法是什么”，我的建议是：

1. **本地一个 GitHub OAuth App**
2. **生产一个 GitHub OAuth App**
3. **公网部署一定设置 `GITHUB_ALLOWED_LOGIN`**
4. **额外设置 `AUTH_SECRET`，不要长期复用 `ENCRYPTION_KEY` 做 session 签名**

这是复杂度最低、排障最舒服、也最不容易踩坑的组合。

---

## 下一步看什么？

GitHub 登录配好后，通常继续看：

- [Cloudflare R2 / Bucket 详细配置](/r2-storage)
- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)
