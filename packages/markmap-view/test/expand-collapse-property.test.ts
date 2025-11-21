/**
 * Property-based tests for expand/collapse functionality
 *
 * **Feature: markmap-enhanced, Property 4: 展开操作完整性**
 * **Feature: markmap-enhanced, Property 5: 折叠操作完整性**
 * **Validates: Requirements 2.1, 2.2**
 *
 * Property 4: For any node, after expanding all, all descendant nodes should be in expanded state
 * Property 5: For any node, after collapsing all, all descendant nodes should be in collapsed state
 *
 * @vitest-environment jsdom
 */

import { describe, it, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';
import { createMockSVG } from './utils/helpers';

describe('Property-Based Tests: Expand/Collapse', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    svg = createMockSVG();
  });

  /**
   * Generator for a node tree with random structure and fold states
   * This creates trees with varying depths and widths
   */
  const arbNodeTree = (
    maxDepth: number = 4,
    currentDepth: number = 0,
  ): fc.Arbitrary<INode> => {
    if (currentDepth >= maxDepth) {
      // Leaf node
      return fc.record({
        content: fc.string({ minLength: 1, maxLength: 20 }),
        children: fc.constant([]),
        payload: fc.record({
          fold: fc.constantFrom(0, 1), // Random fold state
        }),
        state: fc.record({
          id: fc.integer({ min: 0, max: 10000 }),
          path: fc.string({ minLength: 1, maxLength: 20 }),
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
    }

    // Internal node with children
    return fc.record({
      content: fc.string({ minLength: 1, maxLength: 20 }),
      children: fc.array(arbNodeTree(maxDepth, currentDepth + 1), {
        minLength: 0,
        maxLength: 4,
      }),
      payload: fc.record({
        fold: fc.constantFrom(0, 1), // Random fold state
      }),
      state: fc.record({
        id: fc.integer({ min: 0, max: 10000 }),
        path: fc.string({ minLength: 1, maxLength: 20 }),
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

  /**
   * Helper function to check if all descendants are expanded
   */
  const areAllDescendantsExpanded = (node: INode): boolean => {
    if (!node.children || node.children.length === 0) {
      return true;
    }

    return node.children.every(
      (child) => child.payload?.fold === 0 && areAllDescendantsExpanded(child),
    );
  };

  /**
   * Helper function to check if all descendants are collapsed
   */
  const areAllDescendantsCollapsed = (node: INode): boolean => {
    if (!node.children || node.children.length === 0) {
      return true;
    }

    return node.children.every(
      (child) => child.payload?.fold === 1 && areAllDescendantsCollapsed(child),
    );
  };

  /**
   * Helper function to count total descendants
   */
  const countDescendants = (node: INode): number => {
    if (!node.children || node.children.length === 0) {
      return 0;
    }

    return node.children.reduce(
      (sum, child) => sum + 1 + countDescendants(child),
      0,
    );
  };

  describe('Property 4: 展开操作完整性', () => {
    it('Property 4: For any node tree, after expandAll, all descendant nodes should be expanded (fold = 0)', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            // Set the data
            await markmap.setData(tree);

            // Expand all nodes
            await markmap.expandAll(tree);

            // Property: All descendants should be expanded
            const allExpanded = areAllDescendantsExpanded(tree);

            // Clean up
            markmap.destroy();

            return allExpanded;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 4a: expandAll should work on any subtree, not just root', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // If tree has children, test expanding a subtree
            if (tree.children && tree.children.length > 0) {
              const subtree = tree.children[0];

              // Expand the subtree
              await markmap.expandAll(subtree);

              // Property: All descendants of the subtree should be expanded
              const allExpanded = areAllDescendantsExpanded(subtree);

              markmap.destroy();
              return allExpanded;
            }

            markmap.destroy();
            return true; // Skip if no children
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 4b: expandAll is idempotent - calling it twice has same effect as once', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // Expand all once
            await markmap.expandAll(tree);
            const afterFirstExpand = areAllDescendantsExpanded(tree);

            // Expand all again
            await markmap.expandAll(tree);
            const afterSecondExpand = areAllDescendantsExpanded(tree);

            markmap.destroy();

            // Property: Both should have same result (all expanded)
            return afterFirstExpand === afterSecondExpand && afterFirstExpand;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 4c: expandAll preserves node content and structure', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // Record original structure
            const originalContent = tree.content;
            const originalChildCount = tree.children?.length || 0;
            const originalDescendantCount = countDescendants(tree);

            // Expand all
            await markmap.expandAll(tree);

            // Property: Structure should be preserved
            const contentPreserved = tree.content === originalContent;
            const childCountPreserved =
              (tree.children?.length || 0) === originalChildCount;
            const descendantCountPreserved =
              countDescendants(tree) === originalDescendantCount;

            markmap.destroy();

            return (
              contentPreserved &&
              childCountPreserved &&
              descendantCountPreserved
            );
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 4d: expandAll works on trees of any depth', () => {
      fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 6 }), async (maxDepth) => {
          const tree = fc.sample(arbNodeTree(maxDepth), 1)[0];
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);
            await markmap.expandAll(tree);

            const allExpanded = areAllDescendantsExpanded(tree);

            markmap.destroy();
            return allExpanded;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 5: 折叠操作完整性', () => {
    it('Property 5: For any node tree, after collapseAll, all descendant nodes should be collapsed (fold = 1)', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            // Set the data
            await markmap.setData(tree);

            // Collapse all nodes
            await markmap.collapseAll(tree);

            // Property: All descendants should be collapsed
            const allCollapsed = areAllDescendantsCollapsed(tree);

            // Clean up
            markmap.destroy();

            return allCollapsed;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 5a: collapseAll should work on any subtree, not just root', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // If tree has children, test collapsing a subtree
            if (tree.children && tree.children.length > 0) {
              const subtree = tree.children[0];

              // Collapse the subtree
              await markmap.collapseAll(subtree);

              // Property: All descendants of the subtree should be collapsed
              const allCollapsed = areAllDescendantsCollapsed(subtree);

              markmap.destroy();
              return allCollapsed;
            }

            markmap.destroy();
            return true; // Skip if no children
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 5b: collapseAll is idempotent - calling it twice has same effect as once', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // Collapse all once
            await markmap.collapseAll(tree);
            const afterFirstCollapse = areAllDescendantsCollapsed(tree);

            // Collapse all again
            await markmap.collapseAll(tree);
            const afterSecondCollapse = areAllDescendantsCollapsed(tree);

            markmap.destroy();

            // Property: Both should have same result (all collapsed)
            return (
              afterFirstCollapse === afterSecondCollapse && afterFirstCollapse
            );
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 5c: collapseAll preserves node content and structure', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // Record original structure
            const originalContent = tree.content;
            const originalChildCount = tree.children?.length || 0;
            const originalDescendantCount = countDescendants(tree);

            // Collapse all
            await markmap.collapseAll(tree);

            // Property: Structure should be preserved
            const contentPreserved = tree.content === originalContent;
            const childCountPreserved =
              (tree.children?.length || 0) === originalChildCount;
            const descendantCountPreserved =
              countDescendants(tree) === originalDescendantCount;

            markmap.destroy();

            return (
              contentPreserved &&
              childCountPreserved &&
              descendantCountPreserved
            );
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 5d: collapseAll works on trees of any depth', () => {
      fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 6 }), async (maxDepth) => {
          const tree = fc.sample(arbNodeTree(maxDepth), 1)[0];
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);
            await markmap.collapseAll(tree);

            const allCollapsed = areAllDescendantsCollapsed(tree);

            markmap.destroy();
            return allCollapsed;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 4 & 5: Round-trip properties', () => {
    it('Property 4+5a: expandAll then collapseAll should result in all nodes collapsed', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // Expand all, then collapse all
            await markmap.expandAll(tree);
            await markmap.collapseAll(tree);

            // Property: All should be collapsed
            const allCollapsed = areAllDescendantsCollapsed(tree);

            markmap.destroy();
            return allCollapsed;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 4+5b: collapseAll then expandAll should result in all nodes expanded', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            // Collapse all, then expand all
            await markmap.collapseAll(tree);
            await markmap.expandAll(tree);

            // Property: All should be expanded
            const allExpanded = areAllDescendantsExpanded(tree);

            markmap.destroy();
            return allExpanded;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Property 4+5c: Multiple expand/collapse cycles preserve structure', () => {
      fc.assert(
        fc.asyncProperty(arbNodeTree(4), async (tree) => {
          const markmap = new Markmap(svg);

          try {
            await markmap.setData(tree);

            const originalDescendantCount = countDescendants(tree);

            // Multiple cycles
            for (let i = 0; i < 3; i++) {
              await markmap.expandAll(tree);
              await markmap.collapseAll(tree);
            }

            // Property: Structure should be preserved
            const descendantCountPreserved =
              countDescendants(tree) === originalDescendantCount;

            markmap.destroy();
            return descendantCountPreserved;
          } catch (error) {
            markmap.destroy();
            throw error;
          }
        }),
        { numRuns: 50 },
      );
    });
  });

  describe('Edge Cases', () => {
    it('Property: expandAll/collapseAll handle leaf nodes (no children) correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 20 }),
            children: fc.constant([]),
            payload: fc.record({
              fold: fc.constantFrom(0, 1),
            }),
            state: fc.record({
              id: fc.integer({ min: 0, max: 10000 }),
              path: fc.string({ minLength: 1, maxLength: 20 }),
              key: fc.string({ minLength: 1, maxLength: 20 }),
              depth: fc.constant(0),
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
          async (leafNode) => {
            const markmap = new Markmap(svg);

            try {
              await markmap.setData(leafNode);

              // Both operations should not throw
              await markmap.expandAll(leafNode);
              await markmap.collapseAll(leafNode);

              markmap.destroy();
              return true;
            } catch (error) {
              markmap.destroy();
              throw error;
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it('Property: Operations preserve payload properties other than fold', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 20 }),
            children: fc.array(
              fc.record({
                content: fc.string({ minLength: 1, maxLength: 20 }),
                children: fc.constant([]),
                payload: fc.record({
                  fold: fc.constantFrom(0, 1),
                  customProp: fc.string({ minLength: 1, maxLength: 10 }),
                }),
                state: fc.record({
                  id: fc.integer({ min: 0, max: 10000 }),
                  path: fc.string({ minLength: 1, maxLength: 20 }),
                  key: fc.string({ minLength: 1, maxLength: 20 }),
                  depth: fc.constant(1),
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
              { minLength: 1, maxLength: 3 },
            ),
            payload: fc.record({
              fold: fc.constantFrom(0, 1),
            }),
            state: fc.record({
              id: fc.integer({ min: 0, max: 10000 }),
              path: fc.string({ minLength: 1, maxLength: 20 }),
              key: fc.string({ minLength: 1, maxLength: 20 }),
              depth: fc.constant(0),
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
          async (tree) => {
            const markmap = new Markmap(svg);

            try {
              await markmap.setData(tree);

              // Record custom properties
              const customProps = tree.children!.map(
                (child) => child.payload?.customProp,
              );

              // Perform operations
              await markmap.expandAll(tree);
              await markmap.collapseAll(tree);

              // Property: Custom properties should be preserved
              const propsPreserved = tree.children!.every(
                (child, i) => child.payload?.customProp === customProps[i],
              );

              markmap.destroy();
              return propsPreserved;
            } catch (error) {
              markmap.destroy();
              throw error;
            }
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
