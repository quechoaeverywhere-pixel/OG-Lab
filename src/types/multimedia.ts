// Type declarations for Multimedia Studio (Video Producer, Audio Podcast NotebookLM-style, Infographic, Slide Deck)

export type MultimediaFormat = 'video_storyboard' | 'audio_podcast' | 'infographic' | 'slidedeck';

export interface VideoScene {
  sceneNumber: number;
  durationSeconds: number;
  sceneTitle: string;
  visualPrompt: string; // Detailed visual prompt for image/video generation
  visualType: 'concept_architecture' | 'flow_diagram' | 'data_metric' | 'b_roll_realism' | 'typography_impact';
  voiceoverText: string; // Spoken narrative / voiceover in Vietnamese
  onScreenText: string; // Lower-third or key on-screen bullet
  transition: 'fade' | 'slide_left' | 'zoom_in' | 'cross_dissolve';
  cameraAngle?: string;
  musicMood?: string;
  bgImageUrl?: string;
  footageImageUrl?: string;
  footagePromptEn?: string;
  footagePromptVi?: string;
  aiVoiceId?: string;
  speechRate?: number;
  speechPitch?: number;
  status?: 'draft' | 'prompt_ready' | 'footage_generated' | 'recorded';
}

export interface VideoProductionProject {
  id: string;
  title: string;
  subtitle: string;
  targetAspect: '16:9' | '9:16' | '1:1';
  targetStyle: 'documentary_cinematic' | 'quick_shorts_reels' | 'architectural_showcase' | 'academic_deep_dive';
  estimatedDurationSeconds: number;
  voiceoverGender: 'male_deep' | 'female_clear' | 'duo_dialogue';
  defaultVoiceId?: string;
  defaultSpeechRate?: number;
  defaultSpeechPitch?: number;
  backgroundMusicStyle: 'ambient_zen' | 'cinematic_epic' | 'lofi_study' | 'corporate_modern';
  scenes: VideoScene[];
  executiveHook: string;
  callToAction: string;
  directorNotes?: string;
  productionStatus?: 'scripting' | 'storyboarding' | 'footage_ready' | 'export_ready';
  createdAt: string;
}

export interface PodcastDialogueTurn {
  id: string;
  speaker: 'host_a' | 'host_b';
  speakerName: string; // e.g. "Minh Triết (Chuyên gia Đề Án)" or "Hải An (Nhà Báo & Khai Phóng)"
  speakerRole: 'expert_analyst' | 'curious_questioner';
  avatarColor: string;
  text: string;
  durationSecondsEstimate: number;
  topicTag?: string;
  quoteOrPillarRef?: string;
}

export interface AudioPodcastProject {
  id: string;
  title: string;
  subtitle: string;
  formatStyle: 'notebook_deep_dive' | 'investigative_interview' | 'philosophical_debate' | 'quick_briefing';
  hostAName: string;
  hostBName: string;
  dialogueTurns: PodcastDialogueTurn[];
  totalEstimatedMinutes: number;
  summaryTakeaway: string;
  recommendedPromptNotebookLM: string;
  createdAt: string;
}

export interface InfographicMetric {
  id: string;
  value: string;
  label: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface InfographicPillarBlock {
  pillarNum: string;
  title: string;
  coreInsight: string;
  takeaway: string;
  asciiDiagram?: string;
  tag: string;
}

export interface InfographicProject {
  id: string;
  title: string;
  subtitle: string;
  layoutTheme: 'emerald_zen' | 'purple_matrix' | 'amber_rustic' | 'ocean_deep';
  coreProblem: string;
  breakthroughSolution: string;
  metrics: InfographicMetric[];
  pillarBlocks: InfographicPillarBlock[];
  asciiPipeline: string;
  keyActionSteps: string[];
  calloutQuote: {
    quote: string;
    author: string;
  };
  createdAt: string;
}

export interface SlideItem {
  slideNumber: number;
  slideType: 'cover' | 'problem_statement' | 'architecture_pillar' | 'mechanism_flow' | 'action_plan' | 'summary_conclusion';
  title: string;
  subtitle?: string;
  bullets: string[];
  highlightMetric?: {
    value: string;
    label: string;
  };
  asciiDiagram?: string;
  speakerNotes: string;
  recommendedVisual: string;
}

export interface SlideDeckProject {
  id: string;
  title: string;
  subtitle: string;
  targetAudience: 'investors_board' | 'public_community' | 'engineering_team' | 'academic_conference';
  slides: SlideItem[];
  themeColor: 'purple' | 'amber' | 'emerald' | 'cyan' | 'slate';
  createdAt: string;
}

export interface MultimediaHubState {
  activeModule: MultimediaFormat;
  videoProjects: VideoProductionProject[];
  podcastProjects: AudioPodcastProject[];
  infographicProjects: InfographicProject[];
  slideDeckProjects: SlideDeckProject[];
}
