/**
 * markmap-html-generator
 *
 * Generate standalone HTML files from Markdown mindmaps.
 * The generated HTML files are self-contained with all CSS and JavaScript inlined,
 * requiring no external dependencies to view.
 *
 * Requirements:
 * - 14.1: Accept Markdown text and configuration options as input
 * - 14.2: Generate HTML with all necessary CSS and JavaScript inlined
 * - 14.3: Generated HTML should work without external dependencies
 * - 14.4: Support all core features (search, edit, export, canvas interaction)
 * - 14.5: Save edited content to localStorage
 */

// Main generator functions
export { generateStandaloneHTML, generateHTML } from './generator';

// Types
export type { HTMLGeneratorOptions, HTMLGeneratorResult } from './types';

// Template utilities
export { generateTemplate, BASE_STYLES } from './template';

// CSS utilities
export { collectCSS, minifyCSS } from './css-collector';

// JS utilities
export {
  generateInitScript,
  generateScriptsSection,
  generateExternalScriptTags,
  generateInlineJSBundle,
  generateLoaderScript,
  getExternalLibraryURLs,
  getRequiredLibraries,
  minifyJS,
} from './js-collector';

// JS collector types
export type { JSCollectorOptions } from './js-collector';
