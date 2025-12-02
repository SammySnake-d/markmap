/**
 * Context Menu Component
 *
 * Requirements:
 * - 8.4: Display context menu on node right-click with "Copy as Markdown", "Expand All", and "Collapse All" options
 */

import { INode } from 'markmap-common';

/**
 * Lucide SVG Icons - 内联 SVG 确保无外部依赖
 * 图标来源: https://lucide.dev
 * 使用 currentColor 支持主题色适配
 */
export const ICONS = {
  // 复制
  copy: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  // 展开全部
  expand: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`,
  // 折叠全部
  collapse: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>`,
  // 图片导出
  image: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  // 图片下载
  imageDown: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 19"/><circle cx="9" cy="9" r="2"/><path d="m21 19-3-3"/><path d="m21 16v5h-5"/></svg>`,
  // 代码文件 (SVG)
  fileCode: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>`,
  // 文本文件 (Markdown)
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  // 备注图标 - notebook-pen (Lucide)
  note: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide-note"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>`,
};

export interface ContextMenuOptions {
  onCopyAsMarkdown?: (node: INode) => void;
  onExpandAll?: (node: INode) => void;
  onCollapseAll?: (node: INode) => void;
  onExportPNG?: () => void;
  onExportJPG?: () => void;
  onExportSVG?: () => void;
  onExportMarkdown?: () => void;
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
    // 样式通过 CSS 类控制，参见 style.css
    menu.style.display = 'none';
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

    // Create menu items with Lucide SVG icons
    const items = [
      {
        label: '复制为 Markdown',
        icon: ICONS.copy,
        shortcut: '⌘C',
        action: () => this.handleCopyAsMarkdown(),
      },
      {
        label: '展开全部',
        icon: ICONS.expand,
        action: () => this.handleExpandAll(),
      },
      {
        label: '折叠全部',
        icon: ICONS.collapse,
        action: () => this.handleCollapseAll(),
      },
    ];

    this.renderMenuItems(items, x, y);
  }

  /**
   * Show canvas context menu at specified position
   *
   * Requirements:
   * - 8.5: Display canvas-level context menu on canvas right-click with export options
   */
  showCanvasMenu(x: number, y: number): void {
    this.currentNode = null;
    this.container.innerHTML = '';

    // Create canvas menu items with export options using Lucide SVG icons
    const items = [
      {
        label: '导出为 PNG',
        icon: ICONS.image,
        shortcut: '⌘E',
        action: () => this.handleExportPNG(),
      },
      {
        label: '导出为 JPG',
        icon: ICONS.imageDown,
        action: () => this.handleExportJPG(),
      },
      {
        label: '导出为 SVG',
        icon: ICONS.fileCode,
        action: () => this.handleExportSVG(),
      },
      {
        label: '导出为 Markdown',
        icon: ICONS.fileText,
        action: () => this.handleExportMarkdown(),
      },
    ];

    this.renderMenuItems(items, x, y);
  }

  /**
   * Render menu items at specified position
   *
   * @param items - Array of menu items to render
   * @param x - X coordinate for menu position
   * @param y - Y coordinate for menu position
   */
  private renderMenuItems(
    items: Array<{
      label: string;
      icon: string;
      shortcut?: string;
      action: () => void;
    }>,
    x: number,
    y: number,
  ): void {
    items.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'markmap-context-menu-item';

      // 使用 SVG 图标
      menuItem.innerHTML = `
        <span class="menu-icon">${item.icon}</span>
        <span class="menu-label">${item.label}</span>
        ${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ''}
      `;

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
   * Handle "Export as PNG" action
   *
   * Requirements:
   * - 8.5: Provide export options in canvas context menu
   */
  private handleExportPNG(): void {
    if (this.options.onExportPNG) {
      this.options.onExportPNG();
    }
  }

  /**
   * Handle "Export as JPG" action
   *
   * Requirements:
   * - 8.5: Provide export options in canvas context menu
   */
  private handleExportJPG(): void {
    if (this.options.onExportJPG) {
      this.options.onExportJPG();
    }
  }

  /**
   * Handle "Export as SVG" action
   *
   * Requirements:
   * - 8.5: Provide export options in canvas context menu
   */
  private handleExportSVG(): void {
    if (this.options.onExportSVG) {
      this.options.onExportSVG();
    }
  }

  /**
   * Handle "Export as Markdown" action
   *
   * Requirements:
   * - 8.5: Provide export options in canvas context menu
   */
  private handleExportMarkdown(): void {
    if (this.options.onExportMarkdown) {
      this.options.onExportMarkdown();
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
