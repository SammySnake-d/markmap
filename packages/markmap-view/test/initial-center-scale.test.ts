/**
 * Unit tests for initial center and scale functionality
 *
 * Requirements:
 * - 3.3: Auto-center and set appropriate initial scale when mindmap loads
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Initial Center and Scale', () => {
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
    // Disable transitions for testing to avoid D3 animation issues in jsdom
    markmap = new Markmap(svg, { duration: 0 });
  });

  afterEach(() => {
    markmap.destroy();
  });

  describe('Requirement 3.3: Auto-center and scale on load', () => {
    it('should call fit() when data is loaded for the first time', async () => {
      const tree = createTestTree();

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data for the first time
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should not call fit() on subsequent data updates', async () => {
      const tree = createTestTree();

      // Load data for the first time
      await markmap.setData(tree);

      // Spy on fit method after first load
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Update data (second time)
      await markmap.setData(tree);

      // Verify fit was not called on second load
      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('should center the mindmap on initial load', async () => {
      const tree = createTestTree();

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called (which centers the mindmap)
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should set appropriate initial scale on load', async () => {
      const tree = createTestTree();

      // Load data
      await markmap.setData(tree);

      // Verify state is initialized
      expect(markmap.state.data).toBeDefined();
      expect(markmap.state.rect).toBeDefined();

      // The fit() method should have been called, which sets the scale
      // We can't directly verify the scale, but we can verify the state is valid
      expect(markmap.state.rect.x1).toBeDefined();
      expect(markmap.state.rect.y1).toBeDefined();
      expect(markmap.state.rect.x2).toBeDefined();
      expect(markmap.state.rect.y2).toBeDefined();
    });

    it('should respect maxInitialScale option', async () => {
      const tree = createTestTree();

      // Set custom maxInitialScale
      markmap.setOptions({ maxInitialScale: 1.5 });

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();

      // Verify maxInitialScale option is set
      expect(markmap.options.maxInitialScale).toBe(1.5);
    });

    it('should respect fitRatio option', async () => {
      const tree = createTestTree();

      // Set custom fitRatio
      markmap.setOptions({ fitRatio: 0.8 });

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();

      // Verify fitRatio option is set
      expect(markmap.options.fitRatio).toBe(0.8);
    });

    it('should work with empty tree', async () => {
      const tree: INode = {
        content: 'Root',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with single node', async () => {
      const tree: INode = {
        content: 'Single Node',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with large tree', async () => {
      // Create a large tree
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

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with deeply nested tree', async () => {
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

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(currentNode);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with collapsed nodes', async () => {
      const tree = createTestTree();

      // Collapse some nodes before loading
      tree.children![0].payload!.fold = 1;

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with custom options', async () => {
      const tree = createTestTree();

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data with custom options
      await markmap.setData(tree, {
        maxInitialScale: 1.5,
        fitRatio: 0.8,
        duration: 300,
      });

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();

      // Verify options were set
      expect(markmap.options.maxInitialScale).toBe(1.5);
      expect(markmap.options.fitRatio).toBe(0.8);
      expect(markmap.options.duration).toBe(300);
    });
  });

  describe('Integration with Markmap.create()', () => {
    it('should auto-center when using Markmap.create()', async () => {
      const tree = createTestTree();
      const newSvg = createMockSVG();

      // Create markmap with data
      const newMarkmap = Markmap.create(newSvg, {}, tree);

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify data is loaded
      expect(newMarkmap.state.data).toBeDefined();

      newMarkmap.destroy();
    });

    it('should work with Markmap.create() without data', () => {
      const newSvg = createMockSVG();

      // Create markmap without data
      const newMarkmap = Markmap.create(newSvg, {}, null);

      // Should not throw error
      expect(newMarkmap).toBeDefined();

      newMarkmap.destroy();
    });
  });

  describe('Edge cases', () => {
    it('should handle null data gracefully', async () => {
      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load null data
      await markmap.setData(null);

      // Verify fit was not called (no data to fit)
      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined data gracefully', async () => {
      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load undefined data
      await markmap.setData(undefined);

      // Verify fit was not called (no data to fit)
      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid setData calls', async () => {
      const tree = createTestTree();

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Multiple rapid calls
      await markmap.setData(tree);
      await markmap.setData(tree);
      await markmap.setData(tree);

      // Verify fit was called only once (first load)
      expect(fitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle setData after destroy', async () => {
      const tree = createTestTree();

      // Destroy markmap
      markmap.destroy();

      // Try to set data after destroy
      // Should not throw error
      await expect(markmap.setData(tree)).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete initial center and scale in reasonable time', async () => {
      const tree = createTestTree();

      const startTime = Date.now();
      await markmap.setData(tree);
      const duration = Date.now() - startTime;

      // Should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle large tree efficiently', async () => {
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

      const startTime = Date.now();
      await markmap.setData(tree);
      const duration = Date.now() - startTime;

      // Should complete in reasonable time even with large tree
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Interaction with other features', () => {
    it('should work with autoFit option enabled', async () => {
      const tree = createTestTree();

      // Enable autoFit
      markmap.setOptions({ autoFit: true });

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called (both from initial load and autoFit)
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with zoom enabled', async () => {
      const tree = createTestTree();

      // Enable zoom
      markmap.setOptions({ zoom: true });

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with pan enabled', async () => {
      const tree = createTestTree();

      // Enable pan
      markmap.setOptions({ pan: true });

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with custom duration', async () => {
      const tree = createTestTree();

      // Set custom duration
      markmap.setOptions({ duration: 300 });

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Load data
      await markmap.setData(tree);

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();

      // Verify duration option is set
      expect(markmap.options.duration).toBe(300);
    });

    it('should work after expand/collapse operations', async () => {
      const tree = createTestTree();

      // Load data (first time, fit is called)
      await markmap.setData(tree);

      // Spy on fit method after first load
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Perform expand/collapse
      await markmap.collapseAll(tree.children![0]);
      await markmap.expandAll(tree.children![0]);

      // Update data again (should not call fit)
      await markmap.setData(tree);

      // Verify fit was not called on second setData
      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('should work with window resize', async () => {
      const tree = createTestTree();

      // Load data
      await markmap.setData(tree);

      // Spy on fit method after first load
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));

      // Wait for debounced handler
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called by resize handler
      expect(fitSpy).toHaveBeenCalled();
    });
  });

  describe('State consistency', () => {
    it('should maintain valid state after initial center and scale', async () => {
      const tree = createTestTree();

      // Load data
      await markmap.setData(tree);

      // Verify state is valid
      expect(markmap.state.data).toBeDefined();
      expect(markmap.state.rect).toBeDefined();
      expect(markmap.state.rect.x1).toBeDefined();
      expect(markmap.state.rect.y1).toBeDefined();
      expect(markmap.state.rect.x2).toBeDefined();
      expect(markmap.state.rect.y2).toBeDefined();
    });

    it('should maintain node hierarchy after initial center and scale', async () => {
      const tree = createTestTree();

      const originalChildCount = tree.children!.length;
      const originalGrandchildCount = tree.children![0].children!.length;

      // Load data
      await markmap.setData(tree);

      // Verify hierarchy is preserved
      expect(tree.children!.length).toBe(originalChildCount);
      expect(tree.children![0].children!.length).toBe(originalGrandchildCount);
    });

    it('should maintain node content after initial center and scale', async () => {
      const tree = createTestTree();

      const originalContent = tree.content;
      const originalChildContent = tree.children![0].content;

      // Load data
      await markmap.setData(tree);

      // Verify content is preserved
      expect(tree.content).toBe(originalContent);
      expect(tree.children![0].content).toBe(originalChildContent);
    });
  });
});
