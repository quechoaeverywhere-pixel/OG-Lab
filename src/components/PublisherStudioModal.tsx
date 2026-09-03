import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  FolderOpen,
  Settings2,
  Sliders,
  Activity,
  FileText,
  Film,
  Maximize2,
  Minimize2,
  BookOpen
} from 'lucide-react';
import { Dossier, LexiconTerm, CitationItem, PromptTemplate, GeminiSettings } from '../types';
import { INTERDISCIPLINARY_DISCIPLINES, DisciplineMetadata } from '../data/interdisciplinaryDisciplines';
import { AccountDashboard } from './AccountDashboard';
import { PublisherDisciplinesTab } from './publisher-studio/PublisherDisciplinesTab';
import { PublisherAcademicDocAnalysisTab } from './publisher-studio/PublisherAcademicDocAnalysisTab';
import { PublisherDossiersTab } from './publisher-studio/PublisherDossiersTab';
import { PublisherGeminiConfigTab } from './publisher-studio/PublisherGeminiConfigTab';
import { PublisherProjectAnalysisTab } from './publisher-studio/PublisherProjectAnalysisTab';
import { PublisherMultimediaTab } from './publisher-studio/PublisherMultimediaTab';

interface PublisherStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: number;
  dossiers: Dossier[];
  onSelectDossier: (id: string) => void;
  onSaveDossier: (d: Dossier) => Promise<void>;
  onDeleteDossier: (id: string) => Promise<void>;
  onResetDefaultDossiers: () => Promise<void>;
  lexicon: LexiconTerm[];
  onAddLexiconTerm: (term: LexiconTerm) => void;
  onDeleteLexiconTerm: (id: string) => void;
  citations: CitationItem[];
  onAddCitation: (c: CitationItem) => void;
  onDeleteCitation: (id: string) => void;
  promptTemplates: PromptTemplate[];
  onAddPromptTemplate: (p: PromptTemplate) => void;
  geminiSettings: GeminiSettings;
  onUpdateGeminiSettings: (s: GeminiSettings) => void;
  disciplines?: DisciplineMetadata[];
  onAddDiscipline?: (discipline: DisciplineMetadata) => void;
  onDeleteDiscipline?: (disciplineId: string) => void;
  onResetDefaultDisciplines?: () => void;
  theme: 'dark' | 'light';
  onOpenReportPresentation?: (dossier: Dossier) => void;
}

