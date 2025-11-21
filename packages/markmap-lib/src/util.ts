import { CSSItem, JSItem, UrlBuilder } from 'markmap-common';
import { DEFAULT_SEPARATORS } from './enhanced-types';

export function patchJSItem(urlBuilder: UrlBuilder, item: JSItem): JSItem {
  if (item.type === 'script' && item.data.src) {
    return {
      ...item,
      data: {
        ...item.data,
        src: urlBuilder.getFullUrl(item.data.src),
      },
    };
  }
  return item;
}

export function patchCSSItem(urlBuilder: UrlBuilder, item: CSSItem): CSSItem {
  if (item.type === 'stylesheet' && item.data.href) {
    return {
      ...item,
      data: {
        ...item.data,
        href: urlBuilder.getFullUrl(item.data.href),
      },
    };
  }
  return item;
}

/**
 * Removes escape characters from text, preserving the escaped character.
 *
 * Example: "Hello\\: World" -> "Hello: World"
 *
 * Requirements: 6.8, 6.9
 *
 * @param text - The text to process
 * @param escapeChar - The escape character (default: '\')
 * @returns The text with escape characters removed
 */
export function handleEscape(
  text: string,
  escapeChar: string = DEFAULT_SEPARATORS.escape,
): string {
  if (!text || !escapeChar) return text;

  // Create a regex that matches the escape character followed by any character
  // We need to escape the escape character itself for the regex
  const escapedChar = escapeChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedChar}(.)`, 'g');

  // Replace escape sequences with just the escaped character
  return text.replace(regex, '$1');
}

/**
 * Adds escape characters before separator characters in text.
 *
 * Example: "Hello: World" with separator ':' -> "Hello\\: World"
 *
 * Requirements: 6.10
 *
 * @param text - The text to process
 * @param separator - The separator character to escape
 * @param escapeChar - The escape character to use (default: '\')
 * @returns The text with separators escaped
 */
export function addEscape(
  text: string,
  separator: string,
  escapeChar: string = DEFAULT_SEPARATORS.escape,
): string {
  if (!text || !separator) return text;

  // Escape special regex characters in the separator
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedSeparator, 'g');

  // Add escape character before each separator
  return text.replace(regex, `${escapeChar}${separator}`);
}

/**
 * Parses inline note from content using the note separator.
 *
 * This function splits content on the FIRST occurrence of the note separator,
 * treating everything before as main content and everything after as the inline note.
 * Escaped separators are handled correctly and not treated as split points.
 *
 * Requirements: 5.1, 5.10, 6.1
 *
 * @param content - The content to parse
 * @param noteSeparator - The separator between content and note (default: ':')
 * @param escapeChar - The escape character (default: '\')
 * @returns Object with mainContent and inlineNote (if found)
 */
export function parseInlineNote(
  content: string,
  noteSeparator: string = DEFAULT_SEPARATORS.note,
  escapeChar: string = DEFAULT_SEPARATORS.escape,
): { mainContent: string; inlineNote?: string } {
  if (!content || !noteSeparator) {
    return { mainContent: content };
  }

  // Find the first unescaped separator
  let separatorIndex = -1;
  let i = 0;

  while (i < content.length) {
    // Check if we found the separator
    if (content.substring(i, i + noteSeparator.length) === noteSeparator) {
      // Check if it's escaped (preceded by escape character)
      if (i > 0 && content.substring(i - escapeChar.length, i) === escapeChar) {
        // This separator is escaped, skip it
        i += noteSeparator.length;
        continue;
      }
      // Found an unescaped separator
      separatorIndex = i;
      break;
    }
    i++;
  }

  // If no separator found, return the whole content as main content
  if (separatorIndex === -1) {
    return { mainContent: handleEscape(content, escapeChar) };
  }

  // Split at the first unescaped separator
  const mainContent = content.substring(0, separatorIndex);
  const inlineNote = content.substring(separatorIndex + noteSeparator.length);

  // Remove escape characters from both parts
  return {
    mainContent: handleEscape(mainContent.trim(), escapeChar),
    inlineNote: handleEscape(inlineNote.trim(), escapeChar),
  };
}

/**
 * Parses detailed note from a node's children.
 *
 * This function checks if the first child (or first consecutive group of children)
 * is a blockquote element (created from markdown '>' lines). If found, it extracts
 * the content and removes those children from the array.
 *
 * Requirements: 5.2, 6.2, 6.6
 *
 * @param children - Array of child nodes to check
 * @param noteBlockMarker - The HTML tag that represents a note block (default: 'blockquote')
 * @returns Object with detailedNote (if found) and the filtered children array
 */
export function parseDetailedNote(
  children: any[],
  noteBlockMarker: string = 'blockquote',
): { detailedNote?: string; children: any[] } {
  if (!children || children.length === 0) {
    return { children };
  }

  // Check if the first child is a blockquote (note block)
  const firstChild = children[0];

  // The content is HTML, so we need to check if it starts with the note block marker
  if (!firstChild.content || typeof firstChild.content !== 'string') {
    return { children };
  }

  // Check if the content starts with a blockquote tag
  const blockquoteRegex = new RegExp(`^<${noteBlockMarker}[^>]*>`, 'i');
  if (!blockquoteRegex.test(firstChild.content.trim())) {
    return { children };
  }

  // Extract all consecutive blockquote children (Requirement 6.6)
  const noteBlocks: string[] = [];
  let i = 0;
  let foundBlockquote = false;

  while (i < children.length) {
    const child = children[i];
    if (!child.content || typeof child.content !== 'string') {
      break;
    }

    const trimmedContent = child.content.trim();
    if (!blockquoteRegex.test(trimmedContent)) {
      break;
    }

    foundBlockquote = true;

    // Extract the content from the blockquote HTML
    const content = extractBlockquoteContent(trimmedContent, noteBlockMarker);
    // Always add to noteBlocks, even if empty (to handle empty blockquotes)
    noteBlocks.push(content);
    i++;
  }

  // If we found blockquote elements, combine them and remove from children
  if (foundBlockquote) {
    const detailedNote = noteBlocks.join('\n').trim();
    const filteredChildren = children.slice(i);

    return {
      detailedNote: detailedNote || '', // Return empty string if content is empty after trimming
      children: filteredChildren,
    };
  }

  return { children };
}

/**
 * Extracts text content from a blockquote HTML string.
 *
 * This is a helper function for parseDetailedNote that strips HTML tags
 * while preserving the text content and basic formatting.
 *
 * @param html - The HTML string containing a blockquote
 * @param tag - The blockquote tag name (default: 'blockquote')
 * @returns The extracted text content
 */
function extractBlockquoteContent(
  html: string,
  tag: string = 'blockquote',
): string {
  // Remove the opening and closing blockquote tags
  const openTagRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
  const closeTagRegex = new RegExp(`</${tag}>`, 'gi');

  let content = html.replace(openTagRegex, '').replace(closeTagRegex, '');

  // Replace <p> tags with newlines to preserve paragraph structure
  content = content.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n');

  // Replace <br> tags with newlines
  content = content.replace(/<br\s*\/?>/gi, '\n');

  // Replace list item tags with newlines to preserve list structure
  content = content.replace(/<li[^>]*>/gi, '').replace(/<\/li>/gi, '\n');

  // Remove list container tags (ul, ol) but keep the content
  content = content.replace(/<\/?[uo]l[^>]*>/gi, '');

  // Remove other HTML tags but keep the content
  content = content.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  content = decodeHtmlEntities(content);

  // Clean up extra whitespace while preserving intentional line breaks
  content = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return content;
}

/**
 * Decodes common HTML entities to their character equivalents.
 *
 * @param text - Text containing HTML entities
 * @returns Text with entities decoded
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  return result;
}

/**
 * Parses both inline and detailed notes from a node.
 *
 * This function combines parseInlineNote and parseDetailedNote to handle
 * nodes that may have both types of notes simultaneously.
 *
 * Requirements: 5.3, 6.3
 *
 * @param content - The node's content (may contain inline note)
 * @param children - The node's children (may contain detailed note)
 * @param noteSeparator - The separator between content and inline note (default: ':')
 * @param noteBlockMarker - The HTML tag for detailed notes (default: 'blockquote')
 * @param escapeChar - The escape character (default: '\')
 * @returns Object with mainContent, inlineNote, detailedNote, and filtered children
 */
export function parseMixedNotes(
  content: string,
  children: any[],
  noteSeparator: string = DEFAULT_SEPARATORS.note,
  noteBlockMarker: string = 'blockquote',
  escapeChar: string = DEFAULT_SEPARATORS.escape,
): {
  mainContent: string;
  inlineNote?: string;
  detailedNote?: string;
  children: any[];
} {
  // Step 1: Parse inline note from content
  const inlineResult = parseInlineNote(content, noteSeparator, escapeChar);

  // Step 2: Parse detailed note from children
  const detailedResult = parseDetailedNote(children, noteBlockMarker);

  // Step 3: Combine results
  return {
    mainContent: inlineResult.mainContent,
    inlineNote: inlineResult.inlineNote,
    detailedNote: detailedResult.detailedNote,
    children: detailedResult.children,
  };
}
