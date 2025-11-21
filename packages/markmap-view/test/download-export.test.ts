/**
 * Download Export Tests
 *
 * Tests for the download trigger functionality.
 *
 * Requirements:
 * - 4.7: Trigger browser download for exported image file
 *
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { INode } from 'markmap-common';
import { Markmap } from '../src/view';

describe('Download Export', () => {
  let svg: SVGSVGElement;
  let markmap: Markmap;
  let mockAnchor: HTMLAnchorElement;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let clickSpy: any;

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

    // Create a mock anchor element
    mockAnchor = document.createElement('a');
    clickSpy = vi.spyOn(mockAnchor, 'click');

    // Mock document.createElement to return our mock anchor
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tagName: string) => {
        if (tagName === 'a') {
          return mockAnchor;
        }
        return originalCreateElement(tagName);
      },
    );

    // Spy on appendChild and removeChild
    appendChildSpy = vi.spyOn(document.body, 'appendChild');
    removeChildSpy = vi.spyOn(document.body, 'removeChild');

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadAsSVG', () => {
    test('creates blob with correct MIME type', () => {
      markmap.downloadAsSVG('test.svg');

      // Check that createObjectURL was called
      expect(URL.createObjectURL).toHaveBeenCalled();

      // Get the blob that was passed to createObjectURL
      const createObjectURLCalls = (URL.createObjectURL as any).mock.calls;
      expect(createObjectURLCalls.length).toBeGreaterThan(0);

      const blob = createObjectURLCalls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/svg+xml');
    });

    test('creates anchor element with correct attributes', () => {
      markmap.downloadAsSVG('test-mindmap.svg');

      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('test-mindmap.svg');
      expect(mockAnchor.style.display).toBe('none');
    });

    test('triggers click on anchor element', () => {
      markmap.downloadAsSVG('test.svg');

      expect(clickSpy).toHaveBeenCalledOnce();
    });

    test('appends and removes anchor from document', () => {
      markmap.downloadAsSVG('test.svg');

      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    });

    test('uses default filename when not provided', () => {
      markmap.downloadAsSVG();

      expect(mockAnchor.download).toBe('mindmap.svg');
    });

    test('revokes object URL after download', async () => {
      markmap.downloadAsSVG('test.svg');

      // Wait for the timeout to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('downloadAsPNG', () => {
    test('returns a Promise', () => {
      const result = markmap.downloadAsPNG('test.png');

      expect(result).toBeInstanceOf(Promise);
    });

    test('creates blob with PNG MIME type', async () => {
      // Mock the export methods
      const mockBlob = new Blob(['mock png data'], { type: 'image/png' });
      vi.spyOn(markmap, 'exportAsPNG').mockResolvedValue(mockBlob);

      await markmap.downloadAsPNG('test.png');

      expect(URL.createObjectURL).toHaveBeenCalled();

      const createObjectURLCalls = (URL.createObjectURL as any).mock.calls;
      const blob = createObjectURLCalls[0][0];
      expect(blob.type).toBe('image/png');
    });

    test('uses default filename when not provided', async () => {
      const mockBlob = new Blob(['mock png data'], { type: 'image/png' });
      vi.spyOn(markmap, 'exportAsPNG').mockResolvedValue(mockBlob);

      await markmap.downloadAsPNG();

      expect(mockAnchor.download).toBe('mindmap.png');
    });

    test('triggers download with custom filename', async () => {
      const mockBlob = new Blob(['mock png data'], { type: 'image/png' });
      vi.spyOn(markmap, 'exportAsPNG').mockResolvedValue(mockBlob);

      await markmap.downloadAsPNG('custom-name.png');

      expect(mockAnchor.download).toBe('custom-name.png');
      expect(clickSpy).toHaveBeenCalledOnce();
    });
  });

  describe('downloadAsJPG', () => {
    test('returns a Promise', () => {
      const result = markmap.downloadAsJPG('test.jpg');

      expect(result).toBeInstanceOf(Promise);
    });

    test('creates blob with JPEG MIME type', async () => {
      const mockBlob = new Blob(['mock jpg data'], { type: 'image/jpeg' });
      vi.spyOn(markmap, 'exportAsJPG').mockResolvedValue(mockBlob);

      await markmap.downloadAsJPG('test.jpg');

      expect(URL.createObjectURL).toHaveBeenCalled();

      const createObjectURLCalls = (URL.createObjectURL as any).mock.calls;
      const blob = createObjectURLCalls[0][0];
      expect(blob.type).toBe('image/jpeg');
    });

    test('uses default filename when not provided', async () => {
      const mockBlob = new Blob(['mock jpg data'], { type: 'image/jpeg' });
      vi.spyOn(markmap, 'exportAsJPG').mockResolvedValue(mockBlob);

      await markmap.downloadAsJPG();

      expect(mockAnchor.download).toBe('mindmap.jpg');
    });

    test('triggers download with custom filename', async () => {
      const mockBlob = new Blob(['mock jpg data'], { type: 'image/jpeg' });
      vi.spyOn(markmap, 'exportAsJPG').mockResolvedValue(mockBlob);

      await markmap.downloadAsJPG('my-mindmap.jpg');

      expect(mockAnchor.download).toBe('my-mindmap.jpg');
      expect(clickSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Integration', () => {
    test('all download methods clean up resources', async () => {
      const mockBlob = new Blob(['mock data'], { type: 'image/png' });
      vi.spyOn(markmap, 'exportAsPNG').mockResolvedValue(mockBlob);
      vi.spyOn(markmap, 'exportAsJPG').mockResolvedValue(mockBlob);

      // Test PNG download
      await markmap.downloadAsPNG('test.png');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      // Reset spies
      appendChildSpy.mockClear();
      removeChildSpy.mockClear();

      // Test JPG download
      await markmap.downloadAsJPG('test.jpg');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      // Reset spies
      appendChildSpy.mockClear();
      removeChildSpy.mockClear();

      // Test SVG download
      markmap.downloadAsSVG('test.svg');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });
});
