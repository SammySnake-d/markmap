/**
 * Unit tests for UndoManager
 *
 * Requirements:
 * - 5.9: Support undo/redo for note editing
 * - 12.1: Record each modification to history stack
 * - 12.2: Undo most recent edit with Cmd+Z / Ctrl+Z
 * - 12.3: Redo last undone operation with Cmd+Shift+Z / Ctrl+Y
 * - 12.4: Update mindmap display and underlying Markdown data
 * - 12.5: Ignore undo command when no operations to undo
 * - 12.6: Ignore redo command when no operations to redo
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UndoManager } from '../src/undo-manager';
import type { IEnhancedNode } from 'markmap-lib';
import type { HistoryEntry } from '../src/undo-manager';

describe('UndoManager', () => {
  let undoManager: UndoManager;

  // Helper function to create test nodes
  const createTestNode = (
    options: {
      content?: string;
      inlineNote?: string;
      detailedNote?: string;
      fold?: number;
    } = {},
  ): IEnhancedNode => {
    const { content = 'Test Node', inlineNote, detailedNote, fold } = options;
    return {
      content,
      inlineNote,
      detailedNote,
      hasNote: !!(inlineNote || detailedNote),
      children: [],
      payload: fold !== undefined ? { fold } : {},
      state: undefined,
    };
  };

  // Helper function to create history entry
  const createHistoryEntry = (
    node: IEnhancedNode,
    action: 'edit' | 'expand' | 'collapse',
    before: any,
    after: any,
  ): HistoryEntry => {
    return {
      action,
      node,
      before,
      after,
      timestamp: Date.now(),
    };
  };

  beforeEach(() => {
    undoManager = new UndoManager();
  });

  describe('Initialization', () => {
    it('should initialize with empty stacks', () => {
      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getUndoStackSize()).toBe(0);
      expect(undoManager.getRedoStackSize()).toBe(0);
    });

    it('should initialize with default max stack size of 50', () => {
      expect(undoManager.getMaxStackSize()).toBe(50);
    });

    it('should initialize with custom max stack size', () => {
      const customManager = new UndoManager(100);
      expect(customManager.getMaxStackSize()).toBe(100);
    });
  });

  describe('Recording Actions (Requirement 12.1)', () => {
    it('should record an edit action', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      undoManager.record(entry);

      expect(undoManager.canUndo()).toBe(true);
      expect(undoManager.getUndoStackSize()).toBe(1);
    });

    it('should record multiple actions', () => {
      const node = createTestNode();

      for (let i = 0; i < 5; i++) {
        const entry = createHistoryEntry(
          node,
          'edit',
          { inlineNote: `Note ${i}` },
          { inlineNote: `Note ${i + 1}` },
        );
        undoManager.record(entry);
      }

      expect(undoManager.getUndoStackSize()).toBe(5);
    });

    it('should clear redo stack when new action is recorded', () => {
      const node = createTestNode({ inlineNote: 'Original' });

      // Record and undo an action
      const entry1 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );
      undoManager.record(entry1);
      undoManager.undo();

      expect(undoManager.canRedo()).toBe(true);

      // Record a new action
      const entry2 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Updated' },
        { inlineNote: 'New Update' },
      );
      undoManager.record(entry2);

      // Redo stack should be cleared
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getRedoStackSize()).toBe(0);
    });

    it('should limit stack size to max', () => {
      const smallManager = new UndoManager(3);
      const node = createTestNode();

      // Record 5 actions (more than max)
      for (let i = 0; i < 5; i++) {
        const entry = createHistoryEntry(
          node,
          'edit',
          { inlineNote: `Note ${i}` },
          { inlineNote: `Note ${i + 1}` },
        );
        smallManager.record(entry);
      }

      // Should only keep the last 3
      expect(smallManager.getUndoStackSize()).toBe(3);
    });

    it('should record expand action', () => {
      const node = createTestNode({ fold: 1 });
      const entry = createHistoryEntry(
        node,
        'expand',
        { fold: 1 },
        { fold: 0 },
      );

      undoManager.record(entry);

      expect(undoManager.canUndo()).toBe(true);
      expect(undoManager.peekUndo()?.action).toBe('expand');
    });

    it('should record collapse action', () => {
      const node = createTestNode({ fold: 0 });
      const entry = createHistoryEntry(
        node,
        'collapse',
        { fold: 0 },
        { fold: 1 },
      );

      undoManager.record(entry);

      expect(undoManager.canUndo()).toBe(true);
      expect(undoManager.peekUndo()?.action).toBe('collapse');
    });
  });

  describe('Undo Operation (Requirement 12.2)', () => {
    it('should undo an edit action', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      // Apply the change
      node.inlineNote = 'Updated';

      undoManager.record(entry);
      const undoneEntry = undoManager.undo();

      expect(undoneEntry).toBe(entry);
      expect(node.inlineNote).toBe('Original');
    });

    it('should move undone action to redo stack', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      undoManager.record(entry);
      undoManager.undo();

      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(true);
      expect(undoManager.getRedoStackSize()).toBe(1);
    });

    it('should return null when nothing to undo (Requirement 12.5)', () => {
      const result = undoManager.undo();
      expect(result).toBeNull();
    });

    it('should undo multiple actions in reverse order', () => {
      const node = createTestNode({ inlineNote: 'Original' });

      // Record three changes
      const entry1 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Update 1' },
      );
      const entry2 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Update 1' },
        { inlineNote: 'Update 2' },
      );
      const entry3 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Update 2' },
        { inlineNote: 'Update 3' },
      );

      node.inlineNote = 'Update 3';

      undoManager.record(entry1);
      undoManager.record(entry2);
      undoManager.record(entry3);

      // Undo in reverse order
      undoManager.undo();
      expect(node.inlineNote).toBe('Update 2');

      undoManager.undo();
      expect(node.inlineNote).toBe('Update 1');

      undoManager.undo();
      expect(node.inlineNote).toBe('Original');
    });

    it('should undo detailed note changes', () => {
      const node = createTestNode({ detailedNote: 'Original detailed' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { detailedNote: 'Original detailed' },
        { detailedNote: 'Updated detailed' },
      );

      node.detailedNote = 'Updated detailed';

      undoManager.record(entry);
      undoManager.undo();

      expect(node.detailedNote).toBe('Original detailed');
    });

    it('should undo both inline and detailed note changes', () => {
      const node = createTestNode({
        inlineNote: 'Original inline',
        detailedNote: 'Original detailed',
      });
      const entry = createHistoryEntry(
        node,
        'edit',
        {
          inlineNote: 'Original inline',
          detailedNote: 'Original detailed',
        },
        {
          inlineNote: 'Updated inline',
          detailedNote: 'Updated detailed',
        },
      );

      node.inlineNote = 'Updated inline';
      node.detailedNote = 'Updated detailed';

      undoManager.record(entry);
      undoManager.undo();

      expect(node.inlineNote).toBe('Original inline');
      expect(node.detailedNote).toBe('Original detailed');
    });

    it('should undo expand action', () => {
      const node = createTestNode({ fold: 0 });
      const entry = createHistoryEntry(
        node,
        'expand',
        { fold: 1 },
        { fold: 0 },
      );

      undoManager.record(entry);
      undoManager.undo();

      expect(node.payload.fold).toBe(1);
    });

    it('should undo collapse action', () => {
      const node = createTestNode({ fold: 1 });
      const entry = createHistoryEntry(
        node,
        'collapse',
        { fold: 0 },
        { fold: 1 },
      );

      undoManager.record(entry);
      undoManager.undo();

      expect(node.payload.fold).toBe(0);
    });
  });

  describe('Redo Operation (Requirement 12.3)', () => {
    it('should redo an undone action', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      node.inlineNote = 'Updated';

      undoManager.record(entry);
      undoManager.undo();

      expect(node.inlineNote).toBe('Original');

      undoManager.redo();

      expect(node.inlineNote).toBe('Updated');
    });

    it('should move redone action back to undo stack', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      undoManager.record(entry);
      undoManager.undo();
      undoManager.redo();

      expect(undoManager.canUndo()).toBe(true);
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getUndoStackSize()).toBe(1);
    });

    it('should return null when nothing to redo (Requirement 12.6)', () => {
      const result = undoManager.redo();
      expect(result).toBeNull();
    });

    it('should redo multiple actions in order', () => {
      const node = createTestNode({ inlineNote: 'Original' });

      // Record and undo three changes
      const entry1 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Update 1' },
      );
      const entry2 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Update 1' },
        { inlineNote: 'Update 2' },
      );
      const entry3 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Update 2' },
        { inlineNote: 'Update 3' },
      );

      undoManager.record(entry1);
      undoManager.record(entry2);
      undoManager.record(entry3);

      undoManager.undo();
      undoManager.undo();
      undoManager.undo();

      expect(node.inlineNote).toBe('Original');

      // Redo in order
      undoManager.redo();
      expect(node.inlineNote).toBe('Update 1');

      undoManager.redo();
      expect(node.inlineNote).toBe('Update 2');

      undoManager.redo();
      expect(node.inlineNote).toBe('Update 3');
    });
  });

  describe('Undo/Redo Round-trip (Requirement 12.4)', () => {
    it('should restore state after undo then redo', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      node.inlineNote = 'Updated';

      undoManager.record(entry);

      // Undo then redo
      undoManager.undo();
      undoManager.redo();

      expect(node.inlineNote).toBe('Updated');
    });

    it('should handle multiple undo/redo cycles', () => {
      const node = createTestNode({ inlineNote: 'Original' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original' },
        { inlineNote: 'Updated' },
      );

      node.inlineNote = 'Updated';

      undoManager.record(entry);

      // Multiple cycles
      for (let i = 0; i < 3; i++) {
        undoManager.undo();
        expect(node.inlineNote).toBe('Original');

        undoManager.redo();
        expect(node.inlineNote).toBe('Updated');
      }
    });
  });

  describe('Stack Management', () => {
    it('should report correct canUndo status', () => {
      const node = createTestNode();
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Before' },
        { inlineNote: 'After' },
      );

      expect(undoManager.canUndo()).toBe(false);

      undoManager.record(entry);
      expect(undoManager.canUndo()).toBe(true);

      undoManager.undo();
      expect(undoManager.canUndo()).toBe(false);
    });

    it('should report correct canRedo status', () => {
      const node = createTestNode();
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Before' },
        { inlineNote: 'After' },
      );

      expect(undoManager.canRedo()).toBe(false);

      undoManager.record(entry);
      expect(undoManager.canRedo()).toBe(false);

      undoManager.undo();
      expect(undoManager.canRedo()).toBe(true);

      undoManager.redo();
      expect(undoManager.canRedo()).toBe(false);
    });

    it('should peek at undo stack without removing entry', () => {
      const node = createTestNode();
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Before' },
        { inlineNote: 'After' },
      );

      undoManager.record(entry);

      const peeked = undoManager.peekUndo();
      expect(peeked).toBe(entry);
      expect(undoManager.getUndoStackSize()).toBe(1);
    });

    it('should peek at redo stack without removing entry', () => {
      const node = createTestNode();
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Before' },
        { inlineNote: 'After' },
      );

      undoManager.record(entry);
      undoManager.undo();

      const peeked = undoManager.peekRedo();
      expect(peeked).toBe(entry);
      expect(undoManager.getRedoStackSize()).toBe(1);
    });

    it('should return null when peeking empty undo stack', () => {
      expect(undoManager.peekUndo()).toBeNull();
    });

    it('should return null when peeking empty redo stack', () => {
      expect(undoManager.peekRedo()).toBeNull();
    });

    it('should clear both stacks', () => {
      const node = createTestNode();
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Before' },
        { inlineNote: 'After' },
      );

      undoManager.record(entry);
      undoManager.undo();

      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(true);

      undoManager.clear();

      expect(undoManager.canUndo()).toBe(false);
      expect(undoManager.canRedo()).toBe(false);
      expect(undoManager.getUndoStackSize()).toBe(0);
      expect(undoManager.getRedoStackSize()).toBe(0);
    });

    it('should update max stack size', () => {
      undoManager.setMaxStackSize(10);
      expect(undoManager.getMaxStackSize()).toBe(10);
    });

    it('should trim stacks when reducing max size', () => {
      const node = createTestNode();

      // Add 5 entries
      for (let i = 0; i < 5; i++) {
        const entry = createHistoryEntry(
          node,
          'edit',
          { inlineNote: `Note ${i}` },
          { inlineNote: `Note ${i + 1}` },
        );
        undoManager.record(entry);
      }

      expect(undoManager.getUndoStackSize()).toBe(5);

      // Reduce max size to 3
      undoManager.setMaxStackSize(3);

      expect(undoManager.getUndoStackSize()).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined note values', () => {
      const node = createTestNode();
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: undefined },
        { inlineNote: 'New note' },
      );

      undoManager.record(entry);
      undoManager.undo();

      expect(node.inlineNote).toBeUndefined();
    });

    it('should handle empty string notes', () => {
      const node = createTestNode({ inlineNote: '' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: '' },
        { inlineNote: 'New note' },
      );

      node.inlineNote = 'New note';

      undoManager.record(entry);
      undoManager.undo();

      expect(node.inlineNote).toBe('');
    });

    it('should handle very long notes', () => {
      const longNote = 'A'.repeat(10000);
      const node = createTestNode({ inlineNote: 'Short' });
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Short' },
        { inlineNote: longNote },
      );

      node.inlineNote = longNote;

      undoManager.record(entry);
      undoManager.undo();

      expect(node.inlineNote).toBe('Short');
    });

    it('should handle nodes without payload', () => {
      const node = createTestNode();
      delete node.payload;

      const entry = createHistoryEntry(
        node,
        'expand',
        { fold: 1 },
        { fold: 0 },
      );

      undoManager.record(entry);
      undoManager.undo();

      expect(node.payload).toBeDefined();
      expect(node.payload.fold).toBe(1);
    });

    it('should handle partial state updates', () => {
      const node = createTestNode({
        inlineNote: 'Original inline',
        detailedNote: 'Original detailed',
      });

      // Only update inline note
      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Original inline' },
        { inlineNote: 'Updated inline' },
      );

      node.inlineNote = 'Updated inline';

      undoManager.record(entry);
      undoManager.undo();

      expect(node.inlineNote).toBe('Original inline');
      expect(node.detailedNote).toBe('Original detailed'); // Should remain unchanged
    });
  });

  describe('Multiple Nodes', () => {
    it('should handle actions on different nodes', () => {
      const node1 = createTestNode({ inlineNote: 'Node 1' });
      const node2 = createTestNode({ inlineNote: 'Node 2' });

      const entry1 = createHistoryEntry(
        node1,
        'edit',
        { inlineNote: 'Node 1' },
        { inlineNote: 'Node 1 Updated' },
      );
      const entry2 = createHistoryEntry(
        node2,
        'edit',
        { inlineNote: 'Node 2' },
        { inlineNote: 'Node 2 Updated' },
      );

      node1.inlineNote = 'Node 1 Updated';
      node2.inlineNote = 'Node 2 Updated';

      undoManager.record(entry1);
      undoManager.record(entry2);

      // Undo in reverse order
      undoManager.undo();
      expect(node2.inlineNote).toBe('Node 2');
      expect(node1.inlineNote).toBe('Node 1 Updated');

      undoManager.undo();
      expect(node1.inlineNote).toBe('Node 1');
    });

    it('should maintain separate history for each node', () => {
      const node1 = createTestNode({ inlineNote: 'Node 1' });
      const node2 = createTestNode({ inlineNote: 'Node 2' });

      const entry1 = createHistoryEntry(
        node1,
        'edit',
        { inlineNote: 'Node 1' },
        { inlineNote: 'Node 1 Updated' },
      );
      const entry2 = createHistoryEntry(
        node2,
        'edit',
        { inlineNote: 'Node 2' },
        { inlineNote: 'Node 2 Updated' },
      );

      node1.inlineNote = 'Node 1 Updated';
      node2.inlineNote = 'Node 2 Updated';

      undoManager.record(entry1);
      undoManager.record(entry2);

      expect(undoManager.getUndoStackSize()).toBe(2);

      // Undo both
      undoManager.undo();
      undoManager.undo();

      expect(node1.inlineNote).toBe('Node 1');
      expect(node2.inlineNote).toBe('Node 2');
    });
  });

  describe('Timestamp', () => {
    it('should record timestamp for each entry', () => {
      const node = createTestNode();
      const beforeTime = Date.now();

      const entry = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'Before' },
        { inlineNote: 'After' },
      );

      undoManager.record(entry);

      const afterTime = Date.now();
      const recorded = undoManager.peekUndo();

      expect(recorded?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(recorded?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should maintain chronological order of timestamps', () => {
      const node = createTestNode();

      const entry1 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'V1' },
        { inlineNote: 'V2' },
      );
      undoManager.record(entry1);

      // Small delay to ensure different timestamps
      const entry2 = createHistoryEntry(
        node,
        'edit',
        { inlineNote: 'V2' },
        { inlineNote: 'V3' },
      );
      undoManager.record(entry2);

      const second = undoManager.peekUndo();
      undoManager.undo();
      const first = undoManager.peekUndo();

      expect(first?.timestamp).toBeLessThanOrEqual(second!.timestamp);
    });
  });
});

/**
 * Property-Based Tests for UndoManager
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs, providing stronger correctness guarantees than
 * example-based unit tests.
 */
