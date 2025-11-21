/**
 * Property-based test for search completeness
 *
 * **Feature: markmap-enhanced, Property 3: 搜索结果完整性**
 * **Validates: Requirements 1.1, 1.2**
 *
 * Property: For any keyword and node tree, all search results should contain
 * the keyword in either content, inline note, or detailed note
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SearchManager } from '../src/search-manager';
import type { INode } from 'markmap-common';

describe('Property 3: Search Result Completeness', () => {
  /**
   * Generator for valid search keywords (alphanumeric, no HTML tags, trimmed)
   */
  const arbValidKeyword = (): fc.Arbitrary<string> => {
    return fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => {
        const trimmed = s.trim();
        // Must have content after trimming
        if (trimmed.length === 0) return false;
        // Must not contain HTML-like characters that would be stripped
        if (trimmed.includes('<') || trimmed.includes('>')) return false;
        // Must contain at least one alphanumeric character
        if (!/[a-zA-Z0-9]/.test(trimmed)) return false;
        return true;
      })
      .map((s) => s.trim()); // Always return trimmed version
  };

  /**
   * Generator for nodes with searchable content
   * Ensures nodes have content, inline notes, or detailed notes
   */
  const arbSearchableNode = (keyword: string): fc.Arbitrary<INode> => {
    return fc.oneof(
      // Node with keyword in content
      fc.record({
        content: fc.constant(`Some text with ${keyword} in it`),
        children: fc.constant([]),
        payload: fc.constant({}),
      }),
      // Node with keyword in inline note
      fc.record({
        content: fc.string({ minLength: 1, maxLength: 50 }),
        children: fc.constant([]),
        payload: fc.record({
          inlineNote: fc.constant(`Note with ${keyword} here`),
        }),
      }),
      // Node with keyword in detailed note
      fc.record({
        content: fc.string({ minLength: 1, maxLength: 50 }),
        children: fc.constant([]),
        payload: fc.record({
          detailedNote: fc.constant(`Detailed note containing ${keyword}`),
        }),
      }),
      // Node with keyword in content (case variations)
      fc.record({
        content: fc.constant(`Text with ${keyword.toUpperCase()} uppercase`),
        children: fc.constant([]),
        payload: fc.constant({}),
      }),
      // Node with keyword in multiple places (should only match once)
      fc.record({
        content: fc.constant(`Content with ${keyword}`),
        children: fc.constant([]),
        payload: fc.record({
          inlineNote: fc.constant(`Also has ${keyword}`),
          detailedNote: fc.constant(`And ${keyword} here too`),
        }),
      }),
    );
  };

  /**
   * Generator for nodes without the keyword
   */
  const arbNonMatchingNode = (keyword: string): fc.Arbitrary<INode> => {
    // Generate strings that don't contain the keyword
    const arbNonMatchingString = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => !s.toLowerCase().includes(keyword.toLowerCase()));

    return fc.record({
      content: arbNonMatchingString,
      children: fc.constant([]),
      payload: fc.record({
        inlineNote: fc.option(arbNonMatchingString, { nil: undefined }),
        detailedNote: fc.option(arbNonMatchingString, { nil: undefined }),
      }),
    });
  };

  /**
   * Generator for mixed node arrays with some matching and some non-matching
   */
  const arbMixedNodes = (keyword: string): fc.Arbitrary<INode[]> => {
    return fc.array(
      fc.oneof(arbSearchableNode(keyword), arbNonMatchingNode(keyword)),
      { minLength: 1, maxLength: 20 },
    );
  };

  it('Property 3: All search results contain the keyword in content, inline note, or detailed note', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        const nodes = fc.sample(arbMixedNodes(keyword), 1)[0];
        const searchManager = new SearchManager();

        // Perform search
        const results = searchManager.search(keyword, nodes);

        // Property: Every result must contain the keyword
        for (const result of results) {
          const normalizedKeyword = keyword.toLowerCase();
          let containsKeyword = false;

          // Check content
          if (result.node.content) {
            const normalizedContent = result.node.content
              .replace(/<[^>]*>/g, '')
              .toLowerCase();
            if (normalizedContent.includes(normalizedKeyword)) {
              containsKeyword = true;
            }
          }

          // Check inline note
          const inlineNote = result.node.payload?.inlineNote as
            | string
            | undefined;
          if (inlineNote && typeof inlineNote === 'string') {
            if (inlineNote.toLowerCase().includes(normalizedKeyword)) {
              containsKeyword = true;
            }
          }

          // Check detailed note
          const detailedNote = result.node.payload?.detailedNote as
            | string
            | undefined;
          if (detailedNote && typeof detailedNote === 'string') {
            if (detailedNote.toLowerCase().includes(normalizedKeyword)) {
              containsKeyword = true;
            }
          }

          // Assert that at least one location contains the keyword
          expect(containsKeyword).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('Property 3a: Search results match type corresponds to actual match location', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        const nodes = fc.sample(arbMixedNodes(keyword), 1)[0];
        const searchManager = new SearchManager();

        // Perform search
        const results = searchManager.search(keyword, nodes);

        // Property: Match type should correspond to where keyword was found
        for (const result of results) {
          const normalizedKeyword = keyword.toLowerCase();

          if (result.matchType === 'content') {
            // Content should contain keyword
            const normalizedContent = result.node.content
              .replace(/<[^>]*>/g, '')
              .toLowerCase();
            expect(normalizedContent.includes(normalizedKeyword)).toBe(true);
          } else if (result.matchType === 'inlineNote') {
            // Inline note should contain keyword
            const inlineNote = result.node.payload?.inlineNote as string;
            expect(inlineNote).toBeDefined();
            expect(inlineNote.toLowerCase().includes(normalizedKeyword)).toBe(
              true,
            );
          } else if (result.matchType === 'detailedNote') {
            // Detailed note should contain keyword
            const detailedNote = result.node.payload?.detailedNote as string;
            expect(detailedNote).toBeDefined();
            expect(detailedNote.toLowerCase().includes(normalizedKeyword)).toBe(
              true,
            );
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('Property 3b: No false positives - nodes without keyword are not in results', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        // Generate only non-matching nodes
        const nodes = fc.sample(
          fc.array(arbNonMatchingNode(keyword), {
            minLength: 1,
            maxLength: 10,
          }),
          1,
        )[0];
        const searchManager = new SearchManager();

        // Verify nodes don't contain keyword (double-check generator)
        const normalizedKeyword = keyword.toLowerCase().trim();
        for (const node of nodes) {
          const contentMatch = node.content
            .toLowerCase()
            .includes(normalizedKeyword);
          const inlineMatch =
            node.payload?.inlineNote &&
            typeof node.payload.inlineNote === 'string' &&
            node.payload.inlineNote.toLowerCase().includes(normalizedKeyword);
          const detailedMatch =
            node.payload?.detailedNote &&
            typeof node.payload.detailedNote === 'string' &&
            node.payload.detailedNote.toLowerCase().includes(normalizedKeyword);

          // If any node contains keyword, skip this test case
          if (contentMatch || inlineMatch || detailedMatch) {
            return true; // Skip this test case
          }
        }

        // Perform search
        const results = searchManager.search(keyword, nodes);

        // Property: Should have no results since no nodes contain keyword
        expect(results.length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it('Property 3c: All matching nodes are found - no false negatives', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        // Generate only matching nodes
        const nodes = fc.sample(
          fc.array(arbSearchableNode(keyword), {
            minLength: 1,
            maxLength: 10,
          }),
          1,
        )[0];
        const searchManager = new SearchManager();

        // Perform search
        const results = searchManager.search(keyword, nodes);

        // Property: Should find all nodes since all contain keyword
        // Note: Some nodes might have keyword in multiple places but only match once
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(nodes.length);

        // Verify each node is in results
        for (const node of nodes) {
          const found = results.some((r) => r.node === node);
          expect(found).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('Property 3d: Search is case-insensitive', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        // Create nodes with different case variations
        const nodes: INode[] = [
          {
            content: `Text with ${keyword.toLowerCase()}`,
            children: [],
            payload: {},
          },
          {
            content: `Text with ${keyword.toUpperCase()}`,
            children: [],
            payload: {},
          },
          {
            content: `Text with ${keyword}`,
            children: [],
            payload: {},
          },
        ];

        const searchManager = new SearchManager();

        // Search with original keyword
        const results = searchManager.search(keyword, nodes);

        // Property: Should find all variations
        expect(results.length).toBe(3);
      }),
      { numRuns: 50 },
    );
  });

  it('Property 3e: Empty or whitespace keywords return no results', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t'),
          fc.constant('\n'),
        ),
        fc.array(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 50 }),
            children: fc.constant([]),
            payload: fc.constant({}),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (emptyKeyword, nodes) => {
          const searchManager = new SearchManager();

          // Search with empty/whitespace keyword
          const results = searchManager.search(emptyKeyword, nodes);

          // Property: Should return no results
          expect(results.length).toBe(0);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('Property 3f: Search results have sequential match indices', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        const nodes = fc.sample(arbMixedNodes(keyword), 1)[0];
        const searchManager = new SearchManager();

        // Perform search
        const results = searchManager.search(keyword, nodes);

        // Property: Match indices should be sequential starting from 0
        if (results.length > 0) {
          for (let i = 0; i < results.length; i++) {
            expect(results[i].matchIndex).toBe(i);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('Property 3g: Content matches take priority over note matches', () => {
    fc.assert(
      fc.property(arbValidKeyword(), (keyword) => {
        // Create a node with keyword in all locations
        const node: INode = {
          content: `Content with ${keyword}`,
          children: [],
          payload: {
            inlineNote: `Note with ${keyword}`,
            detailedNote: `Detailed with ${keyword}`,
          },
        };

        const searchManager = new SearchManager();
        const results = searchManager.search(keyword, [node]);

        // Property: Should only match once, and match type should be 'content'
        expect(results.length).toBe(1);
        expect(results[0].matchType).toBe('content');
      }),
      { numRuns: 100 },
    );
  });

  it('Property 3h: Inline note matches take priority over detailed note matches', () => {
    fc.assert(
      fc.property(
        arbValidKeyword(),
        fc.string({ minLength: 1, maxLength: 50 }),
        (keyword, nonMatchingContent) => {
          // Skip if content accidentally contains keyword
          if (
            nonMatchingContent.toLowerCase().includes(keyword.toLowerCase())
          ) {
            return true;
          }

          // Create a node with keyword only in notes
          const node: INode = {
            content: nonMatchingContent,
            children: [],
            payload: {
              inlineNote: `Note with ${keyword}`,
              detailedNote: `Detailed with ${keyword}`,
            },
          };

          const searchManager = new SearchManager();
          const results = searchManager.search(keyword, [node]);

          // Property: Should match inline note, not detailed note
          expect(results.length).toBe(1);
          expect(results[0].matchType).toBe('inlineNote');
        },
      ),
      { numRuns: 100 },
    );
  });
});
