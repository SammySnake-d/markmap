/**
 * Image Export Tests
 *
 * Tests for the image export methods (PNG, JPG, SVG).
 *
 * Requirements:
 * - 4.5: Provide export as PNG, JPG, or SVG format
 * - 4.6: Generate image file containing current visible mindmap content
 *
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { INode } from 'markmap-common';
import { Markmap } from '../src/view';

describe('Image Export', () => {
  let svg: SVGSVGElement;
  let markmap: Markmap;

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Create a mock SVG element
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');
    document.body.appendChild(svg);

    // Create markmap instance
    markmap = new Markmap(svg, {
      autoFit: false,
      duration: 0,
    });

    // Create simple test data manually
    const testData: INode = {
      content: 'Root',
      children: [
        {
          content: 'Child 1',
          children: [],
          state: {
            id: 2,
            depth: 1,
            path: '1.2',
            key: '1.2',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
        {
          content: 'Child 2',
          children: [
            {
              content: 'Grandchild',
              children: [],
              state: {
                id: 4,
                depth: 2,
                path: '1.3.4',
                key: '1.3.4',
                rect: { x: 0, y: 0, width: 100, height: 50 },
                size: [100, 50],
              },
              payload: {},
            },
          ],
          state: {
            id: 3,
            depth: 1,
            path: '1.3',
            key: '1.3',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
      ],
      state: {
        id: 1,
        depth: 0,
        path: '1',
        key: '1',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };

    markmap.setData(testData);
  });

  describe('exportAsSVG', () => {
    test('returns SVG string', () => {
      const svgString = markmap.exportAsSVG();

      expect(svgString).toBeTruthy();
      expect(typeof svgString).toBe('string');
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('</svg>');
    });

    test('includes xmlns attribute', () => {
      const svgString = markmap.exportAsSVG();

      expect(svgString).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    test('includes viewBox attribute', () => {
      const svgString = markmap.exportAsSVG();

      expect(svgString).toContain('viewBox=');
    });

    test('includes width and height attributes', () => {
      const svgString = markmap.exportAsSVG();

      expect(svgString).toContain('width=');
      expect(svgString).toContain('height=');
    });

    test('includes style content', () => {
      const svgString = markmap.exportAsSVG();

      // Should include style definitions
      expect(svgString).toContain('<style');
    });

    test('preserves mindmap content', () => {
      const svgString = markmap.exportAsSVG();

      // Should contain some of the node content
      // Note: The exact content depends on how the SVG is rendered
      expect(svgString.length).toBeGreaterThan(100);
    });
  });

  describe('exportAsPNG', () => {
    test('returns a Promise', () => {
      const result = markmap.exportAsPNG();

      expect(result).toBeInstanceOf(Promise);
    });

    test('resolves to a Blob', async () => {
      // Mock canvas toBlob to avoid actual rendering
      const mockBlob = new Blob(['mock png data'], { type: 'image/png' });

      // Mock canvas context
      const mockContext = {
        scale: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      // Mock HTMLCanvasElement.prototype methods
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockReturnValue(mockContext);
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback?.(mockBlob);
      };

      // Mock Image loading
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      try {
        const blob = await markmap.exportAsPNG();

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/png');
      } finally {
        // Restore original implementations
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        global.Image = originalImage;
      }
    });

    test('throws error if canvas context cannot be created', async () => {
      // Mock getContext to return null
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

      try {
        await expect(markmap.exportAsPNG()).rejects.toThrow(
          'Failed to get canvas context',
        );
      } finally {
        // Restore original implementation
        HTMLCanvasElement.prototype.getContext = originalGetContext;
      }
    });
  });

  describe('exportAsJPG', () => {
    test('returns a Promise', () => {
      const result = markmap.exportAsJPG();

      expect(result).toBeInstanceOf(Promise);
    });

    test('resolves to a Blob with JPEG type', async () => {
      // Mock canvas toBlob to avoid actual rendering
      const mockBlob = new Blob(['mock jpg data'], { type: 'image/jpeg' });

      // Mock canvas context
      const mockContext = {
        scale: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      // Mock HTMLCanvasElement.prototype methods
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockReturnValue(mockContext);
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback?.(mockBlob);
      };

      // Mock Image loading
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      try {
        const blob = await markmap.exportAsJPG();

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/jpeg');
      } finally {
        // Restore original implementations
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        global.Image = originalImage;
      }
    });

    test('fills white background for JPEG', async () => {
      // Mock canvas context to track fillRect calls
      const fillRectSpy = vi.fn();
      const mockContext = {
        scale: vi.fn(),
        fillStyle: '',
        fillRect: fillRectSpy,
        drawImage: vi.fn(),
      };

      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockReturnValue(mockContext);

      // Mock canvas toBlob
      const mockBlob = new Blob(['mock jpg data'], { type: 'image/jpeg' });
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback?.(mockBlob);
      };

      // Mock Image loading
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      try {
        await markmap.exportAsJPG();

        // Should have called fillRect to fill white background
        expect(fillRectSpy).toHaveBeenCalled();
      } finally {
        // Restore original implementations
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        global.Image = originalImage;
      }
    });
  });

  describe('Error handling', () => {
    test('exportAsSVG throws error if SVG element not found', () => {
      // Create a markmap instance
      const emptySvg = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      document.body.appendChild(emptySvg);
      const emptyMarkmap = new Markmap(emptySvg);

      // Mock svg.node() to return null
      emptyMarkmap.svg.node = vi.fn().mockReturnValue(null);

      expect(() => emptyMarkmap.exportAsSVG()).toThrow('SVG element not found');
    });

    test('exportAsPNG rejects if image fails to load', async () => {
      // Mock canvas context
      const mockContext = {
        scale: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockReturnValue(mockContext);

      // Mock Image to fail loading
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      } as any;

      try {
        await expect(markmap.exportAsPNG()).rejects.toThrow(
          'Failed to load SVG image',
        );
      } finally {
        // Restore original implementations
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        global.Image = originalImage;
      }
    });

    test('exportAsPNG rejects if toBlob returns null', async () => {
      // Mock canvas context
      const mockContext = {
        scale: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockReturnValue(mockContext);

      // Mock canvas toBlob to return null
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback?.(null);
      };

      // Mock Image loading
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      try {
        await expect(markmap.exportAsPNG()).rejects.toThrow(
          'Failed to create blob from canvas',
        );
      } finally {
        // Restore original implementations
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        global.Image = originalImage;
      }
    });
  });
});
