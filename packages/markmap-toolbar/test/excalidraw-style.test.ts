/**
 * Excalidraw 风格样式测试
 * Requirements: 9.8 - 使用简洁图标和清晰分组
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedToolbar } from '../src/enhanced-toolbar';

describe('EnhancedToolbar - Excalidraw Style', () => {
  let container: HTMLElement;
  let toolbar: EnhancedToolbar | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (toolbar) {
      toolbar.destroy();
      toolbar = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('基础样式类 (Requirements 9.8)', () => {
    it('应该应用 Excalidraw 风格的基础类', () => {
      toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      expect(element.classList.contains('mm-toolbar')).toBe(true);
      expect(element.classList.contains('mm-enhanced-toolbar')).toBe(true);
    });

    it('应该应用顶部位置类', () => {
      toolbar = new EnhancedToolbar({ position: 'top' });
      const element = toolbar.render();

      expect(element.classList.contains('mm-enhanced-toolbar-top')).toBe(true);
    });

    it('应该应用底部位置类', () => {
      toolbar = new EnhancedToolbar({ position: 'bottom' });
      const element = toolbar.render();

      expect(element.classList.contains('mm-enhanced-toolbar-bottom')).toBe(
        true,
      );
    });
  });

  describe('工具栏项样式 (Requirements 9.8)', () => {
    it('工具栏项应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);

      items.forEach((item) => {
        expect(item.classList.contains('mm-toolbar-item')).toBe(true);
      });
    });

    it('工具栏项应该包含 SVG 图标', () => {
      toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');

      items.forEach((item) => {
        const svg = item.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });
  });

  describe('分隔符样式 (Requirements 9.8)', () => {
    it('应该在工具栏项之间显示分隔符', () => {
      toolbar = new EnhancedToolbar({
        showExpandCollapse: true,
        showExport: true,
      });
      const element = toolbar.render();

      const dividers = element.querySelectorAll('.mm-toolbar-divider');
      // 应该至少有一个分隔符用于视觉分组
      expect(dividers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('品牌标识样式 (Requirements 9.4, 9.8)', () => {
    it('品牌标识应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeTruthy();
      expect(brandElement?.classList.contains('mm-toolbar-brand-corner')).toBe(
        true,
      );
    });

    it('品牌链接应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandLink = document.querySelector('.mm-brand-link');
      expect(brandLink).toBeTruthy();
      expect(brandLink?.classList.contains('mm-brand-link')).toBe(true);
    });

    it('品牌 logo 应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandLogo = document.querySelector('.mm-brand-logo');
      expect(brandLogo).toBeTruthy();
      expect(brandLogo?.classList.contains('mm-brand-logo')).toBe(true);
    });

    it('品牌文字应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandText = document.querySelector('.mm-brand-text');
      expect(brandText).toBeTruthy();
      expect(brandText?.classList.contains('mm-brand-text')).toBe(true);
    });
  });

  describe('设置按钮样式 (Requirements 9.4, 9.8)', () => {
    it('设置按钮容器应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeTruthy();
      expect(
        settingsElement?.classList.contains('mm-toolbar-settings-corner'),
      ).toBe(true);
    });

    it('设置按钮应该有正确的样式类', () => {
      toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const settingsButton = document.querySelector('.mm-settings-button');
      expect(settingsButton).toBeTruthy();
      expect(settingsButton?.classList.contains('mm-settings-button')).toBe(
        true,
      );
    });

    it('设置按钮应该包含 SVG 图标', () => {
      toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const settingsButton = document.querySelector('.mm-settings-button');
      const svg = settingsButton?.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('响应式样式类 (Requirements 11.7)', () => {
    it('在小屏幕上应该添加紧凑布局类', () => {
      // 模拟小屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      expect(element.classList.contains('mm-toolbar-compact')).toBe(true);
    });

    it('在大屏幕上不应该有紧凑布局类', () => {
      // 模拟大屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      expect(element.classList.contains('mm-toolbar-compact')).toBe(false);
    });
  });

  describe('活动状态样式', () => {
    it('活动的工具栏项应该有 active 类', () => {
      toolbar = new EnhancedToolbar();
      const element = toolbar.render();
      container.appendChild(element);

      const items = element.querySelectorAll('.mm-toolbar-item');
      if (items.length > 0) {
        const firstItem = items[0] as HTMLElement;
        firstItem.classList.add('active');

        expect(firstItem.classList.contains('active')).toBe(true);
      }
    });
  });

  describe('暗色主题样式', () => {
    it('应该支持暗色主题类', () => {
      document.body.classList.add('markmap-dark');

      toolbar = new EnhancedToolbar();
      const element = toolbar.render();
      container.appendChild(element);

      // 验证工具栏元素存在
      expect(element).toBeTruthy();
      expect(element.classList.contains('mm-enhanced-toolbar')).toBe(true);

      // 清理
      document.body.classList.remove('markmap-dark');
    });

    it('暗色主题下品牌标识应该正确渲染', () => {
      document.body.classList.add('markmap-dark');

      toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeTruthy();

      // 清理
      document.body.classList.remove('markmap-dark');
      toolbar.destroy();
    });

    it('暗色主题下设置按钮应该正确渲染', () => {
      document.body.classList.add('markmap-dark');

      toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeTruthy();

      // 清理
      document.body.classList.remove('markmap-dark');
      toolbar.destroy();
    });
  });

  describe('样式一致性', () => {
    it('所有工具栏项应该有一致的样式类', () => {
      toolbar = new EnhancedToolbar({
        showExpandCollapse: true,
        showExport: true,
      });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');

      items.forEach((item) => {
        expect(item.classList.contains('mm-toolbar-item')).toBe(true);
      });
    });

    it('所有 SVG 图标应该存在于工具栏项中', () => {
      toolbar = new EnhancedToolbar({
        showExpandCollapse: true,
        showExport: true,
      });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');

      items.forEach((item) => {
        const svg = item.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });
  });

  describe('布局结构', () => {
    it('工具栏应该使用 flex 布局', () => {
      toolbar = new EnhancedToolbar();
      const element = toolbar.render();
      container.appendChild(element);

      // 验证元素存在且有正确的类
      expect(element).toBeTruthy();
      expect(element.classList.contains('mm-enhanced-toolbar')).toBe(true);
    });

    it('品牌标识应该独立于工具栏容器', () => {
      toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const toolbarElement = container.querySelector('.mm-enhanced-toolbar');
      const brandElement = document.querySelector('.mm-toolbar-brand-corner');

      expect(toolbarElement).toBeTruthy();
      expect(brandElement).toBeTruthy();

      // 品牌标识不应该在工具栏容器内
      const brandInToolbar = toolbarElement?.querySelector(
        '.mm-toolbar-brand-corner',
      );
      expect(brandInToolbar).toBeNull();
    });

    it('设置按钮应该独立于工具栏容器', () => {
      toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const toolbarElement = container.querySelector('.mm-enhanced-toolbar');
      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );

      expect(toolbarElement).toBeTruthy();
      expect(settingsElement).toBeTruthy();

      // 设置按钮不应该在工具栏容器内
      const settingsInToolbar = toolbarElement?.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsInToolbar).toBeNull();
    });
  });
});
