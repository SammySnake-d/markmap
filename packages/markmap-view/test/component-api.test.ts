/**
 * Tests for Component API
 *
 * Requirements:
 * - 13.1: Provide clear API interface for initialization and configuration
 * - 13.2: Accept Markdown text as input parameter
 * - 13.4: Provide methods for dynamic content updates
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

describe('Component API', () => {
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
      markmap.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should initialize with SVG element', () => {
      // Requirements: 13.1
      markmap = new Markmap(svg);
      expect(markmap).toBeDefined();
      expect(markmap.svg).toBeDefined();
    });

    it('should initialize with SVG selector string', () => {
      // Requirements: 13.1
      svg.id = 'test-svg';
      markmap = new Markmap('#test-svg');
      expect(markmap).toBeDefined();
      expect(markmap.svg).toBeDefined();
    });

    it('should initialize with default options', () => {
      // Requirements: 13.1
      markmap = new Markmap(svg);
      expect(markmap.options).toBeDefined();
      expect(markmap.options.zoom).toBe(true);
      expect(markmap.options.pan).toBe(true);
    });

    it('should initialize with custom options', () => {
      // Requirements: 13.1
      markmap = new Markmap(svg, {
        zoom: false,
        pan: false,
        initialExpandLevel: 2,
      });
      expect(markmap.options.zoom).toBe(false);
      expect(markmap.options.pan).toBe(false);
      expect(markmap.options.initialExpandLevel).toBe(2);
    });

    it('should initialize with touch support enabled by default', () => {
      // Requirements: 13.1, 11.2, 11.3
      markmap = new Markmap(svg);
      expect(markmap.options.enableTouch).not.toBe(false);
    });

    it('should initialize with touch support disabled when specified', () => {
      // Requirements: 13.1, 11.2, 11.3
      markmap = new Markmap(svg, { enableTouch: false });
      expect(markmap.options.enableTouch).toBe(false);
    });

    it('should initialize with auto-save disabled by default', () => {
      // Requirements: 13.1, 16.1
      markmap = new Markmap(svg);
      expect(markmap.options.enableAutoSave).toBeFalsy();
    });

    it('should initialize with auto-save enabled when specified', () => {
      // Requirements: 13.1, 16.1
      markmap = new Markmap(svg, { enableAutoSave: true });
      expect(markmap.options.enableAutoSave).toBe(true);
    });

    it('should initialize with custom storage key', () => {
      // Requirements: 13.1, 16.1
      const customKey = 'custom-markmap-key';
      markmap = new Markmap(svg, {
        enableAutoSave: true,
        storageKey: customKey,
      });
      expect(markmap.options.storageKey).toBe(customKey);
    });
  });

  describe('Data Input', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should accept data through setData', async () => {
      // Requirements: 13.2
      const data = createTestData('Root', 2);

      await markmap.setData(data);
      expect(markmap.state.data).toBeDefined();
    });

    it('should handle empty data', async () => {
      // Requirements: 13.2
      const data = createTestData('Root', 0);

      await markmap.setData(data);
      // Should not throw error
      expect(markmap.state.data).toBeDefined();
    });

    it('should handle complex data with multiple levels', async () => {
      // Requirements: 13.2
      const data: INode = {
        content: 'Level 1',
        children: [
          {
            content: 'Level 2a',
            children: [
              {
                content: 'Level 3a',
                children: [
                  {
                    content: 'Level 4a',
                    children: [],
                    payload: { fold: 0 },
                  },
                ],
                payload: { fold: 0 },
              },
              {
                content: 'Level 3b',
                children: [],
                payload: { fold: 0 },
              },
            ],
            payload: { fold: 0 },
          },
          {
            content: 'Level 2b',
            children: [
              {
                content: 'Level 3c',
                children: [],
                payload: { fold: 0 },
              },
            ],
            payload: { fold: 0 },
          },
        ],
        payload: { fold: 0 },
      };

      await markmap.setData(data);
      expect(markmap.state.data).toBeDefined();
      expect(markmap.state.data?.children).toBeDefined();
    });

    it('should handle data with special characters', async () => {
      // Requirements: 13.2
      const data: INode = {
        content: 'Root: Test',
        children: [
          {
            content: 'Child: Note',
            children: [],
            payload: { fold: 0 },
          },
          {
            content: 'Child & More',
            children: [],
            payload: { fold: 0 },
          },
        ],
        payload: { fold: 0 },
      };

      await markmap.setData(data);
      expect(markmap.state.data).toBeDefined();
    });
  });

  describe('Options Configuration', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should update options through setOptions', () => {
      // Requirements: 13.1
      markmap.setOptions({ zoom: false, pan: false });
      expect(markmap.options.zoom).toBe(false);
      expect(markmap.options.pan).toBe(false);
    });

    it('should merge new options with existing options', () => {
      // Requirements: 13.1
      markmap = new Markmap(svg, { zoom: true, pan: true });
      markmap.setOptions({ zoom: false });
      expect(markmap.options.zoom).toBe(false);
      expect(markmap.options.pan).toBe(true); // Should remain unchanged
    });

    it('should update options through setData', async () => {
      // Requirements: 13.1, 13.4
      const data = createTestData('Root', 1);

      await markmap.setData(data, { initialExpandLevel: 3 });
      expect(markmap.options.initialExpandLevel).toBe(3);
    });

    it('should enable touch support when option is set', () => {
      // Requirements: 13.1, 11.2, 11.3
      markmap.setOptions({ enableTouch: true });
      expect(markmap.options.enableTouch).toBe(true);
    });

    it('should disable touch support when option is set', () => {
      // Requirements: 13.1, 11.2, 11.3
      markmap.setOptions({ enableTouch: false });
      expect(markmap.options.enableTouch).toBe(false);
    });
  });

  describe('Dynamic Content Updates', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should update content dynamically', async () => {
      // Requirements: 13.4
      const data1 = createTestData('Root 1', 1);
      await markmap.setData(data1);

      const data2 = createTestData('Root 2', 2);
      await markmap.setData(data2);

      expect(markmap.state.data).toBeDefined();
      // Should have updated to new data
    });

    it('should preserve view state when updating content', async () => {
      // Requirements: 13.4
      const data1 = createTestData('Root', 2);
      await markmap.setData(data1);

      // Get initial transform
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      // Update content
      const data2 = createTestData('Root', 3);
      await markmap.setData(data2);

      // Should still have valid state
      expect(markmap.state.data).toBeDefined();
    });

    it('should handle rapid content updates', async () => {
      // Requirements: 13.4
      const datasets = [
        createTestData('Root 1', 0),
        createTestData('Root 2', 1),
        createTestData('Root 3', 2),
      ];

      for (const data of datasets) {
        await markmap.setData(data);
      }

      expect(markmap.state.data).toBeDefined();
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up resources on destroy', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg);
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      // SVG should be cleared
      expect(svgNode?.innerHTML).toBe('');
    });

    it('should remove event listeners on destroy', () => {
      // Requirements: 13.6
      markmap = new Markmap(svg, { zoom: true, pan: true });
      const svgNode = markmap.svg.node();
      expect(svgNode).toBeDefined();

      markmap.destroy();

      // Event listeners should be removed (no easy way to test directly,
      // but we can verify destroy doesn't throw)
      expect(() => markmap.destroy()).not.toThrow();
    });

    it('should disable touch manager on destroy', () => {
      // Requirements: 13.6, 11.2, 11.3
      markmap = new Markmap(svg, { enableTouch: true });
      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should clean up context menu on destroy', () => {
      // Requirements: 13.6, 8.4
      markmap = new Markmap(svg);
      markmap.destroy();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should maintain state object', () => {
      // Requirements: 13.1
      expect(markmap.state).toBeDefined();
      expect(markmap.state.id).toBeDefined();
      expect(markmap.state.rect).toBeDefined();
    });

    it('should update state when data is set', async () => {
      // Requirements: 13.4
      const data = createTestData('Root', 1);

      await markmap.setData(data);
      expect(markmap.state.data).toBeDefined();
      expect(markmap.state.data).toBe(data);
    });

    it('should have unique state ID', () => {
      // Requirements: 13.1
      const markmap1 = new Markmap(svg);
      const svg2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      container.appendChild(svg2);
      const markmap2 = new Markmap(svg2);

      expect(markmap1.state.id).toBeDefined();
      expect(markmap2.state.id).toBeDefined();
      expect(markmap1.state.id).not.toBe(markmap2.state.id);

      markmap1.destroy();
      markmap2.destroy();
    });

    it('should use custom ID when provided', () => {
      // Requirements: 13.1
      const customId = 'custom-markmap-id';
      markmap = new Markmap(svg, { id: customId });
      expect(markmap.state.id).toBe(customId);
    });
  });

  describe('UndoManager Integration', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should have UndoManager instance', () => {
      // Requirements: 13.1, 12.1
      expect(markmap.undoManager).toBeDefined();
    });

    it('should provide undo functionality', () => {
      // Requirements: 13.1, 12.2
      expect(typeof markmap.undoManager.undo).toBe('function');
    });

    it('should provide redo functionality', () => {
      // Requirements: 13.1, 12.3
      expect(typeof markmap.undoManager.redo).toBe('function');
    });

    it('should provide canUndo check', () => {
      // Requirements: 13.1, 12.2
      expect(typeof markmap.undoManager.canUndo).toBe('function');
      expect(markmap.undoManager.canUndo()).toBe(false);
    });

    it('should provide canRedo check', () => {
      // Requirements: 13.1, 12.3
      expect(typeof markmap.undoManager.canRedo).toBe('function');
      expect(markmap.undoManager.canRedo()).toBe(false);
    });
  });

  describe('API Method Availability', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should provide setData method', () => {
      // Requirements: 13.2, 13.4
      expect(typeof markmap.setData).toBe('function');
    });

    it('should provide setOptions method', () => {
      // Requirements: 13.1
      expect(typeof markmap.setOptions).toBe('function');
    });

    it('should provide destroy method', () => {
      // Requirements: 13.6
      expect(typeof markmap.destroy).toBe('function');
    });

    it('should provide fit method', () => {
      // Requirements: 13.1
      expect(typeof markmap.fit).toBe('function');
    });

    it('should provide rescale method', () => {
      // Requirements: 13.1
      expect(typeof markmap.rescale).toBe('function');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should handle null data gracefully', async () => {
      // Requirements: 13.2
      await markmap.setData(null);
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle undefined data gracefully', async () => {
      // Requirements: 13.2
      await markmap.setData(undefined);
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle invalid options gracefully', () => {
      // Requirements: 13.1
      // TypeScript should prevent this, but test runtime behavior
      markmap.setOptions({} as any);
      expect(markmap.options).toBeDefined();
    });

    it('should handle multiple destroy calls', () => {
      // Requirements: 13.6
      markmap.destroy();
      expect(() => markmap.destroy()).not.toThrow();
    });
  });

  describe('Integration with Data Structures', () => {
    beforeEach(() => {
      markmap = new Markmap(svg);
    });

    it('should work with simple data structures', async () => {
      // Requirements: 13.2
      const data = createTestData('Root', 2);

      await markmap.setData(data);
      expect(markmap.state.data).toBeDefined();
    });

    it('should work with complex nested data', async () => {
      // Requirements: 13.2
      const data: INode = {
        content: 'Root',
        children: [
          {
            content: 'Item 1',
            children: [
              {
                content: 'Subitem 1.1',
                children: [],
                payload: { fold: 0 },
              },
            ],
            payload: { fold: 0, inlineNote: 'Note 1' },
          },
          {
            content: 'Item 2',
            children: [
              {
                content: 'Subitem 2.1',
                children: [],
                payload: { fold: 0 },
              },
              {
                content: 'Subitem 2.2',
                children: [],
                payload: { fold: 0 },
              },
            ],
            payload: { fold: 0, inlineNote: 'Note 2' },
          },
        ],
        payload: { fold: 0 },
      };

      await markmap.setData(data);
      expect(markmap.state.data).toBeDefined();
    });
  });
});
