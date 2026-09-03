import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Sparkles, Brain, Loader2, ArrowRight, BookmarkPlus,
  MessageSquare, Send, User, Bot, ChevronLeft,
  HeartHandshake, Plus, History, Download, Trash2, CheckCircle2,
  Calendar, Clock, FileJson, FileText, RefreshCw, FolderOpen,
  AlertTriangle, RotateCcw, CloudUpload, HardDrive, Check
} from 'lucide-react';
import { Dossier, DynamicPillar, ConceptChatMessage, ConceptChatSession } from '../types';
import { safeFetchAIJson } from '../utils/ai-client';
import { useAIProgress } from '../context/AIProgressContext';
import {
  getStoredDriveToken,
  requestGoogleDriveToken,
  syncIdeaJournalToDrive,
  syncAllIdeaJournalsToDrive,
  IDEA_JOURNAL_FILENAME
} from '../utils/googleDriveSync';

interface QuickResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDossier: (dossier: Dossier) => Promise<void>;
  onAddLexiconTerm?: (term: any) => void;
  onAddCitation?: (cit: any) => void;
  theme: 'dark' | 'light';
  initialTopic?: string;
  nextChapterNumber?: number;
}

export type ScenarioType = 'dissertation' | 'business_plan' | 'workflow' | 'survey' | 'essay';

export interface SynthesisResult {
  decodedEssence: string;
  recommendedScenario: ScenarioType;
  scenarioRationale: string;
  proposedTitle: string;
  proposedSubtitle: string;
  proposedAbstract: string;
  detectedDomain: string;
  interdisciplinaryFields: string[];
  pillars: DynamicPillar[];
}

export const SCENARIO_OPTIONS: {
  id: ScenarioType;
  name: string;
  chaptersTotal: number;
  chaptersPerPillar: number;
  description: string;
  badge: string;
}[] = [
  {
    id: 'business_plan',
    name: 'Đề án Kinh doanh & Mô hình Thực chiến',
    chaptersTotal: 24,
    chaptersPerPillar: 4,
    badge: '24 CHƯƠNG (4 CHƯƠNG/TRỤ)',
    description: 'Bản thiết kế chiến lược kinh doanh, khảo sát thị trường, dòng tiền tự dưỡng & ứng dụng tự động hóa quy trình.'
  },
  {
    id: 'workflow',
    name: 'Quy trình Vận hành & Tự động hóa',
    chaptersTotal: 18,
    chaptersPerPillar: 3,
    badge: '18 CHƯƠNG (3 CHƯƠNG/TRỤ)',
    description: 'Hạ tầng quy trình kỹ thuật, tự động hóa công việc và tổ chức đội ngũ phi địa điểm.'
  },
  {
    id: 'dissertation',
    name: 'Luận án / Khảo luận Bác học',
    chaptersTotal: 48,
    chaptersPerPillar: 8,
    badge: '48 CHƯƠNG (8 CHƯƠNG/TRỤ)',
    description: 'Công trình nghiên cứu học thuật toàn diện với mô hình hóa hệ thống & phản biện biện chứng sâu.'
  },
  {
    id: 'survey',
    name: 'Khảo sát Thị trường & Xã hội',
    chaptersTotal: 12,
    chaptersPerPillar: 2,
    badge: '12 CHƯƠNG (2 CHƯƠNG/TRỤ)',
    description: 'Báo cáo khảo sát thực trạng, phân tích hành vi người dùng & xu hướng thị trường ngắn hạn.'
  },
  {
    id: 'essay',
    name: 'Luận điểm Sáng tạo & Bài Khảo luận Ngắn',
    chaptersTotal: 12,
    chaptersPerPillar: 2,
    badge: '12 CHƯƠNG (2 CHƯƠNG/TRỤ)',
    description: 'Khung diễn họa ý tưởng sáng tạo tinh gọn giúp định hình nhanh luận điểm khởi phát.'
  }
];

const LOCAL_STORAGE_ACTIVE_ID = 'og_active_concept_chat_id';

