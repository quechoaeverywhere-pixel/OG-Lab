export interface ClassicalQuote {
  id: string;
  quote: string;
  author: string;
  work: string;
  eraOrYear?: string;
  interpretation: string;
  discipline?: string;
  language?: string;
  translationVi?: string;
}

export interface CitationItem {
  id: string;
  title: string;
  author: string;
  year: string | number;
  source: string;
  category: 'Kinh điển' | 'Sách Khoa học' | 'Nghiên cứu AI' | 'IEEE / ACM Papers' | 'Web Grounding' | 'Học thuật Liên ngành';
  doiOrUrl?: string;
  keyQuote?: string;
  dossierIds?: string[];
}

export interface PhilosophicalMapping {
  classicalConcept: string;
  computerSciencePattern: string;
  rationale: string;
  failureModeAvoided: string;
}

export interface PhilosophicalBasis {
  doctrine: string;
  philosopher: string;
  coreTenet: string;
  modernParity: string;
}

export type BlueprintNodeType =
  | 'client'
  | 'gateway'
  | 'service'
  | 'agent'
  | 'orchestrator'
  | 'database'
  | 'vector_db'
  | 'queue'
  | 'ai'
  | 'security'
  | 'storage'
  | 'external'
  | 'action'
  | 'decision'
  | 'trigger'
  | 'output'
  | 'custom';

export interface BlueprintNode {
  id: string;
  label: string; // Tên ngắn gọn (1-4 từ) cho khối chức năng/hành động
  shortRole?: string; // Vai trò tóm lược cực ngắn (vd: "Tiếp Nhận", "Phân Tích", "Lưu Trữ")
  type?: BlueprintNodeType | string;
  tier?: string; // e.g. "Bước 1: Kích Hoạt", "Tầng 1: Client & Ingress", "Bước 2: Xử Lý Lõi"
  stepNumber?: number; // Số thứ tự bước trong workflow
  description?: string; // Mô tả chi tiết chức năng (hiển thị ở bảng chú giải bên dưới)
  techStack?: string; // e.g. "React 19", "Gemini 3.7", "PostgreSQL", "Kafka"
  icon?: string; // Lucide icon name
  status?: 'active' | 'standby' | 'external' | 'primary';
  actionType?: 'trigger' | 'process' | 'decision' | 'transform' | 'store' | 'output' | 'agent';
}

export interface BlueprintConnection {
  id?: string;
  from: string; // source node ID
  to: string; // target node ID
  label?: string; // Tên luồng/dữ liệu ngắn gọn (e.g. "HTTPS", "Token Stream", "Đạt chuẩn", "Rẽ nhánh")
  type?: 'solid' | 'dashed' | 'bidirectional';
  protocol?: string; // e.g. "REST / JSON", "gRPC", "EventBus", "Vector Query", "State Transfer"
  payload?: string; // Chi tiết dữ liệu truyền tải
  description?: string; // Mục đích của luồng liên kết
}

export interface BlueprintGroup {
  id: string;
  title: string;
  nodeIds: string[];
  color?: string;
  description?: string;
}

export interface BlueprintDiagramData {
  title: string;
  subtitle?: string;
  category?: 'workflow' | 'multi_agent' | 'layered' | 'pipeline' | 'decision_tree' | 'closed_loop' | 'microservices' | string;
  layout?: 'workflow_horizontal' | 'workflow_vertical' | 'layered' | 'pipeline' | 'circular' | 'grid';
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  groups?: BlueprintGroup[];
  asciiFlow?: string; // ASCII Flow adhering to AGENTS.md rule 6
  mermaidCode?: string; // Optional mermaid code
  notes?: string[];
  rawSource?: string;
}

export interface ConceptRenderData {
  imageUrl: string;
  prompt: string;
  refinedPrompt?: string;
  caption?: string;
  spatialZoning?: Array<{
    zone: string;
    function: string;
    flowRate?: string;
  }>;
  materialPalette?: string[];
  climateLighting?: string;
  designPhilosophy?: string;
  style?: string;
  viewAngle?: string;
  aspectRatio?: string;
}

export type AtomicUnitType =
  | 'paragraph'
  | 'bullet'
  | 'quote'
  | 'code'
  | 'callout'
  | 'table'
  | 'term_definition'
  | 'heading_section'
  | 'heading_subsection'
  | 'blueprint_diagram'
  | 'concept_render';

export interface AtomicContentUnit {
  id: string;
  type: AtomicUnitType;
  level?: number;
  title?: string;
  content: string;
  rawMarkdown?: string;
  author?: string;
  work?: string;
  eraOrYear?: string;
  language?: string;
  translationVi?: string;
  interpretation?: string;
  bulletIndex?: number;
  highlightedTerms?: string[];
  keyTakeaway?: string;
  blueprintData?: BlueprintDiagramData;
  conceptRenderData?: ConceptRenderData;
  metadata?: Record<string, any>;
}

