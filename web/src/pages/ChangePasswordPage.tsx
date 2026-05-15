import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

const ChangePasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error("更新密碼失敗", err);
      if (err.code === 'auth/requires-recent-login') {
        setError('基於安全性考量，此操作需要您重新登入後再試。');
      } else {
        setError('密碼更新失敗，請確保密碼至少為 6 位字元。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="mb-6">
          <Link to="/profile" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            返回個人檔案
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">修改登入密碼</h1>
            <p className="text-slate-500 text-sm text-center mt-1">請定期更換密碼以確保帳戶安全</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>密碼已成功更新！</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="newPassword">
                新密碼
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="至少 6 個字元"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="confirmPassword">
                確認新密碼
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="再次輸入新密碼"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>更新密碼</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
