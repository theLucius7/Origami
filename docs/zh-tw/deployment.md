# 部署指南

本頁說明 **Origami 正式環境部署** 的標準流程。

預設場景如下：

- 單實例
- 單 owner
- 公網訪問
- Vercel + Neon + Cloudflare R2

如果你只是想先完成一套可上線配置，請先閱讀：

- [快速開始](/zh-tw/quick-start)

如果你要本地開發、除錯或修改程式碼，請改看：

- [開發與除錯](/zh-tw/development)

## 這頁適合誰

這頁更適合下面這些人：

- 已經準備正式上線，不想只看最短路徑
- 想在真正部署前把關鍵配置一次看清楚
- 擔心 OAuth callback、環境變數、物件儲存這些地方漏一項就卡住
- 想知道「為什麼這樣配」，而不只是照命令跑

## 部署順序總覽

建議按這個順序推進：

1. 先確定最終正式網域
2. 再準備 Neon / R2 / GitHub OAuth / Gmail OAuth / Outlook OAuth
3. 然後填環境變數並執行 `npm run db:setup`
4. 再把專案部署到 Vercel
5. 最後完成首次登入、初始化、帳號接入與上線檢查

## 正式環境基線

推薦的正式部署組合：

- **執行環境**：Vercel
- **資料庫**：Neon / PostgreSQL
- **物件儲存**：Cloudflare R2
- **登入方式**：GitHub OAuth App
- **信箱接入**：Gmail OAuth、Outlook OAuth、IMAP/SMTP

## 正式網域要求

在開始部署前，先確定最終正式網域，例如：

```txt
https://mail.example.com
```

該網域會同時用於：

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth callback
- Outlook OAuth callback

**這四處必須保持一致。**

## 環境變數

### 必填變數

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

### 變數分組速覽

如果你想更快檢查有沒有漏項，可以這樣理解：

- **應用基礎**：`NEXT_PUBLIC_APP_URL`、`ENCRYPTION_KEY`、`AUTH_SECRET`
- **登入控制**：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_ALLOWED_LOGIN`
- **資料庫**：`DATABASE_URL`
- **附件儲存**：`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- **定時任務**：`CRON_SECRET`
- **預設郵箱 OAuth app（可選）**：`GMAIL_CLIENT_ID`、`GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID`、`OUTLOOK_CLIENT_SECRET`

### 可選變數

如果你要直接使用預設 OAuth app，再補上：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

如果你不填這四項，仍然可以在應用內透過 `/accounts` 建立資料庫託管的 OAuth app。

## 正式 OAuth 配置要求

### GitHub OAuth App

GitHub OAuth App 需要配置為：

- **Homepage URL**：`https://mail.example.com`
- **Authorization callback URL**：`https://mail.example.com/api/better-auth/callback/github`

建議同時設定：

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

這樣可以避免其他人先佔用 owner 綁定。

### Gmail OAuth

Google OAuth 的 redirect URI 應為：

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook OAuth

Microsoft OAuth 的 redirect URI 應為：

```txt
https://mail.example.com/api/oauth/outlook
```

如果你要逐步點擊式說明，請分別查看：

- [GitHub Auth 詳細配置](/zh-tw/github-auth)
- [Gmail OAuth 詳細配置](/zh-tw/gmail-oauth)
- [Outlook OAuth 詳細配置](/zh-tw/outlook-oauth)

## 資料庫初始化

對於全新正式資料庫，執行：

```bash
npm install
npm run db:setup
```

說明：

- `db:setup` 適用於新環境
- `db:migrate` 僅適用於需要回放歷史 migration 的場景
- `db:push` 只適合你明確知道自己在做什麼時使用

## Vercel 部署流程

推薦按以下順序執行：

1. 將倉庫導入 Vercel
2. 配置正式環境變數
3. 綁定正式網域
4. 部署應用
5. 造訪正式地址並完成首次登入

在 Vercel 中至少確認以下配置無誤：

- Production 環境變數已完整填寫
- `NEXT_PUBLIC_APP_URL` 使用正式網域
- 所有 OAuth 回調地址都已同步更新
- 專案構建使用正確分支

## 最容易踩坑的 6 個點

1. **正式網域還沒定，就先去配 OAuth 平台**  
   這會導致後面一改網域，GitHub / Google / Microsoft 全都要返工。
2. **`NEXT_PUBLIC_APP_URL`、瀏覽器訪問地址、各平台 callback 不一致**  
   這是最常見的授權失敗原因。
3. **把預覽環境或臨時網域當成正式網域使用**  
   預覽環境適合測試，不適合當長期正式 callback。
4. **全新資料庫沒有優先執行 `db:setup`**  
   新環境建議從 `npm run db:setup` 開始，而不是直接 `db:migrate` 或 `db:push`。
5. **R2 的 bucket / endpoint / key 不是同一套配置**  
   這類錯誤往往要到上傳附件時才會暴露。
6. **部署後沒有立即做完整鏈路檢查**  
   至少走一遍登入、初始化、帳號接入、同步、發信與附件上傳。

## 定時同步

`vercel.json` 已定義同步任務入口：

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

請求頭需要攜帶：

```http
Authorization: Bearer <CRON_SECRET>
```

正式環境建議顯式設定 `CRON_SECRET`。不要依賴自動派生值，以免排程端與服務端配置不一致。

## 首次上線流程

部署完成後，使用正式網域訪問 Origami，並按以下順序完成初始化：

1. 使用 GitHub 登入
2. 完成 `/setup`
3. 打開 `/accounts`
4. 添加 Gmail、Outlook 或 IMAP/SMTP 帳號
5. 執行首次同步
6. 驗證發信與附件能力

## 正式檢查清單

上線前建議逐項確認：

- 正式網域可正常訪問
- GitHub 登入成功後可進入 `/setup` 或首頁
- `/accounts` 頁面正常載入
- Gmail OAuth 授權與回跳正常
- Outlook OAuth 授權與回跳正常
- IMAP/SMTP 帳號添加正常
- 同步任務正常執行
- 附件上傳與下載正常
- 發信功能正常
- 定時同步可正常調用 `/api/cron/sync`

## 上線後第一天建議立刻做的事

1. 用 owner 帳號完整登入一次，確認 GitHub session 正常
2. 在 `/accounts` 至少接入一個真實郵箱帳號
3. 手動跑一輪同步，確認收件正常
4. 發送一封測試郵件，確認發信鏈路正常
5. 上傳並下載一個附件，確認 R2 鏈路正常
6. 觀察一次定時同步是否成功命中 `/api/cron/sync`

## 發布前校驗

建議在發布前執行：

```bash
npm run verify
```

這個命令會覆蓋：

- lint
- typecheck
- tests
- app build
- docs build

## 升級建議

如果你正在升級既有實例：

- 保留現有 migration 鏈
- 新環境優先使用 `db:setup`
- 更換 OAuth app 後，按帳號重新授權
- 網域變更後，務必同步更新所有 callback 與環境變數

## 相關文件

按正式部署順序，建議繼續閱讀：

1. [快速開始](/zh-tw/quick-start)
2. [Neon PostgreSQL 詳細配置](/zh-tw/neon)
3. [Cloudflare R2 / Bucket 詳細配置](/zh-tw/r2-storage)
4. [GitHub Auth 詳細配置](/zh-tw/github-auth)
5. [Gmail OAuth 詳細配置](/zh-tw/gmail-oauth)
6. [Outlook OAuth 詳細配置](/zh-tw/outlook-oauth)

開發、除錯與本地執行說明請查看：

- [開發與除錯](/zh-tw/development)
