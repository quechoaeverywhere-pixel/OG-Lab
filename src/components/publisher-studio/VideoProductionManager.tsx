import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Mic,
  Volume2,
  VolumeX,
  Clock,
  Tv,
  Smartphone,
  Square,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  FileText,
  Sliders,
  Settings2,
  Wand2,
  Layers,
  Film,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Eye,
  Share2,
  Compass,
  Code2,
  Terminal,
  Cpu
} from 'lucide-react';
import { Dossier, GeminiSettings } from '../../types';
import { VideoProductionProject, VideoScene } from '../../types/multimedia';
import { safeFetchAIJson } from '../../utils/ai-client';

interface VideoProductionManagerProps {
  dossier: Dossier;
  project: VideoProductionProject;
  onUpdateProject: (updated: VideoProductionProject) => void;
  geminiSettings?: GeminiSettings;
}

// Available AI Voice Persona presets
export interface VoicePersona {
  id: string;
  name: string;
  gender: 'male' | 'female';
  region: string;
  description: string;
  tone: string;
  lang: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'vi-male-deep',
    name: 'Nam Miền Bắc Trầm Ấm (Chuyên Gia)',
    gender: 'male',
    region: 'Miền Bắc',
    description: 'Giọng đọc đĩnh đạc, trầm hùng, phù hợp phim tài liệu học thuật & phân tích',
    tone: 'Trầm ấm, Uy quyền',
    lang: 'vi-VN'
  },
  {
    id: 'vi-female-inspiring',
    name: 'Nữ Miền Bắc Truyền Cảm (Thuyết Minh)',
    gender: 'female',
    region: 'Miền Bắc',
    description: 'Giọng đọc trong sáng, truyền cảm, nhịp điệu cuốn hút & sang trọng',
    tone: 'Thanh thoát, Tự tin',
    lang: 'vi-VN'
  },
  {
    id: 'vi-male-south-warm',
    name: 'Nam Miền Nam Thân Thiện (Đàm Thoại)',
    gender: 'male',
    region: 'Miền Nam',
    description: 'Giọng đọc gần gũi, chân thành, phù hợp video thực chiến & khởi nghiệp',
    tone: 'Ấm áp, Thực tế',
    lang: 'vi-VN'
  },
  {
    id: 'vi-female-south-gentle',
    name: 'Nữ Miền Nam Dịu Dàng (Kể Chuyện)',
    gender: 'female',
    region: 'Miền Nam',
    description: 'Giọng điệu mềm mại, nhẹ nhàng, giàu cảm xúc & dễ tiếp thu',
    tone: 'Dịu dàng, Mộc mạc',
    lang: 'vi-VN'
  },
  {
    id: 'en-narrative-doc',
    name: 'English Cinematic Voice (International)',
    gender: 'male',
    region: 'Global',
    description: 'Global documentary standard narration for international showcase',
    tone: 'Cinematic, Crisp',
    lang: 'en-US'
  }
];

export const CAMERA_ANGLES = [
  'Aerial Drone Slow Pan (Góc toàn từ trên cao)',
  'Eye-Level Interior View (Góc ngang tầm mắt)',
  'Low-Angle Architectural Hero (Góc thấp tôn dáng công trình)',
  'Close-Up Texture & Detail (Cận cảnh chất liệu mộc)',
  'Cinematic Dolly Zoom In (Tiến dần vào tâm điểm)',
  'Orbit 360 Degree View (Quay tròn quanh không gian)',
  'Isometric Blueprint Isometric (Bản vẽ trục đo đẳng cự)'
];

export const TRANSITIONS = [
  { id: 'fade', label: 'Fade to Black / White (Mờ dần)' },
  { id: 'cross_dissolve', label: 'Cross Dissolve (Hòa tan khung hình)' },
  { id: 'slide_left', label: 'Slide Left (Trượt ngang mượt)' },
  { id: 'zoom_in', label: 'Dynamic Zoom (Phóng to chuyển cảnh)' }
];

/**
 * Standard Google Veo & Google AI Studio Prompt Formatter
 */
export const buildGoogleVeoPrompt = (scene: VideoScene, project: VideoProductionProject, dossier: Dossier): string => {
  const aspect = project.targetAspect === '9:16' ? '9:16 vertical video' : '16:9 widescreen video';
  const duration = `${scene.durationSeconds || 8}s`;
  const camera = scene.cameraAngle || 'Aerial Cinematic Pan';
  const visualCore = scene.visualPrompt || `Cinematic shot illustrating ${scene.sceneTitle}, Vietnamese ecological and rustic wabi-sabi architectural concept, natural reclaimed wood, laterite stone, bamboo and serene water garden.`;

  return `[Prompt Google Veo / VideoFX / Runway / Sora]:
${visualCore}

[Camera Movement]: ${camera}, smooth fluid cinematic motion, shallow depth of field, 35mm lens.
[Lighting & Mood]: Natural warm golden hour lighting, soft atmospheric glow, peaceful zen aesthetic.
[Technical Spec]: 4K UHD photorealistic, 24fps motion blur, masterpiece, ${aspect}, duration ${duration}.
[Scene Title & Text]: "${scene.sceneTitle}" | On-Screen: "${scene.onScreenText}"
[Voiceover Sync]: "${scene.voiceoverText}"
[Negative Prompt]: cartoon, anime, plastic 3d render, distorted artifacts, blurry, low resolution, watermark.`;
};

/**
 * Build Full Batch Prompt Sheet formatted for Google AI Studio
 */
