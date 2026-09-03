import { Dossier, DynamicPillar, Chapter, LexiconTerm, CitationItem, ConceptChatSession, ConceptChatMessage } from '../types';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_FOLDER_NAME = 'OG_Research_Lab';

// Interface for Drive Token
export interface DriveAuthConfig {
  accessToken: string;
  expiresAt: number;
  userEmail?: string;
}

// Key for storage
const STORAGE_KEY_TOKEN = 'og_drive_access_token';
const STORAGE_KEY_EXPIRES = 'og_drive_token_expires';

export function getStoredDriveToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiresStr = localStorage.getItem(STORAGE_KEY_EXPIRES);
    if (!token || !expiresStr) return null;
    const expiresAt = parseInt(expiresStr, 10);
    if (Date.now() >= expiresAt) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_EXPIRES);
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
}

export function saveDriveToken(accessToken: string, expiresInSeconds: number = 3600) {
  try {
    const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
    localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
  } catch (e) {
    console.error('Failed to save Drive token:', e);
  }
}

export function clearDriveToken() {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRES);
  } catch (e) {}
}

/**
 * Load Google Identity Services GSI script dynamically if not present
 */
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Khổng thể tải Google Identity Services script.'));
    document.head.appendChild(script);
  });
}

/**
 * Request Google OAuth Access Token with drive.file scope using Firebase Auth or GIS
 */
