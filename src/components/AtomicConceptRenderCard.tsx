import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  Maximize2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Compass,
  Sun,
  Palette,
  X,
  Lock
} from 'lucide-react';
import { AtomicContentUnit, ConceptRenderData } from '../types';

interface AtomicConceptRenderCardProps {
  unit: AtomicContentUnit;
  theme?: 'dark' | 'light';
  contextInfo?: string;
  onUpdateUnit?: (unitId: string, newUnit: Partial<AtomicContentUnit>) => void;
  onDeleteUnit?: (unitId: string) => void;
  onMoveUnit?: (unitId: string, direction: 'up' | 'down') => void;
  canEditContent?: boolean;
}

const STYLE_OPTIONS = [
  'Rustic & Wabi-Sabi Nhà Vườn Bản Địa (Vật liệu tái chế, Gỗ-Đá mộc, Không gian mở & Xanh nhiệt đới Việt Nam)',
  'Biophilic Sinh Thái & Hiện Đại (Eco-Living & Green Facade)',
  'Tối Giản Hiện Đại (Modern Minimalist & Clean Lines)',
  'Cổ Điển Đông Dương & Gỗ Mộc (Indochine Heritage)',
  'Khắc Kỷ & Thiền Tĩnh (Wabi-sabi Shinbashira)',
  'Vị Lai Công Nghệ Cao (Futuristic Cyber-Architecture)',
  'Cảnh Quan Mở & Vườn Treo Thông Tầng (Atrium Sky-Garden)',
  'Nhà Vườn Truyền Thống Cải Tiến (Hiên Rộng, Mái Ngói, Hồ Nước)'
];

const VIEW_ANGLES = [
  'Phối Cảnh Toàn Cảnh (Bird-eye / Aerial)',
  'Mặt Tiền & Phối Cảnh Góc Phố (Eye-level Exterior)',
  'Sảnh Thông Tầng & Không Gian Nội Thất (Interior Atrium)',
  'Phân Tầng Cắt Lớp Trục Đo (Axonometric Section)'
];

