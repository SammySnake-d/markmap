/**
 * Markmap MCP Service
 *
 * A Model Context Protocol (MCP) service that generates interactive mindmap
 * HTML files from Markdown content.
 *
 * 支持通过环境变量配置默认值：
 *
 *   MARKMAP_NOTE_SEPARATOR    单行备注分隔符 (默认: ':')
 *   MARKMAP_NOTE_BLOCK        多行备注块标记 (默认: '>')
 *   MARKMAP_ESCAPE            转义字符 (默认: '\\')
 *   MARKMAP_CDN_BASE          CDN 基础路径
 *   MARKMAP_COLOR_SCHEME      默认配色方案 (默认: 'default')
 *   MARKMAP_THEME             默认主题 (默认: 'light')
 *
 * @packageDocumentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

import type {
  GenerateMindmapInput,
  GenerateMindmapResult,
  McpServerConfig,
  SeparatorConfig,
} from './types.js';
import {
  generateMindmapToolMeta,
  validateGenerateMindmapInput,
  createSuccessResult,
  createErrorResult,
} from './tools.js';

// Re-export types
export * from './types.js';
export * from './tools.js';

/**
 * Server configuration
 */
const SERVER_CONFIG: McpServerConfig = {
  name: 'markmap-mcp-service',
  version: '0.1.0',
};

/**
 * 从环境变量获取默认配置
 */
function getDefaultConfig(): {
  separators: SeparatorConfig;
  cdnBase?: string;
  colorScheme?: string;
  theme?: 'light' | 'dark';
} {
  return {
    separators: {
      note: process.env.MARKMAP_NOTE_SEPARATOR || ':',
      noteBlock: process.env.MARKMAP_NOTE_BLOCK || '>',
      escape: process.env.MARKMAP_ESCAPE || '\\',
    },
    cdnBase: process.env.MARKMAP_CDN_BASE || undefined,
    colorScheme: process.env.MARKMAP_COLOR_SCHEME || undefined,
    theme: process.env.MARKMAP_THEME as 'light' | 'dark' | undefined,
  };
}

// 获取默认配置（启动时解析一次）
const DEFAULT_CONFIG = getDefaultConfig();

/**
 * Generate mindmap HTML file from Markdown content
 */
async function generateMindmap(
  input: GenerateMindmapInput,
): Promise<GenerateMindmapResult> {
  try {
    // Dynamically import the HTML generator to avoid bundling issues
    const { generateStandaloneHTML } = await import('markmap-html-generator');

    // 合并默认配置和输入配置（输入优先）
    const mergedSeparators = {
      ...DEFAULT_CONFIG.separators,
      ...input.separators,
    };

    // Generate HTML content with all options
    // 默认使用本地打包模式，包含完整功能（右键菜单等）
    const html = generateStandaloneHTML(input.markdown, {
      title: input.title,
      colorScheme:
        input.colorScheme ||
        (DEFAULT_CONFIG.colorScheme as
          | 'default'
          | 'ocean'
          | 'forest'
          | 'sunset'
          | 'monochrome'
          | undefined),
      enableEdit: input.enableEdit ?? true,
      theme: input.theme || DEFAULT_CONFIG.theme || 'light',
      cdnBase: input.cdnBase || DEFAULT_CONFIG.cdnBase,
      separators: mergedSeparators,
      useLocalBundle: true, // 使用本地打包，包含右键菜单等完整功能
    });

    // Ensure output directory exists
    const outputDir = path.dirname(input.outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write HTML file
    await fs.writeFile(input.outputPath, html, 'utf-8');

    return createSuccessResult(input.outputPath);
  } catch (error) {
    return createErrorResult(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_CONFIG.name,
      version: SERVER_CONFIG.version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: generateMindmapToolMeta.name,
          description: generateMindmapToolMeta.description,
          inputSchema: {
            type: 'object',
            properties: {
              markdown: {
                type: 'string',
                description: 'Markdown 内容',
              },
              outputPath: {
                type: 'string',
                description: '输出 HTML 文件路径',
              },
              title: {
                type: 'string',
                description: "思维导图标题 (default: 'Mindmap')",
              },
              colorScheme: {
                type: 'string',
                description: "配色方案 (default: 'default')",
                enum: ['default', 'ocean', 'forest', 'sunset', 'monochrome'],
              },
              enableEdit: {
                type: 'boolean',
                description: '启用编辑模式 (default: true)',
              },
              theme: {
                type: 'string',
                description: "主题 (default: 'light')",
                enum: ['light', 'dark'],
              },
              cdnBase: {
                type: 'string',
                description:
                  "CDN 基础路径 (default: 'https://cdn.jsdelivr.net/npm')",
              },
              separators: {
                type: 'object',
                description: '分隔符配置',
                properties: {
                  note: {
                    type: 'string',
                    description: "单行备注分隔符 (default: ':')",
                  },
                  noteBlock: {
                    type: 'string',
                    description: "多行备注块标记 (default: '>')",
                  },
                  escape: {
                    type: 'string',
                    description: "转义字符 (default: '\\\\')",
                  },
                },
              },
            },
            required: ['markdown', 'outputPath'],
          },
        },
      ],
    };
  });

  // Handle call tool request
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;

      if (name === generateMindmapToolMeta.name) {
        try {
          // Validate input
          const input = validateGenerateMindmapInput(args);

          // Generate mindmap
          const result = await generateMindmap(input);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
            isError: !result.success,
          };
        } catch (error) {
          const errorResult = createErrorResult(
            error instanceof Error ? error : new Error(String(error)),
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResult, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      // Unknown tool
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Unknown tool: ${name}`,
              error: `Tool '${name}' is not supported`,
            }),
          },
        ],
        isError: true,
      };
    },
  );

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr to avoid interfering with stdio transport
  console.error(`${SERVER_CONFIG.name} v${SERVER_CONFIG.version} started`);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
