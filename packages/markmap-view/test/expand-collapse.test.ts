/**
 * Unit tests for expand/collapse functionality
 *
 * Requirements:
 * - 2.1: Expand node and all its children when user selects "Expand All"
 * - 2.2: Collapse all children under a node when user selects "Collapse All"
 * - 2.3: Auto-trigger layout adjustment after expand/collapse
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import {
  createMockSVG,
  areAllDescendantsExpanded,
  areAllDescendantsCollapsed,
  countVisibleNodes,
} from './utils/helpers';

describe('Expand/Collapse Functionality', () => {
  let svg: SVGSVGElement;
  let markmap: Markmap;

  // Helper function to create a test tree
  const createTestTree = (): INode => {
    return {
      content: 'Root',
      children: [
        {
          content: 'Child 1',
          children: [
            {
              content: 'Grandchild 1.1',
              children: [],
              payload: { fold: 0 },
            },
            {
              content: 'Grandchild 1.2',
              children: [],
              payload: { fold: 0 },
            },
          ],
          payload: { fold: 0 },
        },
        {
          content: 'Child 2',
          children: [
            {
              content: 'Grandchild 2.1',
              children: [
                {
                  content: 'Great-grandchild 2.1.1',
                  children: [],
                  payload: { fold: 0 },
                },
              ],
              payload: { fold: 0 },
            },
          ],
          payload: { fold: 0 },
        },
        {
          content: 'Child 3',
          children: [],
          payload: { fold: 0 },
        },
      ],
      payload: { fold: 0 },
    } as INode;
  };

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    svg = createMockSVG();
    markmap = new Markmap(svg);
  });

  afterEach(() => {
    markmap.destroy();
  });

  describe('expandAll - Requirement 2.1', () => {
    it('should expand all descendants of a node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse some nodes first
      tree.children![0].payload!.fold = 1;
      tree.children![1].payload!.fold = 1;

      // Expand all from root
      await markmap.expandAll(tree);

      // Check that all nodes are expanded (fold = 0)
      expect(tree.payload?.fold).toBe(0);
      expect(tree.children![0].payload?.fold).toBe(0);
      expect(tree.children![1].payload?.fold).toBe(0);
      expect(tree.children![2].payload?.fold).toBe(0);
      expect(tree.children![0].children![0].payload?.fold).toBe(0);
      expect(tree.children![0].children![1].payload?.fold).toBe(0);
      expect(tree.children![1].children![0].payload?.fold).toBe(0);
      expect(tree.children![1].children![0].children![0].payload?.fold).toBe(0);
    });

    it('should expand all descendants using helper function', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse all nodes first
      tree.payload!.fold = 1;
      tree.children![0].payload!.fold = 1;
      tree.children![1].payload!.fold = 1;

      await markmap.expandAll(tree);

      expect(areAllDescendantsExpanded(tree)).toBe(true);
    });

    it('should expand a specific subtree', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse all nodes
      tree.children![0].payload!.fold = 1;
      tree.children![0].children![0].payload!.fold = 1;
      tree.children![0].children![1].payload!.fold = 1;

      // Expand only Child 1 subtree
      await markmap.expandAll(tree.children![0]);

      // Child 1 and its descendants should be expanded
      expect(tree.children![0].payload?.fold).toBe(0);
      expect(tree.children![0].children![0].payload?.fold).toBe(0);
      expect(tree.children![0].children![1].payload?.fold).toBe(0);
    });

    it('should handle nodes without children', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const leafNode = tree.children![2]; // Child 3 has no children

      await markmap.expandAll(leafNode);

      expect(leafNode.payload?.fold).toBe(0);
    });

    it('should handle already expanded nodes', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // All nodes are already expanded
      await markmap.expandAll(tree);

      // Should still be expanded
      expect(areAllDescendantsExpanded(tree)).toBe(true);
    });

    it('should expand from root when no node provided', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse some nodes
      tree.children![0].payload!.fold = 1;
      tree.children![1].payload!.fold = 1;

      // Call expandAll without argument
      await markmap.expandAll();

      // All nodes should be expanded
      expect(areAllDescendantsExpanded(tree)).toBe(true);
    });

    it('should handle undefined data gracefully', async () => {
      // Don't set any data
      await expect(markmap.expandAll()).resolves.not.toThrow();
    });

    it('should expand deeply nested trees', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse the deeply nested node
      tree.children![1].children![0].children![0].payload!.fold = 1;

      await markmap.expandAll(tree);

      // Deep node should be expanded
      expect(tree.children![1].children![0].children![0].payload?.fold).toBe(0);
    });

    it('should increase visible node count after expand', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse Child 1 (hides its 2 grandchildren)
      tree.children![0].payload!.fold = 1;

      const beforeCount = countVisibleNodes(tree);

      await markmap.expandAll(tree.children![0]);

      const afterCount = countVisibleNodes(tree);

      expect(afterCount).toBeGreaterThan(beforeCount);
    });
  });

  describe('collapseAll - Requirement 2.2', () => {
    it('should collapse all descendants of a node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // All nodes start expanded
      await markmap.collapseAll(tree);

      // Check that all nodes are collapsed (fold = 1)
      expect(tree.payload?.fold).toBe(1);
      expect(tree.children![0].payload?.fold).toBe(1);
      expect(tree.children![1].payload?.fold).toBe(1);
      expect(tree.children![2].payload?.fold).toBe(1);
      expect(tree.children![0].children![0].payload?.fold).toBe(1);
      expect(tree.children![0].children![1].payload?.fold).toBe(1);
      expect(tree.children![1].children![0].payload?.fold).toBe(1);
      expect(tree.children![1].children![0].children![0].payload?.fold).toBe(1);
    });

    it('should collapse all descendants using helper function', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      await markmap.collapseAll(tree);

      expect(areAllDescendantsCollapsed(tree)).toBe(true);
    });

    it('should collapse a specific subtree', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse only Child 1 subtree
      await markmap.collapseAll(tree.children![0]);

      // Child 1 and its descendants should be collapsed
      expect(tree.children![0].payload?.fold).toBe(1);
      expect(tree.children![0].children![0].payload?.fold).toBe(1);
      expect(tree.children![0].children![1].payload?.fold).toBe(1);

      // Other subtrees should remain expanded
      expect(tree.children![1].payload?.fold).toBe(0);
      expect(tree.children![2].payload?.fold).toBe(0);
    });

    it('should handle nodes without children', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const leafNode = tree.children![2]; // Child 3 has no children

      await markmap.collapseAll(leafNode);

      expect(leafNode.payload?.fold).toBe(1);
    });

    it('should handle already collapsed nodes', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse all nodes
      await markmap.collapseAll(tree);

      // Collapse again
      await markmap.collapseAll(tree);

      // Should still be collapsed
      expect(areAllDescendantsCollapsed(tree)).toBe(true);
    });

    it('should collapse from root when no node provided', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Call collapseAll without argument
      await markmap.collapseAll();

      // All nodes should be collapsed
      expect(areAllDescendantsCollapsed(tree)).toBe(true);
    });

    it('should handle undefined data gracefully', async () => {
      // Don't set any data
      await expect(markmap.collapseAll()).resolves.not.toThrow();
    });

    it('should collapse deeply nested trees', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      await markmap.collapseAll(tree);

      // Deep node should be collapsed
      expect(tree.children![1].children![0].children![0].payload?.fold).toBe(1);
    });

    it('should decrease visible node count after collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const beforeCount = countVisibleNodes(tree);

      await markmap.collapseAll(tree.children![0]);

      const afterCount = countVisibleNodes(tree);

      expect(afterCount).toBeLessThan(beforeCount);
    });
  });

  describe('Expand/Collapse Integration', () => {
    it('should toggle between expand and collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse all
      await markmap.collapseAll(tree);
      expect(areAllDescendantsCollapsed(tree)).toBe(true);

      // Expand all
      await markmap.expandAll(tree);
      expect(areAllDescendantsExpanded(tree)).toBe(true);

      // Collapse again
      await markmap.collapseAll(tree);
      expect(areAllDescendantsCollapsed(tree)).toBe(true);
    });

    it('should handle mixed expand/collapse operations', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse Child 1
      await markmap.collapseAll(tree.children![0]);

      // Expand Child 2
      await markmap.expandAll(tree.children![1]);

      // Check states
      expect(areAllDescendantsCollapsed(tree.children![0])).toBe(true);
      expect(areAllDescendantsExpanded(tree.children![1])).toBe(true);
    });

    it('should preserve node content during expand/collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const originalContent = tree.children![0].content;

      await markmap.collapseAll(tree);
      await markmap.expandAll(tree);

      expect(tree.children![0].content).toBe(originalContent);
    });

    it('should preserve node structure during expand/collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const originalChildCount = tree.children!.length;
      const originalGrandchildCount = tree.children![0].children!.length;

      await markmap.collapseAll(tree);
      await markmap.expandAll(tree);

      expect(tree.children!.length).toBe(originalChildCount);
      expect(tree.children![0].children!.length).toBe(originalGrandchildCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single node tree', async () => {
      const tree: INode = {
        content: 'Single Node',
        children: [],
        payload: { fold: 0 },
      } as INode;

      await markmap.setData(tree);

      await markmap.expandAll(tree);
      expect(tree.payload?.fold).toBe(0);

      await markmap.collapseAll(tree);
      expect(tree.payload?.fold).toBe(1);
    });

    it('should handle tree with only one level of children', async () => {
      const tree: INode = {
        content: 'Root',
        children: [
          {
            content: 'Child 1',
            children: [],
            payload: { fold: 0 },
          },
          {
            content: 'Child 2',
            children: [],
            payload: { fold: 0 },
          },
        ],
        payload: { fold: 0 },
      } as INode;

      await markmap.setData(tree);

      await markmap.collapseAll(tree);
      expect(tree.children![0].payload?.fold).toBe(1);
      expect(tree.children![1].payload?.fold).toBe(1);

      await markmap.expandAll(tree);
      expect(tree.children![0].payload?.fold).toBe(0);
      expect(tree.children![1].payload?.fold).toBe(0);
    });

    it('should handle nodes without payload', async () => {
      const tree: INode = {
        content: 'Root',
        children: [
          {
            content: 'Child',
            children: [],
            // No payload
          },
        ],
        // No payload
      } as INode;

      await markmap.setData(tree);

      await expect(markmap.expandAll(tree)).resolves.not.toThrow();
      await expect(markmap.collapseAll(tree)).resolves.not.toThrow();
    });

    it('should handle very deep trees', async () => {
      // Create a tree with 10 levels
      let currentNode: INode = {
        content: 'Level 10',
        children: [],
        payload: { fold: 0 },
      } as INode;

      for (let i = 9; i >= 1; i--) {
        currentNode = {
          content: `Level ${i}`,
          children: [currentNode],
          payload: { fold: 0 },
        } as INode;
      }

      await markmap.setData(currentNode);

      await markmap.collapseAll(currentNode);
      expect(currentNode.payload?.fold).toBe(1);

      await markmap.expandAll(currentNode);
      expect(currentNode.payload?.fold).toBe(0);
    });

    it('should handle wide trees with many siblings', async () => {
      const children: INode[] = [];
      for (let i = 0; i < 20; i++) {
        children.push({
          content: `Child ${i}`,
          children: [],
          payload: { fold: 0 },
        } as INode);
      }

      const tree: INode = {
        content: 'Root',
        children,
        payload: { fold: 0 },
      } as INode;

      await markmap.setData(tree);

      await markmap.collapseAll(tree);
      expect(tree.children!.every((child) => child.payload?.fold === 1)).toBe(
        true,
      );

      await markmap.expandAll(tree);
      expect(tree.children!.every((child) => child.payload?.fold === 0)).toBe(
        true,
      );
    });
  });

  describe('Payload Preservation', () => {
    it('should preserve other payload properties during expand', async () => {
      const tree: INode = {
        content: 'Root',
        children: [
          {
            content: 'Child',
            children: [],
            payload: {
              fold: 1,
              inlineNote: 'Test note',
              customProperty: 'custom value',
            },
          },
        ],
        payload: { fold: 0 },
      } as INode;

      await markmap.setData(tree);
      await markmap.expandAll(tree);

      expect(tree.children![0].payload?.inlineNote).toBe('Test note');
      expect(tree.children![0].payload?.customProperty).toBe('custom value');
      expect(tree.children![0].payload?.fold).toBe(0);
    });

    it('should preserve other payload properties during collapse', async () => {
      const tree: INode = {
        content: 'Root',
        children: [
          {
            content: 'Child',
            children: [],
            payload: {
              fold: 0,
              inlineNote: 'Test note',
              customProperty: 'custom value',
            },
          },
        ],
        payload: { fold: 0 },
      } as INode;

      await markmap.setData(tree);
      await markmap.collapseAll(tree);

      expect(tree.children![0].payload?.inlineNote).toBe('Test note');
      expect(tree.children![0].payload?.customProperty).toBe('custom value');
      expect(tree.children![0].payload?.fold).toBe(1);
    });
  });

  describe('Global Expand/Collapse - Requirements 2.4, 2.5', () => {
    describe('Global Expand All - Requirement 2.4', () => {
      it('should expand all nodes from root when called without arguments', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // Collapse some nodes first
        tree.children![0].payload!.fold = 1;
        tree.children![1].payload!.fold = 1;
        tree.children![1].children![0].payload!.fold = 1;

        // Call expandAll without arguments (simulates toolbar button click)
        await markmap.expandAll();

        // All nodes should be expanded
        expect(areAllDescendantsExpanded(tree)).toBe(true);
      });

      it('should expand all nodes including deeply nested ones', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // Collapse all nodes
        tree.payload!.fold = 1;
        tree.children![0].payload!.fold = 1;
        tree.children![0].children![0].payload!.fold = 1;
        tree.children![0].children![1].payload!.fold = 1;
        tree.children![1].payload!.fold = 1;
        tree.children![1].children![0].payload!.fold = 1;
        tree.children![1].children![0].children![0].payload!.fold = 1;
        tree.children![2].payload!.fold = 1;

        // Global expand all
        await markmap.expandAll();

        // Verify all nodes are expanded
        expect(tree.payload?.fold).toBe(0);
        expect(tree.children![0].payload?.fold).toBe(0);
        expect(tree.children![0].children![0].payload?.fold).toBe(0);
        expect(tree.children![0].children![1].payload?.fold).toBe(0);
        expect(tree.children![1].payload?.fold).toBe(0);
        expect(tree.children![1].children![0].payload?.fold).toBe(0);
        expect(tree.children![1].children![0].children![0].payload?.fold).toBe(
          0,
        );
        expect(tree.children![2].payload?.fold).toBe(0);
      });

      it('should work when all nodes are already expanded', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // All nodes start expanded
        await markmap.expandAll();

        // Should still be expanded
        expect(areAllDescendantsExpanded(tree)).toBe(true);
      });

      it('should handle empty tree gracefully', async () => {
        const tree: INode = {
          content: 'Root',
          children: [],
          payload: { fold: 0 },
        } as INode;

        await markmap.setData(tree);
        await markmap.expandAll();

        expect(tree.payload?.fold).toBe(0);
      });

      it('should expand all nodes in a wide tree', async () => {
        const children: INode[] = [];
        for (let i = 0; i < 10; i++) {
          children.push({
            content: `Child ${i}`,
            children: [
              {
                content: `Grandchild ${i}.1`,
                children: [],
                payload: { fold: 1 },
              },
            ],
            payload: { fold: 1 },
          } as INode);
        }

        const tree: INode = {
          content: 'Root',
          children,
          payload: { fold: 0 },
        } as INode;

        await markmap.setData(tree);
        await markmap.expandAll();

        // All children and grandchildren should be expanded
        expect(tree.children!.every((child) => child.payload?.fold === 0)).toBe(
          true,
        );
        expect(
          tree.children!.every((child) =>
            child.children!.every((gc) => gc.payload?.fold === 0),
          ),
        ).toBe(true);
      });
    });

    describe('Global Collapse All - Requirement 2.5', () => {
      it('should collapse all nodes from root when called without arguments', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // All nodes start expanded
        // Call collapseAll without arguments (simulates toolbar button click)
        await markmap.collapseAll();

        // All nodes should be collapsed
        expect(areAllDescendantsCollapsed(tree)).toBe(true);
      });

      it('should collapse all nodes including deeply nested ones', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // All nodes start expanded
        // Global collapse all
        await markmap.collapseAll();

        // Verify all nodes are collapsed
        expect(tree.payload?.fold).toBe(1);
        expect(tree.children![0].payload?.fold).toBe(1);
        expect(tree.children![0].children![0].payload?.fold).toBe(1);
        expect(tree.children![0].children![1].payload?.fold).toBe(1);
        expect(tree.children![1].payload?.fold).toBe(1);
        expect(tree.children![1].children![0].payload?.fold).toBe(1);
        expect(tree.children![1].children![0].children![0].payload?.fold).toBe(
          1,
        );
        expect(tree.children![2].payload?.fold).toBe(1);
      });

      it('should work when all nodes are already collapsed', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // Collapse all nodes first
        await markmap.collapseAll();

        // Collapse again
        await markmap.collapseAll();

        // Should still be collapsed
        expect(areAllDescendantsCollapsed(tree)).toBe(true);
      });

      it('should handle empty tree gracefully', async () => {
        const tree: INode = {
          content: 'Root',
          children: [],
          payload: { fold: 0 },
        } as INode;

        await markmap.setData(tree);
        await markmap.collapseAll();

        expect(tree.payload?.fold).toBe(1);
      });

      it('should collapse all nodes in a wide tree', async () => {
        const children: INode[] = [];
        for (let i = 0; i < 10; i++) {
          children.push({
            content: `Child ${i}`,
            children: [
              {
                content: `Grandchild ${i}.1`,
                children: [],
                payload: { fold: 0 },
              },
            ],
            payload: { fold: 0 },
          } as INode);
        }

        const tree: INode = {
          content: 'Root',
          children,
          payload: { fold: 0 },
        } as INode;

        await markmap.setData(tree);
        await markmap.collapseAll();

        // All children and grandchildren should be collapsed
        expect(tree.children!.every((child) => child.payload?.fold === 1)).toBe(
          true,
        );
        expect(
          tree.children!.every((child) =>
            child.children!.every((gc) => gc.payload?.fold === 1),
          ),
        ).toBe(true);
      });
    });

    describe('Global Expand/Collapse Integration', () => {
      it('should toggle between global expand and collapse', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // Global collapse
        await markmap.collapseAll();
        expect(areAllDescendantsCollapsed(tree)).toBe(true);

        // Global expand
        await markmap.expandAll();
        expect(areAllDescendantsExpanded(tree)).toBe(true);

        // Global collapse again
        await markmap.collapseAll();
        expect(areAllDescendantsCollapsed(tree)).toBe(true);
      });

      it('should handle multiple global expand/collapse cycles', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        const originalChildCount = tree.children!.length;

        // Multiple cycles
        for (let i = 0; i < 3; i++) {
          await markmap.expandAll();
          expect(areAllDescendantsExpanded(tree)).toBe(true);

          await markmap.collapseAll();
          expect(areAllDescendantsCollapsed(tree)).toBe(true);
        }

        // Structure should be preserved
        expect(tree.children!.length).toBe(originalChildCount);
      });

      it('should preserve node content during global operations', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        const originalContents = tree.children!.map((child) => child.content);

        await markmap.collapseAll();
        await markmap.expandAll();

        const newContents = tree.children!.map((child) => child.content);
        expect(newContents).toEqual(originalContents);
      });

      it('should work correctly after partial expand/collapse operations', async () => {
        const tree = createTestTree();
        await markmap.setData(tree);

        // Partially collapse some nodes
        await markmap.collapseAll(tree.children![0]);

        // Global expand should expand everything
        await markmap.expandAll();
        expect(areAllDescendantsExpanded(tree)).toBe(true);

        // Partially expand some nodes
        await markmap.expandAll(tree.children![1]);

        // Global collapse should collapse everything
        await markmap.collapseAll();
        expect(areAllDescendantsCollapsed(tree)).toBe(true);
      });
    });

    describe('Global Operations with No Data', () => {
      it('should handle expandAll when no data is set', async () => {
        // Don't set any data
        await expect(markmap.expandAll()).resolves.not.toThrow();
      });

      it('should handle collapseAll when no data is set', async () => {
        // Don't set any data
        await expect(markmap.collapseAll()).resolves.not.toThrow();
      });
    });

    describe('Global Operations Performance', () => {
      it('should handle large trees efficiently', async () => {
        // Create a large tree with 100 nodes
        const children: INode[] = [];
        for (let i = 0; i < 20; i++) {
          const grandchildren: INode[] = [];
          for (let j = 0; j < 5; j++) {
            grandchildren.push({
              content: `Grandchild ${i}.${j}`,
              children: [],
              payload: { fold: 0 },
            } as INode);
          }
          children.push({
            content: `Child ${i}`,
            children: grandchildren,
            payload: { fold: 0 },
          } as INode);
        }

        const tree: INode = {
          content: 'Root',
          children,
          payload: { fold: 0 },
        } as INode;

        await markmap.setData(tree);

        const startTime = Date.now();
        await markmap.collapseAll();
        const collapseTime = Date.now() - startTime;

        const startTime2 = Date.now();
        await markmap.expandAll();
        const expandTime = Date.now() - startTime2;

        // Operations should complete in reasonable time (< 1 second)
        expect(collapseTime).toBeLessThan(1000);
        expect(expandTime).toBeLessThan(1000);

        // Verify correctness
        expect(areAllDescendantsExpanded(tree)).toBe(true);
      });
    });
  });
});
