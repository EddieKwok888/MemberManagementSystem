import React, { useEffect, useState, useMemo } from 'react';
import { db, functions } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Activity, Clock, Loader2, Trash2, Search, Calendar, AlertTriangle, X } from 'lucide-react';

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search & Cleanup States
  const [searchTerm, setSearchTerm] = useState('');
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const deleteAuditLogsFn = httpsCallable(functions, 'deleteAuditLogs');

  const getActionDescription = (log: any) => {
    const admin = log.adminName || '管理員';
    
    // 智慧型目標解析 (處理舊資料或缺少 targetName 的情況)
    let target = log.targetName;
    const isUid = (s: string) => typeof s === 'string' && !!s.match(/^[A-Za-z0-9]{20,}$/);
    
    if (!target || target === 'System/Unknown' || isUid(target)) {
      // 嘗試從 details 提取更友好的名稱
      if (log.details?.displayName && log.details?.email) {
        target = `${log.details.displayName} (${log.details.email})`;
      } else if (log.details?.displayName) {
        target = log.details.displayName;
      } else if (log.details?.email) {
        target = log.details.email;
      } else {
        target = log.targetId || '未知對象';
      }
    }

    switch (log.action) {
      case 'CREATE_MEMBER':
        return `${admin} 創建了新會員：${target}`;
      case 'ASSIGN_ROLE': {
        const roleMap: Record<string, string> = { admin: '管理員', staff: '員工', member: '一般會員' };
        const roleName = roleMap[log.details?.newRole] || log.details?.newRole;
        return `${admin} 將「${target}」的角色變更為：${roleName}`;
      }
      case 'DISABLE_MEMBER':
        return `${admin} 停用了「${target}」的帳號`;
      case 'ENABLE_MEMBER':
        return `${admin} 重新啟用了「${target}」的帳號`;
      case 'DELETE_MEMBER':
        return `${admin} 永久刪除了會員「${target}」的資料`;
      case 'UPDATE_MEMBER_PROFILE': {
        const d = log.details || {};
        const fields = [];
        if (d.displayName) fields.push('姓名');
        if (d.email) fields.push('電郵');
        if (d.role) fields.push('角色');
        if (d.phone) fields.push('電話');
        if (d.address) fields.push('地址');
        const fieldStr = fields.length > 0 ? ` (${fields.join('、')})` : '';
        return `${admin} 修改了「${target}」的個人資料${fieldStr}`;
      }
      case 'RESET_PASSWORD_REQUEST':
        return `${admin} 為「${target}」發送了密碼重置請求`;
      case 'IMPERSONATE_USER':
        return `${admin} 以「${target}」的身分進行了快速登入`;
      case 'CLEANUP_AUDIT_LOGS':
        return `${admin} 清理了系統日誌（共刪除 ${log.details?.deletedCount || 0} 筆，截至 ${log.details?.targetDate || '未知日期'}）`;
      case 'UPDATE_SYSTEM_SETTINGS': {
        const d = log.details || {};
        const changes: string[] = [];
        if (d.maintenanceMode !== undefined)
          changes.push(`系統維護模式：${d.maintenanceMode ? '✅ 開啟' : '❌ 關閉'}`);
        if (d.allowPublicRegistration !== undefined)
          changes.push(`開放外部註冊：${d.allowPublicRegistration ? '✅ 允許' : '❌ 關閉'}`);
        if (d.defaultMemberStatus !== undefined)
          changes.push(`新會員預設狀態：${d.defaultMemberStatus === 'active' ? '直接啟用' : '待審核'}`);
        if (d.adminAlertEmail !== undefined)
          changes.push(`警報信箱：${d.adminAlertEmail || '(未設定)'}`);
        return changes.length > 0
          ? `${admin} 更新了系統設定：${changes.join('、')}`
          : `${admin} 更新了系統設定`;
      }
      default:
        return `${admin} 執行了操作：${log.action}`;
    }
  };

  const renderDetails = (log: any) => {
    const { details, action } = log;
    if (!details) return <span className="text-slate-400 italic text-xs">無詳細技術資料</span>;

    const items: { label: string; value: any }[] = [];
    
    // 翻譯常見 key
    const keyMap: any = {
      email: '電子郵件',
      displayName: '顯示名稱',
      role: '角色',
      status: '狀態',
      phone: '電話',
      address: '地址',
      newRole: '新角色',
      deletedCount: '刪除數量',
      targetDate: '基準日期',
      note: '備註',
      action: '操作類型',
      maintenanceMode: '維護模式',
      allowPublicRegistration: '開放公開註冊',
      defaultMemberStatus: '預設會員狀態',
      adminAlertEmail: '警報信箱',
      updatedBy: '更新者 UID'
    };

    Object.entries(details).forEach(([key, val]) => {
      // 忽略時間戳等內部欄位
      if (['timestamp', 'updatedAt', 'createdAt', 'metadata'].includes(key)) return;
      
      let label = keyMap[key] || key;
      let displayVal = val;
      
      if (typeof val === 'boolean') {
        displayVal = val ? '✅ 是 / 開啟' : '❌ 否 / 關閉';
      } else if (val === null || val === undefined || val === '') {
        displayVal = '(未設定)';
      } else if (key === 'defaultMemberStatus') {
        displayVal = val === 'active' ? '直接啟用' : '待審核';
      } else if (key === 'role' || key === 'newRole') {
        const roleMap: any = { admin: '管理員', staff: '員工', member: '一般會員' };
        displayVal = roleMap[val as string] || val;
      } else if (key === 'updatedBy') {
        displayVal = (val === log.adminUid) ? (log.adminName || val) : val;
      }
      
      items.push({ label, value: String(displayVal) });
    });

    if (items.length === 0) return <pre className="text-[10px] text-slate-400">{JSON.stringify(details, null, 2)}</pre>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 py-1">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-1">
            <span className="text-indigo-400 font-medium text-[11px]">{item.label}</span>
            <span className="text-slate-200 text-[11px]">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };


  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const lowerSearch = searchTerm.toLowerCase();
    return logs.filter(log => {
      const desc = getActionDescription(log).toLowerCase();
      const raw = JSON.stringify(log).toLowerCase();
      const dateStr = log.timestamp?.toDate().toLocaleString().toLowerCase() || '';
      return desc.includes(lowerSearch) || raw.includes(lowerSearch) || dateStr.includes(lowerSearch);
    });
  }, [logs, searchTerm]);

  const handleCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate || !adminPassword) {
      alert("請填寫完整資訊");
      return;
    }
    const selected = new Date(targetDate);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (selected > threeDaysAgo) {
      alert("基於安全考量，只能刪除大於 3 天前的日誌資料。");
      return;
    }
    setCleanupLoading(true);
    try {
      const auth = getAuth();
      if (!auth.currentUser?.email) throw new Error("無法取得當前管理員信箱");
      // 1. 驗證密碼
      try {
        await signInWithEmailAndPassword(auth, auth.currentUser.email, adminPassword);
      } catch (err: any) {
        throw new Error("管理員密碼錯誤，拒絕刪除操作");
      }
      // 2. 呼叫後端刪除
      const result = await deleteAuditLogsFn({ targetDateStr: targetDate });
      const data = result.data as any;
      alert(`清理完成！共刪除了 ${data.count || 0} 筆日誌。`);
      setIsCleanupModalOpen(false);
      setAdminPassword('');
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      alert(`清理失敗: ${err.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, 'adminAuditLogs'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("獲取日誌失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-indigo-600" />
          審計日誌 (Audit Logs)
        </h1>
        <button 
          onClick={() => setIsCleanupModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-lg hover:bg-rose-100 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          清理資料
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋日誌內容或 UID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">時間</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">事件描述</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">技術詳情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {log.timestamp?.toDate().toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-700">
                            {getActionDescription(log)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                        >
                          {expandedId === log.id ? '隱藏' : '原始數據'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={3} className="px-6 py-4">
                          <div className="bg-slate-900 text-slate-300 p-5 rounded-xl shadow-inner border border-slate-800">
                            <div className="flex items-center gap-2 mb-4 text-indigo-400 border-b border-slate-800 pb-2">
                              <Search className="w-3 h-3" />
                              <span className="text-xs font-bold uppercase tracking-wider">技術詳情記錄 (Detailed Data)</span>
                            </div>
                             {renderDetails(log)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCleanupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Trash2 className="text-rose-600 w-5 h-5" />
                清理審計日誌
              </h2>
              <button 
                onClick={() => setIsCleanupModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCleanup} className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-800">資料將會被刪除，請考慮清楚後刪除資料。</h3>
                  <p className="text-xs text-rose-600 mt-1">
                    基於安全考量，您只能刪除「大於 3 天前」的日誌記錄。此操作無法復原。
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  刪除此日期(含)之前的資料
                </label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">管理員密碼驗證</label>
                <input
                  required
                  type="password"
                  placeholder="請輸入您的登入密碼"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCleanupModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={cleanupLoading}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 text-sm"
                >
                  {cleanupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認刪除'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
