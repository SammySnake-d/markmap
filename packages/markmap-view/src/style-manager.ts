/**
 * StyleManager - 样式管理器
 *
 * 提供动态样式注册和管理功能，类似 Typora 的主题系统
 * 允许开发者独立替换各个扩展功能的样式
 *
 * @example
 * ```typescript
 * const styleManager = new StyleManager();
 *
 * // 注册自定义右键菜单样式
 * styleManager.register('context-menu', customContextMenuCSS);
 *
 * // 注册自定义备注面板样式
 * styleManager.register('note-panel', customNotePanelCSS);
 *
 * // 移除某个样式模块
 * styleManager.unregister('context-menu');
 *
 * // 获取所有已注册的样式模块
 * const modules = styleManager.getModules();
 * ```
 */

export type StyleModule =
  | 'core'
  | 'context-menu'
  | 'note-panel'
  | 'search'
  | 'storage-warning'
  | string;

export interface StyleManagerOptions {
  /** 样式容器的 ID 前缀 */
  prefix?: string;
  /** 是否自动注入到 document */
  autoInject?: boolean;
}

export class StyleManager {
  private styles: Map<StyleModule, string> = new Map();
  private styleElements: Map<StyleModule, HTMLStyleElement> = new Map();
  private prefix: string;
  private autoInject: boolean;

  constructor(options: StyleManagerOptions = {}) {
    this.prefix = options.prefix || 'markmap-style';
    this.autoInject = options.autoInject ?? true;
  }

  /**
   * 注册样式模块
   *
   * @param module - 样式模块名称
   * @param css - CSS 样式内容
   * @returns this - 支持链式调用
   *
   * @example
   * ```typescript
   * styleManager.register('context-menu', `
   *   .markmap-context-menu {
   *     background: #333;
   *     border-radius: 12px;
   *   }
   * `);
   * ```
   */
  register(module: StyleModule, css: string): this {
    this.styles.set(module, css);

    if (this.autoInject && typeof document !== 'undefined') {
      this.injectStyle(module, css);
    }

    return this;
  }

  /**
   * 移除样式模块
   *
   * @param module - 样式模块名称
   * @returns this - 支持链式调用
   */
  unregister(module: StyleModule): this {
    this.styles.delete(module);

    const styleEl = this.styleElements.get(module);
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
      this.styleElements.delete(module);
    }

    return this;
  }

  /**
   * 更新样式模块
   *
   * @param module - 样式模块名称
   * @param css - 新的 CSS 样式内容
   * @returns this - 支持链式调用
   */
  update(module: StyleModule, css: string): this {
    this.styles.set(module, css);

    const styleEl = this.styleElements.get(module);
    if (styleEl) {
      styleEl.textContent = css;
    } else if (this.autoInject && typeof document !== 'undefined') {
      this.injectStyle(module, css);
    }

    return this;
  }

  /**
   * 获取样式模块内容
   *
   * @param module - 样式模块名称
   * @returns CSS 样式内容，如果不存在则返回 undefined
   */
  get(module: StyleModule): string | undefined {
    return this.styles.get(module);
  }

  /**
   * 检查样式模块是否已注册
   *
   * @param module - 样式模块名称
   * @returns 是否已注册
   */
  has(module: StyleModule): boolean {
    return this.styles.has(module);
  }

  /**
   * 获取所有已注册的样式模块名称
   *
   * @returns 样式模块名称数组
   */
  getModules(): StyleModule[] {
    return Array.from(this.styles.keys());
  }

  /**
   * 获取所有样式的合并内容
   *
   * @returns 合并后的 CSS 样式内容
   */
  getAllStyles(): string {
    return Array.from(this.styles.values()).join('\n\n');
  }

  /**
   * 注入样式到 document
   *
   * @param module - 样式模块名称
   * @param css - CSS 样式内容
   */
  private injectStyle(module: StyleModule, css: string): void {
    // 移除旧的样式元素
    const existingEl = this.styleElements.get(module);
    if (existingEl && existingEl.parentNode) {
      existingEl.parentNode.removeChild(existingEl);
    }

    // 创建新的样式元素
    const styleEl = document.createElement('style');
    styleEl.id = `${this.prefix}-${module}`;
    styleEl.setAttribute('data-markmap-style', module);
    styleEl.textContent = css;

    // 插入到 head
    document.head.appendChild(styleEl);
    this.styleElements.set(module, styleEl);
  }

  /**
   * 从文件 URL 加载样式
   *
   * @param module - 样式模块名称
   * @param url - CSS 文件 URL
   * @returns Promise
   *
   * @example
   * ```typescript
   * await styleManager.loadFromURL('context-menu', '/styles/my-context-menu.css');
   * ```
   */
  async loadFromURL(module: StyleModule, url: string): Promise<this> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load style from ${url}: ${response.statusText}`,
      );
    }
    const css = await response.text();
    return this.register(module, css);
  }

  /**
   * 清除所有样式
   */
  clear(): void {
    for (const [module] of this.styles) {
      this.unregister(module);
    }
  }

  /**
   * 销毁样式管理器
   */
  destroy(): void {
    this.clear();
  }
}

// 默认样式管理器实例
export const defaultStyleManager = new StyleManager();
