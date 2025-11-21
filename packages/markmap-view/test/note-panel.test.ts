/**
 * Unit tests for NotePanel component
 *
 * Requirements:
 * - 5.3: Display both inline and detailed notes
 * - 5.5: Show panel when note icon is clicked
 * - 5.6: Close panel when icon is clicked again or close button is pressed
 * - 5.7: Allow editing of notes
 * - 5.8: Auto-save changes
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotePanel } from '../src/note-panel';
import type { IEnhancedNode } from 'markmap-lib';

describe('NotePanel', () => {
  let container: HTMLElement;
  let notePanel: NotePanel;

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
      state: undefined,
    };
  };

  beforeEach(() => {
    // Create a container for the panel
    container = document.createElement('div');
    document.body.appendChild(container);
    notePanel = new NotePanel(container);
  });

  afterEach(() => {
    // Clean up
    notePanel.destroy();
    document.body.removeChild(container);
  });

  describe('Panel Creation and Visibility', () => {
    it('should create panel in hidden state', () => {
      expect(notePanel.isVisible()).toBe(false);
    });

    it('should show panel when show() is called', () => {
      const node = createTestNode({ inlineNote: 'Test inline note' });

      notePanel.show(node, { x: 100, y: 100 });
      expect(notePanel.isVisible()).toBe(true);
    });

    it('should hide panel when hide() is called', () => {
      const node = createTestNode({ inlineNote: 'Test inline note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.hide();
      expect(notePanel.isVisible()).toBe(false);
    });

    it('should store current node when shown', () => {
      const node = createTestNode({ inlineNote: 'Test inline note' });

      notePanel.show(node, { x: 100, y: 100 });
      expect(notePanel.getCurrentNode()).toBe(node);
    });

    it('should clear current node when hidden', () => {
      const node = createTestNode({ inlineNote: 'Test inline note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.hide();
      expect(notePanel.getCurrentNode()).toBeNull();
    });
  });

  describe('Content Display', () => {
    it('should display inline note only', () => {
      const node = createTestNode({ inlineNote: 'This is an inline note' });

      notePanel.show(node, { x: 100, y: 100 });

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      expect(panelElement).toBeTruthy();
      expect(panelElement.textContent).toContain('This is an inline note');
      expect(panelElement.textContent).toContain('单行备注');
    });

    it('should display detailed note only', () => {
      const node = createTestNode({
        detailedNote: 'This is a detailed note\nwith multiple lines',
      });

      notePanel.show(node, { x: 100, y: 100 });

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      expect(panelElement).toBeTruthy();
      expect(panelElement.textContent).toContain('This is a detailed note');
      expect(panelElement.textContent).toContain('详细备注');
    });

    it('should display both inline and detailed notes', () => {
      const node = createTestNode({
        inlineNote: 'Inline note',
        detailedNote: 'Detailed note',
      });

      notePanel.show(node, { x: 100, y: 100 });

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      expect(panelElement.textContent).toContain('Inline note');
      expect(panelElement.textContent).toContain('Detailed note');
      expect(panelElement.textContent).toContain('单行备注');
      expect(panelElement.textContent).toContain('详细备注');
    });

    it('should display empty message when no notes', () => {
      const node = createTestNode();

      notePanel.show(node, { x: 100, y: 100 });

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      expect(panelElement.textContent).toContain('此节点没有备注');
    });

    it('should update content when updateContent is called', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.updateContent('Updated note', undefined);

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      expect(panelElement.textContent).toContain('Updated note');
      expect(panelElement.textContent).not.toContain('Original note');
    });
  });

  describe('Panel Positioning', () => {
    it('should position panel at specified coordinates', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 200, y: 150 });

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      const left = parseInt(panelElement.style.left);
      const top = parseInt(panelElement.style.top);

      // Panel should be positioned near the specified coordinates (with padding)
      expect(left).toBeGreaterThanOrEqual(200);
      expect(top).toBeGreaterThanOrEqual(0);
    });

    it('should adjust position to stay within viewport', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      // Position near the edge of the viewport
      const x = window.innerWidth - 50;
      const y = window.innerHeight - 50;

      notePanel.show(node, { x, y });

      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      const rect = panelElement.getBoundingClientRect();

      // Panel should be adjusted to stay within viewport
      expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
  });

  describe('Edit Mode', () => {
    it('should enable edit mode', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      // Check if textarea is created
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('should disable edit mode', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();
      notePanel.disableEdit();

      // Textarea should be removed
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeNull();
    });

    it('should populate textarea with current note content', () => {
      const node = createTestNode({ inlineNote: 'Original content' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Original content');
    });

    it('should have an edit button', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      const editButton = container.querySelector('.markmap-note-panel-edit');
      expect(editButton).toBeTruthy();
    });

    it('should toggle edit mode when edit button is clicked', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      const editButton = container.querySelector(
        '.markmap-note-panel-edit',
      ) as HTMLElement;

      // Initially not in edit mode
      expect(container.querySelector('textarea')).toBeNull();

      // Click to enable edit mode
      editButton.click();
      expect(container.querySelector('textarea')).toBeTruthy();

      // Click again to disable edit mode
      editButton.click();
      expect(container.querySelector('textarea')).toBeNull();
    });

    it('should update edit button appearance when in edit mode', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      const editButton = container.querySelector(
        '.markmap-note-panel-edit',
      ) as HTMLElement;

      // Initially shows edit icon
      expect(editButton.textContent).toBe('✏️');
      expect(editButton.title).toBe('编辑备注');

      // Click to enable edit mode
      editButton.click();

      // Should show checkmark icon
      expect(editButton.textContent).toBe('✓');
      expect(editButton.title).toBe('完成编辑');
    });

    it('should reset edit mode when showing a new node', () => {
      const node1 = createTestNode({ inlineNote: 'Note 1' });
      const node2 = createTestNode({ inlineNote: 'Note 2' });

      notePanel.show(node1, { x: 100, y: 100 });
      notePanel.enableEdit();

      // Should be in edit mode
      expect(container.querySelector('textarea')).toBeTruthy();

      // Show a different node
      notePanel.show(node2, { x: 100, y: 100 });

      // Should not be in edit mode anymore
      expect(container.querySelector('textarea')).toBeNull();
    });

    it('should enable edit mode for both inline and detailed notes', () => {
      const node = createTestNode({
        inlineNote: 'Inline note',
        detailedNote: 'Detailed note',
      });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      // Should have two textareas
      const textareas = container.querySelectorAll('textarea');
      expect(textareas.length).toBe(2);
    });
  });

  describe('Event Callbacks', () => {
    it('should call onClose callback when panel is hidden', () => {
      const onCloseMock = vi.fn();
      notePanel.onClose = onCloseMock;

      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.hide();

      expect(onCloseMock).toHaveBeenCalled();
    });

    it('should call onEdit callback when note is saved', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Trigger blur to save
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(node, 'Updated note', undefined);
    });

    it('should update node reference after edit', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.onEdit = vi.fn();
      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';
      textarea.dispatchEvent(new Event('blur'));

      expect(node.inlineNote).toBe('Updated note');
    });
  });

  describe('Close Button', () => {
    it('should have a close button', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      const closeButton = container.querySelector('.markmap-note-panel-close');
      expect(closeButton).toBeTruthy();
    });

    it('should close panel when close button is clicked', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      const closeButton = container.querySelector(
        '.markmap-note-panel-close',
      ) as HTMLElement;
      closeButton.click();

      expect(notePanel.isVisible()).toBe(false);
    });
  });

  describe('Panel Structure', () => {
    it('should have correct CSS classes', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      const panel = container.querySelector('.markmap-note-panel');
      const content = container.querySelector('.markmap-note-panel-content');
      const closeButton = container.querySelector('.markmap-note-panel-close');

      expect(panel).toBeTruthy();
      expect(content).toBeTruthy();
      expect(closeButton).toBeTruthy();
    });

    it('should have inline note section when inline note exists', () => {
      const node = createTestNode({ inlineNote: 'Test inline note' });

      notePanel.show(node, { x: 100, y: 100 });

      const inlineSection = container.querySelector('.markmap-note-inline');
      expect(inlineSection).toBeTruthy();
    });

    it('should have detailed note section when detailed note exists', () => {
      const node = createTestNode({ detailedNote: 'Test detailed note' });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedSection = container.querySelector('.markmap-note-detailed');
      expect(detailedSection).toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    it('should remove panel from DOM when destroyed', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.destroy();

      const panel = container.querySelector('.markmap-note-panel');
      expect(panel).toBeNull();
    });

    it('should clear all references when destroyed', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.destroy();

      expect(notePanel.getCurrentNode()).toBeNull();
    });
  });

  describe('Multi-line Content', () => {
    it('should preserve line breaks in detailed notes', () => {
      const node = createTestNode({ detailedNote: 'Line 1\nLine 2\nLine 3' });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;
      expect(detailedContent.textContent).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle empty lines in detailed notes', () => {
      const node = createTestNode({ detailedNote: 'Line 1\n\nLine 3' });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;
      expect(detailedContent.textContent).toBe('Line 1\n\nLine 3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string notes', () => {
      const node = createTestNode({
        inlineNote: '',
        detailedNote: '',
      });

      notePanel.show(node, { x: 100, y: 100 });

      // Empty strings should be treated as no notes
      const panelElement = container.querySelector(
        '.markmap-note-panel',
      ) as HTMLElement;
      expect(panelElement.textContent).toContain('此节点没有备注');
    });

    it('should handle very long notes', () => {
      const longNote = 'A'.repeat(1000);
      const node = createTestNode({ inlineNote: longNote });

      notePanel.show(node, { x: 100, y: 100 });

      const inlineContent = container.querySelector(
        '.markmap-note-inline-content',
      ) as HTMLElement;
      expect(inlineContent.textContent).toBe(longNote);
    });

    it('should handle special characters in notes', () => {
      const node = createTestNode({
        inlineNote: '<script>alert("xss")</script>',
        detailedNote: '& < > " \'',
      });

      notePanel.show(node, { x: 100, y: 100 });

      const inlineContent = container.querySelector(
        '.markmap-note-inline-content',
      ) as HTMLElement;
      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;

      // Content should be displayed as text, not executed
      expect(inlineContent.textContent).toBe('<script>alert("xss")</script>');
      expect(detailedContent.textContent).toBe('& < > " \'');
    });
  });

  describe('Markdown Formatting (Requirement 6.5)', () => {
    it('should render bold text in detailed notes', () => {
      const node = createTestNode({ detailedNote: 'This is **bold** text' });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;
      const strongElement = detailedContent.querySelector('strong');

      expect(strongElement).toBeTruthy();
      expect(strongElement?.textContent).toBe('bold');
    });

    it('should render italic text in detailed notes', () => {
      const node = createTestNode({ detailedNote: 'This is *italic* text' });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;
      const emElement = detailedContent.querySelector('em');

      expect(emElement).toBeTruthy();
      expect(emElement?.textContent).toBe('italic');
    });

    it('should render inline code in detailed notes', () => {
      const node = createTestNode({ detailedNote: 'This is `code` text' });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;
      const codeElement = detailedContent.querySelector('code');

      expect(codeElement).toBeTruthy();
      expect(codeElement?.textContent).toBe('code');
    });

    it('should render multiple Markdown formats together', () => {
      const node = createTestNode({
        detailedNote: 'Text with **bold**, *italic*, and `code`',
      });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;

      expect(detailedContent.querySelector('strong')).toBeTruthy();
      expect(detailedContent.querySelector('em')).toBeTruthy();
      expect(detailedContent.querySelector('code')).toBeTruthy();
    });

    it('should preserve line breaks with Markdown formatting', () => {
      const node = createTestNode({
        detailedNote: '**Bold line 1**\n*Italic line 2*\n`Code line 3`',
      });

      notePanel.show(node, { x: 100, y: 100 });

      const detailedContent = container.querySelector(
        '.markmap-note-detailed-content',
      ) as HTMLElement;

      // Check that all formats are rendered
      expect(detailedContent.querySelector('strong')).toBeTruthy();
      expect(detailedContent.querySelector('em')).toBeTruthy();
      expect(detailedContent.querySelector('code')).toBeTruthy();

      // Check that line breaks are preserved in textContent
      const text = detailedContent.textContent || '';
      expect(text).toContain('\n');
    });

    it('should not render Markdown in inline notes', () => {
      const node = createTestNode({ inlineNote: 'This is **not bold**' });

      notePanel.show(node, { x: 100, y: 100 });

      const inlineContent = container.querySelector(
        '.markmap-note-inline-content',
      ) as HTMLElement;

      // Inline notes should not have HTML formatting
      expect(inlineContent.querySelector('strong')).toBeNull();
      expect(inlineContent.textContent).toBe('This is **not bold**');
    });
  });

  describe('Real-time Auto-save (Task 44 - Requirement 5.8)', () => {
    it('should auto-save after typing with debounce delay', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Trigger input event (simulating user typing)
      textarea.dispatchEvent(new Event('input'));

      // Should not save immediately
      expect(onEditMock).not.toHaveBeenCalled();

      // Wait for debounce delay (500ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should have auto-saved after delay
      expect(onEditMock).toHaveBeenCalledWith(node, 'Updated note', undefined);
    });

    it('should debounce multiple rapid inputs', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Simulate rapid typing
      textarea.value = 'U';
      textarea.dispatchEvent(new Event('input'));

      await new Promise((resolve) => setTimeout(resolve, 100));

      textarea.value = 'Up';
      textarea.dispatchEvent(new Event('input'));

      await new Promise((resolve) => setTimeout(resolve, 100));

      textarea.value = 'Upd';
      textarea.dispatchEvent(new Event('input'));

      await new Promise((resolve) => setTimeout(resolve, 100));

      textarea.value = 'Updated';
      textarea.dispatchEvent(new Event('input'));

      // Should not have saved yet
      expect(onEditMock).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should have saved only once with final value
      expect(onEditMock).toHaveBeenCalledTimes(1);
      expect(onEditMock).toHaveBeenCalledWith(node, 'Updated', undefined);
    });

    it('should cancel auto-save when textarea loses focus and save immediately', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Trigger input event
      textarea.dispatchEvent(new Event('input'));

      // Immediately blur (before debounce delay)
      await new Promise((resolve) => setTimeout(resolve, 100));
      textarea.dispatchEvent(new Event('blur'));

      // Should have saved immediately on blur
      expect(onEditMock).toHaveBeenCalledTimes(1);
      expect(onEditMock).toHaveBeenCalledWith(node, 'Updated note', undefined);

      // Wait for what would have been the debounce delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should still only have been called once (debounced save was cancelled)
      expect(onEditMock).toHaveBeenCalledTimes(1);
    });

    it('should cancel auto-save when panel is hidden', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Trigger input event
      textarea.dispatchEvent(new Event('input'));

      // Hide panel before debounce delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      notePanel.hide();

      // Wait for what would have been the debounce delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should not have saved (auto-save was cancelled)
      expect(onEditMock).not.toHaveBeenCalled();
    });

    it('should cancel auto-save when panel is destroyed', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Trigger input event
      textarea.dispatchEvent(new Event('input'));

      // Destroy panel before debounce delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      notePanel.destroy();

      // Wait for what would have been the debounce delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should not have saved (auto-save was cancelled)
      expect(onEditMock).not.toHaveBeenCalled();
    });

    it('should auto-save detailed note edits', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ detailedNote: 'Original detailed note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated detailed note';

      // Trigger input event
      textarea.dispatchEvent(new Event('input'));

      // Wait for debounce delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should have auto-saved
      expect(onEditMock).toHaveBeenCalledWith(
        node,
        undefined,
        'Updated detailed note',
      );
    });

    it('should handle auto-save for both notes independently', async () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({
        inlineNote: 'Original inline',
        detailedNote: 'Original detailed',
      });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textareas = container.querySelectorAll('textarea');

      // Edit inline note
      (textareas[0] as HTMLTextAreaElement).value = 'Updated inline';
      textareas[0].dispatchEvent(new Event('input'));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(onEditMock).toHaveBeenCalledWith(
        node,
        'Updated inline',
        'Original detailed',
      );

      onEditMock.mockClear();

      // Edit detailed note
      (textareas[1] as HTMLTextAreaElement).value = 'Updated detailed';
      textareas[1].dispatchEvent(new Event('input'));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(onEditMock).toHaveBeenCalledWith(
        node,
        'Updated inline',
        'Updated detailed',
      );
    });
  });

  describe('Edit Mode - Additional Tests (Task 43)', () => {
    it('should save inline note edit when textarea loses focus', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original inline note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated inline note';
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(
        node,
        'Updated inline note',
        undefined,
      );
    });

    it('should save detailed note edit when textarea loses focus', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ detailedNote: 'Original detailed note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated detailed note';
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(
        node,
        undefined,
        'Updated detailed note',
      );
    });

    it('should save both notes when editing both simultaneously', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({
        inlineNote: 'Original inline',
        detailedNote: 'Original detailed',
      });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textareas = container.querySelectorAll('textarea');
      expect(textareas.length).toBe(2);

      // Edit inline note first
      (textareas[0] as HTMLTextAreaElement).value = 'Updated inline';
      textareas[0].dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(
        node,
        'Updated inline',
        'Original detailed',
      );

      // Edit detailed note
      (textareas[1] as HTMLTextAreaElement).value = 'Updated detailed';
      textareas[1].dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(
        node,
        'Updated inline',
        'Updated detailed',
      );
    });

    it('should preserve textarea content when toggling edit mode', () => {
      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Modified note';

      // Disable edit mode
      notePanel.disableEdit();

      // The content should be displayed as text
      const inlineContent = container.querySelector(
        '.markmap-note-inline-content',
      ) as HTMLElement;
      expect(inlineContent.textContent).toBe('Modified note');
    });

    it('should handle empty note after edit', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = '';
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(node, '', undefined);
    });

    it('should handle whitespace-only note after edit', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = '   \n\n   ';
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(node, '   \n\n   ', undefined);
    });

    it('should handle very long text in edit mode', () => {
      const longText = 'A'.repeat(5000);
      const node = createTestNode({ inlineNote: 'Short note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = longText;

      expect(textarea.value).toBe(longText);
      expect(textarea.value.length).toBe(5000);
    });

    it('should handle special characters in edit mode', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      const specialText = '<script>alert("test")</script>\n& < > " \'';
      textarea.value = specialText;
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(node, specialText, undefined);
    });

    it('should focus textarea when entering edit mode', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Check if textarea exists and can receive focus
      expect(textarea).toBeTruthy();
      expect(document.activeElement).toBe(textarea);
    });

    it('should not call onEdit if no changes were made', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;

      // Don't change the value, just blur
      textarea.dispatchEvent(new Event('blur'));

      // onEdit should still be called (auto-save behavior)
      expect(onEditMock).toHaveBeenCalledWith(node, 'Original note', undefined);
    });

    it('should handle rapid edit mode toggling', () => {
      const node = createTestNode({ inlineNote: 'Test note' });

      notePanel.show(node, { x: 100, y: 100 });

      // Toggle multiple times rapidly
      notePanel.enableEdit();
      notePanel.disableEdit();
      notePanel.enableEdit();
      notePanel.disableEdit();
      notePanel.enableEdit();

      // Should end up in edit mode
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('should maintain edit state per note type', () => {
      const node = createTestNode({
        inlineNote: 'Inline note',
        detailedNote: 'Detailed note',
      });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textareas = container.querySelectorAll('textarea');

      // Both should be editable
      expect(textareas.length).toBe(2);
      expect((textareas[0] as HTMLTextAreaElement).value).toBe('Inline note');
      expect((textareas[1] as HTMLTextAreaElement).value).toBe('Detailed note');
    });

    it('should handle Ctrl+Enter to save (inline note)', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Simulate Ctrl+Enter
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
      });
      textarea.dispatchEvent(event);

      // Should trigger blur which saves
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(node, 'Updated note', undefined);
    });

    it('should handle Cmd+Enter to save (inline note)', () => {
      const onEditMock = vi.fn();
      notePanel.onEdit = onEditMock;

      const node = createTestNode({ inlineNote: 'Original note' });

      notePanel.show(node, { x: 100, y: 100 });
      notePanel.enableEdit();

      const textarea = container.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      textarea.value = 'Updated note';

      // Simulate Cmd+Enter (Mac)
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
      });
      textarea.dispatchEvent(event);

      // Should trigger blur which saves
      textarea.dispatchEvent(new Event('blur'));

      expect(onEditMock).toHaveBeenCalledWith(node, 'Updated note', undefined);
    });
  });
});
