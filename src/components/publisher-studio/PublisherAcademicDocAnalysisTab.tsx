import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Copy,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderPlus,
  BookMarked,
  Quote,
  Cpu,
  Brain,
  ExternalLink,
  Sliders,
  Check,
  Compass,
  X,
  Send,
  Eye,
  GraduationCap,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Atom,
  Landmark,
  TrendingUp,
  ShieldCheck,
  Activity,
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
  Target,
  Tag,
  Filter,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  ListOrdered
} from 'lucide-react';
import { safeFetchAIJson } from '../../utils/ai-client';
import { audioFx } from '../../utils/audioFx';
import { Dossier, GeminiSettings, DynamicPillar, LexiconTerm, CitationItem } from '../../types';
import {
  DisciplineMetadata,
  DisciplineGroup,
  DISCIPLINE_GROUPS,
  INTERDISCIPLINARY_DISCIPLINES
} from '../../data/interdisciplinaryDisciplines';

interface PublisherAcademicDocAnalysisTabProps {
  theme: 'dark' | 'light';
  geminiSettings: GeminiSettings;
  onSaveDossier: (d: Dossier) => Promise<void>;
  onSelectDossier: (id: string) => void;
  onClose: () => void;
  disciplines?: DisciplineMetadata[];
}

interface AcademicAnalysisResponse {
  success: boolean;
  dossier: Dossier;
  analyticalDiagnosis: {
    academicRigorScore: number;
    paradigmsShifted: string[];
    practicalApplicability: string;
    recommendedActionNext?: string;
  };
  modelUsed?: string;
  error?: string;
}

// Dynamic Safe Icon Resolver for Disciplines
const getDisciplineIcon = (iconName: string, className: string = 'w-4 h-4') => {
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
      return <Layers className={className} />;
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
    case 'target':
      return <Target className={className} />;
    default:
      return <Layers className={className} />;
  }
};

