import React, { useState, useRef } from 'react';
import { 
  FileText, Sparkles, AlertCircle, CheckCircle2, Download, RefreshCw, 
  Copy, Layers, UploadCloud, X, FolderPlus, Workflow, Briefcase, 
  Users, Megaphone, TrendingUp, Brain, Check, ChevronRight, 
  Sliders, ShieldAlert, ArrowRight, BookOpen, Send, Lightbulb,
  CheckSquare, Square, FolderCheck, Compass, Sparkle, FileSpreadsheet
} from 'lucide-react';
import { safeFetchAIJson } from '../../utils/ai-client';
import { audioFx } from '../../utils/audioFx';
import { GeminiSettings, Dossier, ProjectAnalysisResult, ProjectActionScenario, DynamicPillar } from '../../types';
import { buildMultiScenarioDossierSuite, buildScenarioDynamicPillars } from '../../utils/projectDossierSuiteBuilder';

interface PublisherProjectAnalysisTabProps {
  theme: 'dark' | 'light';
  geminiSettings: GeminiSettings;
  onSaveDossier: (d: Dossier) => Promise<void>;
  onSelectDossier: (id: string) => void;
  onClose: () => void;
}

const SAMPLE_PROJECTS = [
  {
    title: 'Đề án Nông Nghiệp Công Nghệ Cao & Du Lịch Sinh Thái Tuần Hoàn',
    domain: 'Nông Nghiệp Bền Vững & Kinh Tế Xanh',
    content: `DỰ ÁN: KHU NÔNG NGHIỆP CÔNG NGHỆ CAO KẾT HỢP DU LỊCH TRẢI NGHIỆM SINH THÁI TUẦN HOÀN

1. Bối cảnh & Mục tiêu:
Dự án triển khai trên diện tích 25 hecta tại vùng đệm sinh thái. Mục tiêu xây dựng mô hình sản xuất nông nghiệp hữu cơ ứng dụng cảm biến IoT, hệ thống tưới nhỏ giọt tự động, kết hợp chế biến sâu thảo dược và dịch vụ du lịch giáo dục sinh thái trải nghiệm.

2. Mô hình kinh doanh & Doanh thu:
- Nguồn 1: Bán nông sản hữu cơ chứng nhận GlobalGAP và dược liệu sấy thăng hoa.
- Nguồn 2: Dịch vụ tour du lịch giáo dục trải nghiệm cuối tuần (Farmstay, Workshop làm nông, Cắm trại sinh thái).
- Nguồn 3: Đào tạo chuyển giao kỹ thuật canh tác sạch cho nông hộ vệ tinh.

3. Vấn đề & Thách thức hiện hữu:
- Vốn đầu tư ban đầu hạ tầng nhà màng và hệ thống tưới IoT khá lớn (~15 tỷ VNĐ).
- Đội ngũ lao động địa phương chưa quen vận hành công nghệ và chuẩn mực dịch vụ hiếu khách.
- Cần bài toán truyền thông xóa bỏ định kiến "du lịch nông nghiệp tự phát" và xây dựng niềm tin tiêu dùng sạch.

4. Nhu cầu phân tích:
Cần xây dựng quy trình vận hành SOPs cho 3 giai đoạn (Thi công - Thử nghiệm - Đón khách), báo cáo thẩm định kinh tế cho nhà đầu tư, cẩm nang truyền thông nội bộ gắn kết nhân sự bản địa, chiến dịch truyền thông cộng đồng, khảo sát thị trường tiêu dùng xanh và phân tích tâm lý khách du lịch gia đình đô thị.`
  },
  {
    title: 'Kế Hoạch Chuyển Đổi Số & Tự Động Hóa Quy Trình Doanh Nghiệp',
    domain: 'Chuyển Đổi Số & Quản Trị Hệ Thống',
    content: `KẾ HOẠCH HÀNH ĐỘNG: CHUYỂN ĐỔI SỐ TOÀN DIỆN VÀ TỰ ĐỘNG HÓA VẬN HÀNH (ENTERPRISE AGENTIC WORKFLOWS)

1. Tình trạng hiện tại:
Doanh nghiệp bán lẻ chuỗi 15 chi nhánh với hơn 120 nhân sự đang gặp tình trạng dữ liệu phân mảnh giữa phần mềm kế toán, kho bãi và CRM bán hàng. Tỷ lệ sai sót đơn hàng ~8%, thời gian đối soát tồn kho mất 3 ngày/tuần.

2. Đề xuất giải pháp kỹ thuật:
- Tích hợp nền tảng Data Lakehouse tập trung và triển khai Multi-Agent Swarms để tự động hóa:
  + Agent 1: Tự động đối soát kho và cảnh báo tồn an toàn.
  + Agent 2: Phân tích hành vi khách hàng và cá nhân hóa chiến dịch CSKH.
  + Agent 3: Dự báo dòng tiền và lập báo cáo tài chính hàng ngày.

3. Rủi ro & Kháng cự nội bộ:
- Nhân viên bán hàng và thủ kho lo sợ bị thay thế bởi AI.
- Cần lộ trình chuyển đổi không làm gián đoạn bán hàng ngày Tết.
- Cần kịch bản đào tạo và văn hóa chấp nhận thử nghiệm sai số.`
  },
  {
    title: 'Đề Án Học Viện Đào Tạo Kỹ Năng AI Thực Chiến & Kết Nối Việc Làm',
    domain: 'Giáo Dục & Trí Tuệ Nhân Tạo',
    content: `ĐỀ ÁN THÀNH LẬP HỌC VIỆN AI AGENTIC APPLIED LAB

1. Ý niệm cốt lõi:
Xây dựng chương trình đào tạo "AI Thực Chiến cho Người Đi Làm" - Chuyển hóa kiến thức kỹ thuật phức tạp thành bộ công cụ tự động hóa công việc văn phòng, marketing và lập trình ứng dụng trong 8 tuần.

2. Điểm khác biệt (USP):
- 100% học qua dự án thực tế (Project-based learning) có Mentor 1-1.
- Cam kết kết nối việc làm với mạng lưới 50+ doanh nghiệp đối tác.
- Tích hợp triết lý Shinbashira: Giữ vững đạo đức sử dụng AI và bảo mật dữ liệu doanh nghiệp.`
  }
];