export async function requestGoogleDriveToken(): Promise<string> {
  // First attempt: Firebase Auth signInWithPopup with GoogleAuthProvider & Drive scopes
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/drive');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      saveDriveToken(credential.accessToken, 3600);
      return credential.accessToken;
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase signInWithPopup did not return Drive accessToken, falling back to GIS:', firebaseErr);
  }

  // Second attempt: GIS initTokenClient with valid oAuthClientId
  await loadGsiScript();

  const clientId = (firebaseAppletConfig as any).oAuthClientId || '934403051170-oucdrhpgtci7pfhudgke8ta3dvc9v1mh.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            saveDriveToken(response.access_token, response.expires_in || 3600);
            resolve(response.access_token);
          } else {
            reject(new Error('Không nhận được access_token từ Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Strips out unwritten outline sections (e.g. "## Cấu Trúc Khung Đề Cương ...")
 * and placeholder lines/sections like "*(Chờ viết bài)*" or boilerplate "## IV. ĐIỂM SÁNG NÒNG CỐT"
 * to keep Markdown files clean & lean.
 */
export function stripUnwrittenOutline(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove "## Cấu Trúc Khung Đề Cương..." block through end of block or next major heading
  cleaned = cleaned.replace(/---\s*\n+##\s+Cấu Trúc Khung Đề Cương[\s\S]*?(?=\n##\s+[IVX]+\.|\n#\s+|$)/gi, '');
  cleaned = cleaned.replace(/##\s+Cấu Trúc Khung Đề Cương[\s\S]*?(?=\n##\s+[IVX]+\.|\n#\s+|$)/gi, '');

  // Strip boilerplate/placeholder "## IV. ĐIỂM SÁNG NÒNG CỐT" blocks (containing placeholder texts)
  cleaned = cleaned.replace(/##\s+IV\.\s+ĐIỂM SÁNG NÒNG CỐT[\s\S]*?(?=\n##\s+[IVX]+\.|\n#\s+|$)/gi, (match) => {
    if (
      /thiết lập khung cấu trúc/i.test(match) ||
      /sẵn sàng được biên soạn/i.test(match) ||
      /chờ viết bài/i.test(match)
    ) {
      return '';
    }
    return match;
  });

  // Filter out individual lines that contain "(Chờ viết bài)"
  cleaned = cleaned
    .split('\n')
    .filter(line => !/\*?\s*\(Chờ viết bài.*?\)\s*\*?/i.test(line))
    .join('\n');

  // Collapse multiple empty line breaks and trim
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

/**
 * Deduplicates repeated paragraph blocks in a text string.
 */
export function deduplicateParagraphs(text: string): string {
  if (!text) return '';
  const blocks = text.split(/\n{2,}/);
  const seen = new Set<string>();
  const uniqueBlocks: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    // Normalize string for fuzzy/exact duplicate checking (ignore case, whitespace, markdown headers)
    const normalized = trimmed
      .toLowerCase()
      .replace(/[#*_\-\s]+/g, ' ')
      .trim();

    // If block is substantial (> 20 chars) and already seen, skip duplicate
    if (normalized.length > 20 && seen.has(normalized)) {
      continue;
    }

    if (normalized.length > 20) {
      seen.add(normalized);
    }
    uniqueBlocks.push(trimmed);
  }

  return uniqueBlocks.join('\n\n');
}

/**
 * Extracts pure main content body (Section III), stripping out duplicated titles,
 * abstracts, or structural headers if present in raw contentMarkdown.
 */
export function cleanSectionContent(rawText: string, existingChapterTexts: string[] = []): string {
  if (!rawText) return '';
  let text = stripUnwrittenOutline(rawText);

  // If text contains section III header, extract that section's body
  const section3Match = text.match(/##\s+III\.\s+NỘI DUNG CHUYỂN HÓA TRI THỨC[\s\S]*?\n\n([\s\S]*?)(?=\n##\s+[IVX]+\.|$)/i);
  if (section3Match && section3Match[1].trim().length > 0) {
    text = section3Match[1].trim();
  } else {
    // Strip duplicated section I, II, IV, V, VI, VII headers if present
    text = text.replace(/^#\s+.*$/gm, '');
    text = text.replace(/^>\s*\*.*\*$/gm, '');
    text = text.replace(/##\s+I\.\s+TÓM TẮT KHẢO LUẬN[\s\S]*?(?=\n##\s+|$)/gi, '');
    text = text.replace(/##\s+II\.\s+BẢN GIAO ƯỚC[\s\S]*?(?=\n##\s+|$)/gi, '');
  }

  // Always strip out section IV, V, VI, VII headers if accidentally embedded
  text = text.replace(/##\s+IV\.\s+ĐIỂM SÁNG NÒNG CỐT[\s\S]*?(?=\n##\s+|$)/gi, '');
  text = text.replace(/##\s+V\.\s+ÁNH XẠ[\s\S]*?(?=\n##\s+|$)/gi, '');
  text = text.replace(/##\s+VI\.\s+TRÍCH DẪN[\s\S]*?(?=\n##\s+|$)/gi, '');
  text = text.replace(/##\s+VII\.\s+DANH MỤC[\s\S]*?(?=\n##\s+|$)/gi, '');

  // Deduplicate against existing chapter texts if provided
  if (existingChapterTexts.length > 0) {
    const chapterSet = new Set(existingChapterTexts.map(t => t.toLowerCase().replace(/[#*_\-\s]+/g, ' ').trim()));
    const blocks = text.split(/\n{2,}/);
    const filtered = blocks.filter(b => {
      const norm = b.toLowerCase().replace(/[#*_\-\s]+/g, ' ').trim();
      return norm.length <= 20 || !chapterSet.has(norm);
    });
    text = filtered.join('\n\n');
  }

  return deduplicateParagraphs(text.replace(/\n{3,}/g, '\n\n')).trim();
}

/**
 * Convert a Dossier object into structured Markdown (.md) with Frontmatter YAML
 */
export function dossierToMarkdown(dossier: Dossier): string {
  const frontmatter = [
    '---',
    `id: "${dossier.id || ''}"`,
    `title: "${(dossier.title || '').replace(/"/g, '\\"')}"`,
    `subtitle: "${(dossier.subtitle || '').replace(/"/g, '\\"')}"`,
    `chapterNumber: ${dossier.chapterNumber || 1}`,
    `topic: "${(dossier.topic || '').replace(/"/g, '\\"')}"`,
    `discipline: "${(dossier.discipline || '').replace(/"/g, '\\"')}"`,
    `depthLevel: "${dossier.depthLevel || 'advanced'}"`,
    `status: "${dossier.status || 'published'}"`,
    `lastModified: "${dossier.lastModified || new Date().toISOString()}"`,
    `tags: [${(dossier.tags || []).map(t => `"${t}"`).join(', ')}]`,
    '---',
    ''
  ].join('\n');

  let body = `# ${dossier.title}\n\n`;
  if (dossier.subtitle) {
    body += `> *${dossier.subtitle}*\n\n`;
  }

  body += `## I. TÓM TẮT KHẢO LUẬN (ABSTRACT)\n\n${dossier.abstract || 'Chưa có tóm tắt.'}\n\n`;

  // Render 6 Dynamic Pillars (ONLY written chapters with actual content)
  const existingChapterTexts: string[] = [];
  if (dossier.projectStructure && dossier.projectStructure.length > 0) {
    const writtenPillars = dossier.projectStructure.filter(pillar => {
      return pillar.chapters && pillar.chapters.some(chap => {
        const c = stripUnwrittenOutline(chap.contentMarkdown || '');
        return c.length > 0;
      });
    });

    if (writtenPillars.length > 0) {
      body += `## II. BẢN GIAO ƯỚC 6 TRỤ CỘT ĐỘNG (DYNAMIC 6 PILLARS)\n\n`;
      writtenPillars.forEach((pillar: DynamicPillar, idx: number) => {
        body += `### Trụ cột ${idx + 1}: ${pillar.title}\n`;
        if (pillar.description) body += `*Mô tả*: ${pillar.description}\n\n`;

        if (pillar.chapters && pillar.chapters.length > 0) {
          pillar.chapters.forEach((chap: Chapter) => {
            const content = stripUnwrittenOutline(chap.contentMarkdown || '');
            if (content.length > 0) {
              existingChapterTexts.push(content);
              body += `#### Chapter: ${chap.title}\n`;
              if (chap.subtitle) body += `*${chap.subtitle}*\n\n`;
              body += `${deduplicateParagraphs(content)}\n\n`;
            }
          });
        }
      });
    }
  }

  // Render main contentMarkdown (Sanitized - no duplicated section I/II/headers/chapters)
  const cleanMainContent = cleanSectionContent(dossier.contentMarkdown || '', existingChapterTexts);
  if (cleanMainContent) {
    body += `## III. NỘI DUNG CHUYỂN HÓA TRI THỨC (MAIN CONTENT)\n\n${cleanMainContent}\n\n`;
  }

  // Filter Key Findings (excluding placeholder outline text)
  const realKeyFindings = (dossier.keyFindings || []).filter(kf => {
    return (
      kf &&
      !/thiết lập khung cấu trúc/i.test(kf) &&
      !/sẵn sàng được biên soạn độc lập/i.test(kf) &&
      !/chờ viết bài/i.test(kf)
    );
  });

  if (realKeyFindings.length > 0) {
    body += `## IV. ĐIỂM SÁNG NÒNG CỐT (KEY FINDINGS)\n\n`;
    realKeyFindings.forEach(kf => {
      body += `- ${kf}\n`;
    });
    body += `\n`;
  }

  // Philosophical Mappings
  if (dossier.technicalMappings && dossier.technicalMappings.length > 0) {
    body += `## V. ÁNH XẠ TRIẾT HỌC & KHOA HỌC MÁY TÍNH (MAPPINGS)\n\n`;
    dossier.technicalMappings.forEach(m => {
      body += `### Concept: ${m.classicalConcept} ↔ ${m.computerSciencePattern}\n`;
      body += `- **Lý do ánh xạ**: ${m.rationale}\n`;
      body += `- **Rủi ro triệt tiêu**: ${m.failureModeAvoided}\n\n`;
    });
  }

  // Classical Quotes
  if (dossier.classicalQuotes && dossier.classicalQuotes.length > 0) {
    body += `## VI. TRÍCH DẪN TRUYỀN THỐNG KINHD IỂN (CLASSICAL QUOTES)\n\n`;
    dossier.classicalQuotes.forEach(q => {
      body += `> "${q.quote}"\n> — **${q.author}**, *${q.work}* (${q.eraOrYear || 'N/A'})\n`;
      if (q.interpretation) body += `> *Diễn giải*: ${q.interpretation}\n\n`;
    });
  }

  // Academic Citations
  if (dossier.citations && dossier.citations.length > 0) {
    body += `## VII. DANH MỤC THAM KHẢO HỌC THUẬT (ACADEMIC CITATIONS)\n\n`;
    dossier.citations.forEach(c => {
      body += `- **${c.title}** (${c.year}) - ${c.author}. *${c.source}* [${c.category}]\n`;
      if (c.doiOrUrl) body += `  - Link: ${c.doiOrUrl}\n`;
      if (c.keyQuote) body += `  - Quote: "${c.keyQuote}"\n`;
    });
  }

  return frontmatter + body.trim() + '\n';
}

/**
 * Parse Markdown (.md) with Frontmatter back to Partial<Dossier>
 */
export function markdownToDossier(mdContent: string): Partial<Dossier> {
  const frontmatterMatch = mdContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  const metadata: Record<string, any> = {};

  if (frontmatterMatch) {
    const yamlLines = frontmatterMatch[1].split('\n');
    yamlLines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        // Unquote string
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Handle tags array
        if (key === 'tags' && val.startsWith('[') && val.endsWith(']')) {
          try {
            metadata.tags = JSON.parse(val);
          } catch (e) {
            metadata.tags = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
          }
        } else {
          metadata[key] = val;
        }
      }
    });
  }

  const bodyContent = frontmatterMatch ? mdContent.slice(frontmatterMatch[0].length) : mdContent;

  // Extract title
  const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
  const title = metadata.title || (titleMatch ? titleMatch[1].trim() : 'Hồ Sơ Nghiên Cứu');

  // Subtitle
  const subtitleMatch = bodyContent.match(/^>\s*\*(.*?)\*/m);
  const subtitle = metadata.subtitle || (subtitleMatch ? subtitleMatch[1].trim() : '');

  // Extract abstract
  const abstractMatch = bodyContent.match(/## I\. TÓM TẮT KHẢO LUẬN[\s\S]*?\n\n([\s\S]*?)(?=\n## |$)/);
  const abstract = metadata.abstract || (abstractMatch ? abstractMatch[1].trim() : '');

  // Extract Key Findings (IV) excluding boilerplate outline text
  const keyFindings: string[] = [];
  const keyFindingsMatch = bodyContent.match(/## IV\. ĐIỂM SÁNG NÒNG CỐT[\s\S]*?\n\n([\s\S]*?)(?=\n## |$)/);
  if (keyFindingsMatch) {
    const lines = keyFindingsMatch[1].split('\n');
    lines.forEach(l => {
      const clean = l.replace(/^-\s*/, '').trim();
      if (
        clean &&
        !/thiết lập khung cấu trúc/i.test(clean) &&
        !/sẵn sàng được biên soạn độc lập/i.test(clean) &&
        !/chờ viết bài/i.test(clean)
      ) {
        keyFindings.push(clean);
      }
    });
  }

  // Extract Mappings (V)
  const technicalMappings: Array<{ classicalConcept: string; computerSciencePattern: string; rationale: string; failureModeAvoided: string }> = [];
  const mappingsMatch = bodyContent.match(/## V\. ÁNH XẠ TRIẾT HỌC[\s\S]*?\n\n([\s\S]*?)(?=\n## |$)/);
  if (mappingsMatch) {
    const concepts = mappingsMatch[1].split(/(?=### Concept:)/);
    concepts.forEach(block => {
      const head = block.match(/### Concept:\s*(.*?)\s*↔\s*(.*?)\n/);
      if (head) {
        const rat = block.match(/-\s*\*\*Lý do ánh xạ\*\*:\s*(.*?)\n/);
        const fail = block.match(/-\s*\*\*Rủi ro triệt tiêu\*\*:\s*(.*?)\n/);
        technicalMappings.push({
          classicalConcept: head[1].trim(),
          computerSciencePattern: head[2].trim(),
          rationale: rat ? rat[1].trim() : '',
          failureModeAvoided: fail ? fail[1].trim() : ''
        });
      }
    });
  }

  // Extract 6 Dynamic Pillars (II) - Skip unwritten placeholder chapters
  const projectStructure: DynamicPillar[] = [];
  const pillarsMatch = bodyContent.match(/## II\. BẢN GIAO ƯỚC 6 TRỤ CỘT ĐỘNG[\s\S]*?\n\n([\s\S]*?)(?=\n## |$)/);
  if (pillarsMatch) {
    const pillarBlocks = pillarsMatch[1].split(/(?=### Trụ cột \d+:)/);
    pillarBlocks.forEach((pBlock, pIdx) => {
      const pTitleMatch = pBlock.match(/### Trụ cột \d+:\s*(.*?)\n/);
      if (pTitleMatch) {
        const descMatch = pBlock.match(/\*Mô tả\*:\s*(.*?)\n/);
        const chapters: Chapter[] = [];

        const chapBlocks = pBlock.split(/(?=#### Chapter:)/);
        chapBlocks.forEach((cBlock, cIdx) => {
          const cTitleMatch = cBlock.match(/#### Chapter:\s*(.*?)\n/);
          if (cTitleMatch) {
            const cSubMatch = cBlock.match(/^\*(.*?)\*\n/m);
            const contentLines = stripUnwrittenOutline(cBlock.split('\n').slice(2).join('\n').trim());
            if (contentLines.length > 0) {
              chapters.push({
                id: `chap-${pIdx + 1}-${cIdx + 1}`,
                title: cTitleMatch[1].trim(),
                subtitle: cSubMatch ? cSubMatch[1].trim() : '',
                contentMarkdown: contentLines,
                status: 'completed'
              });
            }
          }
        });

        const conceptualTypes: DynamicPillar['conceptualType'][] = ['concept', 'deep_dive', 'context', 'application', 'internal_dialogue', 'synthesis'];
        projectStructure.push({
          id: `pillar-${pIdx + 1}`,
          conceptualType: conceptualTypes[pIdx % conceptualTypes.length],
          title: pTitleMatch[1].trim(),
          description: descMatch ? descMatch[1].trim() : '',
          chapters
        });
      }
    });
  }

  // Extract main content (III) or clean whole body
  let mainContent = bodyContent;
  const mainContentMatch = bodyContent.match(/## III\. NỘI DUNG CHUYỂN HÓA TRI THỨC[\s\S]*?\n\n([\s\S]*?)(?=\n## IV\.|\n## V\.|\n## VI\.|\n## VII\.|$)/);
  if (mainContentMatch) {
    mainContent = mainContentMatch[1].trim();
  }
  mainContent = stripUnwrittenOutline(mainContent);

  const parsedChapter = metadata.chapterNumber
    ? parseInt(metadata.chapterNumber, 10)
    : (metadata.chapter ? parseInt(metadata.chapter, 10) : undefined);

  return {
    id: metadata.id || `dossier-${Date.now()}`,
    chapterNumber: parsedChapter,
    title,
    subtitle,
    topic: metadata.topic || title,
    discipline: metadata.discipline || 'Nghiên cứu Liên Ngành Bác Học',
    depthLevel: metadata.depthLevel || 'advanced',
    tags: metadata.tags || ['Google Drive Sync'],
    abstract,
    contentMarkdown: mainContent,
    keyFindings: keyFindings.length > 0 ? keyFindings : undefined,
    technicalMappings: technicalMappings.length > 0 ? technicalMappings : undefined,
    projectStructure: projectStructure.length > 0 ? projectStructure : undefined,
    lastModified: metadata.lastModified || new Date().toISOString(),
    status: metadata.status || 'published'
  };
}

/**
 * Helper to remove Vietnamese accents for clean filenames
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
}

/**
 * Rule for generating standardized, concise Markdown filename:
 *  - Sequence number (01, 02, ..., 08, 09, 10) based on chapterNumber or index
 *  - Short non-accented Vietnamese slug derived from subtitle (or title)
 *  - Format: [STT]-[phu-de-ngan-gon-khong-dau].md
 */
export function generateDossierMarkdownFileName(dossier: Dossier, index?: number): string {
  let numStr = '';
  if (dossier.chapterNumber && !isNaN(dossier.chapterNumber)) {
    numStr = dossier.chapterNumber < 10 ? `0${dossier.chapterNumber}` : `${dossier.chapterNumber}`;
  } else if (typeof index === 'number') {
    numStr = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
  } else {
    const numMatch = dossier.id?.match(/\b(\d{1,3})\b/);
    if (numMatch) {
      const parsed = parseInt(numMatch[1], 10);
      numStr = parsed < 10 ? `0${parsed}` : `${parsed}`;
    } else {
      numStr = '01';
    }
  }

  let sourceText = (dossier.subtitle && dossier.subtitle.trim().length > 2)
    ? dossier.subtitle.trim()
    : (dossier.title || dossier.topic || 'ho-so');

  const unaccented = removeVietnameseAccents(sourceText);
  const words = unaccented.toLowerCase().split(/\s+/).filter(Boolean);
  const shortSlug = words.slice(0, 6).join('-');

  return `${numStr}-${shortSlug || 'ho-so'}.md`;
}

/**
 * Get or Create folder 'OG_Research_Lab' on Google Drive
 */
export async function getOrCreateDriveFolder(accessToken: string): Promise<string> {
  // Search for existing folder
  const query = encodeURIComponent(`name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder if not found
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    throw new Error(`Không thể tạo thư mục '${DRIVE_FOLDER_NAME}' trên Google Drive.`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Get or Create a subfolder inside parent folder on Google Drive
 */
export async function getOrCreateSubFolder(
  accessToken: string,
  parentFolderId: string,
  subFolderName: string
): Promise<string> {
  const query = encodeURIComponent(`name='${subFolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create subfolder
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: subFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    })
  });

  if (!createRes.ok) {
    throw new Error(`Không thể tạo thư mục con '${subFolderName}' trên Google Drive.`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

export const SUBFOLDERS = {
  DOSSIERS: 'Ho_So_Nghien_Cuu',
  LEXICON: 'Tu_Dien_Thuat_Ngu',
  CITATIONS: 'Trich_Dan_Kinh_Dien'
};

/**
 * Upload a single Dossier as a Markdown file to Google Drive folder (Ho_So_Nghien_Cuu subfolder)
 */
export async function uploadDossierToDrive(accessToken: string, dossier: Dossier, index?: number): Promise<{ fileId: string; fileName: string }> {
  const mainFolderId = await getOrCreateDriveFolder(accessToken);
  const targetFolderId = await getOrCreateSubFolder(accessToken, mainFolderId, SUBFOLDERS.DOSSIERS);

  const fileName = generateDossierMarkdownFileName(dossier, index);
  const mdContent = dossierToMarkdown(dossier);

  // Check if file already exists in target folder
  const query = encodeURIComponent(`name='${fileName}' and '${targetFolderId}' in parents and trashed=false`);
  const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const checkData = await checkRes.json();

  const metadata = {
    name: fileName,
    mimeType: 'text/markdown',
    parents: checkData.files && checkData.files.length > 0 ? undefined : [targetFolderId]
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
    mdContent +
    closeDelimiter;

  let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (checkData.files && checkData.files.length > 0) {
    const existingId = checkData.files[0].id;
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(uploadUrl, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload file lên Drive thất bại: ${uploadRes.status} - ${errText}`);
  }

  const result = await uploadRes.json();
  return { fileId: result.id, fileName };
}

/**
 * Convert Lexicon Hub array into structured Markdown (.md)
 */
export function lexiconToMarkdown(lexicon: LexiconTerm[]): string {
  const frontmatter = [
    '---',
    'title: "Sổ Từ Điển Thuật Ngữ - OG Lexicon Hub"',
    `totalTerms: ${lexicon.length}`,
    `lastModified: "${new Date().toISOString()}"`,
    'type: "lexicon_hub"',
    '---',
    '',
  ].join('\n');

  let body = `# 📖 SỔ TỪ ĐIỂN THUẬT NGỮ (OG LEXICON HUB)\n`;
  body += `> *Tổng hợp đầy đủ các thuật ngữ Triết học, Khoa học Máy tính & Multi-Agent Swarms từ hệ thống hồ sơ Oneness Governance.*\n\n`;
  body += `**Tổng số thuật ngữ**: ${lexicon.length}\n\n`;
  body += `---\n\n`;

  const categories: Record<string, LexiconTerm[]> = {};
  lexicon.forEach(term => {
    const cat = term.category || 'Khác';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(term);
  });

  body += `## I. BẢNG MỤC LỤC & PHÂN LOẠI\n\n`;
  Object.keys(categories).forEach(cat => {
    body += `- **${cat}** (${categories[cat].length} thuật ngữ)\n`;
  });
  body += `\n---\n\n`;

  body += `## II. CHI TIẾT DANH MỤC THUẬT NGỮ\n\n`;

  let idx = 1;
  lexicon.forEach(term => {
    body += `### ${idx}. ${term.term} (${term.enTerm || term.term})\n`;
    body += `- **Phân loại**: ${term.category}\n`;
    if (term.sourceDiscipline) body += `- **Lĩnh vực nguồn**: ${term.sourceDiscipline}\n`;
    if (term.philosophicalOrigin) body += `- **Nguồn gốc Triết học & Đời thường**: ${term.philosophicalOrigin}\n`;
    if (term.csEquivalent) body += `- **Ánh xạ Khoa học Máy tính / Agentic AI**: ${term.csEquivalent}\n`;
    if (term.deepExplanation) body += `- **Diễn giải sâu sắc**: ${term.deepExplanation}\n`;
    if (term.applicationInAgents) body += `- **Ứng dụng thực chiến Multi-Agent**: ${term.applicationInAgents}\n`;
    if (term.tags && term.tags.length > 0) {
      body += `- **Thẻ liên quan**: ${term.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ')}\n`;
    }
    body += `\n`;
    idx++;
  });

  return frontmatter + body;
}

/**
 * Convert Citations & Quotes array into structured Markdown (.md)
 */
export function citationsToMarkdown(citations: CitationItem[]): string {
  const frontmatter = [
    '---',
    'title: "Danh Mục Trích Dẫn & Kinh Điển - OG Classical Citations"',
    `totalItems: ${citations.length}`,
    `lastModified: "${new Date().toISOString()}"`,
    'type: "citations_hub"',
    '---',
    '',
  ].join('\n');

  let body = `# 📜 DANH MỤC TRÍCH DẪN & KINHD IỂN (OG CLASSICAL CITATIONS)\n`;
  body += `> *Tổng hợp đầy đủ trích dẫn triết học kinh điển Đông-Tây và tài liệu tham khảo học thuật liên ngành.*\n\n`;
  body += `**Tổng số mục trích dẫn**: ${citations.length}\n\n`;
  body += `---\n\n`;

  const classical = citations.filter(c => c.category === 'Kinh điển' || (c.keyQuote && !c.doiOrUrl));
  const academic = citations.filter(c => c.category !== 'Kinh điển' && (c.doiOrUrl || !c.keyQuote));

  if (classical.length > 0) {
    body += `## I. TRÍCH DẪN KINHD IỂN (CLASSICAL QUOTES)\n\n`;
    classical.forEach((c, i) => {
      body += `### ${i + 1}. "${c.keyQuote || c.title}"\n`;
      body += `> — **${c.author || 'Tác giả Kinh điển'}**, *${c.source || c.title}* (${c.year || 'Cổ điển'})\n`;
      body += `> *Danh mục*: ${c.category}\n\n`;
    });
  }

  if (academic.length > 0) {
    body += `## II. DANH MỤC THAM KHẢO HỌC THUẬT (ACADEMIC CITATIONS)\n\n`;
    academic.forEach((c, i) => {
      body += `### ${i + 1}. ${c.title} (${c.year})\n`;
      body += `- **Tác giả**: ${c.author}\n`;
      body += `- **Nguồn / Tạp chí**: ${c.source}\n`;
      body += `- **Phân loại**: ${c.category}\n`;
      if (c.doiOrUrl) body += `- **Link liên kết**: ${c.doiOrUrl}\n`;
      if (c.keyQuote) body += `- **Trích dẫn then chốt**: "${c.keyQuote}"\n`;
      body += `\n`;
    });
  }

  return frontmatter + body;
}

/**
 * Upload single text file to Google Drive folder or subfolder
 */
export async function uploadFileToDriveFolder(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: 'text/markdown' | 'application/json' = 'text/markdown',
  subfolderName?: string
): Promise<{ fileId: string; fileName: string }> {
  const mainFolderId = await getOrCreateDriveFolder(accessToken);
  const targetFolderId = subfolderName
    ? await getOrCreateSubFolder(accessToken, mainFolderId, subfolderName)
    : mainFolderId;

  const query = encodeURIComponent(`name='${fileName}' and '${targetFolderId}' in parents and trashed=false`);
  const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const checkData = await checkRes.json();

  const metadata = {
    name: fileName,
    mimeType: `${mimeType}; charset=UTF-8`,
    parents: checkData.files && checkData.files.length > 0 ? undefined : [targetFolderId]
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (checkData.files && checkData.files.length > 0) {
    const existingId = checkData.files[0].id;
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(uploadUrl, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload file ${fileName} lên Drive thất bại: ${uploadRes.status} - ${errText}`);
  }

  const result = await uploadRes.json();
  return { fileId: result.id, fileName };
}

/**
 * Upload Lexicon Hub to Google Drive (Tu_Dien_Thuat_Ngu subfolder)
 */
export async function uploadLexiconToDrive(accessToken: string, lexicon: LexiconTerm[]) {
  const mdContent = lexiconToMarkdown(lexicon);
  const jsonContent = JSON.stringify(lexicon, null, 2);

  await uploadFileToDriveFolder(accessToken, '00-OG_Tu_Dien_Thuat_Ngu.md', mdContent, 'text/markdown', SUBFOLDERS.LEXICON);
  await uploadFileToDriveFolder(accessToken, '00-OG_Tu_Dien_Thuat_Ngu.json', jsonContent, 'application/json', SUBFOLDERS.LEXICON);
}

/**
 * Upload Citations & Quotes Hub to Google Drive (Trich_Dan_Kinh_Dien subfolder)
 */
export async function uploadCitationsToDrive(accessToken: string, citations: CitationItem[]) {
  const mdContent = citationsToMarkdown(citations);
  const jsonContent = JSON.stringify(citations, null, 2);

  await uploadFileToDriveFolder(accessToken, '00-OG_Trich_Dan_Kinh_Dien.md', mdContent, 'text/markdown', SUBFOLDERS.CITATIONS);
  await uploadFileToDriveFolder(accessToken, '00-OG_Trich_Dan_Kinh_Dien.json', jsonContent, 'application/json', SUBFOLDERS.CITATIONS);
}

/**
 * Sync batch of dossiers to Google Drive
 */
export async function syncAllDossiersToDrive(
  accessToken: string,
  dossiers: Dossier[],
  onProgress?: (current: number, total: number, name: string) => void
): Promise<number> {
  let count = 0;
  for (let i = 0; i < dossiers.length; i++) {
    const d = dossiers[i];
    if (onProgress) onProgress(i + 1, dossiers.length, d.title);
    await uploadDossierToDrive(accessToken, d, i);
    count++;
  }
  return count;
}

/**
 * Sync ALL 3 types of documents to Google Drive across 3 subfolders:
 *  1. Ho_So_Nghien_Cuu -> All Dossiers (.md)
 *  2. Tu_Dien_Thuat_Ngu -> Lexicon Hub (00-OG_Tu_Dien_Thuat_Ngu.md & .json)
 *  3. Trich_Dan_Kinh_Dien -> Citations Hub (00-OG_Trich_Dan_Kinh_Dien.md & .json)
 */
export async function syncAllDocumentsToDrive(
  accessToken: string,
  dossiers: Dossier[],
  lexicon: LexiconTerm[],
  citations: CitationItem[],
  onProgress?: (current: number, total: number, name: string) => void
): Promise<{ dossierCount: number; lexiconCount: number; citationCount: number }> {
  const totalSteps = dossiers.length + 2;
  let currentStep = 0;

  for (let i = 0; i < dossiers.length; i++) {
    const d = dossiers[i];
    currentStep++;
    if (onProgress) onProgress(currentStep, totalSteps, `Thư mục Ho_So_Nghien_Cuu: ${d.title}`);
    await uploadDossierToDrive(accessToken, d, i);
  }

  currentStep++;
  if (onProgress) onProgress(currentStep, totalSteps, `Thư mục Tu_Dien_Thuat_Ngu (${lexicon.length} từ)`);
  await uploadLexiconToDrive(accessToken, lexicon);

  currentStep++;
  if (onProgress) onProgress(currentStep, totalSteps, `Thư mục Trich_Dan_Kinh_Dien (${citations.length} mục)`);
  await uploadCitationsToDrive(accessToken, citations);

  return {
    dossierCount: dossiers.length,
    lexiconCount: lexicon.length,
    citationCount: citations.length
  };
}

/* =========================================================================
 * SINGLE-FILE IDEA JOURNAL SYNC (SO_TAY_Y_TUONG_ONENESS.md)
 * ========================================================================= */

export const IDEA_JOURNAL_FILENAME = 'SO_TAY_Y_TUONG_ONENESS.md';

/**
 * Helper to format ISO timestamp into readable Vietnamese format
 */
function formatVNDateTime(isoString?: string): string {
  if (!isoString) return new Date().toLocaleString('vi-VN', { hour12: false });
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
}

/**
 * Extracts a concise motivation abstract from user's first prompt or synthesis
 */
function extractSeedAbstract(session: ConceptChatSession): string {
  if (session.synthesis?.decodedEssence) {
    return session.synthesis.decodedEssence.trim();
  }
  if (session.synthesis?.proposedAbstract) {
    return session.synthesis.proposedAbstract.trim();
  }
  const firstUser = session.messages.find(m => m.role === 'user');
  if (firstUser) {
    const clean = firstUser.content.trim().replace(/\n+/g, ' ');
    return clean.length > 250 ? clean.slice(0, 250) + '...' : clean;
  }
  return 'Ý niệm khởi phát chưa được đúc kết.';
}

/**
 * Format a single Concept Chat Session into the 6-component structured Markdown block
 */
export function formatConceptChatToMarkdownSection(
  session: ConceptChatSession,
  indexNumber: number = 1
): string {
  const padIndex = String(indexNumber).padStart(3, '0');
  const createdTimeStr = formatVNDateTime(session.createdAt);
  const updatedTimeStr = formatVNDateTime(session.updatedAt || session.createdAt);
  const abstract = extractSeedAbstract(session);

  let statusLabel = 'Đang khai phá sơ khởi (Active Chat)';
  if (session.status === 'synthesized') statusLabel = 'Đã đúc kết (Synthesized - Ready for OG Studio)';
  if (session.status === 'converted_to_dossier') statusLabel = 'Đã chuyển thành Hồ Sơ Nghiên Cứu (Dossier)';

  // Tags
  const tags: string[] = ['#oneness-ideas', '#deep-research'];
  if (session.selectedScenario) {
    tags.push(`#${session.selectedScenario.replace(/_/g, '-')}`);
  }
  if (session.synthesis?.detectedDomain) {
    tags.push(`#${session.synthesis.detectedDomain.toLowerCase().replace(/\s+/g, '-')}`);
  }

  let section = `<!-- SECTION_ID: ${session.id} -->\n`;
  section += `## 🌿 [Ý NIỆM #${padIndex}] ${session.title || 'Ý niệm mới'}\n\n`;

  // 1. Metadata Banner
  section += `### 📋 1. Thông Tin Định Danh & Dấu Vết Thời Gian\n`;
  section += `- **Mã phân đoạn (Session ID):** \`${session.id}\`\n`;
  section += `- **Thời điểm khởi tạo:** \`${createdTimeStr}\` | **Cập nhật gần nhất:** \`${updatedTimeStr}\`\n`;
  section += `- **Trạng thái:** \`${statusLabel}\`\n`;
  section += `- **Từ khóa định hướng (Tags):** ${tags.join(' ')}\n`;
  section += `- **Tổng số lượt đàm thoại:** ${session.messages.length} lượt tương tác\n\n`;

  // 2. Core Seed Abstract
  section += `### 💡 2. Tóm Lược Bản Thể Ý Niệm (Seed Essence & Motivation)\n`;
  section += `> ${abstract}\n\n`;

  if (session.synthesis?.scenarioRationale) {
    section += `> *Phân tích bối cảnh ứng dụng:* ${session.synthesis.scenarioRationale}\n\n`;
  }

  section += `---\n\n`;

  // 3. Full Chronological Dialogue Stream
  section += `### 💬 3. Biên Bản Đối Thoại Toàn Văn (Dialogue Stream)\n\n`;
  if (session.messages.length === 0) {
    section += `*(Chưa có nội dung đối thoại)*\n\n`;
  } else {
    session.messages.forEach((m) => {
      const msgTime = formatVNDateTime(m.timestamp);
      const msgIdTag = m.id ? ` \`ID: ${m.id}\`` : '';
      if (m.role === 'user') {
        section += `#### 👤 Người Đồng Hành \`[${msgTime}]\`${msgIdTag}\n`;
        section += `${m.content.trim()}\n\n`;
      } else if (m.role === 'assistant') {
        section += `#### 🤖 Trợ Lý Trí Tuệ OG \`[${msgTime}]\`${msgIdTag}\n`;
        section += `${m.content.trim()}\n\n`;
      } else {
        section += `> ℹ️ *Hệ thống [${msgTime}]*${msgIdTag}: ${m.content.trim()}\n\n`;
      }
    });
  }

  section += `---\n\n`;

  // 4. Key Takeaways & Seed Terms
  section += `### 📌 4. Hộp Đúc Kết Điểm Sáng Tạo & Thuật Ngữ Hạt Giống\n\n`;
  if (session.synthesis?.decodedEssence) {
    section += `#### ⭐ Điểm Sáng Tạo & Bài Học Thực Chiến:\n`;
    section += `- **Bản chất cốt lõi:** ${session.synthesis.decodedEssence}\n`;
  } else {
    section += `#### ⭐ Điểm Sáng Tạo & Bài Học Thực Chiến:\n`;
  }
  if (session.messages.length > 2) {
    const userPrompts = session.messages.filter(m => m.role === 'user');
    section += `- **Bài toán nhân sinh đặt ra:** ${userPrompts[0]?.content.slice(0, 150) || 'Giải quyết vấn đề thực tiễn'}...\n`;
    section += `- **Mục tiêu chuyển hóa:** Tinh gọn ý tưởng thành quy trình thực hành gãy gọn, dễ áp dụng vào đời sống và công việc.\n`;
  } else {
    section += `- Ghi nhận ý niệm khởi thủy, tiếp tục bồi đắp qua các lượt đối thoại tiếp theo.\n`;
  }
  section += `\n`;

  section += `#### 📚 Thuật Ngữ Hạt Giống (Pocket Lexicon):\n`;
  if (session.synthesis?.interdisciplinaryFields && session.synthesis.interdisciplinaryFields.length > 0) {
    session.synthesis.interdisciplinaryFields.forEach(field => {
      section += `- **${field}:** Lĩnh vực tương hỗ kết hợp để hiện thực hóa ý niệm.\n`;
    });
  } else {
    section += `- **Knowledge Transforming (Chuyển Hóa Tri Thức):** Chuyển dịch tri thức hàn lâm phức tạp thành giải pháp thực chiến đời thường.\n`;
    section += `- **Dynamic 6 Pillars (6 Trụ Cột Động):** Khung kiến trúc triết học và kỹ thuật để nâng cấp ý niệm thành công trình chuyên sâu.\n`;
  }
  section += `\n---\n\n`;

  // 5. Action Bridge & 6 Dynamic Pillars Mapping
  section += `### 🚀 5. Cầu Nối Hành Động & Định Hướng 6 Trụ Cột (Sẵn Sàng Cho OG Studio)\n\n`;
  if (session.synthesis?.pillars && session.synthesis.pillars.length > 0) {
    section += `*Định hướng cấu trúc 6 Trụ Cột Động đã kiến tạo:*\n`;
    session.synthesis.pillars.forEach((p, pIdx) => {
      section += `- **Trụ cột ${pIdx + 1} (${p.title}):** ${p.description || 'Xây dựng giải pháp tương ứng.'}\n`;
    });
  } else {
    section += `*Ánh xạ 6 Trụ Cột Động đề xuất khi chuyển lên Máy Tính (OG Studio):*\n`;
    section += `- **Trụ cột I (Bản Thể):** Xác định ý niệm nguyên thủy và giá trị cốt lõi của bài toán.\n`;
    section += `- **Trụ cột II (Cơ Chế):** Thiết lập quy luật vận hành và động lực học tương tác nội tại.\n`;
    section += `- **Trụ cột III (Kiến Trúc):** Hiện thực hóa thành mô hình hệ thống, luồng dữ liệu hoặc phần mềm thực thi.\n`;
    section += `- **Trụ cột IV (Biện Chứng):** Phản biện mâu thuẫn, nghịch lý và điểm nghẽn kỹ thuật cần khắc phục.\n`;
    section += `- **Trụ cột V (Tĩnh Tâm - Shinbashira):** Xác định điểm cân bằng đạo đức và nguyên tắc bất biến giữ vững hệ thống.\n`;
    section += `- **Trụ cột VI (Đất Trời - Vô Vi):** Đảm bảo tính phát triển bền vững và hài hòa với hệ sinh thái tự nhiên.\n`;
  }
  section += `\n**🎯 Hành động thực tiễn ngay hôm nay:**\n`;
  section += `1. Xem lại các điểm đúc kết ở mục 4 để áp dụng vào công việc.\n`;
  section += `2. Khi sử dụng máy tính, mở **OG Research Studio** để nâng cấp ý niệm này thành Hồ Sơ Nghiên Cứu hoàn chỉnh.\n\n`;

  // 6. Section boundary (Clean without duplicate JSON payload)
  section += `<!-- SECTION_END: ${session.id} -->\n\n`;
  section += `---\n\n`;

  return section;
}

/**
 * Generate standard header preamble for SO_TAY_Y_TUONG_ONENESS.md
 */
export function generateIdeaJournalFileHeader(): string {
  const nowStr = formatVNDateTime();
  return `# 📓 SỔ TAY Ý TƯỞNG & ĐỐI THOẠI KHAI PHÁ (ONENESS IDEA JOURNAL)
> *Biên niên sử đối thoại và chuyển hóa tri thức — Nơi lưu giữ mọi hạt mầm ý niệm, thảo luận thực chiến và ánh xạ sang 6 Trụ Cột Động của Oneness Governance Lab.*
> *Vận hành theo tôn chỉ: "Deep Research & Knowledge Transforming" — Chuyển hóa tri thức hàn lâm thành hành động thực tiễn.*
> *Cập nhật lần cuối: ${nowStr}*

---

`;
}

/**
 * One-Click Sync a single Idea Journal session into the unified SO_TAY_Y_TUONG_ONENESS.md on Google Drive.
 * Does NOT create duplicate files. Merges or appends cleanly.
 */
export async function syncIdeaJournalToDrive(
  accessToken: string,
  session: ConceptChatSession
): Promise<{ fileId: string; fileName: string; isUpdated: boolean; totalSections: number }> {
  const mainFolderId = await getOrCreateDriveFolder(accessToken);
  const fileName = IDEA_JOURNAL_FILENAME;

  // 1. Search for existing SO_TAY_Y_TUONG_ONENESS.md
  const query = encodeURIComponent(`name='${fileName}' and '${mainFolderId}' in parents and trashed=false`);
  const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  let existingContent = '';
  let existingFileId: string | null = null;

  if (checkRes.ok) {
    const checkData = await checkRes.json();
    if (checkData.files && checkData.files.length > 0) {
      existingFileId = checkData.files[0].id;
      // Download current content
      try {
        const fileUrl = `https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`;
        const fileRes = await fetch(fileUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (fileRes.ok) {
          existingContent = await fileRes.text();
        }
      } catch (err) {
        console.warn('Failed to read existing idea journal file:', err);
      }
    }
  }

  // 2. Count existing sections and determine index
  const sectionIdRegex = /<!-- SECTION_ID:\s*([\w\-]+)\s*-->/g;
  const matches = [...existingContent.matchAll(sectionIdRegex)];
  const existingSectionIds = matches.map(m => m[1]);
  
  let sectionIndex = existingSectionIds.indexOf(session.id);
  let isUpdated = false;

  if (sectionIndex >= 0) {
    isUpdated = true;
    sectionIndex = sectionIndex + 1; // 1-indexed
  } else {
    sectionIndex = existingSectionIds.length + 1;
  }

  const formattedSection = formatConceptChatToMarkdownSection(session, sectionIndex);

  let newContent = '';

  if (!existingContent || !existingContent.includes('# 📓 SỔ TAY Ý TƯỞNG')) {
    // Brand new file
    newContent = generateIdeaJournalFileHeader() + formattedSection;
  } else {
    // Update timestamp in header
    const nowStr = formatVNDateTime();
    let updatedHeaderContent = existingContent.replace(
      /> \*Cập nhật lần cuối: .*?\*/,
      `> *Cập nhật lần cuối: ${nowStr}*`
    );

    const sectionBlockRegex = new RegExp(
      `<!-- SECTION_ID:\\s*${session.id}\\s*-->[\\s\\S]*?<!-- SECTION_END:\\s*${session.id}\\s*-->\\s*(?:\\n*---)?`,
      'g'
    );

    if (sectionBlockRegex.test(updatedHeaderContent)) {
      // Replace existing section
      newContent = updatedHeaderContent.replace(sectionBlockRegex, formattedSection.trim());
    } else {
      // Append section to the end
      newContent = updatedHeaderContent.trimEnd() + '\n\n' + formattedSection;
    }
  }

  // 3. Upload to Google Drive using multipart upload
  const uploadResult = await uploadFileToDriveFolder(
    accessToken,
    fileName,
    newContent,
    'text/markdown'
  );

  const finalSectionsCount = [...newContent.matchAll(sectionIdRegex)].length;

  return {
    fileId: uploadResult.fileId,
    fileName: uploadResult.fileName,
    isUpdated,
    totalSections: finalSectionsCount
  };
}

/**
 * Sync ALL Idea Journal sessions on device into the single SO_TAY_Y_TUONG_ONENESS.md on Google Drive
 */
export async function syncAllIdeaJournalsToDrive(
  accessToken: string,
  sessions: ConceptChatSession[]
): Promise<{ fileId: string; fileName: string; totalSynced: number }> {
  if (sessions.length === 0) {
    throw new Error('Không có phiên ghi chép ý niệm nào để đồng bộ.');
  }

  let finalMarkdown = generateIdeaJournalFileHeader();

  sessions.forEach((s, idx) => {
    finalMarkdown += formatConceptChatToMarkdownSection(s, idx + 1);
  });

  const uploadResult = await uploadFileToDriveFolder(
    accessToken,
    IDEA_JOURNAL_FILENAME,
    finalMarkdown,
    'text/markdown'
  );

  return {
    fileId: uploadResult.fileId,
    fileName: uploadResult.fileName,
    totalSynced: sessions.length
  };
}


