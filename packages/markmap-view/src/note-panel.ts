import type { IEnhancedNode } from 'markmap-lib';

/**
 * NotePanel component for displaying and editing node notes.
 *
 * This component manages the display and editing of both inline and detailed notes
 * for nodes in the mindmap. It provides a floating panel that appears next to
 * the selected node.
 *
 * Requirements:
 * - 5.3: Display both inline and detailed notes
 * - 5.5: Show panel when note icon is clicked
 * - 5.6: Close panel when icon is clicked again or close button is pressed
 * - 5.7: Allow editing of notes
 * - 5.8: Auto-save changes
 */
export class NotePanel {
  private container: HTMLElement;
  private currentNode: IEnhancedNode | null = null;
  private isEditing = false;
  private inlineNoteElement: HTMLElement | null = null;
  private detailedNoteElement: HTMLElement | null = null;

  /**
   * Callback fired when note content is edited.
   * Parameters: (node, inlineNote, detailedNote)
   */
  public onEdit:
    | ((
        node: IEnhancedNode,
        inlineNote: string | undefined,
        detailedNote: string | undefined,
      ) => void)
    | null = null;

  /**
   * Callback fired when the panel is closed.
   */
  public onClose: (() => void) | null = null;

  constructor(parentElement: HTMLElement) {
    this.container = this.createContainer();
    parentElement.appendChild(this.container);
    this.setupEventListeners();
  }

  /**
   * Creates the HTML structure for the note panel.
   */
  private createContainer(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'markmap-note-panel';
    panel.style.cssText = `
      position: absolute;
      display: none;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      min-width: 300px;
      max-width: 500px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header with close button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    `;

    const title = document.createElement('div');
    title.textContent = '备注';
    title.style.cssText = `
      font-weight: 600;
      font-size: 14px;
      color: #333;
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'markmap-note-panel-close';
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.onmouseover = () => {
      closeButton.style.color = '#333';
    };
    closeButton.onmouseout = () => {
      closeButton.style.color = '#999';
    };

    header.appendChild(title);
    header.appendChild(closeButton);

    // Content area
    const content = document.createElement('div');
    content.className = 'markmap-note-panel-content';
    content.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
    `;

    panel.appendChild(header);
    panel.appendChild(content);

    return panel;
  }

