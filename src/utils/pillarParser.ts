import { DynamicPillar, Chapter, Dossier } from '../types';

export const DYNAMIC_PILLAR_DEFAULTS = [
  {
    id: 'pillar-1',
    roman: 'I',
    concept: 'Bản Thể',
    conceptualType: 'concept' as const,
    defaultTitle: 'Trụ cột I: Khảo Luận Bản Thể & Ý Niệm Khởi Nguyên',
    description: 'Ý niệm nguyên thủy, nền tảng lý thuyết và bản chất định hình hệ thống.'
  },
  {
    id: 'pillar-2',
    roman: 'II',
    concept: 'Cơ Chế',
    conceptualType: 'context' as const,
    defaultTitle: 'Trụ cột II: Quy Luật Vận Hành & Động Lực Nội Tại',
    description: 'Các quy luật vận hành, động lực học và cấu trúc cơ học điều phối hệ thống.'
  },
  {
    id: 'pillar-3',
    roman: 'III',
    concept: 'Kiến Trúc',
    conceptualType: 'application' as const,
    defaultTitle: 'Trụ cột III: Kiến Trúc Thực Tiễn & Kỹ Nghệ Hệ Thống',
    description: 'Hiện thực hóa lý thuyết thành sơ đồ kiến trúc, mã nguồn và mẫu thiết kế phần mềm.'
  },
  {
    id: 'pillar-4',
    roman: 'IV',
    concept: 'Biện Chứng',
    conceptualType: 'deep_dive' as const,
    defaultTitle: 'Trụ cột IV: Biện Chứng Phản Biện & Phân Tích Mâu Thuẫn',
    description: 'Xung đột lịch sử, các điểm nghẽn kĩ thuật, failure modes và góc nhìn đa chiều.'
  },
  {
    id: 'pillar-5',
    roman: 'V',
    concept: 'Tĩnh Tâm',
    conceptualType: 'internal_dialogue' as const,
    defaultTitle: 'Trụ cột V: Tĩnh Tâm - Cân Bằng Khắc Kỷ (Shinbashira)',
    description: 'Khoảng lặng đạo đức (Shinbashira), nguyên lý khắc kỷ và cơ chế tự phục hồi.'
  },
  {
    id: 'pillar-6',
    roman: 'VI',
    concept: 'Đất Trời',
    conceptualType: 'synthesis' as const,
    defaultTitle: 'Trụ cột VI: Hòa Hợp Tự Nhiên & Hệ Sinh Thái Vô Vi',
    description: 'Khả năng vươn ra hệ sinh thái tự nhiên, kết nối đa tác tử và phát triển bền vững.'
  }
];

export function createDefaultPillars(topicTitle: string = 'Khảo luận Chuyên đề'): DynamicPillar[] {
  return DYNAMIC_PILLAR_DEFAULTS.map((def, pIdx) => {
    const pNum = pIdx + 1;
    return {
      id: def.id,
      conceptualType: def.conceptualType,
      title: def.defaultTitle,
      description: def.description,
      chapters: [
        {
          id: `ch-${pNum}-1`,
          title: formatChapterTitle(pIdx, 0, ''),
          contentMarkdown: '',
          status: 'pending'
        },
        {
          id: `ch-${pNum}-2`,
          title: formatChapterTitle(pIdx, 1, ''),
          contentMarkdown: '',
          status: 'pending'
        }
      ]
    };
  });
}

/**
 * Ensures that a pillar has structured chapters with consistent chapter numbering and topic-tailored titles.
 */
