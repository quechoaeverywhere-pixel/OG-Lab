import { normalizeMarkdownTables } from './src/utils/markdownSanitizer.ts';

const text = "Some text with |x| and a table\n\n| A | B |\n|---|---|\n| 1 | 2 |";
console.log(normalizeMarkdownTables(text));
