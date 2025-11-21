/**
 * Property-based tests for note icon rendering
 * Feature: markmap-enhanced, Property 7: 备注图标显示一致性
 * Validates: Requirements 5.4
 *
 * Property 7: For any node with either inline note or detailed note,
 * a note icon should be displayed
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { INode } from 'markmap-common';
import {
  arbNodeWithAtLeastOneNote,
  arbNodeWithoutNote,
  arbNodeContent,
} from './utils/generators';
import { shouldDisplayNoteIcon, renderNodeWithNoteIcon } from './utils/helpers';

describe('Property 7: Note Icon Display Consistency', () => {
  /**
   * Property: For any node with at least one type of note (inline or detailed),
   * the shouldDisplayNoteIcon function should return true
   */
  it('should return true for any node with at least one note', () => {
    fc.assert(
      fc.property(arbNodeWithAtLeastOneNote(), (node) => {
        const hasNote = shouldDisplayNoteIcon(node);
        expect(hasNote).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node without notes,
   * the shouldDisplayNoteIcon function should return false
   */
  it('should return false for any node without notes', () => {
    fc.assert(
      fc.property(arbNodeWithoutNote(), (node) => {
        const hasNote = shouldDisplayNoteIcon(node);
        expect(hasNote).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node with inline note,
   * the rendered HTML should contain the note icon
   */
  it('should include note icon in HTML for any node with inline note', () => {
    fc.assert(
      fc.property(arbNodeContent(), arbNodeContent(), (content, inlineNote) => {
        const node: INode & { inlineNote?: string } = {
          content,
          inlineNote,
          children: [],
          payload: {},
          state: {
            id: 1,
            path: '1',
            key: 'test',
            depth: 0,
            size: [100, 50],
            rect: { x: 0, y: 0, width: 100, height: 50 },
          },
        };

        const hasNote = shouldDisplayNoteIcon(node);
        const html = renderNodeWithNoteIcon(content, hasNote);

        expect(html).toContain('markmap-note-icon');
        expect(html).toContain('📝');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node with detailed note,
   * the rendered HTML should contain the note icon
   */
  it('should include note icon in HTML for any node with detailed note', () => {
    fc.assert(
      fc.property(
        arbNodeContent(),
        arbNodeContent(),
        (content, detailedNote) => {
          const node: INode & { detailedNote?: string } = {
            content,
            detailedNote,
            children: [],
            payload: {},
            state: {
              id: 1,
              path: '1',
              key: 'test',
              depth: 0,
              size: [100, 50],
              rect: { x: 0, y: 0, width: 100, height: 50 },
            },
          };

          const hasNote = shouldDisplayNoteIcon(node);
          const html = renderNodeWithNoteIcon(content, hasNote);

          expect(html).toContain('markmap-note-icon');
          expect(html).toContain('📝');
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node with both inline and detailed notes,
   * the rendered HTML should contain the note icon
   */
  it('should include note icon in HTML for any node with both notes', () => {
    fc.assert(
      fc.property(
        arbNodeContent(),
        arbNodeContent(),
        arbNodeContent(),
        (content, inlineNote, detailedNote) => {
          const node: INode & {
            inlineNote?: string;
            detailedNote?: string;
          } = {
            content,
            inlineNote,
            detailedNote,
            children: [],
            payload: {},
            state: {
              id: 1,
              path: '1',
              key: 'test',
              depth: 0,
              size: [100, 50],
              rect: { x: 0, y: 0, width: 100, height: 50 },
            },
          };

          const hasNote = shouldDisplayNoteIcon(node);
          const html = renderNodeWithNoteIcon(content, hasNote);

          expect(html).toContain('markmap-note-icon');
          expect(html).toContain('📝');
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node without notes,
   * the rendered HTML should NOT contain the note icon
   */
  it('should NOT include note icon in HTML for any node without notes', () => {
    fc.assert(
      fc.property(arbNodeContent(), (content) => {
        const node: INode = {
          content,
          children: [],
          payload: {},
          state: {
            id: 1,
            path: '1',
            key: 'test',
            depth: 0,
            size: [100, 50],
            rect: { x: 0, y: 0, width: 100, height: 50 },
          },
        };

        const hasNote = shouldDisplayNoteIcon(node);
        const html = renderNodeWithNoteIcon(content, hasNote);

        expect(html).not.toContain('markmap-note-icon');
        expect(html).not.toContain('📝');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node, the note icon should appear after the content
   */
  it('should place note icon after content for any node with notes', () => {
    fc.assert(
      fc.property(arbNodeWithAtLeastOneNote(), (node) => {
        const hasNote = shouldDisplayNoteIcon(node);
        const html = renderNodeWithNoteIcon(node.content, hasNote);

        const contentIndex = html.indexOf(node.content);
        const iconIndex = html.indexOf('📝');

        // If content is found and icon is found, content should come first
        if (contentIndex !== -1 && iconIndex !== -1) {
          expect(contentIndex).toBeLessThan(iconIndex);
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For any node with notes, the HTML should contain proper attributes
   */
  it('should include proper attributes in note icon for any node with notes', () => {
    fc.assert(
      fc.property(arbNodeWithAtLeastOneNote(), (node) => {
        const hasNote = shouldDisplayNoteIcon(node);
        const html = renderNodeWithNoteIcon(node.content, hasNote);

        expect(html).toContain('class="markmap-note-icon"');
        expect(html).toContain('title="This node has notes"');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Note icon detection should work with payload.hasNote flag
   */
  it('should detect notes from payload.hasNote for any node', () => {
    fc.assert(
      fc.property(arbNodeContent(), (content) => {
        const nodeWithPayloadFlag: INode = {
          content,
          children: [],
          payload: { hasNote: true },
          state: {
            id: 1,
            path: '1',
            key: 'test',
            depth: 0,
            size: [100, 50],
            rect: { x: 0, y: 0, width: 100, height: 50 },
          },
        };

        const hasNote = shouldDisplayNoteIcon(nodeWithPayloadFlag);
        expect(hasNote).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Note icon detection should work with payload.inlineNote
   */
  it('should detect notes from payload.inlineNote for any node', () => {
    fc.assert(
      fc.property(arbNodeContent(), arbNodeContent(), (content, inlineNote) => {
        const nodeWithPayloadNote: INode = {
          content,
          children: [],
          payload: { inlineNote },
          state: {
            id: 1,
            path: '1',
            key: 'test',
            depth: 0,
            size: [100, 50],
            rect: { x: 0, y: 0, width: 100, height: 50 },
          },
        };

        const hasNote = shouldDisplayNoteIcon(nodeWithPayloadNote);
        expect(hasNote).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Note icon detection should work with payload.detailedNote
   */
  it('should detect notes from payload.detailedNote for any node', () => {
    fc.assert(
      fc.property(
        arbNodeContent(),
        arbNodeContent(),
        (content, detailedNote) => {
          const nodeWithPayloadNote: INode = {
            content,
            children: [],
            payload: { detailedNote },
            state: {
              id: 1,
              path: '1',
              key: 'test',
              depth: 0,
              size: [100, 50],
              rect: { x: 0, y: 0, width: 100, height: 50 },
            },
          };

          const hasNote = shouldDisplayNoteIcon(nodeWithPayloadNote);
          expect(hasNote).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
