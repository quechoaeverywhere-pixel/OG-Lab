import React, { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  FileText,
  Workflow,
  Quote,
  List,
  Code,
  Table as TableIcon,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { AtomicUnitType, AtomicContentUnit, ConceptRenderData, BlueprintDiagramData, AtomicSection } from '../types';

interface AddContentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections?: AtomicSection[];
  targetLocation?: {
    targetUnitId?: string;
    position?: 'before' | 'after';
    targetSectionId?: string;
    targetSubsectionId?: string;
  };
  onInsertUnit?: (newUnit: AtomicContentUnit) => void;
  onAddCard?: (
    location: {
      targetUnitId?: string;
      position?: 'before' | 'after';
      targetSectionId?: string;
      targetSubsectionId?: string;
    },
    newUnit: AtomicContentUnit
  ) => void;
  chapterContext?: {
    dossierTitle?: string;
    pillarTitle?: string;
    chapterTitle?: string;
  };
  theme?: 'dark' | 'light';
  contextInfo?: string;
}

const CARD_TYPES: Array<{
  type: AtomicUnitType;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  description: string;
}> = [
  {
    type: 'concept_render',
    icon: <Building2 className="w-5 h-5 text-purple-400" />,
    label: 'Kiến Trúc Sư AI & Phối Cảnh Ý Niệm',
    badge: 'Google Banana AI',
    description: 'Tạo bản vẽ phối cảnh công trình, mặt bằng không gian và phân tích phân khu kiến trúc tự động.'
  },
  {
    type: 'paragraph',
    icon: <FileText className="w-5 h-5 text-blue-400" />,
    label: 'Đoạn Văn Bản & Luận Điểm',
    description: 'Thuyết minh tự do, phân tích bản thể, luận chứng hoặc diễn giải thực chiến.'
  },
  {
    type: 'blueprint_diagram',
    icon: <Workflow className="w-5 h-5 text-emerald-400" />,
    label: 'Sơ Đồ Luồng ASCII / Blueprint Flow',
    description: 'Mô hình hóa quy trình vận hành, dòng chảy dữ liệu/tài nguyên phẳng gọn gàng.'
  },
  {
    type: 'quote',
    icon: <Quote className="w-5 h-5 text-amber-400" />,
    label: 'Trích Dẫn Học Thuật & Kinh Điển',
    description: 'Trích dẫn danh ngôn, triết học Đông - Tây kèm dịch nghĩa và ý nghĩa thực chiến.'
  },
  {
    type: 'bullet',
    icon: <List className="w-5 h-5 text-cyan-400" />,
    label: 'Danh Sách Điểm Nhấn',
    description: 'Các gạch đầu dòng cô đọng, hành động và luận cứ then chốt.'
  },
  {
    type: 'code',
    icon: <Code className="w-5 h-5 text-indigo-400" />,
    label: 'Mã Nguồn Kỹ Nghệ & Script',
    description: 'Khối mã nguồn phần mềm, cấu hình hệ thống hoặc thuật toán thực thi.'
  },
  {
    type: 'table',
    icon: <TableIcon className="w-5 h-5 text-rose-400" />,
    label: 'Bảng Biểu & Ma Trận Đối Chiếu',
    description: 'Bảng dữ liệu Markdown so sánh đa chiều các chỉ số.'
  }
];

