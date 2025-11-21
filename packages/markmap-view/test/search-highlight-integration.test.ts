/**
 * Integration test for search highlight functionality
 * Requirements: 1.2, 1.5
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchManager } from '../src/search-manager';
import type { INode } from 'markmap-common';

describe('Search Highlight Integration', () => {
  let searchManager: SearchManager;

  // Helper function to create test nodes
  const createTestNode = (
    content: string,
    options: {
      inlineNote?: string;
      detailedNote?: string;
    } = {},
  ): INode => {
    return {
      content,
      children: [],
      payload: {
        inlineNote: options.inlineNote,
        detailedNote: options.detailedNote,
      },
      state: {
        id: Math.random(),
        path: '1',
        key: 'test-key',
        depth: 1,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };
  };

  beforeEach(() => {
    searchManager = new SearchManager();
  });

  describe('Search and Highlight Workflow (Requirement 1.2)', () => {
    it('should search and highlight nodes in one workflow', () => {
      const nodes = [
        createTestNode('JavaScript Tutorial'),
        createTestNode('Python Guide'),
        createTestNode('Java Basics'),
      ];

      // Perform search
      const results = searchManager.search('java', nodes);
      expect(results.length).toBe(2);

      // Apply highlights
      searchManager.highlight(results);

      // Verify highlights are applied
      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[1].node.payload?.highlighted).toBe(true);
      expect(nodes[1].payload?.highlighted).toBeFalsy();
    });

    it('should apply CSS class based on highlighted flag', () => {
      const node = createTestNode('JavaScript');

      // Simulate the class generation logic from view.ts
      const getNodeClass = (d: INode) => {
        return [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' ');
      };

      // Before highlight
      expect(getNodeClass(node)).toBe('markmap-node');

      // After highlight
      node.payload = { ...node.payload, highlighted: true };
      expect(getNodeClass(node)).toBe('markmap-node markmap-search-highlight');
    });

    it('should handle multiple search and highlight cycles', () => {
      const nodes = [
        createTestNode('JavaScript Tutorial'),
        createTestNode('Python Guide'),
        createTestNode('Java Basics'),
      ];

      // First search
      const results1 = searchManager.search('java', nodes);
      searchManager.highlight(results1);
      expect(results1[0].node.payload?.highlighted).toBe(true);

      // Clear and second search
      searchManager.clear();
      const results2 = searchManager.search('python', nodes);
      searchManager.highlight(results2);

      // Verify first results are cleared
      expect(results1[0].node.payload?.highlighted).toBe(false);
      // Verify second results are highlighted
      expect(results2[0].node.payload?.highlighted).toBe(true);
    });

    it('should preserve node structure when highlighting', () => {
      const nodes = [
        createTestNode('JavaScript', {
          inlineNote: 'Test note',
        }),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      // Verify node structure is preserved
      expect(results[0].node.content).toBe('JavaScript');
      expect(results[0].node.payload?.inlineNote).toBe('Test note');
      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[0].node.children).toEqual([]);
    });
  });

  describe('Clear Highlight Workflow (Requirement 1.5)', () => {
    it('should clear highlights when clearing search', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      // Search and highlight
      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);
      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[1].node.payload?.highlighted).toBe(true);

      // Clear search
      searchManager.clear();

      // Verify highlights are removed
      expect(results[0].node.payload?.highlighted).toBe(false);
      expect(results[1].node.payload?.highlighted).toBe(false);
    });

    it('should remove CSS class when highlight is cleared', () => {
      const node = createTestNode('JavaScript');

      // Simulate the class generation logic from view.ts
      const getNodeClass = (d: INode) => {
        return [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' ');
      };

      // Highlight
      node.payload = { ...node.payload, highlighted: true };
      expect(getNodeClass(node)).toContain('markmap-search-highlight');

      // Clear highlight
      node.payload = { ...node.payload, highlighted: false };
      expect(getNodeClass(node)).not.toContain('markmap-search-highlight');
      expect(getNodeClass(node)).toBe('markmap-node');
    });

    it('should allow re-highlighting after clear', () => {
      const nodes = [createTestNode('JavaScript')];

      // First cycle
      const results1 = searchManager.search('javascript', nodes);
      searchManager.highlight(results1);
      expect(results1[0].node.payload?.highlighted).toBe(true);

      // Clear
      searchManager.clear();
      expect(results1[0].node.payload?.highlighted).toBe(false);

      // Second cycle
      const results2 = searchManager.search('javascript', nodes);
      searchManager.highlight(results2);
      expect(results2[0].node.payload?.highlighted).toBe(true);
    });
  });

  describe('Navigation with Highlight', () => {
    it('should maintain highlights during navigation', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('JavaScript 3'),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      // Navigate through results
      searchManager.next();
      searchManager.next();
      searchManager.previous();

      // All results should still be highlighted
      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[1].node.payload?.highlighted).toBe(true);
      expect(results[2].node.payload?.highlighted).toBe(true);
    });

    it('should highlight current result differently if needed', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      // Get current result
      const current = searchManager.getCurrent();
      expect(current).not.toBeNull();
      expect(current?.node.payload?.highlighted).toBe(true);

      // Navigate to next
      const next = searchManager.next();
      expect(next?.node.payload?.highlighted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle highlighting with no results', () => {
      const nodes = [createTestNode('Python')];

      const results = searchManager.search('javascript', nodes);
      expect(results.length).toBe(0);

      // Should not throw when highlighting empty results
      expect(() => searchManager.highlight(results)).not.toThrow();
    });

    it('should handle clearing highlights with no results', () => {
      expect(() => searchManager.clearHighlight()).not.toThrow();
    });

    it('should handle nodes with complex payload', () => {
      const node: INode = {
        content: 'JavaScript',
        children: [],
        payload: {
          fold: 1,
          inlineNote: 'Note',
          detailedNote: 'Details',
          customProp: 'custom',
        },
        state: {
          id: 1,
          path: '1',
          key: 'test',
          depth: 1,
          size: [100, 50],
          rect: { x: 0, y: 0, width: 100, height: 50 },
        },
      };

      const results = searchManager.search('javascript', [node]);
      searchManager.highlight(results);

      // Verify all properties are preserved
      expect(node.payload?.fold).toBe(1);
      expect(node.payload?.inlineNote).toBe('Note');
      expect(node.payload?.detailedNote).toBe('Details');
      expect(node.payload?.customProp).toBe('custom');
      expect(node.payload?.highlighted).toBe(true);
    });

    it('should handle highlighting nodes with children', () => {
      const parent: INode = {
        content: 'JavaScript Parent',
        children: [
          {
            content: 'Child 1',
            children: [],
            payload: {},
            state: {
              id: 2,
              path: '1.1',
              key: 'test-2',
              depth: 2,
              size: [100, 50],
              rect: { x: 0, y: 0, width: 100, height: 50 },
            },
          },
        ],
        payload: {},
        state: {
          id: 1,
          path: '1',
          key: 'test-1',
          depth: 1,
          size: [100, 50],
          rect: { x: 0, y: 0, width: 100, height: 50 },
        },
      };

      const results = searchManager.search('javascript', [parent]);
      searchManager.highlight(results);

      // Parent should be highlighted
      expect(parent.payload?.highlighted).toBe(true);
      // Children should not be affected
      expect(parent.children[0].payload?.highlighted).toBeFalsy();
    });
  });

  describe('CSS Class Generation', () => {
    it('should generate correct class for normal node', () => {
      const node = createTestNode('Test');

      const getNodeClass = (d: INode) => {
        return [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' ');
      };

      expect(getNodeClass(node)).toBe('markmap-node');
    });

    it('should generate correct class for folded node', () => {
      const node = createTestNode('Test');
      node.payload = { ...node.payload, fold: 1 };

      const getNodeClass = (d: INode) => {
        return [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' ');
      };

      expect(getNodeClass(node)).toBe('markmap-node markmap-fold');
    });

    it('should generate correct class for highlighted node', () => {
      const node = createTestNode('Test');
      node.payload = { ...node.payload, highlighted: true };

      const getNodeClass = (d: INode) => {
        return [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' ');
      };

      expect(getNodeClass(node)).toBe('markmap-node markmap-search-highlight');
    });

    it('should generate correct class for folded and highlighted node', () => {
      const node = createTestNode('Test');
      node.payload = { ...node.payload, fold: 1, highlighted: true };

      const getNodeClass = (d: INode) => {
        return [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' ');
      };

      expect(getNodeClass(node)).toBe(
        'markmap-node markmap-fold markmap-search-highlight',
      );
    });
  });
});
