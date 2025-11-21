import { expect, test, describe } from 'vitest';
import {
  createEnhancedNode,
  isEnhancedNode,
  DEFAULT_SEPARATORS,
} from '../src/enhanced-types';
import type { IPureNode } from 'markmap-common';

describe('Enhanced Node Types', () => {
  test('createEnhancedNode creates node with inline note', () => {
    const baseNode: IPureNode = {
      content: 'Main content',
      children: [],
    };

    const enhanced = createEnhancedNode(baseNode, 'This is an inline note');

    expect(enhanced.content).toBe('Main content');
    expect(enhanced.inlineNote).toBe('This is an inline note');
    expect(enhanced.detailedNote).toBeUndefined();
    expect(enhanced.hasNote).toBe(true);
  });

  test('createEnhancedNode creates node with detailed note', () => {
    const baseNode: IPureNode = {
      content: 'Main content',
      children: [],
    };

    const enhanced = createEnhancedNode(
      baseNode,
      undefined,
      'This is a detailed note\nwith multiple lines',
    );

    expect(enhanced.content).toBe('Main content');
    expect(enhanced.inlineNote).toBeUndefined();
    expect(enhanced.detailedNote).toBe(
      'This is a detailed note\nwith multiple lines',
    );
    expect(enhanced.hasNote).toBe(true);
  });

  test('createEnhancedNode creates node with both note types', () => {
    const baseNode: IPureNode = {
      content: 'Main content',
      children: [],
    };

    const enhanced = createEnhancedNode(
      baseNode,
      'Inline note',
      'Detailed note',
    );

    expect(enhanced.content).toBe('Main content');
    expect(enhanced.inlineNote).toBe('Inline note');
    expect(enhanced.detailedNote).toBe('Detailed note');
    expect(enhanced.hasNote).toBe(true);
  });

  test('createEnhancedNode creates node without notes', () => {
    const baseNode: IPureNode = {
      content: 'Main content',
      children: [],
    };

    const enhanced = createEnhancedNode(baseNode);

    expect(enhanced.content).toBe('Main content');
    expect(enhanced.inlineNote).toBeUndefined();
    expect(enhanced.detailedNote).toBeUndefined();
    expect(enhanced.hasNote).toBe(false);
  });

  test('isEnhancedNode type guard works correctly', () => {
    const baseNode: IPureNode = {
      content: 'Main content',
      children: [],
    };

    const enhancedNode = createEnhancedNode(baseNode, 'Note');

    expect(isEnhancedNode(enhancedNode)).toBe(true);
    expect(isEnhancedNode(baseNode)).toBe(false);
  });

  test('DEFAULT_SEPARATORS has correct values', () => {
    expect(DEFAULT_SEPARATORS.node).toBe('-');
    expect(DEFAULT_SEPARATORS.note).toBe(':');
    expect(DEFAULT_SEPARATORS.noteBlock).toBe('>');
    expect(DEFAULT_SEPARATORS.escape).toBe('\\');
  });

  test('enhanced node preserves children structure', () => {
    const childNode: IPureNode = {
      content: 'Child content',
      children: [],
    };

    const parentNode: IPureNode = {
      content: 'Parent content',
      children: [childNode],
    };

    const enhanced = createEnhancedNode(parentNode, 'Parent note');

    expect(enhanced.children).toHaveLength(1);
    expect(enhanced.children[0].content).toBe('Child content');
  });

  test('enhanced node with payload', () => {
    const baseNode: IPureNode = {
      content: 'Main content',
      payload: {
        fold: 1,
        customData: 'test',
      },
      children: [],
    };

    const enhanced = createEnhancedNode(baseNode, 'Note');

    expect(enhanced.payload).toBeDefined();
    expect(enhanced.payload?.fold).toBe(1);
    expect(enhanced.payload?.customData).toBe('test');
    expect(enhanced.hasNote).toBe(true);
  });
});