export const QuickResearchModal: React.FC<QuickResearchModalProps> = ({
  isOpen,
  onClose,
  onSaveDossier,
  theme,
  initialTopic = '',
  nextChapterNumber
}) => {
  const [selectedModel] = useState<string>('gemini-3.7-flash');
  
  // Modes: 'chat' (multi-turn dialogue) | 'preview' (synthesized outline)
  const [modalMode, setModalMode] = useState<'chat' | 'preview'>('chat');

  // Active Session State
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID) || `chat-${Date.now()}`;
  });
  const [sessionTitle, setSessionTitle] = useState<string>('Trò chuyện khai phá ý niệm mới');
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string>(() => new Date().toISOString());
  const [sessionStatus, setSessionStatus] = useState<'active' | 'synthesized' | 'converted_to_dossier' | 'archived'>('active');
  const [associatedDossierId, setAssociatedDossierId] = useState<string | null>(null);

  // Chat messages
  const [messages, setMessages] = useState<ConceptChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Synthesis state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('business_plan');
  const [editableTitle, setEditableTitle] = useState('');
  const [editableAbstract, setEditableAbstract] = useState('');

  // History Drawer state
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyList, setHistoryList] = useState<ConceptChatSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Delete & Confirmation state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'single' | 'current' | 'all';
    targetId?: string;
    targetTitle?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [isSavingDossier, setIsSavingDossier] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Google Drive Sync state
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isSyncingAllDrive, setIsSyncingAllDrive] = useState(false);

  const { startProgress, finishProgress } = useAIProgress();

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isThinking, modalMode]);

  // Helper: Format Date and Time
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${timeStr} • ${dateStr}`;
    } catch {
      return '';
    }
  };

  const formatShortTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Helper: Persist Session to Backend JSON & Local Cache
  const persistSession = useCallback(async (
    customSession?: Partial<ConceptChatSession>
  ) => {
    setIsAutoSaving(true);
    const sid = customSession?.id || currentSessionId;
    const msgs = customSession?.messages || messages;
    const nowIso = new Date().toISOString();

    // Determine title
    let title = customSession?.title || sessionTitle;
    if ((!title || title === 'Trò chuyện khai phá ý niệm mới') && msgs.length > 0) {
      const firstUserMsg = msgs.find(m => m.role === 'user');
      if (firstUserMsg) {
        title = firstUserMsg.content.trim().slice(0, 45) + (firstUserMsg.content.length > 45 ? '...' : '');
      }
    }

    const payload: ConceptChatSession = {
      id: sid,
      title: title || 'Khám phá ý niệm',
      initialTopic: customSession?.initialTopic || (initialTopic ? initialTopic.trim() : undefined),
      createdAt: customSession?.createdAt || sessionCreatedAt,
      updatedAt: nowIso,
      status: customSession?.status || sessionStatus,
      associatedDossierId: customSession?.associatedDossierId !== undefined ? customSession.associatedDossierId : associatedDossierId,
      messages: msgs,
      synthesis: customSession?.synthesis !== undefined ? customSession.synthesis : synthesis,
      selectedScenario: customSession?.selectedScenario || selectedScenario
    };

    // Update Local Storage
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, sid);
      localStorage.setItem(`og_concept_chat_${sid}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('[ChatStore] LocalStorage error:', e);
    }

    // Update State
    setSessionTitle(payload.title);
    setLastSavedTime(new Date().toLocaleTimeString());

    // Sync to Server JSON
    try {
      await fetch('/api/concept-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('[ChatStore] Failed to persist JSON file on backend:', err);
    } finally {
      setIsAutoSaving(false);
    }
  }, [currentSessionId, messages, sessionTitle, initialTopic, sessionCreatedAt, sessionStatus, associatedDossierId, synthesis, selectedScenario]);

  // Load History from Backend JSON Store
  const loadHistoryList = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/concept-chats');
      const data = await res.json();
      const serverList = (data.success && Array.isArray(data.chats)) 
        ? data.chats 
        : (data.success && Array.isArray(data.sessions)) 
          ? data.sessions 
          : [];
      if (serverList.length > 0) {
        setHistoryList(serverList);
      } else {
        // Local fallback
        const localList: ConceptChatSession[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('og_concept_chat_')) {
            try {
              const val = localStorage.getItem(k);
              if (val) {
                const parsed = JSON.parse(val);
                if (parsed && parsed.id) localList.push(parsed);
              }
            } catch (e) {}
          }
        }
        localList.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        setHistoryList(localList);
      }
    } catch (err) {
      console.error('Error fetching concept chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Initialize or Restore Chat Session when Modal Opens
  const initWelcomeMessage = (topicText?: string): ConceptChatMessage[] => {
    const welcomeMsg: ConceptChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'assistant',
      content: `👋 **Chào bạn!**\n\nBạn đang ấp ủ ý tưởng, dự định hay bài toán thực tế nào cần giải quyết? Hãy chia sẻ với tôi bất cứ điều gì bạn đang suy nghĩ nhé — từ một ý niệm sơ khởi đến một kế hoạch cụ thể.\n\n**Bạn muốn chia sẻ điều gì hôm nay?**`,
      timestamp: new Date().toISOString()
    };

    if (topicText && topicText.trim()) {
      const userMsg: ConceptChatMessage = {
        id: `msg-user-init-${Date.now()}`,
        role: 'user',
        content: topicText.trim(),
        timestamp: new Date().toISOString()
      };
      return [welcomeMsg, userMsg];
    }

    return [welcomeMsg];
  };

  // Start a fresh new chat session
  const startNewSession = useCallback((topicText?: string) => {
    const newId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const initialMsgs = initWelcomeMessage(topicText);
    const initialTitle = topicText?.trim() 
      ? topicText.trim().slice(0, 45) + (topicText.trim().length > 45 ? '...' : '') 
      : 'Trò chuyện khai phá ý niệm mới';

    setCurrentSessionId(newId);
    setSessionTitle(initialTitle);
    setSessionCreatedAt(nowIso);
    setSessionStatus('active');
    setAssociatedDossierId(null);
    setMessages(initialMsgs);
    setInputMsg('');
    setSynthesis(null);
    setModalMode('chat');
    setErrorMessage('');

    const newSession: ConceptChatSession = {
      id: newId,
      title: initialTitle,
      initialTopic: topicText?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: 'active',
      associatedDossierId: null,
      messages: initialMsgs,
      synthesis: null,
      selectedScenario: 'business_plan'
    };

    persistSession(newSession);

    if (topicText && topicText.trim()) {
      triggerInterviewReply(initialMsgs, newId);
    }
  }, [persistSession]);

  // Load a specific historical session
  const loadSpecificSession = (session: ConceptChatSession) => {
    setCurrentSessionId(session.id);
    setSessionTitle(session.title || 'Hội thoại đã lưu');
    setSessionCreatedAt(session.createdAt || new Date().toISOString());
    setSessionStatus(session.status || 'active');
    setAssociatedDossierId(session.associatedDossierId || null);
    setMessages(session.messages || []);
    setInputMsg('');
    setErrorMessage('');

    if (session.synthesis) {
      setSynthesis(session.synthesis as SynthesisResult);
      setSelectedScenario((session.selectedScenario as ScenarioType) || (session.synthesis.recommendedScenario as ScenarioType) || 'business_plan');
      setEditableTitle(session.synthesis.proposedTitle || '');
      setEditableAbstract(session.synthesis.proposedAbstract || '');
      setModalMode('preview');
    } else {
      setSynthesis(null);
      setModalMode('chat');
    }

    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, session.id);
    setIsHistoryDrawerOpen(false);
  };

  // Delete Handlers for Concept Chat Sessions
  const executeDeleteSingle = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetch(`/api/concept-chats/${id}`, { method: 'DELETE' });
      setHistoryList(prev => prev.filter(item => item.id !== id));
      try {
        localStorage.removeItem(`og_concept_chat_${id}`);
      } catch (e) {}

      if (id === currentSessionId) {
        try {
          localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ID);
        } catch (e) {}
        startNewSession();
      }
      showToast('Đã xóa vĩnh viễn tệp nhật ký trò chuyện.');
    } catch (err) {
      console.error('Error deleting chat session:', err);
      setErrorMessage('Không thể xóa tệp trò chuyện. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmState(null);
    }
  };

  const executeDeleteCurrent = async () => {
    setIsDeleting(true);
    const sid = currentSessionId;
    try {
      await fetch(`/api/concept-chats/${sid}`, { method: 'DELETE' });
      try {
        localStorage.removeItem(`og_concept_chat_${sid}`);
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ID);
      } catch (e) {}
      setHistoryList(prev => prev.filter(item => item.id !== sid));
      startNewSession();
      showToast('Đã dọn sạch cuộc trò chuyện hiện tại.');
    } catch (err) {
      console.error('Error clearing current chat:', err);
      startNewSession();
    } finally {
      setIsDeleting(false);
      setDeleteConfirmState(null);
    }
  };

  const executeDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await fetch('/api/concept-chats/clear-all', { method: 'POST' });
      historyList.forEach(item => {
        try {
          localStorage.removeItem(`og_concept_chat_${item.id}`);
        } catch (e) {}
      });
      try {
        localStorage.removeItem(`og_concept_chat_${currentSessionId}`);
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ID);
      } catch (e) {}
      setHistoryList([]);
      startNewSession();
      showToast('Đã dọn dẹp toàn bộ lịch sử trò chuyện.');
    } catch (err) {
      console.error('Error clearing all chats:', err);
      setErrorMessage('Không thể dọn sạch toàn bộ lịch sử trò chuyện.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmState(null);
    }
  };

  // Export JSON Transcript File
  const handleExportJson = (sessionToExport?: ConceptChatSession) => {
    const currentData: ConceptChatSession = sessionToExport || {
      id: currentSessionId,
      title: sessionTitle,
      initialTopic: initialTopic || undefined,
      createdAt: sessionCreatedAt,
      updatedAt: new Date().toISOString(),
      status: sessionStatus,
      associatedDossierId,
      messages,
      synthesis,
      selectedScenario
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `concept-chat-${currentData.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Markdown Transcript File
  const handleExportMarkdown = (sessionToExport?: ConceptChatSession) => {
    const s: ConceptChatSession = sessionToExport || {
      id: currentSessionId,
      title: sessionTitle,
      initialTopic: initialTopic || undefined,
      createdAt: sessionCreatedAt,
      updatedAt: new Date().toISOString(),
      status: sessionStatus,
      associatedDossierId,
      messages,
      synthesis,
      selectedScenario
    };

    let md = `# BẢN GHI NHẬT KÝ HỘI THOẠI KHAI PHÁ Ý NIỆM\n\n`;
    md += `- **Mã Phiên (ID):** \`${s.id}\`\n`;
    md += `- **Tiêu Đề:** ${s.title}\n`;
    md += `- **Thời Điểm Bắt Đầu:** ${formatDateTime(s.createdAt)}\n`;
    md += `- **Cập Nhật Gần Nhất:** ${formatDateTime(s.updatedAt)}\n`;
    md += `- **Trạng Thái:** ${s.status}\n`;
    if (s.associatedDossierId) {
      md += `- **Hồ Sơ Liên Kết:** \`${s.associatedDossierId}\`\n`;
    }
    md += `\n---\n\n## DIỄN BIẾN TOÀN BỘ CUỘC TRÒ CHUYỆN (${s.messages.length} LƯỢT)\n\n`;

    s.messages.forEach((m, idx) => {
      const speaker = m.role === 'user' ? '👤 NGƯỜI DÙNG' : '🤖 TRỢ LÝ KHAI PHÁ Ý NIỆM (OG AI)';
      md += `### [${idx + 1}] ${speaker} (${formatDateTime(m.timestamp)})\n\n${m.content}\n\n---\n\n`;
    });

    if (s.synthesis) {
      md += `## KẾT QUẢ TỔNG HỢP & ĐỀ CƯƠNG 6 TRỤ CỘT\n\n`;
      md += `### ${s.synthesis.proposedTitle}\n`;
      md += `> ${s.synthesis.proposedAbstract}\n\n`;
      md += `**Bản Chất Ý Niệm:** ${s.synthesis.decodedEssence}\n\n`;
      md += `**Kịch Bản Đề Xuất:** ${s.synthesis.recommendedScenario}\n\n`;
      md += `**Lý Do:** ${s.synthesis.scenarioRationale}\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `concept-transcript-${s.id}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  /**
   * One-Click Google Drive Sync for current active or selected session
   * Saves or appends into the unified SO_TAY_Y_TUONG_ONENESS.md on Drive
   */
  const handleSyncCurrentToDrive = async (targetSession?: ConceptChatSession) => {
    setIsSyncingDrive(true);
    try {
      let token = getStoredDriveToken();
      if (!token) {
        showToast('Đang kết nối tài khoản Google Drive...');
        token = await requestGoogleDriveToken();
      }

      const s: ConceptChatSession = targetSession || {
        id: currentSessionId,
        title: sessionTitle,
        initialTopic: initialTopic || undefined,
        createdAt: sessionCreatedAt,
        updatedAt: new Date().toISOString(),
        status: sessionStatus,
        associatedDossierId,
        messages,
        synthesis,
        selectedScenario
      };

      showToast('Đang lưu cuộc trò chuyện vào Google Drive...');
      const res = await syncIdeaJournalToDrive(token, s);

      const successMsg = res.isUpdated
        ? `✅ Đã cập nhật vào '${res.fileName}' trên Drive (${res.totalSections} mục)`
        : `✅ Đã lưu vào '${res.fileName}' trên Drive (${res.totalSections} mục)`;
      showToast(successMsg);
    } catch (err: any) {
      console.error('[QuickResearch] Drive sync error:', err);
      const errMsg = err?.message || 'Không thể đồng bộ Drive';
      if (errMsg.includes('401') || errMsg.includes('token') || errMsg.includes('auth')) {
        try {
          showToast('Mã truy cập hết hạn, đang kết nối lại...');
          const newToken = await requestGoogleDriveToken();
          const s: ConceptChatSession = targetSession || {
            id: currentSessionId,
            title: sessionTitle,
            initialTopic: initialTopic || undefined,
            createdAt: sessionCreatedAt,
            updatedAt: new Date().toISOString(),
            status: sessionStatus,
            associatedDossierId,
            messages,
            synthesis,
            selectedScenario
          };
          const res = await syncIdeaJournalToDrive(newToken, s);
          showToast(`✅ Đã lưu vào '${res.fileName}' trên Drive`);
          return;
        } catch (retryErr: any) {
          showToast(`Lỗi kết nối Drive: ${retryErr?.message || ''}`);
          return;
        }
      }
      showToast(`Lỗi đồng bộ Drive: ${errMsg}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  /**
   * Sync all stored sessions in history list to the unified SO_TAY_Y_TUONG_ONENESS.md on Google Drive
   */
  const handleSyncAllSessionsToDrive = async () => {
    if (historyList.length === 0) {
      showToast('Chưa có cuộc trò chuyện nào để đồng bộ');
      return;
    }
    setIsSyncingAllDrive(true);
    try {
      let token = getStoredDriveToken();
      if (!token) {
        showToast('Đang kết nối tài khoản Google Drive...');
        token = await requestGoogleDriveToken();
      }

      showToast(`Đang đồng bộ toàn bộ ${historyList.length} cuộc trò chuyện lên Drive...`);
      const res = await syncAllIdeaJournalsToDrive(token, historyList);
      showToast(`✅ Đã đồng bộ ${res.totalSynced} cuộc trò chuyện vào '${res.fileName}' trên Drive`);
    } catch (err: any) {
      console.error('[QuickResearch] Batch drive sync error:', err);
      showToast(`Lỗi đồng bộ: ${err?.message || 'Thất bại'}`);
    } finally {
      setIsSyncingAllDrive(false);
    }
  };

  // Restore on mount / when isOpen changes
  useEffect(() => {
    if (isOpen) {
      loadHistoryList();

      // Check if user specified a specific search topic from Search Cockpit
      if (initialTopic && initialTopic.trim()) {
        startNewSession(initialTopic.trim());
        return;
      }

      // If we already have messages in current state, keep them!
      if (messages.length > 0) {
        return;
      }

      // Try to load active session from server or localStorage
      const activeId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID);
      fetch('/api/concept-chats/active')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.chat && Array.isArray(data.chat.messages) && data.chat.messages.length > 0) {
            loadSpecificSession(data.chat);
          } else if (activeId) {
            const cached = localStorage.getItem(`og_concept_chat_${activeId}`);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
                  loadSpecificSession(parsed);
                  return;
                }
              } catch (e) {
                console.warn(e);
              }
            }
            startNewSession();
          } else {
            startNewSession();
          }
        })
        .catch(() => {
          startNewSession();
        });
    }
  }, [isOpen, initialTopic]);

  if (!isOpen) return null;

  // Trigger assistant chat response from messages
  async function triggerInterviewReply(currentMsgs: ConceptChatMessage[], sid?: string) {
    setIsThinking(true);
    setErrorMessage('');

    try {
      const apiPayload = currentMsgs.map(m => ({
        role: m.role,
        content: m.content
      }));

      const fetchResult = await safeFetchAIJson('/api/gemini/concept-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiPayload,
          model: selectedModel
        })
      });

      if (!fetchResult.ok || !fetchResult.data) {
        throw new Error(fetchResult.error || 'Không thể kết nối với Trợ lý Khai Phá.');
      }

      const data = fetchResult.data;
      if (!data.success || !data.replyText) {
        throw new Error(data.error || 'Trợ lý không đưa ra phản hồi.');
      }

      const nowIso = new Date().toISOString();
      const botReplyMsg: ConceptChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.replyText,
        timestamp: nowIso
      };

      const updatedMsgs = [...currentMsgs, botReplyMsg];
      setMessages(updatedMsgs);

      // Persist to backend JSON immediately with full AI response and timestamp!
      persistSession({
        id: sid || currentSessionId,
        messages: updatedMsgs
      });
    } catch (err: any) {
      console.error('Error in chat response:', err);
      const nowIso = new Date().toISOString();
      const fallbackReplyMsg: ConceptChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Tôi đã lắng nghe chia sẻ của bạn! Bạn có thể kể thêm đôi chút về những thuận lợi hoặc điều bạn còn băn khoăn nhất khi bắt tay vào ý tưởng này không?`,
        timestamp: nowIso
      };
      const updatedMsgs = [...currentMsgs, fallbackReplyMsg];
      setMessages(updatedMsgs);
      persistSession({
        id: sid || currentSessionId,
        messages: updatedMsgs
      });
    } finally {
      setIsThinking(false);
    }
  }

  // Handle Send User Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || isThinking) return;

    const nowIso = new Date().toISOString();
    const userMsg: ConceptChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: nowIso
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputMsg('');

    // Persist immediately with user message and timestamp
    persistSession({
      id: currentSessionId,
      messages: newMsgs
    });

    await triggerInterviewReply(newMsgs, currentSessionId);
  };

  // Handle Synthesize Outline from Chat Transcript
  const handleSynthesizeOutline = async () => {
    if (messages.length < 2) {
      setErrorMessage('Hãy trò chuyện chia sẻ thêm một vài câu trước khi tổng hợp nhé.');
      return;
    }

    setIsSynthesizing(true);
    setErrorMessage('');
    startProgress('Đang đọc toàn văn cuộc phỏng vấn & tổng hợp đề cương 6 Trụ Cột Động...');

    try {
      const apiPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const fetchResult = await safeFetchAIJson('/api/gemini/synthesize-interview-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiPayload,
          preferredScenario: selectedScenario,
          model: selectedModel
        })
      });

      if (!fetchResult.ok || !fetchResult.data) {
        throw new Error(fetchResult.error || 'Không thể tổng hợp cuộc phỏng vấn.');
      }

      const data = fetchResult.data;
      if (!data.success || !data.synthesis) {
        throw new Error(data.error || 'Lỗi khi tổng hợp đề cương từ Gemini.');
      }

      const synth: SynthesisResult = data.synthesis;
      setSynthesis(synth);
      setSelectedScenario(synth.recommendedScenario || 'business_plan');
      setEditableTitle(synth.proposedTitle || 'Đề Án Chuyển Hóa Ý Niệm Nghiên Cứu');
      setEditableAbstract(synth.proposedAbstract || synth.decodedEssence);
      setSessionStatus('synthesized');
      setModalMode('preview');

      // Persist synthesis into JSON store!
      persistSession({
        id: currentSessionId,
        status: 'synthesized',
        synthesis: synth,
        selectedScenario: synth.recommendedScenario || 'business_plan'
      });

      const scenarioObj = SCENARIO_OPTIONS.find(s => s.id === (synth.recommendedScenario || 'business_plan'));
      finishProgress(`Đã tổng hợp thành công đề cương ${scenarioObj?.chaptersTotal || 24} chương!`);
    } catch (err: any) {
      console.error('Failed to synthesize outline:', err);
      setErrorMessage('Có lỗi xảy ra khi tổng hợp cuộc trò chuyện. Vui lòng thử lại.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Save Dossier & Open Project Space
  const handleSaveAndOpenProject = async () => {
    if (!synthesis || isSavingDossier) return;

    setIsSavingDossier(true);
    try {
      const activeScenarioObj = SCENARIO_OPTIONS.find(s => s.id === selectedScenario) || SCENARIO_OPTIONS[0];
      const totalChapters = synthesis.pillars.reduce((acc, p) => acc + p.chapters.length, 0);

      const newDossierId = `project-${Date.now()}`;
      const newDossier: Dossier = {
        id: newDossierId,
        pillarId: 'dynamic-project',
        pillarTitle: synthesis.pillars[0]?.title || 'Trụ Cột Nghiên Cứu',
        chapterNumber: nextChapterNumber && nextChapterNumber > 0 ? nextChapterNumber : 1,
        title: editableTitle.trim() || synthesis.proposedTitle,
        subtitle: editableAbstract.trim() || synthesis.proposedSubtitle || synthesis.decodedEssence,
        discipline: synthesis.detectedDomain || 'Chuyển Đổi Số & Quản Trị Nghiên Cứu',
        interdisciplinaryFields: synthesis.interdisciplinaryFields || ['Kinh Tế Số', 'Tự Động Hóa Quy Trình'],
        depthLevel: selectedScenario === 'dissertation' ? 'dissertation' : 'foundational',
        tags: ['Khai Phá Ý Niệm', activeScenarioObj.name, '6 Trụ Cột Động', 'Interview Synthesized'],
        abstract: editableAbstract.trim() || synthesis.proposedAbstract,
        contentMarkdown: `# ${editableTitle.trim() || synthesis.proposedTitle}\n\n> *${editableAbstract.trim() || synthesis.proposedAbstract}*\n\n---\n\n### Lý do Khung Đề Cương Được Lựa Chọn:\n${synthesis.scenarioRationale || 'Đề cương được tổng hợp trực tiếp từ cuộc phỏng vấn định hướng ý niệm.'}\n\n---\n\n## Cấu Trúc Khung Nghiên Cứu (${totalChapters} Chương - Kịch Bản ${activeScenarioObj.name})\n\n${synthesis.pillars.map(p => `### ${p.title}\n*${p.description}*\n\n${p.chapters.map((c, i) => `${i + 1}. **${c.title}** *(Chờ viết bài)*`).join('\n')}`).join('\n\n---\n\n')}`,
        keyFindings: [
          `Đã giải mã ý niệm nguyên thủy qua cuộc phỏng vấn tư vấn trực tiếp.`,
          `Thiết lập khung cấu trúc ${totalChapters} chương theo kịch bản '${activeScenarioObj.name}'.`,
          `Mỗi chương có thể viết riêng từng bài độc lập bằng nút 'Viết Bằng Gemini AI'.`
        ],
        philosophicalBasis: [],
        technicalMappings: [],
        citations: [],
        lastModified: new Date().toISOString(),
        status: 'draft',
        isDynamicProject: true,
        mode: selectedScenario === 'dissertation' ? 'advanced' : 'deep',
        projectStructure: synthesis.pillars
      };

      // Mark chat session as converted & associate with dossier ID in JSON file!
      setSessionStatus('converted_to_dossier');
      setAssociatedDossierId(newDossierId);
      await persistSession({
        id: currentSessionId,
        status: 'converted_to_dossier',
        associatedDossierId: newDossierId
      });

      // Clear active pointer from localStorage so next time starts fresh
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ID);

      await onSaveDossier(newDossier);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu hồ sơ nghiên cứu.');
      setIsSavingDossier(false);
    }
  };

  const filteredHistory = historyList.filter(item => {
    if (!historySearchTerm.trim()) return true;
    const term = historySearchTerm.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.id && item.id.toLowerCase().includes(term)) ||
      (item.initialTopic && item.initialTopic.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Main Modal Container */}
      <div className={`relative w-full max-w-5xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col transition-all h-[94vh] max-h-[860px] ${
        theme === 'dark' 
          ? 'bg-[#0e0c1f] border-purple-500/30 text-slate-100 shadow-purple-950/50' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`p-3 sm:p-4 px-3 sm:px-6 border-b shrink-0 flex items-center justify-between gap-2 sm:gap-4 ${
          theme === 'dark' ? 'border-slate-800 bg-[#121028]/95' : 'border-slate-100 bg-slate-50'
        }`}>
          {/* Left Brand & Title Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-extrabold text-xs sm:text-sm md:text-base leading-tight tracking-wide text-white truncate">
                  {modalMode === 'chat' ? 'KHAI PHÁ Ý NIỆM' : 'TỔNG HỢP KHUNG NGHIÊN CỨU'}
                </h2>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase whitespace-nowrap">
                  OG IDEA COUNSELOR
                </span>
                {sessionStatus === 'synthesized' && (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold whitespace-nowrap">
                    Đã Lập Đề Cương
                  </span>
                )}
                {sessionStatus === 'converted_to_dossier' && (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold whitespace-nowrap">
                    Đã Tạo Hồ Sơ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] opacity-80 font-mono mt-0.5 truncate">
                <span className="flex items-center gap-1 text-emerald-400 font-medium whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Tự động lưu ({messages.length} tin)</span>
                </span>
                {lastSavedTime && (
                  <span className="hidden md:inline opacity-60 truncate">• {lastSavedTime}</span>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons - Priority Ordered */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Utility Toolbar Group */}
            <div className={`flex items-center p-0.5 rounded-xl border ${
              theme === 'dark' ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-100 border-slate-300'
            }`}>
              {/* History Drawer Toggle */}
              <button
                type="button"
                onClick={() => {
                  loadHistoryList();
                  setIsHistoryDrawerOpen(prev => !prev);
                }}
                className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isHistoryDrawerOpen
                    ? 'bg-purple-600 text-white shadow-sm'
                    : theme === 'dark'
                      ? 'hover:bg-slate-800 text-slate-300'
                      : 'hover:bg-white text-slate-700'
                }`}
                title="Xem danh sách các cuộc hội thoại đã lưu trữ dạng JSON"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline text-[11px]">Lịch Sử</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                  {historyList.length}
                </span>
              </button>

              {/* Start New Session */}
              <button
                type="button"
                onClick={() => startNewSession()}
                className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-white text-slate-700'
                }`}
                title="Bắt đầu cuộc hội thoại khai phá ý niệm mới"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline text-[11px]">Mới</span>
              </button>

              {/* One-Click Google Drive Sync Button */}
              <button
                type="button"
                onClick={() => handleSyncCurrentToDrive()}
                disabled={isSyncingDrive}
                className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isSyncingDrive
                    ? 'bg-emerald-600/20 text-emerald-300 animate-pulse'
                    : theme === 'dark'
                      ? 'hover:bg-emerald-950/60 text-emerald-300'
                      : 'hover:bg-emerald-100 text-emerald-800'
                }`}
                title="Đồng bộ cuộc trò chuyện này lên Google Drive (Tệp SO_TAY_Y_TUONG_ONENESS.md)"
              >
                {isSyncingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="hidden xl:inline text-[11px]">Drive</span>
              </button>

              {/* Export JSON / Transcript */}
              <button
                type="button"
                onClick={() => handleExportJson()}
                className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-white text-slate-700'
                }`}
                title="Tải tệp JSON nhật ký trò chuyện đầy đủ"
              >
                <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline text-[11px]">JSON</span>
              </button>

              {/* Delete / Clear Active Chat */}
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState({
                    isOpen: true,
                    type: 'current',
                    targetTitle: sessionTitle
                  })}
                  className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'hover:bg-red-950/60 text-slate-400 hover:text-red-300'
                      : 'hover:bg-red-100 text-slate-500 hover:text-red-700'
                  }`}
                  title="Xóa cuộc trò chuyện hiện tại"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>

            {/* Synthesize Button - High Visibility CTA */}
            {modalMode === 'chat' && messages.length >= 2 && (
              <button
                type="button"
                onClick={handleSynthesizeOutline}
                disabled={isSynthesizing}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/25 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                title="Tổng hợp và lập đề cương nghiên cứu từ các thông tin đã trao đổi"
              >
                {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span className="hidden sm:inline">TỔNG HỢP & LẬP ĐỀ CƯƠNG</span>
                <span className="sm:hidden">LẬP ĐỀ CƯƠNG</span>
              </button>
            )}

            {/* Close Modal (Preserves chat draft in state & JSON storage!) */}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl hover:bg-slate-500/20 transition-colors text-slate-400 hover:text-slate-200 cursor-pointer shrink-0"
              title="Đóng cửa sổ (bản nháp vẫn được giữ nguyên)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY AREA (With Side Drawer for History if opened) */}
        <div className="flex-1 overflow-hidden flex relative">
          
          {/* Main Chat / Preview Column */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {errorMessage && (
              <div className="p-3 m-3 mb-0 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between shrink-0">
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage('')}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* MODE 1: CHAT INTERVIEW */}
            {modalMode === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Active Session Info Strip */}
                <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono shrink-0 ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80 text-slate-400' : 'bg-slate-100/70 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-purple-400 truncate">💬 {sessionTitle}</span>
                    <span className="opacity-50 text-[10px] hidden sm:inline">({formatDateTime(sessionCreatedAt)})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {isAutoSaving ? 'Đang lưu...' : 'JSON Persistent'}
                    </span>
                    {messages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmState({
                          isOpen: true,
                          type: 'current',
                          targetTitle: sessionTitle
                        })}
                        className="px-2 py-0.5 rounded text-[10.5px] hover:bg-red-950/50 text-slate-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer border border-transparent hover:border-red-500/30"
                        title="Xóa phiên trò chuyện này"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span className="hidden sm:inline">Xóa phiên</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                      }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className={`p-3.5 sm:p-4 rounded-2xl space-y-2 leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : theme === 'dark'
                            ? 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-none'
                            : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}>
                        {/* Header for Speaker and Exact Timestamp */}
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono pb-1 border-b border-white/10 opacity-75">
                          <span className="font-bold uppercase tracking-wider">
                            {msg.role === 'user' ? 'Bạn (Người Dùng)' : 'Trợ Lý Khai Phá (AI)'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDateTime(msg.timestamp) || formatShortTime(msg.timestamp)}</span>
                          </span>
                        </div>

                        {/* Content */}
                        <div className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 flex items-center gap-2 text-xs rounded-tl-none">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span>Trợ lý đang lắng nghe & suy ngẫm câu hỏi tiếp theo...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className={`p-3.5 sm:p-4 border-t shrink-0 ${
                  theme === 'dark' ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder="Nhập suy nghĩ, câu trả lời hoặc thắc mắc của bạn..."
                      disabled={isThinking}
                      className={`flex-1 p-3 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!inputMsg.trim() || isThinking}
                      className="p-3 sm:px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-40 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Gửi</span>
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-mono mt-2 px-1">
                    <div className="flex items-center gap-2">
                      <span>
                        Trò chuyện tự do • Tự động lưu JSON
                      </span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleSyncCurrentToDrive()}
                        disabled={isSyncingDrive}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        title="Đồng bộ ngay cuộc trò chuyện này lên Google Drive (SO_TAY_Y_TUONG_ONENESS.md)"
                      >
                        <CloudUpload className="w-3 h-3" />
                        <span>{isSyncingDrive ? 'Đang lưu Drive...' : 'Lưu vào Drive'}</span>
                      </button>
                    </div>
                    {messages.filter(m => m.role === 'user').length >= 1 && (
                      <button
                        type="button"
                        onClick={handleSynthesizeOutline}
                        className="text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Lập đề cương ngay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: SYNTHESIZED PREVIEW */}
            {modalMode === 'preview' && synthesis && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Top Banner: Rationale */}
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-purple-400" />
                      BẢN CHẤT TỔNG HỢP TỪ CUỘC PHỎNG VẤN
                    </span>
                    <button
                      onClick={() => setModalMode('chat')}
                      className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Quay lại trò chuyện tiếp
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    {synthesis.decodedEssence}
                  </p>
                  {synthesis.scenarioRationale && (
                    <p className="text-[11px] text-purple-300/90 italic">
                      💡 <strong>Lý do chọn kịch bản:</strong> {synthesis.scenarioRationale}
                    </p>
                  )}
                </div>

                {/* Title & Abstract Editable */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-purple-400">Tiêu đề Công trình / Đề án chuẩn hóa</label>
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="w-full p-2.5 text-xs font-bold bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-purple-400">Tóm tắt Tổng quan (Abstract)</label>
                    <textarea
                      value={editableAbstract}
                      onChange={(e) => setEditableAbstract(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Scenario Option Selector Override */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Kịch Bản Nghiên Cứu ({SCENARIO_OPTIONS.find(s => s.id === selectedScenario)?.chaptersTotal} Chương)</span>
                    <span className="text-[11px] text-purple-400 font-normal">Bạn có thể thay đổi kịch bản nếu muốn</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {SCENARIO_OPTIONS.map((sc) => {
                      const isSel = selectedScenario === sc.id;
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setSelectedScenario(sc.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-purple-950/50 border-purple-500 text-white ring-1 ring-purple-500' 
                              : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] text-white truncate">{sc.name}</div>
                          <div className="text-[9.5px] font-mono text-purple-300">{sc.badge}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pillars Structure */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Cấu Trúc Khung 6 Trụ Cột Động
                  </h3>
                  <div className="space-y-2.5">
                    {synthesis.pillars.map((pillar) => (
                      <div key={pillar.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-purple-300">{pillar.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {pillar.chapters.length} chương
                          </span>
                        </div>
                        {pillar.description && (
                          <p className="text-[11px] text-slate-400 italic">{pillar.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1">
                          {pillar.chapters.map((ch, cIdx) => (
                            <div key={ch.id} className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-purple-950 text-purple-300 text-[9.5px] font-mono font-bold flex items-center justify-center shrink-0">
                                {cIdx + 1}
                              </span>
                              <span className="truncate">{ch.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDE DRAWER: SAVED CONCEPT CHATS HISTORY (JSON ARCHIVE) */}
          {isHistoryDrawerOpen && (
            <div className={`w-80 sm:w-96 border-l flex flex-col shrink-0 z-20 transition-all ${
              theme === 'dark' ? 'bg-[#0b0a1a] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Drawer Header */}
              <div className="p-3.5 px-4 border-b flex items-center justify-between border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider font-mono">Nhật Ký Trò Chuyện JSON</h3>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Actions */}
              <div className="p-3 border-b border-slate-800 space-y-2.5">
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={e => setHistorySearchTerm(e.target.value)}
                  placeholder="Tìm kiếm phiên trò chuyện..."
                  className="w-full p-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-purple-500 font-mono"
                />
                
                {/* Batch Drive Sync Button */}
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncAllSessionsToDrive}
                    disabled={isSyncingAllDrive}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    title="Đồng bộ toàn bộ danh sách phiên trò chuyện vào SO_TAY_Y_TUONG_ONENESS.md trên Drive"
                  >
                    {isSyncingAllDrive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{isSyncingAllDrive ? 'Đang đồng bộ tất cả...' : `Đồng Bộ Tất Cả Lên Drive (${historyList.length})`}</span>
                  </button>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>Tệp lưu trữ: {filteredHistory.length}</span>
                  <div className="flex items-center gap-2">
                    {historyList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmState({
                          isOpen: true,
                          type: 'all'
                        })}
                        className="hover:text-red-400 text-slate-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xóa vĩnh viễn toàn bộ danh sách lịch sử"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Xóa tất cả</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={loadHistoryList}
                      className="hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredHistory.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-mono space-y-2">
                    <FileJson className="w-8 h-8 mx-auto opacity-30 text-purple-400" />
                    <p>Chưa có tệp nhật ký nào được lưu.</p>
                  </div>
                ) : (
                  filteredHistory.map((s) => {
                    const isCurrent = s.id === currentSessionId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => loadSpecificSession(s)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                          isCurrent
                            ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40'
                            : 'bg-slate-950/40 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                            isCurrent ? 'text-purple-300' : 'text-slate-200 group-hover:text-white'
                          }`}>
                            {s.title || 'Khám phá ý niệm'}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncCurrentToDrive(s);
                              }}
                              className="p-1 hover:bg-emerald-950/60 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Lưu phiên này vào Google Drive"
                            >
                              <CloudUpload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportJson(s);
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 transition-colors"
                              title="Tải JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportMarkdown(s);
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-purple-300 transition-colors"
                              title="Tải Markdown"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmState({
                                  isOpen: true,
                                  type: 'single',
                                  targetId: s.id,
                                  targetTitle: s.title
                                });
                              }}
                              className="p-1 hover:bg-red-950/60 rounded text-slate-400 hover:text-red-400 transition-colors"
                              title="Xóa vĩnh viễn tệp này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span>{formatDateTime(s.createdAt)}</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {s.messages?.length || 0} tin
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {s.status === 'converted_to_dossier' ? (
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 font-bold">
                              ✓ Đã tạo hồ sơ
                            </span>
                          ) : s.status === 'synthesized' ? (
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-bold">
                              ✓ Đã lập đề cương
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                              💬 Đang trao đổi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Area for Preview Mode */}
        {modalMode === 'preview' && (
          <div className={`p-3.5 sm:p-4 px-6 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            theme === 'dark' ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
          }`}>
            <button
              type="button"
              onClick={() => setModalMode('chat')}
              className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại trò chuyện tiếp</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSyncCurrentToDrive()}
                disabled={isSyncingDrive}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60"
                title="Lưu đề cương và nhật ký này vào Google Drive (SO_TAY_Y_TUONG_ONENESS.md)"
              >
                {isSyncingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isSyncingDrive ? 'Đang lưu Drive...' : 'Lưu Vào Google Drive'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndOpenProject}
                disabled={isSavingDossier}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSavingDossier ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                <span>LƯU HỒ SƠ & MỞ KHÔNG GIAN VIẾT BÀI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium shadow-xl flex items-center gap-2 border border-purple-400/40 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* IN-APP CONFIRMATION DIALOG MODAL (Iframe Safe) */}
        {deleteConfirmState?.isOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirmState(null)}
          >
            <div 
              className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl space-y-4 ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-700 text-white' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-sm sm:text-base leading-snug">
                    {deleteConfirmState.type === 'all' 
                      ? 'Xác nhận xóa toàn bộ lịch sử trò chuyện?' 
                      : deleteConfirmState.type === 'current'
                        ? 'Xóa cuộc trò chuyện hiện tại?'
                        : 'Xóa tệp nhật ký trò chuyện?'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {deleteConfirmState.type === 'all'
                      ? `Hệ thống sẽ xóa vĩnh viễn tất cả (${historyList.length}) tệp nhật ký hội thoại đã lưu trên máy chủ và bộ nhớ đệm. Thao tác này không thể hoàn tác.`
                      : deleteConfirmState.type === 'current'
                        ? `Bạn có chắc muốn xóa vĩnh viễn toàn bộ tin nhắn trong cuộc trò chuyện "${deleteConfirmState.targetTitle || sessionTitle}" và khởi tạo lại phiên mới?`
                        : `Bạn có chắc muốn xóa vĩnh viễn tệp nhật ký "${deleteConfirmState.targetTitle || 'Khám phá ý niệm'}"? Thao tác này không thể hoàn tác.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState(null)}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmState.type === 'all') {
                      executeDeleteAll();
                    } else if (deleteConfirmState.type === 'current') {
                      executeDeleteCurrent();
                    } else if (deleteConfirmState.targetId) {
                      executeDeleteSingle(deleteConfirmState.targetId);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
