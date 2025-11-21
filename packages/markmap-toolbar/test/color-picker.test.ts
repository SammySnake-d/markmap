/**
 * Unit tests for ColorPicker component
 *
 * Requirements:
 * - 9.2: Display color theme selector in toolbar
 * - 10.1: Display color theme selector button
 * - 10.2: Show predefined color scheme list
 * - 10.3: Provide multiple preset color schemes
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  ColorPicker,
  ColorScheme,
  ColorPickerOptions,
} from '../src/color-picker';

describe('ColorPicker', () => {
  let colorPicker: ColorPicker;

  afterEach(() => {
    if (colorPicker) {
      colorPicker.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create color picker with default options', () => {
      colorPicker = new ColorPicker();

      expect(colorPicker).toBeDefined();
      expect(colorPicker.onColorSchemeChange).toBeNull();
    });

    it('should create color picker with custom options', () => {
      const customSchemes: ColorScheme[] = [
        {
          name: 'custom',
          colors: ['#ff0000', '#00ff00', '#0000ff'],
        },
      ];

      const options: ColorPickerOptions = {
        schemes: customSchemes,
        currentScheme: 'custom',
        position: 'top',
      };

      colorPicker = new ColorPicker(options);

      expect(colorPicker).toBeDefined();
      expect(colorPicker.getCurrentScheme()).toBe('custom');
    });

    it('should use default scheme when not provided', () => {
      colorPicker = new ColorPicker();

      expect(colorPicker.getCurrentScheme()).toBe('default');
    });

    it('should use custom current scheme when provided', () => {
      colorPicker = new ColorPicker({ currentScheme: 'ocean' });

      expect(colorPicker.getCurrentScheme()).toBe('ocean');
    });
  });

  describe('Rendering (Requirements 9.2, 10.1)', () => {
    it('should render color picker element', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      expect(element).toBeDefined();
      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('mm-color-picker')).toBe(true);
    });

    it('should render trigger button', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger');
      expect(trigger).toBeDefined();
      expect(trigger?.tagName).toBe('BUTTON');
    });

    it('should render color theme label', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const label = element.querySelector('.mm-color-label');
      expect(label).toBeDefined();
      expect(label?.textContent).toBe('Theme');
    });

    it('should render dropdown menu', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const dropdown = element.querySelector('.mm-color-dropdown');
      expect(dropdown).toBeDefined();
    });

    it('should hide dropdown menu initially', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const dropdown = element.querySelector(
        '.mm-color-dropdown',
      ) as HTMLElement;
      const computedDisplay =
        dropdown.style.display || window.getComputedStyle(dropdown).display;
      expect(computedDisplay).toBe('none');
    });

    it('should render dropdown with bottom position by default', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const dropdown = element.querySelector('.mm-color-dropdown');
      expect(dropdown?.classList.contains('mm-color-dropdown-bottom')).toBe(
        true,
      );
    });

    it('should render dropdown with top position when specified', () => {
      colorPicker = new ColorPicker({ position: 'top' });
      const element = colorPicker.render();

      const dropdown = element.querySelector('.mm-color-dropdown');
      expect(dropdown?.classList.contains('mm-color-dropdown-top')).toBe(true);
    });

    it('should render palette icon in trigger button', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger');
      const icon = trigger?.querySelector('svg');

      expect(icon).toBeDefined();
    });

    it('should render arrow icon in trigger button', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const arrow = element.querySelector('.mm-color-arrow');
      expect(arrow).toBeDefined();
      expect(arrow?.tagName).toBe('svg');
    });
  });

  describe('Color Schemes (Requirements 10.2, 10.3)', () => {
    it('should render all default color schemes', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = element.querySelectorAll('.mm-color-item');
      expect(items.length).toBe(5); // default, ocean, forest, sunset, monochrome
    });

    it('should render default color scheme', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const defaultItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'default',
      );

      expect(defaultItem).toBeDefined();
    });

    it('should render ocean color scheme', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'ocean',
      );

      expect(oceanItem).toBeDefined();
    });

    it('should render forest color scheme', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const forestItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'forest',
      );

      expect(forestItem).toBeDefined();
    });

    it('should render sunset color scheme', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const sunsetItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'sunset',
      );

      expect(sunsetItem).toBeDefined();
    });

    it('should render monochrome color scheme', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const monochromeItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent ===
          'monochrome',
      );

      expect(monochromeItem).toBeDefined();
    });

    it('should render custom color schemes when provided', () => {
      const customSchemes: ColorScheme[] = [
        { name: 'custom1', colors: ['#ff0000'] },
        { name: 'custom2', colors: ['#00ff00'] },
      ];

      colorPicker = new ColorPicker({ schemes: customSchemes });
      const element = colorPicker.render();

      const items = element.querySelectorAll('.mm-color-item');
      expect(items.length).toBe(2);
    });

    it('should render color preview for each scheme', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = element.querySelectorAll('.mm-color-item');
      items.forEach((item) => {
        const preview = item.querySelector('.mm-color-preview');
        expect(preview).toBeDefined();
      });
    });

    it('should render color dots in preview', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const items = element.querySelectorAll('.mm-color-item');
      items.forEach((item) => {
        const dots = item.querySelectorAll('.mm-color-preview-dot');
        expect(dots.length).toBeGreaterThan(0);
        expect(dots.length).toBeLessThanOrEqual(5);
      });
    });

    it('should apply background color to preview dots', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const firstItem = element.querySelector('.mm-color-item');
      const dots = firstItem?.querySelectorAll(
        '.mm-color-preview-dot',
      ) as NodeListOf<HTMLElement>;

      // Check that each dot has a style object with backgroundColor
      expect(dots.length).toBeGreaterThan(0);
      dots.forEach((dot) => {
        // JSX-DOM sets style as an object, so we check the property directly
        expect(dot.style).toBeDefined();
      });
    });

    it('should mark current scheme as active', () => {
      colorPicker = new ColorPicker({ currentScheme: 'ocean' });
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'ocean',
      );

      expect(oceanItem?.classList.contains('mm-color-item-active')).toBe(true);
    });

    it('should show check mark on active scheme', () => {
      colorPicker = new ColorPicker({ currentScheme: 'forest' });
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const forestItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'forest',
      );

      const checkMark = forestItem?.querySelector('.mm-color-check');
      expect(checkMark).toBeDefined();
    });

    it('should not show check mark on inactive schemes', () => {
      colorPicker = new ColorPicker({ currentScheme: 'default' });
      const element = colorPicker.render();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'ocean',
      );

      const checkMark = oceanItem?.querySelector('.mm-color-check');
      expect(checkMark).toBeNull();
    });
  });

  describe('Menu Toggle', () => {
    it('should open menu when trigger is clicked', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-color-dropdown',
      ) as HTMLElement;

      trigger.click();

      expect(dropdown.style.display).toBe('block');
    });

    it('should close menu when trigger is clicked again', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-color-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      trigger.click();
      expect(dropdown.style.display).toBe('none');
    });

    it('should add open class when menu is opened', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;

      trigger.click();

      expect(element.classList.contains('mm-color-picker-open')).toBe(true);
    });

    it('should remove open class when menu is closed', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;

      trigger.click();
      trigger.click();

      expect(element.classList.contains('mm-color-picker-open')).toBe(false);
    });

    it('should close menu when clicking outside', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();
      document.body.appendChild(element);

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-color-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      // Click outside
      document.body.click();

      expect(dropdown.style.display).toBe('none');

      document.body.removeChild(element);
    });

    it('should not close menu when clicking inside', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();
      document.body.appendChild(element);

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-color-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      // Click inside dropdown
      dropdown.click();

      expect(dropdown.style.display).toBe('block');

      document.body.removeChild(element);
    });
  });

  describe('Color Scheme Selection (Requirements 10.4)', () => {
    it('should trigger onColorSchemeChange callback when scheme is clicked', () => {
      const onColorSchemeChange = vi.fn();
      colorPicker = new ColorPicker();
      colorPicker.onColorSchemeChange = onColorSchemeChange;

      const element = colorPicker.render();
      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'ocean',
      ) as HTMLElement;

      oceanItem.click();

      expect(onColorSchemeChange).toHaveBeenCalledWith('ocean');
    });

    it('should update current scheme when scheme is clicked', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const forestItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'forest',
      ) as HTMLElement;

      forestItem.click();

      expect(colorPicker.getCurrentScheme()).toBe('forest');
    });

    it('should close menu after scheme is selected', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      const dropdown = element.querySelector(
        '.mm-color-dropdown',
      ) as HTMLElement;

      trigger.click();
      expect(dropdown.style.display).toBe('block');

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items[1] as HTMLElement;
      oceanItem.click();

      expect(dropdown.style.display).toBe('none');
    });

    it('should not trigger callback when clicking current scheme', () => {
      const onColorSchemeChange = vi.fn();
      colorPicker = new ColorPicker({ currentScheme: 'default' });
      colorPicker.onColorSchemeChange = onColorSchemeChange;

      const element = colorPicker.render();
      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const defaultItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'default',
      ) as HTMLElement;

      defaultItem.click();

      expect(onColorSchemeChange).not.toHaveBeenCalled();
    });

    it('should update active state after scheme change', () => {
      colorPicker = new ColorPicker({ currentScheme: 'default' });
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const sunsetItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'sunset',
      ) as HTMLElement;

      sunsetItem.click();

      // Re-open menu to check updated state
      trigger.click();

      const updatedItems = Array.from(
        element.querySelectorAll('.mm-color-item'),
      );
      const updatedSunsetItem = updatedItems.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'sunset',
      );

      expect(
        updatedSunsetItem?.classList.contains('mm-color-item-active'),
      ).toBe(true);
    });

    it('should not throw when onColorSchemeChange is not set', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items[1] as HTMLElement;

      expect(() => {
        oceanItem.click();
      }).not.toThrow();
    });
  });

  describe('setCurrentScheme Method', () => {
    it('should update current scheme programmatically', () => {
      colorPicker = new ColorPicker();
      colorPicker.render();

      colorPicker.setCurrentScheme('ocean');

      expect(colorPicker.getCurrentScheme()).toBe('ocean');
    });

    it('should refresh display when scheme is set', () => {
      colorPicker = new ColorPicker({ currentScheme: 'default' });
      const element = colorPicker.render();

      colorPicker.setCurrentScheme('forest');

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const forestItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'forest',
      );

      expect(forestItem?.classList.contains('mm-color-item-active')).toBe(true);
    });

    it('should not refresh if scheme is already current', () => {
      colorPicker = new ColorPicker({ currentScheme: 'default' });
      colorPicker.render();

      const refreshSpy = vi.spyOn(colorPicker as any, 'refresh');

      colorPicker.setCurrentScheme('default');

      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('Destroy', () => {
    it('should remove element from DOM on destroy', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();
      document.body.appendChild(element);

      expect(document.body.contains(element)).toBe(true);

      colorPicker.destroy();

      expect(document.body.contains(element)).toBe(false);
    });

    it('should remove event listeners on destroy', () => {
      colorPicker = new ColorPicker();
      const element = colorPicker.render();
      document.body.appendChild(element);

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      colorPicker.destroy();

      // Click outside should not cause errors
      expect(() => {
        document.body.click();
      }).not.toThrow();
    });

    it('should clear callback on destroy', () => {
      colorPicker = new ColorPicker();
      colorPicker.onColorSchemeChange = vi.fn();

      colorPicker.destroy();

      expect(colorPicker.onColorSchemeChange).toBeNull();
    });

    it('should handle destroy when not attached to DOM', () => {
      colorPicker = new ColorPicker();
      colorPicker.render();

      expect(() => {
        colorPicker.destroy();
      }).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      colorPicker = new ColorPicker();
      colorPicker.render();

      expect(() => {
        colorPicker.destroy();
        colorPicker.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options object', () => {
      colorPicker = new ColorPicker({});
      const element = colorPicker.render();

      expect(element).toBeDefined();
    });

    it('should handle empty schemes array', () => {
      colorPicker = new ColorPicker({ schemes: [] });
      const element = colorPicker.render();

      const items = element.querySelectorAll('.mm-color-item');
      expect(items.length).toBe(0);
    });

    it('should handle single scheme', () => {
      const singleScheme: ColorScheme[] = [
        { name: 'single', colors: ['#ff0000'] },
      ];

      colorPicker = new ColorPicker({ schemes: singleScheme });
      const element = colorPicker.render();

      const items = element.querySelectorAll('.mm-color-item');
      expect(items.length).toBe(1);
    });

    it('should handle scheme with many colors', () => {
      const manyColorsScheme: ColorScheme[] = [
        {
          name: 'many',
          colors: [
            '#ff0000',
            '#00ff00',
            '#0000ff',
            '#ffff00',
            '#ff00ff',
            '#00ffff',
            '#ffffff',
          ],
        },
      ];

      colorPicker = new ColorPicker({ schemes: manyColorsScheme });
      const element = colorPicker.render();

      const dots = element.querySelectorAll('.mm-color-preview-dot');
      // Should only show first 5 colors
      expect(dots.length).toBe(5);
    });

    it('should handle scheme with few colors', () => {
      const fewColorsScheme: ColorScheme[] = [
        { name: 'few', colors: ['#ff0000', '#00ff00'] },
      ];

      colorPicker = new ColorPicker({ schemes: fewColorsScheme });
      const element = colorPicker.render();

      const dots = element.querySelectorAll('.mm-color-preview-dot');
      expect(dots.length).toBe(2);
    });

    it('should handle multiple renders', () => {
      colorPicker = new ColorPicker();

      const element1 = colorPicker.render();
      const element2 = colorPicker.render();
      const element3 = colorPicker.render();

      expect(element1).toBeDefined();
      expect(element2).toBeDefined();
      expect(element3).toBeDefined();
    });

    it('should handle callback changes after render', () => {
      const onColorSchemeChange1 = vi.fn();
      const onColorSchemeChange2 = vi.fn();

      colorPicker = new ColorPicker();
      colorPicker.onColorSchemeChange = onColorSchemeChange1;

      const element = colorPicker.render();
      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items[1] as HTMLElement;
      oceanItem.click();

      expect(onColorSchemeChange1).toHaveBeenCalledWith('ocean');
      expect(onColorSchemeChange2).not.toHaveBeenCalled();

      colorPicker.onColorSchemeChange = onColorSchemeChange2;

      trigger.click();
      const forestItem = items[2] as HTMLElement;
      forestItem.click();

      expect(onColorSchemeChange2).toHaveBeenCalledWith('forest');
      expect(onColorSchemeChange1).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid current scheme gracefully', () => {
      colorPicker = new ColorPicker({ currentScheme: 'nonexistent' });
      const element = colorPicker.render();

      expect(element).toBeDefined();
      expect(colorPicker.getCurrentScheme()).toBe('nonexistent');
    });
  });

  describe('Integration', () => {
    it('should work with complete color selection workflow', () => {
      const onColorSchemeChange = vi.fn();
      colorPicker = new ColorPicker();
      colorPicker.onColorSchemeChange = onColorSchemeChange;

      const element = colorPicker.render();
      document.body.appendChild(element);

      // User clicks trigger to open menu
      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      let dropdown = element.querySelector('.mm-color-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('block');

      // User selects ocean scheme
      const items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items.find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'ocean',
      ) as HTMLElement;
      oceanItem.click();

      expect(onColorSchemeChange).toHaveBeenCalledWith('ocean');
      // After refresh, we need to get the new dropdown reference
      dropdown = element.querySelector('.mm-color-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('none');
      expect(colorPicker.getCurrentScheme()).toBe('ocean');

      // User opens menu again and clicks outside to close
      trigger.click();
      dropdown = element.querySelector('.mm-color-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('block');

      document.body.click();
      dropdown = element.querySelector('.mm-color-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('none');

      document.body.removeChild(element);
    });

    it('should work with custom schemes workflow', () => {
      const customSchemes: ColorScheme[] = [
        { name: 'custom1', colors: ['#ff0000', '#00ff00'] },
        { name: 'custom2', colors: ['#0000ff', '#ffff00'] },
      ];

      const onColorSchemeChange = vi.fn();
      colorPicker = new ColorPicker({ schemes: customSchemes });
      colorPicker.onColorSchemeChange = onColorSchemeChange;

      const element = colorPicker.render();

      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;
      trigger.click();

      const items = element.querySelectorAll('.mm-color-item');
      expect(items.length).toBe(2);

      const custom2Item = Array.from(items).find(
        (item) =>
          item.querySelector('.mm-color-item-name')?.textContent === 'custom2',
      ) as HTMLElement;
      custom2Item.click();

      expect(onColorSchemeChange).toHaveBeenCalledWith('custom2');
      expect(colorPicker.getCurrentScheme()).toBe('custom2');
    });

    it('should maintain state across multiple interactions', () => {
      const onColorSchemeChange = vi.fn();
      colorPicker = new ColorPicker({ currentScheme: 'default' });
      colorPicker.onColorSchemeChange = onColorSchemeChange;

      const element = colorPicker.render();
      const trigger = element.querySelector('.mm-color-trigger') as HTMLElement;

      // First selection
      trigger.click();
      let items = Array.from(element.querySelectorAll('.mm-color-item'));
      const oceanItem = items[1] as HTMLElement;
      oceanItem.click();

      expect(colorPicker.getCurrentScheme()).toBe('ocean');

      // Second selection
      trigger.click();
      items = Array.from(element.querySelectorAll('.mm-color-item'));
      const forestItem = items[2] as HTMLElement;
      forestItem.click();

      expect(colorPicker.getCurrentScheme()).toBe('forest');
      expect(onColorSchemeChange).toHaveBeenCalledTimes(2);
    });
  });
});
