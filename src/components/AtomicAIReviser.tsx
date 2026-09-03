import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Wand2,
  Layers,
  Workflow,
  Network,
  Brain,
  ChevronDown,
  Zap,
  GitBranch,
  Repeat
} from 'lucide-react';
import { safeFetchAIJson } from '../utils/ai-client';
import { BlueprintDiagramData } from '../types';

interface AtomicAIReviserProps {
  draft: string;
  setDraft: (draft: string) => void;
  unitType: string;
  theme: 'dark' | 'light';
  contextInfo?: string;
  onTransformToBlueprint?: (blueprintData: BlueprintDiagramData, markdown: string) => void;
}

export const AtomicAIReviser: React.FC<AtomicAIReviserProps> = ({
  draft,
  setDraft,
  unitType,
  theme,
  contextInfo,
  onTransformToBlueprint
}) => {
  const [prompt, setPrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [isDrawingBlueprint, setIsDrawingBlueprint] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('workflow');
  const [showStyleDrawer, setShowStyleDrawer] = useState(false);
  const [error, setError] = useState('');

  const handleRewrite = async (presetInstruction?: string) => {
    const instructionToUse = presetInstruction || prompt;
    if (!instructionToUse.trim()) return;

    setIsRewriting(true);
    setError('');

    const res = await safeFetchAIJson('/api/gemini/rewrite-atomic-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft, instruction: instructionToUse, unitType, contextInfo })
    });

    setIsRewriting(false);

    if (res.ok && res.data?.success) {
      let finalData = res.data.data;
      if (unitType === 'Mã nguồn') {
        finalData = finalData.replace(/^```[\w-]*\s*\n/i, '').replace(/\n\s*```$/i, '');
      }
      setDraft(finalData);
      if (!presetInstruction) setPrompt('');
    } else {
      setError(res.error || 'Có lỗi xảy ra khi gọi AI');
    }
  };

  const handleGenerateBlueprint = async (stylePreset: string = 'workflow', customInstruction?: string) => {
    if (!draft.trim()) {
      setError('Vui lòng nhập hoặc giữ nội dung văn bản để AI phân tích vẽ sơ đồ.');
      return;
    }

    setIsDrawingBlueprint(true);
    setError('');

    const res = await safeFetchAIJson('/api/gemini/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: draft,
        stylePreset,
        instruction: customInstruction || prompt || `Phân tích ngữ cảnh đoạn này và vẽ thành Sơ đồ ${stylePreset.toUpperCase()} với các node hành động & khối chức năng cực kỳ tinh gọn. Tên khối ngắn gọn (1-4 từ), mô tả chi tiết được xếp ở bảng bên dưới.`,
        contextInfo
      })
    });

    setIsDrawingBlueprint(false);

    if (res.ok && res.data?.success && res.data.blueprint) {
      const bpData: BlueprintDiagramData = res.data.blueprint;
      const bpMarkdown = res.data.blueprintMarkdown || `\`\`\`blueprint\n${JSON.stringify(bpData, null, 2)}\n\`\`\``;

      if (onTransformToBlueprint) {
        onTransformToBlueprint(bpData, bpMarkdown);
      } else {
        setDraft(bpMarkdown);
      }
      setShowStyleDrawer(false);
      setPrompt('');
    } else {
      setError(res.error || 'Lỗi khi tạo sơ đồ kiến trúc blueprint');
    }
  };

  const isDark = theme === 'dark';

  const renderActions = () => {
    if (unitType === 'Bảng biểu' || unitType === 'Mã nguồn' || unitType === 'Danh sách') {
      const buttonLabel = unitType === 'Bảng biểu'
        ? "1-Chạm: Tự động phân tích & Phục hồi Bảng"
        : unitType === 'Danh sách'
        ? "1-Chạm: Tối ưu & Chuyển hóa Ý này"
        : "1-Chạm: Tự động phân tích & Phục hồi Code";

      const presetInstruction = unitType === 'Bảng biểu'
        ? "Dữ liệu dưới đây đang bị hỏng định dạng hoặc chứa thông tin quá phức tạp/hàn lâm. Hãy phân tích các luồng thông tin, tham chiếu cấu trúc ngữ cảnh để tái tạo lại thành một bảng Markdown hoàn chỉnh. QUAN TRỌNG: Hãy áp dụng Sứ mệnh 'Chuyển hóa tri thức' - biên dịch các khái niệm kỹ thuật khô khan sang ngôn ngữ đời thường, trong sáng, gãy gọn và mang tính 'thực chiến' cao. Người đọc cần hiểu ngay bản chất và biết cách hành động. Tránh dùng từ ngữ phức tạp đánh đố. Đảm bảo đúng chuẩn cú pháp Markdown table."
        : unitType === 'Danh sách'
        ? "Đây là MỘT ý (gạch đầu dòng) trong một danh sách. Hãy phân tích và rút gọn ý này sao cho thật súc tích, gãy gọn, chuyển hóa ngôn từ hàn lâm thành ngôn ngữ 'thực chiến' trực diện. KHÔNG liệt kê thêm ý mới, KHÔNG thêm các ký hiệu gạch ngang (-) hay dấu sao (*) ở đầu dòng."
        : "Đoạn mã nguồn dưới đây có thể đang bị hỏng định dạng, mất thụt lề, mất dấu câu hoặc sai cú pháp do sao chép. Hãy phân tích cẩn thận ngữ cảnh để phục hồi lại đoạn mã này sao cho chuẩn xác và đúng chuẩn syntax của ngôn ngữ đó. KHÔNG bọc đoạn code trong markdown code block (ví dụ: không dùng ```typescript), chỉ trả về mã nguồn thô.";

      return (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleRewrite(presetInstruction)}
            disabled={isRewriting || isDrawingBlueprint}
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs w-full ${
              isRewriting
                ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400')
                : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
            }`}
          >
            {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {buttonLabel}
          </button>

          {/* Quick Blueprint Converter for Code or Complex Structure */}
          <button
            onClick={() => handleGenerateBlueprint('workflow')}
            disabled={isDrawingBlueprint || isRewriting}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs border ${
              isDrawingBlueprint
                ? (isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300')
                : (isDark ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60' : 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100')
            } cursor-pointer`}
          >
            {isDrawingBlueprint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
            <span>⚡ Chuyển hóa thành Sơ đồ Workflow Hành Động</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {/* Main 1-Click Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => handleRewrite("Phân tích cấu trúc và ý nghĩa của đoạn nội dung này, sau đó áp dụng sứ mệnh 'Chuyển hóa tri thức' (Knowledge Transforming) của OG để biên soạn lại. Yêu cầu: Biến đổi các khái niệm phức tạp, hàn lâm thành ngôn ngữ đời thường, trong sáng, gãy gọn và mang tính 'thực chiến' cao. Đảm bảo người đọc hiểu ngay bản chất và có thể hành động được.")}
            disabled={isRewriting || isDrawingBlueprint}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs ${
              isRewriting
                ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400')
                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
            }`}
          >
            {isRewriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            <span>1-Chạm: Chuyển Hóa Tri Thức</span>
          </button>

          {/* Quick Primary Workflow Generator */}
          <button
            onClick={() => handleGenerateBlueprint('workflow')}
            disabled={isDrawingBlueprint || isRewriting}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs border ${
              isDrawingBlueprint
                ? (isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300')
                : (isDark ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/80 hover:border-cyan-400 shadow-cyan-950/30' : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-600 shadow-cyan-200')
            } cursor-pointer`}
          >
            {isDrawingBlueprint ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Zap className="w-4 h-4 text-amber-400 animate-pulse" />}
            <span>⚡ Vẽ Sơ Đồ Workflow Hành Động</span>
          </button>
        </div>

        {/* Diverse Blueprint Style Selector Bar */}
        <div className={`p-2.5 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-900/60 border-cyan-500/20' : 'bg-cyan-50/60 border-cyan-100'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-cyan-300' : 'text-cyan-900'}`}>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Tùy Chọn Phong Cách Sơ Đồ (Đa Dạng Hóa Kiến Trúc):
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Node tinh gọn • Diễn giải ở dưới)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              onClick={() => handleGenerateBlueprint('workflow')}
              disabled={isDrawingBlueprint || isRewriting}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-amber-500/40 text-amber-300 hover:bg-amber-950/40' : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">⚡ Workflow Tuần Tự</span>
            </button>

            <button
              onClick={() => handleGenerateBlueprint('multi_agent')}
              disabled={isDrawingBlueprint || isRewriting}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-purple-500/40 text-purple-300 hover:bg-purple-950/40' : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Brain className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate">🤖 Multi-Agent Swarm</span>
            </button>

            <button
              onClick={() => handleGenerateBlueprint('pipeline')}
              disabled={isDrawingBlueprint || isRewriting}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-sky-500/40 text-sky-300 hover:bg-sky-950/40' : 'bg-white border-sky-300 text-sky-900 hover:bg-sky-50'
              }`}
            >
              <Workflow className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="truncate">🌊 Pipeline Dữ Liệu</span>
            </button>

            <button
              onClick={() => handleGenerateBlueprint('layered')}
              disabled={isDrawingBlueprint || isRewriting}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40' : 'bg-white border-indigo-300 text-indigo-900 hover:bg-indigo-50'
              }`}
            >
              <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">🏛️ Phân Tầng L1-L4</span>
            </button>

            <button
              onClick={() => handleGenerateBlueprint('decision_tree')}
              disabled={isDrawingBlueprint || isRewriting}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-rose-500/40 text-rose-300 hover:bg-rose-950/40' : 'bg-white border-rose-300 text-rose-900 hover:bg-rose-50'
              }`}
            >
              <GitBranch className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">🔀 Cây Quyết Định</span>
            </button>

            <button
              onClick={() => handleGenerateBlueprint('closed_loop')}
              disabled={isDrawingBlueprint || isRewriting}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40' : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <Repeat className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">🔄 Vòng Lặp Khép Kín</span>
            </button>
          </div>
        </div>

        {/* Text Refinement Tools */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => handleRewrite("Viết lại đoạn này cho trôi chảy, mạch lạc và chuyên nghiệp hơn, giữ nguyên ý nghĩa.")} disabled={isRewriting || isDrawingBlueprint} className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium rounded border ${isDark ? 'border-purple-500/30 text-purple-300 hover:bg-purple-900/30' : 'border-purple-300 text-purple-700 hover:bg-purple-50'} cursor-pointer transition-colors text-center`}>Làm mượt</button>
          <button onClick={() => handleRewrite("Rút gọn đoạn này cho súc tích, đi thẳng vào vấn đề chính.")} disabled={isRewriting || isDrawingBlueprint} className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium rounded border ${isDark ? 'border-purple-500/30 text-purple-300 hover:bg-purple-900/30' : 'border-purple-300 text-purple-700 hover:bg-purple-50'} cursor-pointer transition-colors text-center`}>Rút gọn</button>
          <button onClick={() => handleRewrite("Sửa các lỗi chính tả và ngữ pháp nếu có, không làm thay đổi văn phong.")} disabled={isRewriting || isDrawingBlueprint} className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium rounded border ${isDark ? 'border-purple-500/30 text-purple-300 hover:bg-purple-900/30' : 'border-purple-300 text-purple-700 hover:bg-purple-50'} cursor-pointer transition-colors text-center`}>Sửa lỗi</button>
        </div>

        {/* Custom Prompt Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRewrite()}
            placeholder="Hoặc nhập yêu cầu biên tập / tùy chỉnh vẽ sơ đồ..."
            className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-800 focus:border-cyan-400'
            }`}
            disabled={isRewriting || isDrawingBlueprint}
          />
          <button
            onClick={() => handleRewrite()}
            disabled={isRewriting || isDrawingBlueprint || !prompt.trim()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center min-w-[65px] transition-colors ${
              isRewriting || isDrawingBlueprint
                ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400')
                : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs'
            }`}
          >
            {isRewriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Chạy'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`mt-2 p-3 rounded-xl border flex flex-col gap-2 ${
      isDark ? 'bg-slate-950/60 border-cyan-500/30 shadow-md shadow-cyan-950/10' : 'bg-gradient-to-r from-purple-50/40 to-cyan-50/40 border-cyan-200 shadow-xs'
    }`}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
            Trợ Lý AI Biên Soạn & Bản Vẽ Kiến Trúc / Workflow
          </span>
        </div>
      </div>
      {renderActions()}
      {error && <div className="text-red-400 text-[10px] italic mt-1">{error}</div>}
    </div>
  );
};
