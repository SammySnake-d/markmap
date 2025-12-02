import { mountDom } from '@gera2ld/jsx-dom';
import './export-menu.css';

/**
 * ExportMenu - 导出菜单组件
 *
 * 提供导出选项菜单，包含 PNG、JPG、SVG 和 Markdown 格式
 *
 * Requirements: 9.2, 9.5
 */

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'markdown';

export interface ExportMenuOptions {
  formats?: ExportFormat[];
  position?: 'bottom' | 'top';
  icons?: ExportMenuIcons; // 自定义图标
  labels?: Partial<Record<ExportFormat, string>>; // 自定义标签
  triggerLabel?: string; // 触发按钮标签
}

export interface ExportMenuItem {
  format: ExportFormat;
  label: string;
  icon: string; // SVG path 或自定义 HTML
}

export interface ExportMenuIcons {
  trigger?: string; // 触发按钮图标（SVG path）
  arrow?: string; // 箭头图标（SVG path）
  png?: string; // PNG 导出图标
  jpg?: string; // JPG 导出图标
  svg?: string; // SVG 导出图标
  markdown?: string; // Markdown 导出图标
}

export class ExportMenu {
  private container: HTMLElement | null = null;
  private menu: HTMLElement | null = null;
  private isOpen: boolean = false;
  private options: ExportMenuOptions;

  // 回调函数
  onExport: ((format: ExportFormat) => void) | null = null;

  // 默认图标
  private static readonly DEFAULT_ICONS: Required<ExportMenuIcons> = {
    trigger: 'M13 3h-2v8h-4l5 5 5-5h-4zM3 15h14v2h-14z',
    arrow: 'M2 4l4 4 4-4z',
    png: 'M3 3h14v14h-14z M5 5v10h10v-10z',
    jpg: 'M3 3h14v14h-14z M5 5v10h10v-10z',
    svg: 'M3 3h14v14h-14z M7 7l6 3l-6 3z',
    markdown: 'M3 5h14v10h-14z M6 8v4l2-2l2 2v-4 M12 8l2 2l-2 2',
  };

  // 默认标签
  private static readonly DEFAULT_LABELS: Record<ExportFormat, string> = {
    png: 'Export as PNG',
    jpg: 'Export as JPG',
    svg: 'Export as SVG',
    markdown: 'Export as Markdown',
  };

  // 获取图标
  private getIcon(format: ExportFormat): string {
    return this.options.icons?.[format] || ExportMenu.DEFAULT_ICONS[format];
  }

  // 获取标签
  private getLabel(format: ExportFormat): string {
    return this.options.labels?.[format] || ExportMenu.DEFAULT_LABELS[format];
  }

  // 获取导出项
  private getExportItems(): ExportMenuItem[] {
    const { formats } = this.options;
    return (formats || ['png', 'jpg', 'svg', 'markdown']).map((format) => ({
      format,
      label: this.getLabel(format),
      icon: this.getIcon(format),
    }));
  }

  constructor(options: ExportMenuOptions = {}) {
    this.options = {
      formats: ['png', 'jpg', 'svg', 'markdown'],
      position: 'bottom',
      ...options,
    };
  }

  /**
   * 渲染导出菜单
   */
  render(): HTMLElement {
    const { position } = this.options;

    // 获取导出项
    const items = this.getExportItems();

    // 获取图标
    const triggerIcon =
      this.options.icons?.trigger || ExportMenu.DEFAULT_ICONS.trigger;
    const arrowIcon =
      this.options.icons?.arrow || ExportMenu.DEFAULT_ICONS.arrow;
    const triggerLabel = this.options.triggerLabel || 'Export';

    // 创建菜单容器
    this.container = mountDom(
      <div class="mm-export-menu">
        {/* 触发按钮 */}
        <button
          class="mm-export-trigger"
          onClick={() => this.toggle()}
          title={triggerLabel}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d={triggerIcon} />
          </svg>
          <span class="mm-export-label">{triggerLabel}</span>
          <svg
            class="mm-export-arrow"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d={arrowIcon} />
          </svg>
        </button>

        {/* 下拉菜单 */}
        <div class={`mm-export-dropdown mm-export-dropdown-${position}`}>
          {items.map((item) => this.renderMenuItem(item))}
        </div>
      </div>,
    ) as HTMLElement;

    // 保存菜单引用并设置初始隐藏状态
    this.menu = this.container.querySelector(
      '.mm-export-dropdown',
    ) as HTMLElement;
    if (this.menu) {
      this.menu.style.display = 'none';
    }

    // 点击外部关闭菜单
    document.addEventListener('click', this.handleOutsideClick);

    return this.container;
  }

  /**
   * 渲染单个菜单项
   */
  private renderMenuItem(item: ExportMenuItem): HTMLElement {
    return mountDom(
      <button
        class="mm-export-item"
        onClick={() => this.handleExport(item.format)}
        title={item.label}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path d={item.icon} />
        </svg>
        <span>{item.label}</span>
      </button>,
    ) as HTMLElement;
  }

  /**
   * 切换菜单显示/隐藏
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 打开菜单
   */
  open(): void {
    if (this.menu && !this.isOpen) {
      this.menu.style.display = 'block';
      this.isOpen = true;

      // 添加打开状态的类
      this.container?.classList.add('mm-export-menu-open');
    }
  }

  /**
   * 关闭菜单
   */
  close(): void {
    if (this.menu && this.isOpen) {
      this.menu.style.display = 'none';
      this.isOpen = false;

      // 移除打开状态的类
      this.container?.classList.remove('mm-export-menu-open');
    }
  }

  /**
   * 处理导出操作
   */
  private handleExport(format: ExportFormat): void {
    if (this.onExport) {
      this.onExport(format);
    }
    this.close();
  }

  /**
   * 处理点击外部区域
   */
  private handleOutsideClick = (e: MouseEvent): void => {
    if (this.container && !this.container.contains(e.target as Node)) {
      this.close();
    }
  };

  /**
   * 销毁导出菜单
   */
  destroy(): void {
    // 移除事件监听器
    document.removeEventListener('click', this.handleOutsideClick);

    // 移除 DOM 元素
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.menu = null;
    this.onExport = null;
  }
}
