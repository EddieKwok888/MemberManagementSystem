# 版本資訊與更新日誌 (Version Info & Changelog)

本文件記錄了 **vExperthk** 會員管理系統行動應用程式的當前版本配置、技術規格及開發更新歷史。

---

## 📱 當前版本規格 (Current Specifications)

* **應用程式名稱 (App Name)：** `vExperthk`
* **應用程式套件名 (Package Name / Application ID)：** `com.vexperthk.membersystem`
* **目前版本號碼 (Version Name)：** `1.0.0`
* **內部版本代號 (Version Code)：** `1`
* **發布日期：** 2026年5月27日

---

## 🛠️ 技術架構與相容性 (Tech Stack & Compatibility)

* **目標 SDK 版本 (Target SDK)：** `35` (Android 15)
* **編譯 SDK 版本 (Compile SDK)：** `35` (Android 15)
* **最低相容系統 (Min SDK)：** `26` (Android 8.0 Oreo - 支援自適應圖標的最佳起點)
* **編譯語言版本：** Kotlin `2.2.10` / Java `17`
* **使用者介面框架：** Jetpack Compose (BOM `2024.12.01`) / Material 3
* **後端雲端服務：** Google Firebase
  * Firebase Authentication (驗證與 Token 管理)
  * Firebase Cloud Firestore (即時會員資料庫)
  * Firebase Cloud Functions (伺服器端核心邏輯)

---

## 🚀 版本更新歷史 (Release History)

### v1.0.0 (2026-05-27) — 初始穩定發布版 (Initial Release)

此版本為應用程式的首個正式發布版本，奠定了高規格、高相容性且極具視覺美感的企業級會員管理系統基礎。

#### 1. 💎 Premium 企業級自適應圖標 (Adaptive Icons)
* **視覺設計：** 採用 Microsoft 365 風格的深企業藍漸變背景 (`ic_launcher_background.xml`)。
* **前景設計：** 精緻的玻璃感 Verified Member 特級會員盾牌徽章 (`ic_launcher_foreground.xml`)，具備高對比度的白金邊框與極具科技感的青綠色弧線。
* **高解析度適配：** 自動生成包括高版本自適應圖標及 legacy 各密度級別（mdpi 至 xxxhdpi）的 PNG 標準/圓形圖標，確保在各種 Android 啟動器上完美顯示。

#### 2. ⚡ Gradle 10.0 Warning-Free 建置現代化
* **現代化語法：** 將 `app/build.gradle` 中所有舊式空格屬性指派升級為顯式指派語法（例如 `namespace = '...'`），以完全符合未來 **Gradle 10.0** 的嚴格標準。
* **移除過時配置：** 清理 `gradle.properties` 中的所有 AGP 9.0 過時標記（包括 `android.enableAppCompileTimeRClass`、`android.builtInKotlin`、`android.defaults.buildfeatures.resvalues` 等），達到 100% 無警告編譯。
* **Kotlin Task 優化：** 在 task 層級統一配置 Kotlin 編譯器，解決了 AGP 內建 Kotlin 外掛的擴充衝突。

#### 3. 🛡️ 解決 Compose 執行期相容性崩潰 (NoSuchMethodError Fix)
* **BOM 升級：** 將原先老舊的 Compose BOM `2024.01.00` 全面升級至穩定且相容性最佳的 **`2024.12.01`**，並同步升級 `navigation-compose` 至 **`2.8.5`**。
* **修復執行期崩潰：** 解決了舊版本庫中 `CircularProgressIndicator` 呼叫動畫核心 API 時，因 Java Bytecode 回傳值類型不一致導致的 `java.lang.NoSuchMethodError` 崩潰問題。
* **API 升級適配：** 在 `AppTextField.kt` 中全面淘汰已移除的 `outlinedTextFieldColors`，無縫移轉至 Material 3 現代化的 `TextFieldDefaults.colors` API。

#### 4. 🔒 隱私與安全性合規
* **隱私政策部署：** 於根目錄成功部署符合 Google Play 商店及各大應用市場審查規範的專屬隱私權政策文件，並配置了官方聯絡管道（`privacy@vexperthk.com`）。
* **資料傳輸安全：** 確保所有與 Firebase Auth & Firestore 的連線全部運行在加密的網絡傳輸協定上，且嚴格套用 Firestore 安全規則。
