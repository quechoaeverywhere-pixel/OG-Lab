import React, { useState } from 'react';
import {
  FolderOpen,
  Download,
  Check,
  Copy,
  Trash2,
  Save,
  Edit3,
  X
} from 'lucide-react';
import { Dossier } from '../../types';
import { formatMasterCompilationMarkdown, formatDossierToNotebookLMMarkdown, downloadMarkdownFile } from '../../utils/markdownExporter';

interface PublisherDossiersTabProps {
  dossiers: Dossier[];
  onSelectDossier: (id: string) => void;
  onSaveDossier: (d: Dossier) => Promise<void>;
  onDeleteDossier: (id: string) => Promise<void>;
  onResetDefaultDossiers: () => Promise<void>;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const PublisherDossiersTab: React.FC<PublisherDossiersTabProps> = ({
  dossiers,
  onSelectDossier,
  onSaveDossier,
  onDeleteDossier,
  onResetDefaultDossiers,
  onClose,
  theme
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDossierId, setEditingDossierId] = useState<string | null>(null);
  const [editingDossierTitle, setEditingDossierTitle] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopyMarkdown = async (dossier: Dossier) => {
    const md = formatDossierToNotebookLMMarkdown(dossier);
    await navigator.clipboard.writeText(md);
    setCopiedId(dossier.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadDossierMd = (dossier: Dossier) => {
    const md = formatDossierToNotebookLMMarkdown(dossier);
    const filename = `OG_Dossier_Ch${dossier.chapterNumber}_${dossier.id}`;
    downloadMarkdownFile(md, filename);
  };

  const handleExportMasterMarkdown = () => {
    const md = formatMasterCompilationMarkdown(dossiers);
    const filename = `OG_Agentic_Intelligence_Master_${new Date().toISOString().split('T')[0]}`;
    downloadMarkdownFile(md, filename);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
        theme === 'dark' ? 'border-slate-800/60' : 'border-slate-200'
      }`}>
        <h3 className={`text-sm font-bold flex items-center gap-2 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <FolderOpen className="w-4 h-4 text-purple-500" />
          <span>DANH SÁCH HỒ SƠ KHẢO LUẬN ({dossiers.length})</span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMasterMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-tech uppercase cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>XUẤT TOÀN BỘ MASTER .MD</span>
          </button>
          <button
            onClick={onResetDefaultDossiers}
            className={`px-3 py-2 rounded-xl text-xs font-mono cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Khôi phục hồ sơ mẫu chuẩn ban đầu"
          >
            Khôi Phục Mẫu
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {dossiers.map(dossier => (
          <div
            key={dossier.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40'
                : 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:shadow-xs'
            }`}
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                  theme === 'dark'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}>
                  HỒ SƠ #{dossier.chapterNumber || '01'}
                </span>

                {editingDossierId === dossier.id ? (
                  <div className="flex items-center gap-1.5 flex-1 max-w-md">
                    <input
                      type="text"
                      value={editingDossierTitle}
                      onChange={e => setEditingDossierTitle(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          if (editingDossierTitle.trim()) {
                            await onSaveDossier({
                              ...dossier,
                              title: editingDossierTitle.trim(),
                              lastModified: new Date().toISOString()
                            });
                          }
                          setEditingDossierId(null);
                        }
                        if (e.key === 'Escape') setEditingDossierId(null);
                      }}
                      autoFocus
                      className={`text-xs px-2 py-1 rounded-lg border outline-none font-bold w-full ${
                        theme === 'dark'
                          ? 'bg-black border-purple-500 text-white'
                          : 'bg-white border-purple-400 text-slate-900'
                      }`}
                    />
                    <button
                      onClick={async () => {
                        if (editingDossierTitle.trim()) {
                          await onSaveDossier({
                            ...dossier,
                            title: editingDossierTitle.trim(),
                            lastModified: new Date().toISOString()
                          });
                        }
                        setEditingDossierId(null);
                      }}
                      className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] cursor-pointer"
                      title="Lưu"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingDossierId(null)}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] cursor-pointer"
                      title="Hủy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${
                      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                    }`}>{dossier.title}</h4>
                    <button
                      onClick={() => {
                        setEditingDossierId(dossier.id);
                        setEditingDossierTitle(dossier.title);
                      }}
                      className="opacity-60 hover:opacity-100 p-1 text-purple-400 hover:text-purple-300 cursor-pointer"
                      title="Đổi tên tiêu đề"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className={`text-xs truncate ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>{dossier.subtitle || dossier.abstract}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyMarkdown(dossier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                {copiedId === dossier.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === dossier.id ? 'ĐÃ COPY' : 'COPY .MD'}</span>
              </button>

              <button
                onClick={() => handleDownloadDossierMd(dossier)}
                className={`p-2 rounded-lg cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200'
                }`}
                title="Tải tệp .md cho Google NotebookLM"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onSelectDossier(dossier.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-tech uppercase cursor-pointer"
              >
                Xem Thẻ
              </button>

              {deletingId === dossier.id ? (
                <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-lg">
                  <button onClick={() => { onDeleteDossier(dossier.id); setDeletingId(null); }} className="text-red-500 text-xs font-bold hover:text-red-400">Xác nhận xóa</button>
                  <button onClick={() => setDeletingId(null)} className="text-slate-400 text-xs hover:text-slate-300">Hủy</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingId(dossier.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-600 cursor-pointer"
                  title="Xóa hồ sơ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
