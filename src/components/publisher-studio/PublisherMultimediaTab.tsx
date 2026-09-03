import React, { useState, useMemo } from 'react';
import {
  Video,
  Mic,
  PieChart,
  Presentation,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  Share2,
  Film,
  Layers,
  FileText,
  Volume2,
  VolumeX,
  Clock,
  Sparkle,
  Tv,
  Smartphone,
  Square,
  ArrowRight,
  MessageSquare,
  Compass,
  CheckCircle2,
  Send,
  Eye,
  Settings2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Quote,
  Palette
} from 'lucide-react';
import { Dossier, GeminiSettings } from '../../types';
import {
  MultimediaFormat,
  VideoProductionProject,
  AudioPodcastProject,
  InfographicProject,
  SlideDeckProject,
  VideoScene,
  PodcastDialogueTurn,
  SlideItem
} from '../../types/multimedia';
import {
  generateVideoProjectFallback,
  generateAudioPodcastFallback,
  generateInfographicFallback,
  generateSlideDeckFallback
} from '../../utils/multimediaSynthesizer';
import { safeFetchAIJson } from '../../utils/ai-client';
import { VideoProductionManager } from './VideoProductionManager';

interface PublisherMultimediaTabProps {
  dossiers: Dossier[];
  activeDossierId?: string;
  onSelectDossier?: (dossierId: string) => void;
  geminiSettings?: GeminiSettings;
  onOpenReportPresentation?: (dossier: Dossier) => void;
}

