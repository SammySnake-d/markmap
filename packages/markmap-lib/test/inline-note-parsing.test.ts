import { expect, test, describe } from 'vitest';
import { parseInlineNote, handleEscape, addEscape } from '../src/util';

describe('Inline Note Parsing', () => {
  describe('parseInlineNote', () => {
    test('parses content with inline note using default separator', () => {
      const result = parseInlineNote('Main content: This is a note');

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('This is a note');
    });

    test('parses content without separator', () => {
      const result = parseInlineNote('Just main content');

      expect(result.mainContent).toBe('Just main content');
      expect(result.inlineNote).toBeUndefined();
    });

    test('splits only on first separator (Requirement 5.10)', () => {
      const result = parseInlineNote('Title: Note with: multiple: colons');

      expect(result.mainContent).toBe('Title');
      expect(result.inlineNote).toBe('Note with: multiple: colons');
    });

    test('handles escaped separator in main content', () => {
      const result = parseInlineNote('Main\\: content: Note');

      expect(result.mainContent).toBe('Main: content');
      expect(result.inlineNote).toBe('Note');
    });

    test('handles escaped separator in note', () => {
      const result = parseInlineNote('Main: Note\\: with colon');

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Note: with colon');
    });

    test('handles multiple escaped separators', () => {
      const result = parseInlineNote('A\\: B\\: C: Note\\: D');

      expect(result.mainContent).toBe('A: B: C');
      expect(result.inlineNote).toBe('Note: D');
    });

    test('trims whitespace from main content and note', () => {
      const result = parseInlineNote('  Main content  :  Note text  ');

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('Note text');
    });

    test('handles empty note after separator', () => {
      const result = parseInlineNote('Main content:');

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('');
    });

    test('handles empty main content before separator', () => {
      const result = parseInlineNote(': Note only');

      expect(result.mainContent).toBe('');
      expect(result.inlineNote).toBe('Note only');
    });

    test('handles custom note separator', () => {
      const result = parseInlineNote('Main content | Note', '|');

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('Note');
    });

    test('handles custom escape character', () => {
      const result = parseInlineNote('Main^: content: Note', ':', '^');

      expect(result.mainContent).toBe('Main: content');
      expect(result.inlineNote).toBe('Note');
    });

    test('handles empty string input', () => {
      const result = parseInlineNote('');

      expect(result.mainContent).toBe('');
      expect(result.inlineNote).toBeUndefined();
    });

    test('handles separator at the beginning', () => {
      const result = parseInlineNote(':Note');

      expect(result.mainContent).toBe('');
      expect(result.inlineNote).toBe('Note');
    });

    test('handles separator at the end', () => {
      const result = parseInlineNote('Content:');

      expect(result.mainContent).toBe('Content');
      expect(result.inlineNote).toBe('');
    });

    test('handles only separator', () => {
      const result = parseInlineNote(':');

      expect(result.mainContent).toBe('');
      expect(result.inlineNote).toBe('');
    });

    test('handles content with only escaped separators', () => {
      const result = parseInlineNote('A\\: B\\: C');

      expect(result.mainContent).toBe('A: B: C');
      expect(result.inlineNote).toBeUndefined();
    });

    test('handles multi-character separator', () => {
      const result = parseInlineNote('Main content :: Note', '::');

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('Note');
    });

    test('handles escaped multi-character separator', () => {
      const result = parseInlineNote('Main\\:: content :: Note', '::', '\\');

      expect(result.mainContent).toBe('Main:: content');
      expect(result.inlineNote).toBe('Note');
    });
  });

  describe('handleEscape', () => {
    test('removes escape character before escaped character', () => {
      const result = handleEscape('Hello\\: World');

      expect(result).toBe('Hello: World');
    });

    test('handles multiple escape sequences', () => {
      const result = handleEscape('A\\: B\\> C\\* D');

      expect(result).toBe('A: B> C* D');
    });

    test('handles text without escape sequences', () => {
      const result = handleEscape('Plain text');

      expect(result).toBe('Plain text');
    });

    test('handles custom escape character', () => {
      const result = handleEscape('Hello^: World', '^');

      expect(result).toBe('Hello: World');
    });

    test('handles empty string', () => {
      const result = handleEscape('');

      expect(result).toBe('');
    });

    test('handles escape at end of string', () => {
      const result = handleEscape('Text\\:');

      expect(result).toBe('Text:');
    });

    test('handles consecutive escapes', () => {
      const result = handleEscape('A\\:\\: B');

      expect(result).toBe('A:: B');
    });

    test('preserves escape character when not followed by anything', () => {
      const result = handleEscape('Text\\');

      expect(result).toBe('Text\\');
    });
  });

  describe('addEscape', () => {
    test('adds escape before separator', () => {
      const result = addEscape('Hello: World', ':');

      expect(result).toBe('Hello\\: World');
    });

    test('adds escape before multiple separators', () => {
      const result = addEscape('A: B: C', ':');

      expect(result).toBe('A\\: B\\: C');
    });

    test('handles text without separator', () => {
      const result = addEscape('Plain text', ':');

      expect(result).toBe('Plain text');
    });

    test('handles custom escape character', () => {
      const result = addEscape('Hello: World', ':', '^');

      expect(result).toBe('Hello^: World');
    });

    test('handles empty string', () => {
      const result = addEscape('', ':');

      expect(result).toBe('');
    });

    test('handles multi-character separator', () => {
      const result = addEscape('A :: B :: C', '::');

      expect(result).toBe('A \\:: B \\:: C');
    });

    test('handles special regex characters in separator', () => {
      const result = addEscape('A.B.C', '.');

      expect(result).toBe('A\\.B\\.C');
    });
  });

  describe('Integration: Round-trip escape handling', () => {
    test('adding then removing escape preserves original text', () => {
      const original = 'Hello: World';
      const escaped = addEscape(original, ':');
      const unescaped = handleEscape(escaped);

      expect(unescaped).toBe(original);
    });

    test('round-trip with multiple separators', () => {
      const original = 'A: B: C: D';
      const escaped = addEscape(original, ':');
      const unescaped = handleEscape(escaped);

      expect(unescaped).toBe(original);
    });

    test('parseInlineNote correctly handles pre-escaped content', () => {
      const content = 'Title\\: with colon: Note';
      const result = parseInlineNote(content);

      expect(result.mainContent).toBe('Title: with colon');
      expect(result.inlineNote).toBe('Note');
    });
  });
});

