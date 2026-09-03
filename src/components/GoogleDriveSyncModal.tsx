import React, { useState, useEffect } from 'react';
import { X, HardDrive, RefreshCw, UploadCloud, CheckCircle2, AlertTriangle, ShieldCheck, FileText, BookOpen, Quote } from 'lucide-react';
import { Dossier, LexiconTerm, CitationItem } from '../types';
import {
  getStoredDriveToken,
  requestGoogleDriveToken,
  clearDriveToken,
  syncAllDocumentsToDrive
} from '../utils/googleDriveSync';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  dossiers: Dossier[];
  lexicon?: LexiconTerm[];
  citations?: CitationItem[];
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  theme,
  dossiers,
  lexicon = [],
  citations = []
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredDriveToken();
      setToken(stored);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    try {
      const newToken = await requestGoogleDriveToken();
      setToken(newToken);
      setSuccessMessage('Đã kết nối thành công với Google Drive!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đăng nhập Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearDriveToken();
    setToken(null);
    setSuccessMessage('Đã ngắt kết nối Google Drive.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePushToDrive = async () => {
    let activeToken = token;
    if (!activeToken) {
      try {
        activeToken = await requestGoogleDriveToken();
        setToken(activeToken);
      } catch (e: any) {
        setErrorMessage(e.message || 'Cần đăng nhập Google Drive để đồng bộ.');
        return;
      }
    }

    setIsSyncing(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSyncStatusText('Đang sao lưu 3 loại tài liệu (Hồ sơ, Sổ Từ điển & Trích dẫn) lên Google Drive...');

    try {
      const res = await syncAllDocumentsToDrive(
        activeToken,
        dossiers,
        lexicon,
        citations,
        (curr, total, name) => {
          setProgress({ current: curr, total, name });
        }
      );
      setSuccessMessage(
        `✓ Đã sao lưu 1 chiều thành công toàn bộ tài liệu lên Google Drive (thư mục: OG_Research_Lab)! ` +
        `[${res.dossierCount} Hồ sơ, ${res.lexiconCount} Từ điển, ${res.citationCount} Trích dẫn]`
      );
      setProgress(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sao lưu lên Google Drive thất bại.');
    } finally {
      setIsSyncing(false);
      setSyncStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                Sao Lưu 1 Chiều Lên Google Drive
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold">
                  1-Way Backup
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">Xuất dữ liệu 1 chiều từ App ➔ Google Drive (OG_Research_Lab)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Connection Status Box */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            token
              ? theme === 'dark' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              : theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${token ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <p className="text-xs font-bold font-mono">
                  {token ? 'Đã Kết Nối Google Drive' : 'Chưa Kết Nối Google Drive'}
                </p>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {token
                    ? 'Toàn bộ bài viết sẽ lưu dạng Markdown (.md) trong thư mục OG_Research_Lab'
                    : 'Đăng nhập Google để sao lưu bài viết về Drive cá nhân của bạn'}
                </p>
              </div>
            </div>

            {token ? (
              <button
                onClick={handleDisconnect}
                className="text-xs font-mono text-slate-400 hover:text-rose-400 underline cursor-pointer shrink-0"
              >
                Ngắt kết nối
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 shrink-0"
              >
                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                <span>Kết Nối Ngay</span>
              </button>
            )}
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Document Asset Status Counter Cards */}
          <div className="grid grid-cols-3 gap-2 font-mono">
            <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-blue-400">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Hồ sơ</span>
              </div>
              <span className="text-base font-bold text-slate-200">{dossiers.length}</span>
              <span className="text-[9px] text-slate-500 font-mono">/Ho_So_Nghien_Cuu</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-purple-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Từ điển</span>
              </div>
              <span className="text-base font-bold text-slate-200">{lexicon.length}</span>
              <span className="text-[9px] text-slate-500 font-mono">/Tu_Dien_Thuat_Ngu</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Quote className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Trích dẫn</span>
              </div>
              <span className="text-base font-bold text-slate-200">{citations.length}</span>
              <span className="text-[9px] text-slate-500 font-mono">/Trich_Dan_Kinh_Dien</span>
            </div>
          </div>

          {/* Sync Actions Box */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
            }`}>
              Thao Tác Sao Lưu (App ➔ Google Drive)
            </h3>

            <button
              onClick={handlePushToDrive}
              disabled={isSyncing}
              className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 group cursor-pointer ${
                theme === 'dark'
                  ? 'bg-blue-950/30 border-blue-500/40 hover:border-blue-400 hover:bg-blue-900/40'
                  : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-600 text-white font-bold">
                  App ➔ Google Drive
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-200 group-hover:text-blue-300 flex items-center gap-2">
                  <span>Đẩy Toàn Bộ Dữ Liệu Lên Google Drive</span>
                  {isSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Đồng bộ 1 chiều: Phân loại và sao lưu 3 danh mục vào các thư mục con tương ứng (<span className="font-mono text-blue-300">Ho_So_Nghien_Cuu</span>, <span className="font-mono text-purple-300">Tu_Dien_Thuat_Ngu</span>, <span className="font-mono text-amber-300">Trich_Dan_Kinh_Dien</span>).
                </p>
              </div>
            </button>
          </div>

          {/* Progress Indicator */}
          {progress && (
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2 font-mono">
              <div className="flex justify-between text-xs text-blue-300">
                <span>Đang sao lưu: {progress.name}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Explanation Banner */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cơ Chế Đồng Bộ 1 Chiều An Toàn</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Ứng dụng thực thi cơ chế <strong>Đồng bộ 1 chiều (App ➔ Google Drive)</strong>. Dữ liệu trên ứng dụng của bạn là Nguồn Sự Thật duy nhất (Source of Truth). Việc xóa Hồ sơ, Từ điển hay Trích dẫn trong ứng dụng sẽ <strong>không bao giờ bị ghi đè hay khôi phục ngược từ Drive</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 px-6 border-t flex items-center justify-end shrink-0 ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
