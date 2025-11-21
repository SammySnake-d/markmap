import { expect, test, describe } from 'vitest';
import { parseDetailedNote } from '../src/util';
import type { IPureNode } from 'markmap-common';

describe('Detailed Note Parsing', () => {
  describe('parseDetailedNote', () => {
    test('extracts detailed note from first blockquote child', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>This is a detailed note</p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child node',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('This is a detailed note');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].content).toBe('Regular child node');
    });

    test('extracts multiple consecutive blockquote children (Requirement 6.6)', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>First paragraph</p></blockquote>',
          children: [],
        },
        {
          content: '<blockquote><p>Second paragraph</p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child node',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('First paragraph\nSecond paragraph');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].content).toBe('Regular child node');
    });

    test('stops at first non-blockquote child', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Note content</p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
        {
          content:
            '<blockquote><p>This should not be included</p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Note content');
      expect(result.children).toHaveLength(2);
    });

    test('returns original children when no blockquote found', () => {
      const children: IPureNode[] = [
        {
          content: 'Regular child 1',
          children: [],
        },
        {
          content: 'Regular child 2',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(2);
      expect(result.children).toEqual(children);
    });

    test('handles empty children array', () => {
      const result = parseDetailedNote([]);

      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(0);
    });

    test('handles blockquote with multiple paragraphs', () => {
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>First paragraph</p><p>Second paragraph</p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('First paragraph\nSecond paragraph');
      expect(result.children).toHaveLength(0);
    });

    test('handles blockquote with line breaks', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Line 1<br>Line 2<br>Line 3</p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Line 1\nLine 2\nLine 3');
    });

    test('handles blockquote with HTML entities', () => {
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>Text with &amp; and &lt;tags&gt;</p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Text with & and <tags>');
    });

    test('handles blockquote with inline formatting', () => {
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>Text with <strong>bold</strong> and <em>italic</em></p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Text with bold and italic');
    });

    test('handles blockquote with attributes', () => {
      const children: IPureNode[] = [
        {
          content:
            '<blockquote class="note" id="note1"><p>Note content</p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Note content');
    });

    test('handles empty blockquote', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote></blockquote>',
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('');
      expect(result.children).toHaveLength(1);
    });

    test('handles blockquote with only whitespace', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>   </p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('');
      expect(result.children).toHaveLength(1);
    });

    test('handles custom note block marker', () => {
      const children: IPureNode[] = [
        {
          content: '<aside><p>Custom note block</p></aside>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children, 'aside');

      expect(result.detailedNote).toBe('Custom note block');
      expect(result.children).toHaveLength(0);
    });

    test('preserves children with nested structure', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Note</p></blockquote>',
          children: [],
        },
        {
          content: 'Parent node',
          children: [
            {
              content: 'Nested child',
              children: [],
            },
          ],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Note');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].children).toHaveLength(1);
    });

    test('handles blockquote not at the beginning', () => {
      const children: IPureNode[] = [
        {
          content: 'Regular child first',
          children: [],
        },
        {
          content:
            '<blockquote><p>This should not be extracted</p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(2);
      expect(result.children).toEqual(children);
    });

    test('handles child with undefined content', () => {
      const children: any[] = [
        {
          content: undefined,
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toEqual(children);
    });

    test('handles child with non-string content', () => {
      const children: any[] = [
        {
          content: 123,
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toEqual(children);
    });

    test('trims whitespace from extracted note', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>  Note with spaces  </p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Note with spaces');
    });

    test('handles blockquote with nested lists', () => {
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><ul><li>Item 1</li><li>Item 2</li></ul></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Item 1\nItem 2');
    });

    test('handles blockquote with code blocks', () => {
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>Note with <code>inline code</code></p></blockquote>',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe('Note with inline code');
    });

    test('handles multiple blockquotes with mixed content', () => {
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>First note</p></blockquote>',
          children: [],
        },
        {
          content:
            '<blockquote><p>Second note with <strong>formatting</strong></p></blockquote>',
          children: [],
        },
        {
          content: '<blockquote><p>Third note</p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseDetailedNote(children);

      expect(result.detailedNote).toBe(
        'First note\nSecond note with formatting\nThird note',
      );
      expect(result.children).toHaveLength(1);
    });
  });
});
