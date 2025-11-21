/**
 * Test helper functions for markmap-lib testing
 */

import type { INode } from 'markmap-common';

/**
 * Count total number of nodes in a tree
 */
export function countNodes(node: INode): number {
  if (!node) return 0;
  return (
    1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0)
  );
}

/**
 * Get all leaf nodes (nodes without children)
 */
export function getLeafNodes(node: INode): INode[] {
  if (!node.children || node.children.length === 0) {
    return [node];
  }
  return node.children.flatMap(getLeafNodes);
}

/**
 * Get maximum depth of a tree
 */
export function getMaxDepth(node: INode): number {
  if (!node.children || node.children.length === 0) {
    return node.state?.depth || 0;
  }
  return Math.max(...node.children.map(getMaxDepth));
}

/**
 * Find all nodes matching a predicate
 */
export function findNodes(
  node: INode,
  predicate: (n: INode) => boolean,
): INode[] {
  const results: INode[] = [];

  if (predicate(node)) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...findNodes(child, predicate));
    }
  }

  return results;
}

/**
 * Check if two node trees are structurally equivalent
 */
export function areTreesEquivalent(node1: INode, node2: INode): boolean {
  if (node1.content !== node2.content) return false;
  if (node1.state?.depth !== node2.state?.depth) return false;

  const children1 = node1.children || [];
  const children2 = node2.children || [];

  if (children1.length !== children2.length) return false;

  return children1.every((child1, index) =>
    areTreesEquivalent(child1, children2[index]),
  );
}

/**
 * Extract all text content from a node tree
 */
export function extractAllText(node: INode): string[] {
  const texts = [node.content];

  if (node.children) {
    for (const child of node.children) {
      texts.push(...extractAllText(child));
    }
  }

  return texts;
}

/**
 * Normalize whitespace in text for comparison
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Check if a string is valid Markdown list syntax
 */
export function isValidMarkdownList(markdown: string): boolean {
  const lines = markdown.split('\n').filter((line) => line.trim());
  return lines.every((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('>')
    );
  });
}

/**
 * Count occurrences of a character in a string
 */
export function countChar(text: string, char: string): number {
  return (
    text.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ||
    []
  ).length;
}

/**
 * Split text by first occurrence of separator
 */
export function splitByFirstOccurrence(
  text: string,
  separator: string,
): [string, string] {
  const index = text.indexOf(separator);
  if (index === -1) {
    return [text, ''];
  }
  return [text.slice(0, index), text.slice(index + separator.length)];
}

/**
 * Check if text contains escaped separator
 */
export function hasEscapedSeparator(
  text: string,
  separator: string,
  escapeChar: string = '\\',
): boolean {
  const escapedPattern = new RegExp(
    `${escapeChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  );
  return escapedPattern.test(text);
}

/**
 * Remove escape characters from text
 */
export function removeEscapeChars(
  text: string,
  escapeChar: string = '\\',
): string {
  return text.replace(
    new RegExp(`${escapeChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.)`, 'g'),
    '$1',
  );
}
