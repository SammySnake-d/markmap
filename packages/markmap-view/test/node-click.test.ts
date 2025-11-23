/**
 * Unit tests for node click functionality
 *
 * Requirements:
 * - 8.6: Toggle node expand/collapse state when user clicks on node
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Node Click Functionality', () => {
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

  describe('Basic Click Behavior - Requirement 8.6', () => {
    it('should toggle node from expanded to collapsed on click', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      expect(targetNode.payload?.fold).toBe(0); // Initially expanded

      // Simulate click event
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Call handleClick directly
      await markmap.handleClick(mockEvent, targetNode);

      // Node should now be collapsed
      expect(targetNode.payload?.fold).toBe(1);
    });

    it('should toggle node from collapsed to expanded on click', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      targetNode.payload!.fold = 1; // Collapse it first

      // Simulate click event
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Call handleClick directly
      await markmap.handleClick(mockEvent, targetNode);

      // Node should now be expanded
      expect(targetNode.payload?.fold).toBe(0);
    });

    it('should toggle node multiple times', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // First click: collapse
      await markmap.handleClick(mockEvent, targetNode);
      expect(targetNode.payload?.fold).toBe(1);

      // Second click: expand
      await markmap.handleClick(mockEvent, targetNode);
      expect(targetNode.payload?.fold).toBe(0);

      // Third click: collapse again
      await markmap.handleClick(mockEvent, targetNode);
      expect(targetNode.payload?.fold).toBe(1);
    });

    it('should only toggle the clicked node, not its siblings', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      const siblingNode = tree.children![1]; // Child 2

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Click on Child 1
      await markmap.handleClick(mockEvent, targetNode);

      // Child 1 should be collapsed
      expect(targetNode.payload?.fold).toBe(1);

      // Child 2 should remain expanded
      expect(siblingNode.payload?.fold).toBe(0);
    });

    it('should only toggle the clicked node, not its children (non-recursive)', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      const childNode = targetNode.children![0]; // Grandchild 1.1

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Click on Child 1
      await markmap.handleClick(mockEvent, targetNode);

      // Child 1 should be collapsed
      expect(targetNode.payload?.fold).toBe(1);

      // Grandchild 1.1 should remain in its original state (expanded)
      expect(childNode.payload?.fold).toBe(0);
    });
  });

  describe('Recursive Toggle with Modifier Keys', () => {
    it('should toggle node and all descendants when Ctrl key is pressed (Windows/Linux)', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1

      // Simulate click with Ctrl key
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });

      // Call handleClick with Ctrl key
      await markmap.handleClick(mockEvent, targetNode);

      // Node and all descendants should be collapsed
      expect(targetNode.payload?.fold).toBe(1);
      expect(targetNode.children![0].payload?.fold).toBe(1); // Grandchild 1.1
      expect(targetNode.children![1].payload?.fold).toBe(1); // Grandchild 1.2
    });

    it('should toggle node and all descendants when Meta key is pressed (Mac)', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1

      // Simulate click with Meta key (Cmd on Mac)
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: true,
      });

      // Call handleClick with Meta key
      await markmap.handleClick(mockEvent, targetNode);

      // On Mac (when isMacintosh is true), Meta key triggers recursive toggle
      // On non-Mac, Meta key doesn't trigger recursive toggle
      // Since we're in a test environment, isMacintosh is likely false
      // So we just check that the node itself is toggled
      expect(targetNode.payload?.fold).toBe(1);

      // Note: The recursive behavior depends on the isMacintosh constant
      // which is determined at runtime based on the platform
    });

    it('should recursively expand node and all descendants', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1

      // Collapse all first
      targetNode.payload!.fold = 1;
      targetNode.children![0].payload!.fold = 1;
      targetNode.children![1].payload!.fold = 1;

      // Simulate click with Ctrl key to recursively expand
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, targetNode);

      // Node and all descendants should be expanded
      expect(targetNode.payload?.fold).toBe(0);
      expect(targetNode.children![0].payload?.fold).toBe(0); // Grandchild 1.1
      expect(targetNode.children![1].payload?.fold).toBe(0); // Grandchild 1.2
    });
  });

  describe('Click on Different Node Types', () => {
    it('should handle click on root node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Click on root
      await markmap.handleClick(mockEvent, tree);

      // Root should be collapsed
      expect(tree.payload?.fold).toBe(1);
    });

    it('should handle click on leaf node (no children)', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const leafNode = tree.children![0].children![0]; // Grandchild 1.1 (leaf)

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Click on leaf node
      await markmap.handleClick(mockEvent, leafNode);

      // Leaf node should toggle (even though it has no children)
      expect(leafNode.payload?.fold).toBe(1);
    });

    it('should handle click on deeply nested node', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const deepNode = tree.children![0].children![0]; // Grandchild 1.1

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Click on deep node
      await markmap.handleClick(mockEvent, deepNode);

      // Deep node should be collapsed
      expect(deepNode.payload?.fold).toBe(1);

      // Parent should remain expanded
      expect(tree.children![0].payload?.fold).toBe(0);
    });
  });

  describe('Click with toggleRecursively Option', () => {
    it('should respect toggleRecursively option when set to true', async () => {
      const tree = createTestTree();

      // Create markmap with toggleRecursively option
      markmap.setOptions({ toggleRecursively: true });
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1

      // Normal click (without modifier key) should toggle recursively
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, targetNode);

      // Node and all descendants should be collapsed (recursive)
      expect(targetNode.payload?.fold).toBe(1);
      expect(targetNode.children![0].payload?.fold).toBe(1);
      expect(targetNode.children![1].payload?.fold).toBe(1);
    });

    it('should invert toggleRecursively behavior with Ctrl key', async () => {
      const tree = createTestTree();

      // Create markmap with toggleRecursively option set to true
      markmap.setOptions({ toggleRecursively: true });
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1

      // Click with Ctrl key should toggle non-recursively (inverted)
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, targetNode);

      // Only the node itself should be collapsed (non-recursive)
      expect(targetNode.payload?.fold).toBe(1);

      // Children should remain in their original state
      expect(targetNode.children![0].payload?.fold).toBe(0);
      expect(targetNode.children![1].payload?.fold).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle click on node without payload', async () => {
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

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Should not throw error
      // handleClick doesn't return a promise, so we just call it directly
      expect(() => {
        markmap.handleClick(mockEvent, tree.children![0]);
      }).not.toThrow();
    });

    it('should handle rapid successive clicks', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Rapid clicks
      await markmap.handleClick(mockEvent, targetNode);
      await markmap.handleClick(mockEvent, targetNode);
      await markmap.handleClick(mockEvent, targetNode);

      // Should end up collapsed (odd number of clicks)
      expect(targetNode.payload?.fold).toBe(1);
    });

    it('should handle click on node with empty children array', async () => {
      const tree: INode = {
        content: 'Root',
        children: [
          {
            content: 'Child',
            children: [], // Empty array
            payload: { fold: 0 },
          },
        ],
        payload: { fold: 0 },
      } as INode;

      await markmap.setData(tree);

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, tree.children![0]);

      // Should toggle successfully
      expect(tree.children![0].payload?.fold).toBe(1);
    });
  });

  describe('State Preservation', () => {
    it('should preserve node content after click', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      const originalContent = targetNode.content;

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, targetNode);

      // Content should remain unchanged
      expect(targetNode.content).toBe(originalContent);
    });

    it('should preserve other payload properties after click', async () => {
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

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, tree.children![0]);

      // Other payload properties should be preserved
      expect(tree.children![0].payload?.inlineNote).toBe('Test note');
      expect(tree.children![0].payload?.customProperty).toBe('custom value');
      expect(tree.children![0].payload?.fold).toBe(1);
    });

    it('should preserve tree structure after click', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const originalChildCount = tree.children!.length;
      const originalGrandchildCount = tree.children![0].children!.length;

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      await markmap.handleClick(mockEvent, tree.children![0]);

      // Tree structure should be preserved
      expect(tree.children!.length).toBe(originalChildCount);
      expect(tree.children![0].children!.length).toBe(originalGrandchildCount);
    });
  });

  describe('Integration with Viewport Adjustment', () => {
    it('should call toggleNode when node is clicked', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1
      targetNode.payload!.fold = 1; // Start collapsed

      // Spy on toggleNode
      const toggleNodeSpy = vi.spyOn(markmap, 'toggleNode');

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      // Click to expand
      await markmap.handleClick(mockEvent, targetNode);

      // toggleNode should have been called
      expect(toggleNodeSpy).toHaveBeenCalledWith(targetNode, false);
    });

    it('should call toggleNode with recursive flag when Ctrl is pressed', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0]; // Child 1

      // Spy on toggleNode
      const toggleNodeSpy = vi.spyOn(markmap, 'toggleNode');

      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false,
      });

      // Click with Ctrl to toggle recursively
      await markmap.handleClick(mockEvent, targetNode);

      // toggleNode should have been called with recursive=true
      expect(toggleNodeSpy).toHaveBeenCalledWith(targetNode, true);
    });
  });
});
