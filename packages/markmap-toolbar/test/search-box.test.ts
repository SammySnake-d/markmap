/**
 * Unit tests for SearchBox component
 *
 * Requirements:
 * - 9.3: Display search box in toolbar
 * - 9.6: Real-time search result updates
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchBox, SearchBoxOptions } from '../src/search-box';

describe('SearchBox', () => {
  let searchBox: SearchBox;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (searchBox) {
      searchBox.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create search box with default options', () => {
      searchBox = new SearchBox();

      expect(searchBox).toBeDefined();
      expect(searchBox.onSearch).toBeNull();
      expect(searchBox.onClear).toBeNull();
    });

    it('should create search box with custom options', () => {
      const options: SearchBoxOptions = {
        placeholder: 'Custom placeholder',
        debounceMs: 500,
        showClearButton: false,
      };

      searchBox = new SearchBox(options);

      expect(searchBox).toBeDefined();
    });

    it('should use default placeholder when not provided', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      expect(input.placeholder).toBe('Search...');
    });

    it('should use custom placeholder when provided', () => {
      searchBox = new SearchBox({ placeholder: 'Find nodes...' });
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      expect(input.placeholder).toBe('Find nodes...');
    });
  });

  describe('Rendering (Requirements 9.3)', () => {
    it('should render search box element', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      expect(element).toBeDefined();
      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('mm-search-box')).toBe(true);
    });

    it('should render search icon', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const icon = element.querySelector('.mm-search-icon');
      expect(icon).toBeDefined();
      expect(icon?.querySelector('svg')).toBeDefined();
    });

    it('should render input field', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      expect(input).toBeDefined();
      expect(input.type).toBe('text');
    });

    it('should render clear button when enabled', () => {
      searchBox = new SearchBox({ showClearButton: true });
      const element = searchBox.render();

      const clearButton = element.querySelector('.mm-search-clear');
      expect(clearButton).toBeDefined();
    });

    it('should not render clear button when disabled', () => {
      searchBox = new SearchBox({ showClearButton: false });
      const element = searchBox.render();

      const clearButton = element.querySelector('.mm-search-clear');
      expect(clearButton).toBeNull();
    });

    it('should hide clear button initially', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;
      expect(clearButton.style.display).toBe('none');
    });
  });

  describe('Input Handling (Requirements 9.6)', () => {
    it('should trigger onSearch callback after debounce', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      expect(onSearch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(onSearch).toHaveBeenCalledWith('test');
      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should debounce multiple rapid inputs', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 't';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(100);

      input.value = 'te';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(100);

      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(300);

      expect(onSearch).toHaveBeenCalledWith('test');
      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should trim input value before searching', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = '  test  ';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(300);

      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('should show clear button when input has value', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(300);

      expect(clearButton.style.display).toBe('flex');
    });

    it('should hide clear button when input is empty', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      expect(clearButton.style.display).toBe('none');
    });

    it('should not trigger callback if onSearch is not set', () => {
      searchBox = new SearchBox({ debounceMs: 300 });
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';

      expect(() => {
        input.dispatchEvent(new Event('input'));
        vi.advanceTimersByTime(300);
      }).not.toThrow();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input when clear button is clicked', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      clearButton.click();

      expect(input.value).toBe('');
    });

    it('should trigger onSearch with empty string when cleared', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox();
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      onSearch.mockClear();

      clearButton.click();

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('should trigger onClear callback when clear button is clicked', () => {
      const onClear = vi.fn();
      searchBox = new SearchBox();
      searchBox.onClear = onClear;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      clearButton.click();

      expect(onClear).toHaveBeenCalled();
    });

    it('should hide clear button after clearing', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      clearButton.click();

      expect(clearButton.style.display).toBe('none');
    });
  });

  describe('Keyboard Events', () => {
    it('should clear input when Escape key is pressed', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      expect(input.value).toBe('');
    });

    it('should trigger onSearch with empty string when Escape is pressed', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox();
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      onSearch.mockClear();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('should not clear input for other keys', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(input.value).toBe('test');
    });
  });

  describe('getValue and setValue', () => {
    it('should get current search value', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      input.value = 'test';

      expect(searchBox.getValue()).toBe('test');
    });

    it('should trim value when getting', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      input.value = '  test  ';

      expect(searchBox.getValue()).toBe('test');
    });

    it('should return empty string when input is empty', () => {
      searchBox = new SearchBox();
      searchBox.render();

      expect(searchBox.getValue()).toBe('');
    });

    it('should set search value', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      searchBox.setValue('new value');

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;
      expect(input.value).toBe('new value');
    });

    it('should show clear button when setting non-empty value', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      searchBox.setValue('test');

      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;
      expect(clearButton.style.display).toBe('flex');
    });

    it('should hide clear button when setting empty value', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();

      searchBox.setValue('test');
      searchBox.setValue('');

      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;
      expect(clearButton.style.display).toBe('none');
    });
  });

  describe('Focus', () => {
    it('should focus input when focus() is called', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();
      document.body.appendChild(element);

      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      searchBox.focus();

      expect(document.activeElement).toBe(input);

      document.body.removeChild(element);
    });

    it('should not throw when focus() is called before render', () => {
      searchBox = new SearchBox();

      expect(() => {
        searchBox.focus();
      }).not.toThrow();
    });
  });

  describe('Destroy', () => {
    it('should clear debounce timer on destroy', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      searchBox.destroy();

      vi.advanceTimersByTime(300);

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('should remove element from DOM on destroy', () => {
      searchBox = new SearchBox();
      const element = searchBox.render();
      document.body.appendChild(element);

      expect(document.body.contains(element)).toBe(true);

      searchBox.destroy();

      expect(document.body.contains(element)).toBe(false);
    });

    it('should clear callbacks on destroy', () => {
      searchBox = new SearchBox();
      searchBox.onSearch = vi.fn();
      searchBox.onClear = vi.fn();

      searchBox.destroy();

      expect(searchBox.onSearch).toBeNull();
      expect(searchBox.onClear).toBeNull();
    });

    it('should handle destroy when not attached to DOM', () => {
      searchBox = new SearchBox();
      searchBox.render();

      expect(() => {
        searchBox.destroy();
      }).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      searchBox = new SearchBox();
      searchBox.render();

      expect(() => {
        searchBox.destroy();
        searchBox.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options object', () => {
      searchBox = new SearchBox({});
      const element = searchBox.render();

      expect(element).toBeDefined();
    });

    it('should handle zero debounce time', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 0 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(0);

      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('should handle very long debounce time', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 10000 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(9999);
      expect(onSearch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('should handle special characters in search', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = '!@#$%^&*()';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(300);

      expect(onSearch).toHaveBeenCalledWith('!@#$%^&*()');
    });

    it('should handle unicode characters', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = '你好世界 🌍';
      input.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(300);

      expect(onSearch).toHaveBeenCalledWith('你好世界 🌍');
    });

    it('should handle multiple renders', () => {
      searchBox = new SearchBox();

      const element1 = searchBox.render();
      const element2 = searchBox.render();
      const element3 = searchBox.render();

      expect(element1).toBeDefined();
      expect(element2).toBeDefined();
      expect(element3).toBeDefined();
    });

    it('should handle callback changes after render', () => {
      const onSearch1 = vi.fn();
      const onSearch2 = vi.fn();

      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch1;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      input.value = 'test1';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      expect(onSearch1).toHaveBeenCalledWith('test1');
      expect(onSearch2).not.toHaveBeenCalled();

      searchBox.onSearch = onSearch2;

      input.value = 'test2';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      expect(onSearch2).toHaveBeenCalledWith('test2');
      expect(onSearch1).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should work with real-time search workflow', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      // User types "test"
      input.value = 't';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      input.value = 'te';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      input.value = 'tes';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      // Should only trigger once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('test');

      // User clears search
      const clearButton = element.querySelector(
        '.mm-search-clear',
      ) as HTMLElement;
      clearButton.click();

      expect(onSearch).toHaveBeenCalledWith('');
      expect(onSearch).toHaveBeenCalledTimes(2);
    });

    it('should work with keyboard-only workflow', () => {
      const onSearch = vi.fn();
      searchBox = new SearchBox({ debounceMs: 300 });
      searchBox.onSearch = onSearch;

      const element = searchBox.render();
      const input = element.querySelector(
        '.mm-search-input',
      ) as HTMLInputElement;

      // User types and searches
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);

      expect(onSearch).toHaveBeenCalledWith('test');

      // User presses Escape to clear
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      expect(onSearch).toHaveBeenCalledWith('');
      expect(input.value).toBe('');
    });
  });
});
