# 快速開始

本頁只說明 **正式環境部署的最短可用路徑**。

如果你的目標是本地開發、除錯、修改程式碼或驗證 OAuth callback，請不要沿用本頁流程，直接查看：

- [開發與除錯](/zh-tw/development)

## 這頁會帶你完成什麼

按這頁走完，你應該能得到一套：

- 可公開訪問的 Origami 實例
- 可登入的 GitHub owner 帳號
- 可用的 Neon PostgreSQL 資料庫
- 可用的 Cloudflare R2 附件儲存
- 至少一個可正常同步 / 發信的郵箱帳號

## 推薦部署組合

Origami 目前最穩定的正式環境組合是：

- **應用執行環境**：Vercel
- **資料庫**：Neon / PostgreSQL
- **附件儲存**：Cloudflare R2
- **登入方式**：GitHub OAuth App
- **信箱接入**：Gmail OAuth、Outlook OAuth、IMAP/SMTP

## 開始前 1 分鐘確認

在你真正打開各平台控制台之前，先確認這 4 件事：

- 你已經確定 **最終正式網域**，例如 `mail.example.com`
- 你不會把 Vercel 預覽網址或臨時測試網址當成正式 OAuth 網域
- 你準備把 `NEXT_PUBLIC_APP_URL`、GitHub callback、Gmail callback、Outlook callback 全都統一到同一個正式網域
- 你現在要部署的是「正式可用實例」，不是本地開發環境

## 部署前準備

開始之前，請先準備以下資源：

- 一個正式網域，例如 `mail.example.com`
- 一個 Neon PostgreSQL 資料庫
- 一個 Cloudflare R2 bucket
- 一個 GitHub OAuth App（用於登入 Origami）
- 若要接入 Gmail 或 Outlook，對應的 OAuth app

**本頁中的 `mail.example.com` 只是示例。實際部署時請替換成你自己的正式網域。**

建議按以下順序準備：

1. [建立 Neon PostgreSQL 資料庫](/zh-tw/neon)
2. [設定 Cloudflare R2](/zh-tw/r2-storage)
3. [設定 GitHub 登入](/zh-tw/github-auth)
4. [依需求設定 Gmail OAuth](/zh-tw/gmail-oauth)
5. [依需求設定 Outlook OAuth](/zh-tw/outlook-oauth)

## 第 1 步：準備正式環境變數

在專案根目錄複製環境變數模板：

```bash
cp .env.example .env
```

然後生成密鑰：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

先把生成的 64 位十六進位字串填進 `ENCRYPTION_KEY`。若你打算另外設定 `AUTH_SECRET` 或 `CRON_SECRET`，也建議各自再生成新的隨機值。

將 `.env` 至少填成：

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

如果你希望 Gmail / Outlook OAuth 開箱即用，再補上：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 第 2 步：完成正式網域對應的 OAuth 設定

所有 OAuth 回調地址都必須使用 **最終正式網域**，並與 `NEXT_PUBLIC_APP_URL` 保持一致。

### GitHub 登入

GitHub OAuth App 中填：

- **Homepage URL**：`https://mail.example.com`
- **Authorization callback URL**：`https://mail.example.com/api/better-auth/callback/github`

> 不要先寫成 `https://xxx.vercel.app` 這種臨時地址，再期待後面「自動跟著變」。
> 如果正式訪問網域變了，OAuth 平台裡的地址也必須一起更新。

然後把返回的值填回：

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### Gmail（可選）

Google OAuth 的回調地址應為：

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook（可選）

Microsoft OAuth 的回調地址應為：

```txt
https://mail.example.com/api/oauth/outlook
```

如果你還沒完成這些配置，請先按詳細文檔逐項處理：

- [GitHub Auth 詳細配置](/zh-tw/github-auth)
- [Gmail OAuth 詳細配置](/zh-tw/gmail-oauth)
- [Outlook OAuth 詳細配置](/zh-tw/outlook-oauth)

## 第 3 步：安裝依賴並初始化資料庫

填好正式環境變數後，執行：

```bash
npm install
npm run db:setup
```

