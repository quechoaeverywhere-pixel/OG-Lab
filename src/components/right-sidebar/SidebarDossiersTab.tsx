import React, { useState } from 'react';
import {
  FolderOpen,
  BookOpen,
  Download,
  Trash2,
  Tag,
  Clock
} from 'lucide-react';
import { Dossier } from '../../types';
import { AutoScrollText } from '../AutoScrollText';

interface SidebarDossiersTabProps {
  filteredDossiers: Dossier[];
  currentDossier: Dossier | null;
  onSelectDossier?: (id: string) => void;
  onDeleteDossier?: (id: string) => void;
  onOpenNewDossier?: () => void;
  onDownloadDossierMarkdown: (dossier: Dossier) => void;
  theme: 'dark' | 'light';
}

export const SidebarDossiersTab: React.FC<SidebarDossiersTabProps> = ({
  filteredDossiers,
  currentDossier,
  onSelectDossier,
  onDeleteDossier,
  onOpenNewDossier,
  onDownloadDossierMarkdown,
  theme
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {filteredDossiers.map(dossier => {
        const isCurrent = currentDossier?.id === dossier.id;
        const chapterCount =
          dossier.projectStructure?.reduce((acc, p) => acc + (p.chapters?.length || 0), 0) ||
          6;

        return (
          <div
            key={dossier.id}
            onClick={() => onSelectDossier?.(dossier.id)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer group w-full max-w-full min-w-0 overflow-hidden ${
              isCurrent
                ? theme === 'dark'
                  ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-emerald-50/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                : theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1 min-w-0">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white'
                    : theme === 'dark'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                HỒ SƠ #{String(dossier.chapterNumber || '01').padStart(2, '0')}
              </span>

              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                  theme === 'dark' ? 'bg-slate-950 text-emerald-400' : 'bg-white text-emerald-700 border border-emerald-200'
                }`}
              >
                {chapterCount} chương
              </span>
            </div>

            <h4
              className={`text-xs font-bold leading-snug mb-1 transition-colors w-full max-w-full min-w-0 overflow-hidden ${
                isCurrent
                  ? theme === 'dark' ? 'text-emerald-300' : 'text-emerald-900'
                  : theme === 'dark' ? 'text-slate-100 group-hover:text-emerald-300' : 'text-slate-800 group-hover:text-emerald-800'
              }`}
            >
              <AutoScrollText>{dossier.title}</AutoScrollText>
            </h4>

            {dossier.subtitle && (
              <p
                className={`text-[11px] line-clamp-1 mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {dossier.subtitle}
              </p>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40 text-[10px]">
              <span
                className={`flex items-center gap-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <Tag className="w-3 h-3 text-emerald-500" />
                <span className="truncate max-w-[120px]">
                  {dossier.discipline || 'Liên ngành'}
                </span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDownloadDossierMarkdown(dossier);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
                      : 'hover:bg-slate-200 text-slate-500 hover:text-emerald-700'
                  }`}
                  title="Tải Markdown"
                >
                  <Download className="w-3 h-3" />
                </button>

                {onDeleteDossier && (
                  deletingId === dossier.id ? (
                    <div className="flex items-center gap-1 bg-red-500/10 rounded px-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDossier(dossier.id);
                          setDeletingId(null);
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 px-1"
                        title="Xóa"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-300 px-1"
                        title="Hủy"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setDeletingId(dossier.id);
                      }}
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Xóa hồ sơ"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}

      {filteredDossiers.length === 0 && (
        <div
          className={`p-8 text-center rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900/30 border-slate-800/60 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Không tìm thấy hồ sơ phù hợp</p>
        </div>
      )}
    </div>
  );
};
