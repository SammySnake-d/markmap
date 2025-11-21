import { INode } from 'markmap-common';

/**
 * Color scheme definition
 * Requirements: 10.1, 10.2, 10.3
 */
export interface ColorScheme {
  name: string;
  colors: string[];
  linkColor?: string;
  highlightColor?: string;
}

/**
 * Predefined color schemes
 * Requirements: 10.3
 */
export const DEFAULT_SCHEMES: ColorScheme[] = [
  {
    name: 'default',
    colors: ['#5e6ad2', '#26b5ce', '#f9c52a', '#f98e52', '#e55e5e'],
  },
  {
    name: 'ocean',
    colors: ['#006d77', '#83c5be', '#edf6f9', '#ffddd2', '#e29578'],
  },
  {
    name: 'forest',
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
  },
  {
    name: 'sunset',
    colors: ['#ff6b6b', '#ee5a6f', '#c44569', '#774c60', '#2d4059'],
  },
  {
    name: 'monochrome',
    colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7'],
  },
];

/**
 * ColorManager manages color schemes and applies them to nodes
 * Requirements: 10.1, 10.2
 */
export class ColorManager {
  private schemes: Map<string, ColorScheme>;
  private currentScheme: ColorScheme;
  private storageKey: string = 'markmap-color-scheme';

  constructor(initialScheme?: ColorScheme | string) {
    this.schemes = new Map();

    // Register default schemes
    DEFAULT_SCHEMES.forEach((scheme) => {
      this.schemes.set(scheme.name, scheme);
    });

    // Set initial scheme
    // Priority: 1. initialScheme parameter, 2. localStorage, 3. default
    if (typeof initialScheme === 'string') {
      const scheme = this.schemes.get(initialScheme);
      this.currentScheme = scheme || DEFAULT_SCHEMES[0];
    } else if (initialScheme) {
      this.currentScheme = initialScheme;
    } else {
      // Try to load from localStorage
      const savedScheme = this.loadSchemeFromStorage();
      this.currentScheme = savedScheme || DEFAULT_SCHEMES[0];
    }
  }

  /**
   * Get the current color scheme
   * Requirements: 10.2
   */
  getCurrentScheme(): ColorScheme {
    return this.currentScheme;
  }

  /**
   * Set the current color scheme
   * Requirements: 10.4, 10.7
   */
  setScheme(scheme: ColorScheme | string): void {
    if (typeof scheme === 'string') {
      const foundScheme = this.schemes.get(scheme);
      if (foundScheme) {
        this.currentScheme = foundScheme;
        this.saveSchemeToStorage(foundScheme);
      } else {
        throw new Error(`Color scheme "${scheme}" not found`);
      }
    } else {
      this.currentScheme = scheme;
      this.saveSchemeToStorage(scheme);
    }
  }

  /**
   * Set the current color scheme with animation support
   * Returns the previous scheme for animation purposes
   * Requirements: 10.6, 10.7
   */
  setSchemeSmoothly(scheme: ColorScheme | string): ColorScheme {
    const previousScheme = this.currentScheme;
    this.setScheme(scheme); // This will also save to storage
    return previousScheme;
  }

  /**
   * Get a color scheme by name
   * Requirements: 10.2
   */
  getScheme(name: string): ColorScheme | undefined {
    return this.schemes.get(name);
  }

  /**
   * Register a new color scheme
   * Requirements: 10.2
   */
  registerScheme(name: string, scheme: ColorScheme): void {
    this.schemes.set(name, scheme);
  }

  /**
   * Get all available color scheme names
   * Requirements: 10.3
   */
  getAvailableSchemes(): string[] {
    return Array.from(this.schemes.keys());
  }

  /**
   * Get all available color schemes
   * Requirements: 10.3
   */
  getAllSchemes(): ColorScheme[] {
    return Array.from(this.schemes.values());
  }

  /**
   * Get color for a node based on its depth
   * Requirements: 10.4, 10.5
   */
  getColorForNode(node: INode): string {
    const colors = this.currentScheme.colors;
    const depth = node.state?.depth || 0;
    return colors[depth % colors.length];
  }

  /**
   * Apply colors to nodes recursively
   * Requirements: 10.4, 10.5
   */
  applyToNodes(nodes: INode[]): void {
    const applyColor = (node: INode) => {
      if (!node.payload) {
        node.payload = {};
      }
      node.payload.color = this.getColorForNode(node);
      if (node.children) {
        node.children.forEach(applyColor);
      }
    };

    nodes.forEach(applyColor);
  }

  /**
   * Get link color from current scheme
   * Requirements: 10.4
   */
  getLinkColor(): string | undefined {
    return this.currentScheme.linkColor;
  }

  /**
   * Get highlight color from current scheme
   * Requirements: 10.4
   */
  getHighlightColor(): string | undefined {
    return this.currentScheme.highlightColor;
  }

  /**
   * Save color scheme to localStorage
   * Requirements: 10.7
   */
  private saveSchemeToStorage(scheme: ColorScheme): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(scheme));
      }
    } catch (error) {
      // Silently fail if localStorage is not available or quota exceeded
      console.warn('Failed to save color scheme to localStorage:', error);
    }
  }

  /**
   * Load color scheme from localStorage
   * Requirements: 10.7
   */
  private loadSchemeFromStorage(): ColorScheme | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as ColorScheme;
          // Validate the loaded scheme
          if (
            parsed.name &&
            Array.isArray(parsed.colors) &&
            parsed.colors.length > 0
          ) {
            // If it's a known scheme, use the registered version
            const knownScheme = this.schemes.get(parsed.name);
            if (knownScheme) {
              return knownScheme;
            }
            // Otherwise, use the saved custom scheme
            return parsed;
          }
        }
      }
    } catch (error) {
      // Silently fail if localStorage is not available or data is corrupted
      console.warn('Failed to load color scheme from localStorage:', error);
    }
    return null;
  }

  /**
   * Clear saved color scheme from localStorage
   * Requirements: 10.7
   */
  clearStoredScheme(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.warn('Failed to clear color scheme from localStorage:', error);
    }
  }
}