export function formatChapterTitle(pillarIndex: number, chapterIndex: number, rawTitle: string): string {
  const pNum = pillarIndex + 1;
  const cNum = chapterIndex + 1;
  let cleanTitle = (rawTitle || '').trim();

  // If rawTitle is a generic pillar title or empty, supply a tailored title
  if (!cleanTitle || cleanTitle.toLowerCase().startsWith('trụ cột') || cleanTitle.toLowerCase().includes('ontological genesis')) {
    const defaultThemes: Record<number, string[]> = {
      0: ['Khởi Nguyên Ý Niệm & Tái Định Nghĩa Bản Chất', 'Không Gian Tiềm Ẩn & Mô Hình Hóa Giá Trị Cốt Lõi', 'Bản Thể Luận & Nền Tảng Lý Thuyết Gốc', 'Định Hình Khung Khái Niệm Thực Thể'],
      1: ['Quy Luật Vận Động Nội Tại & Dòng Chảy Tài Nguyên', 'Động Lực Học Tương Tác & Cơ Chế Điều Phối', 'Cấu Trúc Động Lực Vận Hành Thực Tiễn', 'Mô Hình Hóa Dòng Thông Tin & Năng Lượng'],
      2: ['Thiết Kế Bản Vẽ Kiến Trúc & Giải Pháp Kỹ Nghệ', 'Ánh Xạ Hệ Phân Tán & Tối Ưu Hóa Multi-Agent', 'Kiến Trúc Triển Khai Thực Chiến & Tích Hợp', 'Giao Thức Tương Tác & Tiêu Chuẩn Thực Thi'],
      3: ['Điểm Nghẽn Thực Tiễn, Nghịch Lý & Bẫy Rủi Ro', 'Cơ Chế Khắc Phục Lỗi (Failure Modes) & Phòng Ngừa', 'Phản Biện Đa Chiều & Phân Tích Mâu Thuẫn', 'Quản Trị Rủi Ro & Chiến Lược Vượt Điểm Nghẽn'],
      4: ['Điểm Tựa Đạo Đức & Trục Cân Bằng Liêm Chính', 'Năng Lực Khắc Kỷ, Tự Phục Hồi & Thích Ứng Biến Động', 'Văn Hóa Quản Trị Bền Vững (Shinbashira)', 'Cân Bằng Nội Tại & Nguyên Tắc Tự Chủ'],
      5: ['Vươn Ra Hệ Sinh Thái & Nguyên Lý Hòa Hợp Tự Nhiên', 'Cộng Sinh Đa Chiều & Mô Hình Phát Triển Bền Vững', 'Đại Hòa Sinh Thái & Chiến Lược Trường Tồn', 'Tích Hợp Toàn Diện & Tương Lai Bền Vững']
    };
    const pool = defaultThemes[pillarIndex] || defaultThemes[0];
    cleanTitle = pool[chapterIndex % pool.length] || `Khảo Luận Chuyên Sâu Mục #${cNum}`;
  }

  // Strip leading prefixes like "Chương 1:", "Chương 1.1:", "Chương 1.1 -", "1.1.", "Mục 1:"
  cleanTitle = cleanTitle.replace(/^Chương\s*\d+(\.\d+)?\s*[:\-\.]?\s*/i, '');
  cleanTitle = cleanTitle.replace(/^\d+\.\d+\s*[:\-\.]?\s*/i, '');
  cleanTitle = cleanTitle.replace(/^Mục\s*#?\d+\s*[:\-\.]?\s*/i, '');
  cleanTitle = cleanTitle.trim();

  return `Chương ${pNum}.${cNum}: ${cleanTitle}`;
}

export function normalizePillarChapters(pillarIndex: number, pillarTitle: string, rawChapters: Chapter[], topicTitle: string): Chapter[] {
  const pNum = pillarIndex + 1;

  if (rawChapters && rawChapters.length > 0) {
    return rawChapters.map((ch, idx) => {
      const cNum = idx + 1;
      const formattedTitle = formatChapterTitle(pillarIndex, idx, ch.title);
      return {
        ...ch,
        id: ch.id || `ch-${pNum}-${cNum}`,
        title: formattedTitle
      };
    });
  }

  return [
    {
      id: `ch-${pNum}-1`,
      title: formatChapterTitle(pillarIndex, 0, ''),
      contentMarkdown: '',
      status: 'pending'
    },
    {
      id: `ch-${pNum}-2`,
      title: formatChapterTitle(pillarIndex, 1, ''),
      contentMarkdown: '',
      status: 'pending'
    }
  ];
}

/**
 * Parses raw Markdown text into a structured 6-Pillar architecture (`DynamicPillar[]`).
 * If explicit Pillar headers exist (e.g. `# Trụ cột I...` or `## Trụ cột...`), it extracts them directly.
 * Otherwise, it intelligently splits headings/sections into the 6 Dynamic Pillars.
 */
export function parseMarkdownToPillars(markdown: string, topicTitle: string = 'Nghiên cứu Liên Ngành'): DynamicPillar[] {
  if (!markdown || typeof markdown !== 'string') {
    return createDefaultPillars(topicTitle);
  }

  // Regex to look for explicit Trụ cột headings (e.g. "# Trụ cột I: ..." or "## Trụ cột II ...")
  const pillarHeaderRegex = /(?:^|\n)(#{1,3})\s*(Trụ\s*cột\s*([I|V|X]+)\s*:?\s*[^\n]+)/gi;
  const matches = Array.from(markdown.matchAll(pillarHeaderRegex));

  if (matches.length >= 2) {
    const pillars: DynamicPillar[] = [];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      const pillarTitle = match[2].trim();
      
      const startIndex = match.index! + match[0].length;
      const endIndex = nextMatch ? nextMatch.index! : markdown.length;
      const pillarContent = markdown.slice(startIndex, endIndex).trim();

      // Split pillar content into chapters by subheadings (## or ###)
      const chapterRegex = /(?:^|\n)(#{2,3})\s*([^\n]+)/g;
      const chapterMatches = Array.from(pillarContent.matchAll(chapterRegex));

      const rawChapters: Chapter[] = [];
      if (chapterMatches.length > 0) {
        for (let c = 0; c < chapterMatches.length; c++) {
          const cMatch = chapterMatches[c];
          const cNextMatch = chapterMatches[c + 1];
          const cTitle = cMatch[2].trim();
          const cStart = cMatch.index! + cMatch[0].length;
          const cEnd = cNextMatch ? cNextMatch.index! : pillarContent.length;
          const cMarkdown = pillarContent.slice(cStart, cEnd).trim();

          rawChapters.push({
            id: `pillar-${i + 1}-ch-${c + 1}`,
            title: cTitle,
            contentMarkdown: cMarkdown,
            status: 'completed'
          });
        }
      } else {
        rawChapters.push({
          id: `pillar-${i + 1}-ch-1`,
          title: `Chương ${i + 1}.1: Khảo luận Tổng quan ${pillarTitle}`,
          contentMarkdown: pillarContent,
          status: 'completed'
        });
      }

      pillars.push({
        id: `pillar-${i + 1}`,
        conceptualType: i === 0 ? 'concept' : i === 1 ? 'context' : i === 2 ? 'application' : i === 3 ? 'deep_dive' : 'internal_dialogue',
        title: pillarTitle,
        description: `Nội dung khảo cứu chuyên sâu thuộc ${pillarTitle}`,
        chapters: normalizePillarChapters(i, pillarTitle, rawChapters, topicTitle)
      });
    }

    return pillars;
  }

  // Fallback: Split markdown by headings (## or ###) and map sequentially into the 6 Dynamic Pillars
  const headingRegex = /(?:^|\n)(#{1,3})\s*([^\n]+)/g;
  const sections = Array.from(markdown.matchAll(headingRegex));

  const dynamicBasePillars = createDefaultPillars(topicTitle);
  const pillarBuckets: Array<{ title: string; desc: string; chapters: Chapter[] }> = dynamicBasePillars.map(p => ({
    title: p.title,
    desc: p.description,
    chapters: []
  }));

  if (sections.length > 0) {
    for (let s = 0; s < sections.length; s++) {
      const sec = sections[s];
      const nextSec = sections[s + 1];
      const secTitle = sec[2].trim();
      const startIdx = sec.index! + sec[0].length;
      const endIdx = nextSec ? nextSec.index! : markdown.length;
      const secContent = markdown.slice(startIdx, endIdx).trim();

      const pillarIndex = Math.min(Math.floor((s / sections.length) * 6), 5);
      
      pillarBuckets[pillarIndex].chapters.push({
        id: `sec-${s + 1}`,
        title: secTitle,
        contentMarkdown: secContent,
        status: 'completed'
      });
    }
  } else {
    pillarBuckets[0].chapters.push({
      id: 'sec-1',
      title: `Chương 1.1: Khảo luận Tổng quan ${topicTitle}`,
      contentMarkdown: markdown,
      status: 'completed'
    });
  }

  return pillarBuckets.map((bucket, idx) => {
    const def = dynamicBasePillars[idx];
    return {
      id: def.id,
      conceptualType: def.conceptualType,
      title: bucket.title,
      description: bucket.desc,
      chapters: normalizePillarChapters(idx, bucket.title, bucket.chapters, topicTitle)
    };
  });
}

/**
 * Ensures a dossier object has a populated 6-Pillar structure (`projectStructure`).
 */
export function ensureDossierPillarStructure(dossier: Dossier): Dossier {
  if (Array.isArray(dossier.projectStructure) && dossier.projectStructure.length >= 6) {
    return dossier;
  }

  const projectStructure = parseMarkdownToPillars(dossier.contentMarkdown, dossier.title);
  return {
    ...dossier,
    isDynamicProject: true,
    projectStructure
  };
}
