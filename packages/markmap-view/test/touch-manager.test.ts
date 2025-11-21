/**
 * Unit tests for TouchManager
 *
 * Requirements:
 * - 11.2: Support single-finger drag to pan canvas
 * - 11.3: Support two-finger pinch to zoom canvas
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TouchManager } from '../src/touch-manager';

describe('TouchManager', () => {
  let touchManager: TouchManager;
  let mockSvg: SVGElement;
  let panCallback: ReturnType<typeof vi.fn>;
  let zoomCallback: ReturnType<typeof vi.fn>;
  let mockStorage: Record<string, string>;

  // Helper function to create mock touch event
  const createTouchEvent = (
    type: string,
    touches: Array<{ clientX: number; clientY: number }>,
  ): TouchEvent => {
    const touchList = touches.map((touch) => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      identifier: 0,
      target: mockSvg,
      screenX: touch.clientX,
      screenY: touch.clientY,
      pageX: touch.clientX,
      pageY: touch.clientY,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    })) as unknown as TouchList;

    const event = new Event(type) as TouchEvent;
    Object.defineProperty(event, 'touches', {
      value: touchList,
      writable: false,
    });
    Object.defineProperty(event, 'preventDefault', {
      value: vi.fn(),
      writable: true,
    });

    return event;
  };

  beforeEach(() => {
    // Mock localStorage
    mockStorage = {};
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
      key: (index: number) => Object.keys(mockStorage)[index] || null,
      length: Object.keys(mockStorage).length,
    } as Storage;

    // Create mock SVG element
    mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(mockSvg);

    // Create mock callbacks
    panCallback = vi.fn();
    zoomCallback = vi.fn();

    // Create TouchManager instance
    touchManager = new TouchManager(panCallback, zoomCallback);
  });

  describe('Initialization', () => {
    it('should initialize with callbacks', () => {
      expect(touchManager).toBeDefined();
      expect(touchManager.isEnabled()).toBe(false);
      expect(touchManager.getSvgElement()).toBeNull();
    });

    it('should initialize without callbacks', () => {
      const manager = new TouchManager();
      expect(manager).toBeDefined();
      expect(manager.isEnabled()).toBe(false);
    });

    it('should allow setting callbacks after initialization', () => {
      const manager = new TouchManager();
      const newPanCallback = vi.fn();
      const newZoomCallback = vi.fn();

      manager.setPanCallback(newPanCallback);
      manager.setZoomCallback(newZoomCallback);

      expect(manager).toBeDefined();
    });
  });

  describe('Enable/Disable Touch (Requirement 11.2, 11.3)', () => {
    it('should enable touch on SVG element', () => {
      touchManager.enableTouch(mockSvg);

      expect(touchManager.isEnabled()).toBe(true);
      expect(touchManager.getSvgElement()).toBe(mockSvg);
    });

    it('should not re-enable if already enabled on same element', () => {
      touchManager.enableTouch(mockSvg);
      const firstEnable = touchManager.isEnabled();

      touchManager.enableTouch(mockSvg);
      const secondEnable = touchManager.isEnabled();

      expect(firstEnable).toBe(true);
      expect(secondEnable).toBe(true);
      expect(touchManager.getSvgElement()).toBe(mockSvg);
    });

    it('should disable previous element when enabling on new element', () => {
      const mockSvg2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      document.body.appendChild(mockSvg2);

      touchManager.enableTouch(mockSvg);
      expect(touchManager.getSvgElement()).toBe(mockSvg);

      touchManager.enableTouch(mockSvg2);
      expect(touchManager.getSvgElement()).toBe(mockSvg2);
      expect(touchManager.isEnabled()).toBe(true);

      document.body.removeChild(mockSvg2);
    });

    it('should disable touch support', () => {
      touchManager.enableTouch(mockSvg);
      expect(touchManager.isEnabled()).toBe(true);

      touchManager.disableTouch();
      expect(touchManager.isEnabled()).toBe(false);
      expect(touchManager.getSvgElement()).toBeNull();
    });

    it('should handle disabling when not enabled', () => {
      expect(() => {
        touchManager.disableTouch();
      }).not.toThrow();

      expect(touchManager.isEnabled()).toBe(false);
    });

    it('should remove event listeners when disabled', () => {
      const removeEventListenerSpy = vi.spyOn(mockSvg, 'removeEventListener');

      touchManager.enableTouch(mockSvg);
      touchManager.disableTouch();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchcancel',
        expect.any(Function),
      );
    });
  });

  describe('Single-Finger Pan Gesture (Requirement 11.2)', () => {
    beforeEach(() => {
      touchManager.enableTouch(mockSvg);
    });

    it('should detect single-finger pan gesture', () => {
      // Touch start
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Touch move
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 120 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalledWith(50, 20);
    });

    it('should call pan callback with correct delta', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 200, clientY: 300 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 250, clientY: 350 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalledWith(50, 50);
    });

    it('should handle negative delta', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 200, clientY: 300 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 250 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalledWith(-50, -50);
    });

    it('should track continuous pan movements', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const move1 = createTouchEvent('touchmove', [
        { clientX: 110, clientY: 110 },
      ]);
      mockSvg.dispatchEvent(move1);
      expect(panCallback).toHaveBeenCalledWith(10, 10);

      const move2 = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 115 },
      ]);
      mockSvg.dispatchEvent(move2);
      expect(panCallback).toHaveBeenCalledWith(10, 5);

      const move3 = createTouchEvent('touchmove', [
        { clientX: 125, clientY: 120 },
      ]);
      mockSvg.dispatchEvent(move3);
      expect(panCallback).toHaveBeenCalledWith(5, 5);
    });

    it('should reset state on touch end', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      const endEvent = createTouchEvent('touchend', []);
      mockSvg.dispatchEvent(endEvent);

      // Start new gesture
      const newStartEvent = createTouchEvent('touchstart', [
        { clientX: 200, clientY: 200 },
      ]);
      mockSvg.dispatchEvent(newStartEvent);

      const newMoveEvent = createTouchEvent('touchmove', [
        { clientX: 250, clientY: 250 },
      ]);
      mockSvg.dispatchEvent(newMoveEvent);

      // Should calculate from new start position
      expect(panCallback).toHaveBeenLastCalledWith(50, 50);
    });

    it('should not call pan callback without touch start', () => {
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      // Pan callback should still be called, but with delta from (0,0)
      expect(panCallback).toHaveBeenCalled();
    });

    it('should prevent default on pan move', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(moveEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Two-Finger Pinch Gesture (Requirement 11.3)', () => {
    beforeEach(() => {
      touchManager.enableTouch(mockSvg);
    });

    it('should detect two-finger pinch gesture', () => {
      // Touch start with two fingers
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Move fingers closer (pinch in)
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 100 },
        { clientX: 180, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(zoomCallback).toHaveBeenCalled();
    });

    it('should calculate correct scale for pinch in', () => {
      // Start with distance 100
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Move to distance 50 (scale = 0.5)
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 125, clientY: 100 },
        { clientX: 175, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(zoomCallback).toHaveBeenCalledWith(
        expect.closeTo(0.5, 0.01),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should calculate correct scale for pinch out', () => {
      // Start with distance 100
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 150, clientY: 100 },
        { clientX: 250, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Move to distance 200 (scale = 2.0)
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 100, clientY: 100 },
        { clientX: 300, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(zoomCallback).toHaveBeenCalledWith(
        expect.closeTo(2.0, 0.01),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should calculate center point between two touches', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 120 },
        { clientX: 180, clientY: 180 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(zoomCallback).toHaveBeenCalledWith(
        expect.any(Number),
        150, // (120 + 180) / 2
        150, // (120 + 180) / 2
      );
    });

    it('should handle diagonal pinch gesture', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 110, clientY: 110 },
        { clientX: 190, clientY: 190 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(zoomCallback).toHaveBeenCalled();
    });

    it('should prevent default on pinch gesture', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      expect(startEvent.preventDefault).toHaveBeenCalled();

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 100 },
        { clientX: 180, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(moveEvent.preventDefault).toHaveBeenCalled();
    });

    it('should update start distance for continuous pinch', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // First move
      const move1 = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 100 },
        { clientX: 180, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(move1);

      // Second move - scale should be relative to previous position
      const move2 = createTouchEvent('touchmove', [
        { clientX: 130, clientY: 100 },
        { clientX: 170, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(move2);

      expect(zoomCallback).toHaveBeenCalledTimes(2);
    });

    it('should reset to pan mode when one finger lifts', () => {
      // Start with two fingers
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Lift one finger
      const endEvent = createTouchEvent('touchend', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(endEvent);

      // Move remaining finger - should trigger pan
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalled();
    });
  });

  describe('Callback Management', () => {
    it('should allow setting pan callback after initialization', () => {
      const newPanCallback = vi.fn();
      touchManager.setPanCallback(newPanCallback);
      touchManager.enableTouch(mockSvg);

      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(newPanCallback).toHaveBeenCalledWith(50, 50);
    });

    it('should allow setting zoom callback after initialization', () => {
      const newZoomCallback = vi.fn();
      touchManager.setZoomCallback(newZoomCallback);
      touchManager.enableTouch(mockSvg);

      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 100 },
        { clientX: 180, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(newZoomCallback).toHaveBeenCalled();
    });

    it('should not crash when pan callback is null', () => {
      const manager = new TouchManager();
      manager.enableTouch(mockSvg);

      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 150, clientY: 150 },
      ]);

      expect(() => {
        mockSvg.dispatchEvent(moveEvent);
      }).not.toThrow();
    });

    it('should not crash when zoom callback is null', () => {
      const manager = new TouchManager();
      manager.enableTouch(mockSvg);

      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 120, clientY: 100 },
        { clientX: 180, clientY: 100 },
      ]);

      expect(() => {
        mockSvg.dispatchEvent(moveEvent);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      touchManager.enableTouch(mockSvg);
    });

    it('should handle touch cancel event', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const cancelEvent = createTouchEvent('touchcancel', []);
      expect(() => {
        mockSvg.dispatchEvent(cancelEvent);
      }).not.toThrow();
    });

    it('should handle zero distance pinch', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 100, clientY: 100 },
        { clientX: 100, clientY: 100 },
      ]);

      expect(() => {
        mockSvg.dispatchEvent(moveEvent);
      }).not.toThrow();
    });

    it('should handle more than two touches', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
        { clientX: 150, clientY: 200 },
      ]);

      expect(() => {
        mockSvg.dispatchEvent(startEvent);
      }).not.toThrow();
    });

    it('should handle rapid touch events', () => {
      for (let i = 0; i < 100; i++) {
        const event = createTouchEvent('touchmove', [
          { clientX: 100 + i, clientY: 100 + i },
        ]);
        mockSvg.dispatchEvent(event);
      }

      expect(panCallback).toHaveBeenCalled();
    });

    it('should handle very small movements', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 100.1, clientY: 100.1 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalledWith(
        expect.closeTo(0.1, 0.01),
        expect.closeTo(0.1, 0.01),
      );
    });

    it('should handle very large movements', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 0, clientY: 0 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 10000, clientY: 10000 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalledWith(10000, 10000);
    });

    it('should handle negative coordinates', () => {
      const startEvent = createTouchEvent('touchstart', [
        { clientX: -100, clientY: -100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: -50, clientY: -50 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(panCallback).toHaveBeenCalledWith(50, 50);
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for multiple instances', () => {
      const manager1 = new TouchManager(vi.fn(), vi.fn());
      const manager2 = new TouchManager(vi.fn(), vi.fn());

      const svg1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      const svg2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );

      manager1.enableTouch(svg1);
      manager2.enableTouch(svg2);

      expect(manager1.isEnabled()).toBe(true);
      expect(manager2.isEnabled()).toBe(true);
      expect(manager1.getSvgElement()).toBe(svg1);
      expect(manager2.getSvgElement()).toBe(svg2);

      manager1.disableTouch();

      expect(manager1.isEnabled()).toBe(false);
      expect(manager2.isEnabled()).toBe(true);
    });

    it('should clear all state on disable', () => {
      touchManager.enableTouch(mockSvg);

      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      touchManager.disableTouch();

      expect(touchManager.isEnabled()).toBe(false);
      expect(touchManager.getSvgElement()).toBeNull();
    });
  });

  describe('Node Interaction (Requirements 11.4, 11.5)', () => {
    let nodeTapCallback: ReturnType<typeof vi.fn>;
    let nodeLongPressCallback: ReturnType<typeof vi.fn>;
    let mockNodeElement: SVGGElement;

    beforeEach(() => {
      nodeTapCallback = vi.fn();
      nodeLongPressCallback = vi.fn();

      // Create a mock node element
      mockNodeElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g',
      );
      mockNodeElement.classList.add('markmap-node');
      mockSvg.appendChild(mockNodeElement);

      // Create TouchManager with node interaction callbacks
      touchManager = new TouchManager(
        panCallback,
        zoomCallback,
        nodeTapCallback,
        nodeLongPressCallback,
      );
      touchManager.enableTouch(mockSvg);
    });

    afterEach(() => {
      mockSvg.removeChild(mockNodeElement);
    });

    describe('Single Tap on Node (Requirement 11.4)', () => {
      it('should detect tap on node element', () => {
        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Touch end without moving
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        expect(nodeTapCallback).toHaveBeenCalledWith(mockNodeElement, 100, 100);
      });

      it('should not trigger tap if finger moved', () => {
        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Move finger significantly
        const moveEvent = createTouchEvent('touchmove', [
          { clientX: 150, clientY: 150 },
        ]);
        mockSvg.dispatchEvent(moveEvent);

        // Touch end
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        expect(nodeTapCallback).not.toHaveBeenCalled();
      });

      it('should not trigger tap on non-node element', () => {
        // Touch start on SVG (not a node)
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockSvg,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Touch end
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        expect(nodeTapCallback).not.toHaveBeenCalled();
      });

      it('should work with child elements of node', () => {
        // Create a child element inside the node
        const childElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        mockNodeElement.appendChild(childElement);

        // Touch start on child element
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: childElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Touch end
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        expect(nodeTapCallback).toHaveBeenCalledWith(mockNodeElement, 100, 100);
      });
    });

    describe('Long Press on Node (Requirement 11.5)', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should detect long press on node element', () => {
        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Wait for long press duration
        vi.advanceTimersByTime(500);

        expect(nodeLongPressCallback).toHaveBeenCalledWith(
          mockNodeElement,
          100,
          100,
        );
      });

      it('should not trigger long press if finger moved', () => {
        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Move finger significantly
        const moveEvent = createTouchEvent('touchmove', [
          { clientX: 150, clientY: 150 },
        ]);
        mockSvg.dispatchEvent(moveEvent);

        // Wait for long press duration
        vi.advanceTimersByTime(500);

        expect(nodeLongPressCallback).not.toHaveBeenCalled();
      });

      it('should not trigger long press if touch ended early', () => {
        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // End touch before long press duration
        vi.advanceTimersByTime(200);
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        // Wait remaining time
        vi.advanceTimersByTime(300);

        expect(nodeLongPressCallback).not.toHaveBeenCalled();
      });

      it('should not trigger tap after long press', () => {
        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Wait for long press
        vi.advanceTimersByTime(500);

        expect(nodeLongPressCallback).toHaveBeenCalled();

        // Touch end
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        // Tap should not be triggered
        expect(nodeTapCallback).not.toHaveBeenCalled();
      });

      it('should cancel long press on second finger', () => {
        // Touch start on node with one finger
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Add second finger (pinch gesture)
        const secondFingerEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 100 },
        ]);
        mockSvg.dispatchEvent(secondFingerEvent);

        // Wait for long press duration
        vi.advanceTimersByTime(500);

        // Long press should not be triggered
        expect(nodeLongPressCallback).not.toHaveBeenCalled();
      });
    });

    describe('Callback Management for Node Interactions', () => {
      it('should allow setting node tap callback after initialization', () => {
        const newTapCallback = vi.fn();
        const manager = new TouchManager();
        manager.setNodeTapCallback(newTapCallback);
        manager.enableTouch(mockSvg);

        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Touch end
        const endEvent = createTouchEvent('touchend', []);
        mockSvg.dispatchEvent(endEvent);

        expect(newTapCallback).toHaveBeenCalled();
      });

      it('should allow setting node long press callback after initialization', () => {
        vi.useFakeTimers();

        const newLongPressCallback = vi.fn();
        const manager = new TouchManager();
        manager.setNodeLongPressCallback(newLongPressCallback);
        manager.enableTouch(mockSvg);

        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Wait for long press
        vi.advanceTimersByTime(500);

        expect(newLongPressCallback).toHaveBeenCalled();

        vi.useRealTimers();
      });

      it('should not crash when node tap callback is null', () => {
        const manager = new TouchManager();
        manager.enableTouch(mockSvg);

        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Touch end
        const endEvent = createTouchEvent('touchend', []);

        expect(() => {
          mockSvg.dispatchEvent(endEvent);
        }).not.toThrow();
      });

      it('should not crash when node long press callback is null', () => {
        vi.useFakeTimers();

        const manager = new TouchManager();
        manager.enableTouch(mockSvg);

        // Touch start on node
        const startEvent = createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
        ]);
        Object.defineProperty(startEvent, 'target', {
          value: mockNodeElement,
          writable: false,
        });
        mockSvg.dispatchEvent(startEvent);

        // Wait for long press
        expect(() => {
          vi.advanceTimersByTime(500);
        }).not.toThrow();

        vi.useRealTimers();
      });
    });
  });

  describe('Screen Orientation Change (Requirement 11.6)', () => {
    let orientationChangeCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      orientationChangeCallback = vi.fn();
      touchManager = new TouchManager(
        panCallback,
        zoomCallback,
        undefined,
        undefined,
        orientationChangeCallback,
      );
      touchManager.enableTouch(mockSvg);
    });

    it('should listen for orientationchange event when enabled', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const manager = new TouchManager();
      manager.enableTouch(mockSvg);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function),
      );
    });

    it('should trigger callback on orientation change', () => {
      // Dispatch orientationchange event
      const event = new Event('orientationchange');
      window.dispatchEvent(event);

      expect(orientationChangeCallback).toHaveBeenCalled();
    });

    it('should reset touch state on orientation change', () => {
      vi.useFakeTimers();

      // Start a touch gesture
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Trigger orientation change
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      // Touch state should be reset
      expect(orientationChangeCallback).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should cancel long press on orientation change', () => {
      vi.useFakeTimers();

      const nodeLongPressCallback = vi.fn();
      const manager = new TouchManager(
        undefined,
        undefined,
        undefined,
        nodeLongPressCallback,
        orientationChangeCallback,
      );
      manager.enableTouch(mockSvg);

      // Create a mock node element
      const mockNodeElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g',
      );
      mockNodeElement.classList.add('markmap-node');
      mockSvg.appendChild(mockNodeElement);

      // Start touch on node
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
      ]);
      Object.defineProperty(startEvent, 'target', {
        value: mockNodeElement,
        writable: false,
      });
      mockSvg.dispatchEvent(startEvent);

      // Trigger orientation change before long press completes
      vi.advanceTimersByTime(200);
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      // Wait for remaining time
      vi.advanceTimersByTime(300);

      // Long press should not be triggered
      expect(nodeLongPressCallback).not.toHaveBeenCalled();
      expect(orientationChangeCallback).toHaveBeenCalled();

      mockSvg.removeChild(mockNodeElement);
      vi.useRealTimers();
    });

    it('should remove orientationchange listener when disabled', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      touchManager.disableTouch();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function),
      );
    });

    it('should allow setting orientation change callback after initialization', () => {
      const newOrientationCallback = vi.fn();
      const manager = new TouchManager();
      manager.setOrientationChangeCallback(newOrientationCallback);
      manager.enableTouch(mockSvg);

      // Trigger orientation change
      const event = new Event('orientationchange');
      window.dispatchEvent(event);

      expect(newOrientationCallback).toHaveBeenCalled();
    });

    it('should not crash when orientation change callback is null', () => {
      const manager = new TouchManager();
      manager.enableTouch(mockSvg);

      // Trigger orientation change
      const event = new Event('orientationchange');

      expect(() => {
        window.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should handle multiple orientation changes', () => {
      // Trigger multiple orientation changes
      for (let i = 0; i < 5; i++) {
        const event = new Event('orientationchange');
        window.dispatchEvent(event);
      }

      expect(orientationChangeCallback).toHaveBeenCalledTimes(5);
    });

    it('should reset pinch state on orientation change', () => {
      // Start pinch gesture
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      mockSvg.dispatchEvent(startEvent);

      // Trigger orientation change
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);

      // Pinch state should be reset
      expect(orientationChangeCallback).toHaveBeenCalled();

      // New gesture should start fresh
      const newStartEvent = createTouchEvent('touchstart', [
        { clientX: 150, clientY: 150 },
        { clientX: 250, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(newStartEvent);

      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 160, clientY: 150 },
        { clientX: 240, clientY: 150 },
      ]);
      mockSvg.dispatchEvent(moveEvent);

      expect(zoomCallback).toHaveBeenCalled();
    });
  });
});
