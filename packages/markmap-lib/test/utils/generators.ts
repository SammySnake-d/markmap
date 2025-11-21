/**
 * Property-based testing generators for markmap-lib
 * Using fast-check for generating random test data
 */

import fc from 'fast-check';

/**
 * Generate random Markdown heading levels (1-6)
 */
export const arbHeadingLevel = (): fc.Arbitrary<number> => {
  return fc.integer({ min: 1, max: 6 });
};

/**
 * Generate random Markdown text content (alphanumeric with spaces)
 */
export const arbMarkdownText = (): fc.Arbitrary<string> => {
  return fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim());
};

/**
 * Generate random Markdown list item (with - or * prefix)
 */
export const arbListItem = (): fc.Arbitrary<string> => {
  return fc
    .tuple(fc.constantFrom('-', '*'), arbMarkdownText())
    .map(([prefix, text]) => `${prefix} ${text}`);
};

/**
 * Generate random indentation (spaces for nested lists)
 */
export const arbIndentation = (maxLevel: number = 5): fc.Arbitrary<string> => {
  return fc
    .integer({ min: 0, max: maxLevel })
    .map((level) => '  '.repeat(level));
};

/**
 * Generate a simple Markdown list structure
 */
export const arbSimpleMarkdownList = (): fc.Arbitrary<string> => {
  return fc
    .array(arbListItem(), { minLength: 1, maxLength: 10 })
    .map((items) => items.join('\n'));
};

/**
 * Generate nested Markdown list with random indentation
 */
export const arbNestedMarkdownList = (): fc.Arbitrary<string> => {
  return fc
    .array(fc.tuple(arbIndentation(3), arbListItem()), {
      minLength: 1,
      maxLength: 20,
    })
    .map((items) =>
      items.map(([indent, item]) => `${indent}${item}`).join('\n'),
    );
};

/**
 * Generate Markdown with inline notes (using : separator)
 */
export const arbMarkdownWithInlineNote = (): fc.Arbitrary<string> => {
  return fc
    .tuple(arbMarkdownText(), arbMarkdownText())
    .map(([content, note]) => `- ${content}: ${note}`);
};

/**
 * Generate Markdown with detailed notes (using > quote blocks)
 */
export const arbMarkdownWithDetailedNote = (): fc.Arbitrary<string> => {
  return fc
    .tuple(
      arbMarkdownText(),
      fc.array(arbMarkdownText(), { minLength: 1, maxLength: 5 }),
    )
    .map(([content, noteLines]) => {
      const note = noteLines.map((line) => `  > ${line}`).join('\n');
      return `- ${content}\n${note}`;
    });
};

/**
 * Generate text with special characters that might need escaping
 */
export const arbTextWithSpecialChars = (): fc.Arbitrary<string> => {
  return fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0);
};

/**
 * Generate separator characters
 */
export const arbSeparator = (): fc.Arbitrary<string> => {
  return fc.constantFrom(':', '|', ';', ',');
};

/**
 * Generate escape character
 */
export const arbEscapeChar = (): fc.Arbitrary<string> => {
  return fc.constantFrom('\\', '~', '`');
};

/**
 * Generate text that contains a specific separator
 */
export const arbTextWithSeparator = (
  separator: string,
): fc.Arbitrary<string> => {
  return fc
    .tuple(arbMarkdownText(), arbMarkdownText())
    .map(([before, after]) => `${before}${separator}${after}`);
};

/**
 * Generate valid Markdown frontmatter
 */
export const arbFrontmatter = (): fc.Arbitrary<string> => {
  return fc
    .record({
      color: fc.constantFrom('blue', 'red', 'green', 'yellow'),
      colorFreezeLevel: fc.integer({ min: 0, max: 6 }),
    })
    .map((config) => {
      return `---\nmarkmap:\n  color: ${config.color}\n  colorFreezeLevel: ${config.colorFreezeLevel}\n---\n`;
    });
};

/**
 * Generate complete Markdown document with optional frontmatter
 */
export const arbMarkdownDocument = (): fc.Arbitrary<string> => {
  return fc
    .tuple(fc.option(arbFrontmatter(), { nil: '' }), arbNestedMarkdownList())
    .map(([frontmatter, content]) => `${frontmatter}${content}`);
};

/**
 * Generate a random node tree structure for testing
 * This creates nodes with content, optional notes, and children
 */
export const arbNodeTree = (maxDepth: number = 3): fc.Arbitrary<any> => {
  const arbNode = (depth: number): fc.Arbitrary<any> => {
    if (depth >= maxDepth) {
      // Leaf node - no children
      return fc.record({
        content: arbMarkdownText(),
        inlineNote: fc.option(arbMarkdownText(), { nil: undefined }),
        detailedNote: fc.option(
          fc
            .array(arbMarkdownText(), { minLength: 1, maxLength: 3 })
            .map((lines) => lines.join('\n')),
          { nil: undefined },
        ),
        children: fc.constant([]),
      });
    }

    // Non-leaf node - can have children
    return fc.record({
      content: arbMarkdownText(),
      inlineNote: fc.option(arbMarkdownText(), { nil: undefined }),
      detailedNote: fc.option(
        fc
          .array(arbMarkdownText(), { minLength: 1, maxLength: 3 })
          .map((lines) => lines.join('\n')),
        { nil: undefined },
      ),
      children: fc.array(arbNode(depth + 1), { maxLength: 3 }),
    });
  };

  return arbNode(0);
};

/**
 * Generate a simple node tree (no notes, just hierarchy)
 */
export const arbSimpleNodeTree = (maxDepth: number = 3): fc.Arbitrary<any> => {
  const arbNode = (depth: number): fc.Arbitrary<any> => {
    if (depth >= maxDepth) {
      // Leaf node - no children
      return fc.record({
        content: arbMarkdownText(),
        children: fc.constant([]),
      });
    }

    // Non-leaf node - can have children
    return fc.record({
      content: arbMarkdownText(),
      children: fc.array(arbNode(depth + 1), { maxLength: 3 }),
    });
  };

  return arbNode(0);
};
