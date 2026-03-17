# GitHub Auth 详细配置

这页只讲一件事：**怎么为生产环境的 Origami 配置 GitHub 登录**。

它负责的是“登录 Origami 后台”，不是接入 Gmail / Outlook 邮箱。

## 最终你要填回 `.env` 的值

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

其中：

- `NEXT_PUBLIC_APP_URL`：你的正式访问地址
- `GITHUB_CLIENT_ID`：GitHub OAuth App 的 Client ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth App 的 Client Secret
- `GITHUB_ALLOWED_LOGIN`：限制允许登录的 GitHub 用户名，公网部署强烈建议填写
- `AUTH_SECRET`：给登录 session 签名的随机密钥

## 官方参考

- GitHub：创建 OAuth App  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## 开始前先抄表

先把下面这组值写在便签里，再去 GitHub 后台填写：

```txt
正式访问地址
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/auth/github/callback

允许登录的 GitHub 用户名
your-github-login
```

> 本页里的 `mail.example.com` 只是示例，请全部替换成你自己的正式域名。

## 你会在两个地方来回操作

### 地方 A：GitHub 后台

你会在这里：

- 创建 OAuth App
- 填 Homepage URL
- 填 Authorization callback URL
- 生成 Client Secret

### 地方 B：Origami 项目的 `.env`

你会把值填回：

```txt
NEXT_PUBLIC_APP_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ALLOWED_LOGIN=
AUTH_SECRET=
```

## 用户点击脚本

### 第 1 步：打开 GitHub OAuth App 页面

在 GitHub 里按这个顺序点：

1. 右上角头像
2. **Settings**
3. **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

如果你看到的是 **Register a new application**，也是同一个入口。

### 第 2 步：填写 OAuth App 表单

#### Application name

建议填写：

```txt
Origami Production
```

#### Homepage URL

填写你的正式地址：

```txt
https://mail.example.com
```

#### Application description

这项可选，你可以写：

```txt
Single-user inbox login for Origami
```

#### Authorization callback URL

这一栏必须精确填写：

```txt
https://mail.example.com/api/auth/github/callback
```

最常见的错误是把这里写成首页 URL。**正确值一定要带上 `/api/auth/github/callback`。**

### 第 3 步：注册应用

点击：

- **Register application**

创建成功后，你会进入 OAuth App 详情页。

### 第 4 步：生成 Client Secret

在详情页点击：

- **Generate a new client secret**

然后立刻复制：

1. **Client ID**
2. **Client Secret**

这两项要回填到 `.env`。

## 现在回到 `.env`

把这些行填好：

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

如果你还没有 `AUTH_SECRET`，可以生成一个随机值：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 填完后先核对

逐项确认：

- `NEXT_PUBLIC_APP_URL` 是正式域名
- GitHub 后台的 **Homepage URL** 与它一致
- GitHub 后台的 **Authorization callback URL** 等于 `<APP_URL>/api/auth/github/callback`
- `GITHUB_ALLOWED_LOGIN` 填的是 GitHub 用户名，不是邮箱
- `AUTH_SECRET` 不是空值

## 怎么验证配置真的好了

部署完成后，打开：

```txt
https://mail.example.com/login
```

理想流程应该是：

1. 点击 GitHub 登录
2. 跳到 GitHub 授权页
3. 完成授权
4. 回到 Origami
5. 第一次安装时进入 `/setup`
6. 完成初始化后进入首页或 `/accounts`

## 最常见错误

### 1. 点 GitHub 登录后直接报 callback error

优先检查：

- `NEXT_PUBLIC_APP_URL`
- GitHub 后台里的 Homepage URL
- GitHub 后台里的 Authorization callback URL

这三处必须完全一致。

### 2. 登录页能打开，但始终进不去

先看：

```txt
GITHUB_ALLOWED_LOGIN=
```

如果你设置了它，只有这个 GitHub 用户名可以完成登录。

### 3. 看起来都填对了，但还是失败

把下面三行单独拿出来逐字核对：

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

正确的 callback 只能是：

```txt
<APP_URL>/api/auth/github/callback
```

## 下一步看什么

GitHub 登录配好后，通常继续：

1. [Cloudflare R2 / Bucket 详细配置](/r2-storage)
2. [Gmail OAuth 详细配置](/gmail-oauth)
3. [Outlook OAuth 详细配置](/outlook-oauth)
