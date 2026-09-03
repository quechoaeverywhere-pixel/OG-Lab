import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { ChapterReader } from './components/ChapterReader';
import { ResearchPortalLanding } from './components/ResearchPortalLanding';
import { BottomBar } from './components/BottomBar';
import { QuickResearchModal } from './components/QuickResearchModal';
import { PublisherStudioModal } from './components/PublisherStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { NewDossierModal } from './components/NewDossierModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { SystemDashboardModal } from './components/SystemDashboardModal';
import { AccountModal } from './components/AccountModal';
import { AIProgressBanner } from './components/AIProgressBanner';
import { ReadOnlyNoticeBanner } from './components/ReadOnlyNoticeBanner';
import { AuthLandingGate } from './components/AuthLandingGate';
import { ReportPresentationViewer } from './components/ReportPresentationViewer';
import { MobileIdeaJournal } from './components/MobileIdeaJournal';
import { OGLogo } from './components/OGLogo';
import { AIProgressProvider } from './context/AIProgressContext';
import { PermissionProvider, usePermission } from './contexts/PermissionContext';
import { Dossier, LexiconTerm, CitationItem, PromptTemplate, GeminiSettings, ClassicalQuote } from './types';
import { INITIAL_LEXICON } from './data/initialLexicon';
import { INITIAL_CITATIONS } from './data/initialCitations';
import { INITIAL_PROMPTS } from './data/initialPrompts';
import { INITIAL_DOSSIERS } from './data/initialDossiers';
import { INTERDISCIPLINARY_DISCIPLINES, DisciplineMetadata } from './data/interdisciplinaryDisciplines';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getNextChapterNumber, reconcileDossiers } from './utils/dossierUtils';
import {
  deduplicateCitations,
  deduplicateQuotes,
  deduplicateLexicon,
  deduplicateDossier,
  normalizeQuoteText,
  normalizeTermText
} from './utils/deduplication';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { requirePermission } = usePermission();
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('og_theme', 'dark');
  const [dossiers, setDossiers] = useLocalStorage<Dossier[]>('og_dossiers_persisted_v4', INITIAL_DOSSIERS);
  
  // Default to null so user lands on the Global Research Hub / Portal Landing Page on entry
  const [activeDossierId, setActiveDossierId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasEnteredAsGuest, setHasEnteredAsGuest] = useLocalStorage<boolean>('og_guest_entered_v1', true);

  // Presentation / Live Share View State (URL Query Param ?present=dossier-id)
  const [presentationDossierId, setPresentationDossierId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('present') || params.get('view') || null;
  });

  // Disciplines state (38+ Interdisciplinary Lenses + custom additions)
  const [disciplines, setDisciplines] = useLocalStorage<DisciplineMetadata[]>(
    'og_disciplines_list_v2',
    INTERDISCIPLINARY_DISCIPLINES
  );

  // Auto-upgrade from v1 to ensure all 38 core disciplines are present while retaining custom ones
  useEffect(() => {
    try {
      const v1Key = localStorage.getItem('og_disciplines_list_v1');
      const v2Key = localStorage.getItem('og_disciplines_list_v2');
      if (v1Key && !v2Key) {
        const parsed = JSON.parse(v1Key);
        if (Array.isArray(parsed)) {
          const customOnly = parsed.filter(item => 
            !INTERDISCIPLINARY_DISCIPLINES.some(core => core.id === item.id || core.name === item.name)
          );
          if (customOnly.length > 0) {
            setDisciplines([...INTERDISCIPLINARY_DISCIPLINES, ...customOnly]);
          }
        }
      } else if (disciplines.length < INTERDISCIPLINARY_DISCIPLINES.length) {
        // If stored array is smaller than the core 38, merge them
        const customOnly = disciplines.filter(item => 
          !INTERDISCIPLINARY_DISCIPLINES.some(core => core.id === item.id || core.name === item.name)
        );
        setDisciplines([...INTERDISCIPLINARY_DISCIPLINES, ...customOnly]);
      }
    } catch (e) {
      console.warn('Discipline migration error:', e);
    }
  }, []);

  // Mobile Viewport and Mode Override ('auto' | 'mobile' | 'desktop')
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [mobileOverrideMode, setMobileOverrideMode] = useLocalStorage<'auto' | 'mobile' | 'desktop'>('og_mobile_view_override_v1', 'auto');

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileActive = mobileOverrideMode === 'mobile' || (mobileOverrideMode === 'auto' && isMobileViewport);

  // Sidebar Collapse States
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useLocalStorage<boolean>('og_left_sidebar_collapsed', false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useLocalStorage<boolean>('og_right_sidebar_collapsed', false);

  // Studio & Research Modals
  const [isQuickResearchOpen, setIsQuickResearchOpen] = useState(false);
  const [quickResearchInitialTopic, setQuickResearchInitialTopic] = useState('');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState(0);
  const [isNewDossierOpen, setIsNewDossierOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDriveSyncOpen, setIsDriveSyncOpen] = useState(false);
  const [isSystemDashboardOpen, setIsSystemDashboardOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleImportFromDrive = useCallback((imported: Partial<Dossier>[]) => {
    setDossiers(prev => {
      const nextList = [...prev];
      imported.forEach(imp => {
        if (!imp.id && !imp.title) return;
        const idx = nextList.findIndex(d => (imp.id && d.id === imp.id) || d.title === imp.title);
        const fullDossier: Dossier = {
          id: imp.id || `dossier-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: imp.title || 'Hồ sơ',
          subtitle: imp.subtitle || '',
          topic: imp.topic || imp.title || '',
          discipline: imp.discipline || 'Nghiên cứu Liên Ngành',
          depthLevel: imp.depthLevel || 'advanced',
          tags: imp.tags || [],
          abstract: imp.abstract || '',
          contentMarkdown: imp.contentMarkdown || '',
          keyFindings: imp.keyFindings || [],
          philosophicalBasis: imp.philosophicalBasis || [],
          technicalMappings: imp.technicalMappings || [],
          citations: imp.citations || [],
          lastModified: imp.lastModified || new Date().toISOString(),
          status: imp.status || 'published',
          chapterNumber: imp.chapterNumber || getNextChapterNumber(nextList),
          pillarId: imp.pillarId || 'pillar-1',
          pillarTitle: imp.pillarTitle || 'Trụ cột'
        };
        if (idx >= 0) {
          nextList[idx] = { ...nextList[idx], ...fullDossier };
        } else {
          nextList.push(fullDossier);
        }
      });
      return nextList;
    });
  }, [setDossiers]);

  // Aux state for Lexicon, Citations, Prompts, Settings
  const [lexicon, setLexicon] = useLocalStorage<LexiconTerm[]>('og_lexicon', INITIAL_LEXICON);
  const [citations, setCitations] = useLocalStorage<CitationItem[]>('og_citations', INITIAL_CITATIONS);
  const [promptTemplates, setPromptTemplates] = useLocalStorage<PromptTemplate[]>('og_prompts', INITIAL_PROMPTS);
  const [geminiSettings, setGeminiSettings] = useLocalStorage<GeminiSettings>('og_gemini_settings', {
    model: 'gemini-3.7-flash',
    enableSearchGrounding: true,
    temperature: 0.3,
    topP: 0.85,
    systemInstruction:
      'Bạn là Học giả Cao cấp & Kiến trúc sư Trưởng của OG Agentic Intelligence Lab (Oneness Governance). Slogan cốt lõi: "Deep Research & Knowledge Transforming" (Chuyển Hóa Tri Thức). Nhiệm vụ của bạn là nghiên cứu sâu theo 4 Cấp độ Phân tầng Học thuật (Bản Thể, Cơ Chế, Kiến Trúc CS, Biện Chứng), nhưng khi xuất bản báo cáo, TOÀN BỘ nội dung phải được chuyển hóa sang ngôn ngữ đời thường, gãy gọn và thực chiến để ai đọc cũng hiểu và hành động được; đồng thời tự động trích xuất các thuật ngữ chuyên môn vào Sổ Từ Điển Thuật Ngữ để người đọc tra cứu.'
  });

  // Reading progress state
  const [scrollProgress, setScrollProgress] = useState(0);
  const initialLoadCompletedRef = useRef(false);

  // Sanitizer and deduplicator for Lexicon
  const handleAddLexiconTerm = useCallback((term: LexiconTerm) => {
    setLexicon(prev => deduplicateLexicon([...prev, term]));
  }, [setLexicon]);

  // Sanitizer and deduplicator for Citations
  const handleAddCitation = useCallback((cit: CitationItem) => {
    setCitations(prev => deduplicateCitations([...prev, cit]));
  }, [setCitations]);

  const handleAddQuote = useCallback((quote: ClassicalQuote) => {
    const rawQuoteText = quote.quote || quote.interpretation || '';
    if (!rawQuoteText) return;
    handleAddCitation({
      id: quote.id && !quote.id.startsWith('q-') && !quote.id.startsWith('quote-')
        ? quote.id
        : `cit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: quote.work || quote.author || 'Kinh điển',
      author: quote.author || 'Khuyết danh',
      year: quote.eraOrYear || 'Cổ điển',
      source: quote.work || 'Tác phẩm gốc',
      category: 'Kinh điển',
      keyQuote: quote.quote,
      dossierIds: activeDossierId ? [activeDossierId] : []
    });
  }, [handleAddCitation, activeDossierId]);

  // One-time sanitization of loaded state from localStorage to clean duplicate keys
  useEffect(() => {
    setLexicon(prev => deduplicateLexicon(prev));
    setCitations(prev => deduplicateCitations(prev));
  }, [setLexicon, setCitations]);

  // High-performance tiered data fetch: Fast local Express cache first, followed by resilient Firestore cloud sync
  const fetchDossiers = async () => {
    try {
      setIsLoading(true);

      let deletedIdsSet = new Set<string>();
      try {
        const deletedRaw = localStorage.getItem('og_deleted_dossier_ids_v1');
        if (deletedRaw) {
          deletedIdsSet = new Set(JSON.parse(deletedRaw));
        }
      } catch (e) {
        console.warn('Failed to parse deleted dossier ids:', e);
      }

      // Step 1: FAST PRIMARY FETCH - Local Express server (instantaneous response)
      try {
        const res = await fetch('/api/dossiers');
        const data = await res.json();
        if (data.success && Array.isArray(data.dossiers) && data.dossiers.length > 0) {
          const serverFiltered = data.dossiers.filter((d: Dossier) => !deletedIdsSet.has(d.id));
          setDossiers(prevLocal => {
            const { merged } = reconcileDossiers(prevLocal, serverFiltered, deletedIdsSet);
            return merged.filter(d => !deletedIdsSet.has(d.id));
          });
        }
      } catch (localErr) {
        console.debug('[Storage] Local server primary fetch note:', localErr);
      } finally {
        // Immediately unblock user experience with local data
        setIsLoading(false);
      }

      // Step 2: RESILIENT CLOUD SYNC - Asynchronously check Firestore
      try {
        const q = collection(db, 'dossiers');
        const querySnapshot = await getDocs(q);
        const firebaseDossiers: Dossier[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Dossier;
          if (data && data.id && !deletedIdsSet.has(data.id)) {
            firebaseDossiers.push(data);
          }
        });

        if (firebaseDossiers.length > 0) {
          setDossiers(prev => {
            const { merged } = reconcileDossiers(prev, firebaseDossiers, deletedIdsSet);
            return merged.filter(d => !deletedIdsSet.has(d.id));
          });
        }
      } catch (fsErr: any) {
        // Handled silently and gracefully without noisy warnings; local server persistence is active
        console.debug('[Firestore] Operating with local server persistence:', fsErr?.message || fsErr);
      }

      // Step 3: Parallel fetch for Lexicon & Citations from Express API
      Promise.allSettled([
        fetch('/api/lexicon').then(r => r.json()),
        fetch('/api/citations').then(r => r.json())
      ]).then(([lexiconRes, citationsRes]) => {
        if (lexiconRes.status === 'fulfilled' && lexiconRes.value?.success && Array.isArray(lexiconRes.value.lexicon)) {
          setLexicon(prev => {
            const existing = new Set(prev.map(t => t.term.toLowerCase()));
            const toAdd = lexiconRes.value.lexicon.filter((t: any) => t.term && !existing.has(t.term.toLowerCase()));
            return [...prev, ...toAdd];
          });
        }

        if (citationsRes.status === 'fulfilled' && citationsRes.value?.success && Array.isArray(citationsRes.value.citations)) {
          setCitations(prev => {
            const existing = new Set(prev.map(c => (c.title || c.keyQuote || '').toLowerCase()));
            const toAdd = citationsRes.value.citations.filter((c: any) => (c.title || c.keyQuote) && !existing.has((c.title || c.keyQuote || '').toLowerCase()));
            return [...prev, ...toAdd];
          });
        }
      }).catch(e => console.debug('[Storage] Lexicon/Citations sync note:', e));
    } catch (err) {
      console.warn('Using initial fallback dossiers:', err);
    } finally {
      setIsLoading(false);
      initialLoadCompletedRef.current = true;
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, [user]); // Refetch when user changes

  // Auto-sync dossiers to server disk whenever modified after initial load completes
  useEffect(() => {
    if (!initialLoadCompletedRef.current) return;
    if (Array.isArray(dossiers) && dossiers.length > 0) {
      fetch('/api/dossiers/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossiers })
      }).catch(e => console.debug('[Sync] Dossier background sync notice:', e));
    }
  }, [dossiers]);

  // Auto-aggregate Lexicon terms and Classical Quotes from all Dossiers into global state
  useEffect(() => {
    if (!Array.isArray(dossiers) || dossiers.length === 0) return;

    const extractedTerms: LexiconTerm[] = [];
    const extractedCitations: CitationItem[] = [];

    dossiers.forEach(d => {
      if (Array.isArray(d.autoCapturedTerms)) {
        extractedTerms.push(...d.autoCapturedTerms);
      }
      if (Array.isArray(d.classicalQuotes)) {
        d.classicalQuotes.forEach(q => {
          extractedCitations.push({
            id: q.id || `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: q.quote,
            author: q.author,
            source: q.work,
            year: q.eraOrYear || 'Cổ điển',
            category: 'Kinh điển',
            keyQuote: q.quote
          });
        });
      }
      if (Array.isArray(d.citations)) {
        extractedCitations.push(...d.citations);
      }

      if (Array.isArray(d.projectStructure)) {
        d.projectStructure.forEach(pillar => {
          if (Array.isArray(pillar.chapters)) {
            pillar.chapters.forEach(ch => {
              if (Array.isArray(ch.extractedTerms)) {
                extractedTerms.push(...ch.extractedTerms);
              }
              if (Array.isArray(ch.quotes)) {
                ch.quotes.forEach(q => {
                  extractedCitations.push({
                    id: q.id || `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    title: q.quote,
                    author: q.author,
                    source: q.work,
                    year: q.eraOrYear || 'Cổ điển',
                    category: 'Kinh điển',
                    keyQuote: q.quote
                  });
                });
              }
            });
          }
        });
      }
    });

    if (extractedTerms.length > 0) {
      setLexicon(prev => {
        const next = deduplicateLexicon([...prev, ...extractedTerms]);
        return next.length === prev.length ? prev : next;
      });
    }

    if (extractedCitations.length > 0) {
      setCitations(prev => {
        const next = deduplicateCitations([...prev, ...extractedCitations]);
        return next.length === prev.length ? prev : next;
      });
    }
  }, [dossiers, setLexicon, setCitations]);

  useEffect(() => {
    if (Array.isArray(lexicon) && lexicon.length > 0) {
      fetch('/api/lexicon/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lexicon })
      }).catch(e => console.warn('Lexicon sync failed:', e));
    }
  }, [lexicon]);

  useEffect(() => {
    if (Array.isArray(citations) && citations.length > 0) {
      fetch('/api/citations/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citations })
      }).catch(e => console.warn('Citations sync failed:', e));
    }
  }, [citations]);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#090a0f';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8f9fc';
    }
  }, [theme]);

  // Current active dossier (null when in Landing Portal mode)
  const currentDossier = useMemo(() => {
    if (!activeDossierId) return null;
    return dossiers.find(d => d.id === activeDossierId) || null;
  }, [dossiers, activeDossierId]);

  // Next sequential chapter/dossier number calculation
  const nextChapterNumber = useMemo(() => {
    return getNextChapterNumber(dossiers);
  }, [dossiers]);

  // Save/Update Dossier with instant memory reflection and disk persistence
  const handleSaveDossier = async (dossier: Dossier) => {
    requirePermission('compose_article', async () => {
      const cleaned = deduplicateDossier(dossier);
      const normalizedDossier: Dossier = {
        ...cleaned,
        lastModified: new Date().toISOString()
      };
      if (user && !normalizedDossier.ownerId) {
        normalizedDossier.ownerId = user.uid;
      }
      const num = typeof normalizedDossier.chapterNumber === 'number' ? normalizedDossier.chapterNumber : parseInt(String(normalizedDossier.chapterNumber), 10);
      if (isNaN(num) || num <= 0) {
        normalizedDossier.chapterNumber = nextChapterNumber;
      }

      // Immediately update local state so title and contents reflect in UI with zero delay
      setDossiers(prev => {
        const index = prev.findIndex(d => d.id === normalizedDossier.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = normalizedDossier;
          return updated;
        }
        return [...prev, normalizedDossier];
      });
      setActiveDossierId(normalizedDossier.id);

      try {
        // 1. First persist to Express backend (which extracts/converts base64 images into lightweight static assets)
        let savedDossier = normalizedDossier;
        try {
          const res = await fetch(`/api/dossiers/${normalizedDossier.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedDossier)
          });
          const data = await res.json();
          if (data.success && data.dossier) {
            savedDossier = data.dossier;
            setDossiers(prev => {
              const index = prev.findIndex(d => d.id === normalizedDossier.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = data.dossier;
                return updated;
              }
              return prev;
            });
          }
        } catch (apiErr) {
          console.warn('[Storage] Express server persistence notice:', apiErr);
        }

        // 2. If authenticated with Firebase, synchronize the lightweight dossier to Firestore
        if (user) {
          try {
            // Strip undefined keys for Firestore compatibility
            const firestorePayload = JSON.parse(JSON.stringify(savedDossier));
            await setDoc(doc(db, 'dossiers', firestorePayload.id), firestorePayload);
          } catch (fsErr: any) {
            console.warn('[Firestore] Sync warning (server persistence is active):', fsErr?.message || fsErr);
          }
        }
      } catch (err) {
        console.error('Failed to save dossier to server:', err);
      }
    });
  };

  // Delete Dossier
  const handleDeleteDossier = async (id: string) => {
    requirePermission('manage_dossier', async () => {
      // 1. Record deleted ID in localStorage so reconciliation never resurrects it
      try {
        const deletedRaw = localStorage.getItem('og_deleted_dossier_ids_v1');
        const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
        deletedSet.add(id);
        localStorage.setItem('og_deleted_dossier_ids_v1', JSON.stringify(Array.from(deletedSet)));
      } catch (e) {
        console.warn('Could not record deleted dossier id:', e);
      }

      // 2. Safely attempt Firestore delete (catch permission errors without crashing)
      if (user) {
        try {
          await deleteDoc(doc(db, 'dossiers', id));
        } catch (fsErr) {
          console.warn('Firestore doc delete skipped or failed:', fsErr);
        }
      }

      // 3. Delete from Express API server storage
      try {
        await fetch(`/api/dossiers/${id}`, { method: 'DELETE' });
      } catch (apiErr) {
        console.warn('Express server dossier delete failed:', apiErr);
      }

      // 4. Update local state
      setDossiers(prev => {
        const nextDossiers = prev.filter(d => d.id !== id);
        // 5. Sync updated dossiers array to server
        fetch('/api/dossiers/batch-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dossiers: nextDossiers })
        }).catch(syncErr => console.warn('Batch sync after delete failed:', syncErr));
        return nextDossiers;
      });

      if (activeDossierId === id) {
        setActiveDossierId(null);
      }
    });
  };

  // Reset to default dossiers
  const handleResetDefaultDossiers = async () => {
    requirePermission('manage_dossier', async () => {
      try {
        localStorage.removeItem('og_deleted_dossier_ids_v1');
        const res = await fetch('/api/dossiers/reset-default', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.dossiers) {
          setDossiers(data.dossiers);
        }
      } catch (err) {
        console.error('Failed to reset default dossiers:', err);
        setDossiers(INITIAL_DOSSIERS);
      }
    });
  };

  // Add custom discipline (with automatic classification)
  const handleAddDiscipline = (newDiscipline: DisciplineMetadata) => {
    setDisciplines(prev => {
      if (prev.some(d => d.id === newDiscipline.id || d.name === newDiscipline.name)) {
        return prev;
      }
      return [...prev, newDiscipline];
    });
  };

  // Delete custom discipline
  const handleDeleteDiscipline = (disciplineId: string) => {
    setDisciplines(prev => prev.filter(d => d.id !== disciplineId));
  };

  // Reset to default 38 core disciplines
  const handleResetDefaultDisciplines = () => {
    setDisciplines(INTERDISCIPLINARY_DISCIPLINES);
  };

  // Restore Full System Backup (JSON)
  const handleRestoreBackup = async (backupData: {
    dossiers?: Dossier[];
    lexicon?: LexiconTerm[];
    citations?: CitationItem[];
    disciplines?: any[];
    geminiSettings?: any;
  }) => {
    if (backupData.dossiers && Array.isArray(backupData.dossiers)) {
      setDossiers(backupData.dossiers);
      fetch('/api/dossiers/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossiers: backupData.dossiers })
      }).catch(err => console.warn('Failed to sync restored dossiers to server:', err));
    }
    if (backupData.lexicon && Array.isArray(backupData.lexicon)) {
      setLexicon(backupData.lexicon);
      try {
        localStorage.setItem('og_lexicon_terms', JSON.stringify(backupData.lexicon));
      } catch (e) {}
    }
    if (backupData.citations && Array.isArray(backupData.citations)) {
      setCitations(backupData.citations);
      try {
        localStorage.setItem('og_citations', JSON.stringify(backupData.citations));
      } catch (e) {}
    }
    if (backupData.disciplines && Array.isArray(backupData.disciplines)) {
      setDisciplines(backupData.disciplines);
      try {
        localStorage.setItem('og_custom_disciplines', JSON.stringify(backupData.disciplines));
      } catch (e) {}
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress || 0)));
  };

  // 1. If auth state is still resolving, render a pristine loading splash
  if (authLoading) {
    return (
      <div
        id="app-auth-loading-splash"
        className={`h-screen w-screen flex flex-col items-center justify-center gap-4 transition-colors ${
          theme === 'dark' ? 'bg-[#070614] text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <OGLogo size={56} theme={theme} animated={true} />
        <div className="text-center space-y-1.5 animate-pulse">
          <div className="font-display-title font-extrabold text-sm tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
            Oneness Governance
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Đang khởi tạo bảo mật Shinbashira...
          </p>
        </div>
      </div>
    );
  }

  // 1.5 STANDALONE PRESENTATION MODE (Full-screen view accessible via ?present=dossier-id or Presentation button)
  if (presentationDossierId) {
    const targetDossier =
      dossiers.find(d => d.id === presentationDossierId) ||
      INITIAL_DOSSIERS.find(d => d.id === presentationDossierId) ||
      dossiers[0];

    if (targetDossier) {
      return (
        <ReportPresentationViewer
          dossier={targetDossier}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onClose={() => {
            setPresentationDossierId(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('present');
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url.toString());
          }}
          isStandalonePage={true}
        />
      );
    }
  }

  // 1.5. MOBILE VIEWPORT DEDICATED EXPERIENCE: If on mobile, show the single dedicated Idea Journal Chat Window
  if (isMobileActive) {
    return (
      <MobileIdeaJournal
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onSwitchToDesktop={() => setMobileOverrideMode('desktop')}
      />
    );
  }

  // 2. If user is not authenticated and has not entered as guest, show the Landing Gate
  if (!user && !hasEnteredAsGuest) {
    return (
      <AuthLandingGate
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onEnterGuestMode={() => setHasEnteredAsGuest(true)}
      />
    );
  }

  return (
    <div
      id="app-root-container"
      className={`h-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden ${
        theme === 'dark' ? 'bg-[#090a0f] text-slate-100' : 'bg-[#f8f9fc] text-slate-900'
      }`}
    >
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        dossiers={dossiers}
        lexicon={lexicon}
        citations={citations}
        disciplines={disciplines}
        onRestoreBackup={handleRestoreBackup}
      />

      {/* Google Drive 1-Way Backup Modal */}
      <GoogleDriveSyncModal
        isOpen={isDriveSyncOpen}
        onClose={() => setIsDriveSyncOpen(false)}
        theme={theme}
        dossiers={dossiers}
        lexicon={lexicon}
        citations={citations}
      />

      {/* Publisher Studio Modal */}
      <PublisherStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialTab={studioInitialTab}
        dossiers={dossiers}
        onSelectDossier={id => {
          setActiveDossierId(id);
        }}
        onSaveDossier={handleSaveDossier}
        onDeleteDossier={handleDeleteDossier}
        onResetDefaultDossiers={handleResetDefaultDossiers}
        lexicon={lexicon}
        onAddLexiconTerm={handleAddLexiconTerm}
        onDeleteLexiconTerm={id => setLexicon(prev => prev.filter(t => t.id !== id))}
        citations={citations}
        onAddCitation={handleAddCitation}
        onDeleteCitation={id => setCitations(prev => prev.filter(c => c.id !== id))}
        promptTemplates={promptTemplates}
        onAddPromptTemplate={p => setPromptTemplates(prev => [...prev, p])}
        geminiSettings={geminiSettings}
        onUpdateGeminiSettings={setGeminiSettings}
        disciplines={disciplines}
        onAddDiscipline={handleAddDiscipline}
        onDeleteDiscipline={handleDeleteDiscipline}
        onResetDefaultDisciplines={handleResetDefaultDisciplines}
        theme={theme}
        onOpenReportPresentation={d => setPresentationDossierId(d.id)}
      />

      {/* Quick Research Modal */}
      <QuickResearchModal
        isOpen={isQuickResearchOpen}
        onClose={() => setIsQuickResearchOpen(false)}
        initialTopic={quickResearchInitialTopic}
        onSaveDossier={async d => {
          await handleSaveDossier(d);
          setActiveDossierId(d.id);
        }}
        nextChapterNumber={nextChapterNumber}
        theme={theme}
      />

      {/* New Dossier Modal */}
      <NewDossierModal
        isOpen={isNewDossierOpen}
        onClose={() => setIsNewDossierOpen(false)}
        onSaveDossier={async d => {
          await handleSaveDossier(d);
          setActiveDossierId(d.id);
        }}
        nextChapterNumber={nextChapterNumber}
        theme={theme}
      />

      {/* System Diagnostics & AI Health Dashboard Modal */}
      <SystemDashboardModal
        isOpen={isSystemDashboardOpen}
        onClose={() => setIsSystemDashboardOpen(false)}
        dossiers={dossiers}
        lexicon={lexicon}
        citations={citations}
        theme={theme}
      />

      {/* Account & Permissions Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        theme={theme}
      />

      {/* TopBar Header with Left Logo/Title & Right Omni-Search */}
      <TopBar
        currentDossier={currentDossier}
        allDossiers={dossiers}
        onSelectDossier={id => setActiveDossierId(id)}
        onOpenQuickResearchWithTopic={topic => {
          requirePermission('ai_research', () => {
            setQuickResearchInitialTopic(topic);
            setIsQuickResearchOpen(true);
          });
        }}
        onOpenStudio={(tabIdx = 0) => {
          setStudioInitialTab(tabIdx);
          setIsStudioOpen(true);
        }}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenDriveSync={() => setIsDriveSyncOpen(true)}
        onOpenPresentation={id => setPresentationDossierId(id)}
        onSwitchToMobile={() => setMobileOverrideMode('mobile')}
        lexicon={lexicon}
        citations={citations}
        promptTemplates={promptTemplates}
        geminiSettings={geminiSettings}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        modelName={geminiSettings.model}
        isSearchGroundingEnabled={geminiSettings.enableSearchGrounding}
      />

      {/* Global Read-Only / Guest & Viewer Notice Banner */}
      <ReadOnlyNoticeBanner theme={theme} />

      {/* Main Workspace Layout (Sidebar Tool Center + Centered Reader or Portal Landing Hub) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. LEFT SIDEBAR: Tool Center & Dossier Switcher */}
        <Sidebar
          dossiers={dossiers}
          activeDossierId={activeDossierId}
          onSelectDossier={id => setActiveDossierId(id)}
          onOpenQuickResearch={() => {
            requirePermission('ai_research', () => {
              setQuickResearchInitialTopic('');
              setIsQuickResearchOpen(true);
            });
          }}
          onOpenNewDossierModal={() => {
            requirePermission('create_dossier', () => setIsNewDossierOpen(true));
          }}
          onOpenStudioTab={tabIdx => {
            requirePermission('compose_article', () => {
              setStudioInitialTab(tabIdx);
              setIsStudioOpen(true);
            });
          }}
          onOpenSettings={() => {
            requirePermission('system_settings', () => setIsSettingsOpen(true));
          }}
          onOpenDashboard={() => setIsSystemDashboardOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          isCollapsed={isLeftSidebarCollapsed}
          onToggleCollapse={() => setIsLeftSidebarCollapsed(prev => !prev)}
        />

        {/* 2. CENTER CONTENT: Either Global Intelligence Portal Landing Hub OR Focused Dossier Reader */}
        {currentDossier ? (
          <main className="flex-1 flex flex-col overflow-hidden relative justify-center bg-slate-950/20" onScroll={handleScroll}>
            <ChapterReader
              dossier={currentDossier}
              activePillarId={activePillarId}
              activeChapterId={activeChapterId}
              onSelectChapter={chId => setActiveChapterId(chId)}
              onUpdateDossier={handleSaveDossier}
              onOpenQuickResearch={topic => {
                setQuickResearchInitialTopic(topic);
                setIsQuickResearchOpen(true);
              }}
              onSelectLexiconTerm={term => {
                setIsRightSidebarCollapsed(false);
              }}
              onAddLexiconTerm={handleAddLexiconTerm}
              onAddQuote={handleAddQuote}
              onOpenPresentation={id => setPresentationDossierId(id)}
              lexicon={lexicon}
              theme={theme}
            />
          </main>
        ) : (
          <main className="flex-1 flex flex-col overflow-y-auto relative bg-transparent" onScroll={handleScroll}>
            <ResearchPortalLanding
              dossiers={dossiers}
              disciplines={disciplines}
              onSelectDossier={id => setActiveDossierId(id)}
              onOpenQuickResearchWithTopic={topic => {
                setQuickResearchInitialTopic(topic);
                setIsQuickResearchOpen(true);
              }}
              onOpenNewDossierModal={() => {
                requirePermission('create_dossier', () => setIsNewDossierOpen(true));
              }}
              onOpenStudioTab={tabIdx => {
                requirePermission('compose_article', () => {
                  setStudioInitialTab(tabIdx);
                  setIsStudioOpen(true);
                });
              }}
              onOpenSettings={() => {
                requirePermission('system_settings', () => setIsSettingsOpen(true));
              }}
              onOpenPresentation={id => setPresentationDossierId(id)}
              theme={theme}
            />
          </main>
        )}

        {/* 3. RIGHT SIDEBAR: Kho Tri Thức (Từ Điển, Trích Dẫn, Danh Mục Hồ Sơ) */}
        <RightSidebar
          lexicon={lexicon}
          citations={citations}
          dossiers={dossiers}
          currentDossier={currentDossier}
          onSelectDossier={id => setActiveDossierId(id)}
          onDeleteDossier={handleDeleteDossier}
          onOpenNewDossier={() => {
            requirePermission('create_dossier', () => setIsNewDossierOpen(true));
          }}
          onAddLexiconTerm={handleAddLexiconTerm}
          onAddCitation={handleAddCitation}
          onDeleteLexiconTerm={id => {
            requirePermission('compose_article', () => setLexicon(prev => prev.filter(t => t.id !== id)));
          }}
          onDeleteCitation={id => {
            requirePermission('compose_article', () => setCitations(prev => prev.filter(c => c.id !== id)));
          }}
          isCollapsed={isRightSidebarCollapsed}
          onToggleCollapse={() => setIsRightSidebarCollapsed(prev => !prev)}
          theme={theme}
        />
      </div>

      {/* BottomBar: Google Workspace Dock */}
      <BottomBar theme={theme} />

      {/* AI Subtle Progress & High Demand Ambient Notice */}
      <AIProgressBanner theme={theme} />
    </div>
  );
}

export function App() {
  return (
    <AIProgressProvider>
      <PermissionProvider>
        <AppContent />
      </PermissionProvider>
    </AIProgressProvider>
  );
}

export default App;
