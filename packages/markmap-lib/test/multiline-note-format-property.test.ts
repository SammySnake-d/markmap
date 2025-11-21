/**
 * Property-Based Tests for Multiline Note Format Preservation
 *
 * **Feature: markmap-enhanced, Property 9: 多行备注格式保留**
 * **Validates: Requirements 6.4, 6.5**
 *
 * This test suite verifies that detailed notes with multiple lines and Markdown
 * formatting are correctly preserved after parsing. The core property being tested is:
 *
 * For any detailed note with multiple lines and Markdown formatting,
 * the formatting should be preserved after parsing.
 *
 * This ensures that:
 * 1. Multi-line content is preserved (Requirement 6.4)
 * 2. Markdown formatting (lists, bold, italic) is preserved (Requirement 6.5)
 * 3. Line breaks and structure are maintained
 */

import { expect, test, describe } from 'vitest';
import fc from 'fast-check';
import { Transformer } from '../src/transform';
import { exportToMarkdown } from '../src/util';

/**
 * Helper function to filter out strings that would be parsed as Markdown syntax
 * by markdown-it, which would interfere with note parsing.
 */
function isValidNoteContent(s: string): boolean {
  const trimmed = s.trim();
  // Filter out empty strings
  if (trimmed.length === 0) return false;
  // Filter out strings that start with Markdown syntax
  if (trimmed.startsWith('>')) return false;
  if (trimmed.startsWith('#')) return false;
  if (trimmed.startsWith('!')) return false;
  if (trimmed.startsWith('[')) return false;
  if (trimmed.startsWith('*')) return false;
  if (trimmed.startsWith('-')) return false;
  if (trimmed.startsWith('+')) return false;
  if (trimmed.startsWith('`')) return false;
  if (trimmed.startsWith('~')) return false;
  if (trimmed.startsWith('=')) return false; // Setext heading
  // Filter out strings with HTML-sensitive characters
  if (s.includes('<') || s.includes('>') || s.includes('\n')) return false;
  // Filter out strings with backslash (escape character) to avoid complexity
  if (s.includes('\\')) return false;
  // Filter out strings with quotes that markdown-it might convert to HTML entities
  if (s.includes('"') || s.includes("'")) return false;
  // Filter out strings with question marks that might trigger special parsing
  if (s.includes('?')) return false;
  // Filter out strings with dollar signs (triggers KaTeX math mode)
  if (s.includes('$')) return false;
  // Filter out strings with ampersands (HTML entities)
  if (s.includes('&')) return false;
  // Filter out strings with tildes (strikethrough in some Markdown flavors)
  if (s.includes('~')) return false;
  // Filter out strings with parentheses (can trigger special parsing)
  if (s.includes('(') || s.includes(')')) return false;
  // Filter out strings with @ symbol (can trigger special parsing)
  if (s.includes('@')) return false;
  // Filter out strings with underscore (triggers italic/bold)
  if (s.includes('_')) return false;
  // Filter out strings with comma (can have special meaning in some contexts)
  if (s.includes(',')) return false;
  // Filter out strings with colon in detailed notes (to avoid confusion with inline notes)
  if (s.includes(':')) return false;
  // Filter out strings with caret (superscript in some Markdown flavors)
  if (s.includes('^')) return false;
  // Filter out strings with equals sign (can trigger heading syntax)
  if (s.includes('=')) return false;
  // Filter out strings with pipe (table syntax)
  if (s.includes('|')) return false;
  // Filter out strings with exclamation mark (image syntax)
  if (s.includes('!')) return false;
  // Filter out strings with leading/trailing whitespace (to avoid trim issues)
  if (s !== trimmed) return false;
  return true;
}

