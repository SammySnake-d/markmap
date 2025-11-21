/**
 * Example: Using exportToMarkdown to convert node trees back to Markdown
 *
 * This example demonstrates how to:
 * 1. Parse Markdown with notes
 * 2. Export the node tree back to Markdown
 * 3. Verify round-trip consistency
 *
 * Requirements: 4.2, 4.3, 4.4, 5.11, 6.10
 */

import { Transformer, exportToMarkdown } from '../src';

// Example 1: Simple export
console.log('=== Example 1: Simple Export ===');
const markdown1 = `- Main Topic
  - Subtopic 1
  - Subtopic 2`;

const transformer = new Transformer();
const { root: tree1 } = transformer.transform(markdown1);
const exported1 = exportToMarkdown(tree1);

console.log('Original Markdown:');
console.log(markdown1);
console.log('\nExported Markdown:');
console.log(exported1);

// Example 2: Export with inline notes
console.log('\n=== Example 2: Export with Inline Notes ===');
const markdown2 = `- Topic: This is an inline note
  - Subtopic: Another note`;

const { root: tree2 } = transformer.transform(markdown2);
const exported2 = exportToMarkdown(tree2);

console.log('Original Markdown:');
console.log(markdown2);
console.log('\nExported Markdown:');
console.log(exported2);

// Example 3: Export with detailed notes
console.log('\n=== Example 3: Export with Detailed Notes ===');
const markdown3 = `- Topic
  > This is a detailed note
  > It can span multiple lines
  - Subtopic`;

const { root: tree3 } = transformer.transform(markdown3);
const exported3 = exportToMarkdown(tree3);

console.log('Original Markdown:');
console.log(markdown3);
console.log('\nExported Markdown:');
console.log(exported3);

// Example 4: Export with both types of notes
console.log('\n=== Example 4: Export with Both Types of Notes ===');
const markdown4 = `- Topic: Inline note
  > Detailed note line 1
  > Detailed note line 2
  - Subtopic: Another inline note`;

const { root: tree4 } = transformer.transform(markdown4);
const exported4 = exportToMarkdown(tree4);

console.log('Original Markdown:');
console.log(markdown4);
console.log('\nExported Markdown:');
console.log(exported4);

// Example 5: Export with escaped separators
console.log('\n=== Example 5: Export with Escaped Separators ===');
const markdown5 = `- Topic with\\: colon: Note with\\: colon
  - Subtopic`;

const { root: tree5 } = transformer.transform(markdown5);
const exported5 = exportToMarkdown(tree5);

console.log('Original Markdown:');
console.log(markdown5);
console.log('\nExported Markdown:');
console.log(exported5);

// Example 6: Export subtree (not from root)
console.log('\n=== Example 6: Export Subtree ===');
const markdown6 = `- Root
  - Branch 1
    - Leaf 1
    - Leaf 2
  - Branch 2`;

const { root: tree6 } = transformer.transform(markdown6);
// Export only the first child (Branch 1)
if (tree6.children && tree6.children.length > 0) {
  const subtree = tree6.children[0];
  const exportedSubtree = exportToMarkdown(subtree);

  console.log('Exporting subtree (Branch 1):');
  console.log(exportedSubtree);
}

// Example 7: Custom separators
console.log('\n=== Example 7: Custom Separators ===');
const markdown7 = `- Topic | Custom note
  - Subtopic`;

const customTransformer = new Transformer(undefined, {
  separators: { note: '|' },
});
const { root: tree7 } = customTransformer.transform(markdown7);
const exported7 = exportToMarkdown(tree7, { noteSeparator: '|' });

console.log('Original Markdown (with custom separator):');
console.log(markdown7);
console.log('\nExported Markdown:');
console.log(exported7);

// Example 8: Round-trip verification
console.log('\n=== Example 8: Round-trip Verification ===');
const markdown8 = `- Complex Topic: With note
  > Detailed explanation
  > Multiple lines
  - Child 1: Child note
  - Child 2`;

const { root: tree8 } = transformer.transform(markdown8);
const exported8 = exportToMarkdown(tree8);
const { root: reparsed8 } = transformer.transform(exported8);

console.log('Original Markdown:');
console.log(markdown8);
console.log('\nExported Markdown:');
console.log(exported8);
console.log('\nRound-trip successful:', tree8.content === reparsed8.content);
