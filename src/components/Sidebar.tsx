import React from 'react';
import {
  Sparkles,
  Sliders,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  Wrench,
  Globe,
  Home,
  Quote,
  ShieldCheck,
  Cpu,
  Atom,
  Binary,
  Compass,
  FileCheck2,
  Activity,
  Zap,
  Radio,
  Workflow,
  FileText
} from 'lucide-react';
import { Dossier } from '../types';
import { usePermission } from '../contexts/PermissionContext';

interface SidebarProps {
  dossiers: Dossier[];
  activeDossierId: string | null;
  onSelectDossier: (dossierId: string | null) => void;
  onOpenQuickResearch: () => void;
  onOpenNewDossierModal?: () => void;
  onOpenStudioTab: (tabIndex: number) => void;
  onOpenSettings: () => void;
  onOpenDashboard?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  dossiers,
  activeDossierId,
  onSelectDossier,
  onOpenQuickResearch,
  onOpenNewDossierModal,
  onOpenStudioTab,
  onOpenSettings,
  onOpenDashboard,
  theme,
  onToggleTheme,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { requirePermission } = usePermission();

  const handleTriggerQuickResearch = () => {
    requirePermission('ai_research', () => {
      onOpenQuickResearch();
    }, {
      title: 'Khái Quát Ý Tưởng Nghiên Cứu AI',
      message: 'Vui lòng đăng nhập để bắt đầu phiên giải mã ý niệm và khái quát ý tưởng tự động bằng AI.'
    });
  };

