# 開發與除錯

本頁說明 **Origami 的本地開發、除錯與貢獻流程**。

這不是正式部署路徑。如果你要上線實例，請先看：

- [快速開始](/zh-tw/quick-start)
- [部署指南](/zh-tw/deployment)

## 這頁適合誰

如果你想做下面這些事，請看這頁：

- 在 `localhost` 跑 Origami
- 修改 UI、後端行為或資料結構
- 除錯 OAuth callback
- 驗證 migration、測試或 build
- 貢獻程式碼或文件

## 本地環境要求

- Node.js 22+
- npm
- 一套開發用 Neon / PostgreSQL 資料庫
- 一套開發用 Cloudflare R2 bucket
- 一個本地專用 GitHub OAuth App
- 如需測 Gmail / Outlook，對應的開發 OAuth app

## 本地環境變數範例

建議使用獨立的開發配置，不要直接沿用正式環境密鑰。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami_dev?sslmode=require

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

如果你想更快確認有沒有漏值，可以把它們分成五組來理解：

- **應用基礎**：`NEXT_PUBLIC_APP_URL`、`ENCRYPTION_KEY`、`AUTH_SECRET`
- **GitHub 登入**：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_ALLOWED_LOGIN`
- **資料庫**：`DATABASE_URL`
- **附件儲存**：`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- **排程任務**：`CRON_SECRET`

## 本地 OAuth callback

### GitHub

```txt
http://localhost:3000/api/better-auth/callback/github
```

### Gmail

```txt
http://localhost:3000/api/oauth/gmail
```

### Outlook

```txt
http://localhost:3000/api/oauth/outlook
```

能分開就盡量用本地專用 OAuth app，不要直接重用正式環境那一套。

## 安裝與啟動

```bash
cp .env.local.example .env
npm install
npm run db:setup
npm run dev
```

預設位址：

- `http://localhost:3000`

如果這是你第一次把專案跑起來，建議按這個順序檢查：

1. `npm install` 能正常完成
2. `.env` 已填入一套真的開發配置
3. `npm run db:setup` 能成功完成
4. `npm run dev` 後瀏覽器能打開 `http://localhost:3000`
5. GitHub 登入、本地 OAuth callback、核心頁面都能正常工作

## 常用指令

```bash
npm run dev
npm run test
npm run lint
npm run build
npm run docs:build
npm run verify
```

## 資料庫指令

```bash
npm run db:setup
npm run db:migrate
npm run db:push
```

建議用法：

- 全新開發資料庫優先用 `db:setup`
- 只有在你要驗證 migration 鏈時再用 `db:migrate`
- `db:push` 僅在你確定自己知道影響時使用

## 除錯建議

### OAuth callback 異常

優先檢查：

- `NEXT_PUBLIC_APP_URL`
- OAuth 平台中的 callback URL
- 當前本地埠號
- 使用的 Client ID / Client Secret 是否屬於開發環境

### 資料庫異常

優先檢查：

- `DATABASE_URL`
- 當前資料庫是否已執行 `db:setup`

### 附件上傳異常

優先檢查：

- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## 最常見的本地開發坑

1. **直接拿正式 OAuth app 來跑 `localhost`**  
   很容易把 callback URL 搞亂，也可能反過來污染正式配置。
2. **忘了先把 `.env.local.example` 複製成 `.env` 就直接跑**  
   頁面打得開，不代表核心功能真的都能用。
3. **把開發庫和正式庫混在一起**  
   一旦你開始改 schema 或測 migration，就會變得很危險。
4. **R2 只配了一半，等到上傳附件時才爆**  
   物件儲存問題很常在流程後段才暴露。
5. **本地埠號改了，但 OAuth callback 還寫著舊埠**  
   授權頁面看起來能開，回跳卻會壞掉。

## 提交前建議

至少執行：

```bash
npm run verify
```

如果你只改了文件，至少執行：

```bash
npm run docs:build
```
