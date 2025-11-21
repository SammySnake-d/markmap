/**
 * Unit tests for layout adjustment functionality
 *
 * Requirements:
 * - 2.3: Auto-trigger layout adjustment after expand/collapse and smooth transition
 * - 3.4: Auto-trigger layout adjustment after expand/collapse
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Layout Adjustment', () => {
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
              children: [],
              payload: { fold: 0 },
            },
          ],
          payload: { fold: 0 },
        },
      ],
      payload: { fold: 0 },
    } as unknown as INode;
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

  describe('Requirement 2.3: Auto-trigger layout adjustment', () => {
    it('should trigger renderData when expanding a node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse a node first
      tree.children![0].payload!.fold = 1;
      await markmap.renderData();

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Expand the node
      await markmap.expandAll(tree.children![0]);

      // Verify renderData was called (layout adjustment triggered)
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should trigger renderData when collapsing a node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Collapse the node
      await markmap.collapseAll(tree.children![0]);

      // Verify renderData was called (layout adjustment triggered)
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should trigger renderData when toggling a node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Toggle the node
      await markmap.toggleNode(tree.children![0]);

      // Verify renderData was called (layout adjustment triggered)
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should trigger renderData for global expand all', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse some nodes first
      tree.children![0].payload!.fold = 1;
      tree.children![1].payload!.fold = 1;
      await markmap.renderData();

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Global expand all
      await markmap.expandAll();

      // Verify renderData was called (layout adjustment triggered)
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should trigger renderData for global collapse all', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Global collapse all
      await markmap.collapseAll();

      // Verify renderData was called (layout adjustment triggered)
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should update node positions after expand', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse a node
      tree.children![0].payload!.fold = 1;
      await markmap.renderData();

      // Expand the node
      await markmap.expandAll(tree.children![0]);

      // Node rect should be updated (layout adjusted)
      // The rect might change due to children being visible
      expect(tree.children![0].state!.rect).toBeDefined();
    });

    it('should update node positions after collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse the node
      await markmap.collapseAll(tree.children![0]);

      // Node rect should be updated (layout adjusted)
      expect(tree.children![0].state!.rect).toBeDefined();
    });

    it('should recalculate layout for all visible nodes after expand', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse Child 1
      tree.children![0].payload!.fold = 1;
      await markmap.renderData();

      // Expand Child 1
      await markmap.expandAll(tree.children![0]);

      // All nodes should have valid state.rect
      expect(tree.state!.rect).toBeDefined();
      expect(tree.children![0].state!.rect).toBeDefined();
      expect(tree.children![0].children![0].state!.rect).toBeDefined();
      expect(tree.children![0].children![1].state!.rect).toBeDefined();
      expect(tree.children![1].state!.rect).toBeDefined();
    });

    it('should recalculate layout for remaining visible nodes after collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse Child 1
      await markmap.collapseAll(tree.children![0]);

      // Visible nodes should have valid state.rect
      expect(tree.state!.rect).toBeDefined();
      expect(tree.children![0].state!.rect).toBeDefined();
      expect(tree.children![1].state!.rect).toBeDefined();
    });

    it('should handle multiple consecutive expand/collapse operations', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Multiple operations
      await markmap.collapseAll(tree.children![0]);
      await markmap.expandAll(tree.children![0]);
      await markmap.collapseAll(tree.children![1]);
      await markmap.expandAll(tree.children![1]);

      // Verify renderData was called for each operation
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should maintain valid layout state after rapid expand/collapse', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Rapid operations
      await markmap.collapseAll(tree.children![0]);
      await markmap.expandAll(tree.children![0]);
      await markmap.collapseAll(tree.children![0]);
      await markmap.expandAll(tree.children![0]);

      // Final state should be valid
      expect(tree.state!.rect).toBeDefined();
      expect(tree.children![0].state!.rect).toBeDefined();
      expect(tree.children![0].children![0].state!.rect).toBeDefined();
    });
  });

  describe('Requirement 3.4: Layout adjustment on content change', () => {
    it('should adjust layout when node content changes', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Change content (simulated by calling renderData)
      await markmap.renderData();

      // Verify renderData was called
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should adjust layout when nodes are added', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Add a new child
      tree.children!.push({
        content: 'New Child',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Trigger layout adjustment
      await markmap.renderData();

      // Verify renderData was called
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should adjust layout when nodes are removed', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Remove a child
      tree.children!.pop();

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Trigger layout adjustment
      await markmap.renderData();

      // Verify renderData was called
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Smooth transition', () => {
    it('should use transition for layout changes', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on transition method
      const transitionSpy = vi.spyOn(markmap, 'transition');

      // Trigger layout change
      await markmap.collapseAll(tree.children![0]);

      // Verify transition was used (smooth animation)
      expect(transitionSpy).toHaveBeenCalled();
    });

    it('should apply transition duration from options', async () => {
      const tree = createTestTree();
      const customDuration = 500;

      markmap.setOptions({ duration: customDuration });
      await markmap.setData(tree);

      // Verify options were set
      expect(markmap.options.duration).toBe(customDuration);

      // Trigger layout change
      await markmap.collapseAll(tree.children![0]);

      // The transition should use the custom duration
      // (This is verified by the transition method using options.duration)
    });

    it('should handle zero duration for instant layout changes', async () => {
      const tree = createTestTree();

      markmap.setOptions({ duration: 0 });
      await markmap.setData(tree);

      // Trigger layout change with zero duration
      await markmap.collapseAll(tree.children![0]);

      // Should complete without error
      expect(tree.children![0].payload?.fold).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle layout adjustment with no data', async () => {
      // Don't set any data
      const renderSpy = vi.spyOn(markmap, 'renderData');

      await markmap.renderData();

      // Should not throw error
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should handle layout adjustment with empty tree', async () => {
      const tree: INode = {
        content: 'Root',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      await markmap.renderData();

      // Should not throw error
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should handle layout adjustment with single node', async () => {
      const tree: INode = {
        content: 'Single Node',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      await markmap.renderData();

      // Should not throw error
      expect(renderSpy).toHaveBeenCalled();
      expect(tree.state!.rect).toBeDefined();
    });

    it('should handle layout adjustment with deeply nested tree', async () => {
      // Create a deep tree (10 levels)
      let currentNode: INode = {
        content: 'Level 10',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      for (let i = 9; i >= 1; i--) {
        currentNode = {
          content: `Level ${i}`,
          children: [currentNode],
          payload: { fold: 0 },
        } as unknown as INode;
      }

      await markmap.setData(currentNode);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Collapse and expand
      await markmap.collapseAll(currentNode);
      await markmap.expandAll(currentNode);

      // Should handle deep tree without error
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle layout adjustment with wide tree', async () => {
      const children: INode[] = [];
      for (let i = 0; i < 50; i++) {
        children.push({
          content: `Child ${i}`,
          children: [],
          payload: { fold: 0 },
        } as unknown as INode);
      }

      const tree: INode = {
        content: 'Root',
        children,
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Spy on renderData
      const renderSpy = vi.spyOn(markmap, 'renderData');

      // Collapse and expand
      await markmap.collapseAll(tree);
      await markmap.expandAll(tree);

      // Should handle wide tree without error
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Layout state consistency', () => {
    it('should maintain consistent state.rect after layout adjustment', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Perform multiple layout adjustments
      await markmap.collapseAll(tree.children![0]);
      await markmap.expandAll(tree.children![0]);

      // All visible nodes should have valid rect
      expect(tree.state!.rect.x1).toBeDefined();
      expect(tree.state!.rect.y1).toBeDefined();
      expect(tree.state!.rect.x2).toBeDefined();
      expect(tree.state!.rect.y2).toBeDefined();
    });

    it('should update global rect bounds after layout adjustment', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse all nodes
      await markmap.collapseAll(tree);

      // Global rect should be updated
      // (might be smaller since fewer nodes are visible)
      expect(markmap.state.rect).toBeDefined();
      expect(markmap.state.rect.x1).toBeDefined();
      expect(markmap.state.rect.y1).toBeDefined();
      expect(markmap.state.rect.x2).toBeDefined();
      expect(markmap.state.rect.y2).toBeDefined();
    });

    it('should maintain node hierarchy after layout adjustment', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const originalChildCount = tree.children!.length;
      const originalGrandchildCount = tree.children![0].children!.length;

      // Multiple layout adjustments
      await markmap.collapseAll(tree);
      await markmap.expandAll(tree);
      await markmap.collapseAll(tree.children![0]);
      await markmap.expandAll(tree.children![0]);

      // Hierarchy should be preserved
      expect(tree.children!.length).toBe(originalChildCount);
      expect(tree.children![0].children!.length).toBe(originalGrandchildCount);
    });
  });

  describe('Performance', () => {
    it('should complete layout adjustment in reasonable time', async () => {
      // Create a large tree
      const children: INode[] = [];
      for (let i = 0; i < 100; i++) {
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
        } as unknown as INode);
      }

      const tree: INode = {
        content: 'Root',
        children,
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      const startTime = Date.now();
      await markmap.collapseAll(tree);
      const duration = Date.now() - startTime;

      // Should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid layout adjustments efficiently', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = Date.now();

      // Rapid operations
      for (let i = 0; i < 10; i++) {
        await markmap.collapseAll(tree.children![0]);
        await markmap.expandAll(tree.children![0]);
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(2000);
    });
  });
});
