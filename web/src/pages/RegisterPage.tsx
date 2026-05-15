import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, ShieldOff } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'systemSettings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAllowRegistration(data.allowPublicRegistration !== false);
      }
      setSettingsLoading(false);
    }, () => {
      // If settings can't be read, allow registration by default
      setSettingsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowRegistration) return;
    setLoading(true);
    setError('');

    try {
      // 1. 讀取系統設定的預設會員狀態
      const { doc: firestoreDoc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const settingsSnap = await getDoc(firestoreDoc(db, 'systemSettings', 'config'));
      const defaultStatus = settingsSnap.exists()
        ? (settingsSnap.data().defaultMemberStatus || 'active')
        : 'active';

      // 2. 在 Firebase Auth 中建立帳號
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      // 3. 在 Firestore 中建立用戶文件，套用預設狀態
      await setDoc(firestoreDoc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName,
        role: 'member',
        status: defaultStatus,
        createdAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err: any) {
      console.error("註冊失敗詳情:", err);
      const errorMsg = `Error [${err.code || 'unknown'}]: ${err.message || '註冊失敗'}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Registration is disabled by admin
  if (!allowRegistration) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">目前暫不開放註冊</h1>
          <p className="text-slate-500 text-sm mb-8">
            系統管理員已暫停新會員自助註冊功能。<br />如需帳號，請聯絡管理員。
          </p>
          <Link
            to="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            返回登入頁面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
            <UserPlus className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">加入系統</h1>
          <p className="text-slate-500 mt-2 text-sm text-center">填寫以下資料以建立您的會員帳戶</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block" htmlFor="displayName">
              顯示名稱
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-800"
                placeholder="您的姓名"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block" htmlFor="email">
              電子郵件
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-800"
                placeholder="example@mail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block" htmlFor="password">
              密碼
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-800"
                placeholder="至少 6 個字元"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-emerald-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>註冊帳戶</span>
                <UserPlus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            已經有帳戶了？{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
              立即登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
