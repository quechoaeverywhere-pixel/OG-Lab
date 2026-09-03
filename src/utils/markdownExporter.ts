import { Dossier } from '../types';
import { stripUnwrittenOutline, cleanSectionContent } from './googleDriveSync';

export function formatDossierToNotebookLMMarkdown(dossier: Dossier): string {
  const citationsText = dossier.citations && dossier.citations.length > 0
    ? dossier.citations
        .map(
          (c, i) =>
            `${i + 1}. **${c.author}** (${c.year}). *${c.title}*. ${c.source}. ${c.doiOrUrl ? `[Link](${c.doiOrUrl})` : ''} ${c.keyQuote ? `\n   > "${c.keyQuote}"` : ''}`
        )
        .join('\n\n')
    : 'Chưa có trích dẫn bổ sung.';

  const realKeyFindings = (dossier.keyFindings || []).filter(f => {
    return f && !/thiết lập khung cấu trúc/i.test(f) && !/chờ viết bài/i.test(f);
  });

  const keyFindingsText = realKeyFindings.length > 0
    ? realKeyFindings.map((f, i) => `- **Luận điểm ${i + 1}**: ${f}`).join('\n')
    : '';

  const philosophicalBasisText = dossier.philosophicalBasis && dossier.philosophicalBasis.length > 0
    ? dossier.philosophicalBasis
        .map(
          (pb) =>
            `### ${pb.doctrine} (${pb.philosopher})\n- **Cốt lõi triết học**: ${pb.coreTenet}\n- **Hiện thân kỹ thuật**: ${pb.modernParity}`
        )
        .join('\n\n')
    : '';

  const technicalMappingsText = dossier.technicalMappings && dossier.technicalMappings.length > 0
    ? `| Khái niệm Triết học Cổ điển | Mẫu Kiến trúc Khoa học Máy tính | Lý giải Tương quan | Lỗi Hệ thống Tránh được |\n| :--- | :--- | :--- | :--- |\n` +
      dossier.technicalMappings
        .map(
          (m) =>
            `| **${m.classicalConcept}** | **${m.computerSciencePattern}** | ${m.rationale} | ${m.failureModeAvoided} |`
        )
        .join('\n')
    : '';

  let detailedContent = cleanSectionContent(dossier.contentMarkdown || '');

  if (dossier.projectStructure && dossier.projectStructure.length > 0) {
    const writtenPillars = dossier.projectStructure.filter(p => p.chapters && p.chapters.some(c => stripUnwrittenOutline(c.contentMarkdown || '').length > 0));
    if (writtenPillars.length > 0) {
      detailedContent = writtenPillars.map(pillar => {
        let pillarMd = `### ${pillar.title}\n\n${pillar.description || ''}\n\n`;
        const writtenChaps = pillar.chapters.filter(c => stripUnwrittenOutline(c.contentMarkdown || '').length > 0);
        pillarMd += writtenChaps.map(chapter => {
          return `#### ${chapter.title}\n\n${stripUnwrittenOutline(chapter.contentMarkdown || '')}`;
        }).join('\n\n');
        return pillarMd;
      }).join('\n\n---\n\n');
    }
  }

  return `---
title: "${dossier.title}"
subtitle: "${dossier.subtitle}"
chapter: ${dossier.chapterNumber}
pillar: "${dossier.pillarTitle}"
discipline: "${dossier.discipline}"
tags: [${dossier.tags.map(t => `"${t}"`).join(', ')}]
author: "${dossier.author || 'OG Agentic Intelligence Lab'}"
exported_for: "Google NotebookLM Source"
date: "${new Date().toISOString().split('T')[0]}"
---

# ${dossier.title}
*${dossier.subtitle}*

**Khối chuyên đề**: ${dossier.pillarTitle}
**Lĩnh vực nghiên cứu**: ${dossier.discipline}
**Thẻ chuyên đề**: ${dossier.tags.join(' • ')}

---

## 📌 TÓM TẮT HỌC THUẬT (EXECUTIVE ABSTRACT)
${dossier.abstract}

---

## 💡 CÁC PHÁT HIỆN CỐT LÕI (KEY RESEARCH FINDINGS)
${keyFindingsText}

---

## 🏛️ NỀN TẢNG TRIẾT HỌC (PHILOSOPHICAL FOUNDATIONS)
${philosophicalBasisText}

---

## ⚙️ MA TRẬN ĐỐI CHIẾU TRIẾT HỌC & KIẾN TRÚC MÁY TÍNH
${technicalMappingsText}

---

## 📖 NỘI DUNG NGHIÊN CỨU CHI TIẾT (FULL DOSSIER RESEARCH)
${detailedContent}

---

## 📚 DANH MỤC NGUỒN TRÍCH DẪN & THAM CHIẾU (ANNOTATED CITATIONS)
${citationsText}`;
}

export function formatMasterCompilationMarkdown(dossiers: Dossier[]): string {
  const header = `# OG AGENTIC INTELLIGENCE - TOÀN TẬP BÁO CÁO NGHIÊN CỨU LIÊN NGÀNH
*Tuyển tập khảo luận chuyên sâu kết hợp Triết lý Đông - Tây và Khoa học Máy tính Phân tán*
*Định dạng xuất bản chuẩn Google NotebookLM Knowledge Base*

---
**Ngày xuất bản**: ${new Date().toLocaleDateString('vi-VN')}
**Tổng số chuyên đề**: ${dossiers.length} chương nghiên cứu
**Viện nghiên cứu**: OG Agentic Intelligence Lab (Google Gemini Powered)
---

## MỤC LỤC TOÀN TẬP
${dossiers.map(d => `- **Chương ${d.chapterNumber}**: [${d.title}](#chuong-${d.chapterNumber}) — *${d.discipline}*`).join('\n')}

---`;

  const chaptersContent = dossiers.map(d => {
    return `<a id="chuong-${d.chapterNumber}"></a>\n\n` + formatDossierToNotebookLMMarkdown(d);
  }).join('\n\n================================================================================\n\n');

  return header + '\n\n' + chaptersContent;
}

export function downloadMarkdownFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
