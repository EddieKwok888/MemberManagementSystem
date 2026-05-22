import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, functions } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Phone, MapPin, User, CheckCircle2, AlertCircle } from 'lucide-react';

const EditProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    realName: '',
  });
  const [initialData, setInitialData] = useState({
    phone: '',
    address: '',
    realName: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedData = {
            phone: data.phone || '',
            address: data.address || '',
            realName: data.realName || '',
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      } catch (err) {
        console.error("獲取檔案失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    // 電話資料驗證：香港電話 8 位數字 (除去空格、橫線、括號及 +852/852 國碼前綴後，必須是 8 位數字)
    const rawPhone = formData.phone || '';
    let cleanedPhone = rawPhone.replace(/[\s\-()]/g, '');
    if (cleanedPhone.startsWith('+852')) {
      cleanedPhone = cleanedPhone.substring(4);
    } else if (cleanedPhone.startsWith('852') && cleanedPhone.length > 8) {
      cleanedPhone = cleanedPhone.substring(3);
    }

    if (!cleanedPhone) {
      setError('請輸入聯絡電話。');
      return;
    }

    if (!/^\d{8}$/.test(cleanedPhone)) {
      setError('電話資料格式不正確，必須是 8 位數字的香港電話（例如：21234567 或 91234567）。');
      return;
    }

    // 將整理後的乾淨 8 位數字電話更新回表單狀態中
    const finalFormData = {
      ...formData,
      phone: cleanedPhone
    };

    // 計算是否有任何異動，實現精準的異動追蹤
    const changedFields: Record<string, any> = {};
    let hasChanges = false;
    if (finalFormData.realName !== initialData.realName) {
      changedFields.realName = finalFormData.realName;
      hasChanges = true;
    }
    if (finalFormData.phone !== initialData.phone) {
      changedFields.phone = finalFormData.phone;
      hasChanges = true;
    }
    if (finalFormData.address !== initialData.address) {
      changedFields.address = finalFormData.address;
      hasChanges = true;
    }

    if (!hasChanges) {
      // 沒有任何修改，直接顯示成功並返回
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }
    
    setSaving(true);
    try {
      // 1. 同步更新 Firebase Auth Profile
      await updateProfile(user, { displayName: finalFormData.realName });

      // 2. 同步更新 Firestore 中的 users 檔案 (確保前台顯示即時更新)
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        ...finalFormData,
        displayName: finalFormData.realName,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 3. 呼叫已部署的後端 Cloud Function，繞過客戶端規則限制，安全寫入 UPDATE_SELF_PROFILE 審計日誌
      const updateMemberProfileFn = httpsCallable(functions, 'updateMemberProfile');
      await updateMemberProfileFn({
        uid: user.uid,
        updates: changedFields
      });

      // 更新快取以追蹤隨後的更改
      setFormData(finalFormData);
      setInitialData({ ...finalFormData });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("更新失敗", err);
      setError('保存失敗，請重試。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/profile" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            返回個人檔案
          </Link>
          <h1 className="text-xl font-bold text-slate-800">編輯個人資料</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="realName">
                真實姓名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="realName"
                  type="text"
                  value={formData.realName}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="請輸入您的真實姓名"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="phone">
                聯絡電話
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="例如：+852 1234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="address">
                詳細地址
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-slate-400 w-4 h-4" />
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                  placeholder="請輸入您的完整收貨地址"
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    保存更改
                  </>
                )}
              </button>

              {success && (
                <div className="flex items-center gap-2 text-emerald-600 font-medium animate-bounce">
                  <CheckCircle2 className="w-5 h-5" />
                  更新成功！
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>


  );
};

export default EditProfilePage;
