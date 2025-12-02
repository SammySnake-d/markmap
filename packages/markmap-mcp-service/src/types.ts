/**
 * MCP Service Types for Markmap HTML Generator
 */

/**
 * Separator configuration for parsing markdown
 */
export interface SeparatorConfig {
  /** 单行备注分隔符 (default: ':') */
  note?: string;
  /** 多行备注块标记 (default: '>') */
  noteBlock?: string;
  /** 转义字符 (default: '\\') */
  escape?: string;
}

/**
 * Input parameters for the generate_mindmap tool
 */
export interface GenerateMindmapInput {
  /** Markdown content with notes */
  markdown: string;
  /** Output HTML file path */
  outputPath: string;
  /** Mindmap title (optional, default: 'Mindmap') */
  title?: string;
  /** Color scheme name (optional, default: 'default') */
  colorScheme?: 'default' | 'ocean' | 'forest' | 'sunset' | 'monochrome';
  /** Enable edit mode (optional, default: true) */
  enableEdit?: boolean;
  /** Theme (optional, default: 'light') */
  theme?: 'light' | 'dark';
  /** CDN base URL for external libraries (optional, default: 'https://cdn.jsdelivr.net/npm') */
  cdnBase?: string;
  /** Separator configuration for parsing markdown */
  separators?: SeparatorConfig;
}

/**
 * Result of the generate_mindmap tool
 */
export interface GenerateMindmapResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Path to the generated file (if successful) */
  filePath?: string;
  /** Success or error message */
  message: string;
  /** Error details (if failed) */
  error?: string;
}

/**
 * MCP Server configuration
 */
export interface McpServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
}
