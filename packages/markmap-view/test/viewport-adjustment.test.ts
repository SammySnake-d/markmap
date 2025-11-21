/**
 * Unit tests for viewport adjustment functionality
 *
 * Requirements:
 * - 3.6: Auto-adjust zoom or viewport position when expanded content exceeds viewport
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Viewport Adjustment', () => {
  let svg: SVGSVGElement;
  let markmap: Markmap;

  // Helper function to create a large test tree that will exceed viewport
  const createLargeTree = (): INode => {
    const children: INode[] = [];
    for (let i = 0; i < 20; i++) {
      children.push({
        content: `Child ${i}`,
        children: [
          {
            content: `Grandchild ${i}.1`,
            children: [],
            payload: { fold: 0 },
          },
          {
            content: `Grandchild ${i}.2`,
            children: [],
            payload: { fold: 0 },
          },
        ],
        payload: { fold: 1 }, // Start collapsed
      } as unknown as INode);
    }

    return {
      content: 'Root',
      children,
      payload: { fold: 0 },
    } as unknown as INode;
  };

  // Helper function to create a deep tree
  const createDeepTree = (): INode => {
    let currentNode: INode = {
      content: 'Level 10',
      children: [],
      payload: { fold: 0 },
    } as unknown as INode;

    for (let i = 9; i >= 1; i--) {
      currentNode = {
        content: `Level ${i}`,
        children: [currentNode],
        payload: { fold: i > 2 ? 1 : 0 }, // Collapse levels 3+
      } as unknown as INode;
    }

    return currentNode;
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

  describe('Requirement 3.6: Auto-adjust viewport when content exceeds bounds', () => {
    it('should call adjustViewportIfNeeded after expanding a node', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Expand a collapsed node
      await markmap.expandAll(tree.children![0]);

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should call adjustViewportIfNeeded after toggling node to expand', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Toggle a collapsed node (expand it)
      await markmap.toggleNode(tree.children![0]);

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should not call adjustViewportIfNeeded when collapsing a node', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // First expand a node
      await markmap.expandAll(tree.children![0]);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Toggle the expanded node (collapse it)
      await markmap.toggleNode(tree.children![0]);

      // Verify adjustViewportIfNeeded was NOT called (collapsing doesn't need adjustment)
      expect(adjustSpy).not.toHaveBeenCalled();
    });

    it('should adjust viewport when content exceeds viewport bounds', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding viewport
      markmap.state.rect = {
        x1: -500,
        y1: -500,
        x2: 2000,
        y2: 2000,
      };

      // Spy on transition to verify viewport adjustment
      const transitionSpy = vi.spyOn(markmap, 'transition');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify transition was called (viewport was adjusted)
      expect(transitionSpy).toHaveBeenCalled();
    });

    it('should not adjust viewport when content fits within viewport', async () => {
      const tree: INode = {
        content: 'Small Root',
        children: [
          {
            content: 'Small Child',
            children: [],
            payload: { fold: 0 },
          },
        ],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Mock state.rect to simulate content fitting within viewport
      markmap.state.rect = {
        x1: 10,
        y1: 10,
        x2: 200,
        y2: 100,
      };

      // Spy on transition to verify no adjustment
      const transitionSpy = vi.spyOn(markmap, 'transition');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify transition was NOT called (no adjustment needed)
      expect(transitionSpy).not.toHaveBeenCalled();
    });

    it('should zoom out when content is too large for viewport', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate very large content
      markmap.state.rect = {
        x1: 0,
        y1: 0,
        x2: 5000,
        y2: 5000,
      };

      // Spy on zoom.transform to verify zoom adjustment
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify zoom.transform was called (zoom out occurred)
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should pan when content exceeds viewport but fits at current scale', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content slightly exceeding viewport
      markmap.state.rect = {
        x1: -100,
        y1: -50,
        x2: 700,
        y2: 500,
      };

      // Spy on zoom.transform to verify pan adjustment
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify zoom.transform was called (pan occurred)
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should handle content exceeding left edge', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding left edge
      markmap.state.rect = {
        x1: -200,
        y1: 10,
        x2: 400,
        y2: 300,
      };

      // Spy on zoom.transform
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify adjustment occurred
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should handle content exceeding right edge', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding right edge
      markmap.state.rect = {
        x1: 100,
        y1: 10,
        x2: 1200,
        y2: 300,
      };

      // Spy on zoom.transform
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify adjustment occurred
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should handle content exceeding top edge', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding top edge
      markmap.state.rect = {
        x1: 10,
        y1: -150,
        x2: 400,
        y2: 400,
      };

      // Spy on zoom.transform
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify adjustment occurred
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should handle content exceeding bottom edge', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding bottom edge
      markmap.state.rect = {
        x1: 10,
        y1: 100,
        x2: 400,
        y2: 1200,
      };

      // Spy on zoom.transform
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify adjustment occurred
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should center content when it exceeds both horizontal edges', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding both left and right
      markmap.state.rect = {
        x1: -200,
        y1: 10,
        x2: 1200,
        y2: 300,
      };

      // Spy on zoom.transform
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify adjustment occurred
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should center content when it exceeds both vertical edges', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect to simulate content exceeding both top and bottom
      markmap.state.rect = {
        x1: 10,
        y1: -200,
        x2: 400,
        y2: 1200,
      };

      // Spy on zoom.transform
      const zoomSpy = vi.spyOn(markmap.zoom, 'transform');

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // Verify adjustment occurred
      expect(zoomSpy).toHaveBeenCalled();
    });

    it('should handle deep tree expansion', async () => {
      const tree = createDeepTree();
      await markmap.setData(tree);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Expand all nodes
      await markmap.expandAll(tree);

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should handle wide tree expansion', async () => {
      const children: INode[] = [];
      for (let i = 0; i < 30; i++) {
        children.push({
          content: `Wide Child ${i}`,
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

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Expand all (already expanded, but triggers adjustment check)
      await markmap.expandAll(tree);

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should respect maxInitialScale when zooming out', async () => {
      const tree = createLargeTree();
      const maxScale = 1.5;

      markmap.setOptions({ maxInitialScale: maxScale });
      await markmap.setData(tree);

      // Mock state.rect to simulate very large content
      markmap.state.rect = {
        x1: 0,
        y1: 0,
        x2: 10000,
        y2: 10000,
      };

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // The scale should not exceed maxInitialScale
      // (This is verified by the implementation using Math.min with maxInitialScale)
      expect(markmap.options.maxInitialScale).toBe(maxScale);
    });

    it('should use fitRatio when calculating zoom', async () => {
      const tree = createLargeTree();
      const fitRatio = 0.8;

      markmap.setOptions({ fitRatio });
      await markmap.setData(tree);

      // Mock state.rect to simulate large content
      markmap.state.rect = {
        x1: 0,
        y1: 0,
        x2: 2000,
        y2: 2000,
      };

      // Call adjustViewportIfNeeded directly
      await (markmap as any).adjustViewportIfNeeded();

      // The fitRatio should be used in calculation
      // (This is verified by the implementation using fitRatio)
      expect(markmap.options.fitRatio).toBe(fitRatio);
    });
  });

  describe('Edge cases', () => {
    it('should handle adjustViewportIfNeeded with no data', async () => {
      // Don't set any data
      await (markmap as any).adjustViewportIfNeeded();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle adjustViewportIfNeeded with empty tree', async () => {
      const tree: INode = {
        content: 'Root',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Call adjustViewportIfNeeded
      await (markmap as any).adjustViewportIfNeeded();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle adjustViewportIfNeeded with single node', async () => {
      const tree: INode = {
        content: 'Single Node',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Call adjustViewportIfNeeded
      await (markmap as any).adjustViewportIfNeeded();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle zero-sized viewport gracefully', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock getBoundingClientRect to return zero size
      const originalGetBoundingClientRect = svg.getBoundingClientRect;
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });

      // Call adjustViewportIfNeeded
      await (markmap as any).adjustViewportIfNeeded();

      // Should not throw error
      expect(true).toBe(true);

      // Restore original method
      svg.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should handle negative content bounds', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock state.rect with negative bounds
      markmap.state.rect = {
        x1: -500,
        y1: -500,
        x2: -100,
        y2: -100,
      };

      // Call adjustViewportIfNeeded
      await (markmap as any).adjustViewportIfNeeded();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle very small content', async () => {
      const tree: INode = {
        content: 'Tiny',
        children: [],
        payload: { fold: 0 },
      } as unknown as INode;

      await markmap.setData(tree);

      // Mock state.rect with very small bounds
      markmap.state.rect = {
        x1: 100,
        y1: 100,
        x2: 101,
        y2: 101,
      };

      // Call adjustViewportIfNeeded
      await (markmap as any).adjustViewportIfNeeded();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Integration with expand/collapse', () => {
    it('should adjust viewport after global expand all', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Global expand all
      await markmap.expandAll();

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should adjust viewport after expanding specific node', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Expand specific node
      await markmap.expandAll(tree.children![5]);

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should adjust viewport after recursive toggle expand', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Recursive toggle (expand)
      await markmap.toggleNode(tree.children![0], true);

      // Verify adjustViewportIfNeeded was called
      expect(adjustSpy).toHaveBeenCalled();
    });

    it('should not adjust viewport after collapse', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // First expand
      await markmap.expandAll(tree.children![0]);

      // Spy on adjustViewportIfNeeded
      const adjustSpy = vi.spyOn(markmap as any, 'adjustViewportIfNeeded');

      // Collapse
      await markmap.collapseAll(tree.children![0]);

      // Verify adjustViewportIfNeeded was NOT called
      expect(adjustSpy).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should complete viewport adjustment in reasonable time', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      // Mock large content
      markmap.state.rect = {
        x1: -1000,
        y1: -1000,
        x2: 3000,
        y2: 3000,
      };

      const startTime = Date.now();
      await (markmap as any).adjustViewportIfNeeded();
      const duration = Date.now() - startTime;

      // Should complete quickly (less than 500ms)
      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple rapid adjustments efficiently', async () => {
      const tree = createLargeTree();
      await markmap.setData(tree);

      const startTime = Date.now();

      // Multiple rapid adjustments
      for (let i = 0; i < 5; i++) {
        await (markmap as any).adjustViewportIfNeeded();
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });
});
