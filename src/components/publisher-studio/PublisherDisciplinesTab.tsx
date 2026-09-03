import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Sparkles,
  X,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Landmark,
  Brain,
  Network,
  Cpu,
  TrendingUp,
  Atom,
  ShieldCheck,
  Activity,
  Compass,
  Eye,
  Users,
  Globe,
  Scale,
  Building2,
  Dna,
  Zap,
  Radio,
  Gauge,
  Wind,
  KeyRound,
  Boxes,
  Cloud,
  Filter,
  Grid,
  List,
  RotateCcw,
  Sparkle,
  Code2,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Tag
} from 'lucide-react';
import {
  DisciplineMetadata,
  DisciplineGroup,
  DISCIPLINE_GROUPS,
  classifyDisciplineIntoGroup,
  INTERDISCIPLINARY_DISCIPLINES
} from '../../data/interdisciplinaryDisciplines';
import { GeminiSettings } from '../../types';
import { safeFetchAIJson } from '../../utils/ai-client';

interface PublisherDisciplinesTabProps {
  disciplines: DisciplineMetadata[];
  onAddDiscipline?: (discipline: DisciplineMetadata) => void;
  onDeleteDiscipline?: (disciplineId: string) => void;
  onResetDefaultDisciplines?: () => void;
  geminiSettings: GeminiSettings;
  theme: 'dark' | 'light';
}

// Safe Dynamic Icon Resolver for 38+ Disciplines
const getDisciplineIcon = (iconName: string, className: string = 'w-5 h-5') => {
  const normalized = (iconName || '').toLowerCase().trim();
  switch (normalized) {
    case 'atom':
      return <Atom className={className} />;
    case 'brain':
      return <Brain className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'network':
      return <Network className={className} />;
    case 'trendingup':
    case 'trending_up':
      return <TrendingUp className={className} />;
    case 'shieldcheck':
    case 'shield_check':
      return <ShieldCheck className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'building2':
    case 'building':
      return <Building2 className={className} />;
    case 'dna':
      return <Dna className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'radio':
      return <Radio className={className} />;
    case 'gauge':
      return <Gauge className={className} />;
    case 'wind':
      return <Wind className={className} />;
    case 'keyround':
    case 'key':
      return <KeyRound className={className} />;
    case 'boxes':
    case 'box':
      return <Boxes className={className} />;
    case 'cloud':
      return <Cloud className={className} />;
    case 'bookopen':
    case 'book':
      return <BookOpen className={className} />;
    case 'sparkles':
    case 'sparkle':
      return <Sparkles className={className} />;
    default:
      return <Layers className={className} />;
  }
};