export interface AtomicSubsection {
  id: string;
  title: string;
  subNumber: string;
  units: AtomicContentUnit[];
}

export interface AtomicSection {
  id: string;
  title: string;
  secNumber: string;
  tierCategory?: string;
  subsections: AtomicSubsection[];
  units?: AtomicContentUnit[];
}

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  contentMarkdown?: string;
  status?: 'pending' | 'generating' | 'completed';
  extractedTerms?: LexiconTerm[];
  quotes?: ClassicalQuote[];
  atomicSections?: AtomicSection[];
}

export interface DynamicPillar {
  id: string;
  conceptualType: 'concept' | 'deep_dive' | 'context' | 'application' | 'internal_dialogue' | 'synthesis';
  title: string;
  description: string;
  chapters: Chapter[];
}

export interface DossierNotebookPrompt {
  id: string;
  title: string;
  conceptIdea: string;
  outputFormat: 'audio_deep_dive' | 'study_guide' | 'briefing_doc' | 'faq_concept_map' | 'dialectical_matrix' | 'multi_agent_spec' | 'custom';
  generatedPrompt: string;
  recommendedSourcesGuide: string;
  targetDossierTitle: string;
  createdAt: string;
  updatedAt?: string;
}

// Representation of a structured Research Dossier
export interface Dossier {
  id: string;
  pillarId: string;
  pillarTitle: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  topic?: string;
  discipline: string;
  interdisciplinaryFields?: string[];
  depthLevel?: 'foundational' | 'advanced' | 'dissertation' | 'grand_synthesis';
  tags: string[];
  abstract: string;
  contentMarkdown: string;
  keyFindings: string[];
  philosophicalBasis: PhilosophicalBasis[];
  technicalMappings: PhilosophicalMapping[];
  classicalQuotes?: ClassicalQuote[];
  citations: CitationItem[];
  autoCapturedTerms?: LexiconTerm[];
  lastModified: string;
  status: 'draft' | 'reviewed' | 'published';
  author?: string;
  ownerId?: string;
  isPublic?: boolean;
  
  // Fields for the dynamic project structure
  isDynamicProject?: boolean;
  mode?: 'quick' | 'deep' | 'advanced';
  westernPhilosophy?: boolean;
  easternPhilosophy?: boolean;
  projectStructure?: DynamicPillar[];
  notebookLMExportPrompt?: string;
  notebookPrompts?: DossierNotebookPrompt[];
}

export interface LexiconTerm {
  id: string;
  term: string;
  enTerm: string;
  category: 'Triết học Đông phương' | 'Triết học Tây phương' | 'Kiến trúc Hệ thống' | 'Agentic AI' | 'An ninh & Độ tin cậy' | 'Liên Ngành Đột Phá';
  philosophicalOrigin: string;
  csEquivalent: string;
  deepExplanation: string;
  applicationInAgents: string;
  tags: string[];
  sourceDiscipline?: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Synthesis' | 'Comparative Matrix' | 'NotebookLM Audio Prep' | 'Dialectical Inquiry' | 'Deep Research' | 'Knowledge Transforming';
  description: string;
  systemInstruction: string;
  userPromptTemplate: string;
  recommendedModel: string;
}

export interface GeminiSettings {
  model: string;
  enableSearchGrounding: boolean;
  temperature: number;
  topP: number;
  systemInstruction: string;
}

export interface ConceptChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO 8601 string recording exact date and time
}

export interface ConceptChatSession {
  id: string;
  title: string;
  initialTopic?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'synthesized' | 'converted_to_dossier' | 'archived';
  associatedDossierId?: string | null;
  messages: ConceptChatMessage[];
  synthesis?: {
    decodedEssence: string;
    recommendedScenario: string;
    scenarioRationale: string;
    proposedTitle: string;
    proposedSubtitle: string;
    proposedAbstract: string;
    detectedDomain: string;
    interdisciplinaryFields: string[];
    pillars: DynamicPillar[];
  } | null;
  selectedScenario?: string;
  summaryNote?: string;
}

export interface ProjectActionScenario {
  id: string;
  key: 'sop_workflows' | 'executive_report' | 'internal_team_comm' | 'public_community_comm' | 'market_research' | 'consumer_psychology' | string;
  title: string;
  shortDesc: string;
  targetAudience: string;
  iconName: string;
  contentMarkdown: string;
  actionItems?: string[];
  status?: 'ready' | 'generating' | 'customized';
}

export interface ProjectAnalysisResult {
  projectTitle: string;
  projectSubtitle: string;
  projectDomain: string;
  feasibilityScore: number;
  executiveDiagnosis: string;
  coreStrengths: string[];
  failureModesAndRisks: string[];
  strategicImperatives: string[];
  missingElements: string[];
  scenarios: ProjectActionScenario[];
  pillarsForDossier?: DynamicPillar[];
  extractedTerms?: LexiconTerm[];
  detectedTimeline?: string;
  estimatedBudgetScope?: string;
  targetPersonas?: string[];
}
