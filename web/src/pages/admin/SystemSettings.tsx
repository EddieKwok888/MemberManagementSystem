import React, { useEffect, useState } from 'react';
import { db, functions } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Settings, Shield, Bell, Users, Save, Loader2, AlertTriangle } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    adminAlertEmail: '',
    allowPublicRegistration: true,
    defaultMemberStatus: 'active'
  });

  const updateSystemSettingsFn = httpsCallable(functions, 'updateSystemSettings');

  useEffect(() => {
    // Listen to real-time updates so multiple admins see the same state
    const unsubscribe = onSnapshot(doc(db, 'systemSettings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          maintenanceMode: data.maintenanceMode ?? false,
          adminAlertEmail: data.adminAlertEmail ?? '',
          allowPublicRegistration: data.allowPublicRegistration ?? true,
          defaultMemberStatus: data.defaultMemberStatus ?? 'active'
        }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettingsFn(settings);
      alert('系統設置更新成功！');
    } catch (err: any) {
      console.error(err);
      alert(`更新失敗: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系統設置</h1>
          <p className="text-slate-500 text-sm">管理系統全域的參數與安全狀態</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Security Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">安全與登入設定</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">系統維護模式</h3>
                <p className="text-xs text-slate-500 mt-1">開啟後，所有非管理員用戶將被強制登出並阻擋登入，顯示維護中畫面。</p>
                {settings.maintenanceMode && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-flex">
                    <AlertTriangle className="w-4 h-4" />
                    注意：維護模式目前已開啟！
                  </div>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">通知與警報設定</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">管理員警報通知信箱</label>
              <p className="text-xs text-slate-500 mb-2">當系統發生重要事件（如資料刪除）時，可發送通知至此信箱（註：實際寄信功能需後續串接服務）。</p>
              <input
                type="email"
                placeholder="例如: admin@vexperthk.com"
                className="w-full max-w-md px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={settings.adminAlertEmail}
                onChange={e => setSettings({ ...settings, adminAlertEmail: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Registration Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">會員註冊與預設值</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">開放外部陌生人註冊</h3>
                <p className="text-xs text-slate-500 mt-1">關閉後，登入頁面的「註冊」選項將會被隱藏並禁用，只能由管理員手動建立會員。</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.allowPublicRegistration}
                  onChange={(e) => setSettings({...settings, allowPublicRegistration: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-semibold text-slate-700">新註冊會員預設狀態</label>
              <p className="text-xs text-slate-500 mb-2">決定新會員註冊成功後，是直接可以登入使用，還是需要等待審核。</p>
              <select 
                className="w-full max-w-md px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={settings.defaultMemberStatus}
                onChange={e => setSettings({ ...settings, defaultMemberStatus: e.target.value })}
              >
                <option value="active">直接啟用 (Active)</option>
                <option value="pending">待審核 (Pending)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            儲存所有設定
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
