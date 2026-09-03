import React, { useState } from 'react';
import {
  Quote,
  Plus,
  Copy,
  Check,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { CitationItem, Dossier } from '../../types';
import { AutoScrollText } from '../AutoScrollText';

interface SidebarCitationsTabProps {
  filteredCitations: CitationItem[];
  currentDossier: Dossier | null;
  onAddCitation: (citation: CitationItem) => void;
  onDeleteCitation?: (id: string) => void;
  copiedId: string | null;
  onCopyText: (id: string, text: string) => void;
  theme: 'dark' | 'light';
}

export const SidebarCitationsTab: React.FC<SidebarCitationsTabProps> = ({
  filteredCitations,
  currentDossier,
  onAddCitation,
  onDeleteCitation,
  copiedId,
  onCopyText,
  theme
}) => {
  const [isAddingCitation, setIsAddingCitation] = useState(false);
  const [citationForm, setCitationForm] = useState<Partial<CitationItem>>({
    title: '',
    author: '',
    year: 'Cổ điển',
    source: '',
    category: 'Kinh điển',
    keyQuote: ''
  });

  const handleSaveCitation = () => {
    if (!citationForm.title || !citationForm.author) {
      alert('Vui lòng nhập Tên tác phẩm và Tác giả.');
      return;
    }
    const cit: CitationItem = {
      id: `cit-${Date.now()}`,
      title: citationForm.title,
      author: citationForm.author,
      year: citationForm.year || 'Cổ điển',
      source: citationForm.source || citationForm.title,
      category: (citationForm.category as any) || 'Kinh điển',
      keyQuote: citationForm.keyQuote || '',
      dossierIds: currentDossier ? [currentDossier.id] : []
    };
    onAddCitation(cit);
    setIsAddingCitation(false);
    setCitationForm({
      title: '',
      author: '',
      year: 'Cổ điển',
      source: '',
      category: 'Kinh điển',
      keyQuote: ''
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick Add Button */}
      {!isAddingCitation ? (
        <button
          onClick={() => setIsAddingCitation(true)}
          className="w-full py-2 px-3 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ THÊM TRÍCH DẪN MỚI</span>
        </button>
      ) : (
        <div
          className={`p-3 rounded-2xl border space-y-2.5 ${
            theme === 'dark' ? 'bg-slate-900 border-amber-500/40' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-amber-400">NHẬP TRÍCH DẪN</span>
            <button
              onClick={() => setIsAddingCitation(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Tên tác phẩm / Sách (VD: Đạo Đức Kinh)*"
            value={citationForm.title}
            onChange={e => setCitationForm({ ...citationForm, title: e.target.value })}
            className={`w-full p-2 text-xs rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Tác giả (VD: Lão Tử)*"
              value={citationForm.author}
              onChange={e => setCitationForm({ ...citationForm, author: e.target.value })}
              className={`w-full p-2 text-xs rounded-lg border outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <input
              type="text"
              placeholder="Thời kỳ / Năm (VD: Thế kỷ VI TCN)"
              value={citationForm.year}
              onChange={e => setCitationForm({ ...citationForm, year: e.target.value })}
              className={`w-full p-2 text-xs rounded-lg border outline-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <textarea
            rows={3}
            placeholder="Câu trích dẫn kinh điển (Nguyên văn hoặc dịch nghĩa)..."
            value={citationForm.keyQuote}
            onChange={e => setCitationForm({ ...citationForm, keyQuote: e.target.value })}
            className={`w-full p-2 text-xs rounded-lg border outline-none ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />

          <button
            onClick={handleSaveCitation}
            className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>LƯU VÀO SỔ TRÍCH DẪN</span>
          </button>
        </div>
      )}

      {/* Citations List */}
      <div className="space-y-2.5">
        {filteredCitations.map(cit => (
          <div
            key={cit.id}
            className={`p-3 rounded-2xl border transition-all space-y-2 w-full max-w-full min-w-0 overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-amber-500/40'
                : 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs font-bold min-w-0 max-w-full overflow-hidden ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  <AutoScrollText>{cit.title}</AutoScrollText>
                </h4>
                <div className="text-[11px] text-amber-500 font-mono mt-0.5 truncate">
                  {cit.author} • {cit.year}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onCopyText(cit.id, `"${cit.keyQuote}" — ${cit.author}, ${cit.title}`)}
                  className={`p-1 rounded cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                  }`}
                  title="Copy trích dẫn"
                >
                  {copiedId === cit.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                {onDeleteCitation && (
                  <button
                    onClick={() => onDeleteCitation(cit.id)}
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Xóa trích dẫn"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {cit.keyQuote && (
              <blockquote
                className={`p-2.5 rounded-xl border-l-2 border-amber-500 text-xs italic font-serif leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950/70 text-slate-200' : 'bg-white text-slate-800'
                }`}
              >
                "{cit.keyQuote}"
              </blockquote>
            )}

            {cit.source && (
              <div
                className={`text-[10px] font-mono truncate ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Nguồn: {cit.source}
              </div>
            )}
          </div>
        ))}

        {filteredCitations.length === 0 && (
          <div
            className={`p-8 text-center rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900/30 border-slate-800/60 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <Quote className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Chưa có trích dẫn nào phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
};
