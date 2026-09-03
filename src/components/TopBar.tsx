import React from 'react';
import {
  Home,
  Volume2,
  VolumeX,
  User,
  Sun,
  Moon,
  HardDrive,
  Monitor,
  BookOpen,
  Smartphone
} from 'lucide-react';
import { Dossier, LexiconTerm, CitationItem, PromptTemplate, GeminiSettings } from '../types';
import { OGLogo } from './OGLogo';
import { useAIProgress } from '../context/AIProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';

interface TopBarProps {
  currentDossier: Dossier | null;
  allDossiers: Dossier[];
  onSelectDossier: (dossierId: string | null) => void;
  onOpenQuickResearchWithTopic: (topic: string) => void;
  onOpenStudio?: (tabIndex?: number) => void;
  onOpenAccountModal?: () => void;
  onOpenDriveSync?: () => void;
  onOpenPresentation?: (dossierId: string) => void;
  onSwitchToMobile?: () => void;
  lexicon?: LexiconTerm[];
  citations?: CitationItem[];
  promptTemplates?: PromptTemplate[];
  geminiSettings?: GeminiSettings;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  modelName?: string;
  isSearchGroundingEnabled?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDossier,
  allDossiers,
  onSelectDossier,
  onOpenStudio,
  onOpenAccountModal,
  onOpenDriveSync,
  onOpenPresentation,
  onSwitchToMobile,
  theme,
  onToggleTheme
}) => {
  const { soundEnabled, setSoundEnabled } = useAIProgress();
  const { user, role, signInWithGoogle, isAdmin, isAuthor, isViewer, isGuest } = useAuth();
  const { openGuestLockModal } = usePermission();

  return (
    <header
      id="topbar-header"
      className={`px-4 md:px-6 py-2 flex items-center justify-between relative sticky top-0 z-30 transition-all duration-200 select-none h-14 ${
        theme === 'dark'
          ? 'bg-[#0b0a14] text-slate-100 border-b border-slate-900 shadow-md shadow-black/40'
          : 'bg-white text-slate-900 border-b border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. LEFT: Brand & Title - Fitted neatly to sidebar dimension */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
        <div
          onClick={() => onSelectDossier(null)}
          className="flex items-center gap-2.5 cursor-pointer group transition-transform duration-200"
          title="Knowledge Square (Quảng Trường Tri Thức)"
        >
          {/* OG Logo */}
          <OGLogo
            size={32}
            theme={theme}
            showOuterRing={true}
            animated={true}
            className="drop-shadow-sm group-hover:scale-105 transition-transform shrink-0"
          />

          {/* 2-line Title & Subtitle with tight typography */}
          <div className="flex flex-col justify-center text-left min-w-0">
            <h1 className={`font-display-title font-extrabold text-xs sm:text-sm md:text-base tracking-wider uppercase bg-clip-text text-transparent leading-tight whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300'
                : 'bg-gradient-to-r from-indigo-900 via-purple-900 to-purple-700'
            }`}>
              Oneness Governance
            </h1>
            <p className={`hidden lg:block text-[8.5px] font-tech tracking-wider uppercase font-semibold leading-none mt-0.5 whitespace-nowrap ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Deep Research & Knowledge Transforming
            </p>
          </div>
        </div>
      </div>

      {/* 2. RIGHT: Navigation & Control Structure (Ordered from Right to Left) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Knowledge Square Navigation Button */}
        <button
          onClick={() => onSelectDossier(null)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-150 cursor-pointer border shrink-0 whitespace-nowrap ${
            currentDossier === null
              ? theme === 'dark'
                ? 'bg-purple-950/60 text-purple-200 border-purple-500/40 shadow-sm'
                : 'bg-purple-50 text-purple-900 border-purple-300 shadow-sm'
              : theme === 'dark'
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title="Về Quảng Trường Tri Thức"
        >
          <Home className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="hidden xl:inline whitespace-nowrap">Quảng Trường Tri Thức</span>
          <span className="hidden md:inline xl:hidden whitespace-nowrap">Quảng Trường</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer border shrink-0 ${
            soundEnabled
              ? theme === 'dark'
                ? 'bg-purple-950/40 text-purple-300 border-purple-500/40'
                : 'bg-purple-50 text-purple-800 border-purple-200'
              : theme === 'dark'
              ? 'bg-slate-900/60 text-slate-500 border-slate-800'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title={soundEnabled ? 'Âm thanh thông báo: BẬT' : 'Âm thanh thông báo: TẮT'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
        </button>

        {/* Google Drive Sync Button */}
        {onOpenDriveSync && (
          <button
            onClick={onOpenDriveSync}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-150 cursor-pointer border shrink-0 whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border-blue-500/30'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
            }`}
            title="Đồng bộ 2 chiều Google Drive (.md)"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden xl:inline whitespace-nowrap">Google Drive</span>
          </button>
        )}

        {/* Presentation Button if dossier active */}
        {currentDossier && onOpenPresentation && (
          <button
            onClick={() => onOpenPresentation(currentDossier.id)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="Mở Chế Độ Trình Chiếu Báo Cáo Độc Bản (Toàn màn hình / Vuốt ngang/dọc / Chia sẻ Link)"
          >
            <Monitor className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">Trình Chiếu</span>
          </button>
        )}

        {/* Nút Chuyển Sang Sổ Ý Tưởng Mobile */}
        {onSwitchToMobile && (
          <button
            onClick={onSwitchToMobile}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-purple-950/40 hover:bg-purple-900/60 border-purple-800/50 text-purple-300'
                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
            }`}
            title="Chuyển sang Giao diện Sổ Ý Tưởng (Cửa sổ chat tối ưu Mobile)"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden lg:inline whitespace-nowrap">Sổ Ý Tưởng</span>
          </button>
        )}

        {/* 2nd from right: NÚT GIAO DIỆN SÁNG / TỐI (THEME TOGGLE) */}
        <button
          id="btn-topbar-theme-toggle"
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
            theme === 'dark'
              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-amber-400 hover:text-amber-300'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600 hover:text-indigo-700'
          }`}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
        </button>

        {/* 1st from right (Góc ngoài cùng bên phải): NÚT TÀI KHOẢN HỌC GIẢ */}
        {user ? (
          <button
            id="btn-topbar-user-profile"
            onClick={() => {
              if (onOpenAccountModal) {
                onOpenAccountModal();
              } else if (onOpenStudio) {
                onOpenStudio(4);
              }
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer border shrink-0 whitespace-nowrap ${
              isAdmin
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-900/40'
                : isAuthor
                ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
            }`}
            title={`Học Giả: ${user.displayName || 'Thành viên'} (${isAdmin ? 'Tổng Quản Trị' : isAuthor ? 'Tác Giả' : 'Độc Giả'}) - Bấm để mở tài khoản`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-4 h-4 rounded-full shrink-0" />
            ) : (
              <User className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="hidden xl:inline max-w-[90px] truncate whitespace-nowrap">{user.displayName || 'Học Giả'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-tech uppercase border whitespace-nowrap shrink-0 ${
              isAdmin
                ? 'border-rose-500/50 text-rose-300 bg-rose-950/40'
                : isAuthor
                ? 'border-purple-500/50 text-purple-300 bg-purple-950/40'
                : 'border-slate-500/50 text-slate-300 bg-slate-900/40'
            }`}>
              {isAdmin ? 'Admin' : isAuthor ? 'Author' : 'Độc Giả'}
            </span>
          </button>
        ) : null}
      </div>
    </header>
  );
};