  /**
   * Sets up event listeners for the panel.
   */
  private setupEventListeners(): void {
    // Close button
    const closeButton = this.container.querySelector(
      '.markmap-note-panel-close',
    ) as HTMLElement;
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
      });
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (
        this.container.style.display !== 'none' &&
        !this.container.contains(e.target as Node)
      ) {
        // Check if click is on a note icon (to prevent immediate close when opening)
        const target = e.target as HTMLElement;
        if (!target.closest('.markmap-note-icon')) {
          this.hide();
        }
      }
    });
  }

  /**
   * Shows the note panel for a specific node at the given position.
   *
   * Requirement 5.5: Display panel when note icon is clicked
   *
   * @param node - The node whose notes to display
   * @param position - The x, y coordinates for panel placement
   */
  public show(node: IEnhancedNode, position: { x: number; y: number }): void {
    this.currentNode = node;
    this.updateContent(node.inlineNote, node.detailedNote);
    this.positionPanel(position);
    this.container.style.display = 'block';
  }

  /**
   * Hides the note panel.
   *
   * Requirement 5.6: Close panel when requested
   */
  public hide(): void {
    this.container.style.display = 'none';
    this.currentNode = null;
    this.isEditing = false;
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * Updates the content of the note panel.
   *
   * Requirement 5.3: Display both inline and detailed notes
   *
   * @param inlineNote - The inline note content
   * @param detailedNote - The detailed note content
   */
  public updateContent(inlineNote?: string, detailedNote?: string): void {
    const contentArea = this.container.querySelector(
      '.markmap-note-panel-content',
    ) as HTMLElement;
    if (!contentArea) return;

    contentArea.innerHTML = '';

    // Inline note section
    if (inlineNote) {
      const inlineSection = this.createNoteSection(
        '单行备注',
        inlineNote,
        'inline',
      );
      contentArea.appendChild(inlineSection);
    }

    // Detailed note section
    if (detailedNote) {
      const detailedSection = this.createNoteSection(
        '详细备注',
        detailedNote,
        'detailed',
      );
      contentArea.appendChild(detailedSection);
    }

    // If no notes, show a message
    if (!inlineNote && !detailedNote) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = '此节点没有备注';
      emptyMessage.style.cssText = `
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 20px;
      `;
      contentArea.appendChild(emptyMessage);
    }
  }

  /**
   * Creates a note section (inline or detailed).
   *
   * Requirements:
   * - 5.3: Display both inline and detailed notes
   * - 6.4: Preserve line breaks and formatting in detailed notes
   * - 6.5: Preserve Markdown formatting for rendering
   */
  private createNoteSection(
    label: string,
    content: string,
    type: 'inline' | 'detailed',
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = `markmap-note-section markmap-note-${type}`;
    section.style.cssText = `
      margin-bottom: 16px;
    `;

    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    const contentElement = document.createElement('div');
    contentElement.className = `markmap-note-${type}-content`;

    // Requirement 6.4: Preserve line breaks and formatting
    // Requirement 6.5: Preserve Markdown formatting
    // For detailed notes, we render basic Markdown formatting
    if (type === 'detailed') {
      contentElement.innerHTML = this.renderMarkdownContent(content);
    } else {
      // For inline notes, just display as text
      contentElement.textContent = content;
    }

    contentElement.style.cssText = `
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;

    // Store reference for editing
    if (type === 'inline') {
      this.inlineNoteElement = contentElement;
    } else {
      this.detailedNoteElement = contentElement;
    }

    section.appendChild(labelElement);
    section.appendChild(contentElement);

    return section;
  }

  /**
   * Renders basic Markdown formatting in note content.
   *
   * Requirement 6.5: Preserve Markdown formatting for rendering
   *
   * Supports:
   * - Bold: **text** or __text__
   * - Italic: *text* or _text_
   * - Code: `code`
   * - Line breaks (preserved as-is)
   * - Lists (unordered and ordered)
   *
   * @param content - The Markdown content to render
   * @returns HTML string with formatted content
   */
  private renderMarkdownContent(content: string): string {
    // Escape HTML to prevent XSS
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_ (but not inside words)
    html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/\b_([^_]+?)_\b/g, '<em>$1</em>');

    // Inline code: `code`
    html = html.replace(
      /`([^`]+?)`/g,
      '<code style="background: #e9ecef; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>',
    );

    // Unordered lists: - item or * item
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(
      /(<li>.*<\/li>)/s,
      '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>',
    );

    // Ordered lists: 1. item
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    return html;
  }

  /**
   * Positions the panel relative to the given coordinates.
   */
  private positionPanel(position: { x: number; y: number }): void {
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Start with the requested position
    let x = position.x + padding;
    let y = position.y;

    // Adjust if panel would go off-screen
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;

    // Force a reflow to get accurate dimensions
    this.container.style.display = 'block';
    const rect = this.container.getBoundingClientRect();

    // Adjust horizontal position if needed
    if (rect.right > viewportWidth - padding) {
      x = position.x - rect.width - padding;
      if (x < padding) {
        x = padding;
      }
    }

    // Adjust vertical position if needed
    if (rect.bottom > viewportHeight - padding) {
      y = viewportHeight - rect.height - padding;
      if (y < padding) {
        y = padding;
      }
    }

    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
  }

  /**
   * Enables edit mode for the notes.
   *
   * Requirement 5.7: Allow editing of notes
   */
  public enableEdit(): void {
    if (this.isEditing) return;
    this.isEditing = true;

    // Convert inline note to editable
    if (this.inlineNoteElement) {
      this.makeEditable(this.inlineNoteElement, 'inline');
    }

    // Convert detailed note to editable
    if (this.detailedNoteElement) {
      this.makeEditable(this.detailedNoteElement, 'detailed');
    }
  }

  /**
   * Disables edit mode for the notes.
   */
  public disableEdit(): void {
    if (!this.isEditing) return;
    this.isEditing = false;

    // Convert back to read-only
    if (this.inlineNoteElement) {
      this.makeReadOnly(this.inlineNoteElement);
    }

    if (this.detailedNoteElement) {
      this.makeReadOnly(this.detailedNoteElement);
    }
  }

  /**
   * Makes a note element editable.
   */
  private makeEditable(
    element: HTMLElement,
    type: 'inline' | 'detailed',
  ): void {
    const currentText = element.textContent || '';

    // Create textarea for editing
    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    textarea.style.cssText = `
      width: 100%;
      min-height: ${type === 'inline' ? '60px' : '120px'};
      padding: 12px;
      background: white;
      border: 2px solid #4a90e2;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
    `;

    // Auto-save on blur
    textarea.addEventListener('blur', () => {
      this.saveEdit(type, textarea.value);
    });

    // Save on Ctrl/Cmd + Enter
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        textarea.blur();
      }
    });

    // Replace content with textarea
    element.innerHTML = '';
    element.appendChild(textarea);
    textarea.focus();
  }

  /**
   * Makes a note element read-only.
   */
  private makeReadOnly(element: HTMLElement): void {
    const textarea = element.querySelector('textarea');
    if (textarea) {
      element.textContent = textarea.value;
      element.style.cssText = `
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
    }
  }

  /**
   * Saves the edited note content.
   *
   * Requirement 5.8: Auto-save changes
   */
  private saveEdit(type: 'inline' | 'detailed', newValue: string): void {
    if (!this.currentNode || !this.onEdit) return;

    const inlineNote =
      type === 'inline' ? newValue : this.currentNode.inlineNote;
    const detailedNote =
      type === 'detailed' ? newValue : this.currentNode.detailedNote;

    // Fire the edit callback
    this.onEdit(this.currentNode, inlineNote, detailedNote);

    // Update the current node reference
    if (type === 'inline') {
      this.currentNode.inlineNote = newValue;
    } else {
      this.currentNode.detailedNote = newValue;
    }
  }

  /**
   * Checks if the panel is currently visible.
   */
  public isVisible(): boolean {
    return this.container.style.display !== 'none';
  }

  /**
   * Gets the currently displayed node.
   */
  public getCurrentNode(): IEnhancedNode | null {
    return this.currentNode;
  }

  /**
   * Destroys the panel and cleans up resources.
   */
  public destroy(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.currentNode = null;
    this.inlineNoteElement = null;
    this.detailedNoteElement = null;
    this.onEdit = null;
    this.onClose = null;
  }
}
