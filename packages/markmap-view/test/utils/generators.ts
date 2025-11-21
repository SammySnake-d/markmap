/**
 * Property-based testing generators for markmap-view
 * Using fast-check for generating random test data
 */

import fc from 'fast-check';
import type { INode } from 'markmap-common';

/**
 * Generate random node content
 */
export const arbNodeContent = (): fc.Arbitrary<string> => {
  return fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);
};

/**
 * Generate random node depth
 */
export const arbNodeDepth = (): fc.Arbitrary<number> => {
  return fc.integer({ min: 0, max: 10 });
};

/**
 * Generate a simple node without children
 */
export const arbLeafNode = (): fc.Arbitrary<INode> => {
  return fc.record({
    content: arbNodeContent(),
    children: fc.constant([]),
    payload: fc.constant({}),
    state: fc.record({
      id: fc.integer({ min: 0, max: 10000 }),
      path: fc.string({ minLength: 1, maxLength: 20 }),
      key: fc.string({ minLength: 1, maxLength: 20 }),
      depth: arbNodeDepth(),
      size: fc.tuple(
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 20, max: 100 }),
      ) as any,
      rect: fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
        width: fc.integer({ min: 50, max: 500 }),
        height: fc.integer({ min: 20, max: 100 }),
      }),
    }),
  });
};

/**
 * Generate a node tree with random structure
 */
export const arbNodeTree = (maxDepth: number = 3): fc.Arbitrary<INode> => {
  const arbNode = (
    currentDepth: number,
    idCounter: { value: number },
  ): fc.Arbitrary<INode> => {
    if (currentDepth >= maxDepth) {
      return arbLeafNode();
    }

    return fc.record({
      content: arbNodeContent(),
      children: fc.array(arbNode(currentDepth + 1, idCounter), {
        maxLength: 5,
      }),
      payload: fc.constant({}),
      state: fc.record({
        id: fc.constant(idCounter.value++),
        path: fc.constant(`0-${idCounter.value}`),
        key: fc.string({ minLength: 1, maxLength: 20 }),
        depth: fc.constant(currentDepth),
        size: fc.tuple(
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 20, max: 100 }),
        ) as any,
        rect: fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
          width: fc.integer({ min: 50, max: 500 }),
          height: fc.integer({ min: 20, max: 100 }),
        }),
      }),
    });
  };

  return arbNode(0, { value: 0 });
};

/**
 * Generate random color in hex format
 */
export const arbColor = (): fc.Arbitrary<string> => {
  return fc.hexaString({ minLength: 6, maxLength: 6 }).map((hex) => `#${hex}`);
};

/**
 * Generate array of colors for color scheme
 */
export const arbColorScheme = (): fc.Arbitrary<string[]> => {
  return fc.array(arbColor(), { minLength: 3, maxLength: 10 });
};

/**
 * Generate random coordinates
 */
export const arbCoordinates = (): fc.Arbitrary<{ x: number; y: number }> => {
  return fc.record({
    x: fc.integer({ min: -1000, max: 1000 }),
    y: fc.integer({ min: -1000, max: 1000 }),
  });
};

/**
 * Generate random zoom level
 */
export const arbZoomLevel = (): fc.Arbitrary<number> => {
  return fc.double({ min: 0.1, max: 5.0 });
};

/**
 * Generate search keyword
 */
export const arbSearchKeyword = (): fc.Arbitrary<string> => {
  return fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => s.trim().length > 0);
};

/**
 * Generate node with note content
 */
export const arbNodeWithNote = (): fc.Arbitrary<
  INode & { inlineNote?: string; detailedNote?: string }
> => {
  return fc.record({
    content: arbNodeContent(),
    inlineNote: fc.option(arbNodeContent(), { nil: undefined }),
    detailedNote: fc.option(arbNodeContent(), { nil: undefined }),
    children: fc.constant([]),
    payload: fc.constant({}),
    state: fc.record({
      id: fc.integer({ min: 0, max: 10000 }),
      path: fc.string({ minLength: 1, maxLength: 20 }),
      key: fc.string({ minLength: 1, maxLength: 20 }),
      depth: arbNodeDepth(),
      size: fc.tuple(
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 20, max: 100 }),
      ) as any,
      rect: fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
        width: fc.integer({ min: 50, max: 500 }),
        height: fc.integer({ min: 20, max: 100 }),
      }),
    }),
  });
};

