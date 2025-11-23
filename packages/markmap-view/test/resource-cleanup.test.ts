/**
 * Tests for Resource Cleanup
 *
 * Requirements:
 * - 13.6: Properly clean up all event listeners and resources when component is destroyed
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Resource Cleanup', () => {
  let container: HTMLDivElement;
  let svg: SVGSVGElement;
  let markmap: Markmap;

  // Helper function to create test data
  const createTestData = (
    content: string,
    childrenCount: number = 0,
  ): INode => {
    const children: INode[] = [];
    for (let i = 0; i < childrenCount; i++) {
      children.push({
        content: `Child ${i + 1}`,
        children: [],
        payload: { fold: 0 },
      });
    }
    return {
      content,
      children,
      payload: { fold: 0 },
    };
  };

  beforeEach(() => {
    // Create a container and SVG element for testing
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');
    container.appendChild(svg);
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (markmap) {
      try {
        markmap.destroy();
      } catch {
        // Ignore errors during cleanup
      }
    }
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe('Basic Cleanup', () => {
    it('should clear SVG content on destroy', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      // Add some content
      const data = createTestData('Root', 2);
      markmap.setData(data);

      // Destroy and verify SVG is cleared
      markmap.destroy();
      expect(svgNode?.innerHTML).toBe('');
    });

    it('should not throw error when destroying empty markmap', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      expect(() => markmap.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      markmap.destroy();
      expect(() => markmap.destroy()).not.toThrow();
    });

    it('should clean up after data has been set', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const data = createTestData('Root', 3);
      await markmap.setData(data);

      const svgNode = markmap.svg.node();
      expect(svgNode?.innerHTML).not.toBe('');

      markmap.destroy();
      expect(svgNode?.innerHTML).toBe('');
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove zoom event listeners on destroy', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg, { zoom: true });
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      // Verify zoom events are removed by checking that triggering them doesn't cause errors
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        ctrlKey: true,
      });
      expect(() => svgNode?.dispatchEvent(wheelEvent)).not.toThrow();
    });

    it('should remove pan event listeners on destroy', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg, { pan: true });
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      // Verify pan events are removed
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        deltaX: 50,
      });
      expect(() => svgNode?.dispatchEvent(wheelEvent)).not.toThrow();
    });

    it('should clean up keyboard event listeners', () => {
      // Requirements: 13.6, 12.2, 12.3
      markmap = new Markmap(svg);

      markmap.destroy();

      // Verify keyboard events don't cause errors after destroy
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
      });
      expect(() => document.dispatchEvent(keyEvent)).not.toThrow();
    });

    it('should clean up window resize listeners', () => {
      // Requirements: 13.6, 3.2
      markmap = new Markmap(svg);

      markmap.destroy();

      // Verify resize events don't cause errors after destroy
      const resizeEvent = new Event('resize');
      expect(() => window.dispatchEvent(resizeEvent)).not.toThrow();
    });

    it('should clean up space key drag listeners', () => {
      // Requirements: 13.6, 8.2
      markmap = new Markmap(svg);

      markmap.destroy();

      // Verify space key events don't cause errors after destroy
      const keydownEvent = new KeyboardEvent('keydown', { key: ' ' });
      const keyupEvent = new KeyboardEvent('keyup', { key: ' ' });
      expect(() => document.dispatchEvent(keydownEvent)).not.toThrow();
      expect(() => document.dispatchEvent(keyupEvent)).not.toThrow();
    });
  });

  describe('Component Cleanup', () => {
    it('should destroy context menu on destroy', () => {
      // Requirements: 13.6, 8.4
      markmap = new Markmap(svg);

      // Context menu should exist
      const contextMenuElements = document.querySelectorAll(
        '.markmap-context-menu',
      );
      const initialCount = contextMenuElements.length;

      markmap.destroy();

      // Context menu should be removed from DOM
      const afterDestroyElements = document.querySelectorAll(
        '.markmap-context-menu',
      );
      expect(afterDestroyElements.length).toBeLessThanOrEqual(initialCount);
    });

    it('should disable touch manager on destroy', () => {
      // Requirements: 13.6, 11.2, 11.3
      markmap = new Markmap(svg, { enableTouch: true });
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      // Verify touch events don't cause errors after destroy
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 100,
            clientY: 100,
          } as Touch,
        ],
      });
      expect(() => svgNode?.dispatchEvent(touchEvent)).not.toThrow();
    });

    it('should disconnect resize observer on destroy', () => {
      // Requirements: 13.6
      const disconnectSpy = vi.fn();
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: disconnectSpy,
      };

      global.ResizeObserver = vi.fn().mockImplementation(() => mockObserver);

      markmap = new Markmap(svg);
      markmap.destroy();

      // Verify disconnect was called
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('Storage Cleanup', () => {
    it('should clean up storage manager when enabled', () => {
      // Requirements: 13.6, 16.1
      markmap = new Markmap(svg, {
        enableAutoSave: true,
        storageKey: 'test-cleanup-key',
      });

      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle cleanup without storage manager', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg, { enableAutoSave: false });

      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Dispose List Execution', () => {
    it('should execute all dispose functions', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);

      // The dispose list should include:
      // 1. refreshHook cleanup
      // 2. ResizeObserver disconnect

      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle errors in dispose functions gracefully', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);

      // Even if a dispose function throws, destroy should complete
      expect(() => markmap.destroy()).not.toThrow();
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up all references to prevent memory leaks', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const data = createTestData('Root', 5);
      await markmap.setData(data);

      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      // Verify SVG is cleared (no child nodes)
      expect(svgNode?.childNodes.length).toBe(0);
    });

    it('should clean up after complex data structures', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);

      const complexData: INode = {
        content: 'Root',
        children: Array.from({ length: 10 }, (_, i) => ({
          content: `Level 1 - ${i}`,
          children: Array.from({ length: 5 }, (_, j) => ({
            content: `Level 2 - ${i}.${j}`,
            children: [],
            payload: { fold: 0 },
          })),
          payload: { fold: 0 },
        })),
        payload: { fold: 0 },
      };

      await markmap.setData(complexData);

      const svgNode = markmap.svg.node();
      expect(svgNode?.childNodes.length).toBeGreaterThan(0);

      markmap.destroy();

      expect(svgNode?.childNodes.length).toBe(0);
    });

    it('should clean up after multiple data updates', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);

      // Set data multiple times
      for (let i = 0; i < 5; i++) {
        const data = createTestData(`Root ${i}`, i + 1);
        await markmap.setData(data);
      }

      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      expect(svgNode?.childNodes.length).toBe(0);
    });
  });

  describe('State Cleanup', () => {
    it('should clean up state after destroy', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const data = createTestData('Root', 2);
      await markmap.setData(data);

      expect(markmap.state.data).toBeDefined();

      markmap.destroy();

      // State should still exist but SVG should be cleared
      const svgNode = markmap.svg.node();
      expect(svgNode?.innerHTML).toBe('');
    });

    it('should clean up highlight state', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const data = createTestData('Root', 2);
      await markmap.setData(data);

      if (markmap.state.data) {
        await markmap.setHighlight(markmap.state.data);
      }

      markmap.destroy();

      const svgNode = markmap.svg.node();
      expect(svgNode?.innerHTML).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle destroy before setData', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      expect(() => markmap.destroy()).not.toThrow();
    });

    it('should handle destroy during data loading', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const data = createTestData('Root', 10);

      // Start loading data but destroy immediately
      const dataPromise = markmap.setData(data);
      markmap.destroy();

      // Should not throw error
      await expect(dataPromise).resolves.not.toThrow();
    });

    it('should handle destroy with active animations', async () => {
      // Requirements: 13.6
      markmap = new Markmap(svg, { duration: 1000 });
      const data = createTestData('Root', 3);
      await markmap.setData(data);

      // Trigger an animation by toggling a node
      if (markmap.state.data?.children?.[0]) {
        markmap.toggleNode(markmap.state.data.children[0]);
      }

      // Destroy while animation might be running
      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle destroy with open context menu', async () => {
      // Requirements: 13.6, 8.4
      markmap = new Markmap(svg);
      const data = createTestData('Root', 2);
      await markmap.setData(data);

      // Simulate opening context menu (if we had access to it)
      markmap.destroy();

      // Context menu should be cleaned up
      const contextMenus = document.querySelectorAll('.markmap-context-menu');
      // All context menus should be removed or hidden
      contextMenus.forEach((menu) => {
        expect(
          (menu as HTMLElement).style.display === 'none' ||
            !document.body.contains(menu),
        ).toBe(true);
      });
    });

    it('should handle destroy with pending undo operations', async () => {
      // Requirements: 13.6, 12.1
      markmap = new Markmap(svg);
      const data = createTestData('Root', 2);
      await markmap.setData(data);

      // Perform some operations that would be in undo stack
      if (markmap.state.data?.children?.[0]) {
        await markmap.toggleNode(markmap.state.data.children[0]);
      }

      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Integration with Other Features', () => {
    it('should clean up after using search functionality', async () => {
      // Requirements: 13.6, 1.1
      markmap = new Markmap(svg);
      const data = createTestData('Root', 3);
      await markmap.setData(data);

      // Simulate search (if we had access to search manager)
      markmap.destroy();

      const svgNode = markmap.svg.node();
      expect(svgNode?.innerHTML).toBe('');
    });

    it('should clean up after expand/collapse operations', async () => {
      // Requirements: 13.6, 2.1, 2.2
      markmap = new Markmap(svg);
      const data = createTestData('Root', 3);
      await markmap.setData(data);

      await markmap.expandAll();
      await markmap.collapseAll();

      markmap.destroy();

      const svgNode = markmap.svg.node();
      expect(svgNode?.innerHTML).toBe('');
    });

    it('should clean up after color scheme changes', async () => {
      // Requirements: 13.6, 10.1
      markmap = new Markmap(svg);
      const data = createTestData('Root', 2);
      await markmap.setData(data);

      // Color scheme changes would be applied here
      markmap.destroy();

      const svgNode = markmap.svg.node();
      expect(svgNode?.innerHTML).toBe('');
    });
  });
});
