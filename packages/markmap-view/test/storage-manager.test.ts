/**
 * Tests for StorageManager
 *
 * Requirements:
 * - 16.1: Auto-save Markdown content when modified
 * - 16.2: Load saved Markdown content and view state on app restart
 * - 16.3: Display warning and run in read-only mode when localStorage unavailable
 * - 16.5: Validate data integrity and handle corrupted data
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageManager } from '../src/storage-manager';

// Mock localStorage for testing
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('StorageManager', () => {
  let storageManager: StorageManager;
  const testKey = 'test-markmap-data';
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    // Create a fresh localStorage mock for each test
    localStorageMock = new LocalStorageMock();
    global.localStorage = localStorageMock as any;
    storageManager = new StorageManager(testKey);
  });

  afterEach(() => {
    // Clean up
    localStorageMock.clear();
  });

  describe('Basic functionality', () => {
    it('should save and load data successfully', () => {
      // Requirements: 16.1, 16.2
      const data = {
        markdown: '# Test\n- Item 1\n- Item 2',
        viewState: {
          transform: { x: 100, y: 200, k: 1.5 },
          expandedNodes: ['0', '0-0', '0-1'],
        },
      };

      const saved = storageManager.save(data);
      expect(saved).toBe(true);

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.markdown).toBe(data.markdown);
      expect(loaded?.viewState?.transform).toEqual(data.viewState.transform);
      expect(loaded?.viewState?.expandedNodes).toEqual(
        data.viewState.expandedNodes,
      );
    });

    it('should add timestamp when saving', () => {
      // Requirements: 16.1
      const data = {
        markdown: '# Test',
      };

      const beforeSave = Date.now();
      storageManager.save(data);
      const afterSave = Date.now();

      const loaded = storageManager.load();
      expect(loaded?.timestamp).toBeDefined();
      expect(loaded!.timestamp!).toBeGreaterThanOrEqual(beforeSave);
      expect(loaded!.timestamp!).toBeLessThanOrEqual(afterSave);
    });

    it('should return null when no data is saved', () => {
      // Requirements: 16.2
      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should clear saved data', () => {
      const data = { markdown: '# Test' };
      storageManager.save(data);

      const cleared = storageManager.clear();
      expect(cleared).toBe(true);

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should get last save time', () => {
      const data = { markdown: '# Test' };
      storageManager.save(data);

      const lastSaveTime = storageManager.getLastSaveTime();
      expect(lastSaveTime).not.toBeNull();
      expect(typeof lastSaveTime).toBe('number');
    });
  });

  describe('Data validation', () => {
    it('should validate markdown as string', () => {
      // Requirements: 16.5
      // Save invalid data directly to localStorage
      localStorage.setItem(
        testKey,
        JSON.stringify({ markdown: 123, timestamp: Date.now() }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate viewState structure', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: 'invalid',
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate transform structure', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            transform: { x: 'invalid', y: 100, k: 1 },
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate expandedNodes as array', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            expandedNodes: 'not-an-array',
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should accept valid data with all fields', () => {
      // Requirements: 16.5
      const validData = {
        markdown: '# Test',
        viewState: {
          transform: { x: 100, y: 200, k: 1.5 },
          expandedNodes: ['0', '0-0'],
        },
        timestamp: Date.now(),
      };

      localStorage.setItem(testKey, JSON.stringify(validData));

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.markdown).toBe(validData.markdown);
    });

    it('should accept data with only markdown', () => {
      // Requirements: 16.5
      const validData = {
        markdown: '# Test',
        timestamp: Date.now(),
      };

      localStorage.setItem(testKey, JSON.stringify(validData));

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.markdown).toBe(validData.markdown);
    });
  });

  describe('Read-only mode', () => {
    it('should not be in read-only mode when localStorage is available', () => {
      // Requirements: 16.3
      expect(storageManager.isReadOnly()).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      // Requirements: 16.3
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const data = { markdown: '# Test' };
      const saved = storageManager.save(data);

      expect(saved).toBe(false);

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle localStorage.getItem errors gracefully', () => {
      // Requirements: 16.3
      // Mock localStorage.getItem to throw an error
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = vi.fn(() => {
        throw new Error('SecurityError');
      });

      const loaded = storageManager.load();

      expect(loaded).toBeNull();

      // Restore original method
      localStorageMock.getItem = originalGetItem;
    });
  });

  describe('Edge cases', () => {
    it('should handle empty markdown', () => {
      const data = { markdown: '' };
      storageManager.save(data);

      const loaded = storageManager.load();
      expect(loaded?.markdown).toBe('');
    });

    it('should handle large markdown content', () => {
      // Requirements: 16.1, 16.2
      const largeMarkdown = '# Test\n' + '- Item\n'.repeat(1000);
      const data = { markdown: largeMarkdown };

      const saved = storageManager.save(data);
      expect(saved).toBe(true);

      const loaded = storageManager.load();
      expect(loaded?.markdown).toBe(largeMarkdown);
    });

    it('should handle special characters in markdown', () => {
      const data = {
        markdown: '# Test 测试\n- Item with emoji 🎉\n- Special chars: <>&"\'',
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded?.markdown).toBe(data.markdown);
    });

    it('should handle corrupted JSON', () => {
      // Requirements: 16.5
      localStorage.setItem(testKey, 'not valid json {');

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });
  });
});
