import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, MapPin, Phone, Edit3, ArrowLeft, Loader2, Award, Lock } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {

        console.error("獲取檔案失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            返回儀表板
          </Link>
          <Link to="/edit-profile" className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Edit3 className="w-4 h-4" />
            編輯檔案
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
          
          <div className="px-8 pb-8">
            <div className="relative -top-12 flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
                <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <User className="w-12 h-12" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-800">{user?.displayName}</h1>
                <div className="flex items-center gap-3 mt-1 text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  基本聯絡資訊
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">真實姓名</p>
                      <p className="text-slate-700 font-semibold">{profile?.realName || '未設置'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Phone className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">聯絡電話</p>
                      <p className="text-slate-700 font-semibold">{profile?.phone || '未設置'}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">收貨地址</p>
                      <p className="text-slate-700 font-semibold">{profile?.address || '未設置'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-xs text-slate-400 italic">帳戶資料受 SSL 加密保護，僅限您本人與系統管理員查看。</p>
                <Link to="/change-password" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50">
                  <Lock className="w-4 h-4" />
                  修改登入密碼
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
