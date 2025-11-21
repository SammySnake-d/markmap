/**
 * Unit tests for ExportMenu component
 *
 * Requirements:
 * - 9.2: Display export button in toolbar
 * - 9.5: Show export options menu (PNG, JPG, SVG, Markdown)
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { ExportMenu, ExportMenuOptions } from '../src/export-menu';

describe('ExportMenu', () => {
  let exportMenu: ExportMenu;

  afterEach(() => {
    if (exportMenu) {
      exportMenu.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create export menu with default options', () => {
      exportMenu = new ExportMenu();

      expect(exportMenu).toBeDefined();
      expect(exportMenu.onExport).toBeNull();
    });

    it('should create export menu with custom options', () => {
      const options: ExportMenuOptions = {
        formats: ['png', 'svg'],
        position: 'top',
      };

      exportMenu = new ExportMenu(options);

      expect(exportMenu).toBeDefined();
    });

    it('should use default formats when not provided', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(4); // png, jpg, svg, markdown
    });

    it('should use custom formats when provided', () => {
      exportMenu = new ExportMenu({ formats: ['png', 'svg'] });
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(2);
    });
  });

  describe('Rendering (Requirements 9.2)', () => {
    it('should render export menu element', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      expect(element).toBeDefined();
      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('mm-export-menu')).toBe(true);
    });

    it('should render trigger button', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const trigger = element.querySelector('.mm-export-trigger');
      expect(trigger).toBeDefined();
      expect(trigger?.tagName).toBe('BUTTON');
    });

    it('should render export label', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const label = element.querySelector('.mm-export-label');
      expect(label).toBeDefined();
      expect(label?.textContent).toBe('Export');
    });

    it('should render dropdown menu', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const dropdown = element.querySelector('.mm-export-dropdown');
      expect(dropdown).toBeDefined();
    });

    it('should hide dropdown menu initially', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;
      // Check if display is set to none (either inline or via CSS)
      const computedDisplay =
        dropdown.style.display || window.getComputedStyle(dropdown).display;
      expect(computedDisplay).toBe('none');
    });

    it('should render dropdown with bottom position by default', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const dropdown = element.querySelector('.mm-export-dropdown');
      expect(dropdown?.classList.contains('mm-export-dropdown-bottom')).toBe(
        true,
      );
    });

    it('should render dropdown with top position when specified', () => {
      exportMenu = new ExportMenu({ position: 'top' });
      const element = exportMenu.render();

      const dropdown = element.querySelector('.mm-export-dropdown');
      expect(dropdown?.classList.contains('mm-export-dropdown-top')).toBe(true);
    });
  });

  describe('Menu Items (Requirements 9.5)', () => {
    it('should render all default export formats', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(4);
    });

    it('should render PNG export option', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const pngItem = items.find((item) => item.textContent?.includes('PNG'));

      expect(pngItem).toBeDefined();
    });

    it('should render JPG export option', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const jpgItem = items.find((item) => item.textContent?.includes('JPG'));

      expect(jpgItem).toBeDefined();
    });

    it('should render SVG export option', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const svgItem = items.find((item) => item.textContent?.includes('SVG'));

      expect(svgItem).toBeDefined();
    });

    it('should render Markdown export option', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const markdownItem = items.find((item) =>
        item.textContent?.includes('Markdown'),
      );

      expect(markdownItem).toBeDefined();
    });

    it('should render only specified formats', () => {
      exportMenu = new ExportMenu({ formats: ['png', 'markdown'] });
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(2);

      const itemTexts = Array.from(items).map((item) => item.textContent);
      expect(itemTexts.some((text) => text?.includes('PNG'))).toBe(true);
      expect(itemTexts.some((text) => text?.includes('Markdown'))).toBe(true);
      expect(itemTexts.some((text) => text?.includes('JPG'))).toBe(false);
      expect(itemTexts.some((text) => text?.includes('SVG'))).toBe(false);
    });

    it('should render icons for each menu item', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      items.forEach((item) => {
        const icon = item.querySelector('svg');
        expect(icon).toBeDefined();
      });
    });
  });

  describe('Menu Toggle', () => {
    it('should open menu when trigger is clicked', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;

      trigger.click();

      expect(dropdown.style.display).toBe('block');
    });

    it('should close menu when trigger is clicked again', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      trigger.click();
      expect(dropdown.style.display).toBe('none');
    });

    it('should add open class when menu is opened', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;

      trigger.click();

      expect(element.classList.contains('mm-export-menu-open')).toBe(true);
    });

    it('should remove open class when menu is closed', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;

      trigger.click();
      trigger.click();

      expect(element.classList.contains('mm-export-menu-open')).toBe(false);
    });

    it('should close menu when clicking outside', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();
      document.body.appendChild(element);

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      // Click outside
      document.body.click();

      expect(dropdown.style.display).toBe('none');

      document.body.removeChild(element);
    });

    it('should not close menu when clicking inside', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();
      document.body.appendChild(element);

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      // Click inside dropdown
      dropdown.click();

      expect(dropdown.style.display).toBe('block');

      document.body.removeChild(element);
    });
  });

  describe('Export Functionality', () => {
    it('should trigger onExport callback when PNG is clicked', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport;

      const element = exportMenu.render();
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const pngItem = items.find((item) =>
        item.textContent?.includes('PNG'),
      ) as HTMLElement;

      pngItem.click();

      expect(onExport).toHaveBeenCalledWith('png');
    });

    it('should trigger onExport callback when JPG is clicked', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport;

      const element = exportMenu.render();
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const jpgItem = items.find((item) =>
        item.textContent?.includes('JPG'),
      ) as HTMLElement;

      jpgItem.click();

      expect(onExport).toHaveBeenCalledWith('jpg');
    });

    it('should trigger onExport callback when SVG is clicked', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport;

      const element = exportMenu.render();
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const svgItem = items.find((item) =>
        item.textContent?.includes('SVG'),
      ) as HTMLElement;

      svgItem.click();

      expect(onExport).toHaveBeenCalledWith('svg');
    });

    it('should trigger onExport callback when Markdown is clicked', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport;

      const element = exportMenu.render();
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const markdownItem = items.find((item) =>
        item.textContent?.includes('Markdown'),
      ) as HTMLElement;

      markdownItem.click();

      expect(onExport).toHaveBeenCalledWith('markdown');
    });

    it('should close menu after export is triggered', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport;

      const element = exportMenu.render();
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const pngItem = items[0] as HTMLElement;
      pngItem.click();

      expect(dropdown.style.display).toBe('none');
    });

    it('should not throw when onExport is not set', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const pngItem = items[0] as HTMLElement;

      expect(() => {
        pngItem.click();
      }).not.toThrow();
    });
  });

  describe('Destroy', () => {
    it('should remove element from DOM on destroy', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();
      document.body.appendChild(element);

      expect(document.body.contains(element)).toBe(true);

      exportMenu.destroy();

      expect(document.body.contains(element)).toBe(false);
    });

    it('should remove event listeners on destroy', () => {
      exportMenu = new ExportMenu();
      const element = exportMenu.render();
      document.body.appendChild(element);

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      exportMenu.destroy();

      // Click outside should not cause errors
      expect(() => {
        document.body.click();
      }).not.toThrow();
    });

    it('should clear callback on destroy', () => {
      exportMenu = new ExportMenu();
      exportMenu.onExport = vi.fn();

      exportMenu.destroy();

      expect(exportMenu.onExport).toBeNull();
    });

    it('should handle destroy when not attached to DOM', () => {
      exportMenu = new ExportMenu();
      exportMenu.render();

      expect(() => {
        exportMenu.destroy();
      }).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      exportMenu = new ExportMenu();
      exportMenu.render();

      expect(() => {
        exportMenu.destroy();
        exportMenu.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options object', () => {
      exportMenu = new ExportMenu({});
      const element = exportMenu.render();

      expect(element).toBeDefined();
    });

    it('should handle empty formats array', () => {
      exportMenu = new ExportMenu({ formats: [] });
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(0);
    });

    it('should handle single format', () => {
      exportMenu = new ExportMenu({ formats: ['png'] });
      const element = exportMenu.render();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(1);
    });

    it('should handle multiple renders', () => {
      exportMenu = new ExportMenu();

      const element1 = exportMenu.render();
      const element2 = exportMenu.render();
      const element3 = exportMenu.render();

      expect(element1).toBeDefined();
      expect(element2).toBeDefined();
      expect(element3).toBeDefined();
    });

    it('should handle callback changes after render', () => {
      const onExport1 = vi.fn();
      const onExport2 = vi.fn();

      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport1;

      const element = exportMenu.render();
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const pngItem = items[0] as HTMLElement;
      pngItem.click();

      expect(onExport1).toHaveBeenCalledWith('png');
      expect(onExport2).not.toHaveBeenCalled();

      exportMenu.onExport = onExport2;

      trigger.click();
      pngItem.click();

      expect(onExport2).toHaveBeenCalledWith('png');
      expect(onExport1).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should work with complete export workflow', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu();
      exportMenu.onExport = onExport;

      const element = exportMenu.render();
      document.body.appendChild(element);

      // User clicks trigger to open menu
      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const dropdown = element.querySelector(
        '.mm-export-dropdown',
      ) as HTMLElement;
      expect(dropdown.style.display).toBe('block');

      // User selects PNG export
      const items = Array.from(element.querySelectorAll('.mm-export-item'));
      const pngItem = items.find((item) =>
        item.textContent?.includes('PNG'),
      ) as HTMLElement;
      pngItem.click();

      expect(onExport).toHaveBeenCalledWith('png');
      expect(dropdown.style.display).toBe('none');

      // User opens menu again and clicks outside to close
      trigger.click();
      expect(dropdown.style.display).toBe('block');

      document.body.click();
      expect(dropdown.style.display).toBe('none');

      document.body.removeChild(element);
    });

    it('should work with custom formats workflow', () => {
      const onExport = vi.fn();
      exportMenu = new ExportMenu({ formats: ['svg', 'markdown'] });
      exportMenu.onExport = onExport;

      const element = exportMenu.render();

      const trigger = element.querySelector(
        '.mm-export-trigger',
      ) as HTMLElement;
      trigger.click();

      const items = element.querySelectorAll('.mm-export-item');
      expect(items.length).toBe(2);

      const svgItem = Array.from(items).find((item) =>
        item.textContent?.includes('SVG'),
      ) as HTMLElement;
      svgItem.click();

      expect(onExport).toHaveBeenCalledWith('svg');
    });
  });
});
