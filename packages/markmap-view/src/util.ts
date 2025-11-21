import { scaleOrdinal } from 'd3';
import { INode } from 'markmap-common';
import { defaultOptions, lineWidthFactory } from './constants';
import { IMarkmapJSONOptions, IMarkmapOptions } from './types';

export function deriveOptions(jsonOptions?: Partial<IMarkmapJSONOptions>) {
  const derivedOptions: Partial<IMarkmapOptions> = {};
  const options = { ...jsonOptions };

  const { color, colorFreezeLevel, lineWidth } = options;
  if (color?.length === 1) {
    const solidColor = color[0];
    derivedOptions.color = () => solidColor;
  } else if (color?.length) {
    const colorFn = scaleOrdinal(color);
    derivedOptions.color = (node: INode) => colorFn(`${node.state.path}`);
  }
  if (colorFreezeLevel) {
    const color = derivedOptions.color || defaultOptions.color;
    derivedOptions.color = (node: INode) => {
      node = {
        ...node,
        state: {
          ...node.state,
          path: node.state.path.split('.').slice(0, colorFreezeLevel).join('.'),
        },
      };
      return color(node);
    };
  }
  if (lineWidth) {
    const args = Array.isArray(lineWidth) ? lineWidth : [lineWidth, 0, 1];
    derivedOptions.lineWidth = lineWidthFactory(
      ...(args as Parameters<typeof lineWidthFactory>),
    );
  }

  const numberKeys = [
    'duration',
    'fitRatio',
    'initialExpandLevel',
    'maxInitialScale',
    'maxWidth',
    'nodeMinHeight',
    'paddingX',
    'spacingHorizontal',
    'spacingVertical',
  ] as const;
  numberKeys.forEach((key) => {
    const value = options[key];
    if (typeof value === 'number') derivedOptions[key] = value;
  });

  const booleanKeys = ['zoom', 'pan'] as const;
  booleanKeys.forEach((key) => {
    const value = options[key];
    if (value != null) derivedOptions[key] = !!value;
  });

  return derivedOptions;
}

/**
 * Credit: https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781?permalink_comment_id=4738050#gistcomment-4738050
 */
export function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function childSelector<T extends Element>(
  filter?: string | ((el: T) => boolean),
): () => T[] {
  if (typeof filter === 'string') {
    const selector = filter;
    filter = (el: T): boolean => el.matches(selector);
  }
  const filterFn = filter;
  return function selector(this: Element): T[] {
    let nodes = Array.from(this.childNodes as NodeListOf<T>);
    if (filterFn) nodes = nodes.filter((node) => filterFn(node));
    return nodes;
  };
}

/**
 * Exports a node tree to Markdown format.
 *
 * This is a simplified version for markmap-view to avoid circular dependencies.
 * The full implementation is in markmap-lib.
 *
 * Requirements: 4.2, 4.3, 4.4, 8.4
 *
 * @param node - The root node to export (or any subtree)
 * @param level - Current indentation level (used internally for recursion)
 * @returns Markdown string representation of the node tree
 */
export function exportNodeAsMarkdown(node: INode, level: number = 0): string {
  const lines: string[] = [];
  const indent = '  '.repeat(level); // 2 spaces per level

  // Skip the root node if it has no content (common in markmap)
  if (level === 0 && !node.content?.trim()) {
    // Export children directly without the root
    if (node.children && node.children.length > 0) {
      return node.children
        .map((child: INode) => exportNodeAsMarkdown(child, 0))
        .join('\n');
    }
    return '';
  }

  // Build the main line with content
  let mainLine = `${indent}- `;

  // Add content
  if (node.content) {
    // Escape colons in content if there's an inline note
    const hasInlineNote = (node.payload as any)?.inlineNote;
    const content = hasInlineNote
      ? node.content.replace(/:/g, '\\:')
      : node.content;
    mainLine += content;
  }

  // Add inline note if present
  const inlineNote = (node.payload as any)?.inlineNote;
  if (inlineNote) {
    const escapedNote = inlineNote.replace(/:/g, '\\:');
    mainLine += `: ${escapedNote}`;
  }

  lines.push(mainLine);

  // Add detailed note as blockquote if present
  const detailedNote = (node.payload as any)?.detailedNote;
  if (detailedNote) {
    const noteLines = detailedNote.split('\n');
    for (const noteLine of noteLines) {
      if (noteLine.trim()) {
        lines.push(`${indent}  > ${noteLine.trim()}`);
      } else {
        // Preserve empty lines in detailed notes
        lines.push(`${indent}  >`);
      }
    }
  }

  // Recursively export children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childMarkdown = exportNodeAsMarkdown(child, level + 1);
      if (childMarkdown) {
        lines.push(childMarkdown);
      }
    }
  }

  return lines.join('\n');
}