export const buildGoogleAIStudioPromptSheet = (project: VideoProductionProject, dossier: Dossier): string => {
  const scenesText = project.scenes
    .map(
      (s, idx) => `### PHÂN CẢNH ${s.sceneNumber}: ${s.sceneTitle} (${s.durationSeconds || 8}s)
- **Tỉ lệ & Thời lượng**: ${project.targetAspect} | ${s.durationSeconds || 8}s | Góc: ${s.cameraAngle || 'Aerial Pan'}
- **Prompt Google Veo / VideoFX (Copy & Paste)**:
\`\`\`text
${s.visualPrompt}
\`\`\`
- **Thông Số Quay Chuẩn Google AI Studio**:
  - *Camera Motion*: ${s.cameraAngle || 'Aerial Pan'}
  - *Lighting & Tone*: Natural warm sunlight, wabi-sabi rustic materiality, cinematic 4K UHD.
  - *On-Screen Text*: "${s.onScreenText}"
  - *Lời Thuyết Minh (Voiceover)*: "${s.voiceoverText}"
`
    )
    .join('\n---\n\n');

  return `# GÓI PROMPT CHUẨN GOOGLE AI STUDIO & GOOGLE VEO (VIDEO PRODUCTION PROMPT MANIFEST)
**Đề Án**: ${dossier.title}
**Tiêu Đề Video**: ${project.title}
**Tỷ Lệ Khung Hình**: ${project.targetAspect} (${project.targetAspect === '16:9' ? 'Ngang 16:9 YouTube / TV' : 'Dọc 9:16 Shorts / Reels'})
**Tổng Thời Lượng**: ${project.estimatedDurationSeconds} giây (${project.scenes.length} phân cảnh)
**Mục Đích**: Dán trực tiếp vào Google AI Studio, Google VideoFX, Google Veo, Runway Gen-3, Sora hoặc Midjourney.

---

## HƯỚNG DẪN 3 BƯỚC TẠO VIDEO TRÊN GOOGLE AI STUDIO:
1. Mở https://aistudio.google.com/
2. Chọn mô hình VideoFX / Veo / Imagen 3 hoặc tạo Prompt đa lượt với Gemini 2.5 / 3.7.
3. Sao chép từng đoạn Prompt chuẩn bên dưới và dán vào ô nhập lệnh để khởi tạo Video / Footage 4K.

---

## DANH SÁCH PROMPT THEO TỪNG PHÂN CẢNH:

${scenesText}

---
*Khởi tạo tự động bởi Oneness Governance Publisher Studio - Chuẩn Hóa Tri Thức & Video Prompt Engineering.*
`;
};