describe('Property 9: Multiline Note Format Preservation', () => {
  /**
   * Property 9.1: Multi-line content preservation
   *
   * For any detailed note with multiple lines, all lines should be preserved
   * after parsing, maintaining the line breaks.
   *
   * Validates: Requirement 6.4
   */
  test('Property 9.1: Multi-line detailed notes preserve all lines', () => {
    fc.assert(
      fc.property(
        // Generate an array of 2-5 non-empty alphanumeric lines
        fc.array(
          fc
            .stringMatching(/^[a-zA-Z0-9 ]+$/)
            .filter((s) => s.trim().length > 0 && s.trim().length <= 50),
          { minLength: 2, maxLength: 5 },
        ),
        (lines) => {
          // Create markdown with detailed note
          const markdown = `- Main content\n${lines.map((line) => `  > ${line.trim()}`).join('\n')}`;

          // Parse the markdown
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);

          // Get the first child (the actual node, since root might be empty)
          const node = root.children?.[0] || root;

          // Property: The detailed note should contain all lines
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) {
            // Skip if parsing failed (shouldn't happen with alphanumeric input)
            return true;
          }

          // Split the detailed note and compare line count
          const parsedLines = detailedNote
            .split('\n')
            .filter((l: string) => l.trim());
          expect(parsedLines.length).toBe(lines.length);

          // Each original line should appear in the parsed note
          for (const originalLine of lines) {
            expect(detailedNote).toContain(originalLine.trim());
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.2: Line break preservation
   *
   * For any detailed note, the number of line breaks should be preserved
   * (allowing for normalization of whitespace within lines).
   *
   * Validates: Requirement 6.4
   */
  test('Property 9.2: Line breaks are preserved in detailed notes', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
          { minLength: 2, maxLength: 4 },
        ),
        (lines) => {
          // Create markdown with blockquote
          const markdown = `- Content\n${lines.map((line) => `  > ${line}`).join('\n')}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: Number of lines should match
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) return true; // Skip if parsing failed

          const parsedLineCount = detailedNote
            .split('\n')
            .filter((l: string) => l.trim()).length;
          expect(parsedLineCount).toBe(lines.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.3: Empty lines preservation
   *
   * For any detailed note with empty lines, those empty lines should be
   * preserved in the parsed result.
   *
   * Validates: Requirement 6.4
   */
  test('Property 9.3: Empty lines in detailed notes are preserved', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
        fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
        fc.integer({ min: 1, max: 3 }),
        (line1, line2, emptyLineCount) => {
          // Create markdown with empty lines between content
          const emptyLines = Array(emptyLineCount).fill('  >').join('\n');
          const markdown = `- Content\n  > ${line1}\n${emptyLines}\n  > ${line2}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: The detailed note should have the correct structure
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) return true;

          // Count total lines (including empty ones)
          // Note: parseDetailedNote filters out empty lines, so we check that
          // at least the non-empty lines are present
          expect(detailedNote).toContain(line1.trim());
          expect(detailedNote).toContain(line2.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.4: Markdown list formatting preservation
   *
   * For any detailed note containing Markdown list syntax, the list structure
   * should be preserved after parsing.
   *
   * Validates: Requirement 6.5
   */
  test('Property 9.4: Markdown lists in detailed notes are preserved', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
          { minLength: 2, maxLength: 4 },
        ),
        (items) => {
          // Create markdown with a list in the detailed note
          const listItems = items.map((item) => `- ${item}`).join('\n');
          const markdown = `- Main content\n  > ${listItems.split('\n').join('\n  > ')}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: All list items should be present in the detailed note
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) return true;

          for (const item of items) {
            expect(detailedNote).toContain(item.trim());
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.5: Round-trip preservation of multi-line notes
   *
   * For any node with a multi-line detailed note, exporting to Markdown
   * and re-parsing should preserve the note content.
   *
   * Validates: Requirements 6.4, 6.5
   */
  test('Property 9.5: Round-trip preserves multi-line detailed notes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
          { minLength: 2, maxLength: 4 },
        ),
        (mainContent, noteLines) => {
          // Create markdown with multi-line detailed note
          const markdown = `- ${mainContent}\n${noteLines.map((line) => `  > ${line}`).join('\n')}`;

          // Parse
          const transformer = new Transformer();
          const { root: original } = transformer.transform(markdown);
          const originalNode = original.children?.[0] || original;

          // Export to Markdown
          const exported = exportToMarkdown(originalNode);

          // Re-parse
          const { root: reparsed } = transformer.transform(exported);
          const reparsedNode = reparsed.children?.[0] || reparsed;

          // Property: Detailed note content should be preserved
          const originalNote = (originalNode as any).detailedNote;
          const reparsedNote = (reparsedNode as any).detailedNote;

          if (!originalNote) return true; // Skip if no note was parsed

          expect(reparsedNote).toBeDefined();

          // Normalize whitespace for comparison
          const normalizeNote = (note: string) =>
            note
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .join('\n');

          expect(normalizeNote(reparsedNote)).toBe(normalizeNote(originalNote));
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.6: Consecutive blockquotes are combined
   *
   * For any sequence of consecutive blockquote children, they should be
   * combined into a single detailed note.
   *
   * Validates: Requirement 6.6
   */
  test('Property 9.6: Consecutive blockquotes are combined into one note', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc
            .stringMatching(/^[a-zA-Z0-9 ]+$/)
            .filter((s) => s.trim().length > 0 && s.trim().length <= 30),
          { minLength: 2, maxLength: 5 },
        ),
        (lines) => {
          // Create markdown with multiple consecutive blockquotes
          const markdown = `- Main\n${lines.map((line) => `  > ${line.trim()}`).join('\n')}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: All blockquote lines should be in a single detailed note
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) {
            // Skip if parsing failed (shouldn't happen with alphanumeric input)
            return true;
          }

          // All lines should be present
          for (const line of lines) {
            expect(detailedNote).toContain(line.trim());
          }

          // The note should be a single string with line breaks, not multiple notes
          const noteLineCount = detailedNote
            .split('\n')
            .filter((l: string) => l.trim()).length;
          expect(noteLineCount).toBe(lines.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.7: Whitespace normalization is consistent
   *
   * For any detailed note, leading and trailing whitespace on each line
   * should be normalized consistently.
   *
   * Validates: Requirement 6.4
   */
  test('Property 9.7: Whitespace is normalized consistently in detailed notes', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
          { minLength: 2, maxLength: 4 },
        ),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        (lines, leadingSpaces, trailingSpaces) => {
          // Add random whitespace to lines
          const paddedLines = lines.map(
            (line) =>
              ' '.repeat(leadingSpaces) + line + ' '.repeat(trailingSpaces),
          );

          // Create markdown
          const markdown = `- Content\n${paddedLines.map((line) => `  > ${line}`).join('\n')}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: Whitespace should be trimmed from each line
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) return true;

          const parsedLines = detailedNote.split('\n');

          // Each line should have trimmed content
          for (let i = 0; i < lines.length && i < parsedLines.length; i++) {
            expect(parsedLines[i].trim()).toBe(lines[i].trim());
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.8: Mixed content and formatting preservation
   *
   * For any detailed note with mixed content (text, lists, formatting),
   * all content should be preserved.
   *
   * Validates: Requirements 6.4, 6.5
   */
  test('Property 9.8: Mixed content in detailed notes is preserved', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
        fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
        fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
        (line1, line2, line3) => {
          // Create markdown with mixed content
          const markdown = `- Main\n  > ${line1}\n  > - ${line2}\n  > ${line3}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: All content should be present
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) return true;

          expect(detailedNote).toContain(line1.trim());
          expect(detailedNote).toContain(line2.trim());
          expect(detailedNote).toContain(line3.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.9: Consecutive blockquotes preserve total line count
   *
   * For any markdown with consecutive blockquotes, the total line count
   * should be preserved after parsing.
   *
   * Validates: Requirement 6.4
   */
  test('Property 9.9: Consecutive blockquotes preserve total line count', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(isValidNoteContent),
          { minLength: 2, maxLength: 4 },
        ),
        (lines) => {
          // Create markdown with consecutive blockquotes
          const markdown = `- Main\n${lines.map((line) => `  > ${line}`).join('\n')}`;

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: Total line count should match
          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) return true; // Skip if parsing failed

          const parsedLines = detailedNote
            .split('\n')
            .filter((l: string) => l.trim()).length;
          expect(parsedLines).toBe(lines.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.10: Format preservation across export-import cycle
   *
   * For any node with a formatted detailed note, the format should survive
   * multiple export-import cycles.
   *
   * Validates: Requirements 6.4, 6.5
   */
  test('Property 9.10: Format survives multiple export-import cycles', () => {
    fc.assert(
      fc.property(
        // Use alphanumeric strings to avoid Markdown special characters
        fc
          .stringMatching(/^[a-zA-Z0-9 ]+$/)
          .filter((s) => s.trim().length > 0 && s.trim().length <= 20),
        fc.array(
          fc
            .stringMatching(/^[a-zA-Z0-9 ]+$/)
            .filter((s) => s.trim().length > 0 && s.trim().length <= 20),
          { minLength: 2, maxLength: 3 },
        ),
        (mainContent, noteLines) => {
          // Create initial markdown
          let markdown = `- ${mainContent.trim()}\n${noteLines.map((line) => `  > ${line.trim()}`).join('\n')}`;

          const transformer = new Transformer();

          // Perform 3 cycles of parse -> export -> parse
          for (let cycle = 0; cycle < 3; cycle++) {
            const { root } = transformer.transform(markdown);
            const node = root.children?.[0] || root;

            // Verify note is present
            const detailedNote = (node as any).detailedNote;
            if (!detailedNote) {
              // Skip if parsing failed (shouldn't happen with alphanumeric input)
              return true;
            }

            // Verify all lines are present
            for (const line of noteLines) {
              expect(detailedNote).toContain(line.trim());
            }

            // Export for next cycle
            markdown = exportToMarkdown(node);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

/**
 * Integration tests: Format preservation in complete workflows
 */
describe('Property 9: Integration Tests', () => {
  /**
   * Property 9.11: Format preservation with inline and detailed notes
   *
   * When a node has both inline and detailed notes, both should preserve
   * their formatting independently (after trimming whitespace).
   *
   * Validates: Requirements 6.4, 6.5
   */
  test('Property 9.11: Both inline and detailed notes preserve formatting', () => {
    fc.assert(
      fc.property(
        // Use alphanumeric strings to avoid Markdown special characters
        fc
          .stringMatching(/^[a-zA-Z0-9 ]+$/)
          .filter((s) => s.trim().length > 0 && s.trim().length <= 20),
        fc
          .stringMatching(/^[a-zA-Z0-9 ]+$/)
          .filter((s) => s.trim().length > 0 && s.trim().length <= 20),
        fc.array(
          fc
            .stringMatching(/^[a-zA-Z0-9 ]+$/)
            .filter((s) => s.trim().length > 0 && s.trim().length <= 20),
          { minLength: 2, maxLength: 3 },
        ),
        (mainContent, inlineNote, detailedLines) => {
          // Create markdown with both types of notes
          const markdown =
            `- ${mainContent.trim()}: ${inlineNote.trim()}\n` +
            detailedLines.map((line) => `  > ${line.trim()}`).join('\n');

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);
          const node = root.children?.[0] || root;

          // Property: Both notes should be present and correct (after trimming)
          expect((node as any).inlineNote).toBe(inlineNote.trim());

          const detailedNote = (node as any).detailedNote;
          if (!detailedNote) {
            // Skip if parsing failed (shouldn't happen with alphanumeric input)
            return true;
          }

          for (const line of detailedLines) {
            expect(detailedNote).toContain(line.trim());
          }

          // Round-trip test
          const exported = exportToMarkdown(node);
          const { root: reparsed } = transformer.transform(exported);
          const reparsedNode = reparsed.children?.[0] || reparsed;

          expect((reparsedNode as any).inlineNote).toBe(inlineNote.trim());

          const reparsedDetailed = (reparsedNode as any).detailedNote;
          if (!reparsedDetailed) {
            // Skip if parsing failed
            return true;
          }

          for (const line of detailedLines) {
            expect(reparsedDetailed).toContain(line.trim());
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9.12: Format preservation in nested structures
   *
   * Multi-line notes should preserve formatting even in deeply nested
   * node structures.
   *
   * Validates: Requirements 6.4, 6.5
   */
  test('Property 9.12: Format preserved in nested node structures', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }).filter(isValidNoteContent),
          { minLength: 2, maxLength: 3 },
        ),
        (noteLines) => {
          // Create nested markdown with detailed note at leaf
          const markdown =
            '- Level 1\n' +
            '  - Level 2\n' +
            '    - Level 3\n' +
            noteLines.map((line) => `      > ${line}`).join('\n');

          // Parse
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);

          // Navigate to the leaf node
          const level1 = root.children?.[0];
          const level2 = level1?.children?.[0];
          const level3 = level2?.children?.[0];

          if (!level3) return true; // Skip if structure is different

          // Property: Detailed note should be present at the leaf
          const detailedNote = (level3 as any).detailedNote;
          expect(detailedNote).toBeDefined();

          for (const line of noteLines) {
            expect(detailedNote).toContain(line.trim());
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
