import { describe, it, expect } from 'vitest';
import { Transformer } from '../src/transform';

describe('Separator Configuration Usage Examples', () => {
  it('should work with default separators', () => {
    const transformer = new Transformer();
    const markdown = `# Root
- Node 1: This is an inline note
  > This is a detailed note
- Node 2`;

    const result = transformer.transform(markdown);
    expect(result.root).toBeDefined();
    expect(result.root.children.length).toBeGreaterThan(0);
  });

  it('should work with custom note separator', () => {
    // Use :: instead of : for inline notes
    const transformer = new Transformer(undefined, {
      separators: {
        note: '::',
      },
    });

    const markdown = `# Root
- Node 1:: This is an inline note with custom separator
- Node 2: This is not a note (single colon)`;

    const result = transformer.transform(markdown);
    expect(result.root).toBeDefined();
    expect(transformer.separators.note).toBe('::');
  });

  it('should work with custom note block marker', () => {
    // Use >> instead of > for detailed notes
    const transformer = new Transformer(undefined, {
      separators: {
        noteBlock: '>>',
      },
    });

    const markdown = `# Root
- Node 1
  >> This is a detailed note with custom marker
  > This is a regular blockquote, not a note`;

    const result = transformer.transform(markdown);
    expect(result.root).toBeDefined();
    expect(transformer.separators.noteBlock).toBe('>>');
  });

  it('should work with custom escape character', () => {
    // Use ^ instead of \ for escaping
    const transformer = new Transformer(undefined, {
      separators: {
        escape: '^',
      },
    });

    const markdown = `# Root
- Node 1^: Content with escaped colon
- Node 2: Normal note`;

    const result = transformer.transform(markdown);
    expect(result.root).toBeDefined();
    expect(transformer.separators.escape).toBe('^');
  });

  it('should work with all custom separators', () => {
    const transformer = new Transformer(undefined, {
      separators: {
        node: '+',
        note: '::',
        noteBlock: '>>',
        escape: '^^',
      },
    });

    const markdown = `# Root
+ Node 1:: Inline note with custom separator
  >> Detailed note with custom marker
+ Node 2^^:: Content with escaped separator`;

    const result = transformer.transform(markdown);
    expect(result.root).toBeDefined();
    expect(transformer.separators.node).toBe('+');
    expect(transformer.separators.note).toBe('::');
    expect(transformer.separators.noteBlock).toBe('>>');
    expect(transformer.separators.escape).toBe('^^');
  });

  it('should maintain separator config across multiple transforms', () => {
    const transformer = new Transformer(undefined, {
      separators: {
        note: '|',
        noteBlock: '>>>',
      },
    });

    // First transform
    const result1 = transformer.transform('# Test 1\n- Node A| Note A');
    expect(result1.root).toBeDefined();

    // Second transform - config should still be the same
    const result2 = transformer.transform('# Test 2\n- Node B| Note B');
    expect(result2.root).toBeDefined();

    // Verify config is preserved
    expect(transformer.separators.note).toBe('|');
    expect(transformer.separators.noteBlock).toBe('>>>');
  });

  it('should allow creating multiple transformers with different configs', () => {
    const transformer1 = new Transformer(undefined, {
      separators: { note: '::' },
    });

    const transformer2 = new Transformer(undefined, {
      separators: { note: '|' },
    });

    expect(transformer1.separators.note).toBe('::');
    expect(transformer2.separators.note).toBe('|');

    // They should be independent
    const result1 = transformer1.transform('# Test\n- Node:: Note');
    const result2 = transformer2.transform('# Test\n- Node| Note');

    expect(result1.root).toBeDefined();
    expect(result2.root).toBeDefined();
  });
});
