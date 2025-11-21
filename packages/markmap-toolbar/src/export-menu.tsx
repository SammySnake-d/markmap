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
}

export interface ExportMenuItem {
  format: ExportFormat;
  label: string;
  icon: string;
}

export class ExportMenu {
  private container: HTMLElement | null = null;
  private menu: HTMLElement | null = null;
  private isOpen: boolean = false;
  private options: ExportMenuOptions;

  // 回调函数
  onExport: ((format: ExportFormat) => void) | null = null;

  // 默认导出选项
  private static readonly DEFAULT_ITEMS: ExportMenuItem[] = [
    {
      format: 'png',
      label: 'Export as PNG',
      icon: 'M3 3h14v14h-14z M5 5v10h10v-10z',
    },
    {
      format: 'jpg',
      label: 'Export as JPG',
      icon: 'M3 3h14v14h-14z M5 5v10h10v-10z',
    },
    {
      format: 'svg',
      label: 'Export as SVG',
      icon: 'M3 3h14v14h-14z M7 7l6 3l-6 3z',
    },
    {
      format: 'markdown',
      label: 'Export as Markdown',
      icon: 'M3 5h14v10h-14z M6 8v4l2-2l2 2v-4 M12 8l2 2l-2 2',
    },
  ];

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
    const { formats, position } = this.options;

    // 过滤出需要显示的导出项
    const items = ExportMenu.DEFAULT_ITEMS.filter((item) =>
      formats?.includes(item.format),
    );

    // 创建菜单容器
    this.container = mountDom(
      <div class="mm-export-menu">
        {/* 触发按钮 */}
        <button
          class="mm-export-trigger"
          onClick={() => this.toggle()}
          title="Export"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 3h-2v8h-4l5 5 5-5h-4zM3 15h14v2h-14z" />
          </svg>
          <span class="mm-export-label">Export</span>
          <svg
            class="mm-export-arrow"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M2 4l4 4 4-4z" />
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
