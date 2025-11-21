# Test Framework Setup Complete

## Overview

The property-based testing framework has been successfully configured for the markmap project using fast-check v4.3.0.

## What Was Added

### 1. Dependencies
- **fast-check@^4.3.0**: Added to root package.json as a dev dependency
- Installed via pnpm and available to all workspace packages

### 2. Test Utilities for markmap-lib

Located in `packages/markmap-lib/test/utils/`:

#### Generators (`generators.ts`)
- `arbMarkdownText()`: Random markdown text content
- `arbListItem()`: Random list items with - or * prefix
- `arbSimpleMarkdownList()`: Simple flat markdown lists
- `arbNestedMarkdownList()`: Nested lists with indentation
- `arbMarkdownWithInlineNote()`: Lists with inline notes (: separator)
- `arbMarkdownWithDetailedNote()`: Lists with detailed notes (> blocks)
- `arbTextWithSpecialChars()`: Text with special characters
- `arbSeparator()`: Random separator characters
- `arbEscapeChar()`: Random escape characters
- `arbFrontmatter()`: Valid markdown frontmatter
- `arbMarkdownDocument()`: Complete markdown documents

#### Helpers (`helpers.ts`)
- `countNodes()`: Count total nodes in a tree
- `getLeafNodes()`: Get all leaf nodes
- `getMaxDepth()`: Get maximum tree depth
- `findNodes()`: Find nodes matching a predicate
- `areTreesEquivalent()`: Compare tree structures
- `extractAllText()`: Extract all text from a tree
- `normalizeWhitespace()`: Normalize whitespace for comparison
- `splitByFirstOccurrence()`: Split text by first separator
- `hasEscapedSeparator()`: Check for escaped separators
- `removeEscapeChars()`: Remove escape characters

### 3. Test Utilities for markmap-view

Located in `packages/markmap-view/test/utils/`:

#### Generators (`generators.ts`)
- `arbNodeContent()`: Random node content
- `arbNodeDepth()`: Random node depth
- `arbLeafNode()`: Single node without children
- `arbNodeTree()`: Tree structure with random nodes
- `arbNodeWithNote()`: Nodes with inline/detailed notes
- `arbColor()`: Random hex colors
- `arbColorScheme()`: Arrays of colors for themes
- `arbCoordinates()`: Random x,y coordinates
- `arbZoomLevel()`: Random zoom levels
- `arbSearchKeyword()`: Random search terms
- `arbTouchCoordinates()`: Touch event coordinates
- `arbViewportDimensions()`: Random viewport dimensions

#### Helpers (`helpers.ts`)
- `createMockSVG()`: Create mock SVG elements for testing
- `countVisibleNodes()`: Count non-collapsed nodes
- `getCollapsedNodes()`: Get all collapsed nodes
- `getExpandedNodes()`: Get all expanded nodes
- `areAllDescendantsCollapsed()`: Check if all children collapsed
- `areAllDescendantsExpanded()`: Check if all children expanded
- `searchNodes()`: Find nodes containing keyword
- `calculateDistance()`: Distance between points
- `isValidHexColor()`: Validate hex color format
- `applyColorScheme()`: Apply colors to tree
- `cloneNodeTree()`: Deep clone a tree
- `getNodePath()`: Get path from root to node
- `isPointInViewport()`: Check if point is visible

### 4. Documentation
- `packages/markmap-lib/test/utils/README.md`: Comprehensive guide for markmap-lib testing
- `packages/markmap-view/test/utils/README.md`: Comprehensive guide for markmap-view testing
- Both include usage examples, best practices, and property testing patterns

### 5. Example Tests
- `packages/markmap-lib/test/property-test-example.test.ts`: Working examples demonstrating:
  - Idempotence properties
  - Parsing properties
  - Integration with vitest

## Verification

All tests pass successfully:
```bash
pnpm vitest --run
```

Results:
- ✓ markmap-html-parser: 4 tests
- ✓ markmap-lib: 14 tests (including 3 property-based examples)
- ✓ Total: 18 tests passed

## Usage

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm vitest

# Run tests for specific package
pnpm vitest packages/markmap-lib
```

### Writing Property Tests

```typescript
import fc from 'fast-check';
import { expect, test } from 'vitest';
import { arbMarkdownDocument } from './utils';

test('Property: Your property description', () => {
  fc.assert(
    fc.property(
      arbMarkdownDocument(),
      (markdown) => {
        // Your test logic here
        expect(something).toBe(expected);
      }
    ),
    { numRuns: 100 } // Run 100 random test cases
  );
});
```

## Next Steps

The test framework is now ready for implementing property-based tests for:
1. Note parsing round-trip (Property 1)
2. Escape character round-trip (Property 2)
3. Search result completeness (Property 3)
4. Expand/collapse operations (Properties 4 & 5)
5. Markdown export hierarchy (Property 6)
6. Note icon display (Property 7)
7. Custom separator application (Property 8)
8. Multi-line note format preservation (Property 9)
9. Undo/redo reversibility (Property 10)

## Configuration Details

- **Package Manager**: pnpm
- **Test Framework**: Vitest 3.2.3
- **Property Testing**: fast-check 4.3.0
- **TypeScript**: 5.8.3
- **Node Version**: >=22

## Files Created

```
markmap/
├── package.json (updated with fast-check)
├── TEST_FRAMEWORK_SETUP.md (this file)
└── packages/
    ├── markmap-lib/
    │   └── test/
    │       ├── property-test-example.test.ts
    │       └── utils/
    │           ├── index.ts
    │           ├── generators.ts
    │           ├── helpers.ts
    │           └── README.md
    └── markmap-view/
        └── test/
            └── utils/
                ├── index.ts
                ├── generators.ts
                ├── helpers.ts
                └── README.md
```
