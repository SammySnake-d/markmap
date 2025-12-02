import { INode } from 'markmap-common';

/**
 * NotePanel manages the display and editing of node notes.
 *
 * Requirements:
 * - 5.5: Display note panel when user clicks note icon
 * - 5.6: Close note panel when clicking icon again or close button
 * - 5.7: Allow direct editing of inline and detailed notes
 * - 5.8: Auto-save changes to original Markdown data
 */
export class NotePanel {
  private panel: HTMLDivElement | null = null;
  private currentNode: INode | null = null;
  private onSave?: (
    node: INode,
    inlineNote: string,
    detailedNote: string,
  ) => void;
  private onClose?: () => void;

  constructor(options?: {
    onSave?: (node: INode, inlineNote: string, detailedNote: string) => void;
    onClose?: () => void;
  }) {
    this.onSave = options?.onSave;
    this.onClose = options?.onClose;
  }

  /**
   * Show the note panel for a specific node.
   *
   * Requirements:
   * - 5.5: Display note panel at fixed position near node
   *
   * @param node - The node to display notes for
   * @param x - X coordinate for panel position
   * @param y - Y coordinate for panel position
   */
  show(node: INode, x: number, y: number): void {
    // If panel is already showing for this node, hide it
    if (this.currentNode === node && this.panel) {
      this.hide();
      return;
    }

    // Hide existing panel if any (without triggering onClose callback)
    this.hideWithoutCallback();

    this.currentNode = node;

    // Create panel element
    // 样式通过 CSS 类控制，参见 style.css
    this.panel = document.createElement('div');
    this.panel.className = 'markmap-note-panel';
    this.panel.style.left = `${x}px`;
    this.panel.style.top = `${y}px`;

    // Get note data - combine inline and detailed notes
    const inlineNote = (node as any).inlineNote || '';
    const detailedNote = (node as any).detailedNote || '';

    // Combine both notes into one text area
    // If both exist, put inline note first, then detailed note
    let combinedNote = '';
    if (inlineNote && detailedNote) {
      combinedNote = `${inlineNote}\n\n${detailedNote}`;
    } else if (inlineNote) {
      combinedNote = inlineNote;
    } else if (detailedNote) {
      combinedNote = detailedNote;
    }

    // Create panel content
    // 样式通过 CSS 类控制，参见 styles/note-panel.css
    // iOS/macOS 沉浸式风格 - 毛玻璃背景 + 内凹输入框
    const noteIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>`;

    const html = `
      <div class="markmap-note-panel-header">
        <div class="markmap-note-panel-title">
          <span class="title-icon">${noteIcon}</span>
          备注
        </div>
        <button class="note-panel-close">×</button>
      </div>
      
      <textarea 
        class="note-panel-content" 
        placeholder="添加节点备注..."
      >${this.escapeHtml(combinedNote)}</textarea>
      
      <div class="markmap-note-panel-hint">修改会自动保存</div>
    `;

    this.panel.innerHTML = html;

    // Add event listeners
    const closeBtn = this.panel.querySelector(
      '.note-panel-close',
    ) as HTMLButtonElement;
    const noteTextarea = this.panel.querySelector(
      '.note-panel-content',
    ) as HTMLTextAreaElement;

    closeBtn.addEventListener('click', () => this.hide());

    // Auto-save on input
    const handleInput = () => {
      if (this.currentNode && this.onSave) {
        const content = noteTextarea.value.trim();

        // Parse the content to separate inline and detailed notes
        // First line becomes inline note, rest becomes detailed note
        const lines = content.split('\n');
        const firstLine = lines[0] || '';
        const restLines = lines.slice(1).join('\n').trim();

        // If there's only one line, it's an inline note
        // If there are multiple lines, first line is inline, rest is detailed
        const inlineNote = firstLine;
        const detailedNote = restLines;

        this.onSave(this.currentNode, inlineNote, detailedNote);
      }
    };

    noteTextarea.addEventListener('input', handleInput);

    // Auto-resize textarea based on content
    const autoResize = () => {
      noteTextarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(noteTextarea.scrollHeight, 40), 300);
      noteTextarea.style.height = `${newHeight}px`;
    };
    noteTextarea.addEventListener('input', autoResize);
    // Initial resize
    setTimeout(autoResize, 0);

    // Prevent clicks inside panel from propagating
    this.panel.addEventListener('mousedown', (e) => e.stopPropagation());
    this.panel.addEventListener('click', (e) => e.stopPropagation());

    // Add to document
    document.body.appendChild(this.panel);

    // Adjust position if panel goes off screen
    this.adjustPosition();
  }

  /**
   * Hide the note panel without triggering onClose callback.
   * Used internally when switching between nodes.
   */
  private hideWithoutCallback(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.currentNode = null;
  }

  /**
   * Hide the note panel.
   *
   * Requirements:
   * - 5.6: Close note panel when requested
   */
  hide(): void {
    this.hideWithoutCallback();

    // Call onClose callback to trigger re-render
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * Check if panel is currently visible.
   */
  isVisible(): boolean {
    return this.panel !== null;
  }

  /**
   * Get the node currently being displayed.
   */
  getCurrentNode(): INode | null {
    return this.currentNode;
  }

  /**
   * Adjust panel position to keep it within viewport.
   */
  private adjustPosition(): void {
    if (!this.panel) return;

    const rect = this.panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = parseFloat(this.panel.style.left);
    let top = parseFloat(this.panel.style.top);

    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      left = viewportWidth - rect.width - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // Adjust vertical position
    if (rect.bottom > viewportHeight) {
      top = viewportHeight - rect.height - 20;
    }
    if (top < 20) {
      top = 20;
    }

    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  /**
   * Escape HTML special characters.
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
