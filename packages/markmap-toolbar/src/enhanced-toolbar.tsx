import type { Markmap } from 'markmap-view';
import { Toolbar, IToolbarItem } from './toolbar';
import { ExportMenu, ExportFormat } from './export-menu';
import { ColorPicker } from './color-picker';
import './enhanced-style.css';

export interface EnhancedToolbarOptions {
  position?: 'top' | 'bottom';
  showSearch?: boolean;
  showExpandCollapse?: boolean;
  showExport?: boolean;
  showColorPicker?: boolean;
  showBrand?: boolean;
  showSettings?: boolean;
}

export interface EnhancedToolbarCallbacks {
  onSearch?: (keyword: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onExport?: (format: 'png' | 'jpg' | 'svg' | 'markdown') => void;
  onColorSchemeChange?: (scheme: string) => void;
  onSettings?: () => void;
}

/**
 * EnhancedToolbar - Excalidraw 风格的增强工具栏
 *
 * 提供以下功能：
 * - 水平布局，位于界面顶部
 * - 居中显示主要功能按钮（展开全部、折叠全部、导出）
 * - 支持搜索框、颜色主题选择器等扩展组件
 *
 * Requirements: 9.1, 9.2
 */
export class EnhancedToolbar extends Toolbar {
  private options: EnhancedToolbarOptions;
  private callbacks: EnhancedToolbarCallbacks;
  private container: HTMLElement | null = null;
  private exportMenu: ExportMenu | null = null;
  private colorPicker: ColorPicker | null = null;
  private brandElement: HTMLElement | null = null;
  private settingsElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isSmallScreen: boolean = false;

  constructor(
    options: EnhancedToolbarOptions = {},
    callbacks: EnhancedToolbarCallbacks = {},
  ) {
    super();

    // 设置默认选项
    this.options = {
      position: 'top',
      showSearch: true,
      showExpandCollapse: true,
      showExport: true,
      showColorPicker: true,
      showBrand: false, // 默认不显示品牌标识
      showSettings: false, // 默认不显示设置按钮
      ...options,
    };

    this.callbacks = callbacks;

    // 不显示默认的品牌标识（将在右上角单独显示）
    this.showBrand = false;

    // 设置增强工具栏的默认项
    this.setupEnhancedItems();
  }

  /**
   * 设置增强工具栏的默认项
   * 包括展开全部、折叠全部、导出等按钮
   *
   * Requirements: 9.2, 9.7
   */
  private setupEnhancedItems() {
    const items: (string | IToolbarItem)[] = [];

    // 添加展开/折叠按钮
    // Requirements: 9.2, 9.7 - 在工具栏中显示展开全部和折叠全部按钮
    if (this.options.showExpandCollapse) {
      // 重新注册展开全部按钮，使用自定义回调
      this.register({
        id: 'expandAll',
        title: '展开全部',
        content: Toolbar.icon('M10 2v6h-6v2h6v6h2v-6h6v-2h-6v-6z'),
        onClick: () => {
          if (this.callbacks.onExpandAll) {
            this.callbacks.onExpandAll();
          }
        },
      });

      // 重新注册折叠全部按钮，使用自定义回调
      this.register({
        id: 'collapseAll',
        title: '折叠全部',
        content: Toolbar.icon('M4 9h12v2h-12z'),
        onClick: () => {
          if (this.callbacks.onCollapseAll) {
            this.callbacks.onCollapseAll();
          }
        },
      });

      items.push('expandAll', 'collapseAll');
    }

    // 导出按钮将通过 ExportMenu 组件单独渲染
    // Requirements: 9.2, 9.5

    // 添加其他默认项
    items.push('fit', 'zoomIn', 'zoomOut');

    this.setItems(items);
  }

  /**
   * 创建增强工具栏实例
   * @param mm Markmap 实例
   * @param options 工具栏选项
   * @param callbacks 回调函数
   *
   * Requirements: 9.2, 9.7
   */
  static create(
    mm: Markmap,
    options?: EnhancedToolbarOptions,
    callbacks?: EnhancedToolbarCallbacks,
  ): EnhancedToolbar {
    // 如果没有提供回调函数，使用 Markmap 实例的方法作为默认回调
    const defaultCallbacks: EnhancedToolbarCallbacks = {
      onExpandAll: () => mm.expandAll(),
      onCollapseAll: () => mm.collapseAll(),
      ...callbacks,
    };

    const toolbar = new EnhancedToolbar(options, defaultCallbacks);
    toolbar.attach(mm);
    return toolbar;
  }