export const VideoProductionManager: React.FC<VideoProductionManagerProps> = ({
  dossier,
  project,
  onUpdateProject,
  geminiSettings
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isContinuousPlaying, setIsContinuousPlaying] = useState(false);
  const [isSpeakingCurrent, setIsSpeakingCurrent] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(project.defaultVoiceId || 'vi-male-deep');
  const [speechRate, setSpeechRate] = useState<number>(project.defaultSpeechRate || 1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(project.defaultSpeechPitch || 1.0);

  // Generation Loading states
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingFootage, setIsGeneratingFootage] = useState(false);
  const [batchFootageProgress, setBatchFootageProgress] = useState<{ current: number; total: number } | null>(null);
  
  // UI states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'google_ai_studio' | 'markdown' | 'srt' | 'prompts_json'>('google_ai_studio');
  const [activeTab, setActiveTab] = useState<'editor' | 'prompts_hub' | 'timeline' | 'audio_config' | 'pipeline'>('prompts_hub');

  const activeScene: VideoScene | undefined = project.scenes[activeSceneIndex] || project.scenes[0];

  // Helper copy
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Sync Voice selection into Web Speech
  const playSpeech = (text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!text.trim()) {
      if (onEndCallback) onEndCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoiceObj = VOICE_PERSONAS.find(v => v.id === selectedVoiceId);
    utterance.lang = selectedVoiceObj?.lang || 'vi-VN';
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    // Check if matching browser voice exists
    const availableVoices = window.speechSynthesis.getVoices();
    const matchingVoice = availableVoices.find(v => v.lang.startsWith(utterance.lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    setIsSpeakingCurrent(true);

    utterance.onend = () => {
      setIsSpeakingCurrent(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      setIsSpeakingCurrent(false);
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeakingCurrent(false);
    setIsContinuousPlaying(false);
  };

  // Continuous Playback through all scenes
  const playFullNarration = (startIndex = 0) => {
    if (startIndex >= project.scenes.length) {
      setIsContinuousPlaying(false);
      setIsSpeakingCurrent(false);
      return;
    }

    setIsContinuousPlaying(true);
    setActiveSceneIndex(startIndex);
    const scene = project.scenes[startIndex];
    const textToRead = scene.voiceoverText || scene.onScreenText;

    playSpeech(textToRead, () => {
      if (startIndex + 1 < project.scenes.length) {
        // Wait 1 second transition pause
        setTimeout(() => {
          playFullNarration(startIndex + 1);
        }, 1000);
      } else {
        setIsContinuousPlaying(false);
      }
    });
  };

  // Update specific field of active scene
  const updateActiveScene = (field: keyof VideoScene, value: any) => {
    const updatedScenes = [...project.scenes];
    if (updatedScenes[activeSceneIndex]) {
      updatedScenes[activeSceneIndex] = {
        ...updatedScenes[activeSceneIndex],
        [field]: value
      };
      onUpdateProject({
        ...project,
        scenes: updatedScenes
      });
    }
  };

  // Add new Scene
  const handleAddScene = () => {
    const newSceneNumber = project.scenes.length + 1;
    const newScene: VideoScene = {
      sceneNumber: newSceneNumber,
      durationSeconds: 10,
      sceneTitle: `Cảnh ${newSceneNumber}: Trọng Tâm Mới`,
      visualPrompt: `Cinematic wide angle shot of modern Vietnamese rustic architecture, wabi-sabi garden, warm natural ambient light, 8k, photorealistic`,
      visualType: 'concept_architecture',
      voiceoverText: 'Thuyết minh phân cảnh tiếp nối theo mạch đề án...',
      onScreenText: 'TIÊU ĐIỂM HÀNH ĐỘNG MỚI',
      transition: 'fade',
      cameraAngle: 'Eye-Level Interior View (Góc ngang tầm mắt)',
      musicMood: 'Ambient Zen',
      status: 'draft'
    };

    const updated = {
      ...project,
      scenes: [...project.scenes, newScene],
      estimatedDurationSeconds: project.estimatedDurationSeconds + 10
    };
    onUpdateProject(updated);
    setActiveSceneIndex(updated.scenes.length - 1);
  };

  // Delete Scene
  const handleDeleteScene = (indexToDelete: number) => {
    if (project.scenes.length <= 1) return;
    const updatedScenes = project.scenes
      .filter((_, idx) => idx !== indexToDelete)
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));

    const updated = {
      ...project,
      scenes: updatedScenes,
      estimatedDurationSeconds: updatedScenes.reduce((acc, s) => acc + (s.durationSeconds || 10), 0)
    };
    onUpdateProject(updated);
    if (activeSceneIndex >= updatedScenes.length) {
      setActiveSceneIndex(Math.max(0, updatedScenes.length - 1));
    }
  };

  // Move scene position
  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) return;

    const newScenes = [...project.scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    // re-index scene numbers
    const reindexed = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateProject({ ...project, scenes: reindexed });
    setActiveSceneIndex(targetIndex);
  };

  // 1. AI Generate / Refine Scene Prompt for Footage
  const handleGenerateScenePrompt = async (targetIndex = activeSceneIndex) => {
    const target = project.scenes[targetIndex];
    if (!target) return;

    setIsGeneratingPrompt(true);
    try {
      const res = await safeFetchAIJson<{ success: boolean; data: { visualPromptEn: string; visualPromptVi: string; suggestedCameraAngle: string } }>(
        '/api/gemini/generate-scene-prompt',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneTitle: target.sceneTitle,
            voiceoverText: target.voiceoverText,
            dossierTitle: dossier.title,
            cameraAngle: target.cameraAngle || 'Aerial Cinematic Pan',
            targetStyle: project.targetStyle,
            visualType: target.visualType,
            model: geminiSettings?.model || 'gemini-3.7-flash'
          })
        }
      );

      if (res && res.ok && res.data?.data) {
        const updatedScenes = [...project.scenes];
        updatedScenes[targetIndex] = {
          ...updatedScenes[targetIndex],
          visualPrompt: res.data.data.visualPromptEn || updatedScenes[targetIndex].visualPrompt,
          footagePromptEn: res.data.data.visualPromptEn,
          footagePromptVi: res.data.data.visualPromptVi,
          cameraAngle: res.data.data.suggestedCameraAngle || updatedScenes[targetIndex].cameraAngle,
          status: 'prompt_ready'
        };

        onUpdateProject({
          ...project,
          scenes: updatedScenes
        });
      }
    } catch (err) {
      console.error('Failed to generate scene prompt:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // 2. AI Generate Scene Footage Image (Built-in Image Generator)
  const handleGenerateSceneFootage = async (targetIndex = activeSceneIndex) => {
    const target = project.scenes[targetIndex];
    if (!target) return;

    setIsGeneratingFootage(true);
    try {
      const res = await safeFetchAIJson<{ success: boolean; imageUrl: string; refinedPrompt: string }>(
        '/api/gemini/generate-scene-footage',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneNumber: target.sceneNumber,
            sceneTitle: target.sceneTitle,
            visualPrompt: target.visualPrompt || target.footagePromptEn,
            targetAspect: project.targetAspect,
            cameraAngle: target.cameraAngle,
            style: project.targetStyle
          })
        }
      );

      if (res && res.ok && res.data?.imageUrl) {
        const updatedScenes = [...project.scenes];
        updatedScenes[targetIndex] = {
          ...updatedScenes[targetIndex],
          footageImageUrl: res.data.imageUrl,
          bgImageUrl: res.data.imageUrl,
          visualPrompt: res.data.refinedPrompt || updatedScenes[targetIndex].visualPrompt,
          status: 'footage_generated'
        };

        onUpdateProject({
          ...project,
          scenes: updatedScenes
        });
      }
    } catch (err) {
      console.error('Failed to generate scene footage image:', err);
    } finally {
      setIsGeneratingFootage(false);
    }
  };

  // 3. Batch Generate Footage for ALL Scenes
  const handleBatchGenerateFootage = async () => {
    if (batchFootageProgress || isGeneratingFootage) return;
    setBatchFootageProgress({ current: 0, total: project.scenes.length });

    const updatedScenes = [...project.scenes];

    for (let i = 0; i < project.scenes.length; i++) {
      setBatchFootageProgress({ current: i + 1, total: project.scenes.length });
      const s = project.scenes[i];
      try {
        const res = await safeFetchAIJson<{ success: boolean; imageUrl: string; refinedPrompt: string }>(
          '/api/gemini/generate-scene-footage',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sceneNumber: s.sceneNumber,
              sceneTitle: s.sceneTitle,
              visualPrompt: s.visualPrompt || s.footagePromptEn,
              targetAspect: project.targetAspect,
              cameraAngle: s.cameraAngle,
              style: project.targetStyle
            })
          }
        );

        if (res && res.ok && res.data?.imageUrl) {
          updatedScenes[i] = {
            ...updatedScenes[i],
            footageImageUrl: res.data.imageUrl,
            bgImageUrl: res.data.imageUrl,
            status: 'footage_generated'
          };
          onUpdateProject({
            ...project,
            scenes: [...updatedScenes]
          });
        }
      } catch (err) {
        console.warn(`Failed batch footage for scene ${i + 1}:`, err);
      }
    }

    setBatchFootageProgress(null);
  };

  // 4. Export SRT Subtitles generator
  const generateSRT = (): string => {
    let srt = '';
    let currentTime = 0;

    project.scenes.forEach((scene, index) => {
      const startTime = currentTime;
      const duration = scene.durationSeconds || 10;
      const endTime = currentTime + duration;
      currentTime = endTime;

      const formatTime = (secs: number) => {
        const hrs = Math.floor(secs / 3600).toString().padStart(2, '0');
        const mins = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        const ms = '000';
        return `${hrs}:${mins}:${s},${ms}`;
      };

      srt += `${index + 1}\n`;
      srt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srt += `${scene.voiceoverText || scene.onScreenText}\n\n`;
    });

    return srt;
  };

  // 5. Export Markdown Production Document
  const generateMarkdownScript = (): string => {
    return `# BẢN KỊCH BẢN ĐẠO DIỄN & QUY TRÌNH SẢN XUẤT VIDEO (ONENESS PRODUCTION PACKET)
**Đề Án**: ${dossier.title}
**Tiêu Đề Video**: ${project.title}
**Phụ Đề**: ${project.subtitle}
**Tỷ Lệ Khung Hình**: ${project.targetAspect} (${project.targetAspect === '16:9' ? 'Ngang 16:9 Cinematic / YouTube' : 'Dọc 9:16 Shorts / Reels'})
**Phong Cách Thể Hiện**: ${project.targetStyle}
**Tổng Thời Lượng Ước Tính**: ${project.estimatedDurationSeconds} giây (${Math.ceil(project.estimatedDurationSeconds / 60)} phút)
**Giọng Đọc AI Chỉ Định**: ${VOICE_PERSONAS.find(v => v.id === selectedVoiceId)?.name || 'Nam Miền Bắc'} (Tốc độ: ${speechRate}x)
**Nhạc Nền Đề Xuất**: ${project.backgroundMusicStyle}

---

## 1. HOOK MỞ ĐẦU (3s ĐẦU TIÊN)
> "${project.executiveHook || 'Giải mã toàn diện ý niệm khởi nguyên...'}"

---

## 2. BẢNG PHÂN CẢNH CHI TIẾT (PRODUCTION STORYBOARD)

${project.scenes
  .map(
    s => `### [PHÂN CẢNH ${s.sceneNumber}]: ${s.sceneTitle} (${s.durationSeconds}s)
- **Góc Máy (Camera Angle)**: ${s.cameraAngle || 'Aerial Pan'}
- **Hiệu Ứng Chuyển Cảnh**: ${s.transition || 'Fade'}
- **Text Hiển Thị Màn Hình (On-Screen)**: "${s.onScreenText}"
- **Lời Thuyết Minh (Voiceover Script)**:
  > "${s.voiceoverText}"
- **Prompt Sinh Footage AI (Midjourney / Runway / Gemini Image)**:
  \`\`\`text
  ${s.visualPrompt}
  \`\`\`
${s.footageImageUrl ? `- **Footage Đã Render**: ${s.footageImageUrl}` : '- **Trạng Thái Footage**: Chờ Render'}
`
  )
  .join('\n---\n\n')}