對全新資料庫來說，`db:setup` 是推薦入口。

## 第 4 步：部署到 Vercel

推薦流程如下：

1. 將倉庫導入 Vercel
2. 在 Vercel 專案中填入與本地一致的正式環境變數
3. 綁定正式網域，例如 `mail.example.com`
4. 觸發部署

部署完成後，請再次確認：

- Vercel 中的 `NEXT_PUBLIC_APP_URL` 已設成 `https://mail.example.com`
- GitHub / Gmail / Outlook OAuth 回調地址全部使用同一網域
- Neon、R2 與應用環境變數來自同一套正式配置

如果你想更快排除「剛部署就錯」的問題，建議立刻做這 3 個檢查：

1. 打開 `https://mail.example.com`，確認不是 404，也不是舊快取頁面
2. 觸發一次 GitHub 登入，確認能成功回跳
3. 登入後進入 `/setup` 或首頁，確認不是空白頁 / 500

## 第 5 步：執行發布前校驗

發布前，至少執行：

```bash
npm run verify
```

這個命令會依序執行：

- ESLint
- TypeScript 型別檢查
- Vitest 測試
- Next.js build
- 文件站 build

## 第 6 步：完成首次登入與初始化

部署完成後，打開你的正式地址：

- `https://mail.example.com`

然後按順序完成：

1. 使用 GitHub 登入
2. 完成 `/setup`
3. 打開 `/accounts`
4. 添加 Gmail、Outlook 或 IMAP/SMTP 帳號
5. 回到首頁確認郵件已成功同步

## 第 7 步：完成上線檢查

正式投入使用前，至少檢查以下項目：

- GitHub 登入可以成功返回 Origami
- `/setup` 可以正常完成
- `/accounts` 頁面可正常打開
- Gmail / Outlook OAuth 可以完成授權並回跳
- IMAP/SMTP 帳號可以新增
- 附件可以上傳與下載
- 同步任務可以正常執行
- 發信流程可用

## 5 分鐘排錯

如果你按上面走完，仍然卡在某一步，優先按下面順序排查：

### GitHub 登入失敗

先看這 4 項：

1. `NEXT_PUBLIC_APP_URL` 是否就是你現在瀏覽器裡訪問的正式網域
2. GitHub OAuth App 裡的 **Homepage URL** 和 **Authorization callback URL** 是否完全匹配
3. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 是否填錯環境、帶空格，或來自舊 OAuth app
4. `GITHUB_ALLOWED_LOGIN` 是否寫成了別的 GitHub 使用者名稱

### Gmail / Outlook 授權回不來

先看這 3 項：

1. 對應平台裡的 redirect URI 是否寫成正式網域
2. 你當前部署環境裡的 `NEXT_PUBLIC_APP_URL` 是否已經換成正式網域
3. 你是不是改過網域，但忘了把平台控制台裡的回調地址同步改掉

### 附件上傳 / 下載異常

先看這 4 項：

1. `R2_BUCKET_NAME` 是否就是你實際建立的 bucket
2. `R2_ENDPOINT` 是否使用了正確的帳號 endpoint
3. `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` 是否對應同一個 R2 帳號
4. 你目前實例使用的是不是另一套舊環境變數

### 新環境初始化異常

先看這 3 項：

1. 全新資料庫是否優先執行了 `npm run db:setup`
2. `DATABASE_URL` 是否指向正確的 Neon 正式資料庫
3. 你是否把開發環境的庫誤用到了正式環境

## 下一步

如果你要繼續完善正式部署，建議按以下順序閱讀：

1. [部署指南](/zh-tw/deployment)
2. [Neon PostgreSQL 詳細配置](/zh-tw/neon)
3. [Cloudflare R2 / Bucket 詳細配置](/zh-tw/r2-storage)
4. [GitHub Auth 詳細配置](/zh-tw/github-auth)
5. [Gmail OAuth 詳細配置](/zh-tw/gmail-oauth)
6. [Outlook OAuth 詳細配置](/zh-tw/outlook-oauth)

如果你需要本地除錯或二次開發，請查看：

- [開發與除錯](/zh-tw/development)
