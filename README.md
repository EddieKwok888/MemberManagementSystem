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
<img width="946" height="769" alt="image" src="https://github.com/user-attachments/assets/1d075170-2024-4fb6-91df-7bc7c2afdeb1" />
<img width="943" height="637" alt="image" src="https://github.com/user-attachments/assets/29109a80-5053-48fc-b472-eacb5d2cdad7" />
<img width="944" height="758" alt="image" src="https://github.com/user-attachments/assets/4964b97f-3aff-452f-8cb4-ac85088ac03c" />
<img width="930" height="761" alt="image" src="https://github.com/user-attachments/assets/e800858c-1802-4aa0-862d-90aec37679f0" />
<img width="946" height="763" alt="image" src="https://github.com/user-attachments/assets/8a8fb971-1fff-4d14-8f92-e769d1eff6ec" />
<img width="948" height="966" alt="image" src="https://github.com/user-attachments/assets/d64bcb7e-9581-4def-ad18-6c20e76baa41" />
<img width="947" height="698" alt="image" src="https://github.com/user-attachments/assets/3937f065-e69b-47ce-a323-4bc8ec41a16c" />

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

## 🛠️ 進階管理功能與實用腳本 (2026年5月更新)

本專案現已升級，全面支援**本機模擬器**與**真實雲端生產環境**雙模運行，並新增了完整的後台管理面板與一系列自動化運維腳本。

### 1. 後台管理面板 (Admin Dashboard)
當您以管理員身份登入系統後，可以在左側導航欄訪問以下功能：
*   **管理員儀表板 (Dashboard)**: 快速概覽系統會員總數、待審核會員、已啟用/已禁用的會員統計。
*   **會員管理 (Member Management)**:
    *   查看所有註冊會員的詳細資料（包括權限與狀態）。
    *   **編輯角色/權限**: 動態更改用戶角色（系統管理員、普通員工、一般會員）並同步更新 Firebase Custom Claims。
    *   **啟用/禁用帳號**: 即時封禁或重新啟用會員。
*   **系統全域設置 (System Settings)**:
    *   **維護模式**: 一鍵開啟全站維護，限制非管理員用戶登入與操作。
    *   **開放公開註冊**: 控制是否允許新用戶自助註冊。
    *   **預設會員狀態**: 設定新註冊會員的初始狀態（如 `active` 已啟用，或 `pending` 待審核）。
*   **審計日誌查看器 (Audit Logs)**: 即時記錄並查看管理員的所有操作記錄（如更改設置、修改用戶角色、禁用帳號等），確保安全與可追溯性。

### 2. 雙環境切換 (本地 / 雲端)
您可以在 `web/.env.local` 檔案中一鍵切換運作模式：
*   **本地模擬器模式** (推薦開發使用): 設置 `VITE_USE_FIREBASE_EMULATOR=true`
*   **雲端生產環境模式** (部署上線使用): 設置 `VITE_USE_FIREBASE_EMULATOR=false`

---

## 💻 自動化管理腳本 (Scripts)

我們在根目錄的 `scripts/` 資料夾中提供了一套強大的後台管理腳本，能讓您不需要透過網頁，直接在終端機對 Firebase Auth 與 Firestore 進行高效的管理與診斷：

### 1. 系統數據初始化
*   **用途**: 初始化 Firestore 中的預設角色（Admin、Staff、Member）、權限映射表及初始系統全域設置。
*   **執行指令**:
    ```powershell
    npm run bootstrap
    ```

### 2. 設置系統管理員 (Set Admin Role)
*   **用途**: 將指定 Email 的用戶提升為「系統管理員」，同時在 Firestore 用戶文檔寫入 `role: "admin"`，並在 Firebase Auth 中寫入 `{role: "admin"}` 的 Custom Claims，使其獲得完整的管理權限。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/setAdminUsers.ts
    ```
    *系統將會提示您輸入要設置的 Email。*

### 3. 診斷用戶詳細權限與狀態 (Diagnose User)
*   **用途**: 查詢指定 Email 用戶的詳細資料。包括：UID、啟用狀態、創立時間、登入供應商，以及**最關鍵的 Custom Claims（自定義聲明/角色權限）**。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/checkUserAuthDetails.ts
    ```

### 4. 創建測試會員 (Create Test User)
*   **用途**: 在 Firebase 中自動創建一個測試帳號並自動寫入對應的 Firestore 個人資料文檔。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/createTestUser.ts
    ```

### 5. 將本地備份數據匯入至真實雲端 (Cloud Data Import)
*   **用途**: 將本地模擬器導出的 JSON 備份數據，安全、完整地遷移並上傳到真實的 Firebase 雲端生產環境。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/importDataToCloud.ts backups/您的備份資料夾名
    ```

### 6. 解鎖被封禁的帳號 (Fix Disabled User)
*   **用途**: 當用戶帳號被系統禁用或封鎖時，此腳本可以一鍵將其在 Firebase Authentication 中恢復為啟用狀態。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/fixDisabledUser.ts
    ```

### 7. 列出所有註冊用戶 (List All Users)
*   **用途**: 遍歷並輸出 Firebase Authentication 中所有已註冊的用戶列表及基本狀態。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/listAllUsers.ts
    ```

### 8. 安全規則一鍵部署 (Deploy Rules)
*   **用途**: 在本地修改 `firestore.rules` 安全規則後，使用此腳本可快速將其部署至雲端，無需執行完整的 `firebase deploy`。
*   **執行指令**:
    ```powershell
    npx ts-node scripts/deployRules.ts
    ```

