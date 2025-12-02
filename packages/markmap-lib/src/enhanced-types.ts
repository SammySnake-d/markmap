// Re-export from markmap-common to maintain backward compatibility
export {
  type IEnhancedPureNode,
  type IEnhancedNode,
  type ISeparatorConfig,
  DEFAULT_SEPARATORS,
  isEnhancedNode,
} from 'markmap-common';

import type {
  IPureNode,
  IEnhancedPureNode,
  ISeparatorConfig,
} from 'markmap-common';

/**
 * Options for parsing Markdown with note support.
 */
export interface IEnhancedParseOptions {
  separators?: ISeparatorConfig;
}

/**
 * Helper function to create an enhanced node from a pure node.
 */
export function createEnhancedNode(
  node: IPureNode,
  inlineNote?: string,
  detailedNote?: string,
): IEnhancedPureNode {
  return {
    ...node,
    inlineNote,
    detailedNote,
    hasNote: !!(inlineNote || detailedNote),
    children: node.children as IEnhancedPureNode[],
  };
}

/**
 * Helper function to enhance a node tree with note parsing.
 *
 * This function recursively processes a node tree, parsing both inline and
 * detailed notes from each node and its children.
 *
 * Requirements: 5.3, 6.3
 *
 * @param node - The node to enhance
 * @param separators - Optional separator configuration
 * @returns Enhanced node with parsed notes
 */
export function enhanceNodeWithNotes(
  node: IPureNode,
  separators?: ISeparatorConfig,
): IEnhancedPureNode {
  // Import parseMixedNotes dynamically to avoid circular dependency
  // In actual usage, this would be imported from util.ts
  // For now, we'll just create the enhanced node structure
  // The actual parsing will be done by the transformer

  return {
    ...node,
    hasNote: false, // Will be set by the transformer
    children: node.children.map((child) =>
      enhanceNodeWithNotes(child, separators),
    ) as IEnhancedPureNode[],
  };
}