---

## 3. KẾT LUẬN & KÊU GỌI HÀNH ĐỘNG (CALL TO ACTION)
> "${project.callToAction || 'Xem toàn văn hồ sơ khảo luận tại Oneness Governance Lab.'}"

---
*Tài liệu được khởi sinh tự động từ Hệ Thống Oneness Governance Studio - Sứ Mệnh Chuyển Hóa Tri Thức.*
`;
  };

  // Download export file helper
  const handleDownloadFile = (content: string, filename: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP PRODUCTION HEADER & FORMAT CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Google AI Studio & Veo Prompt Studio
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {project.scenes.length} Phân Cảnh • Tổng {project.estimatedDurationSeconds}s
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-medium">
                {project.scenes.filter(s => s.footageImageUrl).length}/{project.scenes.length} Footage Đã Render
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white font-serif tracking-tight">
              {project.title}
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl">
              {project.subtitle || 'Chuẩn hóa prompt điện ảnh 4K cho Google AI Studio (Google Veo, VideoFX, Imagen 3, Runway Gen-3, Sora).'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            {/* Primary Google AI Studio Prompt Export Button */}
            <button
              onClick={() => {
                setExportFormat('google_ai_studio');
                setShowExportModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
              title="Xuất gói prompt chuẩn hóa để dán vào Google AI Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Xuất Prompt Google AI Studio</span>
            </button>

            {/* Direct Link to Google AI Studio */}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition-all shadow cursor-pointer"
              title="Mở nền tảng Google AI Studio trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Mở Google AI Studio</span>
            </a>

            <button
              onClick={() => handleBatchGenerateFootage()}
              disabled={isGeneratingFootage || !!batchFootageProgress}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl text-xs transition-all disabled:opacity-50"
              title="Tự động gọi AI render hình ảnh footage minh họa cho tất cả các cảnh"
            >
              <Wand2 className={`w-3.5 h-3.5 ${batchFootageProgress ? 'animate-spin' : ''}`} />
              <span>
                {batchFootageProgress
                  ? `${batchFootageProgress.current}/${batchFootageProgress.total}...`
                  : 'Render Ảnh Minh Họa'}
              </span>
            </button>

            <button
              onClick={() => {
                setExportFormat('markdown');
                setShowExportModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium rounded-xl text-xs transition-all shadow"
              title="Xuất toàn bộ kịch bản đạo diễn & phụ đề"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Kịch Bản Đạo Diễn</span>
            </button>
          </div>
        </div>

        {/* Aspect Ratio & Workspace View Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Sub-tabs: Prompts Hub / Editor / Timeline / Voice Config / Production Pipeline */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('prompts_hub')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'prompts_hub'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Bộ Prompt Chuẩn Google AI Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Trường Quay & Phân Cảnh</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dòng Thời Gian (Filmstrip)</span>
            </button>

            <button
              onClick={() => setActiveTab('audio_config')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'audio_config'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Giọng Đọc & Lồng Tiếng</span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Quy Trình 4 Bước</span>
            </button>
          </div>

          {/* Aspect ratio toggles */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Khung Hình:</span>
            <button
              onClick={() => onUpdateProject({ ...project, targetAspect: '16:9' })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                project.targetAspect === '16:9'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> 16:9 Ngang
            </button>
            <button
              onClick={() => onUpdateProject({ ...project, targetAspect: '9:16' })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                project.targetAspect === '9:16'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 9:16 Dọc Shorts
            </button>
          </div>
        </div>
      </div>

      {/* 2. AUDIO VOICE BAR (Quick Access Voice Controller) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Giọng Đọc AI (Voice Actor)</div>
              <select
                value={selectedVoiceId}
                onChange={e => {
                  setSelectedVoiceId(e.target.value);
                  onUpdateProject({ ...project, defaultVoiceId: e.target.value });
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                {VOICE_PERSONAS.map(vp => (
                  <option key={vp.id} value={vp.id}>
                    {vp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Tốc Độ: {speechRate}x</div>
              <div className="flex items-center gap-1 mt-0.5">
                {[0.8, 0.9, 1.0, 1.1, 1.25].map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      onUpdateProject({ ...project, defaultSpeechRate: rate });
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      speechRate === rate
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Global Narration Controls */}
        <div className="flex items-center gap-2">
          {!isContinuousPlaying ? (
            <button
              onClick={() => playFullNarration(0)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl text-xs shadow-md shadow-emerald-950/40 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Lồng Tiếng Toàn Bộ Video (Từ Đầu)</span>
            </button>
          ) : (
            <button
              onClick={stopSpeech}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-xs shadow-md shadow-rose-950/40 transition-all animate-pulse"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Dừng Lồng Tiếng</span>
            </button>
          )}

          {isSpeakingCurrent && !isContinuousPlaying && (
            <button
              onClick={stopSpeech}
              className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs"
              title="Dừng âm thanh"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. WORKSPACE TAB 0: GOOGLE AI STUDIO PROMPTS HUB */}
      {activeTab === 'prompts_hub' && (
        <div className="space-y-6">
          {/* Top Banner Guide for Google AI Studio & Google Veo */}
          <div className="bg-gradient-to-br from-blue-950/80 via-slate-900/90 to-purple-950/80 border border-blue-500/30 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Google AI Studio & Google Veo Standard
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-medium">
                    {project.scenes.length} Prompt Điện Ảnh Sẵn Sàng
                  </span>
                </div>
                <h4 className="text-lg md:text-xl font-bold text-white tracking-tight font-serif">
                  Quy Trình Tạo Video Chuẩn Qua Google AI Studio (Veo / VideoFX / Imagen 3)
                </h4>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Vì Google Veo & VideoFX là các mô hình video thế hệ mới của Google, quy trình chuẩn mực và tối ưu nhất là <strong className="text-blue-300">sao chép bộ Prompt chuẩn hóa điện ảnh</strong> từ Oneness Lab và dán trực tiếp vào <strong>Google AI Studio</strong> hoặc các công cụ render video AI (Runway Gen-3, Sora, Midjourney) để xuất video 4K chất lượng cao nhất.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                <button
                  onClick={() => {
                    const sheet = buildGoogleAIStudioPromptSheet(project, dossier);
                    handleCopy(sheet, 'all_prompts_copied');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-950/60 transition-all cursor-pointer"
                >
                  {copiedKey === 'all_prompts_copied' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Đã Sao Chép Toàn Bộ Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao Chép Toàn Bộ Prompt (.txt)</span>
                    </>
                  )}
                </button>

                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition-all shadow cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>Mở Google AI Studio Ngay</span>
                </a>
              </div>
            </div>

            {/* Quick 3-Step Instruction Flow */}
            <div className="mt-5 pt-4 border-t border-slate-800/90 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-500/40">
                  1
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Chọn Phân Cảnh & Sao Chép</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Bấm nút "Sao Chép Prompt Chuẩn" ở từng thẻ cảnh bên dưới</div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/40">
                  2
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Dán vào Google AI Studio</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Dán vào ô nhập lệnh để khởi tạo Footage / Video 4K</div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 border border-emerald-500/40">
                  3
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Dựng Phim & Khớp Phụ Đề</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Xuất tệp SRT & kịch bản đạo diễn để ghép nối thành phẩm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid for Each Scene Prompt */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                Danh Sách Prompt Chuẩn Điện Ảnh Theo {project.scenes.length} Phân Cảnh
              </h5>
              <span className="text-xs text-slate-400 font-mono">
                Tỷ lệ khung hình: <strong className="text-slate-200">{project.targetAspect}</strong> ({project.targetAspect === '16:9' ? 'Ngang 16:9' : 'Dọc 9:16 Shorts'})
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {project.scenes.map((scene, idx) => {
                const veoPrompt = buildGoogleVeoPrompt(scene, project, dossier);
                const isCopied = copiedKey === `veo_prompt_${idx}`;

                return (
                  <div
                    key={scene.sceneNumber || idx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 md:p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                            #{scene.sceneNumber}
                          </span>
                          <div>
                            <h6 className="text-xs md:text-sm font-bold text-white line-clamp-1">
                              {scene.sceneTitle}
                            </h6>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Thời lượng: {scene.durationSeconds || 8}s • Góc: {scene.cameraAngle || 'Aerial Pan'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">
                          {project.targetAspect}
                        </span>
                      </div>

                      {/* Prompt Details Box */}
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Prompt Google Veo / VideoFX:
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">4K UHD • 24fps</span>
                        </div>

                        <p className="text-xs font-mono text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 select-all">
                          {scene.visualPrompt}
                        </p>

                        {/* On-screen text & Voiceover sync cue */}
                        <div className="pt-1.5 space-y-1 text-[11px]">
                          {scene.onScreenText && (
                            <div className="text-slate-300">
                              <span className="text-rose-400 font-semibold">Chữ hiển thị:</span> "{scene.onScreenText}"
                            </div>
                          )}
                          {scene.voiceoverText && (
                            <div className="text-slate-400 italic">
                              <span className="text-emerald-400 font-semibold not-italic">Khớp lời thoại:</span> "{scene.voiceoverText}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCopy(veoPrompt, `veo_prompt_${idx}`)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã Sao Chép Prompt Cảnh {scene.sceneNumber}!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao Chép Prompt Chuẩn (Veo/Sora)</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setActiveSceneIndex(idx);
                          setActiveTab('editor');
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                        title="Mở phân cảnh này trong trường quay"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE TAB 1: STUDIO EDITOR (2 COLUMNS) */}
      {activeTab === 'editor' && activeScene && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: VIEWFINDER & LIVE CANVAS */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              {/* Scene navigation header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30">
                    CẢNH {activeScene.sceneNumber} / {project.scenes.length}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeScene.sceneTitle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveSceneIndex(Math.max(0, activeSceneIndex - 1))}
                    disabled={activeSceneIndex === 0}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 rounded-lg"
                    title="Cảnh trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveSceneIndex(Math.min(project.scenes.length - 1, activeSceneIndex + 1))}
                    disabled={activeSceneIndex === project.scenes.length - 1}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 rounded-lg"
                    title="Cảnh tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewfinder Canvas */}
              <div
                className={`w-full relative rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 flex flex-col items-center justify-center p-6 shadow-2xl transition-all ${
                  project.targetAspect === '9:16'
                    ? 'aspect-[9/16] max-w-xs mx-auto'
                    : 'aspect-video'
                }`}
              >
                {/* Background Footage Image or Rendered Graphic */}
                {activeScene.footageImageUrl || activeScene.bgImageUrl ? (
                  <img
                    src={activeScene.footageImageUrl || activeScene.bgImageUrl}
                    alt={activeScene.sceneTitle}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/60" />
                )}

                {/* Ambient Cinematic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

                {/* Viewfinder Framing Overlay */}
                <div className="absolute inset-3 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" /> REC
                    </span>
                    <span>{project.targetAspect} • 4K ULTRA HD</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                    <span>SCENE {activeScene.sceneNumber}.0</span>
                    <span>{activeScene.durationSeconds}s</span>
                  </div>
                </div>

                {/* Dynamic On-Screen Text & Subtitle Overlay */}
                <div className="relative z-10 text-center max-w-md space-y-3 px-4">
                  <div className="inline-block px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-semibold text-rose-300 border border-rose-500/30 shadow-lg">
                    {activeScene.sceneTitle}
                  </div>

                  <h4 className="text-lg md:text-xl font-bold text-white leading-tight font-serif whitespace-pre-line drop-shadow-lg tracking-wide">
                    {activeScene.onScreenText}
                  </h4>

                  {/* Voiceover subtitle box */}
                  <div className="p-3 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 text-xs text-slate-200 italic shadow-xl">
                    <p className="line-clamp-4">"{activeScene.voiceoverText}"</p>
                  </div>
                </div>

                {/* Camera Angle & Visual Status Badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300 z-10">
                  <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                    Góc: {activeScene.cameraAngle || 'Aerial Pan'}
                  </span>
                  <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-mono text-rose-300">
                    Chuyển: {activeScene.transition || 'Fade'}
                  </span>
                </div>
              </div>
            </div>

            {/* Viewfinder Bottom Bar: Quick Generate & Scene Switcher */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playSpeech(activeScene.voiceoverText)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe Cảnh Này</span>
                </button>

                <button
                  onClick={() => handleGenerateSceneFootage(activeSceneIndex)}
                  disabled={isGeneratingFootage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Camera className={`w-3.5 h-3.5 ${isGeneratingFootage ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingFootage ? 'Đang Tạo Footage...' : 'Tạo Ảnh Footage Cảnh Này'}</span>
                </button>
              </div>

              {/* Scene mini dots */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
                {project.scenes.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSceneIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                      activeSceneIndex === idx
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 ring-1 ring-white/50'
                        : s.footageImageUrl
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: SCENE CONFIGURATION & AI PROMPT STUDIO */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  Cấu Hình Phân Cảnh {activeScene.sceneNumber}
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMoveScene(activeSceneIndex, 'up')}
                    disabled={activeSceneIndex === 0}
                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    title="Đẩy cảnh lên trước"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveScene(activeSceneIndex, 'down')}
                    disabled={activeSceneIndex === project.scenes.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    title="Đẩy cảnh xuống sau"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteScene(activeSceneIndex)}
                    disabled={project.scenes.length <= 1}
                    className="p-1 text-red-400 hover:text-red-300 disabled:opacity-20"
                    title="Xóa phân cảnh này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Scene Title & Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tiêu Đề Cảnh Quay:
                  </label>
                  <input
                    type="text"
                    value={activeScene.sceneTitle}
                    onChange={e => updateActiveScene('sceneTitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Thời Lượng (s):
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={activeScene.durationSeconds}
                    onChange={e => updateActiveScene('durationSeconds', parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-center"
                  />
                </div>
              </div>

              {/* 2. Camera Angle & Transition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Góc Máy Điện Ảnh:
                  </label>
                  <select
                    value={activeScene.cameraAngle || CAMERA_ANGLES[0]}
                    onChange={e => updateActiveScene('cameraAngle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {CAMERA_ANGLES.map(ca => (
                      <option key={ca} value={ca}>
                        {ca}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Chuyển Cảnh:
                  </label>
                  <select
                    value={activeScene.transition || 'fade'}
                    onChange={e => updateActiveScene('transition', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {TRANSITIONS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. On-Screen Headline */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Chữ Hiển Thị Trên Màn Hình (On-Screen Headline):
                </label>
                <input
                  type="text"
                  value={activeScene.onScreenText}
                  onChange={e => updateActiveScene('onScreenText', e.target.value)}
                  placeholder="Tiêu điểm chữ hoa trên màn hình..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* 4. Voiceover Script */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Lời Thuyết Minh Diễn Cảm (Voiceover):
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ~{Math.ceil(activeScene.voiceoverText.split(' ').length / 2.5)}s đọc
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={activeScene.voiceoverText}
                  onChange={e => updateActiveScene('voiceoverText', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none font-sans"
                />
              </div>

              {/* 5. AI Prompt Studio for Footage (Built-in Image Tool) */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Prompt Sinh Footage AI (Text-to-Image / Video)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleGenerateScenePrompt(activeSceneIndex)}
                      disabled={isGeneratingPrompt}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                      title="AI phân tích lời thoại và tạo prompt chi tiết"
                    >
                      <Wand2 className={`w-3 h-3 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingPrompt ? 'Đang tạo...' : 'AI Tinh Chỉnh Prompt'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(activeScene.visualPrompt, `p_${activeSceneIndex}`)}
                      className="p-1 text-slate-400 hover:text-slate-200 text-xs"
                      title="Sao chép prompt"
                    >
                      {copiedKey === `p_${activeSceneIndex}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={activeScene.visualPrompt}
                  onChange={e => updateActiveScene('visualPrompt', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none select-all"
                  placeholder="Detailed English prompt for Midjourney, Runway Gen-3, Sora..."
                />

                {activeScene.footagePromptVi && (
                  <div className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded border border-slate-800/50">
                    💡 Ý niệm: {activeScene.footagePromptVi}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Add Scene Button */}
            <div className="pt-2">
              <button
                onClick={handleAddScene}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 text-rose-400" />
                <span>Thêm Phân Cảnh Tiếp Theo (+ Cảnh {project.scenes.length + 1})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. WORKSPACE TAB 2: FILMSTRIP & TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                Dòng Thời Gian Phân Cảnh (Filmstrip Storyboard)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem trực quan toàn bộ các khung hình và nhịp điệu chuyển cảnh của video
              </p>
            </div>
            <button
              onClick={handleAddScene}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Cảnh Mới</span>
            </button>
          </div>

          {/* Filmstrip cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {project.scenes.map((scene, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveSceneIndex(idx);
                  setActiveTab('editor');
                }}
                className={`group cursor-pointer bg-slate-950 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-rose-500/70 hover:shadow-xl ${
                  activeSceneIndex === idx ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                  {scene.footageImageUrl || scene.bgImageUrl ? (
                    <img
                      src={scene.footageImageUrl || scene.bgImageUrl}
                      alt={scene.sceneTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 gap-1 p-4 text-center">
                      <Camera className="w-8 h-8 opacity-40" />
                      <span className="text-[11px]">Chưa tạo footage</span>
                    </div>
                  )}

                  {/* Scene chip */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[10px] font-bold text-white font-mono border border-white/10">
                    CẢNH {scene.sceneNumber}
                  </div>

                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[10px] font-mono text-rose-300 border border-white/10">
                    {scene.durationSeconds}s
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[11px] font-bold text-white truncate text-center">
                    {scene.onScreenText}
                  </div>
                </div>

                {/* Body info */}
                <div className="p-3.5 space-y-2">
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">
                    {scene.sceneTitle}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
                    "{scene.voiceoverText}"
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Góc: {scene.cameraAngle?.split(' ')[0] || 'Aerial'}</span>
                    <span className="text-indigo-400 font-medium">Bấm để chỉnh sửa →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. WORKSPACE TAB 3: AUDIO & VOICE CONFIGURATION */}
      {activeTab === 'audio_config' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-rose-400" />
              Thiết Lập Giọng Đọc AI & Không Gian Âm Thanh (Audio Studio)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Cấu hình người dẫn chuyện, tốc độ đọc, độ cao và phong cách nhạc nền cho toàn bộ video
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VOICE_PERSONAS.map(voice => (
              <div
                key={voice.id}
                onClick={() => {
                  setSelectedVoiceId(voice.id);
                  onUpdateProject({ ...project, defaultVoiceId: voice.id });
                }}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedVoiceId === voice.id
                    ? 'bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-semibold text-slate-300">
                      {voice.region}
                    </span>
                    {selectedVoiceId === voice.id && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <Check className="w-3.5 h-3.5" /> Đang chọn
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-bold text-white">{voice.name}</h5>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{voice.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">Tông: {voice.tone}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      playSpeech(`Xin chào, đây là giọng đọc mẫu của ${voice.name} trong hệ thống Oneness Video Studio.`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  >
                    <Volume2 className="w-3 h-3 text-rose-400" />
                    <span>Nghe Thử</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Background Music Style Selection */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Phong Cách Nhạc Nền (Background Music Atmosphere):
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'ambient_zen', label: 'Ambient Zen & Soft Piano', desc: 'Tĩnh tại, mộc mạc, đậm chất triết học' },
                { id: 'cinematic_epic', label: 'Cinematic Orchestral', desc: 'Hùng tráng, mở rộng tầm nhìn đề án' },
                { id: 'lofi_study', label: 'Lo-Fi Chill & Focus', desc: 'Thư thái, dễ tiếp thu, hiện đại' },
                { id: 'corporate_modern', label: 'Corporate Tech Minimal', desc: 'Chuyên nghiệp, nhịp điệu công nghệ' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => onUpdateProject({ ...project, backgroundMusicStyle: m.id as any })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    project.backgroundMusicStyle === m.id
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. WORKSPACE TAB 4: PRODUCTION PIPELINE ROADMAP */}
      {activeTab === 'pipeline' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-400" />
              Bản Đồ Quy Trình Sản Xuất Video 4 Bước (Production Pipeline)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Quy trình khép kín từ ý niệm đề án học thuật đến xuất bản video hoàn chỉnh
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/40">
                  1
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold">
                  Hoàn Tất
                </span>
              </div>
              <h5 className="text-xs font-bold text-white">Khảo Luận & Lập Kịch Bản</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Phân tích đề án theo 6 Trụ Cột Động và tạo cấu trúc {project.scenes.length} phân cảnh mạch lạc.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/40">
                  2
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded font-semibold">
                  {project.scenes.filter(s => s.footageImageUrl).length}/{project.scenes.length} Đã Render
                </span>
              </div>
              <h5 className="text-xs font-bold text-white">Sinh Prompt & Tạo Footage</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tạo prompt tiếng Anh cho từng cảnh & render hình ảnh footage trực quan 4K bằng Gemini Image.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 border border-rose-500/40 rounded-2xl p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-500/40">
                  3
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded font-semibold">
                  Sẵn Sàng
                </span>
              </div>
              <h5 className="text-xs font-bold text-white">Lồng Tiếng & Giọng Đọc</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Lựa chọn người dẫn chuyện AI, căn chỉnh nhịp điệu câu từ và kiểm thử giọng đọc từng phân đoạn.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center border border-purple-500/40">
                  4
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded font-semibold">
                  Xuất Bản
                </span>
              </div>
              <h5 className="text-xs font-bold text-white">Dựng Phim & Master</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Xuất tệp phụ đề SRT, bảng kịch bản đạo diễn Markdown và gói prompt để hoàn thiện trên CapCut/Premiere.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. EXPORT MODAL DIALOG */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Xuất Gói Prompt Chuẩn Google AI Studio & Kịch Bản Video
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sử dụng trực tiếp trên Google AI Studio (Veo / VideoFX), Runway Gen-3, Sora hoặc tải kịch bản đạo diễn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Modal Format Tabs */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setExportFormat('google_ai_studio')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  exportFormat === 'google_ai_studio'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>✨ Chuẩn Google AI Studio (.txt / .md)</span>
              </button>
              <button
                onClick={() => setExportFormat('markdown')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  exportFormat === 'markdown'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 Kịch Bản Đạo Diễn (.md)</span>
              </button>
              <button
                onClick={() => setExportFormat('srt')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  exportFormat === 'srt'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>⏱️ Phụ Đề Chuẩn (.srt)</span>
              </button>
              <button
                onClick={() => setExportFormat('prompts_json')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  exportFormat === 'prompts_json'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>🎬 Gói JSON Kỹ Thuật (.json)</span>
              </button>
            </div>

            {/* Quick Action banner inside Modal if Google AI Studio is active */}
            {exportFormat === 'google_ai_studio' && (
              <div className="bg-blue-950/40 border-b border-blue-900/50 px-5 py-2.5 flex items-center justify-between gap-4 text-xs">
                <span className="text-blue-300">
                  💡 <strong>Gợi ý:</strong> Sao chép nội dung bên dưới, mở Google AI Studio và dán vào prompt để khởi tạo Video / Footage.
                </span>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all shadow shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Mở aistudio.google.com ↗</span>
                </a>
              </div>
            )}

            {/* Modal Content Preview */}
            <div className="p-5 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-all">
              {exportFormat === 'google_ai_studio' && (
                <pre className="whitespace-pre-wrap">{buildGoogleAIStudioPromptSheet(project, dossier)}</pre>
              )}
              {exportFormat === 'markdown' && <pre className="whitespace-pre-wrap">{generateMarkdownScript()}</pre>}
              {exportFormat === 'srt' && <pre className="whitespace-pre-wrap">{generateSRT()}</pre>}
              {exportFormat === 'prompts_json' && (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      project: project.title,
                      aspectRatio: project.targetAspect,
                      totalScenes: project.scenes.length,
                      durationSeconds: project.estimatedDurationSeconds,
                      scenes: project.scenes.map(s => ({
                        sceneNumber: s.sceneNumber,
                        title: s.sceneTitle,
                        cameraAngle: s.cameraAngle,
                        visualPrompt: s.visualPrompt,
                        veoPromptStandard: buildGoogleVeoPrompt(s, project, dossier),
                        voiceoverText: s.voiceoverText,
                        onScreenText: s.onScreenText
                      }))
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const content =
                      exportFormat === 'google_ai_studio'
                        ? buildGoogleAIStudioPromptSheet(project, dossier)
                        : exportFormat === 'markdown'
                        ? generateMarkdownScript()
                        : exportFormat === 'srt'
                        ? generateSRT()
                        : JSON.stringify(project, null, 2);
                    handleCopy(content, 'export_copied');
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                >
                  {copiedKey === 'export_copied' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Đã Sao Chép Toàn Bộ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao Chép Nội Dung Này</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    if (exportFormat === 'google_ai_studio') {
                      handleDownloadFile(
                        buildGoogleAIStudioPromptSheet(project, dossier),
                        `${dossier.id}-google-ai-studio-prompts.md`,
                        'text/markdown'
                      );
                    } else if (exportFormat === 'markdown') {
                      handleDownloadFile(
                        generateMarkdownScript(),
                        `${dossier.id}-video-production-script.md`,
                        'text/markdown'
                      );
                    } else if (exportFormat === 'srt') {
                      handleDownloadFile(generateSRT(), `${dossier.id}-subtitles.srt`, 'text/plain');
                    } else {
                      handleDownloadFile(
                        JSON.stringify(project, null, 2),
                        `${dossier.id}-video-prompts.json`,
                        'application/json'
                      );
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-950/50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Tệp Xuất Bản Này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