---

## 📱 Android 原生 Native 應用程式 (2026年5月更新)

本專案現已全面支援**原生 Android 應用程式 (Android Native App)**！專為行動裝置進行了高品質的適配，並與 Live Firebase 生產環境直接連接，達成即時同步運作。

### 1. 核心技術棧 (Core Technology Stack)
*   **開發語言**: Kotlin 
*   **UI 框架**: Jetpack Compose (宣告式 UI)
*   **設計規範**: Google Material 3 (極致 Slate-Indigo 靛藍高階質感主題)
*   **建置系統**: Gradle Kotlin DSL (已完美同步升級至 **Gradle 9.3.1** 與 AGP 9.1.0 規範)
*   **系統要求**: `minSdk = 33` (Android 13+)，支援最新的隱私與安全性要求。

### 2. 精美前台功能 (Member Features)
*   **即時維護模式攔截**: 應用程式即時監聽 Firestore 中的 `systemSettings/config`，一旦管理員在 Web 端或後台開啟全站維護，Android 端會**秒級反應並即刻引導非管理員至維護頁面**，關閉後能立刻自動恢復，無需重啟 App。
*   **審核/停用狀態重定向**: 動態監聽用戶帳戶 `users/{uid}` 狀態。
    *   **待審核 (`pending`)**: 自動阻絕並進入琥珀色「審核中」鎖定頁面。
    *   **已停用 (`disabled`)**: 自動強制登出並進入玫瑰紅「帳戶停用」警示頁面。
*   **高防禦性 Null-Safety 設計**: 完美相容線上舊資料與缺失欄位。若用戶未填寫真實姓名、電話或地址，App 能防禦性防禦解析，乾淨呈現 **`未設置`** 或載入空白輸入框，絕不因 null 指標崩潰。
*   **安全變更比對 (Delta Tracking)**: 僅在有修改時才將真實姓名、電話或通訊地址變更內容寫入 Firestore，並安全更新 Firebase 顯示名稱。

### 3. 管理員 Lite 模組 (Admin Lite Feature)
若登入用戶的角色為 `admin`，應用程式將**自動切換進入極速管理後台 (Admin Lite)**：
*   **儀表板數據概覽**: 提供總會員數、啟用中、待審核、停用中等實時卡片數據。
*   **模糊關鍵字搜尋**: 提供高流暢度的姓名或 Email 關鍵字過濾搜尋。
*   **詳細檔案檢索**: 查看所有會員的完整資料（含電郵、電話、地址與註冊日期）。
*   **狀態一鍵變更**: 提供「待審核」、「啟用」、「停用」按鈕控制，可即時修改用戶權限，並自動攔截 Firestore 權限不足的安全性報錯。

---

## 🏃 如何編譯與執行 Android 專案

### 第一步：定位 Android 專案目錄
Android 應用程式的所有源代碼和配置皆存放於：
`C:\GoogleProject\MemberManagementSystem\android`

### 第二步：安裝 Firebase Live 設定檔
1. 請確保您已將生產環境的 **`google-services.json`** 檔案放置在：
   `C:\GoogleProject\MemberManagementSystem\android\app\google-services.json`
2. 本專案專為連接真實 Live 生產環境設計，已完全移除了任何模擬器 (Emulator) 的 localhost 殘留代碼。

### 第三步：使用 Gradle Wrapper 編譯專案
專案已內建 Gradle 9.3.1 Wrapper，請打開終端機 (PowerShell) 並進入 `android` 目錄，執行：
```powershell
cd android
# 執行乾淨編譯並生成 Debug APK
.\gradlew.bat :app:assembleDebug
```
*   **編譯成功標誌**: 終端機顯示 `BUILD SUCCESSFUL`。
*   **APK 檔案位置**: `android/app/build/outputs/apk/debug/app-debug.apk`

### 第四步：在 Android Studio 中開啟並執行
1. 打開 **Android Studio**，點擊 **File > Open**，選擇並載入 `android` 資料夾。
2. 系統會依據 [local.properties](file:///C:/GoogleProject/MemberManagementSystem/android/local.properties) 設定的 `sdk.dir` 自動同步 SDK 依賴（已內建配置為您本機的 Android SDK 路徑）。
3. 連接您的實體手機（開啟 USB 偵錯）或啟動模擬器 AVD。
4. 選擇上方工具列的 **`app`** 啟動項，點擊 **Run (▶)** (或按下 `Shift + F10`) 即可自動部署至裝置。

> 💡 **測試小貼士**:
> App 登入畫面特別在 **Debug 模式下** 內建了管理員與會員的「一鍵快速登入通道」，讓您無需繁瑣輸入，即可測試 approved / pending / disabled 用戶的各種流向與管理權限！

---

## ⚠️ 注意事項

*   **僅供測試用途**：目前嘅本地開發環境同模擬器資料**僅供開發測試使用**。請勿將其視為正式生產環境。
*   **保持視窗開啟**：啟動模擬器同網頁之後，嗰個終端機視窗唔可以關閉，否則系統會停止運作。
*   **Node 模組空間**：安裝完套件之後會產生大量嘅 `node_modules` 資料夾，呢個係正常現象，請勿隨意刪除。

---

## 📞 獲取協助
如果在安裝過程中遇到紅色報錯，請影低完整畫面詢問老師或 Antigravity AI 助理。
