/**
 * Options for generating standalone HTML files
 *
 * Requirements:
 * - 14.1: Accept Markdown text and configuration options as input
 * - 14.2: Generate HTML with all necessary CSS and JavaScript inlined
 */
export interface HTMLGeneratorOptions {
  /**
   * Page title
   * @default 'Mindmap'
   */
  title?: string;

  /**
   * Color scheme name
   * Available schemes: 'default', 'ocean', 'forest', 'sunset', 'monochrome'
   * @default 'default'
   */
  colorScheme?: string;

  /**
   * Enable editing mode
   * When enabled, users can edit notes and the content will be saved to localStorage
   * @default true
   */
  enableEdit?: boolean;

  /**
   * Theme mode
   * - 'light': Light background with dark text
   * - 'dark': Dark background with light text
   * @default 'light'
   */
  theme?: 'light' | 'dark';

  /**
   * Whether to minify CSS and JavaScript output
   * Set to false for debugging purposes
   * @default true
   */
  minify?: boolean;

  /**
   * Custom CDN base URL for external libraries
   * @default 'https://cdn.jsdelivr.net/npm'
   */
  cdnBase?: string;

  /**
   * Whether to use local bundled JS instead of CDN
   * When true, the generated HTML will include all JS inline from local packages
   * This creates a truly standalone HTML file that works offline
   * @default false
   */
  useLocalBundle?: boolean;

  /**
   * Custom separator configuration for parsing markdown
   */
  separators?: {
    /**
     * Node separator character
     * @default '-' or '*'
     */
    node?: string;

    /**
     * Note separator character
     * @default ':'
     */
    note?: string;

    /**
     * Note block marker
     * @default '>'
     */
    noteBlock?: string;

    /**
     * Escape character
     * @default '\\'
     */
    escape?: string;
  };
}

/**
 * Result of HTML generation
 */
export interface HTMLGeneratorResult {
  /**
   * Generated HTML content
   */
  html: string;

  /**
   * Any warnings during generation
   */
  warnings?: string[];
}
