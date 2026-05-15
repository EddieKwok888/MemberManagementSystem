# Firestore 安全規則指南 (Security Rules Guide)

這份文件詳細解釋了本系統的 Firestore 安全架構。

## 1. 規則分段說明

### A. 輔助函數 (Helper Functions)
我們定義了多個重複使用的函數來提高可讀性：
- `hasRole(role)`: 直接從 Firebase Auth 的 **Custom Claims** 讀取角色，比在 Rules 中查詢數據庫快且省錢。
- `isNotModifying(fields)`: 使用 `diff()` 函數來確保敏感欄位（如 `points`）在未經授權的情況下不被修改。

### B. 會員與員工權限隔離
- **Member**: 透過 `isOwner(userId)` 確保用戶只能存取自己的數據。
- **Staff**: 擁有 `read` 權限查看會員名單，但 `delete` 權限被明確禁止。
- **Admin**: 擁有最高權限，但仍受限於「審計日誌不可刪改」的硬性規則。

### C. 數據驗證
在 `create` 和 `update` 操作中，我們使用 `hasFields()` 確保寫入的數據結構完整，防止出現髒數據。

---

## 2. 安全性考量 (Security Considerations)

1.  **Custom Claims vs. Firestore Lookup**:
    - 我們優先使用 Custom Claims (`request.auth.token.role`)。這避免了在每條規則中進行額外的 `get()` 查詢，消除了潛在的效能瓶頸，也防止了 Rules 遞歸查詢。
2.  **審計完整性 (Immutable Logs)**:
    - `adminAuditLogs` 的規則設置為 `allow update, delete: if false`。即使 Admin 帳戶被盜，攻擊者也無法抹除其操作痕跡。
3.  **最小特權原則 (Principle of Least Privilege)**:
    - 預設使用 `match /{path=**} { allow read, write: if false; }` 拒絕所有未明確定義的訪問。

---

## 3. 性能優化建議 (Performance Optimizations)

1.  **避免 Rules 中的 `get()` 和 `exists()`**:
    - 雖然 Firestore 允許在 Rules 中查詢其他文檔，但這會增加計費讀取次數。目前的設計透過 Custom Claims 將角色資訊直接帶入 Token，這將規則查詢次數降至 **0**。
2.  **細化 Match 路徑**:
    - 儘量避免使用通配符過大的路徑（如 `**`），我們針對每個集合單獨定義規則，這能縮短 Firebase 評估規則的時間。
3.  **條件排序**:
    - 將最廉價的檢查（如 `isSignedIn()`）放在邏輯表達式的最前面，利用短路效應 (Short-circuiting) 減少不必要的權限運算。

---

## 4. 如何測試與部署

- **測試**: 建議使用 `firebase emulators:start` 並運行測試腳本。
- **部署**: `firebase deploy --only firestore:rules`
