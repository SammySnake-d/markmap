/**
 * MCP Tool Definitions for Markmap HTML Generator
 */

import { z } from 'zod';
import type { GenerateMindmapInput, GenerateMindmapResult } from './types.js';

/**
 * Separator config schema
 */
const separatorConfigSchema = z
  .object({
    note: z.string().optional().describe("单行备注分隔符 (default: ':')"),
    noteBlock: z.string().optional().describe("多行备注块标记 (default: '>')"),
    escape: z.string().optional().describe("转义字符 (default: '\\\\')"),
  })
  .optional();

/**
 * Input schema for generate_mindmap tool using Zod
 */
export const generateMindmapInputSchema = {
  markdown: z.string().describe('Markdown 内容'),
  outputPath: z.string().describe('输出 HTML 文件路径'),
  title: z.string().optional().describe("思维导图标题 (default: 'Mindmap')"),
  colorScheme: z
    .enum(['default', 'ocean', 'forest', 'sunset', 'monochrome'])
    .optional()
    .describe("配色方案 (default: 'default')"),
  enableEdit: z
    .boolean()
    .optional()
    .default(true)
    .describe('启用编辑模式 (default: true)'),
  theme: z
    .enum(['light', 'dark'])
    .optional()
    .default('light')
    .describe("主题 (default: 'light')"),
  cdnBase: z
    .string()
    .optional()
    .describe("CDN 基础路径 (default: 'https://cdn.jsdelivr.net/npm')"),
  separators: separatorConfigSchema.describe('分隔符配置'),
};

/**
 * Output schema for generate_mindmap tool using Zod
 */
export const generateMindmapOutputSchema = {
  success: z.boolean(),
  filePath: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
};

/**
 * Tool metadata for generate_mindmap
 */
export const generateMindmapToolMeta = {
  name: 'generate_mindmap',
  title: 'Generate Mindmap',
  description:
    'Generate an interactive mindmap HTML file from Markdown. The generated HTML file is standalone and can be opened directly in a browser without any external dependencies.',
};

/**
 * Validate input parameters for generate_mindmap tool
 */
export function validateGenerateMindmapInput(
  input: unknown,
): GenerateMindmapInput {
  const schema = z.object(generateMindmapInputSchema);
  return schema.parse(input);
}

/**
 * Create a success result
 */
export function createSuccessResult(filePath: string): GenerateMindmapResult {
  return {
    success: true,
    filePath,
    message: `Mindmap generated successfully at ${filePath}`,
  };
}

/**
 * Create an error result
 */
export function createErrorResult(
  error: Error | string,
): GenerateMindmapResult {
  const errorMessage = error instanceof Error ? error.message : error;
  return {
    success: false,
    message: `Failed to generate mindmap: ${errorMessage}`,
    error: errorMessage,
  };
}