export const PublisherProjectAnalysisTab: React.FC<PublisherProjectAnalysisTabProps> = ({ 
  theme, 
  geminiSettings,
  onSaveDossier,
  onSelectDossier,
  onClose
}) => {
  const [docContent, setDocContent] = useState('');
  const [strategicFocus, setStrategicFocus] = useState('');
  
  // File upload states
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileData, setUploadedFileData] = useState('');
  const [uploadedFileMime, setUploadedFileMime] = useState('');
  
  // Analysis and Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysisResult | null>(null);
  
  // Active Scenario Tab
  const [activeScenarioKey, setActiveScenarioKey] = useState<string>('diagnosis');
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingDossier, setIsSavingDossier] = useState(false);
  const [customPromptModal, setCustomPromptModal] = useState<string | null>(null);
  const [customInstructionText, setCustomInstructionText] = useState('');
  const [isCustomizingScenario, setIsCustomizingScenario] = useState(false);

  // Multi-Dossier Suite Batch Creation Modal state
  const [isSuiteModalOpen, setIsSuiteModalOpen] = useState(false);
  const [selectedDossierIds, setSelectedDossierIds] = useState<Record<string, boolean>>({});
  const [batchSavingProgress, setBatchSavingProgress] = useState<{
    isSaving: boolean;
    current: number;
    total: number;
    currentTitle: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setError('File quá lớn, vui lòng chọn file dưới 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedFileData(dataUrl);
      setUploadedFileMime(file.type || 'application/octet-stream');
      setUploadedFileName(file.name);
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

  const loadSample = (sample: typeof SAMPLE_PROJECTS[0]) => {
    setDocContent(sample.content);
    setStrategicFocus(`Tập trung thẩm định đề án "${sample.title}" theo đúng bối cảnh ngành ${sample.domain}.`);
    removeFile();
  };

  const handleAnalyze = async () => {
    if (!docContent.trim() && !uploadedFileData) {
      setError('Vui lòng dán nội dung hoặc tải lên tệp tài liệu dự án để bắt đầu.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    audioFx.playAITrigger();
    audioFx.startWaitingRadar(1300);

    try {
      const payload: any = {
        documentContent: docContent,
        prompt: strategicFocus,
        strategicFocus,
        model: geminiSettings.model || 'gemini-3.7-pro'
      };

      if (uploadedFileData) {
        payload.fileData = uploadedFileData;
        payload.fileMimeType = uploadedFileMime;
      }

      const res = await safeFetchAIJson('/api/gemini/analyze-project-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok && res.data && res.data.success && res.data.projectAnalysis) {
        setAnalysisResult(res.data.projectAnalysis);
        setActiveScenarioKey('diagnosis');
        audioFx.stopWaitingRadar();
        audioFx.playGrandCompletionChime();
      } else {
        audioFx.stopWaitingRadar();
        audioFx.playGentleNotice();
        setError(res.data?.error || res.error || 'Lỗi không xác định khi phân tích hồ sơ dự án.');
      }
    } catch (err: any) {
      audioFx.stopWaitingRadar();
      audioFx.playGentleNotice();
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      audioFx.stopWaitingRadar();
      setIsAnalyzing(false);
    }
  };

  // Open the Multi-Dossier Suite Selection Modal
  const openSuiteModal = () => {
    if (!analysisResult) return;
    const suite = buildMultiScenarioDossierSuite(analysisResult, docContent);
    const initialSelection: Record<string, boolean> = {};
    suite.allDossiers.forEach(d => {
      initialSelection[d.id] = true;
    });
    setSelectedDossierIds(initialSelection);
    setIsSuiteModalOpen(true);
  };

  // Batch Save all selected Dossiers into application storage
  const handleConfirmBatchSave = async () => {
    if (!analysisResult) return;
    const suite = buildMultiScenarioDossierSuite(analysisResult, docContent);
    const dossiersToSave = suite.allDossiers.filter(d => selectedDossierIds[d.id]);

    if (dossiersToSave.length === 0) {
      alert('Vui lòng chọn ít nhất 1 hồ sơ để khởi tạo.');
      return;
    }

    setBatchSavingProgress({
      isSaving: true,
      current: 0,
      total: dossiersToSave.length,
      currentTitle: dossiersToSave[0].title
    });

    try {
      for (let i = 0; i < dossiersToSave.length; i++) {
        const dossier = dossiersToSave[i];
        setBatchSavingProgress({
          isSaving: true,
          current: i + 1,
          total: dossiersToSave.length,
          currentTitle: dossier.title
        });
        await onSaveDossier(dossier);
      }

      // Automatically select the master dossier (or first saved dossier)
      const firstId = dossiersToSave[0].id;
      onSelectDossier(firstId);
      setIsSuiteModalOpen(false);
      onClose();
    } catch (err: any) {
      setError('Lỗi khi lưu bộ hồ sơ thực chiến: ' + (err.message || ''));
    } finally {
      setBatchSavingProgress(null);
    }
  };

  // Save single active scenario as a dedicated deep Dossier with 6 dynamic pillars
  const handleSaveSingleScenarioDossier = async (scenario: ProjectActionScenario) => {
    if (!analysisResult) return;
    setIsSavingDossier(true);

    try {
      const suite = buildMultiScenarioDossierSuite(analysisResult, docContent);
      const targetDossier = suite.scenarioDossiers.find(d => d.pillarId === `pillar-${scenario.key}`) || suite.scenarioDossiers[0];

      if (targetDossier) {
        await onSaveDossier(targetDossier);
        onSelectDossier(targetDossier.id);
        onClose();
      }
    } catch (err: any) {
      setError('Lỗi khi lưu hồ sơ kịch bản: ' + (err.message || ''));
    } finally {
      setIsSavingDossier(false);
    }
  };

  const handleCustomScenarioRegen = async (scenario: ProjectActionScenario) => {
    if (!analysisResult) return;
    setIsCustomizingScenario(true);

    try {
      const res = await safeFetchAIJson('/api/gemini/generate-project-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioKey: scenario.key,
          scenarioTitle: scenario.title,
          projectTitle: analysisResult.projectTitle,
          projectDiagnosis: analysisResult.executiveDiagnosis,
          documentContext: docContent,
          customInstruction: customInstructionText,
          model: geminiSettings.model || 'gemini-3.7-flash'
        })
      });

      if (res.ok && res.data && res.data.success && res.data.contentMarkdown) {
        const updatedScenarios = analysisResult.scenarios.map(s => 
          s.id === scenario.id 
            ? { ...s, contentMarkdown: res.data.contentMarkdown, status: 'customized' as const } 
            : s
        );
        setAnalysisResult({ ...analysisResult, scenarios: updatedScenarios });
        setCustomPromptModal(null);
        setCustomInstructionText('');
      } else {
        alert(res.data?.error || 'Lỗi khi tùy biến kịch bản.');
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsCustomizingScenario(false);
    }
  };

  const copyCurrentContent = () => {
    let textToCopy = '';
    if (activeScenarioKey === 'diagnosis' && analysisResult) {
      textToCopy = `# ${analysisResult.projectTitle}\n## ${analysisResult.projectSubtitle}\n\n### BÁO CÁO THẨM ĐỊNH\n${analysisResult.executiveDiagnosis}\n\n### ĐIỂM MẠNH:\n${analysisResult.coreStrengths.join('\n')}\n\n### RỦI RO & ĐIỂM NGHẼN:\n${analysisResult.failureModesAndRisks.join('\n')}\n\n### HÀNH ĐỘNG SỐNG CÒN:\n${analysisResult.strategicImperatives.join('\n')}`;
    } else {
      const current = analysisResult?.scenarios.find(s => s.key === activeScenarioKey);
      textToCopy = current?.contentMarkdown || '';
    }

    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadMasterDocument = () => {
    if (!analysisResult) return;
    let md = `# BÁO CÁO CHIẾN LƯỢC TOÀN DIỆN & TRỌN BỘ 6 KỊCH BẢN HÀNH ĐỘNG\n`;
    md += `**Đề Án:** ${analysisResult.projectTitle}\n`;
    md += `**Lĩnh Vực:** ${analysisResult.projectDomain} | **Độ Khả Thi:** ${analysisResult.feasibilityScore}/100\n\n`;
    md += `---\n\n## PHẦN I: BÁO CÁO THẨM ĐỊNH & NHẬN ĐỊNH HỒ SƠ DỰ ÁN\n\n`;
    md += `${analysisResult.executiveDiagnosis}\n\n`;
    md += `### 1. Điểm Mạnh & Lợi Thế Cốt Lõi:\n${analysisResult.coreStrengths.map(s => `- ${s}`).join('\n')}\n\n`;
    md += `### 2. Điểm Nghẽn, Sai Sót & Rủi Ro Tiềm Ẩn:\n${analysisResult.failureModesAndRisks.map(r => `- ${r}`).join('\n')}\n\n`;
    md += `### 3. Hành Động Sống Còn Cần Làm Ngay:\n${analysisResult.strategicImperatives.map(a => `- ${a}`).join('\n')}\n\n`;

    md += `---\n\n## PHẦN II: TRỌN BỘ 6 KỊCH BẢN HÀNH ĐỘNG THỰC CHIẾN\n\n`;
    analysisResult.scenarios.forEach((sc, idx) => {
      md += `### KỊCH BẢN ${idx + 1}: ${sc.title.toUpperCase()}\n`;
      md += `*Đối tượng hướng đến: ${sc.targetAudience}*\n\n`;
      md += `${sc.contentMarkdown}\n\n`;
      if (sc.actionItems && sc.actionItems.length > 0) {
        md += `**Danh mục việc cần làm ngay:**\n${sc.actionItems.map(item => `- [ ] ${item}`).join('\n')}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ke_Hoach_Thuc_Chien_${analysisResult.projectTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getScenarioIcon = (key: string) => {
    switch (key) {
      case 'sop_workflows': return <Workflow className="w-4 h-4 text-emerald-400" />;
      case 'executive_report': return <Briefcase className="w-4 h-4 text-sky-400" />;
      case 'internal_team_comm': return <Users className="w-4 h-4 text-amber-400" />;
      case 'public_community_comm': return <Megaphone className="w-4 h-4 text-rose-400" />;
      case 'market_research': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'consumer_psychology': return <Brain className="w-4 h-4 text-pink-400" />;
      default: return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleReset = () => {
    if (confirm('Làm mới toàn bộ và bắt đầu phân tích đề án mới?')) {
      setDocContent('');
      setStrategicFocus('');
      setError('');
      setAnalysisResult(null);
      removeFile();
    }
  };

  // Preview of Suite Dossiers for the modal
  const suitePreview = analysisResult ? buildMultiScenarioDossierSuite(analysisResult, docContent) : null;

  return (
    <div className="h-full flex flex-col p-3 md:p-5 overflow-hidden max-w-7xl mx-auto w-full">
      {/* If no analysis result yet: Render Document Ingestion Studio */}
      {!analysisResult ? (
        <div className={`flex-1 flex flex-col rounded-3xl border p-5 md:p-8 shadow-xl overflow-y-auto transition-all ${
          theme === 'dark' ? 'bg-slate-900/60 border-indigo-500/20' : 'bg-white border-indigo-100'
        }`}>
          {/* HEADER */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/40 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display-title font-bold text-lg md:text-xl tracking-wide uppercase">
                  PHÂN TÍCH DỰ ÁN &amp; SẢN XUẤT KỊCH BẢN THỰC CHIẾN
                </h3>
                <p className="text-xs text-slate-400">
                  Nạp 1 đề án đầu vào &rarr; AI thẩm định toàn diện &rarr; Tạo trọn bộ hồ sơ kịch bản hành động chuyên sâu (Deep 6 Pillars)
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
              title="Làm mới"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* QUICK SAMPLES PICKER */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mẫu Đề Án Khởi Động Nhanh (1-Chạm)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_PROJECTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSample(sample)}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    theme === 'dark'
                      ? 'bg-[#0f121e] border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/20'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                      {sample.domain}
                    </span>
                    <h4 className="text-xs font-bold mt-2 text-slate-200 line-clamp-2">
                      {sample.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-400 mt-2 flex items-center gap-1">
                    Nạp mẫu này <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* FILE UPLOAD & TEXT INPUT DUAL ZONE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-[220px]">
            {/* FILE UPLOAD (5 cols) */}
            <div className="md:col-span-5 flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                Tải lên tệp tài liệu dự án
              </label>

              <div className={`flex-1 min-h-[160px] p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 relative ${
                theme === 'dark' 
                  ? uploadedFileName ? 'bg-indigo-950/30 border-indigo-500/60' : 'bg-[#0b0c15] border-slate-700/80 hover:border-indigo-500/50' 
                  : uploadedFileName ? 'bg-indigo-50/70 border-indigo-300' : 'bg-slate-50 border-slate-300 hover:border-indigo-400'
              }`}>
                {!uploadedFileName ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-200 block">
                        Nhấp hoặc Kéo thả tệp vào đây
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Hỗ trợ PDF, Word, Markdown, Text, CSV (&lt; 20MB)
                      </span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload} 
                      accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Tải lên tài liệu dự án"
                    />
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between z-10 px-3 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-6 h-6 text-indigo-400 shrink-0" />
                      <div className="overflow-hidden text-left">
                        <span className="text-xs font-bold text-indigo-300 truncate block">
                          {uploadedFileName}
                        </span>
                        <span className="text-[10px] text-teal-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng phân tích
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={removeFile}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                      title="Xóa tệp"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TEXT AREA INPUT (7 cols) */}
            <div className="md:col-span-7 flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                Hoặc dán toàn văn đề án / tài liệu / biên bản cuộc họp
              </label>

              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Dán toàn văn tài liệu dự án, đề xuất kinh doanh, bản vẽ quy trình hoặc ý niệm cần thẩm định vào đây..."
                className={`flex-1 w-full rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 border transition-all min-h-[160px] font-sans ${
                  theme === 'dark'
                    ? 'bg-[#0b0c15] border-slate-700/80 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
            </div>
          </div>

          {/* STRATEGIC FOCUS LENS */}
          <div className="mt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Trọng tâm thẩm định &amp; Định hướng kịch bản (Tùy chọn)
            </label>
            <div className="relative">
              <input
                type="text"
                value={strategicFocus}
                onChange={(e) => setStrategicFocus(e.target.value)}
                placeholder="VD: Tập trung thẩm định rủi ro dòng tiền, xây dựng lộ trình SOPs thi công và cẩm nang truyền thông xóa bỏ rào cản nhân sự..."
                className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-[#0b0c15] border-slate-700/80 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              <Sliders className="w-4 h-4 absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!docContent.trim() && !uploadedFileData)}
            className={`mt-6 w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold shadow-xl transition-all cursor-pointer ${
              isAnalyzing || (!docContent.trim() && !uploadedFileData)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-900/40 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>ĐANG THẨM ĐỊNH HỒ SƠ &amp; SẢN XUẤT 6 KỊCH BẢN THỰC CHIẾN...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>THẨM ĐỊNH DỰ ÁN &amp; XUẤT BẢN TRỌN BỘ KỊCH BẢN HÀNH ĐỘNG</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* If analysis result exists: Render Multi-Scenario Action Intelligence Workspace */
        <div className="flex-1 flex flex-col overflow-hidden gap-3">
          {/* TOP BAR: PROJECT SUMMARY & MASTER CONTROLS */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/30">
                {analysisResult.feasibilityScore}%
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm md:text-base text-slate-100 font-display-title">
                    {analysisResult.projectTitle}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    {analysisResult.projectDomain}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {analysisResult.projectSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={copyCurrentContent}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Sao chép nội dung đang xem"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Đã chép' : 'Sao chép'}
              </button>

              <button
                onClick={downloadMasterDocument}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                title="Tải xuống toàn bộ báo cáo và 6 kịch bản (.md)"
              >
                <Download className="w-3.5 h-3.5" />
                Tải Toàn Bộ (.md)
              </button>

              {/* NÚT TẠO TRỌN BỘ HỒ SƠ DỰ ÁN THỰC CHIẾN (FLAGSHIP ACTION) */}
              <button
                onClick={openSuiteModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 transition-all cursor-pointer border border-emerald-400/40 active:scale-95"
                title="Tạo trọn bộ 7 Hồ Sơ Dự Án Đa Chiều (1 Master + 6 Kịch Bản Thực Chiến)"
              >
                <FolderPlus className="w-4 h-4 text-emerald-200" />
                <span>TẠO BỘ 7 HỒ SƠ THỰC CHIẾN</span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/20 font-mono font-bold">
                  7 DOSSIERS
                </span>
              </button>

              <button
                onClick={handleReset}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Phân tích đề án khác"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAIN WORKSPACE: SIDEBAR TABS & SCENARIO VIEW */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden">
            {/* LEFT NAV: SCENARIOS MATRIX (4 cols) */}
            <div className={`md:col-span-4 rounded-2xl border p-3 flex flex-col gap-1.5 overflow-y-auto ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ma Trận Kịch Bản Thực Chiến
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                  6 KỊCH BẢN
                </span>
              </div>

              {/* TAB 0: DIAGNOSIS */}
              <button
                onClick={() => setActiveScenarioKey('diagnosis')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeScenarioKey === 'diagnosis'
                    ? theme === 'dark'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold shadow-sm'
                      : 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-sm'
                    : theme === 'dark'
                      ? 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs truncate block">Báo Cáo Thẩm Định Dự Án</span>
                    <span className="text-[10px] text-slate-400 truncate block">Điểm khả thi, rủi ro &amp; giải pháp</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              <hr className="my-1 border-slate-800/80" />

              {/* 6 ACTION SCENARIOS */}
              {analysisResult.scenarios.map((sc) => {
                const isActive = activeScenarioKey === sc.key;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenarioKey(sc.key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-bold shadow-sm'
                          : 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-sm'
                        : theme === 'dark'
                          ? 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                        {getScenarioIcon(sc.key)}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs truncate block">{sc.title}</span>
                        <span className="text-[10px] text-slate-400 truncate block">{sc.targetAudience}</span>
                      </div>
                    </div>
                    {sc.status === 'customized' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        ĐÃ SỬA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT PANEL: CONTENT VIEWER (8 cols) */}
            <div className={`md:col-span-8 rounded-2xl border p-4 md:p-6 flex flex-col overflow-y-auto ${
              theme === 'dark' ? 'bg-[#0a0c16] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* VIEW 1: EXECUTIVE DIAGNOSIS */}
              {activeScenarioKey === 'diagnosis' && (
                <div className="space-y-6">
                  {/* SCORECARD */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30">
                      <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 block mb-1">
                        Chỉ Số Khả Thi &amp; Hoàn Thiện
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-indigo-300 font-display-title">
                          {analysisResult.feasibilityScore}/100
                        </span>
                        <span className="text-xs text-emerald-400 font-bold">Rất tiềm năng</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30">
                      <span className="text-[10px] font-mono font-bold uppercase text-purple-400 block mb-1">
                        Lộ Trình Ước Tính
                      </span>
                      <span className="text-lg font-bold text-purple-200 block">
                        {analysisResult.detectedTimeline || '6 - 12 Tháng'}
                      </span>
                      <span className="text-[11px] text-slate-400">Phân kỳ 3 giai đoạn</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 to-slate-900 border border-pink-500/30">
                      <span className="text-[10px] font-mono font-bold uppercase text-pink-400 block mb-1">
                        Quy Mô Ngân Sách
                      </span>
                      <span className="text-lg font-bold text-pink-200 block truncate">
                        {analysisResult.estimatedBudgetScope || 'Linh hoạt theo phân kỳ'}
                      </span>
                      <span className="text-[11px] text-slate-400">Kiểm soát dòng tiền</span>
                    </div>
                  </div>

                  {/* EXECUTIVE SUMMARY */}
                  <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Nhận Định Thẩm Định Tổng Quan (Executive Diagnosis)
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {analysisResult.executiveDiagnosis}
                    </p>
                  </div>

                  {/* 3 COLUMNS: STRENGTHS - RISKS - IMPERATIVES */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* STRENGTHS */}
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                      <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Điểm Mạnh &amp; USP
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.coreStrengths.map((st, i) => (
                          <li key={i} className="text-xs text-emerald-200/90 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">&bull;</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* RISKS / FAILURE MODES */}
                    <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30">
                      <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Rủi Ro &amp; Điểm Nghẽn
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.failureModesAndRisks.map((rk, i) => (
                          <li key={i} className="text-xs text-rose-200/90 flex items-start gap-2">
                            <span className="text-rose-400 font-bold">&bull;</span>
                            <span>{rk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* STRATEGIC IMPERATIVES */}
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Hành Động Sống Còn
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.strategicImperatives.map((imp, i) => (
                          <li key={i} className="text-xs text-amber-200/90 flex items-start gap-2">
                            <span className="text-amber-400 font-bold">&bull;</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* MISSING ELEMENTS & TARGET PERSONAS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.missingElements && analysisResult.missingElements.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Khoảng trống đề án cần bổ sung
                        </h5>
                        <ul className="space-y-1.5">
                          {analysisResult.missingElements.map((el, i) => (
                            <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                              <span className="text-slate-500 font-bold">&minus;</span>
                              <span>{el}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.targetPersonas && analysisResult.targetPersonas.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Chân dung đối tượng thụ hưởng cốt lõi
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.targetPersonas.map((p, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: ACTIVE SCENARIO MARKDOWN & ACTIONS */}
              {activeScenarioKey !== 'diagnosis' && (() => {
                const scenario = analysisResult.scenarios.find(s => s.key === activeScenarioKey);
                if (!scenario) return null;

                const pillarsPreview = buildScenarioDynamicPillars(scenario.key, analysisResult.projectTitle, scenario.title);

                return (
                  <div className="space-y-5">
                    {/* SCENARIO HEADER */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                            {scenario.key.toUpperCase()}
                          </span>
                          <h4 className="font-bold text-base text-slate-100 font-display-title">
                            {scenario.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Đối tượng mục tiêu: <strong className="text-slate-300">{scenario.targetAudience}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* NÚT TẠO RIÊNG HỒ SƠ KỊCH BẢN NÀY */}
                        <button
                          onClick={() => handleSaveSingleScenarioDossier(scenario)}
                          disabled={isSavingDossier}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition-all cursor-pointer shrink-0"
                          title="Tạo riêng 1 Hồ Sơ Chuyên Sâu cho kịch bản này với 6 Trụ Cột Động"
                        >
                          {isSavingDossier ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FolderPlus className="w-3.5 h-3.5" />
                          )}
                          <span>Tạo Hồ Sơ Kịch Bản Này</span>
                        </button>

                        <button
                          onClick={() => {
                            setCustomPromptModal(scenario.key);
                            setCustomInstructionText('');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Tùy Biến
                        </button>
                      </div>
                    </div>

                    {/* 6 DYNAMIC PILLARS ARCHITECTURE PREVIEW FOR THIS SCENARIO */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          Cấu Trúc 6 Trụ Cột Động Của Kịch Bản (Dynamic Pillars)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          6 Trụ Cột • 12 Chương Nghiên Cứu
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {pillarsPreview.map((pillar, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="text-[10.5px] font-bold text-slate-200 block truncate">
                              {pillar.title}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block line-clamp-1 mt-0.5">
                              {pillar.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ACTION ITEMS CHECKLIST (IF ANY) */}
                    {scenario.actionItems && scenario.actionItems.length > 0 && (
                      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">
                          Danh Mục Hành Động Tiên Quyết (Action Checklist)
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {scenario.actionItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FULL MARKDOWN BODY */}
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {scenario.contentMarkdown}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH DOSSIER SUITE CREATION */}
      {isSuiteModalOpen && suitePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-100 uppercase tracking-wide font-display-title">
                    KHỞI TẠO BỘ HỒ SƠ DỰ ÁN ĐA CHIỀU (MULTI-DOSSIER ACTION SUITE)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Chuyển hóa đề án thành trọn bộ 7 Hồ sơ nghiên cứu chuyên sâu, có độ sâu và mang tính hành động
                  </p>
                </div>
              </div>
              <button
                onClick={() => !batchSavingProgress && setIsSuiteModalOpen(false)}
                disabled={Boolean(batchSavingProgress)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SELECTION CONTROLS BAR */}
            <div className="flex items-center justify-between pb-3 text-xs text-slate-400 border-b border-slate-800/80 mb-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const allSelected: Record<string, boolean> = {};
                    suitePreview.allDossiers.forEach(d => { allSelected[d.id] = true; });
                    setSelectedDossierIds(allSelected);
                  }}
                  className="hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                >
                  Chọn tất cả (7)
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setSelectedDossierIds({})}
                  className="hover:text-rose-400 font-medium transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
              <div className="font-mono text-emerald-400 font-bold">
                Đã chọn: {Object.values(selectedDossierIds).filter(Boolean).length} / {suitePreview.allDossiers.length} Hồ Sơ
              </div>
            </div>

            {/* LIST OF 7 DOSSIERS */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
              {suitePreview.allDossiers.map((dossier, idx) => {
                const isSelected = Boolean(selectedDossierIds[dossier.id]);
                const isMaster = idx === 0;

                return (
                  <div
                    key={dossier.id}
                    onClick={() => {
                      if (batchSavingProgress) return;
                      setSelectedDossierIds(prev => ({ ...prev, [dossier.id]: !prev[dossier.id] }));
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? isMaster
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md shadow-emerald-950/30'
                          : 'bg-indigo-950/25 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <button
                        type="button"
                        className="mt-0.5 text-slate-300 hover:text-emerald-400"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isMaster ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                          }`}>
                            {isMaster ? '⭐ HỒ SƠ TỔNG THỂ' : `KỊCH BẢN ${idx}`}
                          </span>
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {dossier.title}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-slate-300 line-clamp-1 mb-2">
                          {dossier.subtitle}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            6 Trụ Cột Động • 12 Chương
                          </span>
                          {dossier.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LIVE BATCH SAVING PROGRESS */}
            {batchSavingProgress && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 mb-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-emerald-300 mb-1.5 font-bold">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    Đang khởi tạo Hồ Sơ {batchSavingProgress.current}/{batchSavingProgress.total}...
                  </span>
                  <span>{Math.round((batchSavingProgress.current / batchSavingProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 transition-all duration-300"
                    style={{ width: `${(batchSavingProgress.current / batchSavingProgress.total) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-300 block truncate">
                  {batchSavingProgress.currentTitle}
                </span>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={() => setIsSuiteModalOpen(false)}
                disabled={Boolean(batchSavingProgress)}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                onClick={handleConfirmBatchSave}
                disabled={Boolean(batchSavingProgress) || Object.values(selectedDossierIds).filter(Boolean).length === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  Boolean(batchSavingProgress) || Object.values(selectedDossierIds).filter(Boolean).length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/30'
                }`}
              >
                {batchSavingProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào kho hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <FolderCheck className="w-4 h-4" />
                    <span>Xác Nhận Tạo {Object.values(selectedDossierIds).filter(Boolean).length} Hồ Sơ Thực Chiến</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM INSTRUCTION RE-GENERATION */}
      {customPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                  Tùy Biến Kịch Bản Với AI
                </h4>
              </div>
              <button
                onClick={() => setCustomPromptModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Nhập hướng dẫn cụ thể để AI tinh chỉnh, đào sâu hoặc thay đổi giọng văn cho kịch bản này (ví dụ: &ldquo;Viết theo phong cách thuyết phục nhà đầu tư ngoại&rdquo;, &ldquo;Bổ sung chi tiết bảng dự toán nhân sự&rdquo;).
            </p>

            <textarea
              value={customInstructionText}
              onChange={(e) => setCustomInstructionText(e.target.value)}
              placeholder="Nhập yêu cầu bổ sung của bạn..."
              className="w-full h-28 rounded-xl p-3 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:border-purple-500 focus:outline-none resize-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCustomPromptModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const sc = analysisResult?.scenarios.find(s => s.key === customPromptModal);
                  if (sc) handleCustomScenarioRegen(sc);
                }}
                disabled={isCustomizingScenario}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {isCustomizingScenario ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Cập nhật kịch bản
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

