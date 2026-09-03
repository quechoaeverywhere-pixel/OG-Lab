import React, { useState, useEffect } from 'react';
import { Copy, Check, Table as TableIcon, Edit3, X, Save, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { normalizeMarkdownTables } from '../utils/markdownSanitizer';
import { AtomicContentUnit } from '../utils/atomicContentParser';
import { usePermission } from '../contexts/PermissionContext';
import { AtomicAIReviser } from './AtomicAIReviser';

interface AtomicTableCardProps {
  unit: AtomicContentUnit;
  theme: 'dark' | 'light';
  contextInfo?: string;
  onUpdateUnit?: (unitId: string, newContent: string) => void;
}

export const AtomicTableCard: React.FC<AtomicTableCardProps> = ({
  unit,
  theme,
  contextInfo,
  onUpdateUnit
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(unit.content);

  useEffect(() => {
    setDraft(unit.content);
  }, [unit.content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(unit.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    requirePermission('compose_article', () => {
      setIsEditing(true);
    }, {
      title: 'Khóa Chỉnh Sửa Bảng So Sánh',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa bảng đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa bảng.'
    });
  };

  const handleSave = () => {
    requirePermission('compose_article', () => {
      if (onUpdateUnit) {
        onUpdateUnit(unit.id, draft);
      }
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setDraft(unit.content);
    setIsEditing(false);
  };

  return (
    <div id={unit.id} className="group relative my-5 transition-all">
      {/* Table Top Header & Quick Actions */}
      <div className="flex items-center justify-between mb-2 text-[11px] font-mono select-none px-1">
        <div className={`flex items-center gap-1.5 font-bold tracking-wide ${
          theme === 'dark' ? 'text-indigo-400' : 'text-indigo-800'
        }`}>
          <TableIcon className="w-3.5 h-3.5" />
          <span>BẢNG ĐỐI CHIẾU & PHÂN TÍCH TỔNG HỢP</span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          {onUpdateUnit && !isEditing && (
            <button
              onClick={handleStartEdit}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] border ${
                !canEditContent
                  ? 'hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : theme === 'dark'
                  ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-indigo-300 hover:border-indigo-500'
                  : 'bg-white border-slate-300 text-slate-600 hover:text-indigo-700 shadow-xs'
              }`}
              title={!canEditContent ? 'Tính năng sửa bảng đang bị khóa (Bấm để xem quyền)' : 'Chỉnh sửa bảng'}
            >
              {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3 text-indigo-500" />}
              <span>Sửa bảng</span>
            </button>
          )}
          {!isEditing && (
            <button
              onClick={handleCopy}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] border ${
                theme === 'dark'
                  ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-indigo-300 hover:border-indigo-500'
                  : 'bg-white border-slate-300 text-slate-600 hover:text-indigo-700 shadow-xs'
              }`}
              title="Sao chép bảng Markdown"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Đã chép' : 'Chép bảng'}</span>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className={`space-y-2 p-3.5 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-900/95 border-indigo-500/50' : 'bg-slate-50 border-indigo-300 shadow-sm'
        }`}>
          <div className="text-[11px] font-mono text-slate-400">
            Định dạng bảng Markdown (Dùng ký tự `|` để phân cách các cột):
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={Math.max(5, draft.split('\n').length + 1)}
            className={`w-full p-3 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500 border ${
              theme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
            }`}
            autoFocus
          />
          <AtomicAIReviser draft={draft} setDraft={setDraft} unitType="Bảng biểu" theme={theme} contextInfo={contextInfo} />
          <div className="flex items-center justify-end gap-2 text-xs font-mono mt-1">
            <button
              onClick={handleCancel}
              className={`px-3 py-1 rounded-xl flex items-center gap-1 cursor-pointer ${
                theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <X className="w-3 h-3" />
              <span>Hủy</span>
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Save className="w-3 h-3" />
              <span>Lưu bảng</span>
            </button>
          </div>
        </div>
      ) : (
        /* Spacious, Airy Table Container with refined typography and rhythm */
        <div
          className={`w-full overflow-x-auto rounded-2xl border transition-all duration-200 shadow-sm ${
            theme === 'dark'
              ? 'bg-[#0e111a]/80 border-slate-800/90 shadow-slate-950/40'
              : 'bg-white border-slate-200 shadow-slate-100'
          }`}
        >
          <div className="min-w-[620px] p-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                table: ({ node, ...props }) => (
                  <table className="w-full text-left border-collapse table-auto" {...props} />
                ),
                thead: ({ node, ...props }) => (
                  <thead
                    className={`border-b ${
                      theme === 'dark'
                        ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    {...props}
                  />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className={`py-3.5 px-5 md:px-6 font-bold text-xs md:text-sm tracking-wide font-sans border-r last:border-r-0 ${
                      theme === 'dark'
                        ? 'text-indigo-300 border-slate-800/80'
                        : 'text-indigo-950 border-slate-200/80'
                    }`}
                    {...props}
                  />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody
                    className={`divide-y text-xs md:text-[14.5px] leading-relaxed ${
                      theme === 'dark' ? 'divide-slate-800/60' : 'divide-slate-100'
                    }`}
                    {...props}
                  />
                ),
                tr: ({ node, ...props }) => (
                  <tr
                    className={`transition-colors duration-150 ${
                      theme === 'dark'
                        ? 'hover:bg-slate-900/50'
                        : 'hover:bg-slate-50/80'
                    }`}
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className={`py-4 px-5 md:px-6 align-top font-sans border-r last:border-r-0 first:font-medium ${
                      theme === 'dark'
                        ? 'text-slate-300 border-slate-800/40 first:text-slate-200'
                        : 'text-slate-700 border-slate-100 first:text-slate-900'
                    }`}
                    {...props}
                  />
                ),
              }}
            >
              {normalizeMarkdownTables(unit.content || '')}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
