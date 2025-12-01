# markmap-mcp-service

A Model Context Protocol (MCP) service for generating interactive mindmap HTML files from Markdown content.

## Overview

This package provides an MCP server that exposes a `generate_mindmap` tool. The tool accepts Markdown content and generates a standalone HTML file containing an interactive mindmap visualization.

## Features

- 🎯 **MCP Compatible** - Works with any MCP-compatible client (Kiro, Claude Desktop, etc.)
- 📝 **Markdown Input** - Accepts standard Markdown with enhanced note syntax
- 🎨 **Multiple Themes** - 5 built-in color schemes + light/dark mode
- 📤 **Standalone Output** - Generated HTML files work offline
- ✏️ **Edit Mode** - Optional in-browser editing support
- 🔍 **Search** - Built-in search functionality in generated files
- 📱 **Mobile Support** - Touch gestures for pan and zoom

## Installation

```bash
# Using pnpm (recommended)
pnpm add markmap-mcp-service

# Using npm
npm install markmap-mcp-service

# Using yarn
yarn add markmap-mcp-service
```

## Quick Start

### 1. Configure MCP Client

Add the service to your MCP client configuration:

**For Kiro/Claude Desktop:**

```json
{
  "mcpServers": {
    "markmap": {
      "command": "node",
      "args": ["path/to/node_modules/markmap-mcp-service/dist/index.js"]
    }
  }
}
```

**If installed globally:**

```json
{
  "mcpServers": {
    "markmap": {
      "command": "markmap-mcp"
    }
  }
}
```

### 2. Use the Tool

Once configured, you can use the `generate_mindmap` tool to create mindmap HTML files from Markdown content.

## Tool Reference

### generate_mindmap

Generate an interactive mindmap HTML file from Markdown.

#### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `markdown` | string | ✅ Yes | - | Markdown content with notes |
| `outputPath` | string | ✅ Yes | - | Output HTML file path |
| `title` | string | No | "Mindmap" | Page title |
| `colorScheme` | string | No | "default" | Color scheme name |
| `enableEdit` | boolean | No | `true` | Enable edit mode |
| `theme` | string | No | "light" | Theme mode |

#### Color Schemes

| Name | Description |
|------|-------------|
| `default` | Default blue-purple gradient |
| `ocean` | Blue-green ocean tones |
| `forest` | Green nature tones |
| `sunset` | Warm orange-red tones |
| `monochrome` | Grayscale |

#### Theme Options

| Value | Description |
|-------|-------------|
| `light` | Light background (default) |
| `dark` | Dark background |

#### Output Format

**Success Response:**
```json
{
  "success": true,
  "filePath": "./output/mindmap.html",
  "message": "Mindmap generated successfully at ./output/mindmap.html"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to generate mindmap: [error details]",
  "error": "[error details]"
}
```

## Markdown Format

The service supports enhanced Markdown with note syntax:

### Basic Structure

```markdown
# Main Topic

- Node 1
  - Child 1.1
  - Child 1.2
- Node 2
  - Child 2.1
```

### Inline Notes (using `:`)

Add brief notes after a colon:

```markdown
- Node content: This is an inline note
- Another node: Brief description here
```

### Detailed Notes (using `>`)

Add multi-line detailed notes using blockquotes:

```markdown
- Node content
  > This is a detailed note
  > It can span multiple lines
  > And supports **Markdown** formatting
```

### Mixed Notes

Combine both inline and detailed notes:

```markdown
- Node content: Brief inline note
  > Detailed explanation here
  > With more information
```

### Escape Characters

Use backslash to escape special characters:

```markdown
- Node with \: colon in content
- Another node: Note with \: escaped colon
```

## Examples

### Basic Example

```json
{
  "markdown": "# My Project\n\n- Feature 1\n  - Sub-feature 1.1\n  - Sub-feature 1.2\n- Feature 2",
  "outputPath": "./output/project.html"
}
```

### Full Example with All Options

```json
{
  "markdown": "# AI Learning Path\n\n- Basics: Foundation knowledge\n  - Math\n    - Linear Algebra\n    - Statistics\n  - Programming\n    - Python\n    - NumPy\n- Machine Learning\n  > Core ML concepts\n  > Supervised and unsupervised learning\n  - Regression\n  - Classification",
  "outputPath": "./output/ai-learning.html",
  "title": "AI Learning Path",
  "colorScheme": "ocean",
  "enableEdit": true,
  "theme": "light"
}
```

### Read-Only Example

```json
{
  "markdown": "# Documentation\n\n- Chapter 1\n- Chapter 2",
  "outputPath": "./docs/overview.html",
  "title": "Documentation Overview",
  "enableEdit": false
}
```

## Generated HTML Features

The generated HTML files include:

| Feature | Description |
|---------|-------------|
| 🔍 **Search** | Find nodes by content or notes (Cmd/Ctrl + F) |
| 📝 **Edit Mode** | Edit notes directly in the browser |
| 🎨 **Color Themes** | Switch between color schemes |
| 📤 **Export** | Export as PNG, JPG, SVG, or Markdown |
| 📱 **Mobile Support** | Touch gestures for pan and zoom |
| 💾 **Auto-save** | Changes saved to localStorage |
| ⌨️ **Keyboard Shortcuts** | Undo (Cmd/Ctrl+Z), Redo (Cmd/Ctrl+Shift+Z) |
| 🖱️ **Canvas Controls** | Scroll to zoom, Space+drag to pan |

## API Usage (Programmatic)

You can also use the service programmatically:

```typescript
import { generateStandaloneHTML } from 'markmap-html-generator';
import * as fs from 'fs';

const markdown = `# My Mindmap
- Topic 1: Note
- Topic 2`;

const html = generateStandaloneHTML(markdown, {
  title: 'My Mindmap',
  colorScheme: 'ocean',
  enableEdit: true,
  theme: 'light',
});

fs.writeFileSync('./output/mindmap.html', html);
```

## Error Handling

The service handles various error conditions:

| Error Type | Description | Response |
|------------|-------------|----------|
| Missing required fields | `markdown` or `outputPath` not provided | Validation error |
| Invalid color scheme | Unknown color scheme name | Validation error |
| Invalid theme | Theme not "light" or "dark" | Validation error |
| File write error | Cannot write to output path | File system error |
| Parse error | Invalid Markdown format | Parse error |

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Start server (for testing)
pnpm start
```

## Requirements

- Node.js >= 18
- markmap-html-generator (peer dependency)

## License

MIT

## Related Packages

- [markmap-html-generator](../markmap-html-generator) - HTML generation library
- [markmap-lib](../markmap-lib) - Markdown parsing library
- [markmap-view](../markmap-view) - Visualization library
