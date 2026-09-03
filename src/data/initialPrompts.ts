import { PromptTemplate } from '../types';
import initialPromptsJson from './initialPrompts.json';

export const INITIAL_PROMPTS: PromptTemplate[] = initialPromptsJson as unknown as PromptTemplate[];
