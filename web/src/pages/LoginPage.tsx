import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('登入失敗，請檢查電郵和密碼是否正確。');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (testEmail: string, testPass: string) => {
    setLoading(true);
    setError('');
    setEmail(testEmail);
    setPassword(testPass);

    try {
      await signInWithEmailAndPassword(auth, testEmail, testPass);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('快速登入失敗，請確認該測試帳號是否存在且密碼為 123456');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <LogIn className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">歡迎回來</h1>
          <p className="text-slate-500 mt-2 text-sm text-center">請登入您的帳戶以存取會員管理系統</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                placeholder="example@mail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>登入系統</span>
                <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* 測試用 Quick Login */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Quick Login (測試通道)</p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@vexperthk.com', '123456')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors text-sm font-bold disabled:opacity-50"
              >
                👑 系統管理員
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('test@vexperthk.com', '123456')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-bold disabled:opacity-50"
              >
                👤 一般會員
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('disable@vexperthk.com', '123456')}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors text-sm font-bold disabled:opacity-50"
            >
              🚫 內部停用測試
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            還沒有帳戶？{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              立即註冊
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
