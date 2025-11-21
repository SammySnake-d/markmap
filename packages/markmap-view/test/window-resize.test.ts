/**
 * Unit tests for window resize responsiveness
 *
 * Requirements:
 * - 3.2: Auto-scale mindmap when browser window size changes
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Window Resize Responsiveness', () => {
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
          ],
          payload: { fold: 0 },
        },
        {
          content: 'Child 2',
          children: [],
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

  describe('Requirement 3.2: Window resize auto-scaling', () => {
    it('should register window resize event listener on initialization', () => {
      // Spy on addEventListener
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      // Create a new markmap instance
      const newSvg = createMockSVG();
      const newMarkmap = new Markmap(newSvg);

      // Verify resize listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
      );

      newMarkmap.destroy();
      addEventListenerSpy.mockRestore();
    });

    it('should call fit() when window is resized', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize event
      window.dispatchEvent(new Event('resize'));

      // Wait for debounced handler (300ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should debounce resize events', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger multiple rapid resize events
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));

      // Wait for debounced handler
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called only once (debounced)
      expect(fitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle resize when data is not loaded', async () => {
      // Don't load any data
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize event
      window.dispatchEvent(new Event('resize'));

      // Wait for debounced handler
      await new Promise((resolve) => setTimeout(resolve, 400));

      // fit should not be called when there's no data
      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('should remove resize listener on destroy', () => {
      // Spy on removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Destroy markmap
      markmap.destroy();

      // Verify resize listener was removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should not call fit after destroy', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Destroy markmap
      markmap.destroy();

      // Clear previous calls
      fitSpy.mockClear();

      // Trigger window resize event
      window.dispatchEvent(new Event('resize'));

      // Wait for debounced handler
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was not called after destroy
      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple resize events over time', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // First resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Second resize after debounce period
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Third resize after debounce period
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called for each debounced period
      expect(fitSpy).toHaveBeenCalledTimes(3);
    });

    it('should maintain viewport state after resize', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Initial fit
      await markmap.fit();

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify state is still valid
      expect(markmap.state.data).toBeDefined();
      expect(markmap.state.rect).toBeDefined();
    });

    it('should handle resize with collapsed nodes', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse some nodes
      await markmap.collapseAll(tree.children![0]);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should handle resize with expanded nodes', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      // Collapse then expand
      await markmap.collapseAll(tree);
      await markmap.expandAll(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle resize with empty tree', async () => {
      const tree: INode = {
        content: 'Root',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should handle resize with large tree', async () => {
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

      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should handle resize with deeply nested tree', async () => {
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

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should complete resize handling in reasonable time', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = Date.now();

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      const duration = Date.now() - startTime;

      // Should complete within debounce time + reasonable processing time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid resize events efficiently', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = Date.now();

      // Trigger many rapid resize events
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(new Event('resize'));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Wait for final debounce
      await new Promise((resolve) => setTimeout(resolve, 400));

      const duration = Date.now() - startTime;

      // Should complete efficiently despite many events
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Integration with other features', () => {
    it('should work with autoFit option', async () => {
      markmap.setOptions({ autoFit: true });

      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with custom fitRatio', async () => {
      markmap.setOptions({ fitRatio: 0.8 });

      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called with custom options
      expect(fitSpy).toHaveBeenCalled();
      expect(markmap.options.fitRatio).toBe(0.8);
    });

    it('should work with zoom enabled', async () => {
      markmap.setOptions({ zoom: true });

      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });

    it('should work with pan enabled', async () => {
      markmap.setOptions({ pan: true });

      const tree = createTestTree();
      await markmap.setData(tree);

      // Spy on fit method
      const fitSpy = vi.spyOn(markmap, 'fit');

      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify fit was called
      expect(fitSpy).toHaveBeenCalled();
    });
  });
});
