/**
 * Example property-based test to verify fast-check setup
 * This test demonstrates the basic usage of the test utilities
 */

import fc from 'fast-check';
import { expect, test } from 'vitest';
import { Transformer } from '../src/index';
import {
  arbMarkdownText,
  arbSimpleMarkdownList,
  countNodes,
  normalizeWhitespace,
} from './utils';

test('Example: fast-check is properly configured', () => {
  // Simple property: any string normalized twice equals normalizing once (idempotence)
  fc.assert(
    fc.property(arbMarkdownText(), (text) => {
      const once = normalizeWhitespace(text);
      const twice = normalizeWhitespace(once);
      expect(twice).toBe(once);
    }),
    { numRuns: 100 },
  );
});

test('Example: Transformer can parse any valid markdown list', () => {
  const transformer = new Transformer();

  fc.assert(
    fc.property(arbSimpleMarkdownList(), (markdown) => {
      // Property: parsing should not throw errors for valid markdown
      expect(() => {
        const result = transformer.transform(markdown);
        // Should produce a root node
        expect(result.root).toBeDefined();
        // Should have at least one child (the list items)
        expect(countNodes(result.root)).toBeGreaterThan(0);
      }).not.toThrow();
    }),
    { numRuns: 50 }, // Fewer runs for this example
  );
});

test('Example: Parsing always produces a result with root and features', () => {
  const transformer = new Transformer();

  fc.assert(
    fc.property(arbSimpleMarkdownList(), (markdown) => {
      const result = transformer.transform(markdown);

      // Property: parsing should always produce a result object
      expect(result).toBeDefined();

      // Property: result should have a root node
      expect(result.root).toBeDefined();

      // Property: result should have features object
      expect(result.features).toBeDefined();
      expect(typeof result.features).toBe('object');
    }),
    { numRuns: 50 },
  );
});
