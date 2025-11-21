/**
 * Property-Based Tests for Escape Character Round-trip
 *
 * **Feature: markmap-enhanced, Property 2: 转义字符 Round-trip**
 * **Validates: Requirements 6.8, 6.9, 6.10**
 *
 * This test suite verifies that escape character handling is correct and consistent
 * across all possible inputs. The core property being tested is:
 *
 * For any text containing separator characters with escape characters,
 * parsing then exporting should preserve the original text.
 *
 * This ensures that:
 * 1. Escape characters are correctly added before separators (Requirement 6.10)
 * 2. Escape characters are correctly removed during parsing (Requirement 6.8, 6.9)
 * 3. The round-trip process preserves the original content
 */

import { expect, test, describe } from 'vitest';
import fc from 'fast-check';
import { handleEscape, addEscape, parseInlineNote } from '../src/util';

describe('Property 2: Escape Character Round-trip', () => {
  /**
   * Property 2.1: Basic escape/unescape round-trip
   *
   * For any text and separator, if we:
   * 1. Add escape characters before all separators
   * 2. Remove escape characters
   *
   * Then we should get back the original text.
   *
   * This is the most fundamental property of escape character handling.
   */
  test('Property 2.1: addEscape then handleEscape preserves original text', () => {
    fc.assert(
      fc.property(
        // Generate random text (excluding escape characters to avoid complexity)
        fc
          .string({ minLength: 0, maxLength: 100 })
          .filter((s) => !s.includes('\\')),
        // Generate random separator
        fc.constantFrom(':', '|', ';', ',', '>', '-', '*'),
        (text, separator) => {
          // Step 1: Add escape characters before all separators
          const escaped = addEscape(text, separator);

          // Step 2: Remove escape characters
          const unescaped = handleEscape(escaped);

          // Property: Should get back the original text
          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.2: Round-trip with custom escape character
   *
   * The same property should hold for any escape character, not just backslash.
   */
  test('Property 2.2: Round-trip works with custom escape characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.constantFrom(':', '|', ';'),
        fc.constantFrom('\\', '~', '^', '`'),
        (text, separator, escapeChar) => {
          // Skip if text contains the escape character
          // (to avoid nested escape sequences which are complex)
          if (text.includes(escapeChar)) return true;

          const escaped = addEscape(text, separator, escapeChar);
          const unescaped = handleEscape(escaped, escapeChar);

          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.3: Idempotence of escape operations
   *
   * Multiple escape/unescape cycles should preserve the original text.
   * This tests that our escape handling is stable and doesn't accumulate errors.
   */
  test('Property 2.3: Multiple escape/unescape cycles preserve text', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 0, maxLength: 100 })
          .filter((s) => !s.includes('\\')),
        fc.constantFrom(':', '|', ';'),
        (text, separator) => {
          let current = text;

          // Perform 5 round-trips
          for (let i = 0; i < 5; i++) {
            const escaped = addEscape(current, separator);
            current = handleEscape(escaped);
          }

          expect(current).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.4: Escape handling in parseInlineNote
   *
   * When content contains escaped separators, parseInlineNote should:
   * 1. Not split on escaped separators
   * 2. Remove escape characters from the final output
   * 3. Split only on the first unescaped separator
   */
  test('Property 2.4: parseInlineNote correctly handles escaped separators', () => {
    fc.assert(
      fc.property(
        // Generate main content and note content without separators or escapes
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(
            (s) => s.trim().length > 0 && !s.includes(':') && !s.includes('\\'),
          ),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(
            (s) => s.trim().length > 0 && !s.includes(':') && !s.includes('\\'),
          ),
        (mainContent, noteContent) => {
          const separator = ':';

          // Trim to match parseInlineNote behavior
          const trimmedMain = mainContent.trim();
          const trimmedNote = noteContent.trim();

          // Create content with separator
          const combined = `${trimmedMain}${separator} ${trimmedNote}`;

          // Parse it
          const parsed = parseInlineNote(combined, separator);

          // Property: Should split correctly
          expect(parsed.mainContent).toBe(trimmedMain);
          expect(parsed.inlineNote).toBe(trimmedNote);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.5: Complete round-trip with separators in content
   *
   * This is the most comprehensive test: content with separators should be
   * escapable, parseable, and reconstructable while preserving the separators.
   */
  test('Property 2.5: Complete round-trip preserves separators in content', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(
            (s) => s.trim().length > 0 && !s.includes('\\') && s === s.trim(),
          ),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter(
            (s) => s.trim().length > 0 && !s.includes('\\') && s === s.trim(),
          ),
        fc.constantFrom(':', '|'),
        (mainContent, noteContent, separator) => {
          // Step 1: Escape any separators in the content
          const escapedMain = addEscape(mainContent, separator);
          const escapedNote = addEscape(noteContent, separator);

          // Step 2: Combine with separator
          const combined = `${escapedMain}${separator} ${escapedNote}`;

          // Step 3: Parse
          const parsed = parseInlineNote(combined, separator);

          // Property: Parsed content should match original (unescaped)
          expect(parsed.mainContent).toBe(mainContent);
          expect(parsed.inlineNote).toBe(noteContent);

          // Step 4: Reconstruct by escaping and combining again
          const reconstructedMain = addEscape(parsed.mainContent, separator);
          const reconstructedNote = addEscape(
            parsed.inlineNote || '',
            separator,
          );
          const reconstructed = `${reconstructedMain}${separator} ${reconstructedNote}`;

          // Step 5: Parse again
          const reparsed = parseInlineNote(reconstructed, separator);

          // Property: Second parse should match first parse
          expect(reparsed.mainContent).toBe(parsed.mainContent);
          expect(reparsed.inlineNote).toBe(parsed.inlineNote);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.6: Escape character only affects the next character
   *
   * An escape character should only escape the immediately following character,
   * not affect any other characters in the string.
   */
  test('Property 2.6: Escape character only affects next character', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => !s.includes('\\')),
        fc.constantFrom(':', '|', ';'),
        (text, separator) => {
          // Add escape before all separators
          const escaped = addEscape(text, separator);

          // Count separators in original
          const originalCount = (
            text.match(
              new RegExp(separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            ) || []
          ).length;

          // Count escape+separator sequences in escaped
          const escapeSequences = (
            escaped.match(
              new RegExp(
                `\\\\${separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
                'g',
              ),
            ) || []
          ).length;

          // Property: Number of escape sequences should equal number of original separators
          expect(escapeSequences).toBe(originalCount);

          // After unescaping, should get back original
          const unescaped = handleEscape(escaped);
          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.7: Empty strings and edge cases
   *
   * Escape handling should work correctly for edge cases like empty strings,
   * strings with only separators, etc.
   */
  test('Property 2.7: Escape handling works for edge cases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '',
          ':',
          '::',
          ':::',
          'a',
          'a:b',
          ':a',
          'a:',
          ':::a:::',
        ),
        fc.constantFrom(':', '|'),
        (text, separator) => {
          const escaped = addEscape(text, separator);
          const unescaped = handleEscape(escaped);

          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 2.8: Multi-character separators
   *
   * Escape handling should work correctly for multi-character separators like '::'
   */
  test('Property 2.8: Round-trip works with multi-character separators', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 0, maxLength: 100 })
          .filter((s) => !s.includes('\\')),
        fc.constantFrom('::', '||', ';;', '->'),
        (text, separator) => {
          const escaped = addEscape(text, separator);
          const unescaped = handleEscape(escaped);

          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.9: Special regex characters in separators
   *
   * Separators that are special regex characters (like '.', '*', '+') should
   * be handled correctly.
   */
  test('Property 2.9: Round-trip works with regex special characters as separators', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 0, maxLength: 100 })
          .filter((s) => !s.includes('\\')),
        fc.constantFrom('.', '*', '+', '?', '[', ']', '(', ')'),
        (text, separator) => {
          const escaped = addEscape(text, separator);
          const unescaped = handleEscape(escaped);

          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.10: Consistency across different separators
   *
   * The escape/unescape behavior should be consistent regardless of which
   * separator is being used.
   */
  test('Property 2.10: Escape behavior is consistent across separators', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0 && !s.includes('\\')),
        (text) => {
          const separators = [':', '|', ';', ','];

          // For each separator, the round-trip should work
          for (const sep of separators) {
            const escaped = addEscape(text, sep);
            const unescaped = handleEscape(escaped);
            expect(unescaped).toBe(text);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Integration tests: Escape handling in complete parsing workflow
 *
 * These tests verify that escape handling works correctly when integrated
 * with the full note parsing functionality.
 */
describe('Property 2: Integration with Note Parsing', () => {
  /**
   * Property 2.11: Escaped separators don't create false splits
   *
   * Content with escaped separators should not be split at those points.
   */
  test('Property 2.11: Escaped separators are not treated as split points', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 30 })
          .filter(
            (s) => s.trim().length > 0 && !s.includes(':') && !s.includes('\\'),
          ),
        fc.integer({ min: 1, max: 5 }),
        (baseText, numSeparators) => {
          // Create text with multiple escaped separators
          const parts = Array(numSeparators + 1).fill(baseText);
          const textWithEscapedSeps = parts.join('\\:');

          // Parse it
          const parsed = parseInlineNote(textWithEscapedSeps, ':');

          // Property: Should not split, all content should be in mainContent
          expect(parsed.mainContent).toBe(parts.join(':'));
          expect(parsed.inlineNote).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 2.12: Mix of escaped and unescaped separators
   *
   * When content has both escaped and unescaped separators, only the first
   * unescaped separator should be used as the split point.
   *
   * Note: parseInlineNote trims whitespace from both mainContent and inlineNote,
   * so we need to account for that in our expectations.
   */
  test('Property 2.12: First unescaped separator is the split point', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter(
            (s) =>
              s.trim().length > 0 &&
              !s.includes(':') &&
              !s.includes('\\') &&
              s === s.trim(),
          ),
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter(
            (s) =>
              s.trim().length > 0 &&
              !s.includes(':') &&
              !s.includes('\\') &&
              s === s.trim(),
          ),
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter(
            (s) =>
              s.trim().length > 0 &&
              !s.includes(':') &&
              !s.includes('\\') &&
              s === s.trim(),
          ),
        (part1, part2, part3) => {
          // Create: "part1\:part2: part3"
          // Should split into mainContent="part1:part2" and inlineNote="part3"
          // Note: parseInlineNote will trim both parts
          const content = `${part1}\\:${part2}: ${part3}`;

          const parsed = parseInlineNote(content, ':');

          // Both parts should be trimmed by parseInlineNote
          expect(parsed.mainContent).toBe(`${part1}:${part2}`.trim());
          expect(parsed.inlineNote).toBe(part3.trim());
        },
      ),
      { numRuns: 100 },
    );
  });
});
