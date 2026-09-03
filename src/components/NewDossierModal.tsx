import React, { useState } from 'react';
import { Plus, X, BookOpen, Save, Layers, Tag, FileText, Sparkles } from 'lucide-react';
import { Dossier } from '../types';
import { usePermission } from '../contexts/PermissionContext';

interface NewDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDossier: (dossier: Dossier) => Promise<void>;
  nextChapterNumber: number;
  theme: 'dark' | 'light';
}

export const NewDossierModal: React.FC<NewDossierModalProps> = ({
  isOpen,
  onClose,
  onSaveDossier,
  nextChapterNumber,
  theme
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [pillarId, setPillarId] = useState('pillar-1');
  const [customPillarTitle, setCustomPillarTitle] = useState('');
  const [discipline, setDiscipline] = useState('Triết lý & Kiến trúc');
  const [tagsInput, setTagsInput] = useState('Triết học, Hệ phân tán, Khả năng mở rộng');
  const [abstract, setAbstract] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState(`## 1. Dẫn Nhập & Bối Cảnh Nghiên Cứu\n\nKhảo cứu sự giao thoa giữa tư tưởng kinh điển và kiến trúc phần mềm phân tán...\n\n## 2. Phân Tích Thực Tiễn Hệ Thống\n\n- **Hiện tượng**: ...\n- **Giải pháp**: ...\n\n## 3. Kết Luận & Khuyến Nghị Kiến Trúc\n\n...`);

  if (!isOpen) return null;

  const pillarTitles: Record<string, string> = {
  'pillar-1': 'Trụ cột I: Kiến Tạo Bản Thể',
  'pillar-2': 'Trụ cột II: Cơ Chế Vận Hành',
  'pillar-3': 'Trụ cột III: Kiến Trúc Ứng Dụng',
  'pillar-4': 'Trụ cột IV: Biện Chứng Đa Chiều',
  'pillar-5': 'Trụ cột V: Không Gian Đối Thoại Nội Tâm',
  'pillar-6': 'Trụ cột VI: Hệ Sinh Thái & Vạn Vật'
};

  const { requirePermission } = usePermission();

  const handleCreate = async () => {
    if (!title.trim()) return;

    requirePermission('create_dossier', async () => {
      const newId = `dossier-custom-${Date.now()}`;
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const dossier: Dossier = {
        id: newId,
        chapterNumber: nextChapterNumber,
        pillarId: 'all-pillars',
        pillarTitle: 'Hệ Thống 6 Trụ Cột Toàn Diện',
        title: title.trim(),
        subtitle: subtitle.trim() || 'Khảo luận chuyên đề liên ngành',
        discipline: discipline.trim() || 'Khoa học Máy tính & Triết học',
        tags,
        abstract: abstract.trim() || 'Tóm tắt đang được hoàn thiện...',
        keyFindings: [],
        philosophicalBasis: [],
        technicalMappings: [],
        contentMarkdown: contentMarkdown.trim(),
        notebookLMExportPrompt: `Hãy phân tích sâu sắc các lập luận trong bài viết "${title}" về sự kết hợp giữa triết lý cổ điển và kỹ thuật máy tính.`,
        citations: [],
        status: 'draft',
        lastModified: new Date().toISOString()
      };

      await onSaveDossier(dossier);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          theme === 'dark'
            ? 'glass-panel-dark border-slate-800/90 text-slate-100 shadow-slate-950/90'
            : 'glass-panel-light border-slate-200/90 text-slate-900 shadow-xl'
        }`}
      >
        <div className={`p-4 md:px-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display-title font-bold text-base md:text-lg">
                  TẠO HỒ SƠ NGHIÊN CỨU MỚI
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                  HỒ SƠ #{nextChapterNumber}
                </span>
              </div>
              <p className="text-xs opacity-65 font-serif-reading italic">
                Khởi tạo chuyên đề khảo cứu đối chiếu học thuật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 cursor-pointer font-mono ${
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 text-xs font-tech">
          <div>
            <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>// TIÊU ĐỀ HỒ SƠ</label>
            <input
              type="text"
              placeholder="VD: Khổng Tử và Chính Sách Quản Trị Phân Quyền (RBAC/ABAC)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`w-full p-2.5 rounded-md border outline-none font-medium focus:border-purple-500 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-950 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900 shadow-xs'
              }`}
            />
          </div>

          <div>
            <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>// PHỤ ĐỀ KHẢO LUẬN</label>
            <input
              type="text"
              placeholder="VD: Đối chiếu Lễ trị Nho gia và Mô hình Policy-as-Code"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className={`w-full p-2 rounded-md border outline-none focus:border-purple-500 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-950 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900 shadow-xs'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>// TRỤ CỘT NGHIÊN CỨU</label>
              <select
                value={pillarId}
                onChange={e => setPillarId(e.target.value)}
                className={`w-full p-2 rounded-md border outline-none cursor-pointer font-mono text-[11px] ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-950 text-slate-200'
                    : 'border-slate-300 bg-white text-slate-900 shadow-xs'
                }`}
              >
                <option value="pillar-1">Trụ cột I: Kiến Tạo Bản Thể</option>
                <option value="pillar-2">Trụ cột II: Cơ Chế Vận Hành</option>
                <option value="pillar-3">Trụ cột III: Kiến Trúc Ứng Dụng</option>
                <option value="pillar-4">Trụ cột IV: Biện Chứng Đa Chiều</option>
                <option value="pillar-5">Trụ cột V: Không Gian Đối Thoại Nội Tâm (Shinbashira)</option>
                <option value="pillar-6">Trụ cột VI: Hệ Sinh Thái & Vạn Vật</option>
              </select>
            </div>
            <div>
              <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>// LĨNH VỰC</label>
              <input
                type="text"
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
                className={`w-full p-2 rounded-md border outline-none focus:border-purple-500 ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-950 text-slate-200'
                    : 'border-slate-300 bg-white text-slate-900 shadow-xs'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>// THẺ PHÂN LOẠI (CÁCH NHAU BỞI DẤU PHẨY)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className={`w-full p-2 rounded-md border outline-none font-mono text-[11px] ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-950 text-slate-200'
                  : 'border-slate-300 bg-white text-slate-900 shadow-xs'
              }`}
            />
          </div>

          <div>
            <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>// TÓM TẮT HỌC THUẬT (ABSTRACT)</label>
            <textarea
              rows={2}
              placeholder="Tóm tắt ngắn gọn luận điểm chính..."
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              className={`w-full p-2.5 rounded-md border outline-none font-serif-reading leading-relaxed focus:border-purple-500 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-950 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900 shadow-xs'
              }`}
            />
          </div>

          <div>
            <label className={`font-mono font-bold uppercase text-[10px] block mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>// NỘI DUNG MARKDOWN GỐC</label>
            <textarea
              rows={5}
              value={contentMarkdown}
              onChange={e => setContentMarkdown(e.target.value)}
              className={`w-full p-2.5 rounded-md border outline-none font-mono text-[11px] leading-relaxed focus:border-purple-500 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-950 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900 shadow-xs'
              }`}
            />
          </div>
        </div>

        <div className={`p-3.5 md:px-6 border-t flex items-center justify-between font-tech ${
          theme === 'dark' ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 text-xs rounded-md border cursor-pointer ${
              theme === 'dark'
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
          >
            HỦY
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-4 py-1.5 text-xs font-bold rounded-md bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            <Save className="w-3.5 h-3.5" />
            <span>TẠO HỒ SƠ & MỞ SOẠN THẢO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

