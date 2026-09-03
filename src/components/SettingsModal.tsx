import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  Sliders,
  ShieldCheck,
  Globe,
  Brain,
  Lock,
  Unlock,
  AlertCircle,
  Download,
  Upload,
  Database,
  FileJson,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { GeminiSettings, Dossier, LexiconTerm, CitationItem } from '../types';
import { usePermission } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  settings?: GeminiSettings;
  onSaveSettings?: (settings: GeminiSettings) => void;
  dossiers?: Dossier[];
  lexicon?: LexiconTerm[];
  citations?: CitationItem[];
  disciplines?: any[];
  onRestoreBackup?: (backupData: {
    dossiers?: Dossier[];
    lexicon?: LexiconTerm[];
    citations?: CitationItem[];
    disciplines?: any[];
    geminiSettings?: GeminiSettings;
  }) => Promise<void> | void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  settings: initialSettings,
  onSaveSettings,
  dossiers = [],
  lexicon = [],
  citations = [],
  disciplines = [],
  onRestoreBackup
}) => {
  const {
    isContentEditLocked,
    setContentEditLocked,
    isOwner,
    requireSessionLock,
    setRequireSessionLock
  } = usePermission();
  const { user } = useAuth();
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [lockNotice, setLockNotice] = useState('');

  const [model, setModel] = useState('gemini-3.7-flash');
  const [temperature, setTemperature] = useState(0.3);
  const [topP, setTopP] = useState(0.85);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(true);
  const [systemInstruction, setSystemInstruction] = useState(
    'Bạn là Học giả Cao cấp & Kiến trúc sư Trưởng của OG Agentic Intelligence Lab (Oneness Governance). Slogan cốt lõi: "Deep Research & Knowledge Transforming" (Chuyển Hóa Tri Thức). Nhiệm vụ của bạn là nghiên cứu sâu theo 4 Cấp độ Phân tầng Học thuật (Bản Thể, Cơ Chế, Kiến Trúc CS, Biện Chứng), nhưng khi xuất bản báo cáo, TOÀN BỘ nội dung phải được chuyển hóa sang ngôn ngữ đời thường, gãy gọn và thực chiến để ai đọc cũng hiểu và hành động được; đồng thời tự động trích xuất các thuật ngữ chuyên môn vào Sổ Từ Điển Thuật Ngữ để người đọc tra cứu.'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup & Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupNotice, setBackupNotice] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('og_gemini_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.model) setModel(parsed.model);
          if (parsed.temperature !== undefined) setTemperature(parsed.temperature);
          if (parsed.topP !== undefined) setTopP(parsed.topP);
          if (parsed.enableSearchGrounding !== undefined) setEnableSearchGrounding(parsed.enableSearchGrounding);
          if (parsed.systemInstruction) setSystemInstruction(parsed.systemInstruction);
        } else if (initialSettings) {
          setModel(initialSettings.model);
          setTemperature(initialSettings.temperature);
          setTopP(initialSettings.topP);
          setEnableSearchGrounding(initialSettings.enableSearchGrounding);
          setSystemInstruction(initialSettings.systemInstruction);
        }
      } catch (e) {}
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newSettings: GeminiSettings = {
      model,
      temperature,
      topP,
      enableSearchGrounding,
      systemInstruction
    };

    localStorage.setItem('og_gemini_settings', JSON.stringify(newSettings));
    if (onSaveSettings) {
      onSaveSettings(newSettings);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  // 1-Click Backup Export Handler
  const handleExportFullBackup = () => {
    setIsExporting(true);
    setBackupNotice(null);
    try {
      const backupPayload = {
        application: "Oneness Governance",
        version: "1.0",
        exportTimestamp: new Date().toISOString(),
        exportedBy: user?.email || "anonymous_scholar",
        stats: {
          dossiersCount: dossiers.length,
          lexiconCount: lexicon.length,
          citationsCount: citations.length,
          disciplinesCount: disciplines.length
        },
        dossiers,
        lexicon,
        citations,
        disciplines,
        geminiSettings: {
          model,
          temperature,
          topP,
          enableSearchGrounding,
          systemInstruction
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `oneness_governance_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupNotice({
        success: true,
        message: `Đã xuất file JSON thành công! (${dossiers.length} hồ sơ, ${lexicon.length} thuật ngữ, ${citations.length} trích dẫn)`
      });
    } catch (err: any) {
      setBackupNotice({
        success: false,
        message: `Lỗi xuất file sao lưu: ${err?.message || 'Không xác định'}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 1-Click Backup Import Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBackupNotice(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation check
        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('Định dạng file JSON không hợp lệ.');
        }

        const restoredDossiers = Array.isArray(parsed.dossiers) ? parsed.dossiers : null;
        const restoredLexicon = Array.isArray(parsed.lexicon) ? parsed.lexicon : null;
        const restoredCitations = Array.isArray(parsed.citations) ? parsed.citations : null;
        const restoredDisciplines = Array.isArray(parsed.disciplines) ? parsed.disciplines : null;

        if (!restoredDossiers && !restoredLexicon && !restoredCitations) {
          throw new Error('File JSON không chứa dữ liệu hồ sơ hoặc từ điển của Oneness Governance.');
        }

        const confirmMsg = `Xác nhận phục hồi dữ liệu từ bản sao lưu:\n• Hồ sơ: ${restoredDossiers?.length || 0}\n• Thuật ngữ: ${restoredLexicon?.length || 0}\n• Trích dẫn: ${restoredCitations?.length || 0}\n\nBạn có muốn ghi đè/hòa giải dữ liệu này không?`;
        if (!window.confirm(confirmMsg)) {
          setIsImporting(false);
          return;
        }

        if (onRestoreBackup) {
          await onRestoreBackup({
            dossiers: restoredDossiers || undefined,
            lexicon: restoredLexicon || undefined,
            citations: restoredCitations || undefined,
            disciplines: restoredDisciplines || undefined,
            geminiSettings: parsed.geminiSettings || undefined
          });
        }

        if (parsed.geminiSettings) {
          if (parsed.geminiSettings.model) setModel(parsed.geminiSettings.model);
          if (parsed.geminiSettings.temperature !== undefined) setTemperature(parsed.geminiSettings.temperature);
          if (parsed.geminiSettings.topP !== undefined) setTopP(parsed.geminiSettings.topP);
          if (parsed.geminiSettings.enableSearchGrounding !== undefined) setEnableSearchGrounding(parsed.geminiSettings.enableSearchGrounding);
          if (parsed.geminiSettings.systemInstruction) setSystemInstruction(parsed.geminiSettings.systemInstruction);
        }

        setBackupNotice({
          success: true,
          message: `Phục hồi thành công! Đã nạp ${restoredDossiers?.length || 0} hồ sơ và ${restoredLexicon?.length || 0} thuật ngữ.`
        });
      } catch (err: any) {
        setBackupNotice({
          success: false,
          message: `Lỗi nạp file sao lưu: ${err?.message || 'Không thể đọc file'}`
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      setBackupNotice({ success: false, message: 'Lỗi đọc file từ máy tính.' });
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Cấu Hình Hệ Thống & Sao Lưu</h2>
              <p className="text-xs text-slate-400 font-mono">Bảo vệ quyền biên tập, tham số AI & Sao lưu 1-Click</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Content Edit Lock - Owner Only Control */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            theme === 'dark'
              ? 'bg-slate-950/60 border-purple-500/30'
              : 'bg-purple-50/40 border-purple-200'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {isContentEditLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                  <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                    Khóa Tính Năng Sửa Nội Dung & Tiêu Đề
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    isContentEditLocked
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {isContentEditLocked ? 'Đang Khóa (Chỉ Đọc)' : 'Đang Mở (Cho Phép Sửa)'}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Khi bật khóa, các nút sửa tiêu đề, sửa tóm tắt, thẻ nguyên tử và bảng biểu sẽ bị khoá hoàn toàn. Chỉ tài khoản Owner (<strong>quechoa.everywhere@gmail.com</strong>) mới có quyền mở khóa.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <label className={`relative inline-flex items-center ${isOwner ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                  <input
                    type="checkbox"
                    checked={isContentEditLocked}
                    disabled={!isOwner || isTogglingLock}
                    onChange={async (e) => {
                      if (!isOwner) return;
                      setIsTogglingLock(true);
                      const res = await setContentEditLocked(e.target.checked);
                      setLockNotice(res.message || '');
                      setTimeout(() => setLockNotice(''), 3500);
                      setIsTogglingLock(false);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Session Guard Toggle */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                  Tự Động Khóa Phiên Trình Duyệt (Shinbashira Guard)
                </span>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Yêu cầu mở khóa màn hình bảo vệ mỗi khi truy cập hoặc mở tab mới.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={requireSessionLock}
                  onChange={e => setRequireSessionLock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Owner State Status Bar */}
            <div className={`pt-2 border-t text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 ${
              theme === 'dark' ? 'border-slate-800' : 'border-purple-200/60'
            }`}>
              {isOwner ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>✓ Đã xác thực Chủ Sở Hữu (Owner) — Toàn quyền cấu hình bảo mật</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>🔒 Quyền hạn được bảo vệ bởi Chủ Sở Hữu (Owner)</span>
                </span>
              )}

              {lockNotice && (
                <span className="text-purple-300 font-bold animate-in fade-in">
                  {lockNotice}
                </span>
              )}
            </div>
          </div>

          {/* 2. 1-Click Full System Backup & Restore */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold font-tech text-xs uppercase">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Sao Lưu & Phục Hồi Toàn Bộ Dữ Liệu (1-Click JSON Backup & Restore)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {dossiers.length} hồ sơ • {lexicon.length} từ điển • {citations.length} trích dẫn
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Xuất toàn bộ công trình khảo luận học thuật, sổ từ điển, trích dẫn kinh điển và cài đặt hệ thống thành một file JSON duy nhất để lưu trữ an toàn trên máy tính cá nhân.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportFullBackup}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-tech text-xs font-bold uppercase flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Xuất File JSON Sao Lưu</span>
              </button>

              {/* Import Button */}
              <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-tech text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-98">
                {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Upload className="w-3.5 h-3.5 text-purple-400" />}
                <span>Phục Hồi Từ File JSON</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {backupNotice && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-sans animate-in fade-in ${
                backupNotice.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {backupNotice.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{backupNotice.message}</span>
              </div>
            )}
          </div>

          {/* 3. Active Model */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider font-mono block ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-700'
            }`}>
              Mô Hình Mặc Định
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-mono outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 shadow-xs'
              }`}
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Mặc định - Reasoning & Đa ngành)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Siêu nhẹ & Tức thì)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest (Siêu tốc & Ổn định)</option>
            </select>
          </div>

          {/* 4. Search Grounding */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                }`}>Google Search Grounding</span>
              </div>
              <p className={`text-[11px] ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Tự động đối soát tài liệu mới từ IEEE/ACM, arXiv và whitepapers thực tế
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSearchGrounding}
                onChange={e => setEnableSearchGrounding(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* 5. Temperature & TopP Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Temperature</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>{temperature}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Thấp (0.1 - 0.3) cho học thuật chuẩn xác; Cao cho sáng tạo</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>TopP</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>{topP}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={topP}
                onChange={e => setTopP(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Giới hạn không gian phân phối xác suất từ ngữ</p>
            </div>
          </div>

          {/* 6. System Instruction */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider font-mono block ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-700'
            }`}>
              Chỉ Thị Hệ Thống Cốt Lõi (System Instruction)
            </label>
            <textarea
              rows={4}
              value={systemInstruction}
              onChange={e => setSystemInstruction(e.target.value)}
              className={`w-full p-3 rounded-xl border text-xs outline-none leading-relaxed transition-all resize-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 shadow-xs'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 px-6 border-t flex items-center justify-between shrink-0 ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20 transition-all"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{savedSuccess ? 'Đã Lưu Thành Công' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