const SAMPLE_ACADEMIC_DOCS = [
  {
    title: 'Bản Thể Luận & Lý Thuyết Hệ Thống Thích Ứng Phức Tạp (Complex Adaptive Systems)',
    discipline: 'Bản Thể Luận & Nhận Thức Luận',
    interdisciplinary: ['Toán Học & Hệ Thống Phức Tạp', 'Khoa Học Máy Tính & AI Tự Trị', 'Đạo Đức Học & Khắc Kỷ'],
    content: `BẢN THẢO NGHIÊN CỨU: TÍNH NẢY SINH (EMERGENCE) VÀ NGUYÊN LÝ TỰ TỔ CHỨC TRONG CÁC HỆ THỐNG PHỨC TẠP

1. Tiên đề Khởi nguyên & Bản thể luận:
Mọi hệ thống phức tạp trong tự nhiên và xã hội (từ đàn chim di cư, hệ sinh thái rừng rậm đến thị trường tài chính và mạng lưới Multi-Agent) đều không được điều khiển bởi một bộ chỉ huy tập trung tối cao. Thay vào đó, trật tự vĩ mô và trí tuệ tập thể nảy sinh (emergent properties) từ sự tương tác phi tuyến tính giữa vô số tác tử cục bộ tuân theo các quy tắc đơn giản.

2. Động lực học & Cơ chế vận hành:
- Vòng phản hồi dương (Positive Feedback Loops): Khuếch đại các biến động nhỏ thành xu hướng quy mô lớn (hiệu ứng mạng, thác thông tin).
- Vòng phản hồi âm (Negative Feedback Loops): Thiết lập cân bằng động (homeostasis), triệt tiêu nhiễu loạn và duy trì độ ổn định sinh tồn.
- Điểm chuyển pha (Phase Transitions / Criticality): Trạng thái nằm giữa trật tự cứng nhắc và hỗn loạn vô biên (Edge of Chaos), nơi hệ thống đạt năng lực học tập và sáng tạo cao nhất.

3. Ánh xạ Kỹ nghệ CS & Multi-Agent Swarms:
- Nguyên lý phân tán hóa quyền lực: Thay thế kiến trúc Monolithic cổ điển bằng Swarm Intelligence. Mỗi agent có quyền tự chủ cục bộ nhưng chia sẻ giao thức đồng thuận (Consensus Protocol).
- Cơ chế tự chữa lành (Self-Healing Systems): Khi một số tác tử bị lỗi hoặc bị tấn công, toàn bộ mạng lưới tự điều phối lại tài nguyên để tiếp tục vận hành.

4. Biện chứng & Bẫy Failure Modes:
- Rủi ro sụp đổ dây chuyền (Cascading Failures): Khi sự phụ thuộc chéo quá dày đặc mà thiếu các vách ngăn giảm chấn (decoupling barriers).
- Bẫy tối ưu cục bộ (Local Sub-optimization Trap): Mỗi thành viên hành động có vẻ hợp lý cho riêng mình nhưng lại hủy hoại toàn bộ hệ sinh thái chung (Bi kịch của tài sản chung - Tragedy of the Commons).

5. Trục cân bằng Đạo đức Shinbashira & Sinh thái Vô vi:
Hệ thống muốn trường tồn phải có "cột trụ trung tâm tĩnh lặng" (Shinbashira) — đó là la bàn đạo đức kiên định, chuẩn mực liêm chính và sự hòa hợp với quy luật tự nhiên, không cưỡng ép nhân tạo.`
  },
  {
    title: 'Kinh Tế Sinh Thái Tuần Hoàn & Nông Nghiệp Tái Sinh (Circular Bioeconomy)',
    discipline: 'Kinh Tế Thể Chế Mới',
    interdisciplinary: ['Kinh Tế Học', 'Sinh Thái Học & Môi Trường', 'Xã Hội Học & Mạng Lưới', 'Đạo Đức Học & Khắc Kỷ'],
    content: `NGHIÊN CỨU KHẢO LUẬN: CHUYỂN DỊCH TỪ KINH TẾ TUYẾN TÍNH SANG KINH TẾ SINH THÁI TUẦN HOÀN TÁI SINH

1. Khủng hoảng của Mô hình Tuyến tính (Take - Make - Waste):
Nền kinh tế công nghiệp thế kỷ 20 vận hành theo dòng chảy một chiều: Khai thác tài nguyên tự nhiên -> Sản xuất hàng loạt -> Tiêu dùng ngắn hạn -> Thải bỏ ra bãi rác. Mô hình này làm suy kiệt độ phì nhiêu của đất, đứt gãy chu trình dinh dưỡng và tạo ra lượng phát thải khổng lồ.

2. Cơ chế Tuần hoàn Sinh học (Biological Nutrient Loops):
- Nguyên lý "Rác thải của sinh vật này là thức ăn của sinh vật khác" (Zero Waste in Nature).
- Canh tác tái sinh (Regenerative Agriculture): Nuôi dưỡng vi sinh vật bản địa, giữ ẩm tự nhiên, xen canh đa tầng và tích tụ carbon hữu cơ trong đất.
- Chuỗi giá trị khép kín: Tận dụng phụ phẩm nông nghiệp (vỏ trấu, rơm rạ, bã thảo dược) làm phân bón hữu cơ vi sinh hoặc vật liệu sinh học phân hủy tự nhiên.

3. Kỹ nghệ Thực thi & Mô hình Doanh nghiệp Xã hội:
- Chuỗi cung ứng ngắn (Short Supply Chains): Kết nối trực tiếp nông hộ sản xuất với mạng lưới người tiêu dùng đô thị, giảm thiểu hao hụt logistics và trung gian thương mại.
- Minh bạch hóa nguồn gốc bằng công nghệ số (Digital Product Passports): Giúp người tiêu dùng thấy rõ toàn bộ hành trình sinh thái của sản phẩm.

4. Biện chứng Phản biện & Thách thức Chuyển đổi:
- Áp lực lợi nhuận ngắn hạn đối đầu với thời gian phục hồi sinh thái tự nhiên (3-5 năm cải tạo đất).
- Rào cản thói quen tiện lợi của bao bì nhựa dùng một lần.

5. Triết lý Đất Trời & Thuận Thiên:
Kinh tế tuần hoàn đích thực không đơn thuần là kỹ thuật xử lý rác, mà là sự trở về với đạo lý hòa hợp đất trời — tôn trọng nhịp điệu sinh học của vũ trụ.`
  },
  {
    title: 'Kiến Trúc Multi-Agent Swarms & Trí Tuệ Tập Thể Tự Trị (Decentralized Agent Swarms)',
    discipline: 'Khoa Học Máy Tính & AI Tự Trị',
    interdisciplinary: ['Lý Thuyết Trò Chơi', 'Khoa Học Mạng Lưới & Đồ Thị', 'Đạo Đức Học & Khắc Kỷ'],
    content: `BÁO CÁO KỸ THUẬT: THIẾT KẾ KIẾN TRÚC MULTI-AGENT SWARMS TỰ ĐỘNG HÓA VẬN HÀNH DOANH NGHIỆP

1. Khái niệm & Bản chất Kiến trúc:
Chuyển đổi từ mô hình LLM đơn lẻ (Monolithic Single-Prompt) sang mạng lưới tác tử chuyên biệt hóa (Multi-Agent Swarm). Trong đó:
- Orchestrator Agent: Tiếp nhận mục tiêu vĩ mô, phân rã bài toán thành đồ thị nhiệm vụ (DAG - Directed Acyclic Graph).
- Worker Agents: Thực thi độc lập các tác vụ chuyên sâu (Phân tích dữ liệu, Viết mã, Thẩm định rủi ro, Soạn thảo văn bản).
- Critic / Auditor Agent: Đóng vai trò phản biện, kiểm toán chéo đầu ra trước khi công bố.

2. Cơ chế Giao thức & Đồng thuận:
- Message Passing Bus: Truyền tải ngữ cảnh và trạng thái công việc phi tập trung.
- Memory Layer: Bộ nhớ ngắn hạn (Working Context Window) và bộ nhớ dài hạn (Vector Knowledge Graph).

3. Quản trị Rủi ro & Failure Modes:
- Hiện tượng ảo giác lây lan (Hallucination Cascades): Khi một agent đưa ra giả định sai và các agent tiếp theo khuếch đại sai sót đó.
- Điểm nghẽn vòng lặp vô tận (Infinite Reasoning Loops): Cơ chế ngắt mạch tự động (Circuit Breaker) và giới hạn ngân sách token/thời gian.

4. Đạo đức Shinbashira & Kiểm soát Con người trong Vòng lặp (Human-in-the-Loop):
AI Swarms tự động hóa tối đa nhưng con người luôn giữ quyền quyết định đạo đức tối thượng.`
  }
];

