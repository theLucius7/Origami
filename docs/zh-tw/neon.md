# Neon PostgreSQL 詳細配置

這頁只講一件事：**怎麼為正式環境的 Origami 準備一個可直接使用的 Neon PostgreSQL 資料庫**。

## 這頁會幫你拿到什麼

按這頁做完，你應該能拿到並確認這幾項：

- 一個已建立好的 Neon project
- 一個提供 Origami 使用的資料庫
- 一條可直接填回 `.env` 的 `DATABASE_URL`
- 一套可以執行 `npm run db:setup` 的基礎配置

## 最終你要填回 `.env` 的值

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## 官方參考

- Neon Docs  
  <https://neon.tech/docs>
- Neon Console  
  <https://console.neon.tech/>
- Neon Pricing  
  <https://neon.tech/pricing>

## 推薦流程

1. 在 Neon 控制台建立 project
2. 選擇離部署區域更近的 region
3. 確認給 Origami 使用的 database / branch
4. 從控制台複製完整 PostgreSQL 連線字串
5. 原樣填入 `DATABASE_URL`
6. 在專案目錄執行 `npm run db:setup`

## 關鍵操作

### 1. 登入 Neon

打開：

- <https://console.neon.tech/>

### 2. 建立 project

建議名稱：

```txt
origami-prod
```

### 3. 確認 database / branch

重點是確認：

- 正式環境連的是哪個 project
- 正式環境連的是哪個 database
- 不要誤連到測試 branch / 測試庫

### 4. 複製連線字串

常見形式類似：

```txt
postgresql://user:password@ep-example-pooler.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

> 最穩的做法是**原樣複製** Neon 提供的完整連線字串。  
> 不要手動刪掉 `sslmode=require`，也不要自己拼 host、帳號或參數。

Origami 現在使用 `postgres` 驅動，Neon 的 pooled / direct URL 都可以用；保留完整 URL 即可。

### 5. 填入 `.env`

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## 怎麼驗證配置真的好了

把 `DATABASE_URL` 填進 `.env` 後，在專案目錄執行：

```bash
npm install
npm run db:setup
```

如果資料庫連線沒問題，這一步應該能正常完成。

## 最常見錯誤

### 1. 還在使用舊的 Turso 變數

Origami 現在不再使用：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

請改為：

- `DATABASE_URL`

### 2. 手動改壞了 Neon 連線字串

請確認：

- 連線字串直接來自 Neon 控制台
- 沒有刪掉查詢參數
- 沒有把 production project 和 development project 搞混

### 3. 連到了錯的 branch 或資料庫

如果你同時有多個 branch / database，請務必確認：

- `.env` 裡填的是哪一個
- 目前部署連的是哪一個
- `db:setup` 跑的是哪一個
