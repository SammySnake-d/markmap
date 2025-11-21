/**
 * Test helper functions for markmap-view testing
 */

import type { INode } from 'markmap-common';

/**
 * Create a mock SVG element for testing
 */
export function createMockSVG(): SVGSVGElement {
  if (typeof document === 'undefined') {
    // For Node.js environment, return a minimal mock
    return {
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
    } as any;
  }
  return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
}

/**
 * Count visible nodes in a tree (non-collapsed)
 */
export function countVisibleNodes(node: INode): number {
  if (!node) return 0;
  const isFolded = node.payload?.fold;
  if (isFolded) return 1; // Only count the folded node itself

  return (
    1 +
    (node.children?.reduce((sum, child) => sum + countVisibleNodes(child), 0) ||
      0)
  );
}

/**
 * Get all collapsed nodes in a tree
 */
export function getCollapsedNodes(node: INode): INode[] {
  const results: INode[] = [];
  const isFolded = node.payload?.fold;

  if (isFolded) {
    results.push(node);
  }

  if (node.children && !isFolded) {
    for (const child of node.children) {
      results.push(...getCollapsedNodes(child));
    }
  }

  return results;
}

/**
 * Get all expanded nodes in a tree
 */
export function getExpandedNodes(node: INode): INode[] {
  const results: INode[] = [];
  const isFolded = node.payload?.fold;

  if (!isFolded) {
    results.push(node);

    if (node.children) {
      for (const child of node.children) {
        results.push(...getExpandedNodes(child));
      }
    }
  }

  return results;
}

/**
 * Check if all descendants are collapsed
 */
export function areAllDescendantsCollapsed(node: INode): boolean {
  if (!node.children || node.children.length === 0) {
    return true;
  }

  return node.children.every(
    (child) => child.payload?.fold && areAllDescendantsCollapsed(child),
  );
}

/**
 * Check if all descendants are expanded
 */
export function areAllDescendantsExpanded(node: INode): boolean {
  if (!node.children || node.children.length === 0) {
    return true;
  }

  return node.children.every(
    (child) => !child.payload?.fold && areAllDescendantsExpanded(child),
  );
}

/**
 * Search for nodes containing keyword
 */
export function searchNodes(node: INode, keyword: string): INode[] {
  const results: INode[] = [];
  const lowerKeyword = keyword.toLowerCase();

  if (node.content.toLowerCase().includes(lowerKeyword)) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...searchNodes(child, keyword));
    }
  }

  return results;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Check if a color is valid hex format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Apply color scheme to nodes (simplified for testing)
 */
export function applyColorScheme(
  node: INode,
  colors: string[],
): INode & { color?: string } {
  const colorIndex = (node.state?.depth || 0) % colors.length;
  const coloredNode = { ...node, color: colors[colorIndex] };

  if (node.children) {
    coloredNode.children = node.children.map((child) =>
      applyColorScheme(child, colors),
    );
  }

  return coloredNode;
}

/**
 * Clone a node tree deeply
 */
export function cloneNodeTree(node: INode): INode {
  return {
    ...node,
    children: node.children?.map(cloneNodeTree) || [],
  };
}

/**
 * Get path from root to a specific node
 */
export function getNodePath(root: INode, targetNode: INode): INode[] | null {
  if (root === targetNode) {
    return [root];
  }

  if (root.children) {
    for (const child of root.children) {
      const path = getNodePath(child, targetNode);
      if (path) {
        return [root, ...path];
      }
    }
  }

  return null;
}

/**
 * Check if viewport contains point
 */
export function isPointInViewport(
  point: { x: number; y: number },
  viewport: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    point.x >= viewport.x &&
    point.x <= viewport.x + viewport.width &&
    point.y >= viewport.y &&
    point.y <= viewport.y + viewport.height
  );
}

/**
 * Check if a node should display a note icon
 * A node should display a note icon if it has either an inline note or a detailed note
 *
 * Requirement 5.4: Note icon display
 */
export function shouldDisplayNoteIcon(
  node: INode & { inlineNote?: string; detailedNote?: string },
): boolean {
  return !!(
    node.inlineNote ||
    node.detailedNote ||
    node.payload?.inlineNote ||
    node.payload?.detailedNote ||
    node.payload?.hasNote
  );
}

/**
 * Generate HTML with note icon if node has notes
 * This simulates the rendering logic for note icons
 */
export function renderNodeWithNoteIcon(
  content: string,
  hasNote: boolean,
): string {
  if (hasNote) {
    return `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`;
  }
  return content;
}