  // Collapsed Sidebar View
  if (isCollapsed) {
    return (
      <aside
        id="sidebar-navigation-collapsed"
        className={`w-14 h-full flex flex-col items-center py-3 justify-between border-r select-none transition-all duration-200 z-20 flex-shrink-0 ${
          theme === 'dark' ? 'bg-[#0b0a16] text-slate-400 border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}
      >
        {/* Top Tools */}
        <div className="flex flex-col items-center gap-2.5 w-full px-1.5">
          <button
            id="btn-expand-left-sidebar"
            onClick={onToggleCollapse}
            className="p-2 rounded-xl hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            title="Mở rộng Trung Tâm Công Cụ"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-8 h-px bg-slate-800 my-0.5" />

          {/* Knowledge Square Button */}
          <button
            onClick={() => onSelectDossier(null)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              activeDossierId === null
                ? 'bg-purple-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Knowledge Square (Quảng Trường Tri Thức)"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* AI Research Button */}
          <button
            onClick={handleTriggerQuickResearch}
            className="p-2.5 rounded-xl bg-purple-600/25 hover:bg-purple-600 text-purple-300 hover:text-white transition-all cursor-pointer shadow-md group relative"
            title="Khái Quát Ý Tưởng Nghiên Cứu (AI Idea Assistant)"
          >
            <Sparkles className="w-4 h-4 fill-purple-300/40 text-purple-300" />
          </button>

          {/* Studio Button */}
          <button
            onClick={() => onOpenStudioTab(0)}
            className="p-2.5 rounded-xl bg-fuchsia-600/25 hover:bg-fuchsia-600 text-fuchsia-300 hover:text-white transition-all cursor-pointer shadow-md group relative"
            title="Publisher Studio (Quản trị Hồ sơ & Tri thức Đa ngành)"
          >
            <Sliders className="w-4 h-4 text-fuchsia-400" />
          </button>

          {/* Project Analysis Button */}
          <button
            onClick={() => onOpenStudioTab(2)}
            className="p-2.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all cursor-pointer shadow-md group relative"
            title="Phân Tích Dự Án & Kịch Bản Thực Chiến"
          >
            <Workflow className="w-4 h-4 text-indigo-400" />
          </button>

          {/* AI System Diagnostics Dashboard Button */}
          <button
            onClick={() => onOpenDashboard ? onOpenDashboard() : onOpenStudioTab(4)}
            className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 hover:from-purple-600 hover:to-indigo-600 text-purple-300 hover:text-white border border-purple-500/40 transition-all cursor-pointer shadow-md"
            title="Bảng Chẩn Đoán Sức Khỏe AI & Token Telemetry"
          >
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </button>
        </div>

        {/* Bottom Settings & Theme */}
        <div className="flex flex-col items-center gap-2 w-full px-1.5">
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Cài đặt & Cấu hình AI"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleTheme}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              theme === 'dark' ? 'hover:bg-slate-800 text-purple-400' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View (Trung Tâm Công Cụ & Suy Luận Khảo Luận)
  return (
    <aside
      id="sidebar-navigation"
      className={`w-72 md:w-80 flex flex-col h-full flex-shrink-0 select-none transition-all duration-200 border-r ${
        theme === 'dark'
          ? 'bg-[#0b0a16] text-slate-300 border-slate-900'
          : 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      {/* 1. Header: Panel Title & Collapse */}
      <div className="p-3.5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
          <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300">
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wider uppercase">TRUNG TÂM CÔNG CỤ</span>
        </div>

        {onToggleCollapse && (
          <button
            id="btn-collapse-left-sidebar"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Thu nhỏ Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Main Navigation: Knowledge Square & Quick Research */}
      <div className="p-3 space-y-2 border-b border-slate-800/60">
        {/* Nút Knowledge Square (Twin Flagship Card) */}
        <button
          onClick={() => onSelectDossier(null)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-150 active:scale-[0.98] cursor-pointer font-tech uppercase tracking-wider text-xs font-bold border group ${
            activeDossierId === null
              ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white border-purple-400/80 shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/50'
              : theme === 'dark'
              ? 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-purple-500/40'
              : 'bg-white hover:bg-purple-50/70 text-slate-800 border-slate-300 shadow-sm hover:border-purple-300'
          }`}
          title="Mở Knowledge Square - Quảng Trường Tri Thức & Khảo Luận Toàn Cầu"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl transition-colors ${
              activeDossierId === null
                ? 'bg-white/20 text-white'
                : 'bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25 group-hover:text-purple-300'
            }`}>
              <Home className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs">KNOWLEDGE SQUARE</div>
              <div className={`text-[9.5px] lowercase font-normal ${
                activeDossierId === null ? 'text-purple-200' : 'text-slate-400 group-hover:text-slate-300'
              }`}>
                quảng trường tri thức • hub
              </div>
            </div>
          </div>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-bold tracking-widest ${
            activeDossierId === null
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-purple-950/50 text-purple-300 border border-purple-800/40'
          }`}>
            PORTAL
          </span>
        </button>

        {/* Nút Khái Quát Ý Tưởng Nghiên Cứu (Twin Flagship Card) */}
        <button
          id="btn-sidebar-quick-research"
          onClick={handleTriggerQuickResearch}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 transition-all duration-150 active:scale-[0.98] cursor-pointer font-tech uppercase tracking-wider text-xs font-bold border border-purple-400/40 group"
          title="Giải mã ý niệm nguyên thủy & định hình kịch bản nghiên cứu với Gemini AI"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/20 text-white">
              <Sparkles className="w-4 h-4 fill-white text-white animate-pulse" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs">KHÁI QUÁT Ý TƯỞNG</div>
              <div className="text-[9.5px] text-purple-200 lowercase font-normal">giải mã ý niệm • kịch bản ai</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Nút Publisher Studio (Flagship Card - Cùng style & kích cỡ với Khái Quát Ý Tưởng) */}
        <button
          id="btn-sidebar-open-studio"
          onClick={() => onOpenStudioTab(0)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-500/50 transition-all duration-150 active:scale-[0.98] cursor-pointer font-tech uppercase tracking-wider text-xs font-bold border border-fuchsia-400/40 group"
          title="Mở Publisher Studio - Quản trị Hồ sơ & Tri thức Đa ngành"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/20 text-white">
              <Sliders className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs">PUBLISHER STUDIO</div>
              <div className="text-[9.5px] text-fuchsia-200 lowercase font-normal">quản trị hồ sơ • tri thức đa ngành</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-fuchsia-200 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Nút Phân Tích Dự Án (Flagship Card - Thẩm định & 6 Kịch bản thực chiến) */}
        <button
          id="btn-sidebar-project-analysis"
          onClick={() => onOpenStudioTab(2)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-150 active:scale-[0.98] cursor-pointer font-tech uppercase tracking-wider text-xs font-bold border border-indigo-400/40 group"
          title="Phân tích đề án, thẩm định hồ sơ và sản xuất 6 kịch bản hành động thực chiến"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/20 text-white">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs">PHÂN TÍCH DỰ ÁN</div>
              <div className="text-[9.5px] text-indigo-200 lowercase font-normal">thẩm định hồ sơ • 6 kịch bản thực chiến</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-200 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3. Upgraded AI & System Control Dashboard (Toàn bộ Bảng Chẩn Đoán AI & Thông Tin Hệ Thống Trực Quan) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* SECTION A: DASHBOARD GIÁM SÁT SỨC KHỎE AI & CANDIDATE MODELS */}
        <div className="space-y-2">
          <div className="px-1 text-[10.5px] font-tech uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>TELEMETRY & SỨC KHỎE AI</span>
            </span>
            <span className="text-[9.5px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE</span>
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border text-xs space-y-2.5 ${
              theme === 'dark'
                ? 'bg-gradient-to-tr from-purple-950/30 via-slate-900/80 to-indigo-950/40 border-purple-500/30 text-slate-200'
                : 'bg-gradient-to-tr from-purple-50/80 via-white to-indigo-50/80 border-purple-200 text-slate-800 shadow-xs'
            }`}
          >
            {/* Primary Model Lead */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-purple-300">Gemini 3.7 Flash</div>
                  <div className="text-[9.5px] font-mono text-slate-400">Primary Core Model</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🟢 OPTIMAL
              </span>
            </div>

            {/* Candidate Models Health Swarm */}
            <div className="space-y-1 pt-1 border-t border-slate-800/40">
              <div className="text-[9.5px] font-tech uppercase tracking-wider text-slate-400 font-semibold mb-1">Ma Trận Mô Hình Dự Phòng (Failover Stack)</div>
              
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-purple-300 font-bold truncate">3.7 Flash</span>
                  <span className="text-emerald-400 font-bold text-[9px]">P1 Lead</span>
                </div>

                <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-indigo-300 font-bold truncate">3.1 Lite</span>
                  <span className="text-emerald-400 font-bold text-[9px]">P2 Ready</span>
                </div>

                <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-cyan-300 font-bold truncate">Flash Auto</span>
                  <span className="text-emerald-400 font-bold text-[9px]">P3 Ready</span>
                </div>

                <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-slate-300 font-bold truncate">2.5 Flash</span>
                  <span className="text-slate-400 font-bold text-[9px]">Backup</span>
                </div>
              </div>
            </div>

            {/* Operational Indicators */}
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono pt-1 border-t border-slate-800/40">
              <div className={`p-1.5 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="text-[9px] text-slate-400 uppercase">Ứng Biến 503</div>
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Self-Healing</span>
                </div>
              </div>
              <div className={`p-1.5 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="text-[9px] text-slate-400 uppercase">Chế Độ Nguồn</div>
                <div className="font-bold text-emerald-400">High-Avail</div>
              </div>
            </div>

            {/* Full-Screen Launcher Button */}
            <button
              onClick={() => onOpenDashboard ? onOpenDashboard() : onOpenStudioTab(4)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-tech uppercase text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-md shadow-purple-600/20 active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                <span>BẢNG CHẨN ĐOÁN FULL-SCREEN</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SECTION B: THÔNG TIN HỆ THỐNG & CHUYỂN HÓA TRI THỨC */}
        <div className="space-y-2">
          <div className="px-1 text-[10.5px] font-tech uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Compass className="w-3.5 h-3.5" />
              <span>KNOWLEDGE TRANSFORMING</span>
            </span>
            <span className="text-[9.5px] font-mono text-purple-400 font-bold">OG ENGINE</span>
          </div>

          <div
            className={`p-3 rounded-2xl border text-xs space-y-2 ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[10px]">Phân Tầng Học Thuật:</span>
                <span className="font-bold text-purple-300">Tiers 1 ➔ 4 Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[10px]">Cân Bằng Shinbashira:</span>
                <span className="font-bold text-emerald-300">Đạo Đức & Quản Trị</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[10px]">Đại Hòa Vô Vi:</span>
                <span className="font-bold text-cyan-300">Phát Triển Bền Vững</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[10px]">Chuẩn Xuất Bản:</span>
                <span className="font-bold text-amber-300">Markdown + JSON + NotebookLM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom System Footer: Settings & Theme Toggle */}
      <div className={`p-3 border-t space-y-1.5 ${
        theme === 'dark' ? 'border-slate-800/60 bg-slate-950/30' : 'border-slate-200 bg-slate-100/60'
      }`}>
        <div className="grid grid-cols-2 gap-2">
          {/* Cài Đặt Button */}
          <button
            id="btn-sidebar-settings"
            onClick={onOpenSettings}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 cursor-pointer border ${
              theme === 'dark'
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
            }`}
            title="Cấu hình mô hình AI & Khóa API"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Cài Đặt</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            id="btn-sidebar-theme-toggle"
            onClick={onToggleTheme}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-95 cursor-pointer border ${
              theme === 'dark'
                ? 'bg-slate-900/90 hover:bg-slate-800 text-purple-300 hover:text-purple-200 border-slate-800 hover:border-purple-500/30'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
            }`}
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Giao diện Tối</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Giao diện Sáng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

