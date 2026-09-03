import React from 'react';
import { Shield, Eye, Lock, KeyRound, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';

interface ReadOnlyNoticeBannerProps {
  theme?: 'dark' | 'light';
}

export const ReadOnlyNoticeBanner: React.FC<ReadOnlyNoticeBannerProps> = ({ theme = 'dark' }) => {
  const { user, role, isGuest, isViewer, isAuthor, isAdmin } = useAuth();
  const { openGuestLockModal, openAccessDeniedModal } = usePermission();

  // If user is Author or Admin, don't show the viewer banner (or show a subtle Author badge)
  if (isAuthor || isAdmin) {
    return null;
  }

  return (
    <aside
      aria-label="Thông báo chế độ chỉ đọc"
      id="read-only-session-banner"
      className={`w-full border-b transition-all duration-200 z-40 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
        theme === 'dark'
          ? 'bg-slate-900/90 border-amber-500/30 text-slate-200 backdrop-blur-md shadow-sm'
          : 'bg-amber-50/95 border-amber-200 text-amber-950 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${
            theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {isGuest ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </div>

        <div className="text-xs font-sans truncate">
          <span className="font-bold font-tech uppercase tracking-wide mr-2 text-amber-500 dark:text-amber-400">
            {isGuest ? '[PHIÊN KHÁCH - CHỈ XEM]' : '[ĐỘC GIẢ - READ-ONLY]'}
          </span>
          <span className="opacity-90">
            {isGuest
              ? 'Bạn đang duyệt bài ở chế độ Độc Giả công khai. Các thao tác tạo bản ghi lên hệ thống được khoá.'
              : `Chào ${user?.displayName || user?.email}! Tài khoản mặc định ở chế độ Độc Giả (Chỉ Xem) để bảo toàn dữ liệu.`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isViewer ? (
          <button
            id="btn-banner-elevate-author"
            onClick={() => openAccessDeniedModal('compose_article', {
              title: 'Mở Khóa Quyền Tác Giả (Author Key)',
              message: 'Nhập mã ủy quyền do Hội đồng quản trị cấp để mở quyền biên tập và ghi dữ liệu lên hệ thống.'
            })}
            className={`px-3 py-1 rounded-lg text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              theme === 'dark'
                ? 'bg-purple-600/80 hover:bg-purple-600 text-white border border-purple-400/30'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Mã Tác Giả</span>
          </button>
        ) : (
          <button
            id="btn-banner-login-auth"
            onClick={openGuestLockModal}
            className={`px-3 py-1 rounded-lg text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              theme === 'dark'
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>
        )}

        <button
          id="btn-banner-info-modal"
          onClick={() => openAccessDeniedModal('create_dossier', {
            title: 'Chính Sách Quyền Độc Giả',
            message: 'Tất cả tài khoản mới hoặc phiên từ trình duyệt khác đều mặc định chỉ có quyền Đọc để bảo vệ toàn vẹn các công trình học thuật Oneness Governance.'
          })}
          className={`p-1 px-2 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
              : 'border-slate-300 hover:bg-slate-100 text-slate-600'
          }`}
          title="Xem chi tiết phân quyền"
        >
          Tìm hiểu thêm
        </button>
      </div>
    </aside>
  );
};
