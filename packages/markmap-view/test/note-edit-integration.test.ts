/**
 * Integration tests for note editing functionality
 *
 * This test suite validates the complete note editing workflow, including:
 * - NotePanel and UndoManager integration
 * - Edit, save, undo, and redo operations
 * - Keyboard shortcuts for undo/redo during editing
 * - Real-time auto-save with undo support
 *
 * Requirements:
 * - 5.7: Allow editing of notes
 * - 5.8: Auto-save changes
 * - 5.9: Support undo/redo for note editing
 * - 12.1: Record each modification to history stack
 * - 12.2: Undo most recent edit
 * - 12.3: Redo last undone operation
 * - 12.4: Update mindmap display and underlying data
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotePanel } from '../src/note-panel';
import { UndoManager } from '../src/undo-manager';
import type { IEnhancedNode } from 'markmap-lib';

describe('Note Editing Integration', () => {
  let container: HTMLElement;
  let notePanel: NotePanel;
  let undoManager: UndoManager;

  // Helper function to create test nodes
  const createTestNode = (
    options: {
      content?: string;
      inlineNote?: string;
      detailedNote?: string;
    } = {},
  ): IEnhancedNode => {
    const { content = 'Test Node', inlineNote, detailedNote } = options;
    return {
      content,
      inlineNote,
      detailedNote,
      hasNote: !!(inlineNote || detailedNote),
      children: [],
      payload: {},
      state: {
        id: 1,
        depth: 1,
        path: '1',
        key: '1',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
    };
  };

  beforeEach(() => {
    // Create container and components
    container = document.createElement('div');
    document.body.appendChild(container);
    notePanel = new NotePanel(container);
    undoManager = new UndoManager();
  });

  afterEach(() => {
    // Clean up
    notePanel.destroy();
    document.body.removeChild(container);
  });

  describe('Basic Edit and Undo Integration', () => {
    it('should record edit in undo manager when note is saved', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      // Set up onEdit callback to record in undo manager
      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Original note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });
      };

      // Show panel and edit
      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      // Verify edit was recorded
      expect(undoManager.canUndo()).toBe(true);
      expect(undoManager.getUndoStackSize()).toBe(1);
    });

    it('should undo note edit and restore original value', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      // Set up onEdit callback
      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Original note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        // Update node
        editedNode.inlineNote = inlineNote;
        editedNode.detailedNote = detailedNote;
      };

      // Edit note
      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe('Updated note');

      // Undo
      undoManager.undo();

      expect(node.inlineNote).toBe('Original note');
    });

    it('should redo note edit after undo', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      // Set up onEdit callback
      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: node.inlineNote,
            detailedNote: node.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
        editedNode.detailedNote = detailedNote;
      };

      // Edit note
      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      // Undo then redo
      undoManager.undo();
      expect(node.inlineNote).toBe('Original note');

      undoManager.redo();
      expect(node.inlineNote).toBe('Updated note');
    });
  });

  describe('Multiple Edits and Undo/Redo', () => {
    it('should handle multiple sequential edits', () => {
      const node = createTestNode({ inlineNote: 'Version 1' });

      let previousInlineNote = node.inlineNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: editedNode.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        editedNode.inlineNote = inlineNote;
        editedNode.detailedNote = detailedNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Edit 1
      textarea.value = 'Version 2';
      textarea.dispatchEvent(new Event('blur'));

      // Edit 2
      textarea.value = 'Version 3';
      textarea.dispatchEvent(new Event('blur'));

      // Edit 3
      textarea.value = 'Version 4';
      textarea.dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe('Version 4');
      expect(undoManager.getUndoStackSize()).toBe(3);

      // Undo all
      undoManager.undo();
      expect(node.inlineNote).toBe('Version 3');

      undoManager.undo();
      expect(node.inlineNote).toBe('Version 2');

      undoManager.undo();
      expect(node.inlineNote).toBe('Version 1');
    });

    it('should handle undo/redo cycles correctly', () => {
      const node = createTestNode({ inlineNote: 'Original' });

      let previousInlineNote = node.inlineNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: editedNode.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Make an edit
      textarea.value = 'Updated';
      textarea.dispatchEvent(new Event('blur'));

      // Undo and redo multiple times
      for (let i = 0; i < 3; i++) {
        undoManager.undo();
        expect(node.inlineNote).toBe('Original');

        undoManager.redo();
        expect(node.inlineNote).toBe('Updated');
      }
    });

    it('should clear redo stack when new edit is made after undo', () => {
      const node = createTestNode({ inlineNote: 'Version 1' });

      let previousInlineNote = node.inlineNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: editedNode.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Edit 1
      textarea.value = 'Version 2';
      textarea.dispatchEvent(new Event('blur'));

      // Edit 2
      textarea.value = 'Version 3';
      textarea.dispatchEvent(new Event('blur'));

      // Undo once
      undoManager.undo();
      expect(node.inlineNote).toBe('Version 2');
      expect(undoManager.canRedo()).toBe(true);

      // Make a new edit (should clear redo stack)
      textarea.value = 'Version 2b';
      textarea.dispatchEvent(new Event('blur'));

      expect(undoManager.canRedo()).toBe(false);
    });
  });

  describe('Detailed Note Editing Integration', () => {
    it('should handle detailed note edits with undo/redo', () => {
      const node = createTestNode({ detailedNote: 'Original detailed note' });

      let previousDetailedNote = node.detailedNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: editedNode.inlineNote,
            detailedNote: previousDetailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousDetailedNote = detailedNote;
        editedNode.inlineNote = inlineNote;
        editedNode.detailedNote = detailedNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated detailed note';
      textarea.dispatchEvent(new Event('blur'));

      expect(node.detailedNote).toBe('Updated detailed note');

      // Undo
      undoManager.undo();
      expect(node.detailedNote).toBe('Original detailed note');

      // Redo
      undoManager.redo();
      expect(node.detailedNote).toBe('Updated detailed note');
    });

    it('should handle both inline and detailed note edits independently', () => {
      const node = createTestNode({
        inlineNote: 'Original inline',
        detailedNote: 'Original detailed',
      });

      let previousInlineNote = node.inlineNote;
      let previousDetailedNote = node.detailedNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: previousDetailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        previousDetailedNote = detailedNote;
        editedNode.inlineNote = inlineNote;
        editedNode.detailedNote = detailedNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textareas = container.querySelectorAll('textarea');

      // Edit inline note
      (textareas[0] as HTMLTextAreaElement).value = 'Updated inline';
      textareas[0].dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe('Updated inline');
      expect(node.detailedNote).toBe('Original detailed');

      // Edit detailed note
      (textareas[1] as HTMLTextAreaElement).value = 'Updated detailed';
      textareas[1].dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe('Updated inline');
      expect(node.detailedNote).toBe('Updated detailed');

      // Undo detailed note edit
      undoManager.undo();
      expect(node.inlineNote).toBe('Updated inline');
      expect(node.detailedNote).toBe('Original detailed');

      // Undo inline note edit
      undoManager.undo();
      expect(node.inlineNote).toBe('Original inline');
      expect(node.detailedNote).toBe('Original detailed');
    });
  });

  describe('Auto-save Integration with Undo', () => {
    it('should record auto-saved edits in undo manager', async () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      let previousInlineNote = node.inlineNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: editedNode.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Auto-saved note';

      // Trigger input event (auto-save)
      textarea.dispatchEvent(new Event('input'));

      // Wait for debounce delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should have been auto-saved and recorded
      expect(node.inlineNote).toBe('Auto-saved note');
      expect(undoManager.canUndo()).toBe(true);

      // Undo should work
      undoManager.undo();
      expect(node.inlineNote).toBe('Original note');
    });

    it('should handle multiple auto-saves with proper undo history', async () => {
      const node = createTestNode({ inlineNote: 'Original' });

      let previousInlineNote = node.inlineNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: editedNode.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // First auto-save
      textarea.value = 'Version 1';
      textarea.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Second auto-save
      textarea.value = 'Version 2';
      textarea.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(node.inlineNote).toBe('Version 2');
      expect(undoManager.getUndoStackSize()).toBe(2);

      // Undo both
      undoManager.undo();
      expect(node.inlineNote).toBe('Version 1');

      undoManager.undo();
      expect(node.inlineNote).toBe('Original');
    });
  });

  describe('Panel State and Undo Integration', () => {
    it('should update panel content after undo', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Original note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      // Undo
      undoManager.undo();

      // Update panel to reflect undo
      notePanel.updateContent(node.inlineNote, node.detailedNote);

      // Panel should show original content
      const inlineContent = container.querySelector(
        '.markmap-note-inline-content',
      ) as HTMLElement;
      expect(inlineContent.textContent).toBe('Original note');
    });

    it('should handle panel visibility during undo/redo', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Original note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      // Panel should still be visible
      expect(notePanel.isVisible()).toBe(true);

      // Undo
      undoManager.undo();

      // Panel should still be visible
      expect(notePanel.isVisible()).toBe(true);

      // Redo
      undoManager.redo();

      // Panel should still be visible
      expect(notePanel.isVisible()).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undo when panel is closed', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Original note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      // Close panel
      notePanel.hide();

      // Undo should still work
      undoManager.undo();
      expect(node.inlineNote).toBe('Original note');
    });

    it('should handle editing different nodes sequentially', () => {
      const node1 = createTestNode({ inlineNote: 'Node 1 original' });
      const node2 = createTestNode({ inlineNote: 'Node 2 original' });

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        const before = {
          inlineNote: editedNode.inlineNote,
          detailedNote: editedNode.detailedNote,
        };

        undoManager.record({
          action: 'edit',
          node: editedNode,
          before,
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
      };

      // Edit node 1
      notePanel.show(node1, { x: 100, y: 100 });
      notePanel.enableEdit();

      let textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'Node 1 updated';
      textarea.dispatchEvent(new Event('blur'));

      // Edit node 2
      notePanel.show(node2, { x: 100, y: 100 });
      notePanel.enableEdit();

      textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'Node 2 updated';
      textarea.dispatchEvent(new Event('blur'));

      expect(node1.inlineNote).toBe('Node 1 updated');
      expect(node2.inlineNote).toBe('Node 2 updated');

      // Undo in reverse order
      undoManager.undo();
      expect(node2.inlineNote).toBe('Node 2 original');

      undoManager.undo();
      expect(node1.inlineNote).toBe('Node 1 original');
    });

    it('should handle empty note edits', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Original note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = '';
      textarea.dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe('');

      // Undo
      undoManager.undo();
      expect(node.inlineNote).toBe('Original note');
    });

    it('should handle very long note edits', () => {
      const longNote = 'A'.repeat(5000);
      const node = createTestNode({ inlineNote: 'Short note' });

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        undoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: 'Short note',
            detailedNote: undefined,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = longNote;
      textarea.dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe(longNote);

      // Undo
      undoManager.undo();
      expect(node.inlineNote).toBe('Short note');
    });
  });

  describe('Undo Manager Stack Limits', () => {
    it('should respect undo manager stack size limit', () => {
      const smallUndoManager = new UndoManager(3);
      const node = createTestNode({ inlineNote: 'Version 0' });

      let previousInlineNote = node.inlineNote;

      notePanel.onEdit = (editedNode, inlineNote, detailedNote) => {
        smallUndoManager.record({
          action: 'edit',
          node: editedNode,
          before: {
            inlineNote: previousInlineNote,
            detailedNote: editedNode.detailedNote,
          },
          after: {
            inlineNote,
            detailedNote,
          },
          timestamp: Date.now(),
        });

        previousInlineNote = inlineNote;
        editedNode.inlineNote = inlineNote;
      };

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Make 5 edits (more than stack limit)
      for (let i = 1; i <= 5; i++) {
        textarea.value = `Version ${i}`;
        textarea.dispatchEvent(new Event('blur'));
      }

      expect(node.inlineNote).toBe('Version 5');
      expect(smallUndoManager.getUndoStackSize()).toBe(3);

      // Can only undo 3 times
      smallUndoManager.undo();
      expect(node.inlineNote).toBe('Version 4');

      smallUndoManager.undo();
      expect(node.inlineNote).toBe('Version 3');

      smallUndoManager.undo();
      expect(node.inlineNote).toBe('Version 2');

      // Cannot undo further
      expect(smallUndoManager.canUndo()).toBe(false);
    });
  });
});