  /**
   * 创建导出菜单
   * Requirements: 9.2, 9.5
   */
  private createExportMenu(): ExportMenu {
    const exportMenu = new ExportMenu({
      formats: ['png', 'jpg', 'svg', 'markdown'],
      position: 'bottom',
    });

    // 设置导出回调
    exportMenu.onExport = (format: ExportFormat) => {
      if (this.callbacks.onExport) {
        this.callbacks.onExport(format);
      }
    };

    return exportMenu;
  }

  /**
   * 渲染增强工具栏
   * 创建一个包含工具栏的容器，应用 Excalidraw 风格
   */
  render(): HTMLDivElement {
    // 如果 options 还没有初始化（在构造函数中首次调用时），直接返回父类渲染结果
    // 这种情况发生在父类构造函数调用 render() 时，此时子类构造函数还没有完成
    if (!this.options) {
      return super.render();
    }

    // 调用父类的 render 方法获取工具栏元素
    const toolbarEl = super.render();

    // 添加增强工具栏的样式类
    toolbarEl.classList.add('mm-enhanced-toolbar');

    // 根据位置选项添加相应的类
    if (this.options.position === 'bottom') {
      toolbarEl.classList.add('mm-enhanced-toolbar-bottom');
    } else {
      toolbarEl.classList.add('mm-enhanced-toolbar-top');
    }

    // 初始化响应式布局监听（仅在第一次渲染时）
    // Requirements: 11.7 - 在小屏幕设备上调整工具栏布局
    if (!this.resizeObserver) {
      this.initResponsiveLayout();
    }

    return toolbarEl;
  }

  /**
   * 创建品牌标识元素
   * Requirements: 9.4 - 在右上角显示品牌标识
   */
  private createBrandElement(): HTMLElement {
    const brand = document.createElement('div');
    brand.className = 'mm-toolbar-brand-corner';
    brand.innerHTML = `
      <a href="https://markmap.js.org/" target="_blank" rel="noopener noreferrer" class="mm-brand-link">
        <img
          alt="markmap"
          class="mm-brand-logo"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAACoFBMVEUAAAAAAAD//wAAAACAgAD//wAAAABVVQCqqgBAQACAQACAgABmZgBtbQAAAABgQABgYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaFQAAAAAAAAAAAAAAAAAHAAARBQIdGAIYEwI/OgJYUQUfHQI+OgJDPgJJRARBPQRJQgRRSwRRTQRIQQRUTgRUUARZUgRSTQRPSQRjWgZORQRfWQZsZAhTTQRNRwRWUAZkXAZOSARUTgZPRwRRSQRoYwZWUQZWTgRbUwZmXQZoXghmXwdqYwdsYwdfVwVmXQdqYgdiWgVpYAl3bgl6cgl4cAqLggw8OAOWjA2Uig1OSAR2bQihlg55cAh5cAh6cQmMgwyOhAyUjA2QhQ2Uiw2Viw2soBCflA+voxGwpRGhlg+hlg+snxGroBGjmBCpnBC0pxKyphKxpRG2qhK0qBK5rBK5rBP/7h3/8B7/8R3/8h3/8R7/8h786x397B3+7R3EtxT66Rz66hz76hz86xz96xz97Bz+7Rz45xz56Bz76hz97Bz97B3MvRX15Rv25Rv45xz66Rz76hz97B3+7R3IuxX05Bv15Bv25Rz56Bz66Ry/sxPAsxPCtRTCthTNvxbZyxfczxfi0xjl1Rnn2Bnr2xrr3Brs3Rru3Rru3xrv3hrw3xrx4Bvx4Rvy4hvz4hvz4xv04xv05Bv14xv15Bv15Rv25Bv25Rv25Rz25hv35hv35xv45xv45xz55xz56Bv56Bz66Rv66Rz76Rv76Rz76hz86hv86xz+7h3/7R3/7h3/7x3/8B3/8B7/8R3/8R4Yqhj5AAAAq3RSTlMAAQECAgIDAwMEBAQFBwgICAwQERITFRYXGBkbHB0eHyQlJyguNTg8RUZISU5PV2FiY2RlZmdqa2xubnJzc3R2d3d3eXl5eXp7fH1+gIGCgoKDg4SEhIWGh4eHiYmJjIyMjZSUlJ+sra+zt7i4uru8ztHV1tbW2d7g4OHi4uPk5ufp7Ozv9fX29/f3+Pj6+vr7+/v7+/v7+/z8/Pz8/f39/f39/f3+/v7+/v7K6J1dAAACHklEQVQ4y2NgwAoYWdi5uLm5GXHIcrLCmMzYpDmAhKCKjoGtp40MFhVsDAwSxmmVEzZu2XvqSLkchjw3g0h445Ybd24vmTN1Usd5X3R5DgaNqgN35sycP2/GxMkTMRVwMOivvtO3YsWUm3duX790EcMKdgbNNXdnnJh1+9T6ipzU+FB0RzIyiFYB5WdfaElUF8TmTQ6GwH39J2bvypMHcpg4MAKKkUGo5s6KWRfyGRh4WJClGEGBCgS8DLobliy/3abMwM8NBYwQjXDgf3ryxOspyKYyg+RFTFwdnYDAzbrw+oLFm9Ot3J3AwNHFTBykQrhg++GDh48cOXzk4P6VZy8s230MyAGCwwcP7iyRBJpiur1n8hQIWHX27NkLi6bAwOSuow5ABeY7OydOhoCFIAULe6E8YFCf8QAqEC86evniZTA4tfLsuRXHr0E4ly9ePF0uC3KnpH1MZBQQxPoVgxyZ5RMdBQaRMc6yIEcihWbQGaA3k9G8CfQoN0pAtSoxCMACihk9qGtBQZ2LHtRIkRUMiqwd2TJADiswsrjQlAGju/o+MLrPNkWo8mFN1ewMWmvBCebQ0rKMJG87QzF0FRwMRuvugpLcrXu3rp7Zs61UCtMZ2nVHbk+fMX/+jMmTp3Sf9MLiULG45q277txaPG3yxPYrYQzYMo60RWbD3E27Ll68Uq+AK+uJqOlZBiSEKGLNnMA0iDfzwrI/NKgBOivk9piPdtUAAAAASUVORK5CYII="
        />
        <span class="mm-brand-text">markmap</span>
      </a>
    `;
    return brand;
  }

