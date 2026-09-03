import React from 'react';
import { X, User, ShieldCheck } from 'lucide-react';
import { AccountDashboard } from './AccountDashboard';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="account-modal-container"
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-[#0f0e1d] border-slate-800 text-slate-100 shadow-purple-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              theme === 'dark' ? 'bg-purple-950/50 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-800'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display-title leading-tight">
                Tài Khoản Học Giả & Trạng Thái Phân Quyền
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Quản lý danh tính, khóa bảo mật Shinbashira & hạn mức truy cập
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AccountDashboard theme={theme} />
        </div>
      </div>
    </div>
  );
};
