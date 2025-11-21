/**
 * Context Menu Component
 *
 * Requirements:
 * - 8.4: Display context menu on node right-click with "Copy as Markdown", "Expand All", and "Collapse All" options
 */

import { INode } from 'markmap-common';

export interface ContextMenuOptions {
  onCopyAsMarkdown?: (node: INode) => void;
  onExpandAll?: (node: INode) => void;
  onCollapseAll?: (node: INode) => void;
}

export class ContextMenu {
  private container: HTMLDivElement;
  private currentNode: INode | null = null;
  private options: ContextMenuOptions;

  constructor(options: ContextMenuOptions = {}) {
    this.options = options;
    this.container = this.createContainer();
    this.setupEventListeners();
  }

  private createContainer(): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'markmap-context-menu';
    menu.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: 10000;
      display: none;
      min-width: 180px;
    `;
    document.body.appendChild(menu);
    return menu;
  }

  private setupEventListeners(): void {
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.hide();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  /**
   * Show context menu at specified position for a node
   *
   * Requirements:
   * - 8.4: Display context menu on node right-click
   */
  show(node: INode, x: number, y: number): void {
    this.currentNode = node;
    this.container.innerHTML = '';

    // Create menu items
    const items = [
      {
        label: '复制为 Markdown',
        icon: '📋',
        action: () => this.handleCopyAsMarkdown(),
      },
      {
        label: '展开全部',
        icon: '➕',
        action: () => this.handleExpandAll(),
      },
      {
        label: '折叠全部',
        icon: '➖',
        action: () => this.handleCollapseAll(),
      },
    ];

    items.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'markmap-context-menu-item';
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #333;
      `;

      menuItem.innerHTML = `
        <span style="font-size: 16px;">${item.icon}</span>
        <span>${item.label}</span>
      `;

      // Hover effect
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });

      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
        this.hide();
      });

      this.container.appendChild(menuItem);
    });

    // Position the menu
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.display = 'block';

    // Adjust position if menu goes off screen
    const rect = this.container.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.container.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.container.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  }

  /**
   * Hide the context menu
   */
  hide(): void {
    this.container.style.display = 'none';
    this.currentNode = null;
  }

  /**
   * Handle "Copy as Markdown" action
   *
   * Requirements:
   * - 8.4: Provide "Copy as Markdown" option in context menu
   */
  private handleCopyAsMarkdown(): void {
    if (this.currentNode && this.options.onCopyAsMarkdown) {
      this.options.onCopyAsMarkdown(this.currentNode);
    }
  }

  /**
   * Handle "Expand All" action
   *
   * Requirements:
   * - 8.4: Provide "Expand All" option in context menu
   */
  private handleExpandAll(): void {
    if (this.currentNode && this.options.onExpandAll) {
      this.options.onExpandAll(this.currentNode);
    }
  }

  /**
   * Handle "Collapse All" action
   *
   * Requirements:
   * - 8.4: Provide "Collapse All" option in context menu
   */
  private handleCollapseAll(): void {
    if (this.currentNode && this.options.onCollapseAll) {
      this.options.onCollapseAll(this.currentNode);
    }
  }

  /**
   * Destroy the context menu and clean up resources
   */
  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
