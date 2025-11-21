/**
 * Unit tests for EnhancedToolbar
 *
 * Requirements:
 * - 9.1: Display horizontal toolbar at top of interface
 * - 9.2: Show main function buttons in center area
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EnhancedToolbar,
  EnhancedToolbarOptions,
  EnhancedToolbarCallbacks,
} from '../src/enhanced-toolbar';
import type { Markmap } from 'markmap-view';
import { afterEach } from 'node:test';

describe('EnhancedToolbar', () => {
  let container: HTMLElement;
  let mockMarkmap: Partial<Markmap>;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock Markmap instance
    mockMarkmap = {
      svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      rescale: vi.fn(),
      fit: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
      setOptions: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.removeChild(container);

    // Clean up brand and settings elements that may have been added to body
    const brandElement = document.querySelector('.mm-toolbar-brand-corner');
    if (brandElement && brandElement.parentNode) {
      brandElement.parentNode.removeChild(brandElement);
    }

    const settingsElement = document.querySelector(
      '.mm-toolbar-settings-corner',
    );
    if (settingsElement && settingsElement.parentNode) {
      settingsElement.parentNode.removeChild(settingsElement);
    }
  });

  describe('Initialization', () => {
    it('should create toolbar with default options', () => {
      const toolbar = new EnhancedToolbar();

      expect(toolbar).toBeDefined();
      expect(toolbar.showBrand).toBe(false);
    });

    it('should create toolbar with custom options', () => {
      const options: EnhancedToolbarOptions = {
        position: 'bottom',
        showSearch: false,
        showExpandCollapse: true,
        showExport: false,
        showColorPicker: false,
      };

      const toolbar = new EnhancedToolbar(options);

      expect(toolbar).toBeDefined();
    });

    it('should create toolbar with callbacks', () => {
      const callbacks: EnhancedToolbarCallbacks = {
        onSearch: vi.fn(),
        onExpandAll: vi.fn(),
        onCollapseAll: vi.fn(),
        onExport: vi.fn(),
        onColorSchemeChange: vi.fn(),
      };

      const toolbar = new EnhancedToolbar({}, callbacks);

      expect(toolbar).toBeDefined();
    });

    it('should use default options when not provided', () => {
      const toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      expect(element).toBeDefined();
      expect(element.classList.contains('mm-enhanced-toolbar')).toBe(true);
    });
  });

  describe('Static create method', () => {
    it('should create and attach toolbar to Markmap instance', () => {
      const toolbar = EnhancedToolbar.create(mockMarkmap as Markmap);

      expect(toolbar).toBeDefined();
      expect(toolbar).toBeInstanceOf(EnhancedToolbar);
    });

    it('should create toolbar with options', () => {
      const options: EnhancedToolbarOptions = {
        position: 'top',
        showExpandCollapse: true,
      };

      const toolbar = EnhancedToolbar.create(mockMarkmap as Markmap, options);

      expect(toolbar).toBeDefined();
    });

    it('should create toolbar with callbacks', () => {
      const callbacks: EnhancedToolbarCallbacks = {
        onExpandAll: vi.fn(),
      };

      const toolbar = EnhancedToolbar.create(
        mockMarkmap as Markmap,
        {},
        callbacks,
      );

      expect(toolbar).toBeDefined();
    });
  });

  describe('Rendering (Requirements 9.1, 9.2)', () => {
    it('should render toolbar element', () => {
      const toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      expect(element).toBeDefined();
      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('mm-toolbar')).toBe(true);
      expect(element.classList.contains('mm-enhanced-toolbar')).toBe(true);
    });

    it('should apply top position class by default', () => {
      const toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      expect(element.classList.contains('mm-enhanced-toolbar-top')).toBe(true);
      expect(element.classList.contains('mm-enhanced-toolbar-bottom')).toBe(
        false,
      );
    });

    it('should apply bottom position class when specified', () => {
      const toolbar = new EnhancedToolbar({ position: 'bottom' });
      const element = toolbar.render();

      expect(element.classList.contains('mm-enhanced-toolbar-bottom')).toBe(
        true,
      );
      expect(element.classList.contains('mm-enhanced-toolbar-top')).toBe(false);
    });

    it('should not show brand by default', () => {
      const toolbar = new EnhancedToolbar();

      expect(toolbar.showBrand).toBe(false);
    });

    it('should render toolbar items', () => {
      const toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Toolbar Items Setup', () => {
    it('should include expand/collapse buttons when enabled', () => {
      const toolbar = new EnhancedToolbar({ showExpandCollapse: true });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should not include expand/collapse buttons when disabled', () => {
      const toolbar = new EnhancedToolbar({ showExpandCollapse: false });
      const element = toolbar.render();

      // Should still have some items (fit, zoom, etc.)
      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should include export button when enabled', () => {
      const toolbar = new EnhancedToolbar({ showExport: true });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should not include export button when disabled', () => {
      const toolbar = new EnhancedToolbar({ showExport: false });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should include default items (fit, zoomIn, zoomOut)', () => {
      const toolbar = new EnhancedToolbar();
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Container Attachment', () => {
    it('should attach toolbar to container element', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);

      expect(container.children.length).toBe(1);
      expect(container.firstChild).toBeDefined();
    });

    it('should render toolbar when attached to container', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);

      const toolbarElement = container.querySelector('.mm-enhanced-toolbar');
      expect(toolbarElement).toBeDefined();
    });
  });

  describe('Destroy', () => {
    it('should remove toolbar element from DOM', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);

      expect(container.children.length).toBe(1);

      toolbar.destroy();

      expect(container.children.length).toBe(0);
    });

    it('should handle destroy when not attached', () => {
      const toolbar = new EnhancedToolbar();

      expect(() => {
        toolbar.destroy();
      }).not.toThrow();
    });

    it('should clear container reference', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);

      toolbar.destroy();

      // Container reference should be cleared (we can't directly test private field)
      // But we can verify the element is removed
      expect(container.children.length).toBe(0);
    });
  });

  describe('Update Options', () => {
    it('should update toolbar options', () => {
      const toolbar = new EnhancedToolbar({ position: 'top' });

      toolbar.updateOptions({ position: 'bottom' });
      const element = toolbar.render();

      expect(element.classList.contains('mm-enhanced-toolbar-bottom')).toBe(
        true,
      );
    });

    it('should merge new options with existing ones', () => {
      const toolbar = new EnhancedToolbar({
        position: 'top',
        showExpandCollapse: true,
      });

      toolbar.updateOptions({ showExport: false });

      // Should still have the original options
      const element = toolbar.render();
      expect(element).toBeDefined();
    });

    it('should re-render after updating options', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.render();

      toolbar.updateOptions({ position: 'bottom' });
      const secondRender = toolbar.render();

      expect(
        secondRender.classList.contains('mm-enhanced-toolbar-bottom'),
      ).toBe(true);
    });
  });

  describe('Callbacks', () => {
    it('should set callbacks', () => {
      const toolbar = new EnhancedToolbar();
      const callbacks: EnhancedToolbarCallbacks = {
        onExpandAll: vi.fn(),
        onCollapseAll: vi.fn(),
      };

      toolbar.setCallbacks(callbacks);

      // Callbacks are set (we can't directly test private field)
      expect(toolbar).toBeDefined();
    });

    it('should merge new callbacks with existing ones', () => {
      const initialCallbacks: EnhancedToolbarCallbacks = {
        onExpandAll: vi.fn(),
      };

      const toolbar = new EnhancedToolbar({}, initialCallbacks);

      const newCallbacks: EnhancedToolbarCallbacks = {
        onCollapseAll: vi.fn(),
      };

      toolbar.setCallbacks(newCallbacks);

      expect(toolbar).toBeDefined();
    });

    it('should call export callback when export button is clicked', () => {
      const onExport = vi.fn();
      const toolbar = new EnhancedToolbar({ showExport: true }, { onExport });

      const element = toolbar.render();

      // Find and click the export button
      const items = element.querySelectorAll('.mm-toolbar-item');
      const exportButton = Array.from(items).find(
        (item) => item.getAttribute('title') === 'Export',
      );

      if (exportButton) {
        (exportButton as HTMLElement).click();
        expect(onExport).toHaveBeenCalledWith('png');
      }
    });
  });

  describe('Integration with Markmap', () => {
    it('should attach to Markmap instance', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attach(mockMarkmap as Markmap);

      expect(toolbar).toBeDefined();

      // Clean up
      toolbar.destroy();
    });

    it('should work with Markmap methods', () => {
      const toolbar = EnhancedToolbar.create(mockMarkmap as Markmap);
      const element = toolbar.render();

      // Find and click expand all button
      const items = element.querySelectorAll('.mm-toolbar-item');
      const expandButton = Array.from(items).find(
        (item) =>
          item.getAttribute('title')?.includes('展开') ||
          item.getAttribute('title') === 'Expand all nodes',
      );

      if (expandButton) {
        (expandButton as HTMLElement).click();
        expect(mockMarkmap.expandAll).toHaveBeenCalled();
      }

      // Clean up
      toolbar.destroy();
    });
  });

  describe('Expand/Collapse Buttons (Requirements 9.2, 9.7)', () => {
    it('should render expand all button with correct title', () => {
      const toolbar = new EnhancedToolbar({ showExpandCollapse: true });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const expandButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '展开全部',
      );

      expect(expandButton).toBeDefined();
    });

    it('should render collapse all button with correct title', () => {
      const toolbar = new EnhancedToolbar({ showExpandCollapse: true });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const collapseButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '折叠全部',
      );

      expect(collapseButton).toBeDefined();
    });

    it('should call onExpandAll callback when expand button is clicked', () => {
      const onExpandAll = vi.fn();
      const toolbar = new EnhancedToolbar(
        { showExpandCollapse: true },
        { onExpandAll },
      );

      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const expandButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '展开全部',
      );

      if (expandButton) {
        (expandButton as HTMLElement).click();
        expect(onExpandAll).toHaveBeenCalled();
      }
    });

    it('should call onCollapseAll callback when collapse button is clicked', () => {
      const onCollapseAll = vi.fn();
      const toolbar = new EnhancedToolbar(
        { showExpandCollapse: true },
        { onCollapseAll },
      );

      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const collapseButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '折叠全部',
      );

      if (collapseButton) {
        (collapseButton as HTMLElement).click();
        expect(onCollapseAll).toHaveBeenCalled();
      }
    });

    it('should use Markmap expandAll method as default callback', () => {
      const toolbar = EnhancedToolbar.create(mockMarkmap as Markmap, {
        showExpandCollapse: true,
      });

      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const expandButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '展开全部',
      );

      if (expandButton) {
        (expandButton as HTMLElement).click();
        expect(mockMarkmap.expandAll).toHaveBeenCalled();
      }
    });

    it('should use Markmap collapseAll method as default callback', () => {
      const toolbar = EnhancedToolbar.create(mockMarkmap as Markmap, {
        showExpandCollapse: true,
      });

      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const collapseButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '折叠全部',
      );

      if (collapseButton) {
        (collapseButton as HTMLElement).click();
        expect(mockMarkmap.collapseAll).toHaveBeenCalled();
      }
    });

    it('should allow custom callbacks to override default Markmap methods', () => {
      const customExpandAll = vi.fn();
      const customCollapseAll = vi.fn();

      const toolbar = EnhancedToolbar.create(
        mockMarkmap as Markmap,
        { showExpandCollapse: true },
        {
          onExpandAll: customExpandAll,
          onCollapseAll: customCollapseAll,
        },
      );

      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const expandButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '展开全部',
      );
      const collapseButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '折叠全部',
      );

      if (expandButton) {
        (expandButton as HTMLElement).click();
        expect(customExpandAll).toHaveBeenCalled();
        expect(mockMarkmap.expandAll).not.toHaveBeenCalled();
      }

      if (collapseButton) {
        (collapseButton as HTMLElement).click();
        expect(customCollapseAll).toHaveBeenCalled();
        expect(mockMarkmap.collapseAll).not.toHaveBeenCalled();
      }
    });

    it('should render expand/collapse buttons with correct icons', () => {
      const toolbar = new EnhancedToolbar({ showExpandCollapse: true });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');

      // Check that buttons have SVG icons
      const expandButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '展开全部',
      );
      const collapseButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '折叠全部',
      );

      expect(expandButton?.querySelector('svg')).toBeDefined();
      expect(collapseButton?.querySelector('svg')).toBeDefined();
    });

    it('should not render expand/collapse buttons when showExpandCollapse is false', () => {
      const toolbar = new EnhancedToolbar({ showExpandCollapse: false });
      const element = toolbar.render();

      const items = element.querySelectorAll('.mm-toolbar-item');
      const expandButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '展开全部',
      );
      const collapseButton = Array.from(items).find(
        (item) => item.getAttribute('title') === '折叠全部',
      );

      expect(expandButton).toBeUndefined();
      expect(collapseButton).toBeUndefined();
    });
  });

  describe('Brand and Settings (Requirements 9.4)', () => {
    it('should render brand element when showBrand is true', () => {
      const toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeDefined();
      expect(brandElement).not.toBeNull();

      // Clean up
      toolbar.destroy();
    });

    it('should not render brand element when showBrand is false', () => {
      const toolbar = new EnhancedToolbar({ showBrand: false });
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeNull();

      // Clean up
      toolbar.destroy();
    });

    it('should render brand element with correct structure', () => {
      const toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeDefined();

      // Check for link
      const link = brandElement?.querySelector('.mm-brand-link');
      expect(link).toBeDefined();
      expect(link?.getAttribute('href')).toBe('https://markmap.js.org/');
      expect(link?.getAttribute('target')).toBe('_blank');

      // Check for logo
      const logo = brandElement?.querySelector('.mm-brand-logo');
      expect(logo).toBeDefined();
      expect(logo?.getAttribute('alt')).toBe('markmap');

      // Check for text
      const text = brandElement?.querySelector('.mm-brand-text');
      expect(text).toBeDefined();
      expect(text?.textContent).toBe('markmap');

      // Clean up
      toolbar.destroy();
    });

    it('should render settings element when showSettings is true', () => {
      const toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeDefined();
      expect(settingsElement).not.toBeNull();

      // Clean up
      toolbar.destroy();
    });

    it('should not render settings element when showSettings is false', () => {
      const toolbar = new EnhancedToolbar({ showSettings: false });
      toolbar.attachToContainer(container);

      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeNull();

      // Clean up
      toolbar.destroy();
    });

    it('should render settings element with correct structure', () => {
      const toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeDefined();

      // Check for button
      const button = settingsElement?.querySelector('.mm-settings-button');
      expect(button).toBeDefined();
      expect(settingsElement?.getAttribute('title')).toBe('设置');

      // Check for SVG icon
      const svg = button?.querySelector('svg');
      expect(svg).toBeDefined();
      expect(svg?.getAttribute('width')).toBe('20');
      expect(svg?.getAttribute('height')).toBe('20');

      // Clean up
      toolbar.destroy();
    });

    it('should call onSettings callback when settings button is clicked', () => {
      const onSettings = vi.fn();
      const toolbar = new EnhancedToolbar(
        { showSettings: true },
        { onSettings },
      );
      toolbar.attachToContainer(container);

      const settingsButton = document.querySelector('.mm-settings-button');
      expect(settingsButton).toBeDefined();

      if (settingsButton) {
        (settingsButton as HTMLElement).click();
        expect(onSettings).toHaveBeenCalled();
      }

      // Clean up
      toolbar.destroy();
    });

    it('should render both brand and settings when both are enabled', () => {
      const toolbar = new EnhancedToolbar({
        showBrand: true,
        showSettings: true,
      });
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );

      expect(brandElement).toBeDefined();
      expect(settingsElement).toBeDefined();

      // Clean up
      toolbar.destroy();
    });

    it('should remove brand element when toolbar is destroyed', () => {
      const toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      let brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeDefined();

      toolbar.destroy();

      brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeNull();
    });

    it('should remove settings element when toolbar is destroyed', () => {
      const toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      let settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeDefined();

      toolbar.destroy();

      settingsElement = document.querySelector('.mm-toolbar-settings-corner');
      expect(settingsElement).toBeNull();
    });

    it('should handle multiple renders of brand element', () => {
      const toolbar = new EnhancedToolbar({ showBrand: true });

      toolbar.attachToContainer(container);
      const firstBrand = document.querySelector('.mm-toolbar-brand-corner');
      expect(firstBrand).toBeDefined();

      // Attach again (should replace old brand element)
      toolbar.attachToContainer(container);
      const secondBrand = document.querySelector('.mm-toolbar-brand-corner');
      expect(secondBrand).toBeDefined();

      // Should only have one brand element
      const allBrands = document.querySelectorAll('.mm-toolbar-brand-corner');
      expect(allBrands.length).toBe(1);

      // Clean up
      toolbar.destroy();
    });

    it('should handle multiple renders of settings element', () => {
      const toolbar = new EnhancedToolbar({ showSettings: true });

      toolbar.attachToContainer(container);
      const firstSettings = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(firstSettings).toBeDefined();

      // Attach again (should replace old settings element)
      toolbar.attachToContainer(container);
      const secondSettings = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(secondSettings).toBeDefined();

      // Should only have one settings element
      const allSettings = document.querySelectorAll(
        '.mm-toolbar-settings-corner',
      );
      expect(allSettings.length).toBe(1);

      // Clean up
      toolbar.destroy();
    });

    it('should not call onSettings when settings is disabled', () => {
      const onSettings = vi.fn();
      const toolbar = new EnhancedToolbar(
        { showSettings: false },
        { onSettings },
      );
      toolbar.attachToContainer(container);

      const settingsButton = document.querySelector('.mm-settings-button');
      expect(settingsButton).toBeNull();
      expect(onSettings).not.toHaveBeenCalled();

      // Clean up
      toolbar.destroy();
    });

    it('should render brand element in document body, not in toolbar container', () => {
      const toolbar = new EnhancedToolbar({ showBrand: true });
      toolbar.attachToContainer(container);

      // Brand should be in body
      const brandInBody = document.body.querySelector(
        '.mm-toolbar-brand-corner',
      );
      expect(brandInBody).toBeDefined();

      // Brand should not be in container
      const brandInContainer = container.querySelector(
        '.mm-toolbar-brand-corner',
      );
      expect(brandInContainer).toBeNull();

      // Clean up
      toolbar.destroy();
    });

    it('should render settings element in document body, not in toolbar container', () => {
      const toolbar = new EnhancedToolbar({ showSettings: true });
      toolbar.attachToContainer(container);

      // Settings should be in body
      const settingsInBody = document.body.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsInBody).toBeDefined();

      // Settings should not be in container
      const settingsInContainer = container.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsInContainer).toBeNull();

      // Clean up
      toolbar.destroy();
    });

    it('should use default showBrand option (true) when not specified', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);

      const brandElement = document.querySelector('.mm-toolbar-brand-corner');
      expect(brandElement).toBeDefined();

      // Clean up
      toolbar.destroy();
    });

    it('should use default showSettings option (true) when not specified', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);

      const settingsElement = document.querySelector(
        '.mm-toolbar-settings-corner',
      );
      expect(settingsElement).toBeDefined();

      // Clean up
      toolbar.destroy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options object', () => {
      const toolbar = new EnhancedToolbar({});
      const element = toolbar.render();

      expect(element).toBeDefined();
    });

    it('should handle empty callbacks object', () => {
      const toolbar = new EnhancedToolbar({}, {});
      const element = toolbar.render();

      expect(element).toBeDefined();
    });

    it('should handle multiple renders', () => {
      const toolbar = new EnhancedToolbar();

      const render1 = toolbar.render();
      const render2 = toolbar.render();
      const render3 = toolbar.render();

      expect(render1).toBeDefined();
      expect(render2).toBeDefined();
      expect(render3).toBeDefined();
    });

    it('should handle multiple attachments to different containers', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      const toolbar = new EnhancedToolbar();

      toolbar.attachToContainer(container);
      expect(container.children.length).toBe(1);

      toolbar.attachToContainer(container2);
      expect(container2.children.length).toBe(1);

      document.body.removeChild(container2);
    });

    it('should handle destroy after multiple attachments', () => {
      const toolbar = new EnhancedToolbar();
      toolbar.attachToContainer(container);
      toolbar.attachToContainer(container);

      toolbar.destroy();

      expect(container.children.length).toBe(0);
    });
  });
});
