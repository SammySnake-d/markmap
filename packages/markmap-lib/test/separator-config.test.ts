import { describe, it, expect } from 'vitest';
import { Transformer } from '../src/transform';
import { DEFAULT_SEPARATORS } from '../src/enhanced-types';

describe('Separator Configuration', () => {
  it('should use default separators when no options provided', () => {
    const transformer = new Transformer();

    expect(transformer.separators).toEqual(DEFAULT_SEPARATORS);
  });

  it('should accept custom separator configuration', () => {
    const customSeparators = {
      note: '::',
      noteBlock: '>>',
      escape: '\\\\',
    };

    const transformer = new Transformer(undefined, {
      separators: customSeparators,
    });

    expect(transformer.separators.note).toBe('::');
    expect(transformer.separators.noteBlock).toBe('>>');
    expect(transformer.separators.escape).toBe('\\\\');
    // Should still have default for node separator
    expect(transformer.separators.node).toBe(DEFAULT_SEPARATORS.node);
  });

  it('should merge custom separators with defaults', () => {
    const transformer = new Transformer(undefined, {
      separators: {
        note: '|',
      },
    });

    expect(transformer.separators.note).toBe('|');
    expect(transformer.separators.noteBlock).toBe(DEFAULT_SEPARATORS.noteBlock);
    expect(transformer.separators.escape).toBe(DEFAULT_SEPARATORS.escape);
    expect(transformer.separators.node).toBe(DEFAULT_SEPARATORS.node);
  });

  it('should allow all separators to be customized', () => {
    const allCustom = {
      node: '+',
      note: '::',
      noteBlock: '>>',
      escape: '^^',
    };

    const transformer = new Transformer(undefined, {
      separators: allCustom,
    });

    expect(transformer.separators).toEqual(allCustom);
  });

  it('should preserve separator configuration across multiple transforms', () => {
    const customSeparators = {
      note: '::',
    };

    const transformer = new Transformer(undefined, {
      separators: customSeparators,
    });

    // Transform some content
    transformer.transform('# Test\n- Node 1');

    // Separator config should still be the same
    expect(transformer.separators.note).toBe('::');
    expect(transformer.separators.noteBlock).toBe(DEFAULT_SEPARATORS.noteBlock);
  });

  it('should handle empty separator configuration object', () => {
    const transformer = new Transformer(undefined, {
      separators: {},
    });

    // Should use all defaults
    expect(transformer.separators).toEqual(DEFAULT_SEPARATORS);
  });

  it('should handle undefined separators in options', () => {
    const transformer = new Transformer(undefined, {});

    // Should use all defaults
    expect(transformer.separators).toEqual(DEFAULT_SEPARATORS);
  });

  it('should allow special characters as separators', () => {
    const specialSeparators = {
      note: '||',
      noteBlock: '##',
      escape: '@@',
    };

    const transformer = new Transformer(undefined, {
      separators: specialSeparators,
    });

    expect(transformer.separators.note).toBe('||');
    expect(transformer.separators.noteBlock).toBe('##');
    expect(transformer.separators.escape).toBe('@@');
  });

  it('should handle single character custom separators', () => {
    const singleCharSeparators = {
      note: '|',
      noteBlock: '#',
      escape: '@',
    };

    const transformer = new Transformer(undefined, {
      separators: singleCharSeparators,
    });

    expect(transformer.separators.note).toBe('|');
    expect(transformer.separators.noteBlock).toBe('#');
    expect(transformer.separators.escape).toBe('@');
  });

  it('should maintain separator immutability after initialization', () => {
    const customSeparators = {
      note: '::',
    };

    const transformer = new Transformer(undefined, {
      separators: customSeparators,
    });

    const originalNote = transformer.separators.note;

    // Attempt to modify (this shouldn't affect the transformer)
    customSeparators.note = '|||';

    // Transformer should still have the original value
    expect(transformer.separators.note).toBe(originalNote);
  });

  it('should support multiple transformers with different separator configs', () => {
    const transformer1 = new Transformer(undefined, {
      separators: { note: '::' },
    });

    const transformer2 = new Transformer(undefined, {
      separators: { note: '||' },
    });

    // Each transformer should maintain its own config
    expect(transformer1.separators.note).toBe('::');
    expect(transformer2.separators.note).toBe('||');
  });
});
