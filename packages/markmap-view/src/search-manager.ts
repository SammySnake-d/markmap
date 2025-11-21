import { INode } from 'markmap-common';

/**
 * Search result interface.
 * Requirements: 1.1, 1.2
 */
export interface SearchResult {
  node: INode;
  matchType: 'content' | 'inlineNote' | 'detailedNote';
  matchText: string;
  matchIndex: number;
}

/**
 * SearchManager handles fuzzy search functionality for mindmap nodes.
 *
 * Requirements:
 * - 1.1: Fuzzy match search in node content and notes
 * - 1.2: Highlight matching nodes
 * - 1.4: Navigate between search results
 */
export class SearchManager {
  private results: SearchResult[] = [];
  private currentIndex: number = -1;

  /**
   * Performs fuzzy search across all nodes.
   *
   * Requirements:
   * - 1.1: Search in node main content and note content using fuzzy matching
   *
   * @param keyword - The search keyword
   * @param nodes - Array of nodes to search through
   * @returns Array of search results
   */
  search(keyword: string, nodes: INode[]): SearchResult[] {
    // Clear previous results
    this.results = [];
    this.currentIndex = -1;

    // Return empty if keyword is empty
    if (!keyword || keyword.trim() === '') {
      return this.results;
    }

    const normalizedKeyword = keyword.toLowerCase().trim();
    let matchIndex = 0;

    // Search through all nodes
    for (const node of nodes) {
      // Search in main content
      if (node.content) {
        const normalizedContent = this.stripHtml(node.content).toLowerCase();
        if (normalizedContent.includes(normalizedKeyword)) {
          this.results.push({
            node,
            matchType: 'content',
            matchText: node.content,
            matchIndex: matchIndex++,
          });
          continue; // Skip checking notes if content matches
        }
      }

      // Search in inline note (Requirements: 1.1)
      const inlineNote = node.payload?.inlineNote as string | undefined;
      if (inlineNote && typeof inlineNote === 'string') {
        const normalizedNote = inlineNote.toLowerCase();
        if (normalizedNote.includes(normalizedKeyword)) {
          this.results.push({
            node,
            matchType: 'inlineNote',
            matchText: inlineNote,
            matchIndex: matchIndex++,
          });
          continue;
        }
      }

      // Search in detailed note (Requirements: 1.1)
      const detailedNote = node.payload?.detailedNote as string | undefined;
      if (detailedNote && typeof detailedNote === 'string') {
        const normalizedNote = detailedNote.toLowerCase();
        if (normalizedNote.includes(normalizedKeyword)) {
          this.results.push({
            node,
            matchType: 'detailedNote',
            matchText: detailedNote,
            matchIndex: matchIndex++,
          });
        }
      }
    }

    // Set current index to first result if any
    if (this.results.length > 0) {
      this.currentIndex = 0;
    }

    return this.results;
  }

  /**
   * Strips HTML tags from content for search.
   * @param html - HTML string
   * @returns Plain text
   */
  private stripHtml(html: string): string {
    // Simple HTML tag removal
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Gets all search results.
   * @returns Array of search results
   */
  getResults(): SearchResult[] {
    return this.results;
  }

  /**
   * Gets the current search result.
   * @returns Current search result or null
   */
  getCurrent(): SearchResult | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.results.length) {
      return this.results[this.currentIndex];
    }
    return null;
  }

  /**
   * Navigates to the next search result.
   *
   * Requirements:
   * - 1.4: Provide next button to navigate between matches
   *
   * @returns Next search result or null if no more results
   */
  next(): SearchResult | null {
    if (this.results.length === 0) {
      return null;
    }

    this.currentIndex = (this.currentIndex + 1) % this.results.length;
    return this.results[this.currentIndex];
  }

  /**
   * Navigates to the previous search result.
   *
   * Requirements:
   * - 1.4: Provide previous button to navigate between matches
   *
   * @returns Previous search result or null if no more results
   */
  previous(): SearchResult | null {
    if (this.results.length === 0) {
      return null;
    }

    this.currentIndex =
      (this.currentIndex - 1 + this.results.length) % this.results.length;
    return this.results[this.currentIndex];
  }

  /**
   * Gets the current index.
   * @returns Current index or -1 if no results
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Gets the total number of results.
   * @returns Total number of search results
   */
  getResultCount(): number {
    return this.results.length;
  }

  /**
   * Highlights all matching nodes.
   *
   * Requirements:
   * - 1.2: Highlight matching nodes
   *
   * @param results - Search results to highlight
   */
  highlight(results: SearchResult[]): void {
    // Mark all result nodes as highlighted
    for (const result of results) {
      if (result.node.payload) {
        result.node.payload.highlighted = true;
      } else {
        result.node.payload = { highlighted: true };
      }
    }
  }

  /**
   * Clears all highlights from nodes.
   *
   * Requirements:
   * - 1.5: Clear search removes all highlights
   */
  clearHighlight(): void {
    // Remove highlight flag from all result nodes
    for (const result of this.results) {
      if (result.node.payload) {
        result.node.payload.highlighted = false;
      }
    }
  }

  /**
   * Clears all search results.
   *
   * Requirements:
   * - 1.5: Clear search removes all highlights
   */
  clear(): void {
    this.clearHighlight();
    this.results = [];
    this.currentIndex = -1;
  }

  /**
   * Expands all ancestor nodes of search results to make them visible.
   *
   * Requirements:
   * - 1.3: Auto-expand nodes containing search results
   *
   * @param rootNode - The root node of the tree
   */
  expandResultNodes(rootNode: INode): void {
    if (this.results.length === 0) {
      return;
    }

    // Build a map of node IDs to nodes for quick lookup
    const nodeMap = new Map<number, INode>();
    const parentMap = new Map<number, INode>();

    // Walk the tree to build the maps
    const buildMaps = (node: INode, parent?: INode) => {
      if (node.state?.id !== undefined) {
        nodeMap.set(node.state.id, node);
        if (parent && parent.state?.id !== undefined) {
          parentMap.set(node.state.id, parent);
        }
      }

      if (node.children) {
        for (const child of node.children) {
          buildMaps(child, node);
        }
      }
    };

    buildMaps(rootNode);

    // For each search result, expand all ancestors
    for (const result of this.results) {
      const resultNode = result.node;
      if (!resultNode.state?.id) continue;

      // Walk up the tree and expand all ancestors
      let currentId = resultNode.state.id;
      let parent = parentMap.get(currentId);

      while (parent) {
        // Expand the parent node (fold = 0 means expanded)
        if (parent.payload?.fold) {
          parent.payload.fold = 0;
        }

        // Move to the next parent
        if (parent.state?.id !== undefined) {
          currentId = parent.state.id;
          parent = parentMap.get(currentId);
        } else {
          break;
        }
      }
    }
  }
}
