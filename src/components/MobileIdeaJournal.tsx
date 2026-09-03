import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Send, Loader2, Plus, History, Download, Trash2,
  CheckCircle2, Share2, Copy, Moon, Sun, Monitor, MoreVertical,
  BookOpen, Calendar, Clock, RefreshCw, X, ChevronRight, Edit3, ArrowLeft,
  Cloud, CloudUpload, HardDrive, Check, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { ConceptChatMessage, ConceptChatSession } from '../types';
import { safeFetchAIJson } from '../utils/ai-client';
import { normalizeMarkdownTables } from '../utils/markdownSanitizer';
import {
  getStoredDriveToken,
  requestGoogleDriveToken,
  syncIdeaJournalToDrive,
  syncAllIdeaJournalsToDrive,
  generateIdeaJournalFileHeader,
  formatConceptChatToMarkdownSection,
  IDEA_JOURNAL_FILENAME
} from '../utils/googleDriveSync';
import { OGLogo } from './OGLogo';

const LOCAL_STORAGE_ACTIVE_ID = 'og_active_concept_chat_id';

interface MobileIdeaJournalProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchToDesktop: () => void;
}

const createInitialSessionState = (): {
  id: string;
  title: string;
  createdAt: string;
  messages: ConceptChatMessage[];
} => {
  const nowIso = new Date().toISOString();
  const defaultWelcomeMsg: ConceptChatMessage = {
    id: `msg-welcome-${Date.now()}`,
    role: 'assistant',
    content: `👋 **Chào bạn! Đây là cuốn sổ ý niệm của bạn.**\n\nBạn đang ấp ủ ý tưởng, dự định hay bài toán thực tế nào cần giải quyết? Hãy chia sẻ với tôi bất cứ điều gì bạn đang suy nghĩ nhé — từ một ý niệm sơ khởi đến một kế hoạch cụ thể.\n\n**Bạn muốn chia sẻ điều gì hôm nay?**`,
    timestamp: nowIso
  };

  try {
    // 1. Check active session ID in localStorage
    const activeId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID);
    if (activeId) {
      const cached = localStorage.getItem(`og_concept_chat_${activeId}`);
      if (cached) {
        const parsed: ConceptChatSession = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          return {
            id: parsed.id,
            title: parsed.title || 'Ý niệm mới',
            createdAt: parsed.createdAt || nowIso,
            messages: parsed.messages
          };
        }
      }
    }

    // 2. If no active ID, look for the most recently updated local session
    const localSessions: ConceptChatSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('og_concept_chat_')) {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed: ConceptChatSession = JSON.parse(val);
            if (parsed && parsed.id && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
              localSessions.push(parsed);
            }
          }
        } catch (e) {}
      }
    }

    if (localSessions.length > 0) {
      localSessions.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      const latest = localSessions[0];
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, latest.id);
      return {
        id: latest.id,
        title: latest.title || 'Ý niệm mới',
        createdAt: latest.createdAt || nowIso,
        messages: latest.messages
      };
    }
  } catch (e) {
    console.warn('[MobileJournal] Init storage read error:', e);
  }

  // 3. Fallback: Create brand new initial session
  const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const initialSession: ConceptChatSession = {
    id: newId,
    title: 'Ý niệm mới',
    createdAt: nowIso,
    updatedAt: nowIso,
    status: 'active',
    messages: [defaultWelcomeMsg],
    selectedScenario: 'business_plan'
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, newId);
    localStorage.setItem(`og_concept_chat_${newId}`, JSON.stringify(initialSession));
  } catch (e) {}

  return {
    id: newId,
    title: 'Ý niệm mới',
    createdAt: nowIso,
    messages: [defaultWelcomeMsg]
  };
};

