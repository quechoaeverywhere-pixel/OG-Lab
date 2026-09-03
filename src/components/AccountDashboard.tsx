import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import {
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Activity,
  Brain,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Edit3,
  Save,
  X,
  Sliders,
  Copy,
  Building,
  BookOpen,
  RefreshCw,
  Clock
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  ATOMIC_PERMISSIONS_CONFIG,
  AtomicPermission,
  ROLE_PERMISSIONS,
  AUTHOR_ACTIVATION_PASSCODES
} from '../types/permissions';

interface AccountDashboardProps {
  theme: 'dark' | 'light';
}

interface LogEntry {
  id: string;
  action: string;
  tokenCount: number;
  timestamp: any;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({ theme }) => {
  const {
    user,
    userProfile,
    role,
    signInWithGoogle,
    logout,
    activateAuthorRole,
    updateUserProfile,
    setUserRoleManually,
    isAdmin,
    isAuthor,
    isViewer
  } = useAuth();

  const {
    isOwner,
    isContentEditLocked,
    setContentEditLocked,
    requireSessionLock,
    setRequireSessionLock,
    lockSession
  } = usePermission();

  const [totalTokens, setTotalTokens] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [passcode, setPasscode] = useState('');
  const [passcodeStatus, setPasscodeStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [affiliationInput, setAffiliationInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ success: boolean; message: string } | null>(null);

  // Security Toggles State
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [lockNotice, setLockNotice] = useState('');
  const [copiedPasscode, setCopiedPasscode] = useState<string | null>(null);

  // Initialize form when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setDisplayNameInput(userProfile.displayName || user?.displayName || '');
      setAffiliationInput(userProfile.affiliation || 'Học Giả Tự Do');
      setBioInput(userProfile.bio || 'Độc giả nghiên cứu Oneness Governance');
    }
  }, [userProfile, user]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'systemLogs'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        let total = 0;
        const fetchedLogs: LogEntry[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          total += data.tokenCount || 0;
          fetchedLogs.push({ id: doc.id, ...data } as LogEntry);
        });
        
        fetchedLogs.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return b.timestamp.seconds - a.timestamp.seconds;
        });

        setTotalTokens(total);
        setLogs(fetchedLogs.slice(0, 10));
      } catch (error) {
        console.warn('Could not fetch system logs:', error);
      }
    };

    fetchLogs();
  }, [user]);

  const handleActivateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsActivating(true);
    setPasscodeStatus(null);
    try {
      const res = await activateAuthorRole(passcode.trim());
      setPasscodeStatus(res);
      if (res.success) {
        setPasscode('');
      }
    } catch {
      setPasscodeStatus({ success: false, message: 'Đã xảy ra lỗi khi kiểm tra mã ủy quyền.' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;

    setIsSavingProfile(true);
    setProfileNotice(null);
    try {
      const res = await updateUserProfile({
        displayName: displayNameInput.trim(),
        affiliation: affiliationInput.trim(),
        bio: bioInput.trim()
      });
      setProfileNotice(res);
      if (res.success) {
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      setProfileNotice({ success: false, message: 'Lỗi lưu thông tin hồ sơ: ' + (err?.message || '') });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPasscode(text);
    setTimeout(() => setCopiedPasscode(null), 2500);
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-4 p-8 text-center border rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 space-y-6">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <Eye className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
            Phiên Khách Vãng Lai (Chế Độ Độc Giả)
          </span>
          <h2 className="text-2xl font-bold font-serif mt-3 dark:text-white">Kiến Trúc Zero-Trust & Phân Quyền</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Mọi phiên truy cập mới mặc định được bảo vệ ở chế độ <strong>Độc Giả (Read-Only)</strong>. Bạn có thể tự do đọc, tra cứu Sổ Từ Điển và nghiên cứu ma trận 6 Trụ Cột Động. Đăng nhập để định danh và yêu cầu cấp quyền Tác Giả (Author) khi cần khởi tạo hoặc ghi bản thảo lên hệ thống.
        </p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold font-tech text-xs tracking-wider uppercase flex items-center gap-2.5 mx-auto transition-all cursor-pointer shadow-lg shadow-purple-600/25 active:scale-98"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
          ĐĂNG NHẬP GOOGLE ĐỊNH DANH
        </button>
      </div>
    );
  }

  const roleBadge = () => {
    if (isAdmin) {
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/30 text-[10.5px] font-bold font-tech uppercase flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Tổng Quản Trị (Admin)
        </span>
      );
    }
    if (isAuthor) {
      return (
        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10.5px] font-bold font-tech uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Tác Giả (Author)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10.5px] font-bold font-tech uppercase flex items-center gap-1">
        <Eye className="w-3 h-3" />
        Độc Giả (Viewer - Chỉ Xem)
      </span>
    );
  };

  const allowedPermissions = ROLE_PERMISSIONS[role] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-4">
      {/* 1. Account Profile Card & Editor */}
      <div className={`p-6 rounded-3xl border transition-all ${
        theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-14 h-14 rounded-2xl border-2 border-purple-500/30 object-cover shrink-0 mt-0.5" />
            ) : (
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold dark:text-white font-sans">
                  {userProfile?.displayName || user.displayName || 'Học Giả Độc Giả'}
                </h3>
                {roleBadge()}
              </div>

              {/* Affiliation and Bio */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-sans">
                <span className="flex items-center gap-1 text-purple-400">
                  <Building className="w-3.5 h-3.5" />
                  <span>{userProfile?.affiliation || 'Học Giả Tự Do'}</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 italic">
                  "{userProfile?.bio || 'Độc giả nghiên cứu Oneness Governance'}"
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-mono">
                Mã bảo mật UID: <span className="text-purple-400 font-mono">{user.uid.slice(0, 16)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setProfileNotice(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-tech flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isEditingProfile
                  ? 'bg-purple-600 text-white border-purple-500'
                  : theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              {isEditingProfile ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-purple-400" />}
              <span>{isEditingProfile ? 'ĐÓNG FORM' : 'SỬA HỒ SƠ'}</span>
            </button>

            <button
              onClick={logout}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-tech flex items-center gap-1.5 transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 border border-slate-700/80'
                  : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ĐĂNG XUẤT</span>
            </button>
          </div>
        </div>

        {/* Inline Profile Editor Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className={`mt-5 pt-5 border-t space-y-4 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold font-tech uppercase text-purple-400">
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Thông Tin Học Giả Nghiên Cứu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Tên Hiển Thị (Display Name)</label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={e => setDisplayNameInput(e.target.value)}
                  placeholder="Ví dụ: GS. Trần Văn An..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-purple-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Đơn Vị Công Tác / Viện Nghiên Cứu</label>
                <input
                  type="text"
                  value={affiliationInput}
                  onChange={e => setAffiliationInput(e.target.value)}
                  placeholder="Ví dụ: Viện Nghiên cứu Đa ngành..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-purple-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Tiểu Sử / Định Hướng Nghiên Cứu</label>
              <textarea
                value={bioInput}
                onChange={e => setBioInput(e.target.value)}
                placeholder="Tóm tắt hướng tiếp cận triết học và chuyên môn..."
                rows={2}
                className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                }`}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-slate-500">
                Thông tin này sẽ được lưu đồng bộ lên Firestore và hiển thị trong danh mục tác giả.
              </p>
              <button
                type="submit"
                disabled={isSavingProfile || !displayNameInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-tech uppercase text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSavingProfile ? 'Đang Lưu...' : 'LƯU HỒ SƠ'}</span>
              </button>
            </div>

            {profileNotice && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-sans ${
                profileNotice.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {profileNotice.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{profileNotice.message}</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* 2. Security & Session Controls */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 text-indigo-400 font-bold font-tech text-sm uppercase">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Bảo Mật Hệ Thống & Kiểm Soát Phiên Làm Việc (Shinbashira Guard)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Session Guard Toggle */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold dark:text-white">Tự Động Khóa Phiên Trình Duyệt</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tự động kích hoạt màn hình khóa bảo mật Shinbashira khi mở tab mới.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={requireSessionLock}
                onChange={e => setRequireSessionLock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Global Content Edit Lock */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className={`w-4 h-4 ${isContentEditLocked ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className="text-xs font-bold dark:text-white">Khóa Biên Tập Toàn Cục</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isOwner
                  ? 'Bật/Tắt tính năng chỉnh sửa nội dung bài viết toàn hệ thống.'
                  : 'Chỉ tài khoản Owner mới có quyền thay đổi trạng thái này.'}
              </p>
            </div>
            <label className={`relative inline-flex items-center shrink-0 ${isOwner ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <input
                type="checkbox"
                checked={isContentEditLocked}
                disabled={!isOwner || isTogglingLock}
                onChange={async e => {
                  if (!isOwner) return;
                  setIsTogglingLock(true);
                  const res = await setContentEditLocked(e.target.checked);
                  setLockNotice(res.message || '');
                  setTimeout(() => setLockNotice(''), 3500);
                  setIsTogglingLock(false);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Lock Session Manually Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={lockSession}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-tech flex items-center gap-2 transition-colors cursor-pointer border ${
              theme === 'dark'
                ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-500/30 text-indigo-300'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>KHÓA PHIÊN NGAY (LOCK SESSION SCREEN)</span>
          </button>

          {lockNotice && (
            <span className="text-xs font-mono font-bold text-purple-400 animate-in fade-in">
              {lockNotice}
            </span>
          )}
        </div>
      </div>

      {/* 3. Author Passcode Elevation Box for Viewers */}
      {isViewer && (
        <div className={`p-6 rounded-3xl border space-y-4 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border-purple-500/30 text-slate-200'
            : 'bg-purple-50/60 border-purple-200 text-purple-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold font-tech text-sm uppercase tracking-wide">
                Nâng Cấp Quyền Tác Giả (Author Elevation)
              </h4>
              <p className="text-xs opacity-80">
                Tài khoản mới đăng nhập mặc định có quyền Độc Giả (Chỉ Xem). Nhập mã ủy quyền tác giả để mở khóa quyền tạo bài viết và khởi chạy AI.
              </p>
            </div>
          </div>

          <form onSubmit={handleActivateAuthor} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Nhập mã tác giả (ví dụ: OG-AUTHOR-2026)"
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-purple-500/40 text-slate-100 focus:border-purple-400 placeholder-slate-500'
                    : 'bg-white border-purple-300 text-slate-900 focus:border-purple-600 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={isActivating || !passcode.trim()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-tech uppercase tracking-wider text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-md"
              >
                {isActivating ? 'Đang kiểm tra...' : 'Mở Khóa Tác Giả'}
              </button>
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
        </div>
      )}

      {/* 4. Admin Development & Master Controls (Visible to Admin only) */}
      {isAdmin && (
        <div className={`p-6 rounded-3xl border space-y-4 ${
          theme === 'dark' ? 'bg-slate-900/70 border-rose-900/40' : 'bg-rose-50/40 border-rose-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-rose-500">
              <Sliders className="w-5 h-5" />
              <h4 className="font-bold font-tech text-sm uppercase">Bảng Điều Khiển Tổng Quản Trị (Admin Dev Hub)</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10.5px] font-bold font-mono">
              Root Authority
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Công cụ quản trị dành riêng cho Tổng Quản Trị để kiểm thử ma trận phân quyền và chia sẻ mã tác giả cho nhóm nghiên cứu.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Role Switcher for Testing */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold font-tech uppercase text-purple-400 block">
                Kiểm Thử Vai Trò (Switch Role Mode)
              </span>
              <div className="flex flex-wrap gap-2">
                {(['admin', 'author', 'viewer'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleManually(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                      role === r
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : theme === 'dark'
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    }`}
                  >
                    {r} {role === r && '✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Author Passcodes for Distribution */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold font-tech uppercase text-purple-400 block">
                Danh Sách Mã Ủy Quyền Tác Giả (Passcodes)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AUTHOR_ACTIVATION_PASSCODES.map(code => (
                  <button
                    key={code}
                    onClick={() => copyToClipboard(code)}
                    className="px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] font-mono flex items-center gap-1.5 hover:bg-purple-900/50 cursor-pointer transition-colors"
                    title="Bấm để sao chép mã"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{code}</span>
                    {copiedPasscode === code && <span className="text-emerald-400 text-[9px]">Đã chép!</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Metrics & System Activity Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Token Economy Panel */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 text-fuchsia-500 dark:text-fuchsia-400 mb-2">
            <Brain className="w-5 h-5" />
            <h4 className="font-bold font-tech text-sm uppercase">Kinh Tế Hệ Thống (Token)</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng số Token AI đã tiêu thụ để tự động biên soạn và khảo luận hồ sơ (~4 ký tự = 1 token).
          </p>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-3xl font-light font-mono text-slate-800 dark:text-slate-200">
              {totalTokens.toLocaleString()} <span className="text-sm font-sans text-slate-400">Tokens</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 uppercase font-bold tracking-wider">
              Trạng thái kết nối Gemini: Hoạt động bình thường
            </p>
          </div>
        </div>

        {/* System Logs Panel */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
              <h4 className="font-bold font-tech text-sm uppercase">Nhật Ký Thao Tác (System Logs)</h4>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ghi nhận các hoạt động thay đổi cấu trúc, sinh nội dung và cập nhật bài viết.
          </p>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
            <ul className="space-y-3">
              {logs.length > 0 ? logs.map(log => (
                <li key={log.id} className="text-xs text-slate-600 dark:text-slate-300 font-mono flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                    </span>
                  </div>
                  <span className="text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-bold">
                    +{log.tokenCount || 0} tokens
                  </span>
                </li>
              )) : (
                <li className="text-xs text-slate-400 italic">Chưa có nhật ký hoạt động gần đây.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Atomic Permissions Matrix */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="font-bold font-tech text-sm uppercase">Ma Trận Phân Quyền Nguyên Tử (Zero-Trust)</h4>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold border ${
            isAuthor || isAdmin
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            Trạng Thái:{' '}
            {isAdmin ? 'Quản Trị Tối Cao (Admin)' : isAuthor ? 'Toàn Quyền Tác Giả (Author)' : 'Chế Độ Độc Giả (Read-Only)'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Các quyền hạn được phân lập theo từng tính năng nguyên tử để bảo vệ tính toàn vẹn của dữ liệu công trình học thuật:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {(Object.keys(ATOMIC_PERMISSIONS_CONFIG) as AtomicPermission[]).map((permKey) => {
            const meta = ATOMIC_PERMISSIONS_CONFIG[permKey];
            const isGranted = allowedPermissions.includes(permKey);
            return (
              <div
                key={permKey}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold font-sans dark:text-white flex items-center gap-1.5">
                    {isGranted ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span>{meta.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Quyền: {permKey}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ml-2 ${
                    isGranted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isGranted ? 'ĐÃ CẤP' : 'KHÓA (READ-ONLY)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