export const AddContentCardModal: React.FC<AddContentCardModalProps> = ({
  isOpen,
  onClose,
  sections,
  targetLocation,
  onInsertUnit,
  onAddCard,
  chapterContext,
  theme = 'dark',
  contextInfo = ''
}) => {
  const [selectedType, setSelectedType] = useState<AtomicUnitType>('concept_render');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Architectural AI specific state
  const [archPrompt, setArchPrompt] = useState('');
  const [archStyle, setArchStyle] = useState('Rustic & Wabi-Sabi Nhà Vườn Bản Địa (Vật liệu tái chế, Gỗ-Đá mộc, Không gian mở & Xanh nhiệt đới Việt Nam)');
  const [archAngle, setArchAngle] = useState('Phối Cảnh Toàn Cảnh (Bird-eye / Aerial)');
  const [isGeneratingRender, setIsGeneratingRender] = useState(false);
  const [renderPreviewData, setRenderPreviewData] = useState<ConceptRenderData | null>(null);

  // Quote specific state
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteWork, setQuoteWork] = useState('');
  const [quoteEra, setQuoteEra] = useState('');
  const [quoteTranslation, setQuoteTranslation] = useState('');
  const [quoteInterpretation, setQuoteInterpretation] = useState('');

  // Code specific state
  const [codeLanguage, setCodeLanguage] = useState('typescript');

  // Blueprint specific state
  const [blueprintNodes, setBlueprintNodes] = useState<string>('Ý Niệm Khởi Nguyên -> Cơ Chế Vận Hành -> Kiến Trúc Hệ Thống -> Thực Thi Xã Hội');

  if (!isOpen) return null;

  const handleGenerateArchAI = async () => {
    if (!archPrompt.trim()) return;
    setIsGeneratingRender(true);
    try {
      const res = await fetch('/api/gemini/generate-concept-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: archPrompt.trim(),
          style: archStyle,
          viewAngle: archAngle,
          contextInfo,
          aspectRatio: '16:9'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRenderPreviewData(data.data);
        if (!title) setTitle(data.data.caption || 'Phối Cảnh Kiến Trúc');
      }
    } catch (err) {
      console.error('Error generating architectural render:', err);
    } finally {
      setIsGeneratingRender(false);
    }
  };

  const handleCreate = () => {
    const unitId = `unit-custom-${Date.now()}`;
    let newUnit: AtomicContentUnit;

    if (selectedType === 'concept_render') {
      const finalRenderData: ConceptRenderData = renderPreviewData || {
        imageUrl: '',
        prompt: archPrompt || content || 'Phối cảnh kiến trúc ý niệm',
        caption: title || 'Phối Cảnh Ý Niệm Không Gian Kiến Trúc',
        style: archStyle,
        viewAngle: archAngle
      };

      newUnit = {
        id: unitId,
        type: 'concept_render',
        title: title || finalRenderData.caption,
        content: finalRenderData.prompt,
        conceptRenderData: finalRenderData,
        rawMarkdown: `\`\`\`concept-render\n${JSON.stringify(finalRenderData, null, 2)}\n\`\`\``
      };
    } else if (selectedType === 'quote') {
      newUnit = {
        id: unitId,
        type: 'quote',
        content: content || 'Tri thức khởi nguồn từ sự tĩnh tại và thấu hiểu quy luật tự nhiên.',
        author: quoteAuthor || 'Tác giả Kinh điển',
        work: quoteWork || undefined,
        eraOrYear: quoteEra || undefined,
        translationVi: quoteTranslation || undefined,
        interpretation: quoteInterpretation || undefined
      };
    } else if (selectedType === 'blueprint_diagram') {
      const nodesArr = blueprintNodes.split('->').map((n, i) => ({
        id: `node-${i + 1}`,
        label: n.trim(),
        role: `Bước ${i + 1}`
      }));
      const connectionsArr = nodesArr.slice(0, -1).map((n, i) => ({
        from: n.id,
        to: nodesArr[i + 1].id,
        label: 'chuyển hóa'
      }));

      const bpData: BlueprintDiagramData = {
        title: title || 'Sơ Đồ Chuỗi Vận Hành & Kiến Trúc',
        category: 'pipeline',
        nodes: nodesArr,
        connections: connectionsArr,
        notes: ['Sơ đồ luồng phẳng trực quan, tối ưu cho việc theo dõi tiến trình.']
      };

      newUnit = {
        id: unitId,
        type: 'blueprint_diagram',
        title: title || bpData.title,
        content: JSON.stringify(bpData, null, 2),
        blueprintData: bpData,
        rawMarkdown: `\`\`\`blueprint\n${JSON.stringify(bpData, null, 2)}\n\`\`\``
      };
    } else if (selectedType === 'code') {
      newUnit = {
        id: unitId,
        type: 'code',
        title: title || undefined,
        content: content || '// Nhập mã nguồn phần mềm hoặc script cấu hình tại đây\nexport function executeTask() {\n  return "Done";\n}',
        language: codeLanguage || 'typescript',
        rawMarkdown: `\`\`\`${codeLanguage}\n${content}\n\`\`\``
      };
    } else if (selectedType === 'bullet') {
      newUnit = {
        id: unitId,
        type: 'bullet',
        content: content || 'Luận điểm quan trọng cần nhấn mạnh trong chương này.',
        rawMarkdown: `- ${content}`
      };
    } else if (selectedType === 'table') {
      const tableContent = content || `| Thành phần | Công năng chính | Cơ chế bảo đảm |\n| :--- | :--- | :--- |\n| Trụ Cột Trung Tâm | Giữ cân bằng hệ thống | Triết lý Shinbashira |\n| Vườn Sinh Thái | Điều hòa vi khí hậu | Tuần hoàn tự nhiên |`;
      newUnit = {
        id: unitId,
        type: 'table',
        title: title || undefined,
        content: tableContent,
        rawMarkdown: tableContent
      };
    } else {
      // Paragraph
      newUnit = {
        id: unitId,
        type: 'paragraph',
        title: title || undefined,
        content: content || 'Nhập nội dung luận điểm hoặc phân tích tại đây.',
        rawMarkdown: content
      };
    }

    if (onInsertUnit) {
      onInsertUnit(newUnit);
    } else if (onAddCard) {
      onAddCard(targetLocation || {}, newUnit);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
            }`}>
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Thêm Thẻ Nội Dung Mới</h3>
              <p className="text-xs text-slate-400">
                Tùy chỉnh chèn phối cảnh kiến trúc AI, sơ đồ luồng, đoạn văn hoặc trích dẫn vào bất kỳ vị trí nào
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Card Type Selection Grid */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Chọn loại thẻ nội dung:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CARD_TYPES.map((card) => {
                const isSelected = selectedType === card.type;
                return (
                  <button
                    key={card.type}
                    onClick={() => setSelectedType(card.type)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500'
                          : 'bg-purple-50 border-purple-500 shadow-xs ring-1 ring-purple-500'
                        : theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1 rounded-md">{card.icon}</div>
                        {card.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs sm:text-sm leading-tight mb-1">
                        {card.label}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type-Specific Customizer Inputs */}
          {selectedType === 'concept_render' && (
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              theme === 'dark' ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50/50 border-purple-200'
            }`}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Kiến Trúc Sư AI & Phối Cảnh Ý Niệm (Google Banana AI)
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium">Ý tưởng / Prompt công trình kiến trúc:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setArchStyle('Rustic & Wabi-Sabi Nhà Vườn Bản Địa (Vật liệu tái chế, Gỗ-Đá mộc, Không gian mở & Xanh nhiệt đới Việt Nam)');
                        setArchPrompt('Nhà vườn phong cách Rustic & Wabi-Sabi tối giản bản địa Việt Nam: Cấu trúc gỗ cũ tái sinh, mảng tường đá ong xám thô mộc, mái ngói dốc vươn rộng đón gió, cửa trượt mở toang giao hòa với sân vườn nhiệt đới (chuối cảnh, tre trúc, hồ nước nhỏ), giếng trời thông gió xuyên phòng tự nhiên.');
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
                      title="Nạp mẫu Rustic Wabi-Sabi Nhà Vườn Việt Nam"
                    >
                      ✨ Mẫu: Rustic Wabi-Sabi Nhà Vườn VN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setArchStyle('Biophilic Sinh Thái & Hiện Đại (Eco-Living & Green Facade)');
                        setArchPrompt('Khuôn viên nghiên cứu sinh thái 3 tầng đa lớp: Giếng trời thông tầng xanh mát, mặt dựng lam gỗ tự nhiên và kính cản nhiệt Low-E, ban công vườn treo điều hòa vi khí hậu.');
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 cursor-pointer transition-colors"
                    >
                      🌿 Mẫu: Biophilic Sinh Thái
                    </button>
                  </div>
                </div>
                <textarea
                  value={archPrompt}
                  onChange={(e) => setArchPrompt(e.target.value)}
                  placeholder="Ví dụ: Thiết kế nhà vườn sinh thái phong cách Rustic & Wabi-Sabi tối giản với vật liệu gỗ tái chế, đá ong xám, hiên nhà rộng đón gió tự nhiên và sân vườn nhiệt đới Việt Nam..."
                  rows={3}
                  className={`w-full p-2.5 rounded-lg text-xs sm:text-sm outline-none border ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Phong cách kiến trúc:</label>
                  <select
                    value={archStyle}
                    onChange={(e) => setArchStyle(e.target.value)}
                    className={`w-full p-2 rounded-lg text-xs outline-none border cursor-pointer ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Rustic & Wabi-Sabi Nhà Vườn Bản Địa (Vật liệu tái chế, Gỗ-Đá mộc, Không gian mở & Xanh nhiệt đới Việt Nam)">
                      Rustic &amp; Wabi-Sabi Nhà Vườn Bản Địa (Gỗ/Đá Tái Chế, Mở &amp; Xanh VN)
                    </option>
                    <option value="Biophilic Sinh Thái & Hiện Đại (Eco-Living & Green Facade)">
                      Biophilic Sinh Thái &amp; Hiện Đại (Eco-Living)
                    </option>
                    <option value="Tối Giản Hiện Đại (Modern Minimalist & Clean Lines)">
                      Tối Giản Hiện Đại (Modern Minimalist)
                    </option>
                    <option value="Cổ Điển Đông Dương & Gỗ Mộc (Indochine Heritage)">
                      Cổ Điển Đông Dương &amp; Gỗ Mộc (Indochine Heritage)
                    </option>
                    <option value="Khắc Kỷ & Thiền Tĩnh (Wabi-sabi Shinbashira)">
                      Khắc Kỷ &amp; Thiền Tĩnh (Wabi-sabi Shinbashira)
                    </option>
                    <option value="Vị Lai Công Nghệ Cao (Futuristic Cyber-Architecture)">
                      Vị Lai Công Nghệ Cao (Futuristic)
                    </option>
                    <option value="Cảnh Quan Mở & Vườn Treo Thông Tầng (Atrium Sky-Garden)">
                      Cảnh Quan Mở &amp; Vườn Treo Thông Tầng
                    </option>
                    <option value="Nhà Vườn Truyền Thống Cải Tiến (Hiên Rộng, Mái Ngói, Hồ Nước)">
                      Nhà Vườn Truyền Thống Cải Tiến (Hiên Rộng, Mái Ngói)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Góc nhìn phối cảnh:</label>
                  <select
                    value={archAngle}
                    onChange={(e) => setArchAngle(e.target.value)}
                    className={`w-full p-2 rounded-lg text-xs outline-none border cursor-pointer ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Phối Cảnh Toàn Cảnh (Bird-eye / Aerial)">Phối Cảnh Toàn Cảnh (Bird-eye / Aerial)</option>
                    <option value="Mặt Tiền & Phối Cảnh Góc Phố (Eye-level Exterior)">Mặt Tiền &amp; Phối Cảnh Góc Phố</option>
                    <option value="Sảnh Thông Tầng & Không Gian Nội Thất (Interior Atrium)">Sảnh Thông Tầng &amp; Nội Thất Mở</option>
                    <option value="Phân Tầng Cắt Lớp Trục Đo (Axonometric Section)">Phân Tầng Cắt Lớp Trục Đo</option>
                  </select>
                </div>
              </div>

              {archPrompt.trim() && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">
                    Bấm để AI tạo thử bản vẽ ngay trong thẻ hoặc để tạo sau khi chèn
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateArchAI}
                    disabled={isGeneratingRender}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingRender ? 'Đang render...' : 'Render Phối Cảnh Thử Nghiệm'}</span>
                  </button>
                </div>
              )}

              {renderPreviewData && renderPreviewData.imageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-purple-500/40 max-h-48 mt-2">
                  <img
                    src={renderPreviewData.imageUrl}
                    alt={renderPreviewData.caption}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-purple-300">
                    Đã render thành công: {renderPreviewData.caption}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedType === 'paragraph' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Tiêu đề đoạn (tùy chọn):</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Phân tích động lực nội tại..."
                  className={`w-full p-2.5 rounded-lg text-xs sm:text-sm outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nội dung đoạn văn:</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung luận điểm hoặc phân tích tại đây..."
                  rows={4}
                  className={`w-full p-2.5 rounded-lg text-xs sm:text-sm outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {selectedType === 'quote' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Nội dung câu trích dẫn:</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ví dụ: 'Thiên địa bất nhân dĩ vạn vật vi sô cẩu'..."
                  rows={2}
                  className={`w-full p-2.5 rounded-lg text-xs sm:text-sm outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Tác giả:</label>
                  <input
                    type="text"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="Lão Tử"
                    className={`w-full p-2 rounded-lg text-xs outline-none border ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tác phẩm:</label>
                  <input
                    type="text"
                    value={quoteWork}
                    onChange={(e) => setQuoteWork(e.target.value)}
                    placeholder="Đạo Đức Kinh"
                    className={`w-full p-2 rounded-lg text-xs outline-none border ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Thời kỳ:</label>
                  <input
                    type="text"
                    value={quoteEra}
                    onChange={(e) => setQuoteEra(e.target.value)}
                    placeholder="Thế kỷ 6 TCN"
                    className={`w-full p-2 rounded-lg text-xs outline-none border ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Bản dịch tiếng Việt / Diễn giải nghĩa:</label>
                <input
                  type="text"
                  value={quoteTranslation}
                  onChange={(e) => setQuoteTranslation(e.target.value)}
                  placeholder="Trời đất công bằng, để vạn vật tự sinh tự diệt theo quy luật tự nhiên..."
                  className={`w-full p-2 rounded-lg text-xs outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Ý nghĩa thực chiến:</label>
                <input
                  type="text"
                  value={quoteInterpretation}
                  onChange={(e) => setQuoteInterpretation(e.target.value)}
                  placeholder="Vận dụng vào quản trị phi tập trung: Trao quyền tự chủ và xây dựng cơ chế tự cân bằng..."
                  className={`w-full p-2 rounded-lg text-xs outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {selectedType === 'blueprint_diagram' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Tiêu đề sơ đồ:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Quy Trình Vận Hành & Chuyển Hóa Tri Thức"
                  className={`w-full p-2.5 rounded-lg text-xs sm:text-sm outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Chuỗi các bước luồng (phân cách bằng dấu {'->'}):</label>
                <textarea
                  value={blueprintNodes}
                  onChange={(e) => setBlueprintNodes(e.target.value)}
                  rows={3}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-700'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mỗi bước kết nối với bước tiếp theo bằng dấu {'->'}. Ví dụ: Bước 1 {'->'} Bước 2 {'->'} Bước 3
                </p>
              </div>
            </div>
          )}

          {selectedType === 'code' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Tiêu đề khối mã:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Cấu hình Multi-Agent Swarm"
                    className={`w-full p-2 rounded-lg text-xs outline-none border ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ngôn ngữ:</label>
                  <input
                    type="text"
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    placeholder="typescript, python, json, bash..."
                    className={`w-full p-2 rounded-lg text-xs outline-none border ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nội dung mã nguồn:</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="// Nhập mã nguồn vào đây..."
                  rows={4}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-indigo-300' : 'bg-white border-slate-300 text-indigo-700'
                  }`}
                />
              </div>
            </div>
          )}

          {selectedType === 'bullet' && (
            <div>
              <label className="block text-xs font-medium mb-1">Nội dung điểm nhấn:</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ví dụ: Thiết lập quy chế đồng thuận động giữa các tác tử..."
                rows={3}
                className={`w-full p-2.5 rounded-lg text-xs sm:text-sm outline-none border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          {selectedType === 'table' && (
            <div>
              <label className="block text-xs font-medium mb-1">Nội dung bảng Markdown:</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`| Cột 1 | Cột 2 | Cột 3 |\n| :--- | :--- | :--- |\n| Dữ liệu 1 | Dữ liệu 2 | Dữ liệu 3 |`}
                rows={4}
                className={`w-full p-2.5 rounded-lg text-xs font-mono outline-none border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Chèn Thẻ Vào Đề Án</span>
          </button>
        </div>
      </div>
    </div>
  );
};
