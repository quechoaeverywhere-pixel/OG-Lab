import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Copy,
  Check,
  Trash2,
  Save,
  X,
  Sparkles
} from 'lucide-react';
import { LexiconTerm } from '../../types';
import { AutoScrollText } from '../AutoScrollText';

interface SidebarLexiconTabProps {
  filteredLexicon: LexiconTerm[];
  onAddLexiconTerm: (term: LexiconTerm) => void;
  onDeleteLexiconTerm?: (id: string) => void;
  copiedId: string | null;
  onCopyText: (id: string, text: string) => void;
  theme: 'dark' | 'light';
}

export const SidebarLexiconTab: React.FC<SidebarLexiconTabProps> = ({
  filteredLexicon,
  onAddLexiconTerm,
  onDeleteLexiconTerm,
  copiedId,
  onCopyText,
  theme
}) => {
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [termForm, setTermForm] = useState<Partial<LexiconTerm>>({
    term: '',
    enTerm: '',
    category: 'Liên Ngành Đột Phá',
    deepExplanation: '',
    philosophicalOrigin: '',
    csEquivalent: '',
    applicationInAgents: ''
  });

  const handleSaveTerm = () => {
    if (!termForm.term || !termForm.deepExplanation) {
      alert('Vui lòng nhập Tên thuật ngữ và Giải thích chuyên sâu.');
      return;
    }
    const term: LexiconTerm = {
      id: `term-${Date.now()}`,
      term: termForm.term,
      enTerm: termForm.enTerm || termForm.term,
      category: (termForm.category as any) || 'Liên Ngành Đột Phá',
      philosophicalOrigin: termForm.philosophicalOrigin || 'Khảo luận Triết học',
      csEquivalent: termForm.csEquivalent || 'Kiến trúc máy tính',
      deepExplanation: termForm.deepExplanation,
      applicationInAgents: termForm.applicationInAgents || 'Mô hình đa tác tử',
      tags: ['Liên Ngành', 'Computer Science']
    };
    onAddLexiconTerm(term);
    setIsAddingTerm(false);
    setTermForm({
      term: '',
      enTerm: '',
      category: 'Liên Ngành Đột Phá',
      deepExplanation: '',
      philosophicalOrigin: '',
      csEquivalent: '',
      applicationInAgents: ''
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick Add Button */}
      {!isAddingTerm ? (
        <button
          onClick={() => setIsAddingTerm(true)}
          className="w-full py-2 px-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ THÊM THUẬT NGỮ MỚI</span>
        </button>
      ) : (
        <div
          className={`p-3 rounded-2xl border space-y-2.5 ${
            theme === 'dark' ? 'bg-slate-900 border-purple-500/40' : 'bg-purple-50 border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-purple-400">NHẬP THUẬT NGỮ</span>
            <button
              onClick={() => setIsAddingTerm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Tên thuật ngữ (VD: Biện chứng pháp)*"
            value={termForm.term}
            onChange={e => setTermForm({ ...termForm, term: e.target.value })}
            className={`w-full p-2 text-xs rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />

          <input
            type="text"
            placeholder="Thuật ngữ tiếng Anh (VD: Dialectics)"
            value={termForm.enTerm}
            onChange={e => setTermForm({ ...termForm, enTerm: e.target.value })}
            className={`w-full p-2 text-xs rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />

          <textarea
            rows={3}
            placeholder="Giải thích bản chất & ý nghĩa chuyên sâu...*"
            value={termForm.deepExplanation}
            onChange={e => setTermForm({ ...termForm, deepExplanation: e.target.value })}
            className={`w-full p-2 text-xs rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />

          <input
            type="text"
            placeholder="Tương đương Khoa học Máy tính (VD: Consensus Engine)"
            value={termForm.csEquivalent}
            onChange={e => setTermForm({ ...termForm, csEquivalent: e.target.value })}
            className={`w-full p-2 text-xs rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />

          <button
            onClick={handleSaveTerm}
            className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>LƯU VÀO SỔ TỪ ĐIỂN</span>
          </button>
        </div>
      )}

      {/* Lexicon Items List */}
      <div className="space-y-2.5">
        {filteredLexicon.map(item => (
          <div
            key={item.id}
            className={`p-3 rounded-2xl border transition-all space-y-2 w-full max-w-full min-w-0 overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40'
                : 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <h4
                    className={`text-xs font-bold min-w-0 max-w-full overflow-hidden ${
                      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    <AutoScrollText>{item.term}</AutoScrollText>
                  </h4>
                  {item.enTerm && item.enTerm !== item.term && (
                    <span className="text-[10px] text-purple-400 font-mono truncate max-w-[120px]">
                      ({item.enTerm})
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-block mt-1 truncate max-w-full">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onCopyText(item.id, `${item.term} (${item.enTerm}): ${item.deepExplanation}`)}
                  className={`p-1 rounded cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                  }`}
                  title="Copy định nghĩa"
                >
                  {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                {onDeleteLexiconTerm && (
                  <button
                    onClick={() => onDeleteLexiconTerm(item.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Xóa thuật ngữ"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {item.deepExplanation}
            </p>

            {(item.csEquivalent || item.philosophicalOrigin) && (
              <div
                className={`p-2 rounded-xl text-[11px] font-mono space-y-1 ${
                  theme === 'dark' ? 'bg-slate-950 border border-slate-800/80' : 'bg-white border border-slate-200'
                }`}
              >
                {item.philosophicalOrigin && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="opacity-70 text-[9px]">GỐC RỄ:</span>
                    <span className="truncate">{item.philosophicalOrigin}</span>
                  </div>
                )}
                {item.csEquivalent && (
                  <div className="flex items-center gap-1 text-emerald-500">
                    <span className="opacity-70 text-[9px]">ÁNH XẠ CS:</span>
                    <span className="truncate">{item.csEquivalent}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredLexicon.length === 0 && (
          <div
            className={`p-8 text-center rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/60 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Chưa có thuật ngữ nào phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
};
