import { expect, test, describe } from 'vitest';
import { parseMixedNotes } from '../src/util';
import type { IPureNode } from 'markmap-common';

describe('Mixed Note Parsing', () => {
  describe('parseMixedNotes', () => {
    test('parses node with both inline and detailed notes', () => {
      const content = 'Main content: Inline note';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed note content</p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('Inline note');
      expect(result.detailedNote).toBe('Detailed note content');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].content).toBe('Regular child');
    });

    test('parses node with only inline note', () => {
      const content = 'Main content: Inline note';
      const children: IPureNode[] = [
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('Inline note');
      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(1);
    });

    test('parses node with only detailed note', () => {
      const content = 'Main content without inline note';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed note</p></blockquote>',
          children: [],
        },
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main content without inline note');
      expect(result.inlineNote).toBeUndefined();
      expect(result.detailedNote).toBe('Detailed note');
      expect(result.children).toHaveLength(1);
    });

    test('parses node with neither inline nor detailed notes', () => {
      const content = 'Just main content';
      const children: IPureNode[] = [
        {
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Just main content');
      expect(result.inlineNote).toBeUndefined();
      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(1);
    });

    test('handles multiple consecutive blockquotes with inline note', () => {
      const content = 'Title: Short note';
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
          content: 'Regular child',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Title');
      expect(result.inlineNote).toBe('Short note');
      expect(result.detailedNote).toBe('First paragraph\nSecond paragraph');
      expect(result.children).toHaveLength(1);
    });

    test('handles escaped separator in content with detailed note', () => {
      const content = 'Main\\: with colon: Inline note';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed note</p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main: with colon');
      expect(result.inlineNote).toBe('Inline note');
      expect(result.detailedNote).toBe('Detailed note');
      expect(result.children).toHaveLength(0);
    });

    test('handles empty inline note with detailed note', () => {
      const content = 'Main content:';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed note</p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main content');
      expect(result.inlineNote).toBe('');
      expect(result.detailedNote).toBe('Detailed note');
      expect(result.children).toHaveLength(0);
    });

    test('handles empty detailed note with inline note', () => {
      const content = 'Main: Inline note';
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

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline note');
      expect(result.detailedNote).toBe('');
      expect(result.children).toHaveLength(1);
    });

    test('handles custom separators and markers', () => {
      const content = 'Main | Inline note';
      const children: IPureNode[] = [
        {
          content: '<aside><p>Custom detailed note</p></aside>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children, '|', 'aside', '\\');

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline note');
      expect(result.detailedNote).toBe('Custom detailed note');
      expect(result.children).toHaveLength(0);
    });

    test('handles empty children array with inline note', () => {
      const content = 'Main: Inline note';
      const children: IPureNode[] = [];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline note');
      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(0);
    });

    test('handles empty content with detailed note', () => {
      const content = '';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed note</p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('');
      expect(result.inlineNote).toBeUndefined();
      expect(result.detailedNote).toBe('Detailed note');
      expect(result.children).toHaveLength(0);
    });

    test('preserves child node structure', () => {
      const content = 'Main: Note';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed</p></blockquote>',
          children: [],
        },
        {
          content: 'Parent',
          children: [
            {
              content: 'Nested child',
              children: [],
            },
          ],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Note');
      expect(result.detailedNote).toBe('Detailed');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].content).toBe('Parent');
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].content).toBe('Nested child');
    });

    test('handles inline note with multiple colons and detailed note', () => {
      const content = 'Title: Note with: multiple: colons';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>Detailed note</p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Title');
      expect(result.inlineNote).toBe('Note with: multiple: colons');
      expect(result.detailedNote).toBe('Detailed note');
    });

    test('handles detailed note with formatting and inline note', () => {
      const content = 'Main: Inline';
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>Text with <strong>bold</strong> and <em>italic</em></p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline');
      expect(result.detailedNote).toBe('Text with bold and italic');
    });

    test('handles detailed note with HTML entities and inline note', () => {
      const content = 'Main: Inline';
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>Text with &amp; and &lt;tags&gt;</p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline');
      expect(result.detailedNote).toBe('Text with & and <tags>');
    });

    test('handles whitespace trimming in both note types', () => {
      const content = '  Main  :  Inline  ';
      const children: IPureNode[] = [
        {
          content: '<blockquote><p>  Detailed  </p></blockquote>',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline');
      expect(result.detailedNote).toBe('Detailed');
    });

    test('handles blockquote not at beginning with inline note', () => {
      const content = 'Main: Inline';
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

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('Main');
      expect(result.inlineNote).toBe('Inline');
      expect(result.detailedNote).toBeUndefined();
      expect(result.children).toHaveLength(2);
    });

    test('handles complex real-world example', () => {
      const content = 'JavaScript Basics: Core concepts and syntax';
      const children: IPureNode[] = [
        {
          content:
            '<blockquote><p>JavaScript is a high-level programming language.</p><p>It supports multiple paradigms including OOP and functional programming.</p></blockquote>',
          children: [],
        },
        {
          content: 'Variables',
          children: [],
        },
        {
          content: 'Functions',
          children: [],
        },
      ];

      const result = parseMixedNotes(content, children);

      expect(result.mainContent).toBe('JavaScript Basics');
      expect(result.inlineNote).toBe('Core concepts and syntax');
      expect(result.detailedNote).toBe(
        'JavaScript is a high-level programming language.\nIt supports multiple paradigms including OOP and functional programming.',
      );
      expect(result.children).toHaveLength(2);
      expect(result.children[0].content).toBe('Variables');
      expect(result.children[1].content).toBe('Functions');
    });
  });
});
