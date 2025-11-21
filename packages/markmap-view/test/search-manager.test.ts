/**
 * Unit tests for SearchManager
 *
 * Requirements:
 * - 1.1: Fuzzy match search in node content and notes
 * - 1.2: Highlight matching nodes
 * - 1.4: Navigate between search results
 * - 1.5: Clear search removes all highlights
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchManager } from '../src/search-manager';
import type { INode } from 'markmap-common';

describe('SearchManager', () => {
  let searchManager: SearchManager;

  // Helper function to create test nodes
  const createTestNode = (
    content: string,
    options: {
      inlineNote?: string;
      detailedNote?: string;
    } = {},
  ): INode => {
    return {
      type: 'heading',
      depth: 1,
      content,
      children: [],
      payload: {
        inlineNote: options.inlineNote,
        detailedNote: options.detailedNote,
      },
    };
  };

  beforeEach(() => {
    searchManager = new SearchManager();
  });

  describe('Initialization', () => {
    it('should initialize with empty results', () => {
      expect(searchManager.getResults()).toEqual([]);
      expect(searchManager.getResultCount()).toBe(0);
      expect(searchManager.getCurrentIndex()).toBe(-1);
    });

    it('should return null for current result when no search performed', () => {
      expect(searchManager.getCurrent()).toBeNull();
    });
  });

  describe('Search in Content (Requirement 1.1)', () => {
    it('should find keyword in node content', () => {
      const nodes = [
        createTestNode('JavaScript Tutorial'),
        createTestNode('Python Guide'),
        createTestNode('Java Basics'),
      ];

      const results = searchManager.search('java', nodes);

      expect(results.length).toBe(2);
      expect(results[0].node.content).toBe('JavaScript Tutorial');
      expect(results[0].matchType).toBe('content');
      expect(results[1].node.content).toBe('Java Basics');
      expect(results[1].matchType).toBe('content');
    });

    it('should perform case-insensitive search', () => {
      const nodes = [
        createTestNode('JavaScript'),
        createTestNode('javascript'),
        createTestNode('JAVASCRIPT'),
      ];

      const results = searchManager.search('JavaScript', nodes);

      expect(results.length).toBe(3);
    });

    it('should handle empty keyword', () => {
      const nodes = [createTestNode('Test')];

      const results = searchManager.search('', nodes);

      expect(results.length).toBe(0);
    });

    it('should handle whitespace-only keyword', () => {
      const nodes = [createTestNode('Test')];

      const results = searchManager.search('   ', nodes);

      expect(results.length).toBe(0);
    });

    it('should trim keyword before searching', () => {
      const nodes = [createTestNode('JavaScript')];

      const results = searchManager.search('  java  ', nodes);

      expect(results.length).toBe(1);
    });

    it('should strip HTML tags from content before searching', () => {
      const nodes = [
        createTestNode('<strong>JavaScript</strong> Tutorial'),
        createTestNode('<em>Python</em> Guide'),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
      expect(results[0].node.content).toBe(
        '<strong>JavaScript</strong> Tutorial',
      );
    });

    it('should handle nodes with no content', () => {
      const nodes = [createTestNode(''), createTestNode('JavaScript')];

      const results = searchManager.search('java', nodes);

      expect(results.length).toBe(1);
    });
  });

  describe('Search in Inline Notes (Requirement 1.1)', () => {
    it('should find keyword in inline notes', () => {
      const nodes = [
        createTestNode('Node 1', { inlineNote: 'JavaScript framework' }),
        createTestNode('Node 2', { inlineNote: 'Python library' }),
        createTestNode('Node 3', { inlineNote: 'Java toolkit' }),
      ];

      const results = searchManager.search('java', nodes);

      expect(results.length).toBe(2);
      expect(results[0].matchType).toBe('inlineNote');
      expect(results[0].matchText).toBe('JavaScript framework');
      expect(results[1].matchType).toBe('inlineNote');
      expect(results[1].matchText).toBe('Java toolkit');
    });

    it('should prioritize content match over note match', () => {
      const nodes = [
        createTestNode('JavaScript', { inlineNote: 'Also has JavaScript' }),
      ];

      const results = searchManager.search('javascript', nodes);

      // Should only match content, not note (since content matched first)
      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('content');
    });

    it('should handle nodes without inline notes', () => {
      const nodes = [
        createTestNode('Node 1'),
        createTestNode('Node 2', { inlineNote: 'JavaScript' }),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('inlineNote');
    });

    it('should handle undefined inline notes', () => {
      const nodes = [
        createTestNode('Node 1', { inlineNote: undefined }),
        createTestNode('Node 2', { inlineNote: 'JavaScript' }),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
    });

    it('should handle non-string inline notes', () => {
      const node: INode = {
        type: 'heading',
        depth: 1,
        content: 'Test',
        children: [],
        payload: {
          inlineNote: 123 as any, // Invalid type
        },
      };

      const results = searchManager.search('123', [node]);

      expect(results.length).toBe(0);
    });
  });

  describe('Search in Detailed Notes (Requirement 1.1)', () => {
    it('should find keyword in detailed notes', () => {
      const nodes = [
        createTestNode('Node 1', {
          detailedNote: 'This is a JavaScript tutorial',
        }),
        createTestNode('Node 2', { detailedNote: 'This is a Python guide' }),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('detailedNote');
      expect(results[0].matchText).toBe('This is a JavaScript tutorial');
    });

    it('should prioritize content and inline note over detailed note', () => {
      const nodes = [
        createTestNode('JavaScript', {
          inlineNote: 'Also JavaScript',
          detailedNote: 'More JavaScript',
        }),
      ];

      const results = searchManager.search('javascript', nodes);

      // Should only match content
      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('content');
    });

    it('should match inline note before detailed note', () => {
      const nodes = [
        createTestNode('Node', {
          inlineNote: 'JavaScript',
          detailedNote: 'Also JavaScript',
        }),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('inlineNote');
    });

    it('should handle nodes without detailed notes', () => {
      const nodes = [
        createTestNode('Node 1'),
        createTestNode('Node 2', { detailedNote: 'JavaScript' }),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('detailedNote');
    });

    it('should handle multiline detailed notes', () => {
      const nodes = [
        createTestNode('Node', {
          detailedNote: 'Line 1\nJavaScript tutorial\nLine 3',
        }),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
      expect(results[0].matchType).toBe('detailedNote');
    });
  });

  describe('Search Results Management', () => {
    it('should assign sequential match indices', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('JavaScript 3'),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results[0].matchIndex).toBe(0);
      expect(results[1].matchIndex).toBe(1);
      expect(results[2].matchIndex).toBe(2);
    });

    it('should set current index to 0 after search with results', () => {
      const nodes = [createTestNode('JavaScript')];

      searchManager.search('javascript', nodes);

      expect(searchManager.getCurrentIndex()).toBe(0);
      expect(searchManager.getCurrent()).not.toBeNull();
    });

    it('should keep current index at -1 when no results', () => {
      const nodes = [createTestNode('Python')];

      searchManager.search('javascript', nodes);

      expect(searchManager.getCurrentIndex()).toBe(-1);
      expect(searchManager.getCurrent()).toBeNull();
    });

    it('should clear previous results on new search', () => {
      const nodes = [createTestNode('JavaScript'), createTestNode('Python')];

      searchManager.search('javascript', nodes);
      expect(searchManager.getResultCount()).toBe(1);

      searchManager.search('python', nodes);
      expect(searchManager.getResultCount()).toBe(1);
      expect(searchManager.getResults()[0].node.content).toBe('Python');
    });

    it('should return all results via getResults', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      const results = searchManager.search('javascript', nodes);
      const storedResults = searchManager.getResults();

      expect(storedResults).toEqual(results);
      expect(storedResults.length).toBe(2);
    });
  });

  describe('Navigation (Requirement 1.4)', () => {
    it('should navigate to next result', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('JavaScript 3'),
      ];

      searchManager.search('javascript', nodes);

      expect(searchManager.getCurrentIndex()).toBe(0);

      const next1 = searchManager.next();
      expect(next1?.node.content).toBe('JavaScript 2');
      expect(searchManager.getCurrentIndex()).toBe(1);

      const next2 = searchManager.next();
      expect(next2?.node.content).toBe('JavaScript 3');
      expect(searchManager.getCurrentIndex()).toBe(2);
    });

    it('should wrap around to first result after last', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      searchManager.search('javascript', nodes);

      searchManager.next(); // Move to index 1
      const wrapped = searchManager.next(); // Should wrap to index 0

      expect(wrapped?.node.content).toBe('JavaScript 1');
      expect(searchManager.getCurrentIndex()).toBe(0);
    });

    it('should navigate to previous result', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('JavaScript 3'),
      ];

      searchManager.search('javascript', nodes);

      // Start at index 0, go to 2, then back
      searchManager.next(); // index 1
      searchManager.next(); // index 2

      const prev1 = searchManager.previous();
      expect(prev1?.node.content).toBe('JavaScript 2');
      expect(searchManager.getCurrentIndex()).toBe(1);

      const prev2 = searchManager.previous();
      expect(prev2?.node.content).toBe('JavaScript 1');
      expect(searchManager.getCurrentIndex()).toBe(0);
    });

    it('should wrap around to last result when going previous from first', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      searchManager.search('javascript', nodes);

      const wrapped = searchManager.previous(); // Should wrap to last

      expect(wrapped?.node.content).toBe('JavaScript 2');
      expect(searchManager.getCurrentIndex()).toBe(1);
    });

    it('should return null when navigating with no results', () => {
      expect(searchManager.next()).toBeNull();
      expect(searchManager.previous()).toBeNull();
    });

    it('should handle navigation with single result', () => {
      const nodes = [createTestNode('JavaScript')];

      searchManager.search('javascript', nodes);

      const next = searchManager.next();
      expect(next?.node.content).toBe('JavaScript');
      expect(searchManager.getCurrentIndex()).toBe(0);

      const prev = searchManager.previous();
      expect(prev?.node.content).toBe('JavaScript');
      expect(searchManager.getCurrentIndex()).toBe(0);
    });

    it('should maintain current result after navigation', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      searchManager.search('javascript', nodes);

      searchManager.next();
      const current = searchManager.getCurrent();

      expect(current?.node.content).toBe('JavaScript 2');
    });
  });

  describe('Highlight Functionality (Requirement 1.2)', () => {
    it('should mark nodes as highlighted', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('Python'),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[1].node.payload?.highlighted).toBe(true);
      expect(nodes[2].payload?.highlighted).toBeFalsy();
    });

    it('should create payload if not exists when highlighting', () => {
      const node: INode = {
        depth: 1,
        content: 'JavaScript',
        children: [],
        payload: undefined,
      };

      const results = searchManager.search('javascript', [node]);
      searchManager.highlight(results);

      expect(node.payload).toBeDefined();
      expect(node.payload?.highlighted).toBe(true);
    });

    it('should highlight empty results without error', () => {
      expect(() => searchManager.highlight([])).not.toThrow();
    });

    it('should preserve other payload properties when highlighting', () => {
      const nodes = [
        createTestNode('JavaScript', {
          inlineNote: 'Test note',
        }),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[0].node.payload?.inlineNote).toBe('Test note');
    });
  });

  describe('Clear Highlight (Requirement 1.5)', () => {
    it('should remove highlight flag from nodes', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      expect(results[0].node.payload?.highlighted).toBe(true);
      expect(results[1].node.payload?.highlighted).toBe(true);

      searchManager.clearHighlight();

      expect(results[0].node.payload?.highlighted).toBe(false);
      expect(results[1].node.payload?.highlighted).toBe(false);
    });

    it('should handle nodes without payload when clearing', () => {
      const nodes = [createTestNode('JavaScript')];

      searchManager.search('javascript', nodes);
      // Don't highlight, just clear
      expect(() => searchManager.clearHighlight()).not.toThrow();
    });

    it('should preserve other payload properties when clearing', () => {
      const nodes = [
        createTestNode('JavaScript', {
          inlineNote: 'Test note',
        }),
      ];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);
      searchManager.clearHighlight();

      expect(results[0].node.payload?.highlighted).toBe(false);
      expect(results[0].node.payload?.inlineNote).toBe('Test note');
    });
  });

  describe('Clear Search (Requirement 1.5)', () => {
    it('should clear all results', () => {
      const nodes = [createTestNode('JavaScript')];

      searchManager.search('javascript', nodes);
      expect(searchManager.getResultCount()).toBe(1);

      searchManager.clear();

      expect(searchManager.getResultCount()).toBe(0);
      expect(searchManager.getResults()).toEqual([]);
    });

    it('should reset current index', () => {
      const nodes = [createTestNode('JavaScript')];

      searchManager.search('javascript', nodes);
      expect(searchManager.getCurrentIndex()).toBe(0);

      searchManager.clear();

      expect(searchManager.getCurrentIndex()).toBe(-1);
      expect(searchManager.getCurrent()).toBeNull();
    });

    it('should clear highlights when clearing search', () => {
      const nodes = [createTestNode('JavaScript')];

      const results = searchManager.search('javascript', nodes);
      searchManager.highlight(results);

      expect(results[0].node.payload?.highlighted).toBe(true);

      searchManager.clear();

      expect(results[0].node.payload?.highlighted).toBe(false);
    });

    it('should allow new search after clear', () => {
      const nodes = [createTestNode('JavaScript'), createTestNode('Python')];

      searchManager.search('javascript', nodes);
      searchManager.clear();

      const results = searchManager.search('python', nodes);

      expect(results.length).toBe(1);
      expect(results[0].node.content).toBe('Python');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty node array', () => {
      const results = searchManager.search('test', []);

      expect(results.length).toBe(0);
    });

    it('should handle special characters in keyword', () => {
      const nodes = [
        createTestNode('C++ Programming'),
        createTestNode('C# Guide'),
      ];

      const results = searchManager.search('c++', nodes);

      expect(results.length).toBe(1);
      expect(results[0].node.content).toBe('C++ Programming');
    });

    it('should handle unicode characters', () => {
      const nodes = [
        createTestNode('JavaScript 教程'),
        createTestNode('Python 指南'),
      ];

      const results = searchManager.search('教程', nodes);

      expect(results.length).toBe(1);
      expect(results[0].node.content).toBe('JavaScript 教程');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000) + 'JavaScript' + 'B'.repeat(10000);
      const nodes = [createTestNode(longContent)];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
    });

    it('should handle partial word matches', () => {
      const nodes = [
        createTestNode('JavaScript'),
        createTestNode('Java'),
        createTestNode('Script'),
      ];

      const results = searchManager.search('java', nodes);

      expect(results.length).toBe(2);
      expect(results[0].node.content).toBe('JavaScript');
      expect(results[1].node.content).toBe('Java');
    });

    it('should handle nodes with complex HTML', () => {
      const nodes = [
        createTestNode(
          '<div><span class="highlight">JavaScript</span> Tutorial</div>',
        ),
      ];

      const results = searchManager.search('javascript', nodes);

      expect(results.length).toBe(1);
    });

    it('should handle nodes with nested children', () => {
      const parent: INode = {
        type: 'heading',
        depth: 1,
        content: 'Parent JavaScript',
        children: [
          {
            type: 'heading',
            depth: 2,
            content: 'Child JavaScript',
            children: [],
            payload: {},
          },
        ],
        payload: {},
      };

      // Search only searches the provided flat array, not nested children
      const results = searchManager.search('javascript', [parent]);

      expect(results.length).toBe(1);
      expect(results[0].node.content).toBe('Parent JavaScript');
    });
  });

  describe('Multiple Search Scenarios', () => {
    it('should handle consecutive searches', () => {
      const nodes = [
        createTestNode('JavaScript Tutorial'),
        createTestNode('Python Guide'),
        createTestNode('Java Basics'),
      ];

      const results1 = searchManager.search('java', nodes);
      expect(results1.length).toBe(2);

      const results2 = searchManager.search('python', nodes);
      expect(results2.length).toBe(1);

      const results3 = searchManager.search('tutorial', nodes);
      expect(results3.length).toBe(1);
    });

    it('should handle search with navigation then new search', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('Python'),
      ];

      searchManager.search('javascript', nodes);
      searchManager.next();
      expect(searchManager.getCurrentIndex()).toBe(1);

      searchManager.search('python', nodes);
      expect(searchManager.getCurrentIndex()).toBe(0);
      expect(searchManager.getCurrent()?.node.content).toBe('Python');
    });
  });

  describe('Result Count', () => {
    it('should return correct result count', () => {
      const nodes = [
        createTestNode('JavaScript 1'),
        createTestNode('JavaScript 2'),
        createTestNode('Python'),
      ];

      searchManager.search('javascript', nodes);

      expect(searchManager.getResultCount()).toBe(2);
    });

    it('should return 0 when no results', () => {
      const nodes = [createTestNode('Python')];

      searchManager.search('javascript', nodes);

      expect(searchManager.getResultCount()).toBe(0);
    });

    it('should update count after clear', () => {
      const nodes = [createTestNode('JavaScript')];

      searchManager.search('javascript', nodes);
      expect(searchManager.getResultCount()).toBe(1);

      searchManager.clear();
      expect(searchManager.getResultCount()).toBe(0);
    });
  });
});
