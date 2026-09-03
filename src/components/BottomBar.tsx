import React from 'react';
import {
  FileText,
  Table,
  Presentation,
  HardDrive,
  BookOpen,
  Terminal,
  GraduationCap,
  Bookmark,
  Calendar,
  Mail,
  Video,
  Cloud,
  ExternalLink
} from 'lucide-react';

interface BottomBarProps {
  theme: 'dark' | 'light';
}

interface WorkspaceApp {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverBg: string;
  category: 'Document' | 'Compute' | 'Communication' | 'Cloud';
}

const GOOGLE_WORKSPACE_APPS: WorkspaceApp[] = [
  {
    name: 'NotebookLM',
    url: 'https://notebooklm.google.com/',
    icon: BookOpen,
    color: 'text-purple-400',
    hoverBg: 'hover:bg-purple-950/50 hover:border-purple-500/50',
    category: 'Document'
  },
  {
    name: 'Docs',
    url: 'https://docs.google.com/',
    icon: FileText,
    color: 'text-blue-400',
    hoverBg: 'hover:bg-blue-950/50 hover:border-blue-500/50',
    category: 'Document'
  },
  {
    name: 'Sheets',
    url: 'https://sheets.google.com/',
    icon: Table,
    color: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-950/50 hover:border-emerald-500/50',
    category: 'Document'
  },
  {
    name: 'Slides',
    url: 'https://slides.google.com/',
    icon: Presentation,
    color: 'text-amber-400',
    hoverBg: 'hover:bg-amber-950/50 hover:border-amber-500/50',
    category: 'Document'
  },
  {
    name: 'Drive',
    url: 'https://drive.google.com/',
    icon: HardDrive,
    color: 'text-yellow-400',
    hoverBg: 'hover:bg-yellow-950/50 hover:border-yellow-500/50',
    category: 'Document'
  },
  {
    name: 'Colab',
    url: 'https://colab.research.google.com/',
    icon: Terminal,
    color: 'text-orange-400',
    hoverBg: 'hover:bg-orange-950/50 hover:border-orange-500/50',
    category: 'Compute'
  },
  {
    name: 'Scholar',
    url: 'https://scholar.google.com/',
    icon: GraduationCap,
    color: 'text-cyan-400',
    hoverBg: 'hover:bg-cyan-950/50 hover:border-cyan-500/50',
    category: 'Compute'
  },
  {
    name: 'Keep',
    url: 'https://keep.google.com/',
    icon: Bookmark,
    color: 'text-amber-300',
    hoverBg: 'hover:bg-amber-950/50 hover:border-amber-500/50',
    category: 'Document'
  },
  {
    name: 'Calendar',
    url: 'https://calendar.google.com/',
    icon: Calendar,
    color: 'text-blue-300',
    hoverBg: 'hover:bg-blue-950/50 hover:border-blue-500/50',
    category: 'Communication'
  },
  {
    name: 'Gmail',
    url: 'https://mail.google.com/',
    icon: Mail,
    color: 'text-red-400',
    hoverBg: 'hover:bg-red-950/50 hover:border-red-500/50',
    category: 'Communication'
  },
  {
    name: 'Meet',
    url: 'https://meet.google.com/',
    icon: Video,
    color: 'text-teal-400',
    hoverBg: 'hover:bg-teal-950/50 hover:border-teal-500/50',
    category: 'Communication'
  },
  {
    name: 'Cloud Console',
    url: 'https://console.cloud.google.com/',
    icon: Cloud,
    color: 'text-indigo-400',
    hoverBg: 'hover:bg-indigo-950/50 hover:border-indigo-500/50',
    category: 'Cloud'
  }
];

export const BottomBar: React.FC<BottomBarProps> = ({ theme }) => {
  const handleLaunchApp = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer
      id="bottombar-workspace-dock"
      className={`h-11 px-3 sm:px-6 border-t flex items-center justify-between z-30 transition-all select-none overflow-x-auto scrollbar-none ${
        theme === 'dark'
          ? 'bg-[#080712] border-slate-900 text-slate-300'
          : 'bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
      }`}
    >
      {/* Left Label: Ecosystem Indicator */}
      <div className={`flex items-center gap-2 shrink-0 pr-3 border-r ${
        theme === 'dark' ? 'border-slate-800/80' : 'border-slate-300'
      }`}>
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span className={`text-[10.5px] font-tech uppercase tracking-wider font-bold hidden sm:inline ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          HỆ SINH THÁI GOOGLE WORKSPACE:
        </span>
        <span className="text-[10px] font-tech font-bold text-purple-600 sm:hidden">
          WORKSPACE:
        </span>
      </div>

      {/* Center Superlink App Icons Dock */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center overflow-x-auto scrollbar-none px-2">
        {GOOGLE_WORKSPACE_APPS.map(app => {
          const Icon = app.icon;
          return (
            <button
              key={app.name}
              onClick={() => handleLaunchApp(app.url)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border border-transparent transition-all duration-150 active:scale-95 cursor-pointer ${
                theme === 'dark'
                  ? `text-slate-300 hover:text-white ${app.hoverBg}`
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white hover:border-slate-200 hover:shadow-xs'
              }`}
              title={`Mở ${app.name} trong tab mới`}
            >
              <Icon className={`w-3.5 h-3.5 ${app.color} shrink-0`} />
              <span className="text-[11px] font-sans font-medium whitespace-nowrap hidden md:inline">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Instant External Link Helper */}
      <div className={`flex items-center gap-1.5 shrink-0 pl-3 border-l text-[10px] font-mono ${
        theme === 'dark' ? 'border-slate-800/80 text-slate-400' : 'border-slate-300 text-slate-600'
      }`}>
        <span className="hidden lg:inline">LIÊN KẾT NHANH</span>
        <ExternalLink className="w-3 h-3 text-purple-500" />
      </div>
    </footer>
  );
};
