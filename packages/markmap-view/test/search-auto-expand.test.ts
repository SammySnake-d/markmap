/**
 * Unit tests for auto-expand functionality in SearchManager
 * Requirements: 1.3
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchManager } from '../src/search-manager';
import type { INode } from 'markmap-common';

describe('SearchManager - Auto Expand', () => {
  let searchManager: SearchManager;

  // Helper function to create test nodes with state
  const createTestNode = (
    id: number,
    content: string,
    options: {
      inlineNote?: string;
      detailedNote?: string;
      fold?: number;
      children?: INode[];
    } = {},
  ): INode => {
    return {
      content,
      children: options.children || [],
      payload: {
        inlineNote: options.inlineNote,
        detailedNote: options.detailedNote,
        fold: options.fold,
      },
      state: {
        id,
        path: `${id}`,
        key: `test-key-${id}`,
        depth: 1,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };
  };

  beforeEach(() => {
    searchManager = new SearchManager();
  });

  describe('Auto-expand functionality (Requirement 1.3)', () => {
    it('should expand parent node when child matches search', () => {
      // Create a tree structure
      const child = createTestNode(2, 'JavaScript Tutorial');
      const parent = createTestNode(1, 'Programming', {
        fold: 1, // Folded
        children: [child],
      });

      // Search for keyword in child
      const results = searchManager.search('javascript', [parent, child]);
      expect(results.length).toBe(1);
      expect(results[0].node).toBe(child);

      // Expand result nodes
      searchManager.expandResultNodes(parent);

      // Parent should now be expanded
      expect(parent.payload?.fold).toBe(0);
    });

    it('should expand multiple levels of ancestors', () => {
      // Create a 3-level tree
      const grandchild = createTestNode(3, 'JavaScript Tutorial');
      const child = createTestNode(2, 'Web Development', {
        fold: 1,
        children: [grandchild],
      });
      const parent = createTestNode(1, 'Programming', {
        fold: 1,
        children: [child],
      });

      // Search for keyword in grandchild
      const results = searchManager.search('javascript', [
        parent,
        child,
        grandchild,
      ]);
      expect(results.length).toBe(1);

      // Expand result nodes
      searchManager.expandResultNodes(parent);

      // Both parent and child should be expanded
      expect(parent.payload?.fold).toBe(0);
      expect(child.payload?.fold).toBe(0);
    });

    it('should not affect nodes that are already expanded', () => {
      const child = createTestNode(2, 'JavaScript Tutorial');
      const parent = createTestNode(1, 'Programming', {
        fold: 0, // Already expanded
        children: [child],
      });

      searchManager.search('javascript', [parent, child]);
      searchManager.expandResultNodes(parent);

      // Parent should remain expanded
      expect(parent.payload?.fold).toBe(0);
    });

    it('should handle multiple search results with different ancestors', () => {
      // Create two separate branches
      const child1 = createTestNode(2, 'JavaScript Tutorial');
      const parent1 = createTestNode(1, 'Frontend', {
        fold: 1,
        children: [child1],
      });

      const child2 = createTestNode(4, 'Java Basics');
      const parent2 = createTestNode(3, 'Backend', {
        fold: 1,
        children: [child2],
      });

      const root = createTestNode(0, 'Programming', {
        children: [parent1, parent2],
      });

      // Search for 'java' which matches both children
      const results = searchManager.search('java', [
        root,
        parent1,
        child1,
        parent2,
        child2,
      ]);
      expect(results.length).toBe(2);

      // Expand result nodes
      searchManager.expandResultNodes(root);

      // Both parents should be expanded
      expect(parent1.payload?.fold).toBe(0);
      expect(parent2.payload?.fold).toBe(0);
    });

    it('should handle search results at root level', () => {
      const root = createTestNode(1, 'JavaScript Tutorial');

      const results = searchManager.search('javascript', [root]);
      expect(results.length).toBe(1);

      // Should not throw when expanding root-level results
      expect(() => searchManager.expandResultNodes(root)).not.toThrow();
    });

    it('should handle empty search results', () => {
      const child = createTestNode(2, 'Python Tutorial');
      const parent = createTestNode(1, 'Programming', {
        fold: 1,
        children: [child],
      });

      // Search for non-existent keyword
      const results = searchManager.search('javascript', [parent, child]);
      expect(results.length).toBe(0);

      // Should not throw and should not modify any nodes
      expect(() => searchManager.expandResultNodes(parent)).not.toThrow();
      expect(parent.payload?.fold).toBe(1); // Still folded
    });

    it('should handle nodes without state', () => {
      const nodeWithoutState: INode = {
        content: 'JavaScript',
        children: [],
        payload: {},
        // No state property
      };

      const results = searchManager.search('javascript', [nodeWithoutState]);
      expect(results.length).toBe(1);
      expect(results[0].node).toBe(nodeWithoutState);

      // Should not throw
      expect(() =>
        searchManager.expandResultNodes(nodeWithoutState),
      ).not.toThrow();
    });

    it('should handle nodes without state.id', () => {
      const nodeWithoutId: INode = {
        content: 'JavaScript',
        children: [],
        payload: {},
        state: {
          // No id property
          path: '1',
          key: 'test',
          depth: 1,
          size: [100, 50],
          rect: { x: 0, y: 0, width: 100, height: 50 },
        } as any,
      };

      const results = searchManager.search('javascript', [nodeWithoutId]);
      expect(results.length).toBe(1);
      expect(results[0].node).toBe(nodeWithoutId);

      // Should not throw
      expect(() =>
        searchManager.expandResultNodes(nodeWithoutId),
      ).not.toThrow();
    });

    it('should only expand ancestors, not siblings', () => {
      // Create a tree with siblings
      const target = createTestNode(3, 'JavaScript Tutorial');
      const sibling = createTestNode(4, 'Python Guide');

      const parent = createTestNode(2, 'Tutorials', {
        fold: 1,
        children: [target, sibling],
      });

      const root = createTestNode(1, 'Programming', {
        children: [parent],
      });

      // Search for JavaScript
      const results = searchManager.search('javascript', [
        root,
        parent,
        target,
        sibling,
      ]);
      expect(results.length).toBe(1);

      // Expand result nodes
      searchManager.expandResultNodes(root);

      // Parent should be expanded
      expect(parent.payload?.fold).toBe(0);

      // Sibling should not be affected (it doesn't have fold property)
      expect(sibling.payload?.fold).toBeUndefined();
    });

    it('should handle complex tree structures', () => {
      // Create a complex tree
      const leaf1 = createTestNode(5, 'JavaScript Basics');
      const leaf2 = createTestNode(6, 'JavaScript Advanced');

      const branch1 = createTestNode(3, 'JavaScript', {
        fold: 1,
        children: [leaf1, leaf2],
      });

      const branch2 = createTestNode(4, 'Python', {
        fold: 1,
        children: [],
      });

      const parent = createTestNode(2, 'Languages', {
        fold: 1,
        children: [branch1, branch2],
      });

      const root = createTestNode(1, 'Programming', {
        children: [parent],
      });

      // Search for JavaScript
      const results = searchManager.search('javascript', [
        root,
        parent,
        branch1,
        branch2,
        leaf1,
        leaf2,
      ]);
      expect(results.length).toBe(3); // branch1, leaf1, leaf2

      // Expand result nodes
      searchManager.expandResultNodes(root);

      // Parent and branch1 should be expanded
      expect(parent.payload?.fold).toBe(0);
      expect(branch1.payload?.fold).toBe(0);

      // branch2 should remain folded (no matches in its subtree)
      expect(branch2.payload?.fold).toBe(1);
    });

    it('should handle nodes with payload but no fold property', () => {
      const child = createTestNode(2, 'JavaScript Tutorial');
      const parent = createTestNode(1, 'Programming', {
        children: [child],
      });
      // Parent has payload but no fold property (implicitly expanded)

      searchManager.search('javascript', [parent, child]);
      searchManager.expandResultNodes(parent);

      // Should not throw and parent should remain without fold property
      expect(parent.payload?.fold).toBeUndefined();
    });

    it('should preserve other payload properties when expanding', () => {
      const child = createTestNode(2, 'JavaScript Tutorial', {
        inlineNote: 'Important note',
      });
      const parent = createTestNode(1, 'Programming', {
        fold: 1,
        inlineNote: 'Parent note',
        children: [child],
      });

      searchManager.search('javascript', [parent, child]);
      searchManager.expandResultNodes(parent);

      // Parent should be expanded
      expect(parent.payload?.fold).toBe(0);

      // Other properties should be preserved
      expect(parent.payload?.inlineNote).toBe('Parent note');
      expect(child.payload?.inlineNote).toBe('Important note');
    });
  });

  describe('Integration with search workflow', () => {
    it('should work with search, highlight, and expand workflow', () => {
      const child = createTestNode(2, 'JavaScript Tutorial');
      const parent = createTestNode(1, 'Programming', {
        fold: 1,
        children: [child],
      });

      // Search
      const results = searchManager.search('javascript', [parent, child]);
      expect(results.length).toBe(1);

      // Highlight
      searchManager.highlight(results);
      expect(child.payload?.highlighted).toBe(true);

      // Expand
      searchManager.expandResultNodes(parent);
      expect(parent.payload?.fold).toBe(0);

      // All operations should work together
      expect(child.payload?.highlighted).toBe(true);
      expect(parent.payload?.fold).toBe(0);
    });

    it('should work with navigation and expand', () => {
      const child1 = createTestNode(2, 'JavaScript Basics');
      const child2 = createTestNode(3, 'JavaScript Advanced');

      const parent = createTestNode(1, 'Programming', {
        fold: 1,
        children: [child1, child2],
      });

      // Search
      const results = searchManager.search('javascript', [
        parent,
        child1,
        child2,
      ]);
      expect(results.length).toBe(2);

      // Navigate
      const first = searchManager.getCurrent();
      expect(first).not.toBeNull();

      const second = searchManager.next();
      expect(second).not.toBeNull();

      // Expand
      searchManager.expandResultNodes(parent);
      expect(parent.payload?.fold).toBe(0);

      // Navigation should still work
      const third = searchManager.next();
      expect(third).toBe(results[0]); // Wrapped around
    });

    it('should handle clear after expand', () => {
      const child = createTestNode(2, 'JavaScript Tutorial');
      const parent = createTestNode(1, 'Programming', {
        fold: 1,
        children: [child],
      });

      // Search and expand
      searchManager.search('javascript', [parent, child]);
      searchManager.expandResultNodes(parent);
      expect(parent.payload?.fold).toBe(0);

      // Clear search
      searchManager.clear();

      // Parent should remain expanded (expand is permanent)
      expect(parent.payload?.fold).toBe(0);

      // Results should be cleared
      expect(searchManager.getResultCount()).toBe(0);
    });
  });
});
