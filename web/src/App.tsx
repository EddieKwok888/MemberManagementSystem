import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Wrench, Loader2 } from 'lucide-react';

// 頁面匯入
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminDashboard from './pages/admin/AdminDashboard';

// 維護模式畫面
const MaintenancePage: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <Wrench className="w-10 h-10 text-amber-400" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-3">系統維護中</h1>
    <p className="text-slate-400 text-base max-w-md mb-2">
      我們正在進行系統升級與維護，請稍後再試。
    </p>
    <p className="text-slate-500 text-sm mb-8">System Maintenance — Please check back later.</p>
    <a
      href="/login"
      className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline"
    >
      管理員登入
    </a>
  </div>
);

// 主應用（含維護模式攔截邏輯）
const AppContent: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'systemSettings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenanceMode(docSnap.data().maintenanceMode === true);
      }
      setSettingsLoading(false);
    }, () => {
      setSettingsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Show spinner while loading auth + settings
  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // 維護模式攔截：
  // - /login 頁面永遠可進入（讓管理員能登入）
  // - 已登入的 admin 不受影響
  // - 其他所有人顯示維護畫面
  const isLoginPage = location.pathname === '/login';
  if (maintenanceMode && !isAdmin && !isLoginPage) {
    return <MaintenancePage />;
  }

  return (
    <Routes>
      {/* 公開路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 保護路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* 錯誤頁面處理 */}
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
          <p className="text-xl text-slate-700 font-semibold mb-4">存取被拒絕</p>
          <p className="text-slate-500 mb-8">您沒有足夠的權限訪問此頁面。</p>
          <a href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">返回首頁</a>
        </div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