export const MobileIdeaJournal: React.FC<MobileIdeaJournalProps> = ({
  theme,
  onToggleTheme,
  onSwitchToDesktop
}) => {
  // Synchronous State Initialization
  const [initialData] = useState(createInitialSessionState);
  const [currentSessionId, setCurrentSessionId] = useState<string>(initialData.id);
  const [sessionTitle, setSessionTitle] = useState<string>(initialData.title);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string>(initialData.createdAt);
  const [messages, setMessages] = useState<ConceptChatMessage[]>(initialData.messages);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Drawers & Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [historyList, setHistoryList] = useState<ConceptChatSession[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Edit Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState('');

  // Confirmation & Toast
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'single' | 'current' | 'all';
    targetId?: string;
    targetTitle?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Drive Sync State
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isSyncingAllDrive, setIsSyncingAllDrive] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Persist Session to LocalStorage, In-Memory History List, and Server Backend
  const saveSession = async (
    sid: string,
    title: string,
    msgs: ConceptChatMessage[],
    createdAt: string
  ) => {
    setIsAutoSaving(true);
    const nowIso = new Date().toISOString();

    let computedTitle = title;
    if ((!computedTitle || computedTitle === 'Ý niệm mới' || computedTitle === 'Trò chuyện khai phá ý niệm mới') && msgs.length > 0) {
      const firstUserMsg = msgs.find(m => m.role === 'user');
      if (firstUserMsg) {
        computedTitle = firstUserMsg.content.trim().slice(0, 45) + (firstUserMsg.content.length > 45 ? '...' : '');
      }
    }

    const payload: ConceptChatSession = {
      id: sid,
      title: computedTitle || 'Cuốn Sổ Ý Tưởng',
      createdAt: createdAt,
      updatedAt: nowIso,
      status: 'active',
      messages: msgs,
      selectedScenario: 'business_plan'
    };

    // 1. Immediate local persistence
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, sid);
      localStorage.setItem(`og_concept_chat_${sid}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('[MobileJournal] LocalStorage write error:', e);
    }

    setSessionTitle(payload.title);
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedTime(timeFormatted);

    // 2. Immediate React history list state update
    setHistoryList(prev => {
      const existingIdx = prev.findIndex(item => item.id === sid);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = payload;
        return updated.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      } else {
        return [payload, ...prev];
      }
    });

    // 3. Persist to server backend JSON filesystem
    try {
      await fetch('/api/concept-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('[MobileJournal] Persist API error:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Start Fresh Session
  const startNewSession = () => {
    const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const welcomeMsg: ConceptChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'assistant',
      content: `👋 **Chào bạn! Đây là cuốn sổ ý niệm của bạn.**\n\nBạn đang ấp ủ ý tưởng, dự định hay bài toán thực tế nào cần giải quyết? Hãy chia sẻ với tôi bất cứ điều gì bạn đang suy nghĩ nhé — từ một ý niệm sơ khởi đến một kế hoạch cụ thể.\n\n**Bạn muốn chia sẻ điều gì hôm nay?**`,
      timestamp: nowIso
    };

    setCurrentSessionId(newId);
    setSessionTitle('Ý niệm mới');
    setSessionCreatedAt(nowIso);
    setMessages([welcomeMsg]);
    setInputText('');
    setIsHistoryOpen(false);
    setIsMenuOpen(false);

    saveSession(newId, 'Ý niệm mới', [welcomeMsg], nowIso);
    showToast('Đã tạo trang sổ mới');
  };

  // Load History List (Merged Local + Server)
  const loadHistoryList = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      // 1. Collect all local sessions
      const localMap = new Map<string, ConceptChatSession>();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('og_concept_chat_')) {
          try {
            const val = localStorage.getItem(k);
            if (val) {
              const parsed: ConceptChatSession = JSON.parse(val);
              if (parsed && parsed.id) {
                localMap.set(parsed.id, parsed);
              }
            }
          } catch (e) {}
        }
      }

      // 2. Fetch server sessions
      try {
        const res = await fetch('/api/concept-chats');
        const data = await res.json();
        const serverList: ConceptChatSession[] =
          data.success && Array.isArray(data.chats)
            ? data.chats
            : data.success && Array.isArray(data.sessions)
              ? data.sessions
              : [];

        // 3. Merge server items into local map (take whichever has newer updatedAt)
        serverList.forEach(serverSession => {
          const localItem = localMap.get(serverSession.id);
          if (!localItem) {
            localMap.set(serverSession.id, serverSession);
            try {
              localStorage.setItem(`og_concept_chat_${serverSession.id}`, JSON.stringify(serverSession));
            } catch (e) {}
          } else {
            const timeLocal = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
            const timeServer = new Date(serverSession.updatedAt || serverSession.createdAt || 0).getTime();
            if (timeServer >= timeLocal) {
              localMap.set(serverSession.id, serverSession);
              try {
                localStorage.setItem(`og_concept_chat_${serverSession.id}`, JSON.stringify(serverSession));
              } catch (e) {}
            }
          }
        });
      } catch (err) {
        console.warn('[MobileJournal] Server fetch error, using local data:', err);
      }

      const mergedList = Array.from(localMap.values()).sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setHistoryList(mergedList);
    } catch (err) {
      console.warn('[MobileJournal] Load history error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Hydrate & sync on initial mount
  useEffect(() => {
    let isMounted = true;
    const initializeJournal = async () => {
      await loadHistoryList();

      // Check if backend has a more recent active chat with messages
      try {
        const res = await fetch('/api/concept-chats/active');
        const data = await res.json();
        if (data.success && data.chat && isMounted) {
          const serverActive: ConceptChatSession = data.chat;
          // Only override if current session is empty/welcome-only and server has substantive messages
          setMessages(currentMsgs => {
            const userMsgCount = currentMsgs.filter(m => m.role === 'user').length;
            if (userMsgCount === 0 && serverActive.messages && serverActive.messages.length > 1) {
              setCurrentSessionId(serverActive.id);
              setSessionTitle(serverActive.title || 'Ý niệm mới');
              setSessionCreatedAt(serverActive.createdAt || new Date().toISOString());
              try {
                localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, serverActive.id);
                localStorage.setItem(`og_concept_chat_${serverActive.id}`, JSON.stringify(serverActive));
              } catch (e) {}
              return serverActive.messages;
            }
            return currentMsgs;
          });
        }
      } catch (e) {
        console.warn('[MobileJournal] Active chat sync failed:', e);
      }
    };

    initializeJournal();
    return () => {
      isMounted = false;
    };
  }, [loadHistoryList]);

  // Reload history when drawer is opened
  useEffect(() => {
    if (isHistoryOpen) {
      loadHistoryList();
    }
  }, [isHistoryOpen, loadHistoryList]);

  // Switch to selected session
  const selectSession = (session: ConceptChatSession) => {
    setCurrentSessionId(session.id);
    setSessionTitle(session.title || 'Ý niệm mới');
    setSessionCreatedAt(session.createdAt || new Date().toISOString());
    setMessages(session.messages || []);
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID, session.id);
      localStorage.setItem(`og_concept_chat_${session.id}`, JSON.stringify(session));
    } catch (e) {}
    setIsHistoryOpen(false);
    showToast(`Đã mở "${session.title || 'Sổ ý niệm'}"`);
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isThinking) return;

    const userText = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const nowIso = new Date().toISOString();
    const userMsg: ConceptChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: nowIso
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    let updatedTitle = sessionTitle;
    if (sessionTitle === 'Ý niệm mới' || sessionTitle === 'Trò chuyện khai phá ý niệm mới') {
      updatedTitle = userText.slice(0, 45) + (userText.length > 45 ? '...' : '');
      setSessionTitle(updatedTitle);
    }

    saveSession(currentSessionId, updatedTitle, nextMessages, sessionCreatedAt);

    setIsThinking(true);

    try {
      const fetchResult = await safeFetchAIJson<{ success: boolean; replyText: string; error?: string }>(
        '/api/gemini/concept-interview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
            model: 'gemini-3.7-flash'
          })
        }
      );

      if (fetchResult.ok && fetchResult.data && fetchResult.data.success && fetchResult.data.replyText) {
        const assistantMsg: ConceptChatMessage = {
          id: `msg-a-${Date.now()}`,
          role: 'assistant',
          content: fetchResult.data.replyText,
          timestamp: new Date().toISOString()
        };
        const allMsgs = [...nextMessages, assistantMsg];
        setMessages(allMsgs);
        saveSession(currentSessionId, updatedTitle, allMsgs, sessionCreatedAt);
      } else {
        throw new Error(fetchResult.error || fetchResult.data?.error || 'Không nhận được phản hồi');
      }
    } catch (err: any) {
      console.error('[MobileJournal] Chat error:', err);
      const fallbackMsg: ConceptChatMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        content: `Tôi đã lắng nghe chia sẻ của bạn! Bạn có thể kể thêm đôi chút về điều bạn đang băn khoăn hay mong muốn giải quyết nhất trong ý niệm này không?`,
        timestamp: new Date().toISOString()
      };
      const allMsgs = [...nextMessages, fallbackMsg];
      setMessages(allMsgs);
      saveSession(currentSessionId, updatedTitle, allMsgs, sessionCreatedAt);
    } finally {
      setIsThinking(false);
    }
  };

  // Delete Actions
  const executeDeleteSingle = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetch(`/api/concept-chats/${id}`, { method: 'DELETE' });
      setHistoryList(prev => prev.filter(i => i.id !== id));
      try {
        localStorage.removeItem(`og_concept_chat_${id}`);
      } catch (e) {}
      if (id === currentSessionId) {
        startNewSession();
      }
      showToast('Đã xóa tệp nhật ký ý niệm');
    } catch (e) {
      console.error(e);
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
      setHistoryList(prev => prev.filter(i => i.id !== sid));
      startNewSession();
      showToast('Đã dọn sạch cuộc trò chuyện hiện tại');
    } catch (e) {
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
      historyList.forEach(i => {
        try {
          localStorage.removeItem(`og_concept_chat_${i.id}`);
        } catch (e) {}
      });
      try {
        localStorage.removeItem(`og_concept_chat_${currentSessionId}`);
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ID);
      } catch (e) {}
      setHistoryList([]);
      startNewSession();
      showToast('Đã dọn dẹp toàn bộ các trang sổ');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmState(null);
    }
  };

  // Sharing & Exporting
  const handleShare = async () => {
    const textContent = `# ${sessionTitle}\n\n` + messages.map(m => `### ${m.role === 'user' ? 'Tôi' : 'OG AI'}:\n${m.content}`).join('\n\n---\n\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: sessionTitle,
          text: textContent
        });
        showToast('Đã mở menu chia sẻ');
        setIsMenuOpen(false);
        return;
      } catch (e) {}
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(textContent);
      showToast('Đã sao chép toàn bộ nội dung sổ ý niệm');
    } catch (e) {
      showToast('Không thể sao chép văn bản');
    }
    setIsMenuOpen(false);
  };

  const handleDownloadMarkdown = (session?: ConceptChatSession) => {
    const s = session || {
      id: currentSessionId,
      title: sessionTitle,
      createdAt: sessionCreatedAt,
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      messages
    };

    const md = generateIdeaJournalFileHeader() + formatConceptChatToMarkdownSection(s, 1);

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OG-Y-Niem-${(s.title || 'chat').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống tệp Markdown');
    setIsMenuOpen(false);
  };

  const handleDownloadJson = (session?: ConceptChatSession) => {
    const s = session || {
      id: currentSessionId,
      title: sessionTitle,
      createdAt: sessionCreatedAt,
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      messages
    };

    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OG-IdeaJournal-${s.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống tệp JSON');
    setIsMenuOpen(false);
  };

  /**
   * One-Click Google Drive Sync for current active or selected session
   * Saves or appends into the unified SO_TAY_Y_TUONG_ONENESS.md
   */
  const handleSyncCurrentSessionToDrive = async (targetSession?: ConceptChatSession) => {
    setIsSyncingDrive(true);
    setIsMenuOpen(false);

    try {
      let token = getStoredDriveToken();
      if (!token) {
        showToast('Đang kết nối tài khoản Google Drive...');
        token = await requestGoogleDriveToken();
      }

      const s: ConceptChatSession = targetSession || {
        id: currentSessionId,
        title: sessionTitle,
        createdAt: sessionCreatedAt,
        updatedAt: new Date().toISOString(),
        status: 'active',
        messages,
        selectedScenario: 'business_plan'
      };

      showToast('Đang lưu vào Sổ Tay Drive...');
      const res = await syncIdeaJournalToDrive(token, s);

      const successMsg = res.isUpdated
        ? `✅ Đã cập nhật vào '${res.fileName}' trên Drive (${res.totalSections} mục)`
        : `✅ Đã thêm vào '${res.fileName}' trên Drive (${res.totalSections} mục)`;
      showToast(successMsg);
    } catch (err: any) {
      console.error('[MobileJournal] Drive sync error:', err);
      const errMsg = err?.message || 'Không thể đồng bộ Drive';
      if (errMsg.includes('401') || errMsg.includes('token') || errMsg.includes('auth')) {
        try {
          showToast('Mã truy cập hết hạn, đang kết nối lại...');
          const newToken = await requestGoogleDriveToken();
          const s: ConceptChatSession = targetSession || {
            id: currentSessionId,
            title: sessionTitle,
            createdAt: sessionCreatedAt,
            updatedAt: new Date().toISOString(),
            status: 'active',
            messages,
            selectedScenario: 'business_plan'
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
   * Sync all stored sessions to the unified SO_TAY_Y_TUONG_ONENESS.md on Google Drive
   */
  const handleSyncAllSessionsToDrive = async () => {
    if (historyList.length === 0) {
      showToast('Chưa có trang sổ nào để đồng bộ');
      return;
    }
    setIsSyncingAllDrive(true);
    try {
      let token = getStoredDriveToken();
      if (!token) {
        showToast('Đang kết nối tài khoản Google Drive...');
        token = await requestGoogleDriveToken();
      }

      showToast(`Đang đồng bộ toàn bộ ${historyList.length} trang sổ...`);
      const res = await syncAllIdeaJournalsToDrive(token, historyList);
      showToast(`✅ Đã đồng bộ ${res.totalSynced} trang sổ vào '${res.fileName}' trên Drive`);
    } catch (err: any) {
      console.error('[MobileJournal] Batch drive sync error:', err);
      showToast(`Lỗi đồng bộ: ${err?.message || 'Thất bại'}`);
    } finally {
      setIsSyncingAllDrive(false);
    }
  };

  const filteredHistory = historyList.filter(item => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    const titleMatch = (item.title || '').toLowerCase().includes(term);
    const msgMatch = (item.messages || []).some(m => m.content.toLowerCase().includes(term));
    return titleMatch || msgMatch;
  });

  return (
    <div className={`fixed inset-0 flex flex-col h-[100dvh] w-full overflow-hidden select-none ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* MOBILE HEADER */}
      <header className={`px-3.5 py-2.5 flex items-center justify-between border-b shrink-0 z-20 backdrop-blur-md ${
        theme === 'dark' ? 'bg-slate-950/90 border-slate-800/80' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (customTitleInput.trim()) {
                        const newTitle = customTitleInput.trim();
                        setSessionTitle(newTitle);
                        saveSession(currentSessionId, newTitle, messages, sessionCreatedAt);
                      }
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className={`text-xs px-2 py-0.5 rounded border font-semibold w-full ${
                    theme === 'dark' ? 'bg-slate-900 border-purple-500 text-white' : 'bg-white border-purple-400 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTitleInput.trim()) {
                      const newTitle = customTitleInput.trim();
                      setSessionTitle(newTitle);
                      saveSession(currentSessionId, newTitle, messages, sessionCreatedAt);
                    }
                    setIsEditingTitle(false);
                  }}
                  className="p-1 text-xs text-purple-400 hover:text-purple-300 font-bold"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <div 
                onClick={() => {
                  setCustomTitleInput(sessionTitle);
                  setIsEditingTitle(true);
                }}
                className="cursor-pointer group flex items-center gap-1.5"
                title="Bấm để đổi tên ý niệm"
              >
                <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate group-hover:text-purple-400 transition-colors">
                  {sessionTitle}
                </h1>
                <Edit3 className="w-3 h-3 opacity-40 group-hover:opacity-100 text-purple-400 shrink-0" />
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className={isAutoSaving ? 'text-amber-400 font-semibold' : 'text-emerald-400/90 font-medium'}>
                  {isAutoSaving ? 'Đang lưu...' : lastSavedTime ? `Đã lưu ${lastSavedTime}` : 'Đã tự lưu'}
                </span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                {messages.filter(m => m.role === 'user').length > 0 
                  ? `${messages.filter(m => m.role === 'user').length} ý niệm`
                  : 'Sổ ý tưởng'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* One-Click Google Drive Sync Button */}
          <button
            type="button"
            onClick={() => handleSyncCurrentSessionToDrive()}
            disabled={isSyncingDrive}
            className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-sm ${
              isSyncingDrive
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : theme === 'dark'
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="Đồng bộ 1-chạm lên Google Drive (Tệp SO_TAY_Y_TUONG_ONENESS.md duy nhất)"
          >
            {isSyncingDrive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden xs:inline sm:inline">Lưu Drive</span>
          </button>

          {/* New Page Button */}
          <button
            type="button"
            onClick={startNewSession}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Tạo trang sổ ý niệm mới"
          >
            <Plus className="w-4 h-4 text-purple-400" />
          </button>

          {/* History Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
              theme === 'dark'
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Danh sách các trang sổ đã lưu"
          >
            <History className="w-4 h-4 text-cyan-400" />
          </button>

          {/* More Menu Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(prev => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div className={`absolute right-0 top-11 z-40 w-60 rounded-2xl border shadow-2xl p-1.5 space-y-1 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  {/* Highlighted Drive Sync Action */}
                  <button
                    type="button"
                    onClick={() => handleSyncCurrentSessionToDrive()}
                    disabled={isSyncingDrive}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs flex items-center gap-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium cursor-pointer"
                  >
                    {isSyncingDrive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                    ) : (
                      <CloudUpload className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">Lưu vào Sổ Tay Drive (1 tệp)</div>
                      <div className="text-[10px] text-emerald-400/70 font-mono truncate">{IDEA_JOURNAL_FILENAME}</div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-purple-600/10 hover:text-purple-400 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Chia sẻ & Sao chép sổ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadMarkdown()}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-purple-600/10 hover:text-purple-400 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tải tệp Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadJson()}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-purple-600/10 hover:text-purple-400 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tải tệp JSON (.json)</span>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-purple-600/10 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSwitchToDesktop();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-purple-600/10 text-cyan-400 transition-colors"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Chế độ Máy tính (Desktop)</span>
                  </button>

                  {messages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setDeleteConfirmState({
                          isOpen: true,
                          type: 'current',
                          targetTitle: sessionTitle
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa trang sổ này</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CHAT MESSAGES CANVAS */}
      <main className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 select-text">
        {messages.map((m, index) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id || index}
              className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-[13.5px] leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-purple-600 text-white rounded-tr-none font-sans font-medium'
                    : theme === 'dark'
                      ? 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-purple-300">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-[13px]">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-purple-400 pl-2.5 italic my-2 opacity-90">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {normalizeMarkdownTables(m.content || '')}
                  </ReactMarkdown>
                </div>

                {m.timestamp && (
                  <div className={`text-[9.5px] font-mono mt-1 text-right ${
                    isUser ? 'text-purple-200/70' : 'text-slate-400'
                  }`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            </div>
            <div className={`p-3 rounded-2xl rounded-tl-none border text-xs font-mono flex items-center gap-2 ${
              theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Đang lắng nghe & suy nghĩ...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* FIXED BOTTOM INPUT BAR */}
      <footer className={`p-3 border-t shrink-0 backdrop-blur-md z-20 ${
        theme === 'dark' ? 'bg-slate-950/95 border-slate-800/90' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="flex items-end gap-2 max-w-xl mx-auto">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              // Auto-expand
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ghi lại ý tưởng hoặc tâm sự cùng AI..."
            className={`flex-1 min-h-[44px] max-h-[120px] px-3.5 py-2.5 rounded-2xl border text-sm resize-none focus:outline-none transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
            }`}
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isThinking}
            className="w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/25 transition-all active:scale-95 cursor-pointer"
            title="Gửi ý niệm"
          >
            {isThinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5 px-1 max-w-xl mx-auto">
          <span>Tự động lưu vào Cuốn Sổ • Phân tích chuyên sâu trên Máy tính</span>
          {messages.length > 2 && (
            <button
              type="button"
              onClick={handleShare}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
            >
              <Share2 className="w-2.5 h-2.5" />
              <span>Chia sẻ</span>
            </button>
          )}
        </div>
      </footer>

      {/* HISTORY DRAWER (Danh Sách Cuốn Sổ Ý Tưởng) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsHistoryOpen(false)} 
          />
          <div className={`relative w-full max-h-[85vh] flex flex-col rounded-t-3xl border-t shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Drawer Header */}
            <div className="p-4 border-b flex items-center justify-between border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Danh Sách Sổ Ý Tưởng</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">
                  {historyList.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewSession}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>Mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="p-3 border-b border-slate-800/60 space-y-2">
              <input
                type="text"
                placeholder="Tìm kiếm trong các trang sổ..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{filteredHistory.length} kết quả</span>
                <div className="flex items-center gap-2">
                  {historyList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSyncAllSessionsToDrive}
                      disabled={isSyncingAllDrive}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-sans text-xs"
                      title="Lưu toàn bộ sổ ý niệm vào SO_TAY_Y_TUONG_ONENESS.md trên Google Drive"
                    >
                      {isSyncingAllDrive ? (
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                      ) : (
                        <CloudUpload className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>Lưu tất cả lên Drive</span>
                    </button>
                  )}
                  {historyList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmState({ isOpen: true, type: 'all' })}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa tất cả</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadHistoryList}
                    className="hover:text-purple-300 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh]">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Chưa có trang sổ ý niệm nào được lưu.
                </div>
              ) : (
                filteredHistory.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/15 border-purple-500/50 shadow-sm'
                          : theme === 'dark'
                            ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-semibold text-xs leading-snug line-clamp-1 ${
                          isActive ? 'text-purple-300' : ''
                        }`}>
                          {s.title || 'Ý niệm không tên'}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSyncCurrentSessionToDrive(s)}
                            disabled={isSyncingDrive}
                            className="p-1 rounded text-slate-400 hover:text-emerald-300"
                            title="Lưu trang sổ này vào SO_TAY_Y_TUONG_ONENESS.md trên Drive"
                          >
                            <CloudUpload className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadMarkdown(s)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-300"
                            title="Tải Markdown"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmState({
                              isOpen: true,
                              type: 'single',
                              targetId: s.id,
                              targetTitle: s.title
                            })}
                            className="p-1 rounded text-slate-400 hover:text-red-400"
                            title="Xóa trang sổ này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                        <span>{s.messages ? `${s.messages.length} trao đổi` : 'Trống'}</span>
                        <span>{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) : ''}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium shadow-2xl flex items-center gap-2 border border-purple-400/40 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmState?.isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => !isDeleting && setDeleteConfirmState(null)}
        >
          <div 
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-bold text-sm leading-snug">
                  {deleteConfirmState.type === 'all'
                    ? 'Xác nhận xóa tất cả các sổ?'
                    : deleteConfirmState.type === 'current'
                      ? 'Xóa trang sổ hiện tại?'
                      : 'Xóa trang sổ ý niệm?'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {deleteConfirmState.type === 'all'
                    ? `Hệ thống sẽ xóa vĩnh viễn toàn bộ ${historyList.length} trang sổ đã lưu. Thao tác này không thể hoàn tác.`
                    : `Bạn có chắc muốn xóa vĩnh viễn "${deleteConfirmState.targetTitle || sessionTitle}"?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
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
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-red-600/20"
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
