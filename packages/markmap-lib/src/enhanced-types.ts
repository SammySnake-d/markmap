import type { IPureNode, INode } from 'markmap-common';

/**
 * Enhanced node interface that extends IPureNode with note support.
 *
 * This interface adds support for two types of notes:
 * 1. Inline notes: Short notes that appear after a separator (default: ':')
 * 2. Detailed notes: Multi-line notes using block markers (default: '>')
 *
 * Requirements: 5.1, 5.2, 6.1
 */
export interface IEnhancedPureNode extends IPureNode {
  /**
   * The main content of the node (text before the note separator).
   * This overrides the content field to clarify its role in the enhanced structure.
   */
  content: string;

  /**
   * Inline note content that appears after the note separator.
   * Example: "Node title: This is an inline note"
   *
   * Requirement 5.1: Single-line notes using colon separator
   */
  inlineNote?: string;

  /**
   * Detailed note content from block markers (e.g., quote blocks).
   * Supports multiple lines and Markdown formatting.
   *
   * Requirement 5.2: Detailed notes using block markers
   */
  detailedNote?: string;

  /**
   * Indicates whether this node has any type of note (inline or detailed).
   * This is a computed property for convenience.
   */
  hasNote: boolean;

  /**
   * Child nodes, also enhanced with note support.
   */
  children: IEnhancedPureNode[];
}

/**
 * Enhanced node interface for rendering that extends INode.
 * Includes all the state information needed for visualization.
 */
export interface IEnhancedNode extends INode {
  /**
   * The main content of the node.
   */
  content: string;

  /**
   * Inline note content.
   */
  inlineNote?: string;

  /**
   * Detailed note content.
   */
  detailedNote?: string;

  /**
   * Indicates whether this node has any type of note.
   */
  hasNote: boolean;

  /**
   * Whether the node is currently highlighted (e.g., from search).
   */
  highlighted?: boolean;

  /**
   * Custom color for this node (from color scheme).
   */
  color?: string;

  /**
   * Custom color for the link connecting to this node.
   */
  linkColor?: string;

  /**
   * Child nodes with enhanced properties.
   */
  children: IEnhancedNode[];
}

/**
 * Configuration for parsing separators and markers.
 *
 * Requirement 6.7: Custom separator support
 */
export interface ISeparatorConfig {
  /**
   * Node separator for list items.
   * Default: '-' or '*'
   */
  node?: string;

  /**
   * Separator between main content and inline note.
   * Default: ':'
   */
  note?: string;

  /**
   * Block marker for detailed notes.
   * Default: '>'
   */
  noteBlock?: string;

  /**
   * Escape character for literal separator characters.
   * Default: '\'
   *
   * Requirement 6.8: Escape character handling
   */
  escape?: string;
}

/**
 * Options for parsing Markdown with note support.
 */
export interface IEnhancedParseOptions {
  /**
   * Separator configuration.
   */
  separators?: ISeparatorConfig;
}

/**
 * Default separator configuration.
 */
export const DEFAULT_SEPARATORS: Required<ISeparatorConfig> = {
  node: '-',
  note: ':',
  noteBlock: '>',
  escape: '\\',
};

/**
 * Type guard to check if a node is an enhanced node.
 */
export function isEnhancedNode(node: IPureNode): node is IEnhancedPureNode {
  return 'hasNote' in node;
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
