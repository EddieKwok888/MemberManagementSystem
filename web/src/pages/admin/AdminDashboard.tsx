import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Users, Activity, Settings, LayoutDashboard, ArrowLeft, Loader2, Menu, X, Clock, UserCheck, Trash2 } from 'lucide-react';
import { collection, getCountFromServer, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db, functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import MemberManagement from './MemberManagement';
import AuditLogViewer from './AuditLogViewer';
import SystemSettings from './SystemSettings';

const OverviewPanel = () => {
  const [stats, setStats] = useState({ total: 0, newToday: 0, disabled: 0, pending: 0 });
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  const toggleMemberStatusFn = httpsCallable(functions, 'toggleMemberStatus');
  const deleteMemberFn = httpsCallable(functions, 'deleteMember');

  const fetchStatsAndPending = async () => {
    try {
      const usersRef = collection(db, 'users');
      
      // 總會員
      const totalSnap = await getCountFromServer(usersRef);
      const total = totalSnap.data().count;

      // 停用會員
      const disabledQuery = query(usersRef, where('status', '==', 'disabled'));
      const disabledSnap = await getCountFromServer(disabledQuery);
      const disabled = disabledSnap.data().count;

      // 待審核會員
      const pendingQuery = query(usersRef, where('status', '==', 'pending'));
      const pendingSnap = await getCountFromServer(pendingQuery);
      const pending = pendingSnap.data().count;

      // 今日新增會員
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newTodayQuery = query(usersRef, where('createdAt', '>=', Timestamp.fromDate(today)));
      const newTodaySnap = await getCountFromServer(newTodayQuery);
      const newToday = newTodaySnap.data().count;

      setStats({ total, newToday, disabled, pending });

      // 獲取待審核會員詳細資料
      const pendingMembersSnap = await getDocs(pendingQuery);
      const pendingList = pendingMembersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingMembers(pendingList);
    } catch (err) {
      console.error("無法取得概覽數據:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndPending();
  }, []);

  const handleApprove = async (uid: string, displayName: string) => {
    if (!confirm(`確定要啟用「${displayName}」的會員帳號嗎？`)) return;
    setApprovingUid(uid);
    try {
      await toggleMemberStatusFn({ targetUid: uid, action: 'enable' });
      alert(`已成功啟用「${displayName}」的帳號！`);
      await fetchStatsAndPending(); // 重新整理統計與名單
    } catch (err: any) {
      console.error("啟用失敗:", err);
      alert(`啟用失敗: ${err.message || '請稍後再試'}`);
    } finally {
      setApprovingUid(null);
    }
  };

  const handleDelete = async (uid: string, displayName: string) => {
    if (!confirm(`⚠️ 確定要永久刪除並拒絕「${displayName}」的註冊申請嗎？\n\n此操作無法復原，該用戶的所有資料將被清除。`)) return;
    setDeletingUid(uid);
    try {
      await deleteMemberFn({ targetUid: uid });
      alert(`「${displayName}」的帳號已被拒絕並成功刪除。`);
      await fetchStatsAndPending(); // 重新整理統計與名單
    } catch (err: any) {
      console.error("刪除失敗:", err);
      alert(`刪除失敗: ${err.message || '請稍後再試'}`);
    } finally {
      setDeletingUid(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <p className="text-slate-500 text-sm font-medium">待審核會員</p>
            <p className="text-4xl font-black text-slate-800 mt-2">{stats.pending}</p>
            <div className={`mt-4 text-xs font-bold flex items-center gap-1.5 ${stats.pending > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
               {stats.pending > 0 ? (
                 <>
                   <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                   {stats.pending} 個帳號等待審核
                 </>
               ) : '目前無待審核帳號'}
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-sm font-medium">停用帳號警告</p>
            <p className="text-4xl font-black text-slate-800 mt-2">{stats.disabled}</p>
            <div className={`mt-4 text-xs font-bold ${stats.disabled > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {stats.disabled > 0 ? '有停用的帳號，請注意名單' : '一切正常'}
            </div>
         </div>
      </div>

      {/* 待審核會員資料與提升啟用按鈕 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800">待審核會員名單</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
            共 {pendingMembers.length} 筆
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/30 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">會員資訊</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">註冊時間</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">快速操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    目前沒有任何等待審核的會員 🌟
                  </td>
                </tr>
              ) : (
                pendingMembers.map((member) => {
                  const regDate = member.createdAt?.toDate 
                    ? member.createdAt.toDate().toLocaleString('zh-HK') 
                    : '未知時間';
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">
                            {member.displayName?.charAt(0) || member.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{member.displayName || '無名氏'}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {regDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                          待審核 (Pending)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleApprove(member.id, member.displayName || member.email)}
                            disabled={approvingUid === member.id || deletingUid === member.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-xs disabled:opacity-50"
                          >
                            {approvingUid === member.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            批准啟用
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.displayName || member.email)}
                            disabled={approvingUid === member.id || deletingUid === member.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm text-xs disabled:opacity-50"
                            title="拒絕並永久刪除此帳號"
                          >
                            {deletingUid === member.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            拒絕刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: '概覽' },
    { path: '/admin/members', icon: Users, label: '會員管理' },
    { path: '/admin/logs', icon: Activity, label: '審計日誌' },
    { path: '/admin/settings', icon: Settings, label: '系統設置' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer (Side Navigation Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Menu */}
          <aside className="relative w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">Admin Pro</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
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
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回門戶</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

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
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
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