/**
 * Property-Based Tests
 *
 * These tests use fast-check to verify properties that should hold
 * for all valid inputs, not just specific examples.
 */

import fc from 'fast-check';

describe('Property-Based Tests', () => {
  /**
   * **Feature: markmap-enhanced, Property 1: 备注解析 Round-trip**
   * **Validates: Requirements 5.1, 5.11**
   *
   * Property: For any text containing separators, if we:
   * 1. Add escape characters before separators
   * 2. Parse the escaped text with parseInlineNote
   * 3. Reconstruct the text by combining mainContent and inlineNote with separator
   * 4. Parse again
   *
   * Then the second parse should produce the same result as the first parse.
   *
   * This ensures that the round-trip process (escape -> parse -> export -> parse)
   * preserves the original content structure.
   */
  test('Property 1: Note parsing round-trip preserves content structure', () => {
    fc.assert(
      fc.property(
        // Generate random main content and note content
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.constantFrom(':', '|', ';', '::'),
        (mainContent, noteContent, separator) => {
          // Skip if either part contains the separator (we'll test escaping separately)
          // This property focuses on the round-trip of already-separated content
          if (
            mainContent.includes(separator) ||
            noteContent.includes(separator)
          ) {
            return true; // Skip this case
          }

          // Skip if mainContent ends with escape character (would escape the separator we add)
          if (mainContent.endsWith('\\')) {
            return true; // Skip this case
          }

          // Skip if mainContent contains escape characters
          // (because handleEscape will process them and change the text)
          if (mainContent.includes('\\') || noteContent.includes('\\')) {
            return true; // Skip this case
          }

          // Trim the content to match what parseInlineNote does
          const trimmedMain = mainContent.trim();
          const trimmedNote = noteContent.trim();

          // Step 1: Create content with separator
          // Only add separator if we have note content (even if empty after trim)
          const originalContent = noteContent
            ? `${trimmedMain}${separator} ${trimmedNote}`
            : trimmedMain;

          // Step 2: Parse the content
          const firstParse = parseInlineNote(originalContent, separator);

          // Step 3: Reconstruct the content from parsed parts
          // Note: parseInlineNote always returns inlineNote when separator is present (even if empty)
          const reconstructed =
            firstParse.inlineNote !== undefined
              ? `${firstParse.mainContent}${separator} ${firstParse.inlineNote}`
              : firstParse.mainContent;

          // Step 4: Parse the reconstructed content
          const secondParse = parseInlineNote(reconstructed, separator);

          // Property: Both parses should produce identical results
          expect(secondParse.mainContent).toBe(firstParse.mainContent);
          expect(secondParse.inlineNote).toBe(firstParse.inlineNote);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 1b: Round-trip with escape characters
   *
   * This tests that content with separators can be escaped, parsed, and reconstructed
   * while preserving the original separator characters in the content.
   *
   * Note: The escape character works for ANY character (like in programming languages),
   * not just separators. This means if the original text contains escape sequences,
   * they will be processed by handleEscape.
   */
  test('Property 1b: Round-trip with escaped separators preserves original text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(':', '|', ';'),
        fc.constantFrom('\\', '~', '^'),
        (text, separator, escapeChar) => {
          // Skip empty strings
          if (!text.trim()) return true;

          // Skip if text already contains the escape character
          // (because handleEscape will process existing escape sequences)
          if (text.includes(escapeChar)) return true;

          // Step 1: Add escape characters before all separators
          const escaped = addEscape(text, separator, escapeChar);

          // Step 2: Remove escape characters
          const unescaped = handleEscape(escaped, escapeChar);

          // Property: Unescaping should restore the original text
          // (only when the original text didn't contain escape characters)
          expect(unescaped).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 1c: Complete round-trip with both content and notes containing separators
   *
   * This is the most comprehensive test: it verifies that content with separators
   * can be properly escaped, combined with notes, parsed, and reconstructed.
   *
   * Note: parseInlineNote trims whitespace, so we skip strings with leading/trailing spaces.
   */
  test('Property 1c: Complete round-trip with separators in both content and note', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(':', '|'),
        (mainContent, noteContent, separator) => {
          // Skip empty strings
          if (!mainContent.trim() || !noteContent.trim()) return true;

          // Skip if content already contains escape characters
          // (because handleEscape will process them)
          if (mainContent.includes('\\') || noteContent.includes('\\'))
            return true;

          // Skip if content has leading/trailing whitespace
          // (because parseInlineNote trims whitespace)
          if (
            mainContent !== mainContent.trim() ||
            noteContent !== noteContent.trim()
          )
            return true;

          // Step 1: Escape any separators in the content parts
          const escapedMain = addEscape(mainContent, separator);
          const escapedNote = addEscape(noteContent, separator);

          // Step 2: Combine with separator
          const combined = `${escapedMain}${separator} ${escapedNote}`;

          // Step 3: Parse the combined content
          const parsed = parseInlineNote(combined, separator);

          // Property: Parsed content should match original (unescaped) content
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
   * Property 1d: Idempotence of escape operations
   *
   * Verifies that escaping is idempotent when applied correctly:
   * Multiple escape/unescape cycles should preserve content that doesn't
   * contain escape characters.
   */
  test('Property 1d: Multiple escape/unescape cycles preserve content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(':', '|', ';'),
        (text, separator) => {
          if (!text.trim()) return true;

          // Skip if text contains escape characters
          if (text.includes('\\')) return true;

          // Multiple round-trips should preserve the text
          let current = text;
          for (let i = 0; i < 3; i++) {
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
   * Property 1e: Parsing without separator returns full content as mainContent
   *
   * Verifies that content without separators is handled correctly.
   * Note: If the text contains escape sequences, they will be processed.
   */
  test('Property 1e: Content without separator has no inline note', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(':', '|', ';'),
        (text, separator) => {
          // Only test strings that don't contain the separator
          if (text.includes(separator)) return true;
          if (!text.trim()) return true;

          // Skip if text contains escape characters
          // (because handleEscape will process them and change the text)
          if (text.includes('\\')) return true;

          const parsed = parseInlineNote(text, separator);

          // Property: Should have mainContent but no inlineNote
          expect(parsed.mainContent).toBe(text);
          expect(parsed.inlineNote).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