export const PublisherStudioModal: React.FC<PublisherStudioModalProps> = ({
  isOpen,
  onClose,
  initialTab = 0,
  dossiers,
  onSelectDossier,
  onSaveDossier,
  onDeleteDossier,
  onResetDefaultDossiers,
  geminiSettings,
  onUpdateGeminiSettings,
  disciplines = INTERDISCIPLINARY_DISCIPLINES,
  onAddDiscipline,
  onDeleteDiscipline,
  onResetDefaultDisciplines,
  theme,
  onOpenReportPresentation
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 0, name: 'Lĩnh Vực Học Thuật', icon: Layers, desc: 'Đa ngành & Chuyên ngành' },
    { id: 1, name: 'Phân Tích Tài Liệu & Tạo Hồ Sơ', icon: BookOpen, desc: 'Deep Research & Chuyển Hóa Tri Thức' },
    { id: 2, name: 'Quản Trị Hồ Sơ & Xuất Bản', icon: FolderOpen, desc: 'NotebookLM Markdown & HTML' },
    { id: 3, name: 'Multimedia Studio', icon: Film, desc: 'Video, Podcast NotebookLM, Infographic & Slides' },
    { id: 4, name: 'Phân Tích Dự Án', icon: FileText, desc: 'Thẩm định & Kịch bản thực chiến' },
    { id: 5, name: 'Cấu Hình Gemini AI', icon: Settings2, desc: 'Mô hình, Grounding & Tham số' },
    { id: 6, name: 'Tài Khoản & Bảo Mật', icon: Activity, desc: 'Zero-Trust, Logs & Token' }
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 ${
        isFullscreen ? 'p-0' : 'p-2 md:p-6'
      }`}
    >
      <div
        className={`w-full ${
          isFullscreen
            ? 'h-full max-w-none rounded-none border-0'
            : 'max-w-7xl h-[94vh] rounded-3xl border'
        } shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-[#0a0915] text-slate-100 border-purple-500/30 shadow-purple-950/50'
            : 'bg-white text-slate-900 border-purple-200 shadow-xl'
        }`}
      >
        {/* HEADER */}
        <div
          className={`p-4 md:px-6 flex items-center justify-between border-b ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-fuchsia-600/30 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display-title font-bold text-base md:text-lg tracking-wide uppercase">
                  PUBLISHER STUDIO // TRUNG TÂM QUẢN TRỊ ĐA NGÀNH
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold hidden sm:inline-block">
                  MULTIMEDIA & NOTEBOOKLM READY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Quản lý {disciplines.length} lĩnh vực liên ngành, Phân tích tài liệu học thuật &amp; Multimedia Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isFullscreen
                  ? 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/40 hover:bg-fuchsia-600/30 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isFullscreen ? 'Thu nhỏ cửa sổ (Khôi phục)' : 'Mở rộng toàn màn hình (Full Screen)'}
              aria-label={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-fuchsia-400" />
                  <span className="hidden md:inline">Thu Nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-slate-300" />
                  <span className="hidden md:inline">Toàn Màn Hình</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors border border-transparent hover:border-slate-700"
              title="Đóng cửa sổ"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS BAR */}
        <div
          className={`flex items-center overflow-x-auto px-4 md:px-6 border-b no-scrollbar ${
            theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-tech font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                      : 'border-fuchsia-600 text-fuchsia-700 bg-fuchsia-100/70'
                    : theme === 'dark'
                      ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* BODY CONTENT */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${
          theme === 'dark' ? 'bg-[#0a0915]' : 'bg-white'
        }`}>
          {/* TAB 0: QUẢN TRỊ HỆ THỐNG LĨNH VỰC HỌC THUẬT & TUỲ BIẾN ĐA NGÀNH */}
          {activeTab === 0 && (
            <PublisherDisciplinesTab
              disciplines={disciplines}
              onAddDiscipline={onAddDiscipline}
              onDeleteDiscipline={onDeleteDiscipline}
              onResetDefaultDisciplines={onResetDefaultDisciplines}
              geminiSettings={geminiSettings}
              theme={theme}
            />
          )}

          {/* TAB 1: PHÂN TÍCH TÀI LIỆU HỌC THUẬT & TẠO HỒ SƠ NGHIÊN CỨU (KNOWLEDGE TRANSFORMING) */}
          {activeTab === 1 && (
            <PublisherAcademicDocAnalysisTab
              theme={theme}
              geminiSettings={geminiSettings}
              onSaveDossier={onSaveDossier}
              onSelectDossier={onSelectDossier}
              onClose={onClose}
              disciplines={disciplines}
            />
          )}

          {/* TAB 2: QUẢN TRỊ HỒ SƠ & XUẤT BẢN */}
          {activeTab === 2 && (
            <PublisherDossiersTab
              dossiers={dossiers}
              onSelectDossier={onSelectDossier}
              onSaveDossier={onSaveDossier}
              onDeleteDossier={onDeleteDossier}
              onResetDefaultDossiers={onResetDefaultDossiers}
              onClose={onClose}
              theme={theme}
            />
          )}

          {/* TAB 3: MULTIMEDIA STUDIO (VIDEO, PODCAST NOTEBOOKLM, INFOGRAPHIC, SLIDEDECK) */}
          {activeTab === 3 && (
            <PublisherMultimediaTab
              dossiers={dossiers}
              geminiSettings={geminiSettings}
              onSelectDossier={onSelectDossier}
              onOpenReportPresentation={onOpenReportPresentation}
            />
          )}

          {/* TAB 4: PHÂN TÍCH DỰ ÁN & KỊCH BẢN THỰC CHIẾN */}
          {activeTab === 4 && (
            <PublisherProjectAnalysisTab
              theme={theme}
              geminiSettings={geminiSettings}
              onSaveDossier={onSaveDossier}
              onSelectDossier={onSelectDossier}
              onClose={onClose}
            />
          )}

          {/* TAB 5: CẤU HÌNH GEMINI AI */}
          {activeTab === 5 && (
            <PublisherGeminiConfigTab
              geminiSettings={geminiSettings}
              onUpdateGeminiSettings={onUpdateGeminiSettings}
              theme={theme}
            />
          )}

          {/* TAB 6: TÀI KHOẢN & BẢO MẬT */}
          {activeTab === 6 && (
            <AccountDashboard theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
};
