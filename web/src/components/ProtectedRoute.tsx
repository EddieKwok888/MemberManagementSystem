import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Clock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

// 等待審核頁面
const PendingApprovalPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 border border-slate-100 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-8 h-8 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">帳號審核中</h1>
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        您的帳號已成功建立，目前正在等待管理員審核。<br />
        審核通過後，您將可以正常使用系統。<br />
        如有疑問請聯絡系統管理員。
      </p>
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
        狀態：等待審核 (Pending)
      </div>
      <button
        onClick={() => { import('firebase/auth').then(({ getAuth, signOut }) => signOut(getAuth())); }}
        className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
      >
        登出並返回登入頁面
      </button>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireStaff = false
}) => {
  const { user, loading, isAdmin, isStaff, userStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">正在驗證身份...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 若帳號狀態為 pending，且不是 admin，顯示等待審核頁面
  if (userStatus === 'pending' && !isAdmin) {
    return <PendingApprovalPage />;
  }

  // 若帳號被停用
  if (userStatus === 'disabled' && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-2">帳號已被停用</h1>
        <p className="text-slate-500 mb-6">您的帳號已被管理員停用，如有疑問請聯絡系統管理員。</p>
        <button
          onClick={() => { import('firebase/auth').then(({ getAuth, signOut }) => signOut(getAuth())); }}
          className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium text-sm"
        >
          登出
        </button>
      </div>
    );
  }

  // 權限檢查
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireStaff && !isStaff && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