export const PublisherMultimediaTab: React.FC<PublisherMultimediaTabProps> = ({
  dossiers,
  activeDossierId,
  onSelectDossier,
  geminiSettings,
  onOpenReportPresentation
}) => {
  // Select target dossier
  const [selectedDossierId, setSelectedDossierId] = useState<string>(
    activeDossierId || (dossiers.length > 0 ? dossiers[0].id : '')
  );

  const activeDossier = useMemo(() => {
    return dossiers.find(d => d.id === selectedDossierId) || dossiers[0] || null;
  }, [dossiers, selectedDossierId]);

  // Active Multimedia Format
  const [activeFormat, setActiveFormat] = useState<MultimediaFormat>('video_storyboard');

  // Video State
  const [videoProject, setVideoProject] = useState<VideoProductionProject | null>(() => {
    return activeDossier ? generateVideoProjectFallback(activeDossier) : null;
  });
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoStyle, setVideoStyle] = useState<'architectural_showcase' | 'documentary_cinematic' | 'quick_shorts_reels'>('architectural_showcase');

  // Podcast State
  const [podcastProject, setPodcastProject] = useState<AudioPodcastProject | null>(() => {
    return activeDossier ? generateAudioPodcastFallback(activeDossier) : null;
  });
  const [activeTurnIndex, setActiveTurnIndex] = useState<number | null>(null);
  const [isSpeakingPodcast, setIsSpeakingPodcast] = useState(false);
  const [hostAName, setHostAName] = useState('Minh Triết (Chuyên Gia)');
  const [hostBName, setHostBName] = useState('Hải An (Nhà Phân Tích)');

  // Infographic State
  const [infographicProject, setInfographicProject] = useState<InfographicProject | null>(() => {
    return activeDossier ? generateInfographicFallback(activeDossier) : null;
  });
  const [infoTheme, setInfoTheme] = useState<'emerald_zen' | 'purple_matrix' | 'amber_rustic'>('emerald_zen');

  // Slide Deck State
  const [slideDeckProject, setSlideDeckProject] = useState<SlideDeckProject | null>(() => {
    return activeDossier ? generateSlideDeckFallback(activeDossier) : null;
  });
  const [activeSlideNumber, setActiveSlideNumber] = useState(1);
  const [deckAudience, setDeckAudience] = useState<'investors_board' | 'public_community' | 'engineering_team'>('investors_board');

  // Loading and Notification States
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userCustomNote, setUserCustomNote] = useState('');

  // Update projects when active dossier changes
  const handleDossierChange = (dossierId: string) => {
    setSelectedDossierId(dossierId);
    if (onSelectDossier) onSelectDossier(dossierId);
    const newDossier = dossiers.find(d => d.id === dossierId);
    if (newDossier) {
      setVideoProject(generateVideoProjectFallback(newDossier));
      setPodcastProject(generateAudioPodcastFallback(newDossier));
      setInfographicProject(generateInfographicFallback(newDossier));
      setSlideDeckProject(generateSlideDeckFallback(newDossier));
      setActiveSceneIndex(0);
      setActiveSlideNumber(1);
    }
  };

  // Helper copy to clipboard
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. AI Generate Video Storyboard
  const handleGenerateVideo = async () => {
    if (!activeDossier) return;
    setIsGenerating(true);
    try {
      const response = await safeFetchAIJson<{ success: boolean; project: VideoProductionProject }>('/api/gemini/generate-video-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierTitle: activeDossier.title,
          dossierSubtitle: activeDossier.subtitle || activeDossier.abstract,
          dossierContent: JSON.stringify(activeDossier.projectStructure || []),
          targetAspect: videoAspect,
          targetStyle: videoStyle,
          customNotes: userCustomNote,
          model: geminiSettings?.model || 'gemini-3.7-flash'
        })
      });

      if (response && response.ok && response.data?.project) {
        setVideoProject(response.data.project);
        setActiveSceneIndex(0);
      }
    } catch (err) {
      console.error('Failed to generate video project:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. AI Generate Podcast
  const handleGeneratePodcast = async () => {
    if (!activeDossier) return;
    setIsGenerating(true);
    try {
      const response = await safeFetchAIJson<{ success: boolean; project: AudioPodcastProject }>('/api/gemini/generate-audio-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierTitle: activeDossier.title,
          dossierSubtitle: activeDossier.subtitle || activeDossier.abstract,
          dossierContent: JSON.stringify(activeDossier.projectStructure || []),
          formatStyle: 'notebook_deep_dive',
          hostAName,
          hostBName,
          customFocus: userCustomNote,
          model: geminiSettings?.model || 'gemini-3.7-flash'
        })
      });

      if (response && response.ok && response.data?.project) {
        setPodcastProject(response.data.project);
        setActiveTurnIndex(null);
      }
    } catch (err) {
      console.error('Failed to generate podcast:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. AI Generate Infographic
  const handleGenerateInfographic = async () => {
    if (!activeDossier) return;
    setIsGenerating(true);
    try {
      const response = await safeFetchAIJson<{ success: boolean; project: InfographicProject }>('/api/gemini/generate-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierTitle: activeDossier.title,
          dossierSubtitle: activeDossier.subtitle || activeDossier.abstract,
          dossierContent: JSON.stringify(activeDossier.projectStructure || []),
          layoutTheme: infoTheme,
          model: geminiSettings?.model || 'gemini-3.7-flash'
        })
      });

      if (response && response.ok && response.data?.project) {
        setInfographicProject(response.data.project);
      }
    } catch (err) {
      console.error('Failed to generate infographic:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. AI Generate Slide Deck
  const handleGenerateSlideDeck = async () => {
    if (!activeDossier) return;
    setIsGenerating(true);
    try {
      const response = await safeFetchAIJson<{ success: boolean; project: SlideDeckProject }>('/api/gemini/generate-slidedeck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierTitle: activeDossier.title,
          dossierSubtitle: activeDossier.subtitle || activeDossier.abstract,
          dossierContent: JSON.stringify(activeDossier.projectStructure || []),
          targetAudience: deckAudience,
          themeColor: 'purple',
          model: geminiSettings?.model || 'gemini-3.7-flash'
        })
      });

      if (response && response.ok && response.data?.project) {
        setSlideDeckProject(response.data.project);
        setActiveSlideNumber(1);
      }
    } catch (err) {
      console.error('Failed to generate slide deck:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Web Speech API Voice synthesis for Podcast / Voiceover demo
  const handlePlayVoice = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    setIsSpeakingPodcast(true);
    utterance.onend = () => setIsSpeakingPodcast(false);
    utterance.onerror = () => setIsSpeakingPodcast(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeakingPodcast(false);
  };

  if (!activeDossier) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <Video className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-medium text-slate-200">Chưa có Hồ Sơ Khảo Luận</h3>
        <p className="text-sm mt-1 max-w-md">Vui lòng khởi tạo ít nhất một Hồ Sơ trong Publisher Studio để kích hoạt Multimedia Studio.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Header Bar: Dossier Selector & Format Tabs */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Dossier Picker */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30 text-indigo-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Đề Án Chuyển Hóa Tri Thức</div>
            <select
              value={selectedDossierId}
              onChange={e => handleDossierChange(e.target.value)}
              className="mt-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs md:max-w-md truncate"
            >
              {dossiers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Multimedia Format Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveFormat('video_storyboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFormat === 'video_storyboard'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-rose-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Sản Xuất Video</span>
          </button>

          <button
            onClick={() => setActiveFormat('audio_podcast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFormat === 'audio_podcast'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Podcast NotebookLM</span>
          </button>

          <button
            onClick={() => setActiveFormat('infographic')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFormat === 'infographic'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Infographic Tri Thức</span>
          </button>

          <button
            onClick={() => setActiveFormat('slidedeck')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeFormat === 'slidedeck'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Slidedeck Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* =========================================================================
            MODULE 1: VIDEO PRODUCTION WORKSTATION & STORYBOARD
        ========================================================================== */}
        {activeFormat === 'video_storyboard' && videoProject && (
          <div className="max-w-7xl mx-auto">
            <VideoProductionManager
              dossier={activeDossier}
              project={videoProject}
              onUpdateProject={setVideoProject}
              geminiSettings={geminiSettings}
            />
          </div>
        )}

        {/* =========================================================================
            MODULE 2: AUDIO PODCAST (NOTEBOOKLM STYLE 2-HOST DEEP DIVE)
        ========================================================================== */}
        {activeFormat === 'audio_podcast' && podcastProject && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Podcast Header Bar */}
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-900/40 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-full border border-indigo-500/30">
                    NOTEBOOKLM AUDIO DEEP DIVE
                  </span>
                  <span className="text-xs text-slate-400">Thời lượng: ~{podcastProject.totalEstimatedMinutes} phút</span>
                </div>
                <h3 className="text-lg font-bold text-white font-serif">{podcastProject.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{podcastProject.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto">
                <button
                  onClick={handleGeneratePodcast}
                  disabled={isGenerating}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-indigo-950/50 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Đang Tạo Đối Thoại...' : 'Tạo Lại Podcast AI'}</span>
                </button>
              </div>
            </div>

            {/* NotebookLM Prompt Helper Box */}
            <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">Prompt Tối Ưu Cho Google NotebookLM (Audio Overview)</h4>
                  <button
                    onClick={() => handleCopy(podcastProject.recommendedPromptNotebookLM, 'prompt_nb')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedKey === 'prompt_nb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'prompt_nb' ? 'Đã sao chép' : 'Sao chép Prompt NotebookLM'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  {podcastProject.recommendedPromptNotebookLM ||
                    `Tạo Audio Deep Dive 2 người dẫn phân tích 6 trụ cột của "${activeDossier.title}" bằng tiếng Việt thực chiến.`}
                </p>
              </div>
            </div>

            {/* Dialogue Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>DÒNG THOẠI ĐỐI ĐÁP ({podcastProject.dialogueTurns.length} LƯỢT)</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> {podcastProject.hostAName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {podcastProject.hostBName}
                  </span>
                </div>
              </div>

              {podcastProject.dialogueTurns.map((turn, idx) => {
                const isHostA = turn.speaker === 'host_a';
                return (
                  <div
                    key={turn.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isHostA
                        ? 'bg-indigo-950/20 border-indigo-800/40 ml-0 md:mr-12'
                        : 'bg-emerald-950/20 border-emerald-800/40 mr-0 md:ml-12'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                            isHostA ? 'bg-indigo-600' : 'bg-emerald-600'
                          }`}
                        >
                          {isHostA ? 'A' : 'B'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200">{turn.speakerName}</span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {turn.topicTag ? `• ${turn.topicTag}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayVoice(turn.text)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md transition-all"
                          title="Đọc thử câu này"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(turn.text, `turn_${idx}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-all"
                          title="Sao chép câu thoại"
                        >
                          {copiedKey === `turn_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed pl-9">{turn.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Takeaway Footer */}
            {podcastProject.summaryTakeaway && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                <Quote className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="text-xs text-slate-300 italic">
                  <span className="font-semibold text-slate-200 not-italic mr-1">Đúc kết tập Podcast:</span>
                  "{podcastProject.summaryTakeaway}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODULE 3: INFOGRAPHIC TRI THỨC (6 TRỤ CỘT & SƠ ĐỒ ASCII)
        ========================================================================== */}
        {activeFormat === 'infographic' && infographicProject && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header & Controls */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">{infographicProject.title}</h3>
                  <p className="text-xs text-slate-400">{infographicProject.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateInfographic}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Đang Tổng Hợp...' : 'Tổng Hợp Infographic AI'}</span>
                </button>
              </div>
            </div>

            {/* Visual Poster Container */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
              {/* Top Banner */}
              <div className="text-center space-y-2 border-b border-slate-800 pb-6">
                <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20 uppercase tracking-wider">
                  Bản Đồ Trực Quan Hóa Tri Thức
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white font-serif tracking-tight">
                  {infographicProject.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto pt-2 text-xs">
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-300 text-left">
                    <span className="font-bold block text-red-200 mb-0.5">BÀI TOÁN SỐNG CÒN:</span>
                    {infographicProject.coreProblem}
                  </div>
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-emerald-300 text-left">
                    <span className="font-bold block text-emerald-200 mb-0.5">GIẢI PHÁP ĐỘT PHÁ:</span>
                    {infographicProject.breakthroughSolution}
                  </div>
                </div>
              </div>

              {/* 4 Big Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {infographicProject.metrics.map(metric => (
                  <div
                    key={metric.id}
                    className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-1 hover:border-emerald-500/40 transition-all"
                  >
                    <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">{metric.value}</div>
                    <div className="text-xs font-bold text-slate-200">{metric.label}</div>
                    {metric.subtext && <div className="text-[11px] text-slate-400">{metric.subtext}</div>}
                  </div>
                ))}
              </div>

              {/* 6 Pillars Visual Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
                  CẤU TRÚC 6 TRỤ CỘT ĐỘNG CHUYỂN HÓA TRI THỨC
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {infographicProject.pillarBlocks.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded">
                          TRỤ CỘT {p.pillarNum}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">{p.tag}</span>
                      </div>
                      <h5 className="text-sm font-bold text-white">{p.title}</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">{p.coreInsight}</p>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-medium">
                        ➔ {p.takeaway}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ASCII Pipeline Diagram */}
              {infographicProject.asciiPipeline && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
                    SƠ ĐỒ DÒNG CHẢY HÀNH ĐỘNG THỰC THI (ASCII FLOW)
                  </h4>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto text-xs text-emerald-400 font-mono text-center leading-relaxed">
                    {infographicProject.asciiPipeline}
                  </div>
                </div>
              )}

              {/* Action Steps & Quote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-xs">
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-200 uppercase tracking-wider">HÀNH ĐỘNG TIÊN QUYẾT:</h5>
                  <ul className="space-y-1.5">
                    {infographicProject.keyActionSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {infographicProject.calloutQuote && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex flex-col justify-between">
                    <Quote className="w-5 h-5 text-emerald-400 mb-2" />
                    <p className="text-xs text-slate-200 italic leading-relaxed">
                      "{infographicProject.calloutQuote.quote}"
                    </p>
                    <span className="text-[11px] text-emerald-400 font-semibold mt-2 text-right">
                      — {infographicProject.calloutQuote.author}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODULE 4: SLIDEDECK BÁO CÁO & THUYẾT TRÌNH ĐA NĂNG
        ========================================================================== */}
        {activeFormat === 'slidedeck' && slideDeckProject && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Controls */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Đối Tượng Thuyết Trình</label>
                  <select
                    value={deckAudience}
                    onChange={e => setDeckAudience(e.target.value as any)}
                    className="mt-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="investors_board">Hội Đồng Quản Trị & Nhà Đầu Tư</option>
                    <option value="public_community">Cộng Đồng & Đại Chúng</option>
                    <option value="engineering_team">Đội Ngũ Kỹ Nghệ & Thi Công</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenReportPresentation && (
                  <button
                    onClick={() => onOpenReportPresentation(activeDossier)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium rounded-xl text-xs border border-purple-500/30 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Chế Độ Toàn Màn Hình</span>
                  </button>
                )}

                <button
                  onClick={handleGenerateSlideDeck}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-purple-950/50 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Đang Tạo Slides...' : 'Tạo Lại Slide Deck AI'}</span>
                </button>
              </div>
            </div>

            {/* Slide Viewer Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Slide Canvas */}
              <div className="lg:col-span-8 space-y-4">
                {(() => {
                  const slide =
                    slideDeckProject.slides.find(s => s.slideNumber === activeSlideNumber) || slideDeckProject.slides[0];
                  if (!slide) return null;

                  return (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-purple-500/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                      {/* Ambient corner highlights */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                      {/* Slide Top Info */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                            SLIDE {slide.slideNumber} / {slideDeckProject.slides.length}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">{slide.slideType.toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-serif">{activeDossier.title}</span>
                      </div>

                      {/* Slide Content */}
                      <div className="my-auto space-y-4 max-w-2xl">
                        <h3 className="text-xl md:text-2xl font-black text-white font-serif leading-tight">
                          {slide.title}
                        </h3>
                        {slide.subtitle && <p className="text-sm text-purple-300 font-medium">{slide.subtitle}</p>}

                        {/* Bullets */}
                        {slide.bullets && slide.bullets.length > 0 && (
                          <ul className="space-y-2 text-xs md:text-sm text-slate-300">
                            {slide.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* ASCII Diagram if any */}
                        {slide.asciiDiagram && (
                          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-purple-300 font-mono whitespace-pre overflow-x-auto">
                            {slide.asciiDiagram}
                          </div>
                        )}

                        {/* Highlight Metric */}
                        {slide.highlightMetric && (
                          <div className="inline-flex items-center gap-3 p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl">
                            <span className="text-xl font-bold text-purple-300 font-mono">
                              {slide.highlightMetric.value}
                            </span>
                            <span className="text-xs text-slate-300">{slide.highlightMetric.label}</span>
                          </div>
                        )}
                      </div>

                      {/* Slide Footer */}
                      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                        <span>Oneness Governance • Knowledge Transforming</span>
                        <span>Đối tượng: {slideDeckProject.targetAudience}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Slide Navigation Strip */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                  {slideDeckProject.slides.map(slide => (
                    <button
                      key={slide.slideNumber}
                      onClick={() => setActiveSlideNumber(slide.slideNumber)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeSlideNumber === slide.slideNumber
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50 scale-105'
                          : 'bg-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Slide {slide.slideNumber}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Speaker Notes & Details */}
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                {(() => {
                  const slide =
                    slideDeckProject.slides.find(s => s.slideNumber === activeSlideNumber) || slideDeckProject.slides[0];
                  if (!slide) return null;

                  return (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                        GHI CHÚ THUYẾT TRÌNH (SPEAKER NOTES)
                      </h4>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold block text-purple-300 mb-1">Lời khuyên cho người nói:</span>
                        {slide.speakerNotes || 'Tập trung nhấn mạnh vào bài toán thực tiễn và lộ trình hành động.'}
                      </div>

                      {slide.recommendedVisual && (
                        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                          <span className="font-semibold block text-indigo-300 mb-1">Gợi ý hình ảnh/phối cảnh:</span>
                          {slide.recommendedVisual}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Export Markdown Presentation */}
                <button
                  onClick={() => {
                    const md = `# BỘ SLIDE THUYẾT TRÌNH: ${slideDeckProject.title}
Phụ đề: ${slideDeckProject.subtitle}
Đối tượng: ${slideDeckProject.targetAudience}

---

${slideDeckProject.slides
  .map(
    s => `## SLIDE ${s.slideNumber}: ${s.title}
*${s.subtitle || ''}*

${s.bullets ? s.bullets.map(b => `- ${b}`).join('\n') : ''}
${s.asciiDiagram ? `\n\`\`\`text\n${s.asciiDiagram}\n\`\`\`\n` : ''}
${s.highlightMetric ? `\n> **${s.highlightMetric.value}**: ${s.highlightMetric.label}\n` : ''}

**Speaker Notes**: ${s.speakerNotes}
**Visual**: ${s.recommendedVisual}

---`
  )
  .join('\n\n')}
`;
                    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `slidedeck_${activeDossier.id}.md`;
                    link.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Về Đề Cương Slide (.MD)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
