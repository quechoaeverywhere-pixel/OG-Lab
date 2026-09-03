import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  Edit3,
  FolderPlus,
  Settings,
  Shield,
  X,
  LogIn,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserCheck,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AtomicPermission, ATOMIC_PERMISSIONS_CONFIG, AtomicPermissionMeta } from '../types/permissions';

interface AccessDeniedOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: AtomicPermission;
  customTitle?: string;
  customMessage?: string;
  theme?: 'dark' | 'light';
}

export const AccessDeniedOverlay: React.FC<AccessDeniedOverlayProps> = ({
  isOpen,
  onClose,
  permission = 'compose_article',
  customTitle,
  customMessage,
  theme = 'dark'
}) => {
  const { signInWithGoogle, user, userProfile, role, activateAuthorRole } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeStatus, setPasscodeStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const permMeta: AtomicPermissionMeta = ATOMIC_PERMISSIONS_CONFIG[permission] || ATOMIC_PERMISSIONS_CONFIG.compose_article;

  const handleRequestAccess = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error in AccessDeniedOverlay:', err);
      setSignInError(err?.message || 'Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleActivateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsActivating(true);
    setPasscodeStatus(null);
    try {
      const res = await activateAuthorRole(passcode.trim());
      setPasscodeStatus(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setPasscodeStatus({ success: false, message: 'Đã xảy ra lỗi khi kiểm tra mã ủy quyền.' });
    } finally {
      setIsActivating(false);
    }
  };

  const renderIcon = () => {
    switch (permMeta.iconType) {
      case 'edit':
        return <Edit3 className="w-6 h-6 text-amber-400" />;
      case 'sparkles':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'folder':
        return <FolderPlus className="w-6 h-6 text-blue-400" />;
      case 'settings':
        return <Settings className="w-6 h-6 text-indigo-400" />;
      case 'shield':
      default:
        return <Lock className="w-6 h-6 text-rose-400" />;
    }
  };

  return (
    <div
      id="access-denied-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        id="access-denied-card"
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl transition-all ${
          theme === 'dark'
            ? 'bg-slate-900/95 border-amber-500/30 text-slate-100 shadow-amber-500/5'
            : 'bg-white border-amber-300 text-slate-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon / Status bar */}
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${
            permission === 'compose_article'
              ? 'from-amber-500 via-orange-500 to-rose-500'
              : permission === 'ai_research'
              ? 'from-purple-500 via-indigo-500 to-cyan-500'
              : 'from-blue-500 via-purple-500 to-pink-500'
          }`}
        />

        {/* Close Button */}
        <button
          id="btn-close-access-overlay"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl text-xs transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Đóng cửa sổ"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Top Title & Icon */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl border shrink-0 flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-slate-950/80 border-amber-500/30'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              {renderIcon()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    theme === 'dark'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-amber-100 border-amber-200 text-amber-900'
                  }`}
                >
                  Zero-Trust Access Control
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {permMeta.category}
                </span>
              </div>

              <h2
                className={`text-lg font-bold font-tech uppercase tracking-wide ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {customTitle || (user ? 'Yêu Cầu Quyền Tác Giả (Author)' : 'Chế Độ Độc Giả (Chỉ Xem)')}
              </h2>
            </div>
          </div>

          {/* User Account / Role Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-sans ${
              role === 'viewer'
                ? theme === 'dark'
                  ? 'bg-blue-950/30 border-blue-800/40 text-blue-300'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
                : theme === 'dark'
                ? 'bg-amber-950/20 border-amber-800/30 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {user ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-current shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {(user.displayName || 'H').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <Eye className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {user ? (user.displayName || 'Học Giả Độc Giả') : 'Phiên Học Giả Chưa Xác Thực'}
                </p>
                <p className="text-[11px] opacity-80">
                  Vai trò hiện tại:{' '}
                  <span className="font-mono font-bold uppercase underline">
                    {role === 'guest' ? 'Khách Chỉ Xem' : role === 'viewer' ? 'Độc Giả (Viewer)' : role}
                  </span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-current font-bold uppercase shrink-0">
              {role === 'guest' ? 'Read-Only' : role === 'viewer' ? 'Viewer Mode' : 'Author Mode'}
            </span>
          </div>

          {/* Feature Badge Box */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 ${
              theme === 'dark'
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Thao tác yêu cầu quyền Tác Giả:
              </span>
              <span
                className={`text-xs font-bold font-sans ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {permMeta.name}
              </span>
            </div>

            <p
              className={`text-xs leading-relaxed font-sans ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {customMessage || permMeta.shortDesc}
            </p>
          </div>

          {/* Policy Explanation */}
          <div className="space-y-2">
            <h4
              className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Chính sách phân quyền bảo toàn tri thức:
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>Chế độ Độc Giả (Mặc định):</strong> Bạn có thể đọc, tra cứu Sổ Từ Điển, trích dẫn và sao chép tự do mọi công trình.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  <strong>Bảo vệ bản ghi:</strong> Mọi thao tác biên soạn, sửa thẻ nguyên tử, khởi tạo hồ sơ và lưu trữ đám mây yêu cầu quyền Tác Giả (Author) hoặc Quản Trị Viên (Admin).
                </span>
              </li>
            </ul>
          </div>

          {/* If Logged in as Viewer -> Show Passcode Elevation Form */}
          {user && role === 'viewer' && (
            <form onSubmit={handleActivateAuthor} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="author-passcode-input"
                  className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-purple-300' : 'text-purple-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  Mã ủy quyền Tác Giả (Author Activation Key):
                </label>
                <div className="flex gap-2">
                  <input
                    id="author-passcode-input"
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Nhập mã tác giả (ví dụ: OG-AUTHOR-2026)"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-950/80 border-purple-500/40 text-slate-100 focus:border-purple-400 placeholder-slate-500'
                        : 'bg-white border-purple-300 text-slate-900 focus:border-purple-600 placeholder-slate-400'
                    }`}
                  />
                  <button
                    id="btn-submit-passcode"
                    type="submit"
                    disabled={isActivating || !passcode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-tech uppercase tracking-wider text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    {isActivating ? 'Xác thực...' : 'Mở Khóa'}
                  </button>
                </div>
                <p className={`text-[10.5px] font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nhập mã ủy quyền do Hội đồng Oneness Governance cấp để nâng cấp tức thì lên quyền Tác Giả.
                </p>
              </div>

              {passcodeStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 font-sans ${
                    passcodeStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {passcodeStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{passcodeStatus.message}</span>
                </div>
              )}
            </form>
          )}

          {/* Error notice if any */}
          {signInError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{signInError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {!user ? (
              <button
                id="btn-request-access-login"
                disabled={isSigningIn}
                onClick={handleRequestAccess}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-tech uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSigningIn ? 'Đang xác thực...' : 'Đăng nhập Google để định danh'}</span>
              </button>
            ) : null}

            <button
              id="btn-cancel-access-overlay"
              type="button"
              onClick={onClose}
              className={`w-full ${!user ? 'sm:w-auto' : 'sm:flex-1'} py-3 px-5 rounded-2xl text-xs font-medium font-sans border transition-colors cursor-pointer text-center ${
                theme === 'dark'
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Tiếp tục Xem Chế Độ Độc Giả
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

