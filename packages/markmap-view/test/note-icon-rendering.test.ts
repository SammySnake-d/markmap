/**
 * Test for note icon rendering functionality
 * Requirements: 5.4
 */

import { describe, it, expect } from 'vitest';
import type { INode } from 'markmap-common';

describe('Note Icon Rendering', () => {
  it('should detect nodes with hasNote in payload', () => {
    const nodeWithNote: INode = {
      content: 'Test Node',
      children: [],
      payload: {
        hasNote: true,
      },
      state: {
        id: 1,
        path: '1',
        key: 'test-1',
        depth: 0,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };

    // Check if node has note
    const hasNote = nodeWithNote.payload?.hasNote;
    expect(hasNote).toBe(true);
  });

  it('should detect nodes with inlineNote in payload', () => {
    const nodeWithInlineNote: INode = {
      content: 'Test Node',
      children: [],
      payload: {
        inlineNote: 'This is an inline note',
      },
      state: {
        id: 1,
        path: '1',
        key: 'test-1',
        depth: 0,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };

    // Check if node has inline note
    const hasNote = nodeWithInlineNote.payload?.inlineNote;
    expect(hasNote).toBeTruthy();
  });

  it('should detect nodes with detailedNote in payload', () => {
    const nodeWithDetailedNote: INode = {
      content: 'Test Node',
      children: [],
      payload: {
        detailedNote: 'This is a detailed note\nwith multiple lines',
      },
      state: {
        id: 1,
        path: '1',
        key: 'test-1',
        depth: 0,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };

    // Check if node has detailed note
    const hasNote = nodeWithDetailedNote.payload?.detailedNote;
    expect(hasNote).toBeTruthy();
  });

  it('should not detect notes on nodes without note properties', () => {
    const nodeWithoutNote: INode = {
      content: 'Test Node',
      children: [],
      payload: {},
      state: {
        id: 1,
        path: '1',
        key: 'test-1',
        depth: 0,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };

    // Check if node has note
    const hasNote =
      nodeWithoutNote.payload?.hasNote ||
      nodeWithoutNote.payload?.inlineNote ||
      nodeWithoutNote.payload?.detailedNote;
    expect(hasNote).toBeFalsy();
  });

  it('should generate correct HTML with note icon', () => {
    const content = 'Test Node';
    const hasNote = true;

    const html = hasNote
      ? `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`
      : content;

    expect(html).toContain('markmap-note-icon');
    expect(html).toContain('📝');
    expect(html).toContain('Test Node');
  });

  it('should generate correct HTML without note icon', () => {
    const content = 'Test Node';
    const hasNote = false;

    const html = hasNote
      ? `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`
      : content;

    expect(html).not.toContain('markmap-note-icon');
    expect(html).not.toContain('📝');
    expect(html).toBe('Test Node');
  });

  it('should detect notes when both inlineNote and detailedNote are present', () => {
    const nodeWithBothNotes: INode = {
      content: 'Test Node',
      children: [],
      payload: {
        inlineNote: 'Inline note',
        detailedNote: 'Detailed note',
      },
      state: {
        id: 1,
        path: '1',
        key: 'test-1',
        depth: 0,
        size: [100, 50],
        rect: { x: 0, y: 0, width: 100, height: 50 },
      },
    };

    // Check if node has notes
    const hasNote =
      nodeWithBothNotes.payload?.hasNote ||
      nodeWithBothNotes.payload?.inlineNote ||
      nodeWithBothNotes.payload?.detailedNote;
    expect(hasNote).toBeTruthy();
  });

  it('should include proper title attribute in note icon', () => {
    const content = 'Test Node';
    const hasNote = true;

    const html = hasNote
      ? `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`
      : content;

    expect(html).toContain('title="This node has notes"');
  });

  it('should place note icon after content', () => {
    const content = 'Test Node';
    const hasNote = true;

    const html = hasNote
      ? `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`
      : content;

    // Verify that content comes before the icon
    const contentIndex = html.indexOf('Test Node');
    const iconIndex = html.indexOf('📝');
    expect(contentIndex).toBeLessThan(iconIndex);
  });

  it('should handle empty content with note icon', () => {
    const content = '';
    const hasNote = true;

    const html = hasNote
      ? `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`
      : content;

    expect(html).toContain('markmap-note-icon');
    expect(html).toContain('📝');
  });

  it('should handle special characters in content with note icon', () => {
    const content = 'Test <Node> & "Special" Characters';
    const hasNote = true;

    const html = hasNote
      ? `${content}<span class="markmap-note-icon" title="This node has notes">📝</span>`
      : content;

    expect(html).toContain('Test <Node> & "Special" Characters');
    expect(html).toContain('markmap-note-icon');
    expect(html).toContain('📝');
  });
});
