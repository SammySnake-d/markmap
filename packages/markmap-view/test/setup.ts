/**
 * Test setup for markmap-view tests
 * This file configures the jsdom environment to properly mock SVG elements
 * that D3.js requires for rendering
 */

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Mock MouseEvent to include view property for D3 compatibility
  const OriginalMouseEvent = global.MouseEvent;
  global.MouseEvent = class MockMouseEvent extends OriginalMouseEvent {
    constructor(type: string, eventInitDict?: MouseEventInit) {
      super(type, eventInitDict);
      // D3 expects event.view to be the window object
      Object.defineProperty(this, 'view', {
        get() {
          return window;
        },
        configurable: true,
      });
    }
  } as any;

  // Mock SVG transform property for all SVG elements
  // D3.js requires this property to be present on SVG elements
  const originalCreateElementNS = document.createElementNS.bind(document);

  document.createElementNS = function (
    namespaceURI: string,
    qualifiedName: string,
  ): any {
    const element = originalCreateElementNS(namespaceURI, qualifiedName);

    if (namespaceURI === 'http://www.w3.org/2000/svg') {
      // Add transform property to all SVG elements
      if (!Object.getOwnPropertyDescriptor(element, 'transform')) {
        Object.defineProperty(element, 'transform', {
          get() {
            return {
              baseVal: {
                numberOfItems: 0,
                getItem: () => null,
                appendItem: () => {},
                clear: () => {},
                consolidate: () => null,
                createSVGTransformFromMatrix: () => ({}),
                initialize: () => ({}),
                insertItemBefore: () => ({}),
                removeItem: () => ({}),
                replaceItem: () => ({}),
              },
              animVal: {
                numberOfItems: 0,
                getItem: () => null,
              },
            };
          },
          configurable: true,
        });
      }

      // Add getBBox if not present
      if (!element.getBBox) {
        element.getBBox = () => ({
          x: 0,
          y: 0,
          width: 100,
          height: 20,
        });
      }

      // Add getScreenCTM for coordinate transformations
      if (!element.getScreenCTM) {
        element.getScreenCTM = () =>
          ({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0,
            inverse: () => ({
              a: 1,
              b: 0,
              c: 0,
              d: 1,
              e: 0,
              f: 0,
            }),
            multiply: function () {
              return this;
            },
            translate: function () {
              return this;
            },
            scale: function () {
              return this;
            },
            rotate: function () {
              return this;
            },
          }) as any;
      }

      // Add getCTM for coordinate transformations
      if (!element.getCTM) {
        element.getCTM = () => element.getScreenCTM();
      }

      // Add createSVGPoint for SVGSVGElement
      if (qualifiedName === 'svg' && !element.createSVGPoint) {
        element.createSVGPoint = () =>
          ({
            x: 0,
            y: 0,
            matrixTransform: () => ({ x: 0, y: 0 }),
          }) as any;
      }

      // Add createSVGMatrix for SVGSVGElement
      if (qualifiedName === 'svg' && !element.createSVGMatrix) {
        element.createSVGMatrix = () =>
          ({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0,
            inverse: function () {
              return this;
            },
            multiply: function () {
              return this;
            },
            translate: function () {
              return this;
            },
            scale: function () {
              return this;
            },
            rotate: function () {
              return this;
            },
          }) as any;
      }

      // Add viewBox property for SVGSVGElement (required by d3-zoom)
      if (qualifiedName === 'svg') {
        // Create a proper viewBox object that d3-zoom expects
        const viewBoxBaseVal = {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        };

        const viewBoxAnimVal = {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        };

        Object.defineProperty(element, 'viewBox', {
          get() {
            return {
              baseVal: viewBoxBaseVal,
              animVal: viewBoxAnimVal,
            };
          },
          set(value) {
            // Allow setting viewBox
            if (value && value.baseVal) {
              Object.assign(viewBoxBaseVal, value.baseVal);
            }
          },
          configurable: true,
          enumerable: true,
        });

        // Add clientWidth and clientHeight for SVGSVGElement
        Object.defineProperty(element, 'clientWidth', {
          get() {
            return 800;
          },
          configurable: true,
        });

        Object.defineProperty(element, 'clientHeight', {
          get() {
            return 600;
          },
          configurable: true,
        });

        // Add getBoundingClientRect for SVGSVGElement
        if (!element.getBoundingClientRect) {
          element.getBoundingClientRect = () =>
            ({
              x: 0,
              y: 0,
              width: 800,
              height: 600,
              top: 0,
              left: 0,
              right: 800,
              bottom: 600,
              toJSON: () => {},
            }) as DOMRect;
        }

        // Add width and height properties (required by d3-zoom defaultExtent)
        Object.defineProperty(element, 'width', {
          get() {
            return {
              baseVal: {
                value: 800,
              },
              animVal: {
                value: 800,
              },
            };
          },
          configurable: true,
        });

        Object.defineProperty(element, 'height', {
          get() {
            return {
              baseVal: {
                value: 600,
              },
              animVal: {
                value: 600,
              },
            };
          },
          configurable: true,
        });
      }

      // Add getComputedTextLength for text elements
      if (qualifiedName === 'text' && !element.getComputedTextLength) {
        element.getComputedTextLength = () => 50;
      }

      // Add getTotalLength for path elements
      if (qualifiedName === 'path' && !element.getTotalLength) {
        element.getTotalLength = () => 100;
      }

      // Add getPointAtLength for path elements
      if (qualifiedName === 'path' && !element.getPointAtLength) {
        element.getPointAtLength = () => ({ x: 0, y: 0 });
      }
    }

    return element;
  };
});
