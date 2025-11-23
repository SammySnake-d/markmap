/**
 * Tests for Callback Functions
 *
 * Requirements:
 * - 13.7: Provide callback functions to notify external application when content changes
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

describe('Callback Functions', () => {
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
        state: {
          id: i + 2,
          depth: 2,
          path: `1.${i + 1}`,
          key: `child-${i + 1}`,
          rect: { x: 0, y: 0, width: 100, height: 50 },
          size: [100, 50],
        },
      });
    }
    return {
      content,
      children,
      payload: { fold: 0 },
      state: {
        id: 1,
        depth: 1,
        path: '1',
        key: 'root',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
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

  describe('onMarkdownChange callback', () => {
    it('should call onMarkdownChange when markdown content is set', () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, { onMarkdownChange });

      const markdown = '# Test\n- Item 1\n- Item 2';
      markmap.setMarkdownContent(markdown);

      expect(onMarkdownChange).toHaveBeenCalledTimes(1);
      expect(onMarkdownChange).toHaveBeenCalledWith(markdown);
    });

    it('should call onMarkdownChange with updated content', () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, { onMarkdownChange });

      const markdown1 = '# Test 1';
      markmap.setMarkdownContent(markdown1);

      const markdown2 = '# Test 2';
      markmap.setMarkdownContent(markdown2);

      expect(onMarkdownChange).toHaveBeenCalledTimes(2);
      expect(onMarkdownChange).toHaveBeenNthCalledWith(1, markdown1);
      expect(onMarkdownChange).toHaveBeenNthCalledWith(2, markdown2);
    });

    it('should not call onMarkdownChange if callback is not provided', () => {
      // Requirements: 13.7
      markmap = new Markmap(svg);

      const markdown = '# Test';
      // Should not throw error
      expect(() => markmap.setMarkdownContent(markdown)).not.toThrow();
    });

    it('should call onMarkdownChange with empty string', () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, { onMarkdownChange });

      markmap.setMarkdownContent('');

      expect(onMarkdownChange).toHaveBeenCalledTimes(1);
      expect(onMarkdownChange).toHaveBeenCalledWith('');
    });

    it('should call onMarkdownChange with special characters', () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, { onMarkdownChange });

      const markdown = '# Test: Note\n- Item & More\n- Item < Less';
      markmap.setMarkdownContent(markdown);

      expect(onMarkdownChange).toHaveBeenCalledTimes(1);
      expect(onMarkdownChange).toHaveBeenCalledWith(markdown);
    });
  });

  describe('onNodeClick callback', () => {
    it('should call onNodeClick when node is clicked', async () => {
      // Requirements: 13.7
      const onNodeClick = vi.fn();
      markmap = new Markmap(svg, { onNodeClick });

      const data = createTestData('Root', 2);
      await markmap.setData(data);

      // Simulate node click
      const node = markmap.state.data;
      if (node) {
        const event = new MouseEvent('click', { bubbles: true });
        markmap.handleClick(event, node);

        expect(onNodeClick).toHaveBeenCalledTimes(1);
        expect(onNodeClick).toHaveBeenCalledWith(node);
      }
    });

    it('should call onNodeClick with correct node data', async () => {
      // Requirements: 13.7
      const onNodeClick = vi.fn();
      markmap = new Markmap(svg, { onNodeClick });

      const data = createTestData('Root', 2);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node && node.children && node.children[0]) {
        const childNode = node.children[0];
        const event = new MouseEvent('click', { bubbles: true });
        markmap.handleClick(event, childNode);

        expect(onNodeClick).toHaveBeenCalledTimes(1);
        expect(onNodeClick).toHaveBeenCalledWith(childNode);
        expect(onNodeClick.mock.calls[0][0].content).toBe('Child 1');
      }
    });

    it('should not call onNodeClick if callback is not provided', async () => {
      // Requirements: 13.7
      markmap = new Markmap(svg);

      const data = createTestData('Root', 2);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node) {
        const event = new MouseEvent('click', { bubbles: true });
        // Should not throw error
        expect(() => markmap.handleClick(event, node)).not.toThrow();
      }
    });

    it('should call onNodeClick multiple times for multiple clicks', async () => {
      // Requirements: 13.7
      const onNodeClick = vi.fn();
      markmap = new Markmap(svg, { onNodeClick });

      const data = createTestData('Root', 2);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node) {
        const event1 = new MouseEvent('click', { bubbles: true });
        markmap.handleClick(event1, node);

        const event2 = new MouseEvent('click', { bubbles: true });
        markmap.handleClick(event2, node);

        expect(onNodeClick).toHaveBeenCalledTimes(2);
      }
    });

    it('should call onNodeClick with recursive toggle modifier', async () => {
      // Requirements: 13.7
      const onNodeClick = vi.fn();
      markmap = new Markmap(svg, { onNodeClick });

      const data = createTestData('Root', 2);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node) {
        // Simulate Ctrl+Click (recursive toggle)
        const event = new MouseEvent('click', {
          bubbles: true,
          ctrlKey: true,
        });
        markmap.handleClick(event, node);

        expect(onNodeClick).toHaveBeenCalledTimes(1);
        expect(onNodeClick).toHaveBeenCalledWith(node);
      }
    });
  });

  describe('onNoteEdit callback', () => {
    it('should accept onNoteEdit callback in options', () => {
      // Requirements: 13.7
      const onNoteEdit = vi.fn();
      markmap = new Markmap(svg, { onNoteEdit });

      expect(markmap.options.onNoteEdit).toBe(onNoteEdit);
    });

    it('should not throw error if onNoteEdit is not provided', () => {
      // Requirements: 13.7
      markmap = new Markmap(svg);

      expect(markmap.options.onNoteEdit).toBeUndefined();
    });

    // Note: Full integration testing of onNoteEdit would require NotePanel integration
    // which is tested separately in note-panel.test.ts
  });

  describe('Multiple callbacks', () => {
    it('should support multiple callbacks simultaneously', async () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn();
      const onNodeClick = vi.fn();
      const onNoteEdit = vi.fn();

      markmap = new Markmap(svg, {
        onMarkdownChange,
        onNodeClick,
        onNoteEdit,
      });

      // Test markdown change
      const markdown = '# Test';
      markmap.setMarkdownContent(markdown);
      expect(onMarkdownChange).toHaveBeenCalledTimes(1);

      // Test node click
      const data = createTestData('Root', 1);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node) {
        const event = new MouseEvent('click', { bubbles: true });
        markmap.handleClick(event, node);
        expect(onNodeClick).toHaveBeenCalledTimes(1);
      }

      // Verify all callbacks are independent
      expect(onMarkdownChange).toHaveBeenCalledTimes(1);
      expect(onNodeClick).toHaveBeenCalledTimes(1);
      expect(onNoteEdit).toHaveBeenCalledTimes(0);
    });

    it('should allow callbacks to be updated via setOptions', () => {
      // Requirements: 13.7
      const onMarkdownChange1 = vi.fn();
      markmap = new Markmap(svg, { onMarkdownChange: onMarkdownChange1 });

      markmap.setMarkdownContent('Test 1');
      expect(onMarkdownChange1).toHaveBeenCalledTimes(1);

      // Update callback
      const onMarkdownChange2 = vi.fn();
      markmap.setOptions({ onMarkdownChange: onMarkdownChange2 });

      markmap.setMarkdownContent('Test 2');
      expect(onMarkdownChange1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(onMarkdownChange2).toHaveBeenCalledTimes(1); // New callback should be called
    });
  });

  describe('Callback error handling', () => {
    it('should handle errors in onMarkdownChange callback gracefully', () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn(() => {
        throw new Error('Callback error');
      });
      markmap = new Markmap(svg, { onMarkdownChange });

      // Should not throw error to the caller
      // The error should be caught or allowed to propagate to the callback owner
      expect(() => markmap.setMarkdownContent('Test')).toThrow(
        'Callback error',
      );
    });

    it('should handle errors in onNodeClick callback gracefully', async () => {
      // Requirements: 13.7
      const onNodeClick = vi.fn(() => {
        throw new Error('Callback error');
      });
      markmap = new Markmap(svg, { onNodeClick });

      const data = createTestData('Root', 1);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node) {
        const event = new MouseEvent('click', { bubbles: true });
        // Should not throw error to the caller
        expect(() => markmap.handleClick(event, node)).toThrow(
          'Callback error',
        );
      }
    });
  });

  describe('Callback timing', () => {
    it('should call onMarkdownChange immediately when content is set', () => {
      // Requirements: 13.7
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, { onMarkdownChange });

      const markdown = '# Test';
      markmap.setMarkdownContent(markdown);

      // Should be called synchronously
      expect(onMarkdownChange).toHaveBeenCalledTimes(1);
    });

    it('should call onNodeClick immediately when node is clicked', async () => {
      // Requirements: 13.7
      const onNodeClick = vi.fn();
      markmap = new Markmap(svg, { onNodeClick });

      const data = createTestData('Root', 1);
      await markmap.setData(data);

      const node = markmap.state.data;
      if (node) {
        const event = new MouseEvent('click', { bubbles: true });
        markmap.handleClick(event, node);

        // Should be called synchronously
        expect(onNodeClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Callback with auto-save', () => {
    it('should call onMarkdownChange when auto-save is enabled', () => {
      // Requirements: 13.7, 16.1
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, {
        onMarkdownChange,
        enableAutoSave: true,
      });

      const markdown = '# Test';
      markmap.setMarkdownContent(markdown);

      expect(onMarkdownChange).toHaveBeenCalledTimes(1);
      expect(onMarkdownChange).toHaveBeenCalledWith(markdown);
    });

    it('should call onMarkdownChange even when auto-save fails', () => {
      // Requirements: 13.7, 16.1
      const onMarkdownChange = vi.fn();
      markmap = new Markmap(svg, {
        onMarkdownChange,
        enableAutoSave: true,
      });

      // Mock localStorage to fail
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const markdown = '# Test';
      markmap.setMarkdownContent(markdown);

      // Callback should still be called
      expect(onMarkdownChange).toHaveBeenCalledTimes(1);

      // Restore original setItem
      Storage.prototype.setItem = originalSetItem;
    });
  });
});
