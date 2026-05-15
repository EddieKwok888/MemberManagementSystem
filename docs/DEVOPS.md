# 開發與部署指南 (DevOps Guide)

本文件說明如何啟動本地開發環境以及如何將代碼部署到生產環境。

## 1. 本地開發環境 (Local Emulator)

我們使用 Firebase Emulator Suite 來模擬完整後端。

### 啟動模擬器
在根目錄運行：
```bash
firebase emulators:start
```
這將啟動：
- **Firestore 模擬器**: localhost:8080
- **Auth 模擬器**: localhost:9099
- **Functions 模擬器**: localhost:5001
- **Emulator UI**: localhost:4000 (可視化管理界面)

---

## 2. 環境變數管理 (Environment Variables)

### 開發環境
修改 `functions/.env.default` 中的變數。

### 生產環境
敏感信息（如 API Keys）建議使用 Firebase Secret Manager：
```bash
firebase functions:secrets:set ADMIN_API_KEY
```
普通配置可在 `functions/.env.production` 中設置。

---

## 3. 部署命令 (Deployment)

### 部署到開發環境 (預設)
```bash
firebase deploy
```

### 部署到生產環境
```bash
firebase deploy -P production
```

### 僅部署特定組件
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## 4. 初始化數據 (Bootstrap)
首次部署後或在模擬器啟動後，運行以下命令來初始化角色與權限：
```bash
npm run bootstrap
```
