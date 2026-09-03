import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Quote,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  FolderOpen
} from 'lucide-react';
import { LexiconTerm, CitationItem, Dossier } from '../types';
import { SidebarDossiersTab } from './right-sidebar/SidebarDossiersTab';
import { SidebarLexiconTab } from './right-sidebar/SidebarLexiconTab';
import { SidebarCitationsTab } from './right-sidebar/SidebarCitationsTab';

interface RightSidebarProps {
  lexicon: LexiconTerm[];
  citations: CitationItem[];
  dossiers?: Dossier[];
  currentDossier: Dossier | null;
  onSelectDossier?: (id: string) => void;
  onDeleteDossier?: (id: string) => void;
  onOpenNewDossier?: () => void;
  onAddLexiconTerm: (term: LexiconTerm) => void;
  onAddCitation: (citation: CitationItem) => void;
  onDeleteLexiconTerm?: (id: string) => void;
  onDeleteCitation?: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'dark' | 'light';
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  lexicon,
  citations,
  dossiers = [],
  currentDossier,
  onSelectDossier,
  onDeleteDossier,
  onOpenNewDossier,
  onAddLexiconTerm,
  onAddCitation,
  onDeleteLexiconTerm,
  onDeleteCitation,
  isCollapsed,
  onToggleCollapse,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'dossiers' | 'lexicon' | 'citations'>('dossiers');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCurrentOnly, setFilterCurrentOnly] = useState(false);

  // Filtered Lexicon
  const filteredLexicon = useMemo(() => {
    let list = lexicon;
    if (filterCurrentOnly && currentDossier) {
      const qText = `${currentDossier.title} ${currentDossier.contentMarkdown || ''}`.toLowerCase();
      list = list.filter(t => qText.includes(t.term.toLowerCase()) || qText.includes(t.enTerm.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        t =>
          t.term.toLowerCase().includes(q) ||
          t.enTerm.toLowerCase().includes(q) ||
          t.deepExplanation.toLowerCase().includes(q) ||
          (t.csEquivalent && t.csEquivalent.toLowerCase().includes(q))
      );
    }
    return list;
  }, [lexicon, filterCurrentOnly, currentDossier, searchQuery]);

  // Filtered Citations
  const filteredCitations = useMemo(() => {
    let list = citations;
    if (filterCurrentOnly && currentDossier) {
      list = list.filter(c => c.dossierIds?.includes(currentDossier.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          (c.keyQuote && c.keyQuote.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [citations, filterCurrentOnly, currentDossier, searchQuery]);

  // Filtered Dossiers
  const filteredDossiers = useMemo(() => {
    let list = dossiers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          (d.subtitle && d.subtitle.toLowerCase().includes(q)) ||
          (d.abstract && d.abstract.toLowerCase().includes(q)) ||
          (d.discipline && d.discipline.toLowerCase().includes(q)) ||
          (d.tags && d.tags.some(tag => tag.toLowerCase().includes(q))) ||
          `#${String(d.chapterNumber || '').padStart(2, '0')}`.includes(q)
      );
    }
    return list;
  }, [dossiers, searchQuery]);

  const handleCopyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadDossierMarkdown = (dossier: Dossier) => {
    const filename = `${dossier.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'dossier'}.md`;
    const header = `# ${dossier.title}\n*${dossier.subtitle || ''}*\n\n> **Tóm tắt (Abstract):**\n> ${dossier.abstract || ''}\n\n---\n\n`;
    const fullText = header + (dossier.contentMarkdown || '');
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // If collapsed: show slim vertical strip with toggle icon only
  if (isCollapsed) {
    return (
      <aside
        id="right-sidebar-collapsed"
        className={`w-12 h-full flex flex-col items-center py-3.5 justify-between border-l select-none transition-all duration-200 z-10 flex-shrink-0 ${
          theme === 'dark' ? 'bg-[#090813] text-slate-400 border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}
      >
        <button
          id="btn-expand-right-sidebar"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-purple-600/20 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
          title="Mở rộng Kho Tri Thức (Từ Điển, Trích Dẫn & Hồ Sơ)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1" />
      </aside>
    );
  }

  return (
    <aside
      id="right-sidebar-expanded"
      className={`w-80 md:w-96 h-full flex flex-col flex-shrink-0 border-l select-none transition-all duration-200 z-10 ${
        theme === 'dark'
          ? 'bg-[#090813] text-slate-300 border-slate-900'
          : 'bg-white text-slate-700 border-slate-200 shadow-sm'
      }`}
    >
      {/* Header & Tabs */}
      <div className={`p-3 border-b space-y-2.5 ${
        theme === 'dark' ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              KHO TRI THỨC
            </h3>
          </div>
          <button
            id="btn-collapse-right-sidebar"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Thu nhỏ Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Tab Switcher */}
        <div className={`grid grid-cols-3 p-1 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-200/80 border-slate-300'
        }`}>
          <button
            id="btn-tab-dossiers"
            onClick={() => setActiveTab('dossiers')}
            className={`py-2 px-2 rounded-lg text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dossiers'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Danh Mục Hồ Sơ Khảo Luận"
          >
            <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">HỒ SƠ</span>
          </button>

          <button
            id="btn-tab-lexicon"
            onClick={() => setActiveTab('lexicon')}
            className={`py-2 px-2 rounded-lg text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'lexicon'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Từ Điển Thuật Ngữ"
          >
            <BookMarked className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">TỪ ĐIỂN</span>
          </button>

          <button
            id="btn-tab-citations"
            onClick={() => setActiveTab('citations')}
            className={`py-2 px-2 rounded-lg text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'citations'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Sổ Trích Dẫn"
          >
            <Quote className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">TRÍCH DẪN</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'lexicon'
                  ? 'Tìm thuật ngữ, khái niệm...'
                  : activeTab === 'citations'
                  ? 'Tìm trích dẫn, tác giả...'
                  : 'Tìm hồ sơ, chủ đề, thẻ...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500 shadow-2xs'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(activeTab === 'lexicon' || activeTab === 'citations') && (
            <button
              onClick={() => setFilterCurrentOnly(!filterCurrentOnly)}
              className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                filterCurrentOnly
                  ? 'bg-purple-600 text-white font-bold'
                  : theme === 'dark'
                  ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 border border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
              title="Chỉ lọc các mục liên quan đến hồ sơ đang mở"
            >
              <span>{filterCurrentOnly ? 'Hiện tại' : 'Tất cả'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* TAB 1: DANH MỤC HỒ SƠ */}
        {activeTab === 'dossiers' && (
          <SidebarDossiersTab
            filteredDossiers={filteredDossiers}
            currentDossier={currentDossier}
            onSelectDossier={onSelectDossier}
            onDeleteDossier={onDeleteDossier}
            onOpenNewDossier={onOpenNewDossier}
            onDownloadDossierMarkdown={handleDownloadDossierMarkdown}
            theme={theme}
          />
        )}

        {/* TAB 2: TỪ ĐIỂN THUẬT NGỮ */}
        {activeTab === 'lexicon' && (
          <SidebarLexiconTab
            filteredLexicon={filteredLexicon}
            onAddLexiconTerm={onAddLexiconTerm}
            onDeleteLexiconTerm={onDeleteLexiconTerm}
            copiedId={copiedId}
            onCopyText={handleCopyText}
            theme={theme}
          />
        )}

        {/* TAB 3: SỔ TRÍCH DẪN */}
        {activeTab === 'citations' && (
          <SidebarCitationsTab
            filteredCitations={filteredCitations}
            currentDossier={currentDossier}
            onAddCitation={onAddCitation}
            onDeleteCitation={onDeleteCitation}
            copiedId={copiedId}
            onCopyText={handleCopyText}
            theme={theme}
          />
        )}
      </div>
    </aside>
  );
};
