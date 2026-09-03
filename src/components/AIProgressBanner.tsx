import React, { useEffect, useState } from 'react';
import { useAIProgress } from '../context/AIProgressContext';
import { Sparkles, Hourglass, CheckCircle2, Volume2, VolumeX, X, Coffee, Layers, Compass } from 'lucide-react';

interface AIProgressBannerProps {
  theme: 'dark' | 'light';
}

export const AIProgressBanner: React.FC<AIProgressBannerProps> = ({ theme }) => {
  const { currentNotice, clearProgress, soundEnabled, setSoundEnabled } = useAIProgress();
  const [dots, setDots] = useState('');

  // Subtle pulsing dots for active stages
  useEffect(() => {
    if (!currentNotice || currentNotice.stage === 'completed') return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    return () => clearInterval(interval);
  }, [currentNotice]);

  if (!currentNotice) return null;

  const isCompleted = currentNotice.stage === 'completed';
  const isHighDemand = currentNotice.stage === 'high_demand' || currentNotice.isHighDemand;

  return (
    <div
      id="ai-progress-floating-notice"
      className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div
        className={`rounded-2xl p-4 border shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all ${
          isCompleted
            ? theme === 'dark'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
              : 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-100'
            : isHighDemand
            ? theme === 'dark'
              ? 'bg-slate-950/95 border-amber-500/40 text-amber-100 shadow-amber-950/40'
              : 'bg-amber-50/95 border-amber-300 text-amber-900 shadow-amber-100'
            : theme === 'dark'
            ? 'bg-slate-950/95 border-purple-500/40 text-purple-100 shadow-purple-950/40'
            : 'bg-white/95 border-purple-200 text-slate-900 shadow-purple-100'
        }`}
      >
        {/* Subtle decorative background pulse */}
        <div
          className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none ${
            isCompleted ? 'bg-emerald-400' : isHighDemand ? 'bg-amber-400' : 'bg-purple-500'
          }`}
        />

        <div className="flex items-start gap-3 relative z-10">
          {/* Animated Icon Avatar */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isCompleted
                ? theme === 'dark'
                  ? 'bg-emerald-900/50 border-emerald-400/40 text-emerald-300'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : isHighDemand
                ? theme === 'dark'
                  ? 'bg-amber-900/40 border-amber-400/40 text-amber-300 animate-pulse'
                  : 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse'
                : theme === 'dark'
                ? 'bg-purple-900/40 border-purple-400/40 text-purple-300'
                : 'bg-purple-100 border-purple-300 text-purple-700'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
            ) : isHighDemand ? (
              <Coffee className="w-5 h-5 text-amber-400" />
            ) : (
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-4 space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold text-sm leading-snug tracking-wide ${
                  isCompleted
                    ? theme === 'dark' ? 'text-emerald-200' : 'text-emerald-900'
                    : isHighDemand
                    ? theme === 'dark' ? 'text-amber-200' : 'text-amber-900'
                    : theme === 'dark' ? 'text-purple-200' : 'text-purple-950'
                }`}
              >
                {currentNotice.title} {!isCompleted && dots}
              </span>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                isCompleted
                  ? theme === 'dark' ? 'text-emerald-300/80' : 'text-emerald-700'
                  : isHighDemand
                  ? theme === 'dark' ? 'text-amber-200/80' : 'text-amber-800'
                  : theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {currentNotice.subText}
            </p>

            {/* Micro badges / hints */}
            <div className="flex items-center gap-2 pt-1">
              {isHighDemand ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                    theme === 'dark'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  <Hourglass className="w-2.5 h-2.5" />
                  Đang phân luồng vi tế
                </span>
              ) : !isCompleted ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                    theme === 'dark'
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                      : 'bg-purple-100 text-purple-800 border-purple-200'
                  }`}
                >
                  <Layers className="w-2.5 h-2.5" />
                  6 Trụ cột Động
                </span>
              ) : null}

              <span className="text-[10px] opacity-60 font-mono">
                OG Lab Synthesis
              </span>
            </div>
          </div>

          {/* Right Action Tools: Sound toggle & Dismiss */}
          <div className="flex flex-col items-center gap-1 shrink-0 -mt-1">
            <button
              onClick={() => clearProgress()}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded-lg transition-colors cursor-pointer text-xs ${
                soundEnabled
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Âm thanh thông báo: Bật' : 'Âm thanh thông báo: Tắt'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