export const AtomicConceptRenderCard: React.FC<AtomicConceptRenderCardProps> = ({
  unit,
  theme = 'dark',
  contextInfo = '',
  onUpdateUnit,
  onDeleteUnit,
  onMoveUnit,
  canEditContent = true
}) => {
  const data: ConceptRenderData = unit.conceptRenderData || {
    imageUrl: '',
    prompt: unit.content || 'Phối cảnh ý niệm không gian kiến trúc',
    caption: unit.title || 'Phối Cảnh Không Gian Kiến Trúc'
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(!data.imageUrl);
  const [promptDraft, setPromptDraft] = useState(data.prompt || unit.content || '');
  const [styleDraft, setStyleDraft] = useState(data.style || STYLE_OPTIONS[0]);
  const [angleDraft, setAngleDraft] = useState(data.viewAngle || VIEW_ANGLES[0]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showZoningDetails, setShowZoningDetails] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!promptDraft.trim()) return;
    setIsRegenerating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/gemini/generate-concept-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptDraft.trim(),
          style: styleDraft,
          viewAngle: angleDraft,
          contextInfo,
          aspectRatio: '16:9'
        })
      });

      const result = await res.json();
      if (result.success && result.data) {
        const renderData: ConceptRenderData = result.data;
        if (onUpdateUnit) {
          onUpdateUnit(unit.id, {
            content: renderData.prompt,
            title: renderData.caption,
            conceptRenderData: renderData,
            rawMarkdown: `\`\`\`concept-render\n${JSON.stringify(renderData, null, 2)}\n\`\`\``
          });
        }
        setIsEditingPrompt(false);
      } else {
        setErrorMsg(result.error || 'Không thể tạo phối cảnh. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error generating concept render:', err);
      setErrorMsg(err.message || 'Lỗi mạng khi kết nối máy chủ kiến trúc.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(data.refinedPrompt || data.prompt || unit.content);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div
      id={unit.id}
      className={`group relative my-4 rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
        theme === 'dark'
          ? 'bg-slate-900/90 border-purple-500/30 hover:border-purple-500/50'
          : 'bg-white border-purple-200 hover:border-purple-300'
      }`}
    >
      {/* Top Header Bar */}
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
        theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg flex items-center justify-center ${
            theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
          }`}>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-700'
              }`}>
                Kiến Trúc Sư AI & Phối Cảnh Ý Niệm
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                Google Banana AI
              </span>
            </div>
            <h4 className={`text-sm font-semibold truncate ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {data.caption || unit.title || 'Phối Cảnh Công Trình Kiến Trúc'}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {onMoveUnit && (
            <>
              <button
                onClick={() => onMoveUnit(unit.id, 'up')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Di chuyển lên trên"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveUnit(unit.id, 'down')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Di chuyển xuống dưới"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {canEditContent && (
            <button
              onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                theme === 'dark'
                  ? 'hover:bg-purple-900/40 text-purple-300'
                  : 'hover:bg-purple-100 text-purple-700'
              }`}
              title="Chỉnh sửa prompt & tạo lại"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Tùy chỉnh Prompt</span>
            </button>
          )}

          {data.imageUrl && (
            <button
              onClick={() => setIsFullscreen(true)}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Xem toàn màn hình"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDeleteUnit && canEditContent && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa thẻ phối cảnh kiến trúc này không?')) {
                  onDeleteUnit(unit.id);
                }
              }}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer text-rose-400 hover:bg-rose-500/20`}
              title="Xóa thẻ này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 space-y-4">
        {/* If Editing Prompt or Generating */}
        {isEditingPrompt && (
          <div className={`p-4 rounded-xl border space-y-3.5 ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5" /> Thiết lập ý tưởng kiến trúc & phối cảnh
              </span>
              {data.imageUrl && (
                <button
                  onClick={() => setIsEditingPrompt(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Đóng thiết lập
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Ý tưởng công trình / Prompt kiến trúc & không gian:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setStyleDraft(STYLE_OPTIONS[0]);
                      setPromptDraft('Biệt thự nhà vườn nhiệt đới Việt Nam phong cách Rustic kết hợp Wabi-Sabi tối giản: Sử dụng kết cấu gỗ cũ tái sinh, tường đá ong xám thô mộc, mái hiên ngói truyền thống vươn rộng đón gió, hệ cửa xoay kính lớn mở toang kết nối sân vườn cây xanh bản địa (chuối cảnh, tre trúc, hồ súng tĩnh lặng), giếng trời thông gió đối lưu tự nhiên.');
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
                    title="Nạp mẫu Rustic Wabi-Sabi Nhà Vườn Việt Nam"
                  >
                    ✨ Mẫu: Rustic Wabi-Sabi Nhà Vườn VN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStyleDraft(STYLE_OPTIONS[1]);
                      setPromptDraft('Trụ sở nghiên cứu Oneness Governance đa tầng sinh thái Biophilic: Giếng trời thông gió trung tâm, ban công phủ dây leo xanh mát, mặt dựng lam gỗ tự nhiên và kính Low-E cản nhiệt, sân thượng năng lượng xanh.');
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 cursor-pointer transition-colors"
                  >
                    🌿 Mẫu: Biophilic Sinh Thái
                  </button>
                </div>
              </div>
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                placeholder="Ví dụ: Thiết kế nhà vườn phong cách Rustic & Wabi-Sabi tối giản với vật liệu gỗ tái sinh, đá ong xám, hiên nhà rộng đón gió mát và sân vườn nhiệt đới Việt Nam..."
                rows={3}
                className={`w-full p-2.5 rounded-lg text-sm outline-none border transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-purple-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Phong cách kiến trúc:
                </label>
                <select
                  value={styleDraft}
                  onChange={(e) => setStyleDraft(e.target.value)}
                  className={`w-full p-2 rounded-lg text-xs outline-none border cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {STYLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Góc nhìn phối cảnh:
                </label>
                <select
                  value={angleDraft}
                  onChange={(e) => setAngleDraft(e.target.value)}
                  className={`w-full p-2 rounded-lg text-xs outline-none border cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {VIEW_ANGLES.map((angle) => (
                    <option key={angle} value={angle}>
                      {angle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleGenerate}
                disabled={isRegenerating || !promptDraft.trim()}
                className="px-4 py-2 rounded-lg font-medium text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang render phối cảnh AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{data.imageUrl ? 'Tạo lại phối cảnh mới' : 'Khởi tạo phối cảnh kiến trúc'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Visual Perspective Display */}
        {data.imageUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group/img">
              <img
                src={data.imageUrl}
                alt={data.caption || 'Phối cảnh kiến trúc'}
                className="w-full max-h-[500px] object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.01]"
                referrerPolicy="no-referrer"
              />

              {/* Floating Image Control Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 rounded text-white hover:bg-slate-800 cursor-pointer"
                  title="Phóng to"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <a
                  href={data.imageUrl}
                  download={`concept-render-${Date.now()}.png`}
                  className="p-1.5 rounded text-white hover:bg-slate-800 cursor-pointer"
                  title="Tải ảnh về máy"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {/* Bottom Style Badge */}
              <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-950/85 backdrop-blur-md text-purple-300 border border-purple-500/30">
                  {data.style || styleDraft}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-950/85 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                  {data.viewAngle || angleDraft}
                </span>
              </div>
            </div>

            {/* Architectural Breakdown & Spatial Dynamics Tabs */}
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              theme === 'dark' ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    Phân Tích Cấu Trúc Không Gian & Vật Liệu
                  </span>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className={`text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                    theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Sao chép prompt thiết kế"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép Prompt</span>
                    </>
                  )}
                </button>
              </div>

              {/* Spatial Zoning Matrix */}
              {data.spatialZoning && data.spatialZoning.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data.spatialZoning.map((z, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                        theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <div className="text-xs">
                        <span className={`font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                          {z.zone}
                        </span>
                        <p className={`mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          {z.function}
                        </p>
                        {z.flowRate && (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {z.flowRate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Material Palette & Climate Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {data.materialPalette && data.materialPalette.length > 0 && (
                  <div className="space-y-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <Palette className="w-3 h-3 text-amber-400" /> Bảng Vật Liệu Chủ Đạo
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.materialPalette.map((mat, mIdx) => (
                        <span
                          key={mIdx}
                          className={`text-xs px-2 py-0.5 rounded font-medium border ${
                            theme === 'dark'
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.climateLighting && (
                  <div className="space-y-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <Sun className="w-3 h-3 text-cyan-400" /> Vi Khí Hậu & Chiếu Sáng
                    </span>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {data.climateLighting}
                    </p>
                  </div>
                )}
              </div>

              {/* Design Philosophy Footnote */}
              {data.designPhilosophy && (
                <div className={`p-2.5 rounded-lg border text-xs italic ${
                  theme === 'dark'
                    ? 'bg-purple-950/20 border-purple-500/20 text-purple-300'
                    : 'bg-purple-50 border-purple-200 text-purple-800'
                }`}>
                  <span className="font-semibold not-italic">Triết lý kiến trúc Shinbashira: </span>
                  {data.designPhilosophy}
                </div>
              )}
            </div>
          </div>
        ) : (
          !isEditingPrompt && (
            <div className={`p-8 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 ${
              theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
            }`}>
              <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h5 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Chưa khởi tạo phối cảnh công trình
                </h5>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Nhập ý tưởng công trình kiến trúc hoặc phối cảnh không gian để Kiến Trúc Sư AI (Google Banana AI) phân tích và vẽ phối cảnh.
                </p>
              </div>
              <button
                onClick={() => setIsEditingPrompt(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nhập ý tưởng & vẽ phối cảnh</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && data.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={data.imageUrl}
              download={`concept-render-${Date.now()}.png`}
              className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 cursor-pointer transition-colors"
              title="Tải ảnh về máy"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 cursor-pointer transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-6xl max-h-[85vh] flex flex-col items-center">
            <img
              src={data.imageUrl}
              alt={data.caption || 'Phối cảnh kiến trúc'}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-slate-800"
              referrerPolicy="no-referrer"
            />
            <div className="mt-3 text-center">
              <h3 className="text-white font-bold text-base md:text-lg">{data.caption}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{data.style} • {data.viewAngle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
