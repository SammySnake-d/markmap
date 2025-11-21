/**
 * Export Markdown Tests
 *
 * Tests for the exportAsMarkdown method that exports node trees to Markdown format.
 *
 * Requirements:
 * - 4.1: Copy node subtree as Markdown to clipboard
 * - 4.2: Preserve hierarchical structure in export
 *
 * @vitest-environment jsdom
 */

import { describe, test, expect } from 'vitest';
import { INode } from 'markmap-common';
import { exportNodeAsMarkdown } from '../src/util';

describe('exportAsMarkdown', () => {
  test('exports simple node without children', () => {
    const node: INode = {
      content: 'Root Node',
      children: [],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };

    const markdown = exportNodeAsMarkdown(node);

    expect(markdown).toBe('- Root Node');
  });

  test('exports node with children preserving hierarchy', () => {
    const node: INode = {
      content: 'Root',
      children: [
        {
          content: 'Child 1',
          children: [],
          state: {
            id: 2,
            depth: 1,
            path: '0.0',
            key: '0.0',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
        {
          content: 'Child 2',
          children: [],
          state: {
            id: 3,
            depth: 1,
            path: '0.1',
            key: '0.1',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
      ],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };

    const markdown = exportNodeAsMarkdown(node);

    const expected = `- Root
  - Child 1
  - Child 2`;

    expect(markdown).toBe(expected);
  });

  test('exports node with inline note', () => {
    const node: INode = {
      content: 'Node with note',
      children: [],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {
        inlineNote: 'This is a note',
      },
    };

    const markdown = exportNodeAsMarkdown(node);

    expect(markdown).toBe('- Node with note: This is a note');
  });

  test('exports node with detailed note', () => {
    const node: INode = {
      content: 'Node with detailed note',
      children: [],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {
        detailedNote: 'This is a detailed note\nWith multiple lines',
      },
    };

    const markdown = exportNodeAsMarkdown(node);

    const expected = `- Node with detailed note
  > This is a detailed note
  > With multiple lines`;

    expect(markdown).toBe(expected);
  });

  test('exports node with both inline and detailed notes', () => {
    const node: INode = {
      content: 'Node with both notes',
      children: [],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {
        inlineNote: 'Short note',
        detailedNote: 'Detailed explanation',
      },
    };

    const markdown = exportNodeAsMarkdown(node);

    const expected = `- Node with both notes: Short note
  > Detailed explanation`;

    expect(markdown).toBe(expected);
  });

  test('exports nested structure with multiple levels', () => {
    const node: INode = {
      content: 'Level 0',
      children: [
        {
          content: 'Level 1-1',
          children: [
            {
              content: 'Level 2-1',
              children: [],
              state: {
                id: 4,
                depth: 2,
                path: '0.0.0',
                key: '0.0.0',
                rect: { x: 0, y: 0, width: 100, height: 50 },
                size: [100, 50],
              },
              payload: {},
            },
          ],
          state: {
            id: 2,
            depth: 1,
            path: '0.0',
            key: '0.0',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
        {
          content: 'Level 1-2',
          children: [],
          state: {
            id: 3,
            depth: 1,
            path: '0.1',
            key: '0.1',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
      ],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };

    const markdown = exportNodeAsMarkdown(node);

    const expected = `- Level 0
  - Level 1-1
    - Level 2-1
  - Level 1-2`;

    expect(markdown).toBe(expected);
  });

  test('exports specific subtree when node is provided', () => {
    const childNode: INode = {
      content: 'Subtree Root',
      children: [
        {
          content: 'Subtree Child',
          children: [],
          state: {
            id: 3,
            depth: 2,
            path: '0.0.0',
            key: '0.0.0',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
      ],
      state: {
        id: 2,
        depth: 1,
        path: '0.0',
        key: '0.0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };

    const markdown = exportNodeAsMarkdown(childNode);

    const expected = `- Subtree Root
  - Subtree Child`;

    expect(markdown).toBe(expected);
  });

  test('handles nodes with escaped colons in content', () => {
    const node: INode = {
      content: 'Time is 12:30',
      children: [],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {
        inlineNote: 'Note with colon: here',
      },
    };

    const markdown = exportNodeAsMarkdown(node);

    // The export should add escape characters before colons when there's an inline note
    expect(markdown).toContain('12\\:30');
    expect(markdown).toContain('colon\\: here');
  });

  test('exports complex tree with mixed content', () => {
    const node: INode = {
      content: 'Project',
      children: [
        {
          content: 'Frontend',
          children: [
            {
              content: 'React',
              children: [],
              state: {
                id: 3,
                depth: 2,
                path: '0.0.0',
                key: '0.0.0',
                rect: { x: 0, y: 0, width: 100, height: 50 },
                size: [100, 50],
              },
              payload: {
                inlineNote: 'UI framework',
              },
            },
            {
              content: 'TypeScript',
              children: [],
              state: {
                id: 4,
                depth: 2,
                path: '0.0.1',
                key: '0.0.1',
                rect: { x: 0, y: 0, width: 100, height: 50 },
                size: [100, 50],
              },
              payload: {
                detailedNote: 'Type-safe JavaScript\nCompiles to JS',
              },
            },
          ],
          state: {
            id: 2,
            depth: 1,
            path: '0.0',
            key: '0.0',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
        {
          content: 'Backend',
          children: [
            {
              content: 'Node.js',
              children: [],
              state: {
                id: 6,
                depth: 2,
                path: '0.1.0',
                key: '0.1.0',
                rect: { x: 0, y: 0, width: 100, height: 50 },
                size: [100, 50],
              },
              payload: {
                inlineNote: 'Runtime',
                detailedNote: 'JavaScript runtime built on V8',
              },
            },
          ],
          state: {
            id: 5,
            depth: 1,
            path: '0.1',
            key: '0.1',
            rect: { x: 0, y: 0, width: 100, height: 50 },
            size: [100, 50],
          },
          payload: {},
        },
      ],
      state: {
        id: 1,
        depth: 0,
        path: '0',
        key: '0',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };

    const markdown = exportNodeAsMarkdown(node);

    const expected = `- Project
  - Frontend
    - React: UI framework
    - TypeScript
      > Type-safe JavaScript
      > Compiles to JS
  - Backend
    - Node.js: Runtime
      > JavaScript runtime built on V8`;

    expect(markdown).toBe(expected);
  });
});
