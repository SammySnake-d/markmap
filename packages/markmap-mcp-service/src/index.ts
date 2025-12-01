/**
 * Markmap MCP Service
 *
 * A Model Context Protocol (MCP) service that generates interactive mindmap
 * HTML files from Markdown content.
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
 * Generate mindmap HTML file from Markdown content
 */
async function generateMindmap(
  input: GenerateMindmapInput,
): Promise<GenerateMindmapResult> {
  try {
    // Dynamically import the HTML generator to avoid bundling issues
    const { generateStandaloneHTML } = await import('markmap-html-generator');

    // Generate HTML content
    const html = generateStandaloneHTML(input.markdown, {
      title: input.title,
      colorScheme: input.colorScheme,
      enableEdit: input.enableEdit ?? true,
      theme: input.theme ?? 'light',
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
                description:
                  'Markdown content with notes (using : separator and > blocks)',
              },
              outputPath: {
                type: 'string',
                description: 'Output HTML file path',
              },
              title: {
                type: 'string',
                description: 'Mindmap title (optional)',
              },
              colorScheme: {
                type: 'string',
                description: 'Color scheme name (optional)',
                enum: ['default', 'ocean', 'forest', 'sunset', 'monochrome'],
              },
              enableEdit: {
                type: 'boolean',
                description: 'Enable edit mode (optional, default: true)',
              },
              theme: {
                type: 'string',
                description: 'Theme (optional, default: light)',
                enum: ['light', 'dark'],
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
