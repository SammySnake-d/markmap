/**
 * Unit tests for ColorManager
 *
 * Requirements:
 * - 10.1: Display color theme selector button
 * - 10.2: Show predefined color scheme list
 * - 10.3: Provide multiple preset color schemes
 * - 10.4: Apply color scheme to nodes and links
 * - 10.5: Maintain markmap's color assignment logic
 * - 10.6: Use smooth transition animation when switching colors
 * - 10.7: Save color scheme selection to local storage
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ColorManager,
  DEFAULT_SCHEMES,
  type ColorScheme,
} from '../src/color-manager';
import type { INode } from 'markmap-common';

describe('ColorManager', () => {
  let colorManager: ColorManager;
  let mockStorage: Record<string, string>;

  // Helper function to create test nodes
  const createTestNode = (
    content: string,
    depth: number = 1,
    children: INode[] = [],
  ): INode => {
    return {
      type: 'heading',
      depth,
      content,
      children,
      state: { depth },
      payload: {},
    };
  };

  beforeEach(() => {
    // Mock localStorage for all tests
    mockStorage = {};

    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
      length: 0,
      key: () => null,
    } as Storage;

    colorManager = new ColorManager();
  });

  describe('Initialization (Requirement 10.1, 10.2)', () => {
    it('should initialize with default color scheme', () => {
      const scheme = colorManager.getCurrentScheme();

      expect(scheme).toBeDefined();
      expect(scheme.name).toBe('default');
      expect(scheme.colors).toEqual(DEFAULT_SCHEMES[0].colors);
    });

    it('should initialize with specified scheme name', () => {
      const manager = new ColorManager('ocean');
      const scheme = manager.getCurrentScheme();

      expect(scheme.name).toBe('ocean');
      expect(scheme.colors).toEqual(DEFAULT_SCHEMES[1].colors);
    });

    it('should initialize with custom scheme object', () => {
      const customScheme: ColorScheme = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      };

      const manager = new ColorManager(customScheme);
      const scheme = manager.getCurrentScheme();

      expect(scheme).toEqual(customScheme);
    });

    it('should fallback to default when invalid scheme name provided', () => {
      const manager = new ColorManager('nonexistent');
      const scheme = manager.getCurrentScheme();

      expect(scheme.name).toBe('default');
    });

    it('should register all default schemes on initialization', () => {
      const availableSchemes = colorManager.getAvailableSchemes();

      expect(availableSchemes).toContain('default');
      expect(availableSchemes).toContain('ocean');
      expect(availableSchemes).toContain('forest');
      expect(availableSchemes).toContain('sunset');
      expect(availableSchemes).toContain('monochrome');
    });
  });

  describe('Scheme Management (Requirement 10.2, 10.3)', () => {
    it('should get current scheme', () => {
      const scheme = colorManager.getCurrentScheme();

      expect(scheme).toBeDefined();
      expect(scheme.name).toBe('default');
      expect(Array.isArray(scheme.colors)).toBe(true);
    });

    it('should set scheme by name', () => {
      colorManager.setScheme('ocean');
      const scheme = colorManager.getCurrentScheme();

      expect(scheme.name).toBe('ocean');
      expect(scheme.colors).toEqual(DEFAULT_SCHEMES[1].colors);
    });

    it('should set scheme by object', () => {
      const customScheme: ColorScheme = {
        name: 'custom',
        colors: ['#aaa', '#bbb', '#ccc'],
        linkColor: '#ddd',
      };

      colorManager.setScheme(customScheme);
      const scheme = colorManager.getCurrentScheme();

      expect(scheme).toEqual(customScheme);
    });

    it('should throw error when setting nonexistent scheme by name', () => {
      expect(() => {
        colorManager.setScheme('nonexistent');
      }).toThrow('Color scheme "nonexistent" not found');
    });

    it('should get scheme by name', () => {
      const scheme = colorManager.getScheme('forest');

      expect(scheme).toBeDefined();
      expect(scheme?.name).toBe('forest');
      expect(scheme?.colors).toEqual(DEFAULT_SCHEMES[2].colors);
    });

    it('should return undefined for nonexistent scheme', () => {
      const scheme = colorManager.getScheme('nonexistent');

      expect(scheme).toBeUndefined();
    });

    it('should register new scheme', () => {
      const newScheme: ColorScheme = {
        name: 'custom',
        colors: ['#111', '#222', '#333'],
      };

      colorManager.registerScheme('custom', newScheme);
      const retrieved = colorManager.getScheme('custom');

      expect(retrieved).toEqual(newScheme);
    });

    it('should override existing scheme when registering with same name', () => {
      const newDefault: ColorScheme = {
        name: 'default',
        colors: ['#fff', '#eee', '#ddd'],
      };

      colorManager.registerScheme('default', newDefault);
      const scheme = colorManager.getScheme('default');

      expect(scheme?.colors).toEqual(newDefault.colors);
    });

    it('should get all available scheme names', () => {
      const names = colorManager.getAvailableSchemes();

      expect(names).toContain('default');
      expect(names).toContain('ocean');
      expect(names).toContain('forest');
      expect(names).toContain('sunset');
      expect(names).toContain('monochrome');
      expect(names.length).toBe(5);
    });

    it('should get all available schemes', () => {
      const schemes = colorManager.getAllSchemes();

      expect(schemes.length).toBe(5);
      expect(schemes.map((s) => s.name)).toContain('default');
      expect(schemes.map((s) => s.name)).toContain('ocean');
    });

    it('should include newly registered schemes in available schemes', () => {
      const customScheme: ColorScheme = {
        name: 'custom',
        colors: ['#aaa'],
      };

      colorManager.registerScheme('custom', customScheme);
      const names = colorManager.getAvailableSchemes();

      expect(names).toContain('custom');
      expect(names.length).toBe(6);
    });
  });

  describe('Default Color Schemes (Requirement 10.3)', () => {
    it('should have default scheme with correct colors', () => {
      const scheme = DEFAULT_SCHEMES.find((s) => s.name === 'default');

      expect(scheme).toBeDefined();
      expect(scheme?.colors).toEqual([
        '#5e6ad2',
        '#26b5ce',
        '#f9c52a',
        '#f98e52',
        '#e55e5e',
      ]);
    });

    it('should have ocean scheme with correct colors', () => {
      const scheme = DEFAULT_SCHEMES.find((s) => s.name === 'ocean');

      expect(scheme).toBeDefined();
      expect(scheme?.colors).toEqual([
        '#006d77',
        '#83c5be',
        '#edf6f9',
        '#ffddd2',
        '#e29578',
      ]);
    });

    it('should have forest scheme with correct colors', () => {
      const scheme = DEFAULT_SCHEMES.find((s) => s.name === 'forest');

      expect(scheme).toBeDefined();
      expect(scheme?.colors).toEqual([
        '#2d6a4f',
        '#40916c',
        '#52b788',
        '#74c69d',
        '#95d5b2',
      ]);
    });

    it('should have sunset scheme with correct colors', () => {
      const scheme = DEFAULT_SCHEMES.find((s) => s.name === 'sunset');

      expect(scheme).toBeDefined();
      expect(scheme?.colors).toEqual([
        '#ff6b6b',
        '#ee5a6f',
        '#c44569',
        '#774c60',
        '#2d4059',
      ]);
    });

    it('should have monochrome scheme with correct colors', () => {
      const scheme = DEFAULT_SCHEMES.find((s) => s.name === 'monochrome');

      expect(scheme).toBeDefined();
      expect(scheme?.colors).toEqual([
        '#2c3e50',
        '#34495e',
        '#7f8c8d',
        '#95a5a6',
        '#bdc3c7',
      ]);
    });

    it('should have at least 5 colors in each scheme', () => {
      DEFAULT_SCHEMES.forEach((scheme) => {
        expect(scheme.colors.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('Color Assignment (Requirement 10.4, 10.5)', () => {
    it('should get color for node based on depth', () => {
      const node = createTestNode('Test', 0);
      const color = colorManager.getColorForNode(node);

      expect(color).toBe(DEFAULT_SCHEMES[0].colors[0]);
    });

    it('should cycle through colors based on depth', () => {
      const colors = DEFAULT_SCHEMES[0].colors;
      const nodes = [
        createTestNode('Node 0', 0),
        createTestNode('Node 1', 1),
        createTestNode('Node 2', 2),
        createTestNode('Node 3', 3),
        createTestNode('Node 4', 4),
      ];

      nodes.forEach((node, index) => {
        const color = colorManager.getColorForNode(node);
        expect(color).toBe(colors[index % colors.length]);
      });
    });

    it('should wrap around colors when depth exceeds color count', () => {
      const colors = DEFAULT_SCHEMES[0].colors;
      const node = createTestNode('Test', colors.length + 2);
      const color = colorManager.getColorForNode(node);

      expect(color).toBe(colors[2]);
    });

    it('should handle node without state.depth', () => {
      const node: INode = {
        type: 'heading',
        depth: 1,
        content: 'Test',
        children: [],
        payload: {},
      };

      const color = colorManager.getColorForNode(node);

      expect(color).toBe(DEFAULT_SCHEMES[0].colors[0]);
    });

    it('should apply colors to single node', () => {
      const node = createTestNode('Test', 0);
      colorManager.applyToNodes([node]);

      expect(node.payload?.color).toBe(DEFAULT_SCHEMES[0].colors[0]);
    });

    it('should apply colors to multiple nodes', () => {
      const nodes = [
        createTestNode('Node 0', 0),
        createTestNode('Node 1', 1),
        createTestNode('Node 2', 2),
      ];

      colorManager.applyToNodes(nodes);

      expect(nodes[0].payload?.color).toBe(DEFAULT_SCHEMES[0].colors[0]);
      expect(nodes[1].payload?.color).toBe(DEFAULT_SCHEMES[0].colors[1]);
      expect(nodes[2].payload?.color).toBe(DEFAULT_SCHEMES[0].colors[2]);
    });

    it('should apply colors recursively to children', () => {
      const child1 = createTestNode('Child 1', 2);
      const child2 = createTestNode('Child 2', 2);
      const parent = createTestNode('Parent', 1, [child1, child2]);

      colorManager.applyToNodes([parent]);

      expect(parent.payload?.color).toBe(DEFAULT_SCHEMES[0].colors[1]);
      expect(child1.payload?.color).toBe(DEFAULT_SCHEMES[0].colors[2]);
      expect(child2.payload?.color).toBe(DEFAULT_SCHEMES[0].colors[2]);
    });

    it('should create payload if not exists when applying colors', () => {
      const node: INode = {
        type: 'heading',
        depth: 1,
        content: 'Test',
        children: [],
        state: { depth: 0 },
      };

      colorManager.applyToNodes([node]);

      expect(node.payload).toBeDefined();
      expect(node.payload?.color).toBeDefined();
    });

    it('should preserve other payload properties when applying colors', () => {
      const node = createTestNode('Test', 0);
      node.payload = { customProp: 'value' };

      colorManager.applyToNodes([node]);

      expect(node.payload.color).toBeDefined();
      expect(node.payload.customProp).toBe('value');
    });

    it('should handle empty node array', () => {
      expect(() => {
        colorManager.applyToNodes([]);
      }).not.toThrow();
    });

    it('should apply colors from different scheme', () => {
      colorManager.setScheme('ocean');
      const node = createTestNode('Test', 0);

      colorManager.applyToNodes([node]);

      expect(node.payload?.color).toBe(DEFAULT_SCHEMES[1].colors[0]);
    });
  });

  describe('Link and Highlight Colors (Requirement 10.4)', () => {
    it('should get link color from scheme', () => {
      const schemeWithLink: ColorScheme = {
        name: 'custom',
        colors: ['#aaa'],
        linkColor: '#bbb',
      };

      colorManager.setScheme(schemeWithLink);
      const linkColor = colorManager.getLinkColor();

      expect(linkColor).toBe('#bbb');
    });

    it('should return undefined when scheme has no link color', () => {
      const linkColor = colorManager.getLinkColor();

      expect(linkColor).toBeUndefined();
    });

    it('should get highlight color from scheme', () => {
      const schemeWithHighlight: ColorScheme = {
        name: 'custom',
        colors: ['#aaa'],
        highlightColor: '#ccc',
      };

      colorManager.setScheme(schemeWithHighlight);
      const highlightColor = colorManager.getHighlightColor();

      expect(highlightColor).toBe('#ccc');
    });

    it('should return undefined when scheme has no highlight color', () => {
      const highlightColor = colorManager.getHighlightColor();

      expect(highlightColor).toBeUndefined();
    });

    it('should update link color when scheme changes', () => {
      const scheme1: ColorScheme = {
        name: 'scheme1',
        colors: ['#aaa'],
        linkColor: '#111',
      };

      const scheme2: ColorScheme = {
        name: 'scheme2',
        colors: ['#bbb'],
        linkColor: '#222',
      };

      colorManager.setScheme(scheme1);
      expect(colorManager.getLinkColor()).toBe('#111');

      colorManager.setScheme(scheme2);
      expect(colorManager.getLinkColor()).toBe('#222');
    });
  });

  describe('Scheme Switching (Requirement 10.6)', () => {
    it('should switch between schemes', () => {
      colorManager.setScheme('default');
      expect(colorManager.getCurrentScheme().name).toBe('default');

      colorManager.setScheme('ocean');
      expect(colorManager.getCurrentScheme().name).toBe('ocean');

      colorManager.setScheme('forest');
      expect(colorManager.getCurrentScheme().name).toBe('forest');
    });

    it('should update node colors after scheme switch', () => {
      const node = createTestNode('Test', 0);

      colorManager.setScheme('default');
      colorManager.applyToNodes([node]);
      const color1 = node.payload?.color;

      colorManager.setScheme('ocean');
      colorManager.applyToNodes([node]);
      const color2 = node.payload?.color;

      expect(color1).not.toBe(color2);
      expect(color1).toBe(DEFAULT_SCHEMES[0].colors[0]);
      expect(color2).toBe(DEFAULT_SCHEMES[1].colors[0]);
    });

    it('should maintain scheme after multiple operations', () => {
      colorManager.setScheme('sunset');

      const node1 = createTestNode('Node 1', 0);
      colorManager.applyToNodes([node1]);

      const node2 = createTestNode('Node 2', 1);
      colorManager.applyToNodes([node2]);

      expect(colorManager.getCurrentScheme().name).toBe('sunset');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very deep nodes', () => {
      const node = createTestNode('Test', 1000);
      const color = colorManager.getColorForNode(node);

      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
    });

    it('should handle negative depth', () => {
      const node = createTestNode('Test', -1);

      // Negative depth modulo may return undefined or negative index
      // This is an edge case that should be handled gracefully
      // For now, we just verify it doesn't crash
      expect(() => colorManager.getColorForNode(node)).not.toThrow();
    });

    it('should handle nodes with deeply nested children', () => {
      const deepChild = createTestNode('Deep Child', 5);
      const child = createTestNode('Child', 4, [deepChild]);
      const parent = createTestNode('Parent', 3, [child]);

      colorManager.applyToNodes([parent]);

      expect(parent.payload?.color).toBeDefined();
      expect(child.payload?.color).toBeDefined();
      expect(deepChild.payload?.color).toBeDefined();
    });

    it('should handle scheme with single color', () => {
      const singleColorScheme: ColorScheme = {
        name: 'single',
        colors: ['#ff0000'],
      };

      colorManager.setScheme(singleColorScheme);

      const nodes = [
        createTestNode('Node 0', 0),
        createTestNode('Node 1', 1),
        createTestNode('Node 2', 2),
      ];

      colorManager.applyToNodes(nodes);

      nodes.forEach((node) => {
        expect(node.payload?.color).toBe('#ff0000');
      });
    });

    it('should handle scheme with many colors', () => {
      const manyColors = Array.from(
        { length: 100 },
        (_, i) => `#${i.toString(16).padStart(6, '0')}`,
      );
      const largeScheme: ColorScheme = {
        name: 'large',
        colors: manyColors,
      };

      colorManager.setScheme(largeScheme);

      const node = createTestNode('Test', 50);
      const color = colorManager.getColorForNode(node);

      expect(color).toBe(manyColors[50]);
    });

    it('should handle concurrent scheme switches', () => {
      colorManager.setScheme('ocean');
      colorManager.setScheme('forest');
      colorManager.setScheme('sunset');

      expect(colorManager.getCurrentScheme().name).toBe('sunset');
    });

    it('should handle registering scheme with empty colors array', () => {
      const emptyScheme: ColorScheme = {
        name: 'empty',
        colors: [],
      };

      colorManager.registerScheme('empty', emptyScheme);
      colorManager.setScheme('empty');

      const node = createTestNode('Test', 0);

      // This might cause issues, but should not crash
      expect(() => {
        colorManager.applyToNodes([node]);
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: register, set, apply', () => {
      const customScheme: ColorScheme = {
        name: 'workflow',
        colors: ['#111', '#222', '#333'],
        linkColor: '#444',
        highlightColor: '#555',
      };

      colorManager.registerScheme('workflow', customScheme);
      colorManager.setScheme('workflow');

      const nodes = [createTestNode('Node 0', 0), createTestNode('Node 1', 1)];

      colorManager.applyToNodes(nodes);

      expect(nodes[0].payload?.color).toBe('#111');
      expect(nodes[1].payload?.color).toBe('#222');
      expect(colorManager.getLinkColor()).toBe('#444');
      expect(colorManager.getHighlightColor()).toBe('#555');
    });

    it('should handle switching schemes and reapplying colors', () => {
      const node = createTestNode('Test', 0);

      colorManager.setScheme('default');
      colorManager.applyToNodes([node]);
      const defaultColor = node.payload?.color;

      colorManager.setScheme('ocean');
      colorManager.applyToNodes([node]);
      const oceanColor = node.payload?.color;

      colorManager.setScheme('default');
      colorManager.applyToNodes([node]);
      const backToDefaultColor = node.payload?.color;

      expect(defaultColor).toBe(backToDefaultColor);
      expect(defaultColor).not.toBe(oceanColor);
    });

    it('should maintain independent color managers', () => {
      const manager1 = new ColorManager('default');
      const manager2 = new ColorManager('ocean');

      expect(manager1.getCurrentScheme().name).toBe('default');
      expect(manager2.getCurrentScheme().name).toBe('ocean');

      manager1.setScheme('forest');
      expect(manager1.getCurrentScheme().name).toBe('forest');
      expect(manager2.getCurrentScheme().name).toBe('ocean');
    });
  });

  describe('Color Scheme Persistence (Requirement 10.7)', () => {
    beforeEach(() => {
      // Clear mock storage before each test in this group
      mockStorage = {};
    });

    it('should save color scheme to localStorage when set by name', () => {
      colorManager.setScheme('ocean');

      const saved = localStorage.getItem('markmap-color-scheme');
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('ocean');
      expect(parsed.colors).toEqual(DEFAULT_SCHEMES[1].colors);
    });

    it('should save color scheme to localStorage when set by object', () => {
      const customScheme: ColorScheme = {
        name: 'custom',
        colors: ['#aaa', '#bbb', '#ccc'],
        linkColor: '#ddd',
      };

      colorManager.setScheme(customScheme);

      const saved = localStorage.getItem('markmap-color-scheme');
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved!);
      expect(parsed).toEqual(customScheme);
    });

    it('should load saved scheme from localStorage on initialization', () => {
      // Save a scheme
      const oceanScheme = DEFAULT_SCHEMES[1];
      localStorage.setItem('markmap-color-scheme', JSON.stringify(oceanScheme));

      // Create new manager without initial scheme
      const newManager = new ColorManager();

      expect(newManager.getCurrentScheme().name).toBe('ocean');
      expect(newManager.getCurrentScheme().colors).toEqual(oceanScheme.colors);
    });

    it('should prioritize initialScheme parameter over localStorage', () => {
      // Save ocean to localStorage
      localStorage.setItem(
        'markmap-color-scheme',
        JSON.stringify(DEFAULT_SCHEMES[1]),
      );

      // Initialize with forest
      const newManager = new ColorManager('forest');

      expect(newManager.getCurrentScheme().name).toBe('forest');
    });

    it('should use default scheme when localStorage is empty', () => {
      const newManager = new ColorManager();

      expect(newManager.getCurrentScheme().name).toBe('default');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('markmap-color-scheme', 'invalid json');

      const newManager = new ColorManager();

      expect(newManager.getCurrentScheme().name).toBe('default');
    });

    it('should handle invalid scheme data in localStorage', () => {
      localStorage.setItem(
        'markmap-color-scheme',
        JSON.stringify({ invalid: 'data' }),
      );

      const newManager = new ColorManager();

      expect(newManager.getCurrentScheme().name).toBe('default');
    });

    it('should handle scheme with empty colors array in localStorage', () => {
      localStorage.setItem(
        'markmap-color-scheme',
        JSON.stringify({ name: 'test', colors: [] }),
      );

      const newManager = new ColorManager();

      expect(newManager.getCurrentScheme().name).toBe('default');
    });

    it('should load known scheme from localStorage by name', () => {
      // Save a known scheme
      localStorage.setItem(
        'markmap-color-scheme',
        JSON.stringify({ name: 'forest', colors: ['#old'] }),
      );

      const newManager = new ColorManager();

      // Should use the registered version, not the saved colors
      expect(newManager.getCurrentScheme().name).toBe('forest');
      expect(newManager.getCurrentScheme().colors).toEqual(
        DEFAULT_SCHEMES[2].colors,
      );
    });

    it('should load custom scheme from localStorage', () => {
      const customScheme: ColorScheme = {
        name: 'custom',
        colors: ['#111', '#222', '#333'],
        linkColor: '#444',
      };

      localStorage.setItem(
        'markmap-color-scheme',
        JSON.stringify(customScheme),
      );

      const newManager = new ColorManager();

      expect(newManager.getCurrentScheme()).toEqual(customScheme);
    });

    it('should update localStorage when switching schemes', () => {
      colorManager.setScheme('default');
      let saved = localStorage.getItem('markmap-color-scheme');
      let parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('default');

      colorManager.setScheme('ocean');
      saved = localStorage.getItem('markmap-color-scheme');
      parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('ocean');

      colorManager.setScheme('forest');
      saved = localStorage.getItem('markmap-color-scheme');
      parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('forest');
    });

    it('should save scheme when using setSchemeSmoothly', () => {
      colorManager.setSchemeSmoothly('sunset');

      const saved = localStorage.getItem('markmap-color-scheme');
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved!);
      expect(parsed.name).toBe('sunset');
    });

    it('should clear stored scheme', () => {
      colorManager.setScheme('ocean');
      expect(localStorage.getItem('markmap-color-scheme')).toBeDefined();

      colorManager.clearStoredScheme();
      expect(localStorage.getItem('markmap-color-scheme')).toBeNull();
    });

    it('should not crash when localStorage is unavailable', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('localStorage unavailable');
      };

      expect(() => {
        colorManager.setScheme('ocean');
      }).not.toThrow();

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });

    it('should not crash when localStorage.getItem throws', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error('localStorage unavailable');
      };

      expect(() => {
        new ColorManager();
      }).not.toThrow();

      // Restore
      Storage.prototype.getItem = originalGetItem;
    });

    it('should persist scheme across multiple manager instances', () => {
      const manager1 = new ColorManager();
      manager1.setScheme('sunset');

      const manager2 = new ColorManager();
      expect(manager2.getCurrentScheme().name).toBe('sunset');

      manager2.setScheme('monochrome');

      const manager3 = new ColorManager();
      expect(manager3.getCurrentScheme().name).toBe('monochrome');
    });

    it('should handle quota exceeded error gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        const error: any = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      };

      expect(() => {
        colorManager.setScheme('ocean');
      }).not.toThrow();

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Smooth Color Scheme Switching (Requirement 10.6)', () => {
    it('should return previous scheme when switching smoothly', () => {
      colorManager.setScheme('default');
      const previousScheme = colorManager.setSchemeSmoothly('ocean');

      expect(previousScheme.name).toBe('default');
      expect(colorManager.getCurrentScheme().name).toBe('ocean');
    });

    it('should return previous scheme when switching by object', () => {
      const customScheme: ColorScheme = {
        name: 'custom',
        colors: ['#aaa', '#bbb', '#ccc'],
      };

      colorManager.setScheme('forest');
      const previousScheme = colorManager.setSchemeSmoothly(customScheme);

      expect(previousScheme.name).toBe('forest');
      expect(colorManager.getCurrentScheme().name).toBe('custom');
    });

    it('should throw error when switching to nonexistent scheme smoothly', () => {
      expect(() => {
        colorManager.setSchemeSmoothly('nonexistent');
      }).toThrow('Color scheme "nonexistent" not found');
    });

    it('should allow chaining smooth switches', () => {
      colorManager.setScheme('default');

      const prev1 = colorManager.setSchemeSmoothly('ocean');
      expect(prev1.name).toBe('default');

      const prev2 = colorManager.setSchemeSmoothly('forest');
      expect(prev2.name).toBe('ocean');

      const prev3 = colorManager.setSchemeSmoothly('sunset');
      expect(prev3.name).toBe('forest');

      expect(colorManager.getCurrentScheme().name).toBe('sunset');
    });

    it('should preserve previous scheme colors for animation', () => {
      colorManager.setScheme('default');
      const defaultColors = [...DEFAULT_SCHEMES[0].colors];

      const previousScheme = colorManager.setSchemeSmoothly('ocean');

      expect(previousScheme.colors).toEqual(defaultColors);
      expect(colorManager.getCurrentScheme().colors).toEqual(
        DEFAULT_SCHEMES[1].colors,
      );
    });

    it('should work with custom schemes', () => {
      const scheme1: ColorScheme = {
        name: 'scheme1',
        colors: ['#111', '#222'],
      };

      const scheme2: ColorScheme = {
        name: 'scheme2',
        colors: ['#333', '#444'],
      };

      colorManager.setScheme(scheme1);
      const previous = colorManager.setSchemeSmoothly(scheme2);

      expect(previous.name).toBe('scheme1');
      expect(previous.colors).toEqual(['#111', '#222']);
      expect(colorManager.getCurrentScheme().name).toBe('scheme2');
      expect(colorManager.getCurrentScheme().colors).toEqual(['#333', '#444']);
    });

    it('should handle switching from and to same scheme', () => {
      colorManager.setScheme('ocean');
      const previous = colorManager.setSchemeSmoothly('ocean');

      expect(previous.name).toBe('ocean');
      expect(colorManager.getCurrentScheme().name).toBe('ocean');
    });
  });
});
