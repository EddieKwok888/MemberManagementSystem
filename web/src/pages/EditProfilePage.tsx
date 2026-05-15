import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Phone, MapPin, User, CheckCircle2 } from 'lucide-react';

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'memberProfiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            phone: data.phone || '',
            address: data.address || '',
            realName: data.realName || '',
          });
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
    
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("更新失敗", err);
      alert("保存失敗，請重試。");
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
