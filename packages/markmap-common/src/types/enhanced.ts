import type { IPureNode, INode } from './common';

/**
 * Enhanced node interface that extends IPureNode with note support.
 */
export interface IEnhancedPureNode extends IPureNode {
  content: string;
  inlineNote?: string;
  detailedNote?: string;
  hasNote: boolean;
  children: IEnhancedPureNode[];
}

/**
 * Enhanced node interface for rendering that extends INode.
 */
export interface IEnhancedNode extends INode {
  content: string;
  inlineNote?: string;
  detailedNote?: string;
  hasNote: boolean;
  highlighted?: boolean;
  color?: string;
  linkColor?: string;
  children: IEnhancedNode[];
}

/**
 * Configuration for parsing separators and markers.
 */
export interface ISeparatorConfig {
  node?: string;
  note?: string;
  noteBlock?: string;
  escape?: string;
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
