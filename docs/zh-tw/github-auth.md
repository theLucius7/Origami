# GitHub Auth 詳細配置

這頁只講一件事：**怎麼為正式環境的 Origami 配置 GitHub 登入**。

它負責的是「登入 Origami 後台」，不是接入 Gmail / Outlook 郵箱。

## 這頁會幫你拿到什麼

按這頁做完，你應該能拿到並確認這幾項：

- 一個專門給 Origami 登入用的 GitHub OAuth App
- 正確的 **Homepage URL**
- 正確的 **Authorization callback URL**
- 一組可填回 `.env` 的 `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- 一個明確的 `GITHUB_ALLOWED_LOGIN`

## 最後要填回 `.env` 的值

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

## 官方參考

- GitHub：建立 OAuth App  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

## 開始前先抄表

```txt
正式訪問地址
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/better-auth/callback/github

允許登入的 GitHub 使用者名稱
your-github-login
```

> `mail.example.com` 只是示例，請全部換成你的正式網域。
>
> 不建議先用 `*.vercel.app` 這類臨時地址建立正式 OAuth App，否則之後換網域時還要回來一起改。

## 你會在兩個地方來回操作

### 地方 A：GitHub 後台

你會在這裡：

- 建立 OAuth App
- 填 Homepage URL
- 填 Authorization callback URL
- 生成 Client Secret

### 地方 B：Origami 的 `.env`

你會把值填回：

```txt
NEXT_PUBLIC_APP_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ALLOWED_LOGIN=
AUTH_SECRET=
```

## 使用者點擊腳本

### 第 1 步：打開 GitHub OAuth App 頁面

在 GitHub 裡按這個順序點：

1. 右上角頭像
2. **Settings**
3. **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

### 第 2 步：填寫 OAuth App 表單

#### Application name

```txt
Origami Production
```

#### Homepage URL

```txt
https://mail.example.com
```

#### Application description

可選，例如：

```txt
Single-user inbox login for Origami
```

#### Authorization callback URL

這一欄必須精確填成：

```txt
https://mail.example.com/api/better-auth/callback/github
```

最常見的錯是把首頁網址直接填進來。正確值一定要帶 `/api/better-auth/callback/github`。

### 第 3 步：註冊應用

點：

- **Register application**

### 第 4 步：生成 Client Secret

在應用詳情頁點：

- **Generate a new client secret**

然後立刻複製：

1. **Client ID**
2. **Client Secret**

> `Client Secret` 通常在剛建立時最容易完整看到，別等關掉頁面後才想起來抄。

## 現在回到 `.env`

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=generate-a-random-32-byte-secret
```

如果你還沒有 `AUTH_SECRET`，可以生成一個隨機值：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 填完後先核對

請確認：

- `NEXT_PUBLIC_APP_URL` 是正式網域
- GitHub 後台的 **Homepage URL** 與它一致
- GitHub 後台的 **Authorization callback URL** 等於 `<APP_URL>/api/better-auth/callback/github`
- `GITHUB_ALLOWED_LOGIN` 填的是 GitHub 使用者名稱，不是電子郵件
- `AUTH_SECRET` 不是空值

## 怎麼驗證配置真的好了

部署完成後，打開：

```txt
https://mail.example.com/login
```

理想流程應該是：

1. 點 GitHub 登入
2. 跳到 GitHub 授權頁
3. 完成授權
4. 回到 Origami
5. 第一次安裝時進入 `/setup`
6. 完成初始化後進入首頁或應用內頁面

如果想更穩一點，建議再補做：

1. 登出後再重新登入一次
2. 確認 owner 帳號可以正常進入
3. 確認其他 GitHub 帳號不會誤進你的實例

## 最常見錯誤

### 1. 點 GitHub 登入後立刻 callback error

先檢查：

- `NEXT_PUBLIC_APP_URL`
- GitHub Homepage URL
- GitHub Authorization callback URL

### 2. 登入頁能開，但始終進不去

先看：

```txt
GITHUB_ALLOWED_LOGIN=
```

如果你設了它，只有這個 GitHub 使用者名稱可以完成登入。

### 3. 看起來都填對了，但還是失敗

把這三行拿出來逐字核對：

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

正確 callback 只能是：

```txt
<APP_URL>/api/better-auth/callback/github
```

### 4. 換了正式網域後突然登入失效

通常不是 Origami 壞了，而是 GitHub OAuth App 裡還留著舊網域。

### 5. 第一次初始化綁錯 owner

這通常不是 OAuth App 本身的問題，而是第一次初始化時用錯了 GitHub 帳號，往往需要清掉安裝記錄後重來。

## 一句話驗收標準

如果指定的 GitHub 帳號能正常登入 Origami，而其他帳號不會誤進來，這篇配置基本就算完成了。