import fc from 'fast-check';

describe('UndoManager - Property-Based Tests', () => {
  /**
   * Property 10: 撤销操作可逆性
   * Feature: markmap-enhanced, Property 10: 撤销操作可逆性
   *
   * For any edit operation, performing undo then redo should restore
   * the state to after the edit.
   *
   * Validates: Requirements 12.2, 12.3, 12.4
   */
  describe('Property 10: Undo Operation Reversibility', () => {
    // Generator for random note content (can be undefined, empty, or non-empty string)
    const arbNoteContent = fc.oneof(
      fc.constant(undefined),
      fc.constant(''),
      fc.string({ minLength: 1, maxLength: 100 }),
    );

    // Generator for random fold state
    const arbFoldState = fc.oneof(
      fc.constant(undefined),
      fc.integer({ min: 0, max: 2 }),
    );

    // Generator for action type
    const arbActionType = fc.constantFrom(
      'edit',
      'expand',
      'collapse',
    ) as fc.Arbitrary<'edit' | 'expand' | 'collapse'>;

    // Generator for node state (before or after)
    const arbNodeState = fc.record({
      inlineNote: arbNoteContent,
      detailedNote: arbNoteContent,
      fold: arbFoldState,
    });

    // Helper to create a test node with given state
    const createNodeWithState = (state: {
      inlineNote?: string;
      detailedNote?: string;
      fold?: number;
    }): IEnhancedNode => {
      return {
        content: 'Test Node',
        inlineNote: state.inlineNote,
        detailedNote: state.detailedNote,
        hasNote: !!(state.inlineNote || state.detailedNote),
        children: [],
        payload: state.fold !== undefined ? { fold: state.fold } : {},
        state: {
          id: 1,
          path: '0',
          key: 'test',
          depth: 0,
          size: [100, 50],
          rect: { x: 0, y: 0, width: 100, height: 50 },
        },
      };
    };

    // Helper to clone node state
    const cloneNodeState = (node: IEnhancedNode) => ({
      inlineNote: node.inlineNote,
      detailedNote: node.detailedNote,
      fold: node.payload?.fold,
    });

    // Helper to check if two states are equal
    const statesEqual = (
      state1: { inlineNote?: string; detailedNote?: string; fold?: number },
      state2: { inlineNote?: string; detailedNote?: string; fold?: number },
    ): boolean => {
      return (
        state1.inlineNote === state2.inlineNote &&
        state1.detailedNote === state2.detailedNote &&
        state1.fold === state2.fold
      );
    };

    it('Property 10: Undo then redo restores the after state', () => {
      fc.assert(
        fc.property(
          arbActionType,
          arbNodeState,
          arbNodeState,
          (actionType, beforeState, afterState) => {
            // Create a fresh undo manager for each test
            const manager = new UndoManager();

            // Create a node and apply the "after" state
            const node = createNodeWithState(afterState);

            // Create history entry
            const entry: HistoryEntry = {
              action: actionType,
              node,
              before: beforeState,
              after: afterState,
              timestamp: Date.now(),
            };

            // Record the action
            manager.record(entry);

            // Perform undo - should restore "before" state
            manager.undo();

            // Perform redo - should restore "after" state
            manager.redo();
            const stateAfterRedo = cloneNodeState(node);

            // Property: After undo then redo, state should equal the "after" state
            expect(statesEqual(stateAfterRedo, afterState)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('Property 10: Multiple undo/redo cycles maintain consistency', () => {
      fc.assert(
        fc.property(
          arbActionType,
          arbNodeState,
          arbNodeState,
          fc.integer({ min: 1, max: 5 }),
          (actionType, beforeState, afterState, cycles) => {
            const manager = new UndoManager();
            const node = createNodeWithState(afterState);

            const entry: HistoryEntry = {
              action: actionType,
              node,
              before: beforeState,
              after: afterState,
              timestamp: Date.now(),
            };

            manager.record(entry);

            // Perform multiple undo/redo cycles
            for (let i = 0; i < cycles; i++) {
              manager.undo();
              manager.redo();
            }

            const finalState = cloneNodeState(node);

            // Property: After any number of undo/redo cycles, state should equal "after" state
            expect(statesEqual(finalState, afterState)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('Property 10: Undo restores the before state', () => {
      fc.assert(
        fc.property(
          arbActionType,
          arbNodeState,
          arbNodeState,
          (actionType, beforeState, afterState) => {
            const manager = new UndoManager();
            const node = createNodeWithState(afterState);

            const entry: HistoryEntry = {
              action: actionType,
              node,
              before: beforeState,
              after: afterState,
              timestamp: Date.now(),
            };

            manager.record(entry);
            manager.undo();

            const stateAfterUndo = cloneNodeState(node);

            // Property: After undo, state should equal the "before" state
            expect(statesEqual(stateAfterUndo, beforeState)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('Property 10: Sequence of operations maintains reversibility', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              action: arbActionType,
              before: arbNodeState,
              after: arbNodeState,
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (operations) => {
            const manager = new UndoManager();

            // Start with the first operation's "before" state
            const node = createNodeWithState(operations[0].before);

            // Record all operations
            // Each operation represents a transition from one state to another
            for (let i = 0; i < operations.length; i++) {
              const op = operations[i];

              // The "before" state should be the current node state
              // The "after" state is what we're transitioning to
              const entry: HistoryEntry = {
                action: op.action,
                node,
                before: cloneNodeState(node), // Use current state as "before"
                after: op.after,
                timestamp: Date.now(),
              };

              manager.record(entry);

              // Manually apply the "after" state to simulate the actual edit
              // This must match the behavior of applyState in UndoManager
              if ('inlineNote' in op.after) {
                node.inlineNote = op.after.inlineNote;
              }
              if ('detailedNote' in op.after) {
                node.detailedNote = op.after.detailedNote;
              }
              if ('fold' in op.after) {
                if (!node.payload) node.payload = {};
                node.payload.fold = op.after.fold;
              }
            }

            // Capture the final state after all operations
            const finalAfterState = cloneNodeState(node);

            // Undo all operations
            for (let i = 0; i < operations.length; i++) {
              manager.undo();
            }

            // Redo all operations
            for (let i = 0; i < operations.length; i++) {
              manager.redo();
            }

            const stateAfterRedoAll = cloneNodeState(node);

            // Property: After undoing all then redoing all, state should equal final state
            expect(statesEqual(stateAfterRedoAll, finalAfterState)).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('Property 10: Undo/redo preserves stack integrity', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              action: arbActionType,
              before: arbNodeState,
              after: arbNodeState,
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (operations) => {
            const manager = new UndoManager();
            const node = createNodeWithState(operations[0].before);

            // Record all operations
            for (const op of operations) {
              const entry: HistoryEntry = {
                action: op.action,
                node,
                before: op.before,
                after: op.after,
                timestamp: Date.now(),
              };
              manager.record(entry);
            }

            const initialUndoSize = manager.getUndoStackSize();
            const initialRedoSize = manager.getRedoStackSize();

            // Perform undo then redo
            manager.undo();
            manager.redo();

            const finalUndoSize = manager.getUndoStackSize();
            const finalRedoSize = manager.getRedoStackSize();

            // Property: Stack sizes should be restored after undo/redo cycle
            expect(finalUndoSize).toBe(initialUndoSize);
            expect(finalRedoSize).toBe(initialRedoSize);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