export const PublisherDisciplinesTab: React.FC<PublisherDisciplinesTabProps> = ({
  disciplines,
  onAddDiscipline,
  onDeleteDiscipline,
  onResetDefaultDisciplines,
  geminiSettings,
  theme
}) => {
  // Navigation & Filtering
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [disciplineSearch, setDisciplineSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [onlyCustomFilter, setOnlyCustomFilter] = useState(false);

  // Modals & Forms
  const [isAddingDiscipline, setIsAddingDiscipline] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [smartDisciplineInput, setSmartDisciplineInput] = useState('');
  const [isAnalyzingDiscipline, setIsAnalyzingDiscipline] = useState(false);
  const [smartDisciplineError, setSmartDisciplineError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Form States
  const [newDiscName, setNewDiscName] = useState('');
  const [newDiscEnName, setNewDiscEnName] = useState('');
  const [newDiscGroupId, setNewDiscGroupId] = useState<string>('');
  const [newDiscColor, setNewDiscColor] = useState('text-purple-400');
  const [newDiscIcon, setNewDiscIcon] = useState('Atom');
  const [newDiscDesc, setNewDiscDesc] = useState('');
  const [newDiscLenses, setNewDiscLenses] = useState('');
  const [newDiscFigures, setNewDiscFigures] = useState('');
  const [newDiscAnalogy, setNewDiscAnalogy] = useState('');
  const [newDiscMethodology, setNewDiscMethodology] = useState('');

  // Live Automatic Classification calculation as user inputs data
  const liveClassification = useMemo(() => {
    if (!newDiscName.trim() && !newDiscDesc.trim()) {
      return null;
    }
    return classifyDisciplineIntoGroup({
      name: newDiscName,
      enName: newDiscEnName,
      description: newDiscDesc,
      systemAnalogy: newDiscAnalogy,
      methodology: newDiscMethodology,
      coreLenses: newDiscLenses ? newDiscLenses.split(',').map(s => s.trim()) : [],
      keyFigures: newDiscFigures ? newDiscFigures.split(',').map(s => s.trim()) : []
    });
  }, [newDiscName, newDiscEnName, newDiscDesc, newDiscAnalogy, newDiscMethodology, newDiscLenses, newDiscFigures]);

  // Handle copying formatted lens prompt for deep research
  const handleCopyLensPrompt = (disc: DisciplineMetadata) => {
    const promptText = `[LĂNG KÍNH HỌC THUẬT: ${disc.name.toUpperCase()} (${disc.enName})]
- Nhóm học thuật: ${disc.groupName || 'Liên ngành'}
- Trọng tâm nhận thức luận: ${disc.description}
- Các lăng kính phân tích cốt lõi: ${disc.coreLenses.join(' • ')}
- Học giả & Tác gia định hình: ${disc.keyFigures.join(', ')}
- Ánh xạ tương đương sang Kiến trúc Phần mềm & AI: ${disc.systemAnalogy}
${disc.methodology ? `- Phương pháp luận: ${disc.methodology}` : ''}`;

    navigator.clipboard.writeText(promptText);
    setCopiedId(disc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // AI Generation with Gemini
  const handleSmartGenerateDiscipline = async (customKeyword?: string) => {
    const kw = (customKeyword || smartDisciplineInput).trim();
    if (!kw) {
      setSmartDisciplineError('Vui lòng nhập từ khóa, chủ đề hoặc khái niệm cần tạo.');
      return;
    }

    setIsAnalyzingDiscipline(true);
    setSmartDisciplineError('');

    try {
      const res = await safeFetchAIJson('/api/gemini/generate-discipline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: kw,
          model: geminiSettings.model || 'gemini-2.5-flash'
        })
      });

      if (res.ok && res.data && res.data.success && res.data.discipline) {
        let generated: DisciplineMetadata = res.data.discipline;

        // Ensure proper group classification
        if (!generated.groupId || !DISCIPLINE_GROUPS.some(g => g.id === generated.groupId)) {
          const autoClassified = classifyDisciplineIntoGroup(generated);
          generated.groupId = autoClassified.groupId;
          generated.groupName = autoClassified.groupName;
        } else {
          const matchedGroup = DISCIPLINE_GROUPS.find(g => g.id === generated.groupId);
          if (matchedGroup) {
            generated.groupName = matchedGroup.name;
          }
        }
        generated.isCustom = true;

        if (onAddDiscipline) {
          onAddDiscipline(generated);
        }
        setSmartDisciplineInput('');
        setIsAiModalOpen(false);
      } else {
        setSmartDisciplineError(res.data?.error || 'Không thể tự động phân tích lĩnh vực. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error in handleSmartGenerateDiscipline:', err);
      setSmartDisciplineError(err.message || 'Lỗi kết nối khi phân tích lĩnh vực.');
    } finally {
      setIsAnalyzingDiscipline(false);
    }
  };

  // Manual Submission with Auto Group Fallback
  const handleCreateCustomDiscipline = () => {
    if (!newDiscName.trim()) return;

    // Use selected group or auto-classified group
    let finalGroupId = newDiscGroupId;
    let finalGroupName = '';

    if (!finalGroupId) {
      const classified = liveClassification || classifyDisciplineIntoGroup({
        name: newDiscName,
        enName: newDiscEnName,
        description: newDiscDesc
      });
      finalGroupId = classified.groupId;
      finalGroupName = classified.groupName;
    } else {
      const matched = DISCIPLINE_GROUPS.find(g => g.id === finalGroupId);
      finalGroupName = matched ? matched.name : 'Lĩnh Vực Đột Phá & Mới Nổi';
    }

    const newId = `custom_${Date.now()}`;
    const newDiscipline: DisciplineMetadata = {
      id: newId,
      groupId: finalGroupId,
      groupName: finalGroupName,
      name: newDiscName.trim(),
      enName: newDiscEnName.trim() || newDiscName.trim(),
      icon: newDiscIcon || 'Atom',
      color: newDiscColor || 'text-purple-400',
      bgLight: 'bg-purple-100 text-purple-900',
      bgDark: 'bg-purple-950/60 text-purple-300',
      description: newDiscDesc.trim() || 'Lĩnh vực nghiên cứu liên ngành chuyên sâu.',
      coreLenses: newDiscLenses ? newDiscLenses.split(',').map(s => s.trim()).filter(Boolean) : ['Khảo luận bản thể', 'Quy luật cơ chế', 'Kiến trúc thực thi'],
      keyFigures: newDiscFigures ? newDiscFigures.split(',').map(s => s.trim()).filter(Boolean) : ['Học giả tiêu biểu'],
      systemAnalogy: newDiscAnalogy.trim() || 'Kiến trúc hệ thống và mô hình phân tán.',
      methodology: newDiscMethodology.trim() || 'Phân tích đa biến và mô hình hóa hệ thống.',
      isCustom: true
    };

    if (onAddDiscipline) {
      onAddDiscipline(newDiscipline);
    }
    setIsAddingDiscipline(false);
    setNewDiscName('');
    setNewDiscEnName('');
    setNewDiscGroupId('');
    setNewDiscDesc('');
    setNewDiscLenses('');
    setNewDiscFigures('');
    setNewDiscAnalogy('');
    setNewDiscMethodology('');
  };

  // Group Mapping for Display
  const groupedDisciplines = useMemo(() => {
    const q = disciplineSearch.toLowerCase().trim();

    const filtered = disciplines.filter(d => {
      if (onlyCustomFilter && !d.isCustom && !d.id.startsWith('custom_')) {
        return false;
      }
      if (selectedGroupFilter !== 'all' && d.groupId !== selectedGroupFilter) {
        return false;
      }
      if (!q) return true;

      return (
        d.name.toLowerCase().includes(q) ||
        d.enName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.groupName && d.groupName.toLowerCase().includes(q)) ||
        d.systemAnalogy.toLowerCase().includes(q) ||
        (d.methodology && d.methodology.toLowerCase().includes(q)) ||
        d.coreLenses.some(l => l.toLowerCase().includes(q)) ||
        d.keyFigures.some(f => f.toLowerCase().includes(q))
      );
    });

    const groupsMap: Record<string, { group: DisciplineGroup; items: DisciplineMetadata[] }> = {};

    // Initialize map with all 6 groups
    DISCIPLINE_GROUPS.forEach(g => {
      groupsMap[g.id] = { group: g, items: [] };
    });

    // Populate disciplines into groups (auto fallback to 'emerging_frontier' if unknown)
    filtered.forEach(d => {
      const gId = d.groupId && groupsMap[d.groupId] ? d.groupId : 'emerging_frontier';
      groupsMap[gId].items.push(d);
    });

    return groupsMap;
  }, [disciplines, disciplineSearch, selectedGroupFilter, onlyCustomFilter]);

  // Count items per group for badge pills
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: disciplines.length };
    DISCIPLINE_GROUPS.forEach(g => {
      counts[g.id] = disciplines.filter(d => (d.groupId || 'emerging_frontier') === g.id).length;
    });
    return counts;
  }, [disciplines]);

  // Flat list for grid view
  const flatFilteredDisciplines = useMemo(() => {
    const q = disciplineSearch.toLowerCase().trim();
    return disciplines.filter(d => {
      if (onlyCustomFilter && !d.isCustom && !d.id.startsWith('custom_')) {
        return false;
      }
      if (selectedGroupFilter !== 'all' && d.groupId !== selectedGroupFilter) {
        return false;
      }
      if (!q) return true;

      return (
        d.name.toLowerCase().includes(q) ||
        d.enName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.groupName && d.groupName.toLowerCase().includes(q)) ||
        d.systemAnalogy.toLowerCase().includes(q) ||
        (d.methodology && d.methodology.toLowerCase().includes(q)) ||
        d.coreLenses.some(l => l.toLowerCase().includes(q)) ||
        d.keyFigures.some(f => f.toLowerCase().includes(q))
      );
    });
  }, [disciplines, disciplineSearch, selectedGroupFilter, onlyCustomFilter]);

  const customCount = disciplines.filter(d => d.isCustom || d.id.startsWith('custom_')).length;

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className={`p-6 rounded-2xl border transition-all ${
        theme === 'dark'
          ? 'bg-slate-900/60 border-slate-800 text-slate-100 shadow-xl shadow-black/20'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-tech tracking-wide uppercase">
                    Hệ Thống Lĩnh Vực Học Thuật & Lăng Kính Đa Ngành
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {disciplines.length} Lĩnh Vực
                  </span>
                </div>
                <p className={`text-xs font-mono mt-0.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Phân tầng theo 6 nhóm học thuật kinh điển & đột phá. Tự động liên kết vào Prompt Nghiên cứu & Khảo luận Oneness Governance.
                </p>
              </div>
            </div>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-tech tracking-wider uppercase flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Tạo Bằng Gemini AI</span>
            </button>

            <button
              onClick={() => setIsAddingDiscipline(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold font-tech tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thủ Công</span>
            </button>

            {onResetDefaultDisciplines && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn khôi phục về danh mục 38 lĩnh vực học thuật chuẩn?')) {
                    onResetDefaultDisciplines();
                  }
                }}
                title="Khôi phục danh mục 38 lĩnh vực mặc định"
                className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & VIEW SWITCHER BAR */}
        <div className="mt-5 pt-4 border-t border-slate-800/40 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* SEARCH INPUT */}
          <div className={`relative flex-1 w-full flex items-center rounded-xl border px-3 py-2 ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
          }`}>
            <Search className={`w-4 h-4 mr-2.5 shrink-0 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={disciplineSearch}
              onChange={e => setDisciplineSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên lĩnh vực, học giả, lăng kính, ánh xạ kiến trúc phần mềm..."
              className="bg-transparent border-none outline-none text-xs w-full font-mono placeholder:text-slate-500"
            />
            {disciplineSearch && (
              <button
                onClick={() => setDisciplineSearch('')}
                className="text-slate-500 hover:text-slate-300 ml-1.5 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* VIEW CONTROLS & TOGGLES */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {customCount > 0 && (
              <button
                onClick={() => setOnlyCustomFilter(!onlyCustomFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyCustomFilter
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : theme === 'dark'
                      ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                <span>Tự Tạo ({customCount})</span>
              </button>
            )}

            {/* VIEW MODE TOGGLE */}
            <div className={`flex items-center rounded-lg p-0.5 border ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setViewMode('grouped')}
                title="Xem theo từng Nhóm Học Thuật"
                className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grouped'
                    ? theme === 'dark'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theo Nhóm</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Xem toàn bộ dạng Lưới"
                className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? theme === 'dark'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dạng Lưới</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACADEMIC GROUPS PILL FILTER */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/40 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedGroupFilter === 'all'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : theme === 'dark'
                  ? 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <span>Tất cả</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedGroupFilter === 'all' ? 'bg-purple-800/60 text-purple-100' : 'bg-slate-700/50 text-slate-400'
            }`}>
              {groupCounts.all || disciplines.length}
            </span>
          </button>

          {DISCIPLINE_GROUPS.map(grp => {
            const count = groupCounts[grp.id] || 0;
            const isSelected = selectedGroupFilter === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => setSelectedGroupFilter(grp.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : theme === 'dark'
                      ? 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span>{grp.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-purple-800/60 text-purple-100' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: GROUPED VIEW (CATEGORIZED SECTIONS) */}
      {viewMode === 'grouped' && (
        <div className="space-y-8">
          {DISCIPLINE_GROUPS.filter(g => selectedGroupFilter === 'all' || selectedGroupFilter === g.id).map(grp => {
            const groupData = groupedDisciplines[grp.id];
            const items = groupData ? groupData.items : [];

            if (items.length === 0 && selectedGroupFilter !== 'all') {
              return null;
            }

            return (
              <div
                key={grp.id}
                id={`discipline-group-${grp.id}`}
                className={`rounded-2xl border p-5 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-950/40 border-slate-800/80'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                {/* GROUP HEADER BANNER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/40 gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${grp.badgeBg} ${grp.color} ${grp.border}`}>
                      {getDisciplineIcon(grp.icon, 'w-4 h-4')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold font-tech tracking-wide text-slate-200">
                          {grp.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-500">
                          ({grp.enName})
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${grp.badgeBg} ${grp.color}`}>
                          {items.length} Lĩnh Vực
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {grp.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DISCIPLINES CARDS GRID */}
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-slate-500">
                    Không tìm thấy lĩnh vực nào trong nhóm này khớp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map(discipline => (
                      <DisciplineCard
                        key={discipline.id}
                        discipline={discipline}
                        theme={theme}
                        copiedId={copiedId}
                        onCopy={handleCopyLensPrompt}
                        onDelete={onDeleteDiscipline}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: FLAT GRID VIEW */}
      {viewMode === 'grid' && (
        <div>
          {flatFilteredDisciplines.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-sm font-tech">Không tìm thấy lĩnh vực học thuật nào khớp với bộ lọc.</p>
              <button
                onClick={() => {
                  setDisciplineSearch('');
                  setSelectedGroupFilter('all');
                  setOnlyCustomFilter(false);
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-mono hover:bg-purple-500 cursor-pointer"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {flatFilteredDisciplines.map(discipline => (
                <DisciplineCard
                  key={discipline.id}
                  discipline={discipline}
                  theme={theme}
                  copiedId={copiedId}
                  onCopy={handleCopyLensPrompt}
                  onDelete={onDeleteDiscipline}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI DISCIPLINE GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-tech uppercase tracking-wider">
                    Tự Động Phân Tích & Tạo Lĩnh Vực Bằng Google Gemini AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    Nhập bất kỳ từ khóa hoặc khái niệm nào, AI sẽ phân tích và tự động xếp vào 1 trong 6 nhóm học thuật chuẩn.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                  Từ Khóa / Khái Niệm / Lĩnh Vực Cần Tạo:
                </label>
                <input
                  type="text"
                  value={smartDisciplineInput}
                  onChange={e => setSmartDisciplineInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !isAnalyzingDiscipline) {
                      handleSmartGenerateDiscipline();
                    }
                  }}
                  placeholder="VD: Kinh tế tuần hoàn, Đạo đức học AI, Lý thuyết thông tin lượng tử, Khoa học dữ liệu địa không gian..."
                  className={`w-full p-3 rounded-xl text-xs font-mono outline-none border transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-purple-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500'
                  }`}
                />
              </div>

              {/* QUICK SUGGESTION TAGS */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1.5">Gợi ý chủ đề nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Kinh tế tuần hoàn & ESG',
                    'Đạo đức học AI & Trách nhiệm giải trình',
                    'Lý thuyết trò chơi tiến hóa',
                    'Khoa học mạng lưới phức tạp',
                    'Tâm lý học hành vi tổ chức',
                    'Mô hình ngôn ngữ lớn & Prompt Engineering'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setSmartDisciplineInput(sug);
                        handleSmartGenerateDiscipline(sug);
                      }}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-purple-500/50'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {smartDisciplineError && (
                <div className="text-red-400 text-xs font-mono bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {smartDisciplineError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-mono cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Hủy
              </button>
              <button
                onClick={() => handleSmartGenerateDiscipline()}
                disabled={isAnalyzingDiscipline || !smartDisciplineInput.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-tech uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
              >
                {isAnalyzingDiscipline ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Phân Tích & Phân Nhóm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo & Thêm Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CREATION MODAL WITH LIVE SEMANTIC CLASSIFICATION */}
      {isAddingDiscipline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-tech uppercase tracking-wider">
                    Thêm Lĩnh Vực Học Thuật Mới (Tự Động Phân Nhóm)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Nhập thông tin lĩnh vực, hệ thống sẽ tự động phân tích ngữ nghĩa và gợi ý nhóm tương ứng.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingDiscipline(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE CLASSIFICATION BANNER */}
            {liveClassification && (
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
                theme === 'dark' ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-bold font-mono">Tự động phân nhóm: </span>
                    <span className="font-bold underline">{liveClassification.groupName}</span>
                    <span className="text-[10px] ml-1.5 opacity-75 font-mono">
                      (Độ tin cậy: {Math.round(liveClassification.confidence * 100)}%)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewDiscGroupId(liveClassification.groupId)}
                  className="px-2 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-bold font-mono hover:bg-indigo-500 cursor-pointer shrink-0"
                >
                  Áp dụng nhóm này
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Tên Lĩnh Vực (Tiếng Việt): *
                </label>
                <input
                  type="text"
                  value={newDiscName}
                  onChange={e => setNewDiscName(e.target.value)}
                  placeholder="VD: Kinh Tế Tuần Hoàn & ESG"
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Tên Tiếng Anh (English):
                </label>
                <input
                  type="text"
                  value={newDiscEnName}
                  onChange={e => setNewDiscEnName(e.target.value)}
                  placeholder="VD: Circular Economy & ESG Governance"
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Nhóm Học Thuật:
                </label>
                <select
                  value={newDiscGroupId || (liveClassification ? liveClassification.groupId : 'emerging_frontier')}
                  onChange={e => setNewDiscGroupId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl outline-none border font-mono ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {DISCIPLINE_GROUPS.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Icon Lucide:
                </label>
                <select
                  value={newDiscIcon}
                  onChange={e => setNewDiscIcon(e.target.value)}
                  className={`w-full p-2.5 rounded-xl outline-none border font-mono ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {['Atom', 'Brain', 'Cpu', 'Landmark', 'Network', 'TrendingUp', 'ShieldCheck', 'Activity', 'Compass', 'Eye', 'Users', 'Globe', 'Scale', 'Building2', 'Dna', 'Zap', 'Radio', 'Gauge', 'Wind', 'KeyRound', 'Boxes', 'Cloud', 'BookOpen', 'Sparkles'].map(ic => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Mô Tả Trọng Tâm Nhận Thức Luận: *
                </label>
                <textarea
                  rows={2}
                  value={newDiscDesc}
                  onChange={e => setNewDiscDesc(e.target.value)}
                  placeholder="Mô tả 1-2 câu về bản thể luận và giá trị cốt lõi của lĩnh vực này..."
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Lăng Kính Cốt Lõi (Phân tách bằng dấu phẩy):
                </label>
                <input
                  type="text"
                  value={newDiscLenses}
                  onChange={e => setNewDiscLenses(e.target.value)}
                  placeholder="VD: Đánh giá vòng đời (LCA), Tiêu chuẩn ISSB, Dấu chân carbon"
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Học Giả & Tác Gia Tiêu Biểu:
                </label>
                <input
                  type="text"
                  value={newDiscFigures}
                  onChange={e => setNewDiscFigures(e.target.value)}
                  placeholder="VD: Kate Raworth, Nicholas Stern, Elinor Ostrom"
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Ánh Xạ Tương Đương Sang Hệ Thống / Phần Mềm / AI:
                </label>
                <input
                  type="text"
                  value={newDiscAnalogy}
                  onChange={e => setNewDiscAnalogy(e.target.value)}
                  placeholder="VD: Tối ưu hóa tài nguyên phần cứng, Thu gom rác thải (GC) vòng lặp khép kín..."
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-mono font-bold mb-1 text-slate-300">
                  Phương Pháp Luận Nghiên Cứu:
                </label>
                <input
                  type="text"
                  value={newDiscMethodology}
                  onChange={e => setNewDiscMethodology(e.target.value)}
                  placeholder="VD: Mô hình hóa dòng luân chuyển vật chất và phân tích ma trận vào-ra (I-O Matrix)..."
                  className={`w-full p-2.5 rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddingDiscipline(false)}
                className={`px-4 py-2 rounded-xl text-xs font-mono cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCustomDiscipline}
                disabled={!newDiscName.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-tech uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Lưu & Thêm Lĩnh Vực
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// INDIVIDUAL DISCIPLINE CARD COMPONENT
interface DisciplineCardProps {
  discipline: DisciplineMetadata;
  theme: 'dark' | 'light';
  copiedId: string | null;
  onCopy: (disc: DisciplineMetadata) => void;
  onDelete?: (id: string) => void;
}

const DisciplineCard: React.FC<DisciplineCardProps> = ({
  discipline,
  theme,
  copiedId,
  onCopy,
  onDelete
}) => {
  const isCopied = copiedId === discipline.id;
  const isCustom = discipline.isCustom || discipline.id.startsWith('custom_');

  // Find matching group badge
  const matchedGroup = DISCIPLINE_GROUPS.find(g => g.id === discipline.groupId);

  return (
    <div
      id={`discipline-card-${discipline.id}`}
      className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-purple-500/40 group ${
        theme === 'dark'
          ? 'bg-slate-900/70 border-slate-800 text-slate-100 hover:bg-slate-900 shadow-sm'
          : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
      }`}
    >
      <div className="space-y-3">
        {/* CARD TOP BAR: ICON, TITLES, GROUP BADGE */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              theme === 'dark' ? discipline.bgDark : discipline.bgLight
            }`}>
              {getDisciplineIcon(discipline.icon, `w-4 h-4 ${discipline.color}`)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold font-tech tracking-wide text-slate-100 group-hover:text-purple-300 transition-colors">
                  {discipline.name}
                </h4>
                {isCustom && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Tuỳ biến
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-400 block leading-tight">
                {discipline.enName}
              </span>
            </div>
          </div>

          {/* GROUP BADGE */}
          {matchedGroup && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold whitespace-nowrap border shrink-0 ${matchedGroup.badgeBg} ${matchedGroup.color} ${matchedGroup.border}`}>
              {matchedGroup.name.split(',')[0]}
            </span>
          )}
        </div>

        {/* DESCRIPTION */}
        <p className={`text-xs leading-relaxed line-clamp-3 ${
          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {discipline.description}
        </p>

        {/* CORE LENSES PILLS */}
        {discipline.coreLenses && discipline.coreLenses.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>Lăng kính cốt lõi:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {discipline.coreLenses.map((lens, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-slate-950/80 text-slate-300 border-slate-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lens}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* KEY FIGURES */}
        {discipline.keyFigures && discipline.keyFigures.length > 0 && (
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pt-1">
            <BookOpen className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="text-slate-500">Học giả:</span>
            <span className="text-slate-300 font-medium truncate">
              {discipline.keyFigures.join(', ')}
            </span>
          </div>
        )}

        {/* CS SYSTEM ANALOGY */}
        {discipline.systemAnalogy && (
          <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-start gap-1.5 ${
            theme === 'dark'
              ? 'bg-slate-950/60 border-slate-800/80 text-purple-300/90'
              : 'bg-purple-50/60 border-purple-100 text-purple-900'
          }`}>
            <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              <strong className="text-purple-400">Ánh xạ CS:</strong> {discipline.systemAnalogy}
            </span>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/40 flex items-center justify-between gap-2">
        <button
          onClick={() => onCopy(discipline)}
          className={`text-[11px] font-mono font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            isCopied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : theme === 'dark'
                ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-purple-400" />
              <span>Sao Chép Lăng Kính</span>
            </>
          )}
        </button>

        {isCustom && onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`Bạn có chắc muốn xóa lĩnh vực "${discipline.name}"?`)) {
                onDelete(discipline.id);
              }
            }}
            title="Xóa lĩnh vực tùy biến này"
            className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
