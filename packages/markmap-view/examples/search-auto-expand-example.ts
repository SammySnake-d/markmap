/**
 * Example: Search with Auto-Expand
 *
 * This example demonstrates how to use the search functionality
 * with automatic expansion of ancestor nodes.
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import { Markmap, SearchManager } from '../src';
import { walkTree } from 'markmap-common';
import type { INode } from 'markmap-common';

// Example data structure with folded nodes
const exampleData: INode = {
  content: 'Programming Languages',
  children: [
    {
      content: 'Frontend',
      payload: { fold: 1 }, // Folded by default
      children: [
        {
          content: 'JavaScript',
          children: [
            {
              content: 'JavaScript Basics',
              payload: { inlineNote: 'Variables, functions, objects' },
              children: [],
            },
            {
              content: 'JavaScript Advanced',
              payload: { inlineNote: 'Closures, promises, async/await' },
              children: [],
            },
          ],
        },
        {
          content: 'TypeScript',
          children: [
            {
              content: 'TypeScript Fundamentals',
              children: [],
            },
          ],
        },
      ],
    },
    {
      content: 'Backend',
      payload: { fold: 1 }, // Folded by default
      children: [
        {
          content: 'Python',
          children: [
            {
              content: 'Python Basics',
              children: [],
            },
          ],
        },
        {
          content: 'Java',
          children: [
            {
              content: 'Java Fundamentals',
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

// Initialize the mindmap
function initializeMindmap() {
  const svg = document.querySelector<SVGElement>('#mindmap');
  if (!svg) {
    throw new Error('SVG element not found');
  }

  const markmap = new Markmap(svg, {
    duration: 300,
    maxWidth: 300,
  });

  const searchManager = new SearchManager();

  return { markmap, searchManager };
}

// Collect all nodes from the tree
function collectAllNodes(rootNode: INode): INode[] {
  const allNodes: INode[] = [];
  walkTree(rootNode, (node) => {
    allNodes.push(node);
  });
  return allNodes;
}

// Main search function with auto-expand
async function performSearch(
  keyword: string,
  markmap: Markmap,
  searchManager: SearchManager,
  rootNode: INode,
  allNodes: INode[],
) {
  console.log(`Searching for: "${keyword}"`);

  // Clear previous search
  searchManager.clear();
  await markmap.renderData();

  if (!keyword.trim()) {
    console.log('Empty keyword, search cleared');
    return;
  }

  // Perform search (Requirement 1.1)
  const results = searchManager.search(keyword, allNodes);

  if (results.length === 0) {
    console.log('No results found');
    return;
  }

  console.log(`Found ${results.length} results:`);
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.node.content} (${result.matchType})`);
  });

  // Highlight results (Requirement 1.2)
  searchManager.highlight(results);

  // Auto-expand ancestors (Requirement 1.3)
  searchManager.expandResultNodes(rootNode);

  // Re-render to show expanded nodes
  await markmap.renderData();

  // Optionally, center on first result
  if (results.length > 0) {
    await markmap.ensureVisible(results[0].node);
  }

  console.log('Search complete, ancestors expanded');
}

// Navigate to next result
async function navigateNext(markmap: Markmap, searchManager: SearchManager) {
  const next = searchManager.next();
  if (next) {
    console.log(`Navigating to: ${next.node.content}`);
    await markmap.ensureVisible(next.node);
  }
}

// Navigate to previous result
async function navigatePrevious(
  markmap: Markmap,
  searchManager: SearchManager,
) {
  const prev = searchManager.previous();
  if (prev) {
    console.log(`Navigating to: ${prev.node.content}`);
    await markmap.ensureVisible(prev.node);
  }
}

// Clear search
async function clearSearch(markmap: Markmap, searchManager: SearchManager) {
  console.log('Clearing search');
  searchManager.clear();
  await markmap.renderData();
}

// Example usage
async function main() {
  // Initialize
  const { markmap, searchManager } = initializeMindmap();

  // Set data
  await markmap.setData(exampleData);

  // Collect all nodes
  const allNodes = collectAllNodes(exampleData);

  // Example 1: Search for "JavaScript"
  // This will find "JavaScript", "JavaScript Basics", and "JavaScript Advanced"
  // and expand the "Frontend" node to make them visible
  await performSearch(
    'javascript',
    markmap,
    searchManager,
    exampleData,
    allNodes,
  );

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Example 2: Navigate through results
  await navigateNext(markmap, searchManager);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await navigateNext(markmap, searchManager);

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Example 3: Clear search
  await clearSearch(markmap, searchManager);

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Example 4: Search for "Python"
  // This will find "Python" and "Python Basics"
  // and expand the "Backend" node
  await performSearch('python', markmap, searchManager, exampleData, allNodes);
}

// Run the example
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error);
  });
} else {
  // Node environment (for testing)
  console.log('This example is meant to run in a browser environment');
}

export { performSearch, navigateNext, navigatePrevious, clearSearch };
