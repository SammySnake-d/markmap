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

    it('should be in read-only mode when localStorage is unavailable', () => {
      // Requirements: 16.3
      // Create a new storage manager with unavailable localStorage
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const readOnlyManager = new StorageManager('test-readonly');
      expect(readOnlyManager.isReadOnly()).toBe(true);

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should return false when saving in read-only mode', () => {
      // Requirements: 16.3
      // Create a storage manager in read-only mode
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const readOnlyManager = new StorageManager('test-readonly');
      const data = { markdown: '# Test' };
      const saved = readOnlyManager.save(data);

      expect(saved).toBe(false);

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should return null when loading in read-only mode', () => {
      // Requirements: 16.3
      // Create a storage manager in read-only mode
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const readOnlyManager = new StorageManager('test-readonly');
      const loaded = readOnlyManager.load();

      expect(loaded).toBeNull();

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should return false when clearing in read-only mode', () => {
      // Requirements: 16.3
      // Create a storage manager in read-only mode
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const readOnlyManager = new StorageManager('test-readonly');
      const cleared = readOnlyManager.clear();

      expect(cleared).toBe(false);

      // Restore original method
      localStorageMock.setItem = originalSetItem;
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

    it('should handle localStorage.removeItem errors gracefully', () => {
      // Requirements: 16.3
      // Mock localStorage.removeItem to throw an error
      const originalRemoveItem = localStorageMock.removeItem;
      localStorageMock.removeItem = vi.fn(() => {
        throw new Error('SecurityError');
      });

      const cleared = storageManager.clear();

      expect(cleared).toBe(false);

      // Restore original method
      localStorageMock.removeItem = originalRemoveItem;
    });
  });

  describe('History persistence (Requirement 16.6)', () => {
    it('should save and load history data', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-test-node',
              before: { inlineNote: 'Original' },
              after: { inlineNote: 'Updated' },
              timestamp: Date.now(),
            },
          ],
          redoStack: [
            {
              action: 'expand' as const,
              nodeId: '0-another-node',
              before: { fold: 1 },
              after: { fold: 0 },
              timestamp: Date.now(),
            },
          ],
        },
      };

      const saved = storageManager.save(data);
      expect(saved).toBe(true);

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.history).toBeDefined();
      expect(loaded?.history?.undoStack).toHaveLength(1);
      expect(loaded?.history?.redoStack).toHaveLength(1);
      expect(loaded?.history?.undoStack?.[0].action).toBe('edit');
      expect(loaded?.history?.undoStack?.[0].nodeId).toBe('0-test-node');
      expect(loaded?.history?.redoStack?.[0].action).toBe('expand');
    });

    it('should validate history structure', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: 'invalid',
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate undoStack as array', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: 'not-an-array',
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate redoStack as array', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            redoStack: 'not-an-array',
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate history entry action field', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'invalid-action',
                nodeId: '0-test',
                before: {},
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate history entry nodeId field', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: 123, // Should be string
                before: {},
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate history entry before state', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: 'invalid', // Should be object
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate history entry after state', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                after: 'invalid', // Should be object
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate history entry timestamp', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                after: {},
                timestamp: 'invalid', // Should be number
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate state inlineNote field', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: { inlineNote: 123 }, // Should be string
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate state detailedNote field', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: { detailedNote: 123 }, // Should be string
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should validate state fold field', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'expand',
                nodeId: '0-test',
                before: { fold: 'invalid' }, // Should be number
                after: { fold: 0 },
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should accept valid history with all action types', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-node1',
              before: { inlineNote: 'Before' },
              after: { inlineNote: 'After' },
              timestamp: Date.now(),
            },
            {
              action: 'expand' as const,
              nodeId: '0-node2',
              before: { fold: 1 },
              after: { fold: 0 },
              timestamp: Date.now(),
            },
            {
              action: 'collapse' as const,
              nodeId: '0-node3',
              before: { fold: 0 },
              after: { fold: 1 },
              timestamp: Date.now(),
            },
          ],
          redoStack: [],
        },
        timestamp: Date.now(),
      };

      localStorage.setItem(testKey, JSON.stringify(data));

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack).toHaveLength(3);
      expect(loaded?.history?.undoStack?.[0].action).toBe('edit');
      expect(loaded?.history?.undoStack?.[1].action).toBe('expand');
      expect(loaded?.history?.undoStack?.[2].action).toBe('collapse');
    });

    it('should accept history with empty stacks', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [],
          redoStack: [],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack).toEqual([]);
      expect(loaded?.history?.redoStack).toEqual([]);
    });

    it('should accept history with only undoStack', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-test',
              before: { inlineNote: 'Before' },
              after: { inlineNote: 'After' },
              timestamp: Date.now(),
            },
          ],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack).toHaveLength(1);
      expect(loaded?.history?.redoStack).toBeUndefined();
    });

    it('should accept history with only redoStack', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          redoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-test',
              before: { inlineNote: 'Before' },
              after: { inlineNote: 'After' },
              timestamp: Date.now(),
            },
          ],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack).toBeUndefined();
      expect(loaded?.history?.redoStack).toHaveLength(1);
    });

    it('should accept history entries with all state fields', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-test',
              before: {
                inlineNote: 'Before inline',
                detailedNote: 'Before detailed',
                fold: 1,
              },
              after: {
                inlineNote: 'After inline',
                detailedNote: 'After detailed',
                fold: 0,
              },
              timestamp: Date.now(),
            },
          ],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack?.[0].before.inlineNote).toBe(
        'Before inline',
      );
      expect(loaded?.history?.undoStack?.[0].before.detailedNote).toBe(
        'Before detailed',
      );
      expect(loaded?.history?.undoStack?.[0].before.fold).toBe(1);
      expect(loaded?.history?.undoStack?.[0].after.inlineNote).toBe(
        'After inline',
      );
      expect(loaded?.history?.undoStack?.[0].after.detailedNote).toBe(
        'After detailed',
      );
      expect(loaded?.history?.undoStack?.[0].after.fold).toBe(0);
    });

    it('should accept history entries with partial state fields', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-test',
              before: { inlineNote: 'Before' },
              after: { detailedNote: 'After' },
              timestamp: Date.now(),
            },
          ],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack?.[0].before.inlineNote).toBe('Before');
      expect(loaded?.history?.undoStack?.[0].after.detailedNote).toBe('After');
    });

    it('should accept history entries with empty state objects', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test',
        history: {
          undoStack: [
            {
              action: 'edit' as const,
              nodeId: '0-test',
              before: {},
              after: {},
              timestamp: Date.now(),
            },
          ],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack?.[0].before).toEqual({});
      expect(loaded?.history?.undoStack?.[0].after).toEqual({});
    });

    it('should reject history entry with missing action', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                nodeId: '0-test',
                before: {},
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with missing nodeId', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                before: {},
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with missing before', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with missing after', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with missing timestamp', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                after: {},
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with NaN timestamp', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                after: {},
                timestamp: NaN,
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with Infinity timestamp', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                after: {},
                timestamp: Infinity,
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should handle large history stacks', () => {
      // Requirements: 16.6
      const largeUndoStack = Array.from({ length: 100 }, (_, i) => ({
        action: 'edit' as const,
        nodeId: `0-node-${i}`,
        before: { inlineNote: `Before ${i}` },
        after: { inlineNote: `After ${i}` },
        timestamp: Date.now() + i,
      }));

      const data = {
        markdown: '# Test',
        history: {
          undoStack: largeUndoStack,
          redoStack: [],
        },
      };

      const saved = storageManager.save(data);
      expect(saved).toBe(true);

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.history?.undoStack).toHaveLength(100);
      expect(loaded?.history?.undoStack?.[0].nodeId).toBe('0-node-0');
      expect(loaded?.history?.undoStack?.[99].nodeId).toBe('0-node-99');
    });

    it('should accept data without history field', () => {
      // Requirements: 16.6
      const data = {
        markdown: '# Test without history',
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.markdown).toBe('# Test without history');
      expect(loaded?.history).toBeUndefined();
    });

    it('should reject history with null undoStack', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: null,
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history with null redoStack', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            redoStack: null,
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with null before state', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: null,
                after: {},
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject history entry with null after state', () => {
      // Requirements: 16.6
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          history: {
            undoStack: [
              {
                action: 'edit',
                nodeId: '0-test',
                before: {},
                after: null,
                timestamp: Date.now(),
              },
            ],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
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

    it('should handle data without timestamp', () => {
      // Save data without timestamp
      localStorage.setItem(
        testKey,
        JSON.stringify({ markdown: '# Test without timestamp' }),
      );

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.markdown).toBe('# Test without timestamp');
      expect(loaded?.timestamp).toBeUndefined();
    });

    it('should return null for last save time when no data exists', () => {
      const lastSaveTime = storageManager.getLastSaveTime();
      expect(lastSaveTime).toBeNull();
    });

    it('should return null for last save time when data has no timestamp', () => {
      localStorage.setItem(
        testKey,
        JSON.stringify({ markdown: '# Test without timestamp' }),
      );

      const lastSaveTime = storageManager.getLastSaveTime();
      expect(lastSaveTime).toBeNull();
    });

    it('should handle data with null values', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: null,
          viewState: null,
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should handle data with undefined markdown', () => {
      const data = {
        viewState: {
          transform: { x: 100, y: 200, k: 1.5 },
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.markdown).toBeUndefined();
      expect(loaded?.viewState?.transform).toEqual(data.viewState.transform);
    });

    it('should handle viewState with only transform', () => {
      const data = {
        markdown: '# Test',
        viewState: {
          transform: { x: 50, y: 100, k: 2 },
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.viewState?.transform).toEqual(data.viewState.transform);
      expect(loaded?.viewState?.expandedNodes).toBeUndefined();
    });

    it('should handle viewState with only expandedNodes', () => {
      const data = {
        markdown: '# Test',
        viewState: {
          expandedNodes: ['node1', 'node2'],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.viewState?.expandedNodes).toEqual(
        data.viewState.expandedNodes,
      );
      expect(loaded?.viewState?.transform).toBeUndefined();
    });

    it('should handle empty expandedNodes array', () => {
      const data = {
        markdown: '# Test',
        viewState: {
          expandedNodes: [],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.viewState?.expandedNodes).toEqual([]);
    });

    it('should reject expandedNodes with non-string elements', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            expandedNodes: ['valid', 123, 'another'],
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      // Should reject since expandedNodes contains non-string elements
      expect(loaded).toBeNull();
    });

    it('should handle transform with zero values', () => {
      const data = {
        markdown: '# Test',
        viewState: {
          transform: { x: 0, y: 0, k: 0 },
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.viewState?.transform).toEqual({ x: 0, y: 0, k: 0 });
    });

    it('should handle transform with negative values', () => {
      const data = {
        markdown: '# Test',
        viewState: {
          transform: { x: -100, y: -200, k: 0.5 },
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.viewState?.transform).toEqual({
        x: -100,
        y: -200,
        k: 0.5,
      });
    });

    it('should reject transform with missing properties', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            transform: { x: 100, y: 200 }, // missing k
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject transform with extra properties only', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            transform: { x: 100, y: 200, k: 1, extra: 'value' },
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      // Should load successfully as extra properties are allowed
      expect(loaded).not.toBeNull();
    });

    it('should reject transform with NaN values', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            transform: { x: NaN, y: 200, k: 1 },
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject transform with Infinity values', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            transform: { x: 100, y: Infinity, k: 1 },
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject timestamp with NaN', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          timestamp: NaN,
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject timestamp with Infinity', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          timestamp: Infinity,
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should accept valid timestamp', () => {
      // Requirements: 16.5
      const validTimestamp = Date.now();
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          timestamp: validTimestamp,
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded?.timestamp).toBe(validTimestamp);
    });

    it('should reject viewState with null value', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: null,
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should reject transform with null value', () => {
      // Requirements: 16.5
      localStorage.setItem(
        testKey,
        JSON.stringify({
          markdown: '# Test',
          viewState: {
            transform: null,
          },
          timestamp: Date.now(),
        }),
      );

      const loaded = storageManager.load();
      expect(loaded).toBeNull();
    });

    it('should handle empty expandedNodes with all string elements', () => {
      // Requirements: 16.5
      const data = {
        markdown: '# Test',
        viewState: {
          expandedNodes: ['node1', 'node2', 'node3'],
        },
      };

      storageManager.save(data);
      const loaded = storageManager.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.viewState?.expandedNodes).toEqual([
        'node1',
        'node2',
        'node3',
      ]);
    });
  });
});