  /**
   * 创建设置按钮元素
   * Requirements: 9.4 - 在右上角显示设置按钮
   */
  private createSettingsElement(): HTMLElement {
    const settings = document.createElement('div');
    settings.className = 'mm-toolbar-settings-corner';
    settings.title = '设置';
    settings.innerHTML = `
      <button class="mm-settings-button">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path fill="currentColor" d="M10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
          <path fill="currentColor" d="M11.5 2h-3l-.5 2.5c-.5.2-1 .4-1.4.7L4 4l-1.5 2.6 2 1.7c-.1.4-.1.9-.1 1.4s0 1 .1 1.4l-2 1.7L4 16l2.6-1.2c.4.3.9.5 1.4.7l.5 2.5h3l.5-2.5c.5-.2 1-.4 1.4-.7L16 16l1.5-2.6-2-1.7c.1-.4.1-.9.1-1.4s0-1-.1-1.4l2-1.7L16 4l-2.6 1.2c-.4-.3-.9-.5-1.4-.7L11.5 2zm-1 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
        </svg>
      </button>
    `;

    // 添加点击事件
    const button = settings.querySelector('.mm-settings-button');
    if (button) {
      button.addEventListener('click', () => {
        if (this.callbacks.onSettings) {
          this.callbacks.onSettings();
        }
      });
    }

    return settings;
  }

  /**
   * 渲染品牌标识
   * Requirements: 9.4
   */
  private renderBrand(): void {
    if (!this.options.showBrand) return;

    // 销毁旧的品牌元素（如果存在）
    if (this.brandElement && this.brandElement.parentNode) {
      this.brandElement.parentNode.removeChild(this.brandElement);
    }

    // 创建新的品牌元素
    this.brandElement = this.createBrandElement();

    // 将品牌元素添加到 body（固定在右上角）
    document.body.appendChild(this.brandElement);
  }

  /**
   * 渲染设置按钮
   * Requirements: 9.4
   */
  private renderSettings(): void {
    if (!this.options.showSettings) return;

    // 销毁旧的设置元素（如果存在）
    if (this.settingsElement && this.settingsElement.parentNode) {
      this.settingsElement.parentNode.removeChild(this.settingsElement);
    }

    // 创建新的设置元素
    this.settingsElement = this.createSettingsElement();

    // 将设置元素添加到 body（固定在右上角，品牌标识左侧）
    document.body.appendChild(this.settingsElement);
  }

  /**
   * 渲染子组件（导出菜单、颜色选择器、品牌标识和设置按钮）
   * 这个方法应该在 render() 之后调用
   */
  private renderSubComponents(): void {
    if (!this.el) return;

    // 渲染导出菜单
    this.renderExportMenu();

    // 渲染颜色选择器
    this.renderColorPicker();

    // 渲染品牌标识和设置按钮（固定在右上角）
    this.renderBrand();
    this.renderSettings();
  }

  /**
   * 渲染并附加导出菜单
   * Requirements: 9.2, 9.5
   */
  private renderExportMenu(): void {
    if (!this.options.showExport || !this.el) return;

    // 销毁旧的导出菜单（如果存在）
    if (this.exportMenu) {
      this.exportMenu.destroy();
    }

    // 创建新的导出菜单
    this.exportMenu = this.createExportMenu();
    const exportMenuEl = this.exportMenu.render();

    // 将导出菜单插入到工具栏中（在其他按钮之后）
    this.el.appendChild(exportMenuEl);
  }

