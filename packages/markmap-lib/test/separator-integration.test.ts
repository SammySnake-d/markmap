import { describe, it, expect } from 'vitest';
import { Transformer } from '../src/transform';

describe('Separator Integration Tests', () => {
  describe('Default separators', () => {
    it('should parse inline notes with default colon separator', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Node 1: This is an inline note
- Node 2`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];

      expect(node1.content).toBe('Node 1');
      expect((node1 as any).inlineNote).toBe('This is an inline note');
      expect((node1 as any).hasNote).toBe(true);
    });

    it('should parse detailed notes with default blockquote marker', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Node 1
  > This is a detailed note
  > With multiple lines
- Node 2`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];

      expect(node1.content).toBe('Node 1');
      expect((node1 as any).detailedNote).toContain('This is a detailed note');
      expect((node1 as any).detailedNote).toContain('With multiple lines');
      expect((node1 as any).hasNote).toBe(true);
    });

    it('should parse both inline and detailed notes', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Node 1: Inline note
  > Detailed note`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];

      expect(node1.content).toBe('Node 1');
      expect((node1 as any).inlineNote).toBe('Inline note');
      expect((node1 as any).detailedNote).toBe('Detailed note');
      expect((node1 as any).hasNote).toBe(true);
    });
  });

  describe('Custom separators', () => {
    it('should use custom note separator', () => {
      const transformer = new Transformer(undefined, {
        separators: {
          note: '::',
        },
      });

      const markdown = `# Root
- Node 1:: This is a note with custom separator
- Node 2: This is not a note (single colon)`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];
      const node2 = result.root.children[1];

      // Node 1 should have the note parsed
      expect(node1.content).toBe('Node 1');
      expect((node1 as any).inlineNote).toBe(
        'This is a note with custom separator',
      );
      expect((node1 as any).hasNote).toBe(true);

      // Node 2 should not have the note parsed (single colon)
      expect(node2.content).toBe('Node 2: This is not a note (single colon)');
      expect((node2 as any).inlineNote).toBeUndefined();
    });

    it('should use custom escape character', () => {
      const transformer = new Transformer(undefined, {
        separators: {
          escape: '^',
        },
      });

      const markdown = `# Root
- Node 1^: Content with escaped colon
- Node 2: Normal note`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];
      const node2 = result.root.children[1];

      // Node 1 should have escaped colon in content
      expect(node1.content).toBe('Node 1: Content with escaped colon');
      expect((node1 as any).inlineNote).toBeUndefined();

      // Node 2 should have normal note
      expect(node2.content).toBe('Node 2');
      expect((node2 as any).inlineNote).toBe('Normal note');
    });

    it('should use multiple custom separators together', () => {
      const transformer = new Transformer(undefined, {
        separators: {
          note: '|',
          escape: '^^',
        },
      });

      const markdown = `# Root
- Node 1| Inline note with custom separator
  > Detailed note
- Node 2^^| Content with escaped separator`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];
      const node2 = result.root.children[1];

      // Node 1 should have both notes
      expect(node1.content).toBe('Node 1');
      expect((node1 as any).inlineNote).toBe(
        'Inline note with custom separator',
      );
      expect((node1 as any).detailedNote).toBe('Detailed note');
      expect((node1 as any).hasNote).toBe(true);

      // Node 2 should have escaped separator in content
      expect(node2.content).toBe('Node 2| Content with escaped separator');
      expect((node2 as any).inlineNote).toBeUndefined();
    });
  });

  describe('HTML content handling', () => {
    it('should not parse notes in HTML content', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- [Link](https://example.com)
- <a href="https://example.com">Link</a>`;

      const result = transformer.transform(markdown);

      // Both nodes should not have notes parsed from URLs
      result.root.children.forEach((node) => {
        expect((node as any).inlineNote).toBeUndefined();
      });
    });

    it('should parse notes in plain text but not in HTML', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Plain text: This is a note
- <span>HTML content: Not a note</span>`;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];
      const node2 = result.root.children[1];

      // Node 1 should have note
      expect(node1.content).toBe('Plain text');
      expect((node1 as any).inlineNote).toBe('This is a note');

      // Node 2 should not have note (HTML content)
      expect((node2 as any).inlineNote).toBeUndefined();
    });
  });

  describe('Nested structures', () => {
    it('should parse notes in nested nodes', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Parent: Parent note
  - Child 1: Child note 1
  - Child 2: Child note 2
    - Grandchild: Grandchild note`;

      const result = transformer.transform(markdown);
      const parent = result.root.children[0];
      const child1 = parent.children[0];
      const child2 = parent.children[1];
      const grandchild = child2.children[0];

      expect(parent.content).toBe('Parent');
      expect((parent as any).inlineNote).toBe('Parent note');

      expect(child1.content).toBe('Child 1');
      expect((child1 as any).inlineNote).toBe('Child note 1');

      expect(child2.content).toBe('Child 2');
      expect((child2 as any).inlineNote).toBe('Child note 2');

      expect(grandchild.content).toBe('Grandchild');
      expect((grandchild as any).inlineNote).toBe('Grandchild note');
    });

    it('should parse detailed notes in nested nodes', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Parent
  > Parent detailed note
  - Child
    > Child detailed note`;

      const result = transformer.transform(markdown);
      const parent = result.root.children[0];
      const child = parent.children[0];

      expect(parent.content).toBe('Parent');
      expect((parent as any).detailedNote).toBe('Parent detailed note');

      expect(child.content).toBe('Child');
      expect((child as any).detailedNote).toBe('Child detailed note');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty notes', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Node 1:
- Node 2: `;

      const result = transformer.transform(markdown);
      const node1 = result.root.children[0];
      const node2 = result.root.children[1];

      expect(node1.content).toBe('Node 1');
      expect((node1 as any).inlineNote).toBe('');

      expect(node2.content).toBe('Node 2');
      expect((node2 as any).inlineNote).toBe('');
    });

    it('should handle nodes without notes', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Node 1
- Node 2`;

      const result = transformer.transform(markdown);

      result.root.children.forEach((node) => {
        expect((node as any).inlineNote).toBeUndefined();
        expect((node as any).detailedNote).toBeUndefined();
        expect((node as any).hasNote).toBeUndefined();
      });
    });

    it('should handle multiple colons correctly', () => {
      const transformer = new Transformer();
      const markdown = `# Root
- Time: 10:30:45`;

      const result = transformer.transform(markdown);
      const node = result.root.children[0];

      // Should split on first colon only
      expect(node.content).toBe('Time');
      expect((node as any).inlineNote).toBe('10:30:45');
    });
  });

  describe('Persistence across transforms', () => {
    it('should maintain separator config across multiple transforms', () => {
      const transformer = new Transformer(undefined, {
        separators: {
          note: '::',
        },
      });

      // First transform
      const result1 = transformer.transform('# Test 1\n- Node A:: Note A');
      const node1 = result1.root.children[0];
      expect(node1.content).toBe('Node A');
      expect((node1 as any).inlineNote).toBe('Note A');

      // Second transform - config should still be the same
      const result2 = transformer.transform('# Test 2\n- Node B:: Note B');
      const node2 = result2.root.children[0];
      expect(node2.content).toBe('Node B');
      expect((node2 as any).inlineNote).toBe('Note B');

      // Verify config is preserved
      expect(transformer.separators.note).toBe('::');
    });
  });
});
