import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { audioFx } from '../utils/audioFx';

export type AIProgressStage = 
  | 'idle'
  | 'connecting'
  | 'high_demand'
  | 'researching'
  | 'structuring_6_pillars'
  | 'extracting_lexicon'
  | 'polishing_prose'
  | 'completed';

export interface AIProgressNotice {
  id: string;
  stage: AIProgressStage;
  title: string;
  subText: string;
  isHighDemand?: boolean;
  modelName?: string;
  timestamp: number;
}

interface AIProgressContextType {
  currentNotice: AIProgressNotice | null;
  startProgress: (initialTitle?: string) => void;
  updateStage: (stage: AIProgressStage, title?: string, subText?: string) => void;
  signalHighDemand: (modelName?: string) => void;
  notifyChapterSuccess: (chapterTitle: string, current: number, total: number) => void;
  finishProgress: (completionMessage?: string) => void;
  clearProgress: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const AIProgressContext = createContext<AIProgressContextType | undefined>(undefined);

// Gentle poetic quotes about patience, depth and contemplation
const CONTEMPLATION_MESSAGES = [
  'Đang đúc kết tri thức sâu và chuyển hóa văn phong thực chiến...',
  'Đang phân tích 4 Cấp độ Học thuật & 6 Trụ cột Động...',
  'Hệ thống AI đang tiếp nhận lưu lượng cao. Đang kiên nhẫn điều phối tài nguyên...',
  'Trích xuất thuật ngữ chuyên ngành vào Sổ Từ Điển và danh ngôn kinh điển...',
  'Chuyển ngữ các mô hình toán học & CS sang ngôn ngữ hành động đời thường...',
  'Đang chuốt giũa từng luận điểm để đảm bảo tính ứng dụng cao nhất...'
];

export const AIProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentNotice, setCurrentNotice] = useState<AIProgressNotice | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => audioFx.isEnabled());

  const setSoundEnabled = useCallback((enabled: boolean) => {
    audioFx.setEnabled(enabled);
    setSoundEnabledState(enabled);
  }, []);

  const clearProgress = useCallback(() => {
    setCurrentNotice(null);
  }, []);

  const startProgress = useCallback((initialTitle: string = 'Đang khởi tạo khảo luận...') => {
    const notice: AIProgressNotice = {
      id: `notice-${Date.now()}`,
      stage: 'researching',
      title: initialTitle,
      subText: 'Đang liên kết các trường tri thức liên ngành và 6 Trụ cột Động...',
      timestamp: Date.now()
    };
    setCurrentNotice(notice);
  }, []);

  const updateStage = useCallback((stage: AIProgressStage, title?: string, subText?: string) => {
    setCurrentNotice(prev => {
      if (!prev && stage === 'idle') return null;
      return {
        id: prev ? prev.id : `notice-${Date.now()}`,
        stage,
        title: title || (prev ? prev.title : 'Đang nghiên cứu & biên soạn...'),
        subText: subText || (prev ? prev.subText : CONTEMPLATION_MESSAGES[Math.floor(Math.random() * CONTEMPLATION_MESSAGES.length)]),
        isHighDemand: stage === 'high_demand' ? true : prev?.isHighDemand,
        timestamp: Date.now()
      };
    });
  }, []);

  const signalHighDemand = useCallback((modelName?: string) => {
    audioFx.playGentleNotice();
    setCurrentNotice(prev => ({
      id: prev ? prev.id : `notice-${Date.now()}`,
      stage: 'high_demand',
      title: 'Mạng Lưới AI Đang Tập Trung Cao Độ',
      subText: 'Lượng truy cập mô hình Gemini đang tăng nhẹ. Hệ thống đang tự động xếp hàng và tối ưu luồng tri thức. Xin bạn thong thả thưởng trà trong giây lát...',
      isHighDemand: true,
      modelName,
      timestamp: Date.now()
    }));
  }, []);

  const notifyChapterSuccess = useCallback((chapterTitle: string, current: number, total: number) => {
    // Play crisp pleasant chime immediately after each chapter finishes
    audioFx.playChapterChime();
    setCurrentNotice(prev => ({
      id: `notice-${Date.now()}`,
      stage: 'researching',
      title: `✓ Đã xong (${current}/${total}): ${chapterTitle}`,
      subText: current < total
        ? `Đang chuyển giao thức sang biên soạn chương tiếp theo (${current + 1}/${total})...`
        : 'Đang tổng hợp và kết tinh toàn bộ trụ cột...',
      isHighDemand: false,
      timestamp: Date.now()
    }));
  }, []);

  const finishProgress = useCallback((completionMessage?: string) => {
    // Play celebratory grand completion chime
    audioFx.playGrandCompletionChime();
    setCurrentNotice({
      id: `notice-${Date.now()}`,
      stage: 'completed',
      title: completionMessage || 'Khảo Luận Đã Hoàn Tất!',
      subText: 'Tri thức đã được chuyển hóa và nạp đầy đủ vào các thẻ nội dung.',
      timestamp: Date.now()
    });

    // Auto clear after 4.5 seconds
    setTimeout(() => {
      setCurrentNotice(prev => (prev?.stage === 'completed' ? null : prev));
    }, 4500);
  }, []);

  // Listen to custom global window events for network resilience
  useEffect(() => {
    const handleHighDemandEvent = (e: any) => {
      signalHighDemand(e.detail?.model);
    };
    const handleProgressEvent = (e: any) => {
      if (e.detail?.stage === 'completed') {
        finishProgress(e.detail?.message);
      } else if (e.detail?.stage === 'high_demand') {
        signalHighDemand(e.detail?.model);
      } else if (e.detail?.stage) {
        updateStage(e.detail.stage, e.detail.title, e.detail.subText);
      }
    };

    window.addEventListener('og-gemini-high-demand', handleHighDemandEvent);
    window.addEventListener('og-gemini-progress', handleProgressEvent);

    return () => {
      window.removeEventListener('og-gemini-high-demand', handleHighDemandEvent);
      window.removeEventListener('og-gemini-progress', handleProgressEvent);
    };
  }, [signalHighDemand, finishProgress, updateStage]);

  return (
    <AIProgressContext.Provider
      value={{
        currentNotice,
        startProgress,
        updateStage,
        signalHighDemand,
        notifyChapterSuccess,
        finishProgress,
        clearProgress,
        soundEnabled,
        setSoundEnabled
      }}
    >
      {children}
    </AIProgressContext.Provider>
  );
};

export const useAIProgress = (): AIProgressContextType => {
  const context = useContext(AIProgressContext);
  if (!context) {
    throw new Error('useAIProgress must be used within an AIProgressProvider');
  }
  return context;
};
