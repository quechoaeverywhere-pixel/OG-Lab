import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usePermission } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

interface SessionLockScreenProps {
  theme?: 'dark' | 'light';
}

export const SessionLockScreen: React.FC<SessionLockScreenProps> = ({ theme = 'dark' }) => {
  const { isSessionLocked, unlockSession, isOwner } = usePermission();
  const { user, role, signInWithGoogle } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isSessionLocked) return null;

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    unlockSession();
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      await signInWithGoogle();
      unlockSession();
    } catch (err: any) {
      console.error('Session lock Google sign in error:', err);
      setError(err?.message || 'Không thể xác thực tài khoản Google. Vui lòng thử lại.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div
      id="session-lock-screen"
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl transition-all duration-300"
    >
      <div
        id="session-lock-card"
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-slate-900/95 border-amber-500/30 text-slate-100 shadow-amber-500/10'
            : 'bg-white border-amber-300 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Top Status Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-500" />

        <div className="p-6 md:p-8 space-y-6">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-center relative ${
                theme === 'dark'
                  ? 'bg-slate-950/80 border-amber-500/40 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <Lock className="w-8 h-8 animate-pulse text-amber-500" />
              <div className="absolute -top-1 -right-1 p-1 rounded-full bg-purple-600 text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <span
                className={`inline-block text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  theme === 'dark'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-amber-100 border-amber-200 text-amber-900'
                }`}
              >
                Shinbashira Zero-Trust Protection
              </span>
              <h2
                className={`text-xl font-bold font-tech uppercase tracking-wide ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Khóa Bảo Vệ Phiên Làm Việc
              </h2>
              <p
                className={`text-xs font-sans ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Phiên làm việc đã tự động tạm khóa để bảo vệ tri thức và cài đặt hệ thống.
              </p>
            </div>
          </div>

          {/* Account Card info */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3.5 text-xs ${
              theme === 'dark'
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {user ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/40 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {(user.displayName || 'H').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-bold truncate text-xs">
                {user ? (user.displayName || user.email) : 'Phiên Học Giả Độc Giả'}
              </p>
              <p className="text-[11px] opacity-75 truncate">
                {user ? user.email : 'Quyền truy cập: Read-Only Mode'}
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-mono border border-current font-bold uppercase">
                  {role === 'admin' ? 'System Owner / Admin' : role === 'author' ? 'Tác Giả (Author)' : 'Độc Giả (Viewer)'}
                </span>
              </div>
            </div>
          </div>

          {/* Unlock Actions */}
          <div className="space-y-3">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="btn-unlock-session"
              type="button"
              onClick={() => handleUnlock()}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-tech uppercase tracking-wider text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở Khóa Phiên Nghiên Cứu</span>
            </button>

            {!user && (
              <button
                id="btn-session-google-login"
                type="button"
                disabled={isAuthenticating}
                onClick={handleGoogleSignIn}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold font-tech uppercase tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-purple-500/40 text-purple-300 hover:bg-purple-950/40'
                    : 'border-purple-300 text-purple-900 hover:bg-purple-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>{isAuthenticating ? 'Đang xác thực...' : 'Đăng Nhập Xác Thực Độc Giả'}</span>
              </button>
            )}
          </div>

          {/* Footer Notice */}
          <div className="pt-2 text-center border-t border-slate-800/40">
            <p className={`text-[10.5px] font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
              OG Agentic Intelligence • Zero-Trust Session Security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
