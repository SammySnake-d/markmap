# Test Utilities for markmap-lib

This directory contains utilities for property-based testing using fast-check.

## Overview

Property-based testing (PBT) is a powerful testing approach where you define properties that should hold true for all valid inputs, and the testing framework generates random test cases to verify these properties.

## Files

- **generators.ts**: Arbitrary generators for creating random test data
- **helpers.ts**: Helper functions for test assertions and data manipulation
- **index.ts**: Main export file

## Usage

### Basic Example

```typescript
import fc from 'fast-check';
import { arbMarkdownDocument, countNodes } from './utils';
import { Transformer } from '../src';

test('Property: Parsing preserves node count', () => {
  fc.assert(
    fc.property(
      arbMarkdownDocument(),
      (markdown) => {
        const transformer = new Transformer();
        const result = transformer.transform(markdown);
        
        // Property: number of nodes should match number of list items
        const listItems = markdown.split('\n').filter(line => 
          line.trim().startsWith('-') || line.trim().startsWith('*')
        );
        
        expect(countNodes(result.root)).toBe(listItems.length + 1); // +1 for root
      }
    ),
    { numRuns: 100 } // Run 100 random test cases
  );
});
```

### Available Generators

#### Markdown Generators
- `arbMarkdownText()`: Random text content
- `arbListItem()`: Random list item with - or * prefix
- `arbSimpleMarkdownList()`: Simple flat list
- `arbNestedMarkdownList()`: Nested list with indentation
- `arbMarkdownDocument()`: Complete document with optional frontmatter

#### Note Generators
- `arbMarkdownWithInlineNote()`: List item with inline note (: separator)
- `arbMarkdownWithDetailedNote()`: List item with detailed note (> quote block)

#### Special Character Generators
- `arbTextWithSpecialChars()`: Text with various special characters
- `arbSeparator()`: Random separator characters
- `arbEscapeChar()`: Random escape characters
- `arbTextWithSeparator(sep)`: Text containing a specific separator

### Available Helpers

#### Tree Operations
- `countNodes(node)`: Count total nodes in tree
- `getLeafNodes(node)`: Get all leaf nodes
- `getMaxDepth(node)`: Get maximum depth
- `findNodes(node, predicate)`: Find nodes matching condition
- `areTreesEquivalent(node1, node2)`: Compare tree structures

#### Text Operations
- `normalizeWhitespace(text)`: Normalize whitespace for comparison
- `splitByFirstOccurrence(text, sep)`: Split by first separator
- `hasEscapedSeparator(text, sep, escape)`: Check for escaped separators
- `removeEscapeChars(text, escape)`: Remove escape characters

## Property Testing Best Practices

1. **Define Clear Properties**: Properties should be simple, clear statements about what should always be true
2. **Use Appropriate Generators**: Choose generators that produce valid inputs for your domain
3. **Run Enough Iterations**: Default is 100, but increase for critical properties
4. **Handle Edge Cases**: Ensure generators cover edge cases (empty strings, special characters, etc.)
5. **Keep Tests Fast**: Property tests run many iterations, so keep individual tests fast

## Example Properties

### Round-trip Property
```typescript
// Property: parse(export(data)) === data
fc.assert(
  fc.property(arbMarkdownDocument(), (markdown) => {
    const parsed = parse(markdown);
    const exported = exportToMarkdown(parsed);
    const reparsed = parse(exported);
    expect(reparsed).toEqual(parsed);
  })
);
```

### Invariant Property
```typescript
// Property: node count is preserved after transformation
fc.assert(
  fc.property(arbNodeTree(), (tree) => {
    const before = countNodes(tree);
    const transformed = transform(tree);
    const after = countNodes(transformed);
    expect(after).toBe(before);
  })
);
```

### Idempotence Property
```typescript
// Property: applying operation twice = applying once
fc.assert(
  fc.property(arbMarkdownDocument(), (markdown) => {
    const once = normalize(markdown);
    const twice = normalize(once);
    expect(twice).toBe(once);
  })
);
```
