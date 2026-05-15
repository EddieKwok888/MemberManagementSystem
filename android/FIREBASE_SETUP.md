# Android Firebase 整合指南

為了讓 Android 應用連接到此 Firebase 後端，請遵循以下步驟：

## 1. 下載配置文件
從 Firebase Console (專案設定 > 您的應用程式) 下載 `google-services.json`。

## 2. 放置位置
將 `google-services.json` 放在 Android 專案的 `app/` 目錄下。

## 3. 本地模擬器連接 (開發環境)
在 Android 代碼中，如果偵測到是開發環境，請將 SDK 指向本地模擬器：

```kotlin
// Firestore 模擬器
Firebase.firestore.useEmulator("10.0.2.2", 8080)

// Auth 模擬器
Firebase.auth.useEmulator("10.0.2.2", 9099)

// Functions 模擬器
Firebase.functions.useEmulator("10.0.2.2", 5001)
```

> **注意**: `10.0.2.2` 是 Android 模擬器訪問電腦 localhost 的預設 IP。
