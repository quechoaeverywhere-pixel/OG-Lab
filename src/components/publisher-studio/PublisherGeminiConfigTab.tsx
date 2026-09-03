import React from 'react';
import { Settings2 } from 'lucide-react';
import { GeminiSettings } from '../../types';

interface PublisherGeminiConfigTabProps {
  geminiSettings: GeminiSettings;
  onUpdateGeminiSettings: (s: GeminiSettings) => void;
  theme: 'dark' | 'light';
}

export const PublisherGeminiConfigTab: React.FC<PublisherGeminiConfigTabProps> = ({
  geminiSettings,
  onUpdateGeminiSettings,
  theme
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className={`p-6 rounded-3xl border space-y-4 ${
        theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <h3 className={`text-sm font-bold flex items-center gap-2 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <Settings2 className="w-4 h-4 text-purple-500" />
          <span>CẤU HÌNH THAM SỐ MÔ HÌNH GOOGLE GEMINI</span>
        </h3>

        <div className="space-y-2">
          <label className={`text-xs font-mono font-bold ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>Mô hình AI:</label>
          <select
            value={geminiSettings.model}
            onChange={e => onUpdateGeminiSettings({ ...geminiSettings, model: e.target.value })}
            className={`w-full p-2.5 rounded-xl text-xs font-mono ${
              theme === 'dark'
                ? 'bg-slate-950 border border-slate-800 text-slate-200'
                : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
            }`}
          >
            <option value="gemini-2.5-flash">Gemini 3.7 Flash (Mặc định - Đỉnh cao suy luận & tốc độ)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Tiết kiệm token & phản hồi tức thì)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Khảo luận luận án chuyên sâu tối đa)</option>
          </select>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <div>
            <div className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
              Google Search Grounding (Web Search)
            </div>
            <div className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Tự động tra cứu tài liệu học thuật IEEE, ACM & Whitepaper mới nhất
            </div>
          </div>
          <input
            type="checkbox"
            checked={geminiSettings.enableSearchGrounding}
            onChange={e => onUpdateGeminiSettings({ ...geminiSettings, enableSearchGrounding: e.target.checked })}
            className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className={`text-xs font-mono font-bold ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>System Instruction (Chỉ thị hệ thống):</label>
          <textarea
            rows={4}
            value={geminiSettings.systemInstruction}
            onChange={e => onUpdateGeminiSettings({ ...geminiSettings, systemInstruction: e.target.value })}
            className={`w-full p-3 rounded-xl text-xs font-mono ${
              theme === 'dark'
                ? 'bg-slate-950 border border-slate-800 text-slate-200'
                : 'bg-white border border-slate-300 text-slate-900 shadow-xs'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
