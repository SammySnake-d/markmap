/**
 * MCP Service Types for Markmap HTML Generator
 */

/**
 * Input parameters for the generate_mindmap tool
 */
export interface GenerateMindmapInput {
  /** Markdown content with notes (using : separator and > blocks) */
  markdown: string;
  /** Output HTML file path */
  outputPath: string;
  /** Mindmap title (optional) */
  title?: string;
  /** Color scheme name (optional) */
  colorScheme?: 'default' | 'ocean' | 'forest' | 'sunset' | 'monochrome';
  /** Enable edit mode (optional, default: true) */
  enableEdit?: boolean;
  /** Theme (optional, default: 'light') */
  theme?: 'light' | 'dark';
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
