import interdisciplinaryData from './interdisciplinaryDisciplines.json';

export interface DisciplineGroup {
  id: string;
  name: string;
  enName: string;
  icon: string;
  color: string;
  border: string;
  badgeBg: string;
  description: string;
}

export interface DisciplineMetadata {
  id: string;
  groupId?: string;
  groupName?: string;
  name: string;
  enName: string;
  icon: string;
  color: string;
  bgLight: string;
  bgDark: string;
  description: string;
  coreLenses: string[];
  keyFigures: string[];
  systemAnalogy: string;
  methodology?: string;
  isCustom?: boolean;
}

export const DISCIPLINE_GROUPS: DisciplineGroup[] = (interdisciplinaryData.disciplineGroups || []) as DisciplineGroup[];

export const INTERDISCIPLINARY_DISCIPLINES: DisciplineMetadata[] = interdisciplinaryData.disciplines as DisciplineMetadata[];

export const DEFAULT_CHAPTER_STRUCTURE_SECTIONS = interdisciplinaryData.defaultChapterStructureSections;

export const RESEARCH_DEPTH_LEVELS = interdisciplinaryData.researchDepthLevels;

/**
 * Intelligent Semantic Classifier:
 * Automatically classifies any discipline (newly added or custom) into the best-matching academic group
 */
export function classifyDisciplineIntoGroup(discipline: Partial<DisciplineMetadata>): {
  groupId: string;
  groupName: string;
  confidence: number;
  matchedKeywords: string[];
} {
  // If groupId is already valid and exists in DISCIPLINE_GROUPS, return it
  if (discipline.groupId) {
    const existingGroup = DISCIPLINE_GROUPS.find(g => g.id === discipline.groupId);
    if (existingGroup) {
      return {
        groupId: existingGroup.id,
        groupName: existingGroup.name,
        confidence: 1.0,
        matchedKeywords: ['manual_selection']
      };
    }
  }

  const corpus = [
    discipline.name || '',
    discipline.enName || '',
    discipline.description || '',
    discipline.systemAnalogy || '',
    discipline.methodology || '',
    ...(discipline.coreLenses || []),
    ...(discipline.keyFigures || [])
  ].join(' ').toLowerCase();

  const groupKeywords: Record<string, string[]> = {
    epistemology_philosophy: [
      'triết học', 'bản thể', 'nhận thức luận', 'khắc kỷ', 'đạo đức', 'hiện tượng học', 'diễn giải',
      'lịch sử', 'văn hóa', 'nghệ thuật', 'mỹ học', 'ký hiệu', 'logic', 'siêu hình', 'ngôn ngữ',
      'cú pháp', 'ngữ nghĩa', 'tiên đề', 'khởi nguyên', 'philosophy', 'ontology', 'epistemology',
      'ethics', 'stoic', 'history', 'culture', 'semiotics', 'linguistics', 'hermeneutics', 'phenomenology'
    ],
    institutions_economics: [
      'kinh tế', 'thể chế', 'quản trị', 'chính trị', 'luật học', 'pháp lý', 'xã hội', 'nhân chủng',
      'văn minh', 'trò chơi', 'game theory', 'coase', 'ostrom', 'kinh tế học', 'tuần hoàn', 'quyền lực',
      'phân quyền', 'economics', 'governance', 'policy', 'law', 'sociology', 'anthropology', 'market',
      'incentive', 'institutional', 'circular economy', 'public choice', 'jurisprudence'
    ],
    cognition_behavior: [
      'tâm lý', 'não bộ', 'thần kinh', 'nhận thức', 'hành vi', 'tiến hóa', 'phân tâm', 'vô thức',
      'đám đông', 'trí tuệ tập thể', 'chú ý', 'trí nhớ', 'cảm xúc', 'cognitive', 'neuroscience',
      'psychology', 'behavioral', 'brain', 'bias', 'memory', 'perception', 'consciousness', 'psychoanalysis'
    ],
    math_physics_systems: [
      'vật lý', 'toán học', 'năng lượng', 'nhiệt động lực', 'entropy', 'phức tạp', 'hỗn loạn',
      'đồ thị', 'rời rạc', 'điều khiển học', 'sinh học tính toán', 'sinh thái', 'tính trồi', 'physics',
      'mathematics', 'energy', 'thermodynamics', 'complex systems', 'chaos', 'graph', 'cybernetics',
      'computational biology', 'ecology', 'emergence', 'feedback loop'
    ],
    cs_ai_data: [
      'máy tính', 'ai', 'trí tuệ nhân tạo', 'tác tử', 'agent', 'phần mềm', 'phân tán', 'mật mã',
      'blockchain', 'sổ cái', 'llm', 'prompt', 'dữ liệu', 'đám mây', 'hạ tầng', 'thuật toán',
      'computer science', 'distributed', 'code', 'model', 'algorithm', 'vector', 'cloud', 'architecture',
      'security', 'rag', 'knowledge graph', 'microservices'
    ]
  };

  let bestGroupId = 'emerging_frontier';
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const [groupId, keywords] of Object.entries(groupKeywords)) {
    let score = 0;
    const matched: string[] = [];

    for (const kw of keywords) {
      if (corpus.includes(kw.toLowerCase())) {
        score += kw.length > 5 ? 2 : 1;
        matched.push(kw);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestGroupId = groupId;
      bestMatched = matched;
    }
  }

  const foundGroup = DISCIPLINE_GROUPS.find(g => g.id === bestGroupId) || DISCIPLINE_GROUPS[0];
  const confidence = bestScore > 0 ? Math.min(1, bestScore / 10) : 0.5;

  return {
    groupId: foundGroup.id,
    groupName: foundGroup.name,
    confidence,
    matchedKeywords: bestMatched
  };
}
