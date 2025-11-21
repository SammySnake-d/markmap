/**
 * Example demonstrating expandAll and collapseAll functionality
 *
 * Requirements:
 * - 2.1: Expand node and all its children
 * - 2.2: Collapse all children under a node
 */

import { Markmap } from '../src/view';
import type { INode } from 'markmap-common';

// Create sample data with nested structure
const sampleData: INode = {
  type: 'heading',
  depth: 1,
  content: 'Root Node',
  children: [
    {
      type: 'heading',
      depth: 2,
      content: 'Child 1',
      children: [
        {
          type: 'heading',
          depth: 3,
          content: 'Grandchild 1.1',
          children: [],
          payload: { fold: 1 }, // Initially collapsed
        },
        {
          type: 'heading',
          depth: 3,
          content: 'Grandchild 1.2',
          children: [],
          payload: { fold: 1 }, // Initially collapsed
        },
      ],
      payload: { fold: 1 }, // Initially collapsed
    },
    {
      type: 'heading',
      depth: 2,
      content: 'Child 2',
      children: [
        {
          type: 'heading',
          depth: 3,
          content: 'Grandchild 2.1',
          children: [],
          payload: { fold: 1 }, // Initially collapsed
        },
      ],
      payload: { fold: 1 }, // Initially collapsed
    },
  ],
  payload: {},
};

// Example usage in browser environment
export function demonstrateExpandCollapse() {
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');
  document.body.appendChild(svg);

  // Create Markmap instance
  const mm = Markmap.create(svg, {}, sampleData);

  // Example 1: Expand all nodes from root
  console.log('Expanding all nodes...');
  mm.expandAll().then(() => {
    console.log('All nodes expanded');

    // Wait 2 seconds, then collapse all
    setTimeout(() => {
      console.log('Collapsing all nodes...');
      mm.collapseAll().then(() => {
        console.log('All nodes collapsed');
      });
    }, 2000);
  });

  // Example 2: Expand/collapse specific node
  // Get the first child node
  const firstChild = sampleData.children[0];

  setTimeout(() => {
    console.log('Expanding first child and its descendants...');
    mm.expandAll(firstChild).then(() => {
      console.log('First child expanded');

      // Wait 2 seconds, then collapse it
      setTimeout(() => {
        console.log('Collapsing first child and its descendants...');
        mm.collapseAll(firstChild).then(() => {
          console.log('First child collapsed');
        });
      }, 2000);
    });
  }, 6000);
}

// Example: Check fold state
export function checkFoldState(node: INode, indent = 0): void {
  const prefix = '  '.repeat(indent);
  const foldState = node.payload?.fold ? 'collapsed' : 'expanded';
  console.log(`${prefix}${node.content}: ${foldState}`);

  node.children?.forEach((child) => {
    checkFoldState(child, indent + 1);
  });
}

// Example: Expand all then check state
export async function testExpandAll(mm: Markmap, rootNode: INode) {
  console.log('Before expandAll:');
  checkFoldState(rootNode);

  await mm.expandAll();

  console.log('\nAfter expandAll:');
  checkFoldState(rootNode);
}

// Example: Collapse all then check state
export async function testCollapseAll(mm: Markmap, rootNode: INode) {
  console.log('Before collapseAll:');
  checkFoldState(rootNode);

  await mm.collapseAll();

  console.log('\nAfter collapseAll:');
  checkFoldState(rootNode);
}
