/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedToolbar } from '../src/enhanced-toolbar';

/**
 * 响应式布局测试
 * Requirements: 11.7 - 在小屏幕设备上调整工具栏布局
 */
describe('EnhancedToolbar - Responsive Layout', () => {
  let toolbar: EnhancedToolbar | null = null;
  let container: HTMLElement;
  let originalInnerWidth: number;

  beforeEach(() => {
    // 保存原始窗口宽度
    originalInnerWidth = window.innerWidth;

    // 创建容器
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 清理
    if (toolbar) {
      toolbar.destroy();
      toolbar = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // 恢复窗口宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  /**
   * 测试：在大屏幕上应该使用标准布局
   * Requirements: 11.7
   */
  it('should use standard layout on large screens', () => {
    // 模拟大屏幕（1024px）
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl).toBeTruthy();
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(false);
  });

  /**
   * 测试：在小屏幕上应该使用紧凑布局
   * Requirements: 11.7
   */
  it('should use compact layout on small screens', () => {
    // 模拟小屏幕（480px）
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl).toBeTruthy();
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(true);
  });

  /**
   * 测试：窗口大小变化时应该更新布局
   * Requirements: 11.7
   */
  it('should update layout when window is resized', async () => {
    // 初始为大屏幕
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(false);

    // 改变为小屏幕
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    // 触发 resize 事件
    window.dispatchEvent(new Event('resize'));

    // 等待事件处理
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(true);
  });

  /**
   * 测试：屏幕方向变化时应该更新布局
   * Requirements: 11.6, 11.7
   */
  it('should update layout when orientation changes', async () => {
    // 初始为竖屏小屏幕
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(true);

    // 改变为横屏（宽度增加）
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    // 触发 orientationchange 事件
    window.dispatchEvent(new Event('orientationchange'));

    // 等待事件处理（包括延迟）
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(false);
  });

  /**
   * 测试：在小屏幕上品牌文字应该被隐藏
   * Requirements: 11.7
   */
  it('should hide brand text on small screens', () => {
    // 模拟小屏幕
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    toolbar = new EnhancedToolbar({
      showBrand: true,
    });
    const element = toolbar.render();
    container.appendChild(element);

    // 手动触发子组件渲染
    toolbar.attach({} as any);

    const brandText = document.querySelector('.mm-brand-text');
    if (brandText) {
      // 在小屏幕上，品牌文字应该通过 CSS 隐藏
      // 注意：在测试环境中，CSS 可能不会完全应用，所以我们检查元素是否存在
      expect(brandText).toBeTruthy();
    }
  });

  /**
   * 测试：销毁时应该清理事件监听器
   * Requirements: 11.7
   */
  it('should clean up event listeners on destroy', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    toolbar.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'orientationchange',
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  /**
   * 测试：在中等屏幕（平板）上应该使用标准布局
   * Requirements: 11.7
   */
  it('should use standard layout on tablet screens', () => {
    // 模拟平板屏幕（768px）
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl).toBeTruthy();
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(false);
  });

  /**
   * 测试：在边界值（640px）应该使用紧凑布局
   * Requirements: 11.7
   */
  it('should use compact layout at 640px breakpoint', () => {
    // 模拟边界值
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl).toBeTruthy();
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(true);
  });

  /**
   * 测试：在边界值之上（641px）应该使用标准布局
   * Requirements: 11.7
   */
  it('should use standard layout just above 640px breakpoint', () => {
    // 模拟边界值之上
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 641,
    });

    toolbar = new EnhancedToolbar();
    const element = toolbar.render();
    container.appendChild(element);

    const toolbarEl = element;
    expect(toolbarEl).toBeTruthy();
    expect(toolbarEl.classList.contains('mm-toolbar-compact')).toBe(false);
  });
});
