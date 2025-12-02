/**
 * HTML Generator for Standalone Mindmap Files
 *
 * Requirements:
 * - 14.1: Accept Markdown text and configuration options as input
 * - 14.2: Generate HTML with all necessary CSS and JavaScript inlined
 * - 14.3: Generated HTML should work without external dependencies
 * - 14.4: Support all core features (search, edit, export, canvas interaction)
 * - 14.5: Save edited content to localStorage
 *
 * This module generates self-contained HTML files that can be opened
 * directly in a browser without any server or external resources.
 */

import type { HTMLGeneratorOptions, HTMLGeneratorResult } from './types';
import { generateTemplate } from './template';
import { collectCSS, minifyCSS } from './css-collector';
import {
  generateScriptsSection,
  generateLocalScriptsSection,
  minifyJS,
} from './js-collector';

/**
 * Default options for HTML generation
 */
const DEFAULT_OPTIONS: Required<
  Omit<
    HTMLGeneratorOptions,
    'separators' | 'minify' | 'cdnBase' | 'useLocalBundle'
  >
> = {
  title: 'Mindmap',
  colorScheme: 'default',
  enableEdit: true,
  theme: 'light',
};

/**
 * Generate a standalone HTML file from Markdown content
 *
 * Requirements:
 * - 14.1: Accept Markdown text and configuration options
 * - 14.2: Generate complete HTML with inlined CSS and JS
 * - 14.3: No external dependencies required
 * - 14.4: Support all core features (search, edit, export, canvas interaction)
 * - 14.5: Save edited content to localStorage
 *
 * @param markdown - The Markdown content to convert
 * @param options - Generation options
 * @returns Generated HTML content
 */
export function generateStandaloneHTML(
  markdown: string,
  options?: HTMLGeneratorOptions,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const shouldMinify = options?.minify !== false;

  // Generate base template
  const template = generateTemplate({
    title: opts.title,
    theme: opts.theme,
  });

  // Collect CSS
  const css = collectCSS();
  // Minify CSS if enabled (default: true)
  const processedCSS = shouldMinify ? minifyCSS(css) : css;
  const stylesSection = `<style>\n${processedCSS}\n  </style>`;

  // Generate scripts section
  // Use local bundles if useLocalBundle is true, otherwise use CDN
  const scriptsSection = options?.useLocalBundle
    ? generateLocalScriptsSection(markdown, {
        ...opts,
        separators: options?.separators,
      })
    : generateScriptsSection(
        markdown,
        {
          ...opts,
          separators: options?.separators,
        },
        options?.cdnBase,
      );

  // Optionally minify the scripts section
  const processedScripts = shouldMinify
    ? scriptsSection.replace(
        /(<script>)([\s\S]*?)(<\/script>)/g,
        (_, open, content, close) => {
          // Only minify inline scripts, not external script tags
          if (content.trim().startsWith('(function')) {
            return `${open}${minifyJS(content)}${close}`;
          }
          return `${open}${content}${close}`;
        },
      )
    : scriptsSection;

  // Replace placeholders in template
  const html = template
    .replace('<!--STYLES-->', stylesSection)
    .replace('<!--SCRIPTS-->', processedScripts);

  return html;
}

/**
 * Generate HTML with detailed result information
 *
 * @param markdown - The Markdown content to convert
 * @param options - Generation options
 * @returns Generation result with HTML and warnings
 */
export function generateHTML(
  markdown: string,
  options?: HTMLGeneratorOptions,
): HTMLGeneratorResult {
  const warnings: string[] = [];

  // Validate input
  if (!markdown || markdown.trim().length === 0) {
    warnings.push('Empty markdown content provided');
  }

  // Check for potential issues
  if (markdown.length > 100000) {
    warnings.push('Large markdown content may affect performance');
  }

  const html = generateStandaloneHTML(markdown, options);

  return {
    html,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
