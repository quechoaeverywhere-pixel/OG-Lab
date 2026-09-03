import fs from 'fs';
import path from 'path';

const profilesDir = path.join(process.cwd(), 'data_store', 'research_profiles');

function cleanMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return raw || '';
  let text = raw;

  // Clean corrupted table artifacts: | --- |\n| :--- |
  text = text.replace(/\|\s*-{3,}\s*\|\r?\n\|\s*:?-+:?\s*\|/g, '');
  text = text.replace(/^\|\s*-{3,}\s*\|$/gm, '');
  text = text.replace(/\|\s*:?---*:?\s*(\|\s*:?---*:?\s*)+\|/g, (match) => {
    // If the match is a standalone single-column fake table separator like | --- |
    return match;
  });

  return text.trim();
}

function processProfileFile(filePath) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const profile = JSON.parse(rawData);

    if (profile.contentMarkdown) {
      profile.contentMarkdown = cleanMarkdown(profile.contentMarkdown);
    }
    if (profile.abstract) {
      profile.abstract = cleanMarkdown(profile.abstract);
    }

    if (Array.isArray(profile.projectStructure)) {
      for (const pillar of profile.projectStructure) {
        if (Array.isArray(pillar.chapters)) {
          for (const ch of pillar.chapters) {
            let md = ch.contentMarkdown || '';
            if (md.startsWith('```json') || (md.startsWith('{') && md.includes('"contentMarkdown"'))) {
              const unquoted = md.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
              try {
                const parsed = JSON.parse(unquoted);
                if (parsed.contentMarkdown) {
                  md = parsed.contentMarkdown;
                }
                if (Array.isArray(parsed.quotes) && (!ch.quotes || ch.quotes.length === 0)) {
                  ch.quotes = parsed.quotes;
                }
                if (Array.isArray(parsed.extractedTerms) && (!ch.extractedTerms || ch.extractedTerms.length === 0)) {
                  ch.extractedTerms = parsed.extractedTerms;
                }
              } catch (err) {
                // Regex extraction fallback
                const match = md.match(/"contentMarkdown"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
                if (match) {
                  try {
                    md = JSON.parse(`"${match[1]}"`);
                  } catch {
                    md = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                  }
                }
              }
            }

            ch.contentMarkdown = cleanMarkdown(md);
          }
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf-8');
    console.log(`Cleaned profile: ${filePath}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

const files = fs.readdirSync(profilesDir);
for (const file of files) {
  if (file.endsWith('.json')) {
    processProfileFile(path.join(profilesDir, file));
  }
}
console.log('Sanitization complete.');
