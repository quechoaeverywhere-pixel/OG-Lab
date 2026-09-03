import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  BookOpen,
  Plus,
  Sliders,
  Leaf,
  Atom,
  Monitor,
  Layers,
  Brain,
  Cpu,
  Landmark,
  Globe,
  Workflow,
  Film
} from 'lucide-react';
import { Dossier } from '../types';
import { DisciplineMetadata, DISCIPLINE_GROUPS } from '../data/interdisciplinaryDisciplines';
import { useAuth } from '../contexts/AuthContext';

interface ResearchPortalLandingProps {
  dossiers: Dossier[];
  disciplines: DisciplineMetadata[];
  onSelectDossier: (dossierId: string) => void;
  onOpenQuickResearchWithTopic: (topic: string) => void;
  onOpenNewDossierModal: () => void;
  onOpenStudioTab: (tabIndex: number) => void;
  onOpenSettings: () => void;
  onOpenPresentation?: (dossierId: string) => void;
  theme: 'dark' | 'light';
}

export const ResearchPortalLanding: React.FC<ResearchPortalLandingProps> = ({
  dossiers,
  disciplines,
  onSelectDossier,
  onOpenQuickResearchWithTopic,
  onOpenNewDossierModal,
  onOpenStudioTab,
  onOpenPresentation,
  theme
}) => {
  const { isViewer } = useAuth();
  const [customSearchTopic, setCustomSearchTopic] = useState('');

  // Filter dossiers based on search
  const displayedDossiers = useMemo(() => {
    const term = customSearchTopic.trim().toLowerCase();
    if (!term) return dossiers;
    return dossiers.filter(d => 
      (d.topic && d.topic.toLowerCase().includes(term)) ||
      (d.title && d.title.toLowerCase().includes(term)) ||
      (d.abstract && d.abstract.toLowerCase().includes(term))
    );
  }, [dossiers, customSearchTopic]);

  const handleLaunchSearchTopic = () => {
    if (isViewer) {
      const section = document.getElementById('section-featured-dossiers');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const topic = customSearchTopic.trim() || 'Kinh tế bền vững và chuyển đổi xanh';
    onOpenQuickResearchWithTopic(topic);
  };

  return (
    <div
      id="research-portal-landing-container"
      className={`flex-1 h-full overflow-y-auto ${
        theme === 'dark' ? 'bg-[#090812] text-slate-100' : 'bg-[#f8f9fc] text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-10">

        {/* 1. HERO COCKPIT: VIỆN NGHIÊN CỨU & KHÁM PHÁ TRI THỨC TOÀN CẦU */}
        <section
          id="hero-research-cockpit"
          className={`relative overflow-hidden rounded-3xl p-6 md:p-10 border transition-all ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#121028] via-[#100d24] to-[#0a0918] border-purple-500/30 shadow-2xl shadow-purple-950/40'
              : 'bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60 border-purple-200/80 shadow-xl'
          }`}
        >
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-xs ${
                theme === 'dark'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-purple-100 text-purple-900 border-purple-300'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                <span>ONENESS GOVERNANCE DEEP RESEARCH PORTAL</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[11px] font-mono border ${
                theme === 'dark'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                <Leaf className="w-3 h-3 text-emerald-500" />
                <span>Trọng Tâm: Kinh Tế Bền Vững & Net-Zero</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[11px] font-mono border ${
                theme === 'dark'
                  ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-300'
              }`}>
                <Atom className="w-3 h-3 text-indigo-500" />
                <span>6 Trụ Cột Động • Chuyển Hóa Tri Thức</span>
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2 max-w-4xl">
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display-title leading-tight bg-clip-text text-transparent ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-200 via-indigo-100 to-cyan-200'
                  : 'bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-800'
              }`}>
                Quảng Trường Tri Thức & Không Gian Khảo Luận
              </h1>
              <p className={`text-sm md:text-base font-sans leading-relaxed ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Trung tâm nghiên cứu học thuật & chuyển hóa tri thức theo Bản Giao Ước 6 Trụ Cột Động. Tra cứu liên ngành, phát triển hồ sơ nghiên cứu chuyên sâu và trình chiếu đa chiều.
              </p>
            </div>

            {/* Quick Interactive Search & Instant Deep Research Box */}
            <div
              className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2.5 shadow-lg ${
                theme === 'dark'
                  ? 'bg-slate-950/80 border-slate-800 focus-within:border-purple-500/60'
                  : 'bg-white border-slate-300 focus-within:border-purple-500'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 w-full px-3 py-1">
                <Search className="w-5 h-5 text-purple-500 shrink-0" />
                <input
                  type="text"
                  value={customSearchTopic}
                  onChange={e => setCustomSearchTopic(e.target.value)}
                  placeholder="Nhập chủ đề hoặc từ khóa cần khảo luận (vd: Tài chính carbon, AI Swarms, Thể chế xanh)..."
                  className={`w-full bg-transparent text-xs sm:text-sm font-mono outline-none ${
                    theme === 'dark'
                      ? 'text-slate-100 placeholder:text-slate-500'
                      : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleLaunchSearchTopic();
                  }}
                />
              </div>

              {!isViewer && (
                <button
                  onClick={handleLaunchSearchTopic}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>⚡ Khảo Luận Nhanh</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2. FEATURED DOSSIERS (HỒ SƠ KHẢO LUẬN) */}
        <section id="section-featured-dossiers" className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b pb-3 border-slate-800/60">
            <div>
              <h2 className={`text-lg md:text-xl font-bold font-display-title flex items-center gap-2 ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span>Hồ Sơ Khảo Luận & Tạp Chí Xuất Bản ({displayedDossiers.length})</span>
              </h2>
              <p className={`text-xs font-sans mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Các bộ Hồ sơ Chuyên sâu chuẩn NotebookLM đã biên soạn và phân tầng 6 Trụ Cột Động
              </p>
            </div>

            {!isViewer && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenNewDossierModal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-purple-500" />
                  <span>Tạo Hồ Sơ Mới</span>
                </button>

                <button
                  onClick={() => onOpenStudioTab(2)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    theme === 'dark'
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                  }`}
                  title="Sản xuất Video, Podcast NotebookLM, Infographic & Slidedeck"
                >
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>Multimedia Studio</span>
                </button>

                <button
                  onClick={() => onOpenStudioTab(3)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    theme === 'dark'
                      ? 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/30'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-300 shadow-xs'
                  }`}
                  title="Phân tích đề án, thẩm định hồ sơ và sản xuất 6 kịch bản hành động thực chiến"
                >
                  <Workflow className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Phân Tích Dự Án</span>
                </button>

                <button
                  onClick={() => onOpenStudioTab(1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    theme === 'dark'
                      ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-500/30'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300 shadow-xs'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>Quản Trị Studio</span>
                </button>
              </div>
            )}
          </div>

          {/* Dossiers Grid */}
          {displayedDossiers.length === 0 ? (
            <div className={`rounded-2xl p-8 border text-center flex flex-col items-center justify-center gap-3 ${
              theme === 'dark'
                ? 'bg-[#0f0e1f] border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700 shadow-xs'
            }`}>
              <BookOpen className="w-8 h-8 text-purple-400 opacity-70" />
              <div className="max-w-md space-y-1">
                <h3 className="font-bold text-sm">Chưa có hồ sơ khảo luận nào</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Không gian nghiên cứu đã được dọn sạch. Bạn có thể bắt đầu nghiên cứu chủ đề mới theo chuẩn 6 Trụ Cột Động.
                </p>
              </div>
              {!isViewer && (
                <button
                  onClick={onOpenNewDossierModal}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Hồ Sơ Mới</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedDossiers.map((dossier, dIdx) => {
                return (
                  <div
                    key={dossier.id}
                    className={`group rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                      theme === 'dark'
                        ? 'bg-[#0f0e1f] hover:bg-[#141229] border-slate-800 hover:border-purple-500/50 shadow-lg shadow-black/30'
                        : 'bg-white hover:bg-purple-50/30 border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold tracking-wider border ${
                          theme === 'dark'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                        }`}>
                          HỒ SƠ #{String(dossier.chapterNumber ?? (dIdx + 1)).padStart(2, '0')}
                        </span>
                      </div>

                      <div>
                        <h3 className={`font-bold text-sm leading-snug transition-colors line-clamp-2 ${
                          theme === 'dark'
                            ? 'text-slate-100 group-hover:text-purple-300'
                            : 'text-slate-900 group-hover:text-purple-800'
                        }`}>
                          {dossier.title}
                        </h3>
                        {dossier.subtitle && (
                          <p className={`text-xs line-clamp-2 mt-1 font-medium leading-relaxed ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {dossier.subtitle}
                          </p>
                        )}
                      </div>

                      <p className={`text-xs line-clamp-3 font-serif italic border-l-2 pl-2.5 leading-relaxed ${
                        theme === 'dark'
                          ? 'text-slate-300/90 border-purple-500/40'
                          : 'text-slate-700 border-purple-500/60 bg-slate-50/80 py-1 pr-1 rounded-r'
                      }`}>
                        "{dossier.abstract}"
                      </p>

                      {dossier.tags && dossier.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {dossier.tags.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                                theme === 'dark'
                                  ? 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`pt-4 mt-3 border-t flex items-center justify-between gap-2 ${
                      theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'
                    }`}>
                      <div>
                        {onOpenPresentation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPresentation(dossier.id);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                              theme === 'dark'
                                ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-500/30'
                                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                            }`}
                            title="Trình chiếu toàn màn hình hoặc lấy link chia sẻ độc bản"
                          >
                            <Monitor className="w-3 h-3 text-purple-400" />
                            <span>Trình Chiếu</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectDossier(dossier.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 ml-auto"
                      >
                        <span>Đọc Toàn Văn</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. ACADEMIC DISCIPLINES & MULTI-DISCIPLINARY LENSES OVERVIEW */}
        <section id="section-academic-disciplines" className="space-y-4 pt-4 border-t border-slate-800/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className={`text-lg md:text-xl font-bold font-display-title flex items-center gap-2 ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
                <Layers className="w-5 h-5 text-purple-400" />
                <span>Hệ Thống Lĩnh Vực Học Thuật & Lăng Kính Đa Ngành ({disciplines?.length || 38})</span>
              </h2>
              <p className={`text-xs font-sans mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Phân tầng 6 nhóm nghiên cứu liên ngành định hình các khảo luận chuyên sâu và ánh xạ kiến trúc hệ thống
              </p>
            </div>

            <button
              onClick={() => onOpenStudioTab(0)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-500/30'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300 shadow-xs'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-500" />
              <span>Quản Trị Lĩnh Vực & Thêm AI</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DISCIPLINE_GROUPS.map(grp => {
              const groupDisciplines = (disciplines || []).filter(d => (d.groupId || 'emerging_frontier') === grp.id);
              return (
                <div
                  key={grp.id}
                  onClick={() => onOpenStudioTab(0)}
                  className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group ${
                    theme === 'dark'
                      ? 'bg-[#0f0e1f] hover:bg-[#141229] border-slate-800 hover:border-purple-500/50 shadow-md shadow-black/20'
                      : 'bg-white hover:bg-purple-50/20 border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${grp.badgeBg} ${grp.color} ${grp.border}`}>
                        {grp.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-purple-400 transition-colors">
                      {groupDisciplines.length} Lĩnh Vực →
                    </span>
                  </div>

                  <p className={`text-xs line-clamp-2 leading-relaxed mb-3 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {grp.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {groupDisciplines.slice(0, 4).map(d => (
                      <span
                        key={d.id}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border truncate max-w-[140px] ${
                          theme === 'dark'
                            ? 'bg-slate-900 text-slate-300 border-slate-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {d.name}
                      </span>
                    ))}
                    {groupDisciplines.length > 4 && (
                      <span className="text-[10px] font-mono text-purple-400 px-1 py-0.5">
                        +{groupDisciplines.length - 4} khác
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
