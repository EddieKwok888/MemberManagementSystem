import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../../firebase';
import { collection, query, limit, getDocs, startAfter, doc, updateDoc } from 'firebase/firestore';
import { Users, Search, UserPlus, Shield, UserX, UserCheck, Trash2, MoreVertical, Loader2, ChevronLeft, ChevronRight, Filter, X, LogIn } from 'lucide-react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  
  const navigate = useNavigate();

  // 定義雲端函數
  const toggleMemberStatusFn = httpsCallable(functions, 'toggleMemberStatus');
  const deleteMemberFn = httpsCallable(functions, 'deleteMember');
  const createMemberFn = httpsCallable(functions, 'createMember');
  const assignRoleFn = httpsCallable(functions, 'assignRole');
  const impersonateUserFn = httpsCallable(functions, 'impersonateUser');
  const updateMemberByAdminFn = httpsCallable(functions, 'updateMemberByAdmin');

  const fetchMembers = async (isNext = false) => {
    setLoading(true);
    try {
      console.log("Fetching members from Firestore...");
      let q = query(
        collection(db, 'users'),
        limit(10)
      );

      if (isNext && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      console.log("Firestore snapshot size:", snapshot.size);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched data:", data);
      
      setMembers(data);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setIsFirstPage(!isNext);
    } catch (err: any) {
      console.error("獲取會員失敗詳情:", err);
      alert(`讀取列表失敗: ${err.message || '權限不足或網路問題'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await updateMemberByAdminFn({
        targetUid: editingMember.id,
        email: editingMember.email,
        displayName: editingMember.displayName,
        role: editingMember.role,
        phone: editingMember.phone || '',
        address: editingMember.address || '',
      });

      setIsEditModalOpen(false);
      fetchMembers();
      alert('會員資料更新成功！');
    } catch (err: any) {
      console.error("更新失敗:", err);
      alert(`更新失敗: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    const isActive = currentStatus === 'active';
    const action = isActive ? 'disable' : 'enable';
    const confirmMsg = isActive ? '確定要停用此帳號嗎？' : '確定要重新啟用此帳號嗎？';
    
    if (!confirm(confirmMsg)) return;
    
    setActionLoading(uid);
    try {
      await toggleMemberStatusFn({ targetUid: uid, action });
      fetchMembers(); // 重新整理
    } catch (err) {
      alert('操作失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (uid: string, name: string) => {
    if (!confirm(`確定要以 [${name}] 的身分登入嗎？\n這將登出您目前的管理員帳號。`)) return;
    
    setActionLoading(`impersonate_${uid}`);
    try {
      // 1. 取得 Custom Token
      const result = await impersonateUserFn({ targetUid: uid });
      const { customToken } = result.data as { customToken: string };

      // 2. 登出目前帳號，然後使用 Custom Token 登入
      const auth = getAuth();
      await auth.signOut();
      await signInWithCustomToken(auth, customToken);

      // 3. 導向首頁
      alert(`已成功切換身分為：${name}`);
      navigate('/');
    } catch (err: any) {
      console.error("切換身分失敗:", err);
      alert('無法切換身分，請確認您有足夠的權限。');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { auth } = await import('../../firebase');
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      const result = await createMemberFn(newMember);
      console.log("Cloud function response:", result);
      setIsAddModalOpen(false);
      setNewMember({ email: '', password: '', displayName: '' });
      fetchMembers();
      alert('會員創建成功！');
    } catch (err: any) {
      console.error("創建會員失敗詳情:", err);
      const errorMsg = `Error [${err.code || 'unknown'}]: ${err.message || '未知錯誤'}`;
      alert(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (uid: string, name: string) => {
    if (!confirm(`⚠️ 確定要永久刪除「${name}」的帳號嗎？\n\n此操作無法復原，該用戶的所有資料將被清除。`)) return;
    setActionLoading(`delete_${uid}`);
    try {
      await deleteMemberFn({ targetUid: uid });
      fetchMembers();
      alert(`「${name}」的帳號已成功刪除。`);
    } catch (err: any) {
      console.error('刪除失敗:', err);
      alert(`刪除失敗: ${err.message || '請稍後再試'}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-indigo-600" />
          會員管理
        </h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          新增會員
        </button>
      </div>

      {/* 搜尋與過濾 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋姓名或電郵..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Filter className="w-4 h-4" />
          過濾器
        </button>
      </div>

      {/* 會員表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">會員資訊</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">狀態</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    暫無會員數據
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {member.displayName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{member.displayName}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        member.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                        member.role === 'staff' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {member.role === 'admin' ? '管理員' : member.role === 'staff' ? '員工' : '會員'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        member.status !== 'disabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {member.status !== 'disabled' ? '正常' : '已停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleImpersonate(member.id, member.displayName)}
                          disabled={actionLoading === `impersonate_${member.id}`}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                          title="Quick Login (以該身分登入)"
                        >
                          {actionLoading === `impersonate_${member.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingMember({ 
                              ...member, 
                              originalRole: member.role,
                              phone: member.phone || '',
                              address: member.address || ''
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                          title="編輯資料"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(member.id, member.status !== 'disabled' ? 'active' : 'disabled')}
                          disabled={actionLoading === member.id}
                          className={`p-2 transition-colors rounded-lg ${
                            member.status !== 'disabled' 
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={member.status !== 'disabled' ? "停用帳號" : "恢復帳號"}
                        >
                          {actionLoading === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : member.status !== 'disabled' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.displayName || member.email)}
                          disabled={actionLoading === `delete_${member.id}`}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 disabled:opacity-50"
                          title="永久刪除"
                        >
                          {actionLoading === `delete_${member.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁控制 */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            顯示第 {members.length} 位會員
          </p>
          <div className="flex gap-2">
            <button 
              disabled={isFirstPage || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => fetchMembers(true)}
              disabled={loading || members.length < 10}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 編輯會員 Modal */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-indigo-600 w-5 h-5" />
                編輯會員資料
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">顯示名稱</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={editingMember.displayName}
                  onChange={e => setEditingMember({ ...editingMember, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">電子郵件</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={editingMember.email}
                  onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">電話資料</label>
                <input
                  type="tel"
                  placeholder="可選填"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={editingMember.phone}
                  onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">詳細地址</label>
                <textarea
                  placeholder="可選填"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                  value={editingMember.address}
                  onChange={e => setEditingMember({ ...editingMember, address: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">系統角色</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={editingMember.role}
                  onChange={e => setEditingMember({ ...editingMember, role: e.target.value })}
                >
                  <option value="member">一般會員</option>
                  <option value="staff">員工</option>
                  <option value="admin">管理員</option>
                </select>
                <p className="text-[10px] text-slate-400">更改角色將影響該用戶的系統訪問權限</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-sm"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '儲存變更'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增會員 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="text-indigo-600 w-5 h-5" />
                新增會員
              </h2>
              <button 
                type="button"
                onClick={() => {
                  console.log("Closing modal via X button");
                  setIsAddModalOpen(false);
                }}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                console.log("Form onSubmit triggered");
                handleAddMember(e);
              }} 
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">顯示名稱</label>
                <input
                  required
                  name="displayName"
                  type="text"
                  placeholder="例如：王小明"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  value={newMember.displayName}
                  onChange={e => setNewMember({ ...newMember, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">電子郵件</label>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">初始密碼</label>
                <input
                  required
                  name="password"
                  type="password"
                  placeholder="至少 6 位字元"
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  value={newMember.password}
                  onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-sm"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    '確認新增'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
