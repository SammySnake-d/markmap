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
});
