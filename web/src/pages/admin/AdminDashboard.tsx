import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Users, Activity, Settings, LayoutDashboard, ArrowLeft, Loader2 } from 'lucide-react';
import { collection, getCountFromServer, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import MemberManagement from './MemberManagement';
import AuditLogViewer from './AuditLogViewer';
import SystemSettings from './SystemSettings';

const OverviewPanel = () => {
  const [stats, setStats] = useState({ total: 0, newToday: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRef = collection(db, 'users');
        
        // 總會員
        const totalSnap = await getCountFromServer(usersRef);
        const total = totalSnap.data().count;

        // 停用會員 (作為系統警告參考)
        const disabledQuery = query(usersRef, where('status', '==', 'disabled'));
        const disabledSnap = await getCountFromServer(disabledQuery);
        const disabled = disabledSnap.data().count;

        // 今日新增會員 (取代今日活躍)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newTodayQuery = query(usersRef, where('createdAt', '>=', Timestamp.fromDate(today)));
        const newTodaySnap = await getCountFromServer(newTodayQuery);
        const newToday = newTodaySnap.data().count;

        setStats({ total, newToday, disabled });
      } catch (err) {
        console.error("無法取得統計:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium">總會員數</p>
          <p className="text-4xl font-black text-slate-800 mt-2">{stats.total}</p>
          <div className="mt-4 text-emerald-600 text-xs font-bold flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             真實數據即時同步
          </div>
       </div>
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium">今日新增會員</p>
          <p className="text-4xl font-black text-slate-800 mt-2">{stats.newToday}</p>
          <div className="mt-4 text-indigo-600 text-xs font-bold">穩定運行中</div>
       </div>
       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium">停用帳號警告</p>
          <p className="text-4xl font-black text-slate-800 mt-2">{stats.disabled}</p>
          <div className={`mt-4 text-xs font-bold ${stats.disabled > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {stats.disabled > 0 ? '有停用的帳號，請注意名單' : '一切正常'}
          </div>
       </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: '概覽' },
    { path: '/admin/members', icon: Users, label: '會員管理' },
    { path: '/admin/logs', icon: Activity, label: '審計日誌' },
    { path: '/admin/settings', icon: Settings, label: '系統設置' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 側邊欄 Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Admin Pro</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>返回門戶</span>
          </Link>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto h-screen p-8">
        <header className="mb-8 flex justify-between items-center lg:hidden">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <span className="font-bold text-xl">Admin Pro</span>
            </div>
        </header>

        <Routes>
          <Route path="/" element={<OverviewPanel />} />
          <Route path="/members" element={<MemberManagement />} />
          <Route path="/logs" element={<AuditLogViewer />} />
          <Route path="/settings" element={<SystemSettings />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
