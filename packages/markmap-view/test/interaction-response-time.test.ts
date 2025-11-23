/**
 * Unit tests for interaction response time optimization
 *
 * Requirements:
 * - 8.7: Ensure all interaction operations respond within 300ms
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Interaction Response Time - Requirement 8.7', () => {
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

  // Helper function to create a larger tree for performance testing
  const createLargeTree = (depth: number = 3, breadth: number = 5): INode => {
    const createNode = (level: number, index: number): INode => {
      const node: INode = {
        content: `Node L${level}-${index}`,
        children: [],
        payload: { fold: 0 },
      } as INode;

      if (level < depth) {
        for (let i = 0; i < breadth; i++) {
          node.children!.push(createNode(level + 1, i));
        }
      }

      return node;
    };

    return createNode(0, 0);
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

  describe('Node Click Response Time', () => {
    it('should respond to node click within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0];
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      const startTime = performance.now();
      markmap.handleClick(mockEvent, targetNode);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should respond to node click on large tree within 300ms', async () => {
      const tree = createLargeTree(4, 4); // 4 levels, 4 children each
      await markmap.setData(tree);

      const targetNode = tree.children![0];
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      const startTime = performance.now();
      markmap.handleClick(mockEvent, targetNode);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Expand/Collapse Response Time', () => {
    it('should expand node within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0];
      targetNode.payload!.fold = 1; // Collapse first

      const startTime = performance.now();
      await markmap.expandAll(targetNode);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should collapse node within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0];

      const startTime = performance.now();
      await markmap.collapseAll(targetNode);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should expand large tree within 300ms', async () => {
      const tree = createLargeTree(4, 4);
      await markmap.setData(tree);

      // Collapse all first
      await markmap.collapseAll(tree);

      const startTime = performance.now();
      await markmap.expandAll(tree);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Zoom and Pan Response Time', () => {
    it('should respond to zoom within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = performance.now();
      await markmap.rescale(1.5);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should respond to fit operation within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = performance.now();
      await markmap.fit();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should respond to center node within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0];

      const startTime = performance.now();
      await markmap.centerNode(targetNode);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Export Operations Response Time', () => {
    it('should export as Markdown within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = performance.now();
      const markdown = markmap.exportAsMarkdown();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
      expect(markdown).toBeTruthy();
    });

    it('should export as SVG within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = performance.now();
      const svg = markmap.exportAsSVG();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
      expect(svg).toBeTruthy();
    });

    it('should export large tree as Markdown within 300ms', async () => {
      const tree = createLargeTree(4, 4);
      await markmap.setData(tree);

      const startTime = performance.now();
      const markdown = markmap.exportAsMarkdown();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
      expect(markdown).toBeTruthy();
    });
  });

  describe('Context Menu Response Time', () => {
    it('should show context menu within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0];
      const mockEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });

      const startTime = performance.now();
      // Context menu show is synchronous, but we measure the time anyway
      markmap['handleContextMenu'](mockEvent, targetNode);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Viewport Adjustment Response Time', () => {
    it('should adjust viewport within 300ms', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const startTime = performance.now();
      await markmap['adjustViewportIfNeeded']();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should adjust viewport for large tree within 300ms', async () => {
      const tree = createLargeTree(4, 4);
      await markmap.setData(tree);

      const startTime = performance.now();
      await markmap['adjustViewportIfNeeded']();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Overall Interaction Performance', () => {
    it('should handle multiple rapid interactions within acceptable time', async () => {
      const tree = createTestTree();
      await markmap.setData(tree);

      const targetNode = tree.children![0];
      const mockEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
      });

      const startTime = performance.now();

      // Perform multiple interactions
      markmap.handleClick(mockEvent, targetNode); // Toggle
      markmap.handleClick(mockEvent, targetNode); // Toggle back
      await markmap.fit(); // Fit to viewport
      await markmap.rescale(1.2); // Zoom

      const endTime = performance.now();

      const totalTime = endTime - startTime;
      // Each operation should be under 300ms, so 4 operations should be under 1200ms
      // But in practice, they should be much faster
      expect(totalTime).toBeLessThan(1200);
    });

    it('should maintain responsive performance with large tree', async () => {
      const tree = createLargeTree(5, 3); // 5 levels, 3 children each
      await markmap.setData(tree);

      const operations = [
        () => markmap.expandAll(tree),
        () => markmap.collapseAll(tree),
        () => markmap.fit(),
        () => markmap.rescale(1.5),
      ];

      for (const operation of operations) {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();

        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(300);
      }
    });
  });
});
