import React from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User, Shield, Users, Settings, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';


const Dashboard: React.FC = () => {
  const { user, role, isAdmin, isStaff } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("登出失敗", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 導航欄 */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-lg hidden sm:block">會員管理系統</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-sm font-semibold text-slate-800">{user?.displayName || '用戶'}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {role}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium text-sm border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">登出</span>
          </button>
        </div>
      </nav>

      {/* 主內容 */}
      <main className="p-6 max-w-7xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">歡迎回來</h2>
          <p className="text-slate-500 mt-1">這是您的系統概覽與管理面板</p>
        </header>

        {/* 快捷功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/profile" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">個人資料</h3>
            <p className="text-sm text-slate-500 mt-1">查看並修改您的帳戶資訊</p>
          </Link>


          {(isAdmin || isStaff) && (
            <Link to={isAdmin ? "/admin/members" : "#"} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800">會員管理</h3>
              <p className="text-sm text-slate-500 mt-1">查看與管理系統會員名單</p>
            </Link>
          )}

          {isAdmin && (
            <>
              <Link to="/admin/logs" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">審計日誌</h3>
                <p className="text-sm text-slate-500 mt-1">監控所有管理員的操作記錄</p>
              </Link>

              <Link to="/admin/settings" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">系統設置</h3>
                <p className="text-sm text-slate-500 mt-1">配置全局系統參數與功能</p>
              </Link>
            </>
          )}

        </div>


      </main>
    </div>
  );
};

export default Dashboard;
