# Test Utilities for markmap-view

This directory contains utilities for property-based testing of the markmap-view package using fast-check.

## Overview

These utilities help test the visualization and interaction features of markmap, including rendering, search, expand/collapse, and color schemes.

## Files

- **generators.ts**: Arbitrary generators for creating random test data
- **helpers.ts**: Helper functions for test assertions and DOM manipulation
- **index.ts**: Main export file

## Usage

### Basic Example

```typescript
import fc from 'fast-check';
import { arbNodeTree, countVisibleNodes } from './utils';
import { Markmap } from '../src';

test('Property: Expanding all nodes makes all nodes visible', () => {
  fc.assert(
    fc.property(
      arbNodeTree(),
      (tree) => {
        const markmap = new Markmap(createMockSVG());
        markmap.setData(tree);
        
        markmap.expandAll();
        
        // Property: all nodes should be visible after expand all
        const totalNodes = countNodes(tree);
        const visibleNodes = countVisibleNodes(tree);
        expect(visibleNodes).toBe(totalNodes);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Available Generators

#### Node Generators
- `arbNodeContent()`: Random node content text
- `arbNodeDepth()`: Random node depth (0-10)
- `arbLeafNode()`: Single node without children
- `arbNodeTree(maxDepth)`: Tree structure with random nodes
- `arbNodeWithNote()`: Node with inline/detailed notes

#### Visual Generators
- `arbColor()`: Random hex color
- `arbColorScheme()`: Array of colors for themes
- `arbCoordinates()`: Random x,y coordinates
- `arbZoomLevel()`: Random zoom level (0.1-5.0)
- `arbViewportDimensions()`: Random viewport width/height

#### Interaction Generators
- `arbSearchKeyword()`: Random search term
- `arbTouchCoordinates()`: Touch event coordinates (for mobile)

### Available Helpers

#### Node State Operations
- `countVisibleNodes(node)`: Count non-collapsed nodes
- `getCollapsedNodes(node)`: Get all collapsed nodes
- `getExpandedNodes(node)`: Get all expanded nodes
- `areAllDescendantsCollapsed(node)`: Check if all children collapsed
- `areAllDescendantsExpanded(node)`: Check if all children expanded

#### Search Operations
- `searchNodes(node, keyword)`: Find nodes containing keyword

#### Visual Operations
- `isValidHexColor(color)`: Validate hex color format
- `applyColorScheme(node, colors)`: Apply colors to tree
- `calculateDistance(p1, p2)`: Distance between points
- `isPointInViewport(point, viewport)`: Check if point is visible

#### Tree Operations
- `cloneNodeTree(node)`: Deep clone a tree
- `getNodePath(root, target)`: Get path from root to node

#### DOM Operations
- `createMockSVG()`: Create mock SVG element for testing

## Example Properties

### Expand/Collapse Property
```typescript
// Property: expand then collapse returns to original state
fc.assert(
  fc.property(arbNodeTree(), (tree) => {
    const original = cloneNodeTree(tree);
    
    expandAll(tree);
    collapseAll(tree);
    
    expect(areTreesEquivalent(tree, original)).toBe(true);
  })
);
```

### Search Property
```typescript
// Property: all search results contain the keyword
fc.assert(
  fc.property(
    arbNodeTree(),
    arbSearchKeyword(),
    (tree, keyword) => {
      const results = searchNodes(tree, keyword);
      
      results.forEach(node => {
        expect(node.content.toLowerCase()).toContain(keyword.toLowerCase());
      });
    }
  )
);
```

### Color Scheme Property
```typescript
// Property: color scheme is applied consistently by depth
fc.assert(
  fc.property(
    arbNodeTree(),
    arbColorScheme(),
    (tree, colors) => {
      const colored = applyColorScheme(tree, colors);
      
      // All nodes at same depth should have same color
      const nodesByDepth = groupNodesByDepth(colored);
      nodesByDepth.forEach((nodes, depth) => {
        const expectedColor = colors[depth % colors.length];
        nodes.forEach(node => {
          expect(node.color).toBe(expectedColor);
        });
      });
    }
  )
);
```

## Testing Best Practices

1. **Mock DOM Elements**: Use `createMockSVG()` for tests that need SVG elements
2. **Test State Transitions**: Verify state before and after operations
3. **Test Invariants**: Properties that should always hold (e.g., node count)
4. **Test Idempotence**: Operations that should have same effect when repeated
5. **Test Round-trips**: Operations with inverses (expand/collapse, zoom in/out)