  /**
   * 创建颜色选择器
   * Requirements: 9.2, 10.1, 10.2
   */
  private createColorPicker(): ColorPicker {
    const colorPicker = new ColorPicker({
      position: 'bottom',
    });

    // 设置颜色方案切换回调
    colorPicker.onColorSchemeChange = (scheme: string) => {
      if (this.callbacks.onColorSchemeChange) {
        this.callbacks.onColorSchemeChange(scheme);
      }
    };

    return colorPicker;
  }

  /**
   * 渲染并附加颜色选择器
   * Requirements: 9.2, 10.1
   */
  private renderColorPicker(): void {
    if (!this.options.showColorPicker || !this.el) return;

    // 销毁旧的颜色选择器（如果存在）
    if (this.colorPicker) {
      this.colorPicker.destroy();
    }

    // 创建新的颜色选择器
    this.colorPicker = this.createColorPicker();
    const colorPickerEl = this.colorPicker.render();

    // 将颜色选择器插入到工具栏中（在导出菜单之后）
    this.el.appendChild(colorPickerEl);
  }

  /**
   * 重写 attach 方法以渲染子组件
   */
  attach(mm: any): void {
    super.attach(mm);

    // 渲染子组件
    this.renderSubComponents();
  }

  /**
   * 将工具栏附加到指定的容器元素
   * @param container 容器元素
   */
  attachToContainer(container: HTMLElement): void {
    this.container = container;
    const toolbarEl = this.render();
    container.appendChild(toolbarEl);

    // 渲染子组件
    this.renderSubComponents();
  }

  /**
   * 初始化响应式布局
   * Requirements: 11.7 - 在小屏幕设备上调整工具栏布局
   */
  private initResponsiveLayout(): void {
    // 检查初始屏幕尺寸
    this.checkScreenSize();

    // 监听窗口大小变化
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
      window.addEventListener(
        'orientationchange',
        this.handleOrientationChange,
      );
    }
  }

  /**
   * 检查屏幕尺寸并更新状态
   * Requirements: 11.7
   */
  private checkScreenSize = (): void => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const wasSmallScreen = this.isSmallScreen;

    // 定义小屏幕阈值（640px）
    this.isSmallScreen = width <= 640;

    // 如果屏幕尺寸状态改变，更新布局
    if (wasSmallScreen !== this.isSmallScreen) {
      this.updateResponsiveLayout();
    }
  };

  /**
   * 处理窗口大小变化
   * Requirements: 11.7
   */
  private handleResize = (): void => {
    this.checkScreenSize();
  };

  /**
   * 处理屏幕方向变化
   * Requirements: 11.6, 11.7
   */
  private handleOrientationChange = (): void => {
    // 延迟检查，等待方向变化完成
    setTimeout(() => {
      this.checkScreenSize();
    }, 100);
  };

  /**
   * 更新响应式布局
   * Requirements: 11.7
   */
  private updateResponsiveLayout(): void {
    if (!this.el) return;

    // 根据屏幕尺寸调整工具栏布局
    if (this.isSmallScreen) {
      // 小屏幕：使用紧凑布局
      this.el.classList.add('mm-toolbar-compact');
    } else {
      // 大屏幕：使用标准布局
      this.el.classList.remove('mm-toolbar-compact');
    }

    // 触发重新渲染子组件
    this.renderSubComponents();
  }

  /**
   * 销毁工具栏，清理资源
   */
  destroy(): void {
    // 清理响应式布局监听器
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener(
        'orientationchange',
        this.handleOrientationChange,
      );
    }

    // 销毁 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 销毁导出菜单
    if (this.exportMenu) {
      this.exportMenu.destroy();
      this.exportMenu = null;
    }

    // 销毁颜色选择器
    if (this.colorPicker) {
      this.colorPicker.destroy();
      this.colorPicker = null;
    }

    // 销毁品牌标识
    if (this.brandElement && this.brandElement.parentNode) {
      this.brandElement.parentNode.removeChild(this.brandElement);
      this.brandElement = null;
    }

    // 销毁设置按钮
    if (this.settingsElement && this.settingsElement.parentNode) {
      this.settingsElement.parentNode.removeChild(this.settingsElement);
      this.settingsElement = null;
    }

    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.container = null;
  }

  /**
   * 更新工具栏选项
   * @param options 新的选项
   */
  updateOptions(options: Partial<EnhancedToolbarOptions>): void {
    this.options = { ...this.options, ...options };
    this.setupEnhancedItems();
    this.render();
  }

  /**
   * 设置回调函数
   * @param callbacks 回调函数
   */
  setCallbacks(callbacks: Partial<EnhancedToolbarCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}
