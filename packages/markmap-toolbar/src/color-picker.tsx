import { mountDom } from '@gera2ld/jsx-dom';
import './color-picker.css';

/**
 * ColorPicker - 颜色主题选择器组件
 *
 * 提供颜色主题选择菜单，类似 XMind 的连线颜色选择
 *
 * Requirements: 9.2, 10.1, 10.2, 10.3
 */

export interface ColorScheme {
  name: string;
  colors: string[];
  linkColor?: string;
  highlightColor?: string;
}

export interface ColorPickerOptions {
  schemes?: ColorScheme[];
  currentScheme?: string;
  position?: 'bottom' | 'top';
}

export class ColorPicker {
  private container: HTMLElement | null = null;
  private menu: HTMLElement | null = null;
  private isOpen: boolean = false;
  private options: ColorPickerOptions;
  private currentScheme: string;

  // 回调函数
  onColorSchemeChange: ((scheme: string) => void) | null = null;

  // 默认颜色方案
  private static readonly DEFAULT_SCHEMES: ColorScheme[] = [
    {
      name: 'default',
      colors: ['#5e6ad2', '#26b5ce', '#f9c52a', '#f98e52', '#e55e5e'],
    },
    {
      name: 'ocean',
      colors: ['#006d77', '#83c5be', '#edf6f9', '#ffddd2', '#e29578'],
    },
    {
      name: 'forest',
      colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
    },
    {
      name: 'sunset',
      colors: ['#ff6b6b', '#ee5a6f', '#c44569', '#774c60', '#2d4059'],
    },
    {
      name: 'monochrome',
      colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7'],
    },
  ];

  constructor(options: ColorPickerOptions = {}) {
    this.options = {
      schemes: ColorPicker.DEFAULT_SCHEMES,
      currentScheme: 'default',
      position: 'bottom',
      ...options,
    };

    this.currentScheme = this.options.currentScheme || 'default';
  }

  /**
   * 渲染颜色选择器
   * Requirements: 10.1, 10.2
   */
  render(): HTMLElement {
    const { schemes, position } = this.options;

    // 创建菜单容器
    this.container = mountDom(
      <div class="mm-color-picker">
        {/* 触发按钮 */}
        <button
          class="mm-color-trigger"
          onClick={() => this.toggle()}
          title="Color Theme"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2c-4.42 0-8 3.58-8 8s3.58 8 8 8c.55 0 1-.45 1-1 0-.26-.1-.51-.27-.7-.17-.19-.27-.44-.27-.7 0-.55.45-1 1-1h1.18c2.44 0 4.42-1.98 4.42-4.42 0-3.87-3.58-7.18-7.06-7.18zm-5.5 8c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
          <span class="mm-color-label">Theme</span>
          <svg
            class="mm-color-arrow"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M2 4l4 4 4-4z" />
          </svg>
        </button>

        {/* 下拉菜单 */}
        <div class={`mm-color-dropdown mm-color-dropdown-${position}`}>
          {schemes?.map((scheme) => this.renderSchemeItem(scheme))}
        </div>
      </div>,
    ) as HTMLElement;

    // 保存菜单引用并设置初始隐藏状态
    this.menu = this.container.querySelector(
      '.mm-color-dropdown',
    ) as HTMLElement;
    if (this.menu) {
      this.menu.style.display = 'none';
    }

    // 点击外部关闭菜单
    document.addEventListener('click', this.handleOutsideClick);

    return this.container;
  }

  /**
   * 渲染单个颜色方案项
   * Requirements: 10.3
   */
  private renderSchemeItem(scheme: ColorScheme): HTMLElement {
    const isActive = scheme.name === this.currentScheme;

    return mountDom(
      <button
        class={`mm-color-item ${isActive ? 'mm-color-item-active' : ''}`}
        onClick={() => this.handleSchemeChange(scheme.name)}
        title={scheme.name}
      >
        {/* 颜色方案名称 */}
        <span class="mm-color-item-name">{scheme.name}</span>

        {/* 颜色预览 */}
        <div class="mm-color-preview">
          {scheme.colors.slice(0, 5).map((color) => (
            <span
              class="mm-color-preview-dot"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* 选中标记 */}
        {isActive && (
          <svg
            class="mm-color-check"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M7 10l2 2 4-4"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
          </svg>
        )}
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
      this.container?.classList.add('mm-color-picker-open');
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
      this.container?.classList.remove('mm-color-picker-open');
    }
  }

  /**
   * 处理颜色方案切换
   * Requirements: 10.4
   */
  private handleSchemeChange(schemeName: string): void {
    // 先关闭菜单
    this.close();

    if (schemeName !== this.currentScheme) {
      this.currentScheme = schemeName;

      // 触发回调
      if (this.onColorSchemeChange) {
        this.onColorSchemeChange(schemeName);
      }

      // 重新渲染以更新选中状态
      this.refresh();
    }
  }

  /**
   * 刷新菜单显示
   */
  private refresh(): void {
    if (!this.container || !this.menu) return;

    // 重新渲染菜单项
    const schemes = this.options.schemes || ColorPicker.DEFAULT_SCHEMES;
    const newMenu = mountDom(
      <div
        class={`mm-color-dropdown mm-color-dropdown-${this.options.position}`}
      >
        {schemes.map((scheme) => this.renderSchemeItem(scheme))}
      </div>,
    ) as HTMLElement;

    // 保持当前打开/关闭状态
    if (!this.isOpen) {
      newMenu.style.display = 'none';
    }

    // 替换旧菜单
    if (this.menu.parentNode) {
      this.menu.parentNode.replaceChild(newMenu, this.menu);
      this.menu = newMenu;
    }
  }

  /**
   * 设置当前颜色方案
   * Requirements: 10.4
   */
  setCurrentScheme(schemeName: string): void {
    if (schemeName !== this.currentScheme) {
      this.currentScheme = schemeName;
      this.refresh();
    }
  }

  /**
   * 获取当前颜色方案
   */
  getCurrentScheme(): string {
    return this.currentScheme;
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
   * 销毁颜色选择器
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
    this.onColorSchemeChange = null;
  }
}