/**
 * Generate node with at least one type of note (inline or detailed)
 * This ensures the node has notes for testing note icon display
 */
export const arbNodeWithAtLeastOneNote = (): fc.Arbitrary<
  INode & { inlineNote?: string; detailedNote?: string }
> => {
  return fc.oneof(
    // Node with only inline note
    fc.record({
      content: arbNodeContent(),
      inlineNote: arbNodeContent(),
      detailedNote: fc.constant(undefined),
      children: fc.constant([]),
      payload: fc.constant({}),
      state: fc.record({
        id: fc.integer({ min: 0, max: 10000 }),
        path: fc.string({ minLength: 1, maxLength: 20 }),
        key: fc.string({ minLength: 1, maxLength: 20 }),
        depth: arbNodeDepth(),
        size: fc.tuple(
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 20, max: 100 }),
        ) as any,
        rect: fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
          width: fc.integer({ min: 50, max: 500 }),
          height: fc.integer({ min: 20, max: 100 }),
        }),
      }),
    }),
    // Node with only detailed note
    fc.record({
      content: arbNodeContent(),
      inlineNote: fc.constant(undefined),
      detailedNote: arbNodeContent(),
      children: fc.constant([]),
      payload: fc.constant({}),
      state: fc.record({
        id: fc.integer({ min: 0, max: 10000 }),
        path: fc.string({ minLength: 1, maxLength: 20 }),
        key: fc.string({ minLength: 1, maxLength: 20 }),
        depth: arbNodeDepth(),
        size: fc.tuple(
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 20, max: 100 }),
        ) as any,
        rect: fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
          width: fc.integer({ min: 50, max: 500 }),
          height: fc.integer({ min: 20, max: 100 }),
        }),
      }),
    }),
    // Node with both notes
    fc.record({
      content: arbNodeContent(),
      inlineNote: arbNodeContent(),
      detailedNote: arbNodeContent(),
      children: fc.constant([]),
      payload: fc.constant({}),
      state: fc.record({
        id: fc.integer({ min: 0, max: 10000 }),
        path: fc.string({ minLength: 1, maxLength: 20 }),
        key: fc.string({ minLength: 1, maxLength: 20 }),
        depth: arbNodeDepth(),
        size: fc.tuple(
          fc.integer({ min: 50, max: 500 }),
          fc.integer({ min: 20, max: 100 }),
        ) as any,
        rect: fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
          width: fc.integer({ min: 50, max: 500 }),
          height: fc.integer({ min: 20, max: 100 }),
        }),
      }),
    }),
  );
};

/**
 * Generate node without any notes
 */
export const arbNodeWithoutNote = (): fc.Arbitrary<INode> => {
  return fc.record({
    content: arbNodeContent(),
    children: fc.constant([]),
    payload: fc.constant({}),
    state: fc.record({
      id: fc.integer({ min: 0, max: 10000 }),
      path: fc.string({ minLength: 1, maxLength: 20 }),
      key: fc.string({ minLength: 1, maxLength: 20 }),
      depth: arbNodeDepth(),
      size: fc.tuple(
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 20, max: 100 }),
      ) as any,
      rect: fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
        width: fc.integer({ min: 50, max: 500 }),
        height: fc.integer({ min: 20, max: 100 }),
      }),
    }),
  });
};

/**
 * Generate touch event coordinates (for mobile testing)
 */
export const arbTouchCoordinates = (): fc.Arbitrary<
  { x: number; y: number }[]
> => {
  return fc.array(
    fc.record({
      x: fc.integer({ min: 0, max: 1000 }),
      y: fc.integer({ min: 0, max: 1000 }),
    }),
    { minLength: 1, maxLength: 2 },
  );
};

/**
 * Generate viewport dimensions
 */
export const arbViewportDimensions = (): fc.Arbitrary<{
  width: number;
  height: number;
}> => {
  return fc.record({
    width: fc.integer({ min: 320, max: 3840 }),
    height: fc.integer({ min: 240, max: 2160 }),
  });
};
