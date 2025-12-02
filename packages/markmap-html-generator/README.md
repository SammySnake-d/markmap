# markmap-html-generator

Generate standalone HTML files from Markdown mindmaps.

## Features

- Generate self-contained HTML files with all CSS and JavaScript inlined
- No external dependencies required to view generated files (uses CDN for core libraries)
- Full support for all markmap-enhanced features:
  - 🔍 Search functionality (Cmd/Ctrl + F)
  - ✏️ Note editing with auto-save
  - 📤 Export (PNG, JPG, SVG, Markdown)
  - 🖱️ Canvas interactions (zoom, pan, click)
  - 🎨 Color themes (default, ocean, forest, sunset, monochrome)
  - 📱 Mobile support with touch gestures
  - ↩️ Undo/Redo (Cmd/Ctrl + Z / Cmd/Ctrl + Shift + Z)
  - 💾 localStorage persistence

## Installation

```bash
pnpm add markmap-html-generator
```

## Quick Start

```typescript
import { generateStandaloneHTML } from 'markmap-html-generator';

const markdown = `
# My Mindmap
- Topic 1: This is an inline note
  - Subtopic 1.1
  - Subtopic 1.2
- Topic 2
  > This is a detailed note
  > It can span multiple lines
`;

const html = generateStandaloneHTML(markdown, {
  title: 'My Mindmap',
  colorScheme: 'default',
  enableEdit: true,
  theme: 'light'
});

// Save to file
fs.writeFileSync('mindmap.html', html);
```

## API Reference

### generateStandaloneHTML(markdown, options?)

Generates a standalone HTML file from Markdown content.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `markdown` | `string` | The Markdown content to convert |
| `options` | `HTMLGeneratorOptions` | Optional configuration |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `'Mindmap'` | Page title |
| `colorScheme` | `string` | `'default'` | Color scheme name |
| `enableEdit` | `boolean` | `true` | Enable editing mode |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme mode |
| `minify` | `boolean` | `true` | Minify CSS and JavaScript |
| `cdnBase` | `string` | `'https://cdn.jsdelivr.net/npm'` | Custom CDN base URL |
| `separators` | `object` | See below | Custom separator configuration |

#### Separators Configuration

```typescript
{
  node: '-',      // Node separator (default: '-' or '*')
  note: ':',      // Note separator (default: ':')
  noteBlock: '>', // Note block marker (default: '>')
  escape: '\\'    // Escape character (default: '\\')
}
```

#### Returns

- `string`: Complete HTML document as a string

### generateHTML(markdown, options?)

Generates HTML with detailed result information including warnings.

#### Returns

```typescript
{
  html: string;      // Generated HTML content
  warnings?: string[]; // Any warnings during generation
}
```

## Examples

### Basic Usage

```typescript
import { generateStandaloneHTML } from 'markmap-html-generator';

const html = generateStandaloneHTML('# Root\n- Item 1\n- Item 2');
```

### Dark Theme

```typescript
const html = generateStandaloneHTML(markdown, {
  title: 'Dark Mindmap',
  theme: 'dark',
  colorScheme: 'default'
});
```

### Read-Only Mode

```typescript
const html = generateStandaloneHTML(markdown, {
  title: 'Read-Only Mindmap',
  enableEdit: false
});
```

### Custom Separators

```typescript
const markdown = `# Project
- Task 1 | This is a note using pipe separator
  # Detailed note using hash
  # Multiple lines supported`;

const html = generateStandaloneHTML(markdown, {
  separators: {
    note: '|',
    noteBlock: '#'
  }
});
```

### With Warnings Check

```typescript
import { generateHTML } from 'markmap-html-generator';

const result = generateHTML(markdown);
if (result.warnings) {
  console.warn('Warnings:', result.warnings);
}
fs.writeFileSync('mindmap.html', result.html);
```

## Markdown Format

### Basic Structure

```markdown
# Root Node
- Level 1 Item
  - Level 2 Item
    - Level 3 Item
```

### Inline Notes

Use colon (`:`) to add inline notes:

```markdown
- Item: This is an inline note
```

### Detailed Notes

Use blockquote (`>`) for detailed notes:

```markdown
- Item
  > This is a detailed note
  > It can span multiple lines
  > And supports **Markdown** formatting
```

### Combined Notes

```markdown
- Item: Inline note here
  > Detailed note
  > With more content
```

## Generated HTML Features

The generated HTML includes:

1. **Search** - Press Cmd/Ctrl + F to search nodes
2. **Zoom/Pan** - Mouse wheel to zoom, Space + drag to pan
3. **Expand/Collapse** - Click nodes or use toolbar buttons
4. **Export** - PNG, JPG, SVG, and Markdown formats
5. **Color Themes** - Switch between predefined color schemes
6. **Dark Mode** - Toggle between light and dark themes
7. **Undo/Redo** - Cmd/Ctrl + Z / Cmd/Ctrl + Shift + Z
8. **Auto-Save** - Changes saved to localStorage automatically

## Global API

The generated HTML exposes these global functions:

```javascript
// Export functions
window.exportMarkmapAsPNG();
window.exportMarkmapAsJPG();
window.exportMarkmapAsSVG();
window.exportMarkmapAsMarkdown();

// Content management (when enableEdit: true)
window.saveMarkmapContent(newMarkdown);
window.updateMarkmapContent(newMarkdown);
window.getMarkmapContent();

// Markmap instance
window.mm; // The Markmap instance
window.markmapTransformer; // The Transformer instance
```

## Running Examples

```bash
# Navigate to the package
cd packages/markmap-html-generator

# Generate sample HTML files
npx ts-node examples/generate-samples.ts

# Open generated files in browser
open examples/output/sample-default.html
```

## License

MIT