export const PublisherAcademicDocAnalysisTab: React.FC<PublisherAcademicDocAnalysisTabProps> = ({
  theme,
  geminiSettings,
  onSaveDossier,
  onSelectDossier,
  onClose,
  disciplines = []
}) => {
  // Available catalog of 38+ disciplines
  const allDisciplines = useMemo(() => {
    if (disciplines && disciplines.length > 0) {
      return disciplines;
    }
    return INTERDISCIPLINARY_DISCIPLINES;
  }, [disciplines]);

  // Input form states
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  
  // Discipline Selection States
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('Bản Thể Luận & Nhận Thức Luận');
  const [isDisciplineSelectorOpen, setIsDisciplineSelectorOpen] = useState(false);
  const [disciplineSearch, setDisciplineSearch] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isCustomDisciplineMode, setIsCustomDisciplineMode] = useState(false);
  const [customDisciplineInput, setCustomDisciplineInput] = useState('');

  // Interdisciplinary multi-select states
  const [selectedInterdisciplinary, setSelectedInterdisciplinary] = useState<string[]>([
    'Toán Học & Hệ Thống Phức Tạp',
    'Khoa Học Máy Tính & AI Tự Trị',
    'Đạo Đức Học & Khắc Kỷ'
  ]);
  const [isInterdisciplinaryDropdownOpen, setIsInterdisciplinaryDropdownOpen] = useState(false);
  const [interdisciplinarySearch, setInterdisciplinarySearch] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  const [depthLevel, setDepthLevel] = useState<'foundational' | 'advanced' | 'dissertation' | 'grand_synthesis'>('dissertation');
  const [chaptersPerPillar, setChaptersPerPillar] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(audioFx.isEnabled());
  const [strategicFocus, setStrategicFocus] = useState('');

  // Unmount cleanup: ensure waiting radar stops
  useEffect(() => {
    return () => {
      audioFx.stopWaitingRadar();
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    audioFx.setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      audioFx.playAITrigger();
    }
  };

  // File upload states
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileData, setUploadedFileData] = useState('');
  const [uploadedFileMime, setUploadedFileMime] = useState('');

  // Analysis & Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AcademicAnalysisResponse | null>(null);

  // Result view tabs: 'pillars' | 'lexicon' | 'citations' | 'mappings' | 'markdown'
  const [activeResultTab, setActiveResultTab] = useState<'pillars' | 'lexicon' | 'citations' | 'mappings' | 'markdown'>('pillars');
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find active selected discipline metadata object
  const activeDisciplineObj = useMemo(() => {
    return allDisciplines.find(
      d =>
        d.name.toLowerCase() === selectedDiscipline.toLowerCase() ||
        d.id.toLowerCase() === selectedDiscipline.toLowerCase() ||
        (d.enName && d.enName.toLowerCase() === selectedDiscipline.toLowerCase())
    );
  }, [allDisciplines, selectedDiscipline]);

  // Filtered disciplines for target selection
  const filteredTargetDisciplines = useMemo(() => {
    return allDisciplines.filter(d => {
      const matchesGroup =
        selectedGroupFilter === 'all' || d.groupId === selectedGroupFilter;
      const q = disciplineSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.enName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.coreLenses || []).some(l => l.toLowerCase().includes(q)) ||
        (d.keyFigures || []).some(f => f.toLowerCase().includes(q));
      return matchesGroup && matchesSearch;
    });
  }, [allDisciplines, selectedGroupFilter, disciplineSearch]);

  // Smart suggestions for interdisciplinary fields
  const suggestedDisciplines = useMemo(() => {
    return allDisciplines
      .filter(
        d =>
          d.name !== selectedDiscipline &&
          !selectedInterdisciplinary.includes(d.name)
      )
      .slice(0, 6);
  }, [allDisciplines, selectedDiscipline, selectedInterdisciplinary]);

  const toggleInterdisciplinary = (name: string) => {
    if (selectedInterdisciplinary.includes(name)) {
      setSelectedInterdisciplinary(prev => prev.filter(item => item !== name));
    } else {
      setSelectedInterdisciplinary(prev => [...prev, name]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedInterdisciplinary.includes(trimmed)) {
      setSelectedInterdisciplinary(prev => [...prev, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('Tệp quá lớn, vui lòng chọn tài liệu dưới 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      setUploadedFileData(dataUrl);
      setUploadedFileMime(file.type || 'application/octet-stream');
      setUploadedFileName(file.name);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFileName('');
    setUploadedFileData('');
    setUploadedFileMime('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSample = (sample: (typeof SAMPLE_ACADEMIC_DOCS)[0]) => {
    setDocTitle(sample.title);
    setDocContent(sample.content);
    setSelectedDiscipline(sample.discipline);
    setIsCustomDisciplineMode(false);
    setSelectedInterdisciplinary(sample.interdisciplinary);
    setStrategicFocus(`Phân tích tài liệu học thuật theo định hướng liên ngành ${sample.discipline}, chuyển hóa tri thức sang 6 Trụ Cột Động thực chiến.`);
    removeFile();
    setError('');
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadMarkdown = (dossier: Dossier) => {
    const fullMarkdown = `# ${dossier.title}
*${dossier.subtitle}*

**Lĩnh vực**: ${dossier.discipline} | **Cấp độ**: ${dossier.depthLevel || 'Chuyên sâu'}
**Ngày tạo**: ${new Date(dossier.lastModified).toLocaleDateString('vi-VN')}

---

## TÓM TẮT KHẢO LUẬN (ABSTRACT)
${dossier.abstract}

---

## CÁC ĐỘT PHÁ & PHÁT HIỆN TRỌNG TÂM
${(dossier.keyFindings || []).map(f => `- ${f}`).join('\n')}

---

${(dossier.projectStructure || [])
  .map(
    p => `## ${p.title}
*${p.description}*

${(p.chapters || [])
  .map(
    c => `### ${c.title}
${c.subtitle ? `*${c.subtitle}*\n` : ''}
${c.contentMarkdown || ''}`
  )
  .join('\n\n')}
`
  )
  .join('\n---\n\n')}

---

## SỔ TỪ ĐIỂN THUẬT NGỮ CHUYÊN SÂU
${(dossier.autoCapturedTerms || [])
  .map(
    t => `### ${t.term} (${t.enTerm || ''})
- **Lĩnh vực**: ${t.sourceDiscipline || t.category}
- **Giải thích đời thường**: ${t.deepExplanation}
- **Ánh xạ CS / Multi-Agent**: ${t.csEquivalent || 'N/A'}
- **Ứng dụng thực chiến**: ${t.applicationInAgents}
`
  )
  .join('\n')}

---

## DANH MỤC TRÍCH DẪN & TÀI LIỆU THAM KHẢO
${(dossier.citations || [])
  .map(c => `- **${c.author}** (${c.year}): *${c.title}*. ${c.source}. ${c.keyQuote ? `> "${c.keyQuote}"` : ''}`)
  .join('\n')}

---
*Khảo luận được xuất bản từ Oneness Governance Publisher Studio - Deep Research & Knowledge Transforming.*
`;

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dossier.id}-academic-dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartAnalysis = async () => {
    if (!docContent.trim() && !uploadedFileData) {
      setError('Vui lòng nhập văn bản học thuật hoặc tải lên tệp tài liệu để phân tích.');
      return;
    }

    const effectiveDiscipline = isCustomDisciplineMode
      ? customDisciplineInput.trim() || 'Triết Học & Khoa Học Hệ Thống'
      : selectedDiscipline.trim();

    if (!effectiveDiscipline) {
      setError('Vui lòng chọn lĩnh vực học thuật mục tiêu.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    setSaveSuccess(false);

    // Audio effects: trigger tone and continuous relaxing waiting radar ("tút... tút... tút...")
    audioFx.playAITrigger();
    audioFx.startWaitingRadar(1300);

    try {
      setAnalysisStep('Đang tiếp nhận và phân tích 4 Cấp Độ Phân Tầng Học Thuật...');
      
      const payload = {
        academicContent: docContent,
        fileData: uploadedFileData || undefined,
        fileMimeType: uploadedFileMime || undefined,
        documentTitle: docTitle.trim(),
        targetDiscipline: effectiveDiscipline,
        interdisciplinaryFields: selectedInterdisciplinary,
        depthLevel,
        chaptersPerPillar,
        strategicFocus: strategicFocus.trim(),
        model: geminiSettings?.model || 'gemini-3.7-pro'
      };

      const res = await safeFetchAIJson<AcademicAnalysisResponse>('/api/gemini/analyze-academic-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.data || !res.data.success || !res.data.dossier) {
        throw new Error(res.error || (res.data && res.data.error) || 'Không thể hoàn tất phân tích tài liệu học thuật.');
      }

      setAnalysisResult(res.data);
      setActiveResultTab('pillars');
      setActivePillarIndex(0);

      // Stop radar and play celebratory grand completion chime
      audioFx.stopWaitingRadar();
      audioFx.playGrandCompletionChime();
    } catch (err: any) {
      audioFx.stopWaitingRadar();
      audioFx.playGentleNotice();
      console.error('Error analyzing academic document:', err);
      setError(err.message || 'Lỗi xử lý tài liệu học thuật. Vui lòng thử lại.');
    } finally {
      audioFx.stopWaitingRadar();
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleSaveToDossierStore = async () => {
    if (!analysisResult?.dossier) return;
    setIsSaving(true);
    try {
      await onSaveDossier(analysisResult.dossier);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving generated academic dossier:', err);
      setError('Lỗi khi lưu hồ sơ vào hệ thống: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDossier = () => {
    if (!analysisResult?.dossier) return;
    onSelectDossier(analysisResult.dossier.id);
    onClose();
  };

  const dossier = analysisResult?.dossier;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PHILOSOPHY BANNER */}
      <div
        className={`p-5 md:p-6 rounded-3xl border transition-all shadow-xl backdrop-blur-md ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-purple-950/70 border-indigo-500/30 shadow-indigo-950/40 text-slate-100'
            : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200 shadow-indigo-100 text-slate-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Deep Research & Knowledge Transforming</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-medium font-mono">
                Bản Giao Ước 6 Trụ Cột Động
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-display-title font-bold tracking-tight">
              Phân Tích Tài Liệu Học Thuật & Chuyển Hóa Thành Hồ Sơ Nghiên Cứu
            </h3>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Tiếp nhận các bài báo khoa học, luận văn, sách kinh điển hoặc trích đoạn học thuật phức tạp &rarr; Tự động giải mã qua <strong>4 Cấp độ phân tầng học thuật</strong> và chuyển hóa sang <strong>ngôn ngữ đời thường, thực chiến</strong> trong cấu trúc <strong>6 Trụ Cột Động</strong> chuẩn mực.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
            {/* Sound Effects Toggle Button */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Tắt âm thanh hiệu ứng AI' : 'Bật âm thanh hiệu ứng AI (tút... tút...)'}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Âm Thanh: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Âm Thanh: Tắt</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setDocTitle('');
                setDocContent('');
                removeFile();
                setAnalysisResult(null);
                setError('');
              }}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INPUT WORKSPACE OR ACTIVE RESULT */}
      {!analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: SOURCE MATERIAL INPUT & FILE UPLOAD (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
                theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>1. Nạp Tài Liệu Học Thuật Nguồn</span>
                </h4>
                <span className="text-[11px] text-slate-400">PDF, DOCX, TXT, MD hoặc Dán văn bản</span>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Tiêu Đề Tài Liệu / Đề Tài Nghiên Cứu:
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Ví dụ: Bản Thể Luận & Lý Thuyết Hệ Thống Phức Tạp Trong Quản Trị Multi-Agent..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* File Upload Box */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt,.md,.json"
                  className="hidden"
                />

                {!uploadedFileName ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      theme === 'dark'
                        ? 'border-slate-800 hover:border-indigo-500/60 bg-slate-950/50 hover:bg-slate-950'
                        : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30'
                    }`}
                  >
                    <UploadCloud className="w-7 h-7 text-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Bấm để tải tệp tài liệu nghiên cứu (PDF, DOCX, TXT, MD)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Dung lượng tối đa 25MB • Trích xuất tự động văn bản & sơ đồ
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-xs text-indigo-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold truncate">{uploadedFileName}</span>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-1 hover:bg-indigo-900/50 rounded-lg text-indigo-300 hover:text-white cursor-pointer"
                      title="Gỡ tệp"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Raw Text Content Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Hoặc Dán Nội Dung Bài Báo / Khảo Luận / Trích Đoạn:
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {docContent.length.toLocaleString()} ký tự • ~{docContent.split(/\s+/).filter(Boolean).length} từ
                  </span>
                </div>
                <textarea
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  rows={9}
                  placeholder="Dán nội dung nghiên cứu, các luận điểm chính, đoạn trích sách, công thức, khảo sát hoặc bản thảo học thuật vào đây..."
                  className={`w-full p-3.5 rounded-xl text-xs font-mono leading-relaxed border focus:outline-none transition-all resize-y ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Quick Samples Section */}
            <div
              className={`p-4 rounded-3xl border shadow-md space-y-3 ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <BookMarked className="w-4 h-4 text-amber-400" />
                <span>Nạp Mẫu Tài Liệu Học Thuật Kinh Điển (1-Click Sample):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {SAMPLE_ACADEMIC_DOCS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSample(sample)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      docTitle === sample.title
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-md'
                        : theme === 'dark'
                        ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        {sample.discipline}
                      </div>
                      <div className="text-xs font-semibold line-clamp-2">{sample.title}</div>
                    </div>
                    <div className="text-[10px] text-slate-500">Bấm để nạp mẫu ↗</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONFIGURATION, DISCIPLINE & TRIGGER (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`p-5 rounded-3xl border shadow-lg space-y-4 ${
                theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>2. Cấu Hình & Định Hướng Chuyển Hóa Tri Thức</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full font-mono">
                  38 Lĩnh Vực Học Thuật
                </span>
              </div>

              {/* 1. PRIMARY TARGET DISCIPLINE SELECTOR (38 CATALOG MENU) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lĩnh Vực Học Thuật Mục Tiêu:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDisciplineMode(!isCustomDisciplineMode);
                      setIsDisciplineSelectorOpen(false);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    {isCustomDisciplineMode ? '← Chọn từ 38 Lĩnh Vực' : '+ Nhập tùy biến'}
                  </button>
                </div>

                {!isCustomDisciplineMode ? (
                  <div className="space-y-2">
                    {/* Active Selected Card Preview & Trigger */}
                    <div
                      onClick={() => setIsDisciplineSelectorOpen(!isDisciplineSelectorOpen)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 shadow-md ${
                        theme === 'dark'
                          ? 'bg-slate-950/90 hover:bg-slate-900/90 border-indigo-500/40 hover:border-indigo-500'
                          : 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`p-2.5 rounded-xl border shrink-0 ${
                            activeDisciplineObj?.bgDark || 'bg-indigo-950/70 text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          {getDisciplineIcon(activeDisciplineObj?.icon || 'Layers', 'w-5 h-5')}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">
                              {activeDisciplineObj?.name || selectedDiscipline || 'Chọn lĩnh vực học thuật...'}
                            </span>
                            {activeDisciplineObj?.groupName && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono truncate max-w-[140px]">
                                {activeDisciplineObj.groupName}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {activeDisciplineObj?.enName || '38 Lĩnh vực liên ngành có sẵn'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-indigo-400">
                        <span className="text-[11px] font-medium hidden sm:inline">Thay đổi</span>
                        {isDisciplineSelectorOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* System Analogy Tag if available */}
                    {activeDisciplineObj?.systemAnalogy && !isDisciplineSelectorOpen && (
                      <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[10px] text-slate-400 flex items-start gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          <strong className="text-purple-300">Ánh xạ CS / Multi-Agent:</strong>{' '}
                          {activeDisciplineObj.systemAnalogy}
                        </span>
                      </div>
                    )}

                    {/* EXPANDABLE 38 DISCIPLINES DROPDOWN / SELECTOR */}
                    {isDisciplineSelectorOpen && (
                      <div className="p-3.5 bg-slate-950 border border-indigo-500/40 rounded-2xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                        {/* Search in 38 disciplines */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={disciplineSearch}
                            onChange={e => setDisciplineSearch(e.target.value)}
                            placeholder="Tìm trong 38 lĩnh vực (Tên, tiếng Anh, triết gia, lăng kính)..."
                            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          {disciplineSearch && (
                            <button
                              onClick={() => setDisciplineSearch('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Group Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
                          <button
                            type="button"
                            onClick={() => setSelectedGroupFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                              selectedGroupFilter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Tất cả ({allDisciplines.length})
                          </button>
                          {DISCIPLINE_GROUPS.map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setSelectedGroupFilter(g.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedGroupFilter === g.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {g.name.split(',')[0]}
                            </button>
                          ))}
                        </div>

                        {/* Disciplines Scrollable List */}
                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {filteredTargetDisciplines.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">
                              Không tìm thấy lĩnh vực học thuật phù hợp với từ khóa.
                            </div>
                          ) : (
                            filteredTargetDisciplines.map(d => {
                              const isSelected =
                                selectedDiscipline === d.name ||
                                selectedDiscipline === d.id;
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDiscipline(d.name);
                                    setIsDisciplineSelectorOpen(false);
                                    setDisciplineSearch('');
                                  }}
                                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 overflow-hidden">
                                    <div
                                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                        d.bgDark || 'bg-slate-800 text-indigo-400'
                                      }`}
                                    >
                                      {getDisciplineIcon(d.icon, 'w-3.5 h-3.5')}
                                    </div>
                                    <div className="space-y-0.5 overflow-hidden">
                                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                        <span>{d.name}</span>
                                        {isSelected && (
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono truncate">
                                        {d.enName}
                                      </div>
                                      <div className="text-[10px] text-slate-400 line-clamp-1">
                                        {d.description}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={customDisciplineInput}
                      onChange={e => setCustomDisciplineInput(e.target.value)}
                      placeholder="Nhập tên lĩnh vực tùy biến: ví dụ: Kinh Tế Sinh Thái & Nông Nghiệp Tái Sinh..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-600'
                          : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* 2. INTERDISCIPLINARY FIELDS (MULTI-SELECT FROM 38 CATALOG) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Lĩnh Vực Phối Hợp Liên Ngành ({selectedInterdisciplinary.length}):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsInterdisciplinaryDropdownOpen(!isInterdisciplinaryDropdownOpen)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>+ Chọn thêm từ 38 ngành</span>
                    {isInterdisciplinaryDropdownOpen ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Selected Interdisciplinary Tag Cloud */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedInterdisciplinary.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 rounded-xl text-[11px] font-medium flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => toggleInterdisciplinary(tag)}
                        className="p-0.5 hover:bg-indigo-900 rounded-full text-indigo-300 hover:text-white cursor-pointer"
                        title="Gỡ bỏ"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {selectedInterdisciplinary.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">
                      Chưa chọn ngành liên hệ (bấm bên dưới để chọn).
                    </span>
                  )}
                </div>

                {/* Smart Suggested Chips for 1-Click Addition */}
                {suggestedDisciplines.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Gợi ý phối hợp hàng đầu (1-Click Add):</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {suggestedDisciplines.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleInterdisciplinary(d.name)}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-200 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{d.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable Multi-Select List from 38 Disciplines */}
                {isInterdisciplinaryDropdownOpen && (
                  <div className="p-3.5 bg-slate-950 border border-purple-500/40 rounded-2xl shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={interdisciplinarySearch}
                        onChange={e => setInterdisciplinarySearch(e.target.value)}
                        placeholder="Tìm ngành liên hệ trong 38 lĩnh vực..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {allDisciplines
                        .filter(d => {
                          const q = interdisciplinarySearch.toLowerCase().trim();
                          return (
                            !q ||
                            d.name.toLowerCase().includes(q) ||
                            d.enName.toLowerCase().includes(q)
                          );
                        })
                        .map(d => {
                          const isChecked = selectedInterdisciplinary.includes(d.name);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleInterdisciplinary(d.name)}
                              className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isChecked
                                  ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {getDisciplineIcon(d.icon, 'w-3.5 h-3.5 text-purple-400 shrink-0')}
                                <span className="text-xs font-semibold truncate">{d.name}</span>
                              </div>
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                  isChecked
                                    ? 'bg-purple-600 border-purple-500 text-white'
                                    : 'border-slate-700'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    {/* Custom Tag Input */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={e => setCustomTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTag();
                          }
                        }}
                        placeholder="Hoặc thêm nhãn ngành khác..."
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Academic Depth Level & Chapters Per Pillar Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cấp Độ Phân Tích & Độ Sâu Khảo Luận</span>
                  </label>
                  <span className="text-[11px] font-mono text-indigo-400 font-semibold px-2 py-0.5 bg-indigo-950/80 border border-indigo-800/60 rounded-full">
                    Trụ Cột Thích Ứng x {chaptersPerPillar} Chương
                  </span>
                </div>

                {/* 4 Depth Level Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'foundational',
                      label: 'Tóm Lược Thực Chiến',
                      subLabel: 'Executive Brief',
                      chapters: 2,
                      badge: '2 Chương / Trụ',
                      desc: 'Súc tích, cô đọng mô hình vận hành và quyết sách tức thì.'
                    },
                    {
                      id: 'advanced',
                      label: 'Khảo Luận Chuyên Khảo',
                      subLabel: 'Applied Monograph',
                      chapters: 3,
                      badge: '3 Chương / Trụ',
                      desc: 'Đào sâu động lực học, bản vẽ kiến trúc & case study.'
                    },
                    {
                      id: 'dissertation',
                      label: 'Luận Án Học Thuật',
                      subLabel: 'Interdisciplinary Thesis',
                      chapters: 3,
                      badge: '3 Chương (Chuẩn)',
                      desc: 'Toàn diện 4 cấp độ phân tầng, liên kết CS & triết học.'
                    },
                    {
                      id: 'grand_synthesis',
                      label: 'Đại Tổng Hợp Bách Khoa',
                      subLabel: 'Grand Treatise',
                      chapters: 4,
                      badge: '4 Chương (Toàn Diện)',
                      desc: 'Độ sâu tối đa, khảo cứu đa chiều từng mắt xích hệ thống.'
                    }
                  ].map(lvl => {
                    const isSelected = depthLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setDepthLevel(lvl.id as any);
                          setChaptersPerPillar(lvl.chapters);
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-900/90 to-purple-900/90 border-indigo-400 text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-400/50'
                            : theme === 'dark'
                            ? 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs truncate">{lvl.label}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 ${
                              isSelected
                                ? 'bg-indigo-500/40 text-amber-300 border border-indigo-400/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {lvl.badge}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed line-clamp-2 ${
                            isSelected ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {lvl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-selector: Specific Chapters Per Pillar */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Số Chương Khảo Luận Cho Mỗi Trụ Cột:</span>
                    </span>
                    <span className="text-[11px] text-amber-300/90 font-medium">
                      {chaptersPerPillar === 2 && '2 Chương / Trụ (Khảo luận tinh gọn)'}
                      {chaptersPerPillar === 3 && '3 Chương / Trụ (Tiêu chuẩn học thuật sâu)'}
                      {chaptersPerPillar === 4 && '4 Chương / Trụ (Đại công trình hoàn chỉnh)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        count: 2,
                        title: '2 Chương / Trụ',
                        sub: 'Khảo luận tinh gọn',
                        hint: 'Súc tích, thực chiến'
                      },
                      {
                        count: 3,
                        title: '3 Chương / Trụ',
                        sub: 'Chuẩn mực học thuật',
                        hint: 'Độ sâu chuẩn mực'
                      },
                      {
                        count: 4,
                        title: '4 Chương / Trụ',
                        sub: 'Bách khoa toàn diện',
                        hint: 'Bách khoa toàn diện'
                      }
                    ].map(item => {
                      const isChosen = chaptersPerPillar === item.count;
                      return (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setChaptersPerPillar(item.count)}
                          className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isChosen
                              ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-md shadow-indigo-950'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.title}</div>
                          <div className="text-[10px] opacity-80 font-mono mt-0.5">{item.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Strategic focus prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Định Hướng Trọng Tâm Nghiên Cứu (Tùy chọn):
                </label>
                <textarea
                  value={strategicFocus}
                  onChange={e => setStrategicFocus(e.target.value)}
                  rows={3}
                  placeholder="Gợi ý: Tập trung bóc tách mô hình toán học và ánh xạ sang Multi-Agent Swarms, nhấn mạnh tính tự thích ứng và quản trị rủi ro..."
                  className={`w-full p-3 rounded-xl text-xs font-medium border focus:outline-none transition-all resize-none ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-600'
                      : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Execution Action Button */}
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || (!docContent.trim() && !uploadedFileData)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{analysisStep || 'Đang Phân Tích & Chuyển Hóa Tri Thức...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Phân Tích & Tạo Hồ Sơ Khảo Luận Thích Ứng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. GENERATED ACADEMIC DOSSIER RESULT VIEW */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Actions & Summary Banner */}
          <div
            className={`p-5 md:p-6 rounded-3xl border shadow-xl ${
              theme === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{dossier?.discipline}</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium font-mono">
                    Điểm Học Thuật: {analysisResult.analyticalDiagnosis?.academicRigorScore || 90}/100
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold">
                    {(dossier?.projectStructure || []).length} Trụ Cột Động Sẵn Sàng
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                  {dossier?.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-400">{dossier?.subtitle}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
                <button
                  onClick={handleSaveToDossierStore}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                    saveSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã Lưu Vào Kho Hồ Sơ!</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>{isSaving ? 'Đang Lưu...' : 'Tạo & Lưu Vào Kho Hồ Sơ'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenDossier}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
                  title="Mở hồ sơ để đọc và nghiên cứu trong không gian khảo luận chính"
                >
                  <Eye className="w-4 h-4" />
                  <span>Mở Xem Khảo Luận</span>
                </button>

                {dossier && (
                  <button
                    onClick={() => handleDownloadMarkdown(dossier)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    title="Tải tệp Markdown chuẩn NotebookLM"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Tải .md</span>
                  </button>
                )}

                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  Phân Tích Đề Tài Khác
                </button>
              </div>
            </div>

            {/* Quick Diagnostic Callouts */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Chuyển Dịch Tư Duy:
                </span>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {analysisResult.analyticalDiagnosis?.paradigmsShifted?.[0] ||
                    'Chuyển hóa tri thức hàn lâm sang phương pháp luận thực chiến.'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Ứng Dụng Thực Tiễn:
                </span>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {analysisResult.analyticalDiagnosis?.practicalApplicability ||
                    'Sẵn sàng nạp vào quy trình nghiên cứu và tự động hóa vận hành.'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Khuyến Nghị Hành Động:
                </span>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {analysisResult.analyticalDiagnosis?.recommendedActionNext ||
                    'Lưu hồ sơ và chia sẻ kịch bản nghiên cứu cho đội ngũ liên ngành.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveResultTab('pillars')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeResultTab === 'pillars'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Trụ Cột Thích Ứng & Khảo Luận</span>
            </button>

            <button
              onClick={() => setActiveResultTab('lexicon')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeResultTab === 'lexicon'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookMarked className="w-4 h-4 text-amber-400" />
              <span>Sổ Từ Điển Thuật Ngữ ({(dossier?.autoCapturedTerms || []).length})</span>
            </button>

            <button
              onClick={() => setActiveResultTab('citations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeResultTab === 'citations'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Quote className="w-4 h-4 text-emerald-400" />
              <span>Trích Dẫn & Kinh Điển ({(dossier?.citations || []).length})</span>
            </button>

            <button
              onClick={() => setActiveResultTab('mappings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeResultTab === 'mappings'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Ánh Xạ Kỹ Nghệ & Triết Học</span>
            </button>
          </div>

          {/* TAB 1: DYNAMIC ADAPTIVE PILLARS & ESSAYS */}
          {activeResultTab === 'pillars' && dossier && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Pillar Selector (4 cols) */}
              <div className="lg:col-span-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Danh Sách Trụ Cột Thích Ứng ({(dossier.projectStructure || []).length} Trụ Cột)
                </div>
                {(dossier.projectStructure || []).map((pillar, pIdx) => {
                  const isSelected = activePillarIndex === pIdx;
                  return (
                    <button
                      key={pillar.id || pIdx}
                      onClick={() => setActivePillarIndex(pIdx)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                          Trụ cột {pIdx + 1}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {pillar.chapters?.length || 2} chương
                        </span>
                      </div>
                      <div className="text-xs font-bold line-clamp-1">{pillar.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2">{pillar.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Pillar Full Content & Chapters (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {dossier.projectStructure?.[activePillarIndex] ? (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
                    <div className="border-b border-slate-800 pb-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-mono font-bold">
                          Trụ Cột {activePillarIndex + 1} / {(dossier.projectStructure || []).length}
                        </span>
                        <span className="text-xs text-slate-400">
                          {dossier.projectStructure[activePillarIndex].conceptualType}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white font-serif">
                        {dossier.projectStructure[activePillarIndex].title}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {dossier.projectStructure[activePillarIndex].description}
                      </p>
                    </div>

                    {/* Chapters List */}
                    <div className="space-y-6">
                      {(dossier.projectStructure[activePillarIndex].chapters || []).map((chap, cIdx) => (
                        <div key={chap.id || cIdx} className="space-y-3 bg-slate-950/70 p-4 md:p-5 rounded-2xl border border-slate-800/80">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <h5 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                              <span>{chap.title}</span>
                            </h5>
                            <button
                              onClick={() => handleCopy(chap.contentMarkdown || '', `chap_${cIdx}`)}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `chap_${cIdx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Đã Chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Sao Chép</span>
                                </>
                              )}
                            </button>
                          </div>
                          {chap.subtitle && (
                            <p className="text-xs text-slate-400 italic">{chap.subtitle}</p>
                          )}
                          <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                            {chap.contentMarkdown}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Chọn một trụ cột để xem toàn văn khảo luận.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LEXICON HUB INTEGRATION */}
          {activeResultTab === 'lexicon' && dossier && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-amber-400" />
                  <span>Sổ Từ Điển Thuật Ngữ Trích Xuất ({(dossier.autoCapturedTerms || []).length} thuật ngữ)</span>
                </h4>
                <span className="text-xs text-slate-400">
                  Đã chuẩn hóa ngôn ngữ đời thường & ánh xạ Multi-Agent
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(dossier.autoCapturedTerms || []).map((term, idx) => (
                  <div
                    key={term.id || idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div>
                        <h5 className="text-sm font-bold text-amber-300">{term.term}</h5>
                        {term.enTerm && (
                          <div className="text-[11px] text-slate-400 font-mono">{term.enTerm}</div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-medium">
                        {term.category || 'Học Thuật'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-400">Giải thích đời thường:</span>
                        <p className="text-slate-200 mt-0.5 leading-relaxed">{term.deepExplanation}</p>
                      </div>

                      {term.csEquivalent && (
                        <div>
                          <span className="font-semibold text-indigo-400">Ánh xạ CS / Multi-Agent:</span>
                          <p className="text-slate-300 font-mono text-[11px] mt-0.5">{term.csEquivalent}</p>
                        </div>
                      )}

                      {term.applicationInAgents && (
                        <div>
                          <span className="font-semibold text-emerald-400">Ứng dụng thực chiến:</span>
                          <p className="text-slate-300 mt-0.5">{term.applicationInAgents}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CITATIONS & CLASSICS */}
          {activeResultTab === 'citations' && dossier && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Quote className="w-4 h-4 text-emerald-400" />
                  <span>Danh Mục Trích Dẫn & Tác Giả Kinh Điển ({(dossier.citations || []).length} nguồn)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(dossier.citations || []).map((cit, idx) => (
                  <div
                    key={cit.id || idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{cit.author}</span>
                      <span className="text-[11px] font-mono text-slate-400">{cit.year}</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-300 italic">{cit.title}</div>
                    <div className="text-[11px] text-slate-400">Nguồn: {cit.source}</div>
                    {cit.keyQuote && (
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs italic text-slate-300">
                        "{cit.keyQuote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MAPPINGS & PHILOSOPHICAL BASIS */}
          {activeResultTab === 'mappings' && dossier && (
            <div className="space-y-6">
              {/* Philosophical Basis */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Nền Tảng Tư Tưởng & Học Thuyết Gốc</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dossier.philosophicalBasis || []).map((pb, idx) => (
                    <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="font-bold text-purple-300">{pb.doctrine}</div>
                      <div className="text-slate-400">Triết gia / Học giả: <strong className="text-slate-200">{pb.philosopher}</strong></div>
                      <div className="text-slate-300"><span className="text-slate-500">Nguyên lý:</span> {pb.coreTenet}</div>
                      <div className="text-emerald-300"><span className="text-slate-500">Ánh xạ hiện đại:</span> {pb.modernParity}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Mappings */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Ma Trận Ánh Xạ Kỹ Nghệ Hệ Thống & Multi-Agent</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dossier.technicalMappings || []).map((tm, idx) => (
                    <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="font-bold text-indigo-300">{tm.classicalConcept} ➔ {tm.computerSciencePattern}</div>
                      <div className="text-slate-300">{tm.rationale}</div>
                      <div className="text-rose-300 text-[11px]"><span className="text-slate-500">Hóa giải rủi ro:</span> {tm.failureModeAvoided}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
