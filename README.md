# 會員管理系統 (Member Management System) - 本地開發與環境安裝手冊

本專案專為學生同埋初學者設計，旨在透過 **Antigravity AI + Firebase Emulator (本機模擬器)** 進行本地開發練習。

---

## 📋 目錄
1. [第一階段：安裝核心軟體 (環境要求)](#第一階段安裝核心軟體)
2. [第二階段：安裝開發工具](#第二階段安裝開發工具)
3. [第三階段：初始化專案資料夾](#第三階段初始化專案資料夾)
4. [第四階段：啟動本機系統](#第四階段啟動本機系統)
5. [數據備份與恢復](#數據備份與恢復)
6. [⚠️ 注意事項](#注意事項)

---

## 💻 第一階段：安裝核心軟體

喺開始之前，請先確保您嘅電腦已經安裝咗以下兩款基礎軟體：

### 1. 安裝 Node.js (系統執行環境)
*   **下載網址**: [https://nodejs.org/](https://nodejs.org/)
*   **安裝步驟**: 
    1. 進入網站之後，點擊左邊綠色嘅 **「LTS (長期支援版)」** 按鈕下載。
    2. 下載完成後執行安裝檔，一路點擊「Next (下一步)」直到完成。
*   **驗證方式**: 開啟終端機 (PowerShell)，輸入 `node -v`，如果出現 `v18.x` 或 `v20.x` 字樣就代表成功。

### 2. 安裝 Java JDK (模擬器運作所需)
*   **重要**: `firebase-tools` 最新版本要求 **Java 21** 或更高版本。
*   **下載網址**: [Adoptium (JDK 21)](https://adoptium.net/temurin/releases/?version=21)
*   **安裝步驟**: 選擇 Windows x64 的 `.msi` 檔案下載並安裝。
*   **驗證方式**: 喺終端機輸入 `java -version`，確認出現 `version "21"`。

---

## 🚀 第二階段：安裝開發工具

準備好核心軟體之後，我哋需要安裝 Firebase 嘅專用指令工具。

### 1. 安裝 Firebase CLI
請開啟終端機 (PowerShell)，複製並貼上以下指令後按 **Enter 鍵**：
```bash
npm install -g firebase-tools
```
*   **小貼士**: `-g` 代表安裝喺全域 (Global)，您以後所有嘅專案都可以用到呢個工具。

---

## 📂 第三階段：初始化專案資料夾

專案分為三個主要部分：根目錄、前端網頁 (web)、雲端函數 (functions)。每一部分都需要安裝自己嘅套件。

### 1. 安裝根目錄工具
喺專案嘅最外層資料夾 (`MemeberSystem`) 執行：
```bash
npm install
```

### 2. 安裝前端網頁套件
輸入以下指令進入 `web` 資料夾並安裝：
```bash
cd web
npm install
cd ..
```

### 3. 安裝雲端函數套件
輸入以下指令進入 `functions` 資料夾並安裝：
```bash
cd functions
npm install
cd ..
```

---

## 🏃 第四階段：啟動本機系統

當所有安裝都完成之後，您可以跟住以下步驟開啟系統。

### 1. 啟動本機模擬器 (資料庫)
```bash
firebase emulators:start
```
*   **成功標誌**: 終端機出現大量資訊，並顯示 `Emulator UI: http://localhost:4000`。
*   **查看資料**: 請用瀏覽器打開 `http://localhost:4000`，呢個就係您嘅本機資料庫介面。

### 2. 啟動 Web 管理網頁
開啟**另一個**終端機視窗，進入 `web` 資料夾並啟動：
```bash
cd web
npm run dev
```
*   **訪問網址**: 打開瀏覽器輸入 `http://localhost:5173`。

---

## 💾 數據備份與恢復 (持久化)

### 如何喺關閉之後保存資料？
如果您希望每次關閉模擬器之後資料唔會消失，啟動嗰陣請改用呢個指令：
```bash
firebase emulators:start --import=./emulator_data --export-on-exit
```


### 如何手動導出資料？
此指令會將模擬器中的資料下載到 `backups` 資料夾：
```powershell
npx ts-node scripts/exportData.ts
```

### 如何手動匯入資料？
如果您有之前導出的 JSON 檔案，可以用以下指令匯入：
```powershell
# 請更換為您的資料夾名稱
npx ts-node scripts/importData.ts backups/backup-xxxxxxxxxxxx
```

---

## ⚠️ 注意事項

*   **僅供測試用途**：目前嘅本地開發環境同模擬器資料**僅供開發測試使用**。請勿將其視為正式生產環境。
*   **保持視窗開啟**：啟動模擬器同網頁之後，嗰個終端機視窗唔可以關閉，否則系統會停止運作。
*   **Node 模組空間**：安裝完套件之後會產生大量嘅 `node_modules` 資料夾，呢個係正常現象，請勿隨意刪除。

---

## 📞 獲取協助
如果在安裝過程中遇到紅色報錯，請影低完整畫面詢問老師或 Antigravity AI 助理。
