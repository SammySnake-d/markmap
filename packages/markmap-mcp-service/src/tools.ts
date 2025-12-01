/**
 * MCP Tool Definitions for Markmap HTML Generator
 */

import { z } from 'zod';
import type { GenerateMindmapInput, GenerateMindmapResult } from './types.js';

/**
 * Input schema for generate_mindmap tool using Zod
 */
export const generateMindmapInputSchema = {
  markdown: z
    .string()
    .describe('Markdown content with notes (using : separator and > blocks)'),
  outputPath: z.string().describe('Output HTML file path'),
  title: z.string().optional().describe('Mindmap title'),
  colorScheme: z
    .enum(['default', 'ocean', 'forest', 'sunset', 'monochrome'])
    .optional()
    .describe('Color scheme name'),
  enableEdit: z.boolean().optional().default(true).describe('Enable edit mode'),
  theme: z
    .enum(['light', 'dark'])
    .optional()
    .default('light')
    .describe('Theme'),
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
