import type MarkdownIt from 'markdown-it';
import { CSSItem, IPureNode, JSItem, UrlBuilder } from 'markmap-common';
import { IHtmlParserOptions, buildTree } from 'markmap-html-parser';
import { initializeMarkdownIt } from './markdown-it';
import { plugins as availablePlugins, createTransformHooks } from './plugins';
import {
  IAssets,
  IFeatures,
  ITransformContext,
  ITransformHooks,
  ITransformPlugin,
  ITransformResult,
  ITransformer,
} from './types';
import {
  IEnhancedParseOptions,
  ISeparatorConfig,
  DEFAULT_SEPARATORS,
} from './enhanced-types';
import {
  patchCSSItem,
  patchJSItem,
  parseInlineNote,
  extractBlockquoteContent,
} from './util';

export const builtInPlugins = __define__.NO_PLUGINS ? [] : availablePlugins;

function cleanNode(node: IPureNode): IPureNode {
  while (!node.content && node.children.length === 1) {
    node = node.children[0];
  }
  while (node.children.length === 1 && !node.children[0].content) {
    node = {
      ...node,
      children: node.children[0].children,
    };
  }
  return {
    ...node,
    children: node.children.map(cleanNode),
  };
}

export class Transformer implements ITransformer {
  hooks: ITransformHooks;

  md: MarkdownIt;

  assetsMap: Record<string, IAssets> = {};

  urlBuilder = new UrlBuilder();

  plugins: ITransformPlugin[];

  /**
   * Separator configuration for parsing notes and handling escape characters.
   * Requirements: 6.7, 13.3, 13.8
   */
  separators: Required<ISeparatorConfig>;

  constructor(
    plugins: Array<
      ITransformPlugin | (() => ITransformPlugin)
    > = builtInPlugins,
    options?: IEnhancedParseOptions,
  ) {
    this.hooks = createTransformHooks(this);
    this.plugins = plugins.map((plugin) =>
      typeof plugin === 'function' ? plugin() : plugin,
    );

    // Initialize separator configuration with defaults
    // Requirement 13.8: Use default values when not specified
    this.separators = {
      ...DEFAULT_SEPARATORS,
      ...options?.separators,
    };

    const assetsMap: typeof this.assetsMap = {};
    for (const { name, transform } of this.plugins) {
      assetsMap[name] = transform(this.hooks);
    }
    this.assetsMap = assetsMap;

    const md = initializeMarkdownIt();
    this.md = md;
    this.hooks.parser.call(md);
  }

  transform(
    content: string,
    fallbackParserOptions?: Partial<IHtmlParserOptions>,
  ): ITransformResult {
    const context: ITransformContext = {
      content,
      features: {},
      parserOptions: fallbackParserOptions,
    };
    this.hooks.beforeParse.call(this.md, context);
    let { content: rawContent } = context;
    if (context.frontmatterInfo)
      rawContent = rawContent.slice(context.frontmatterInfo.offset);
    const html = this.md.render(rawContent, {});
    this.hooks.afterParse.call(this.md, context);
    let root = cleanNode(buildTree(html, context.parserOptions));
    root.content ||= `${context.frontmatter?.title || ''}`;

    // Apply custom separator parsing to extract notes from nodes
    // Requirement 6.7: Use configured separators for parsing
    root = this.parseNotesInTree(root);

    return { ...context, root };
  }

  /**
   * Recursively parse notes in the node tree using configured separators.
   *
   * This method applies the custom separator configuration to extract inline
   * and detailed notes from each node in the tree.
   *
   * Requirements: 6.7, 13.3, 13.8
   *
   * @param node - The node to process
   * @returns The node with parsed notes
   */
  private parseNotesInTree(node: IPureNode): IPureNode {
    const content = node.content || '';

    // Check if content contains blockquote (detailed note)
    // Note: Create a new regex each time to avoid state issues with global flag
    const hasBlockquote = /<blockquote[^>]*>[\s\S]*?<\/blockquote>/i.test(
      content,
    );

    // Check if content contains other HTML tags (excluding blockquote, p, br, ul, ol, li, strong, em)
    // We need to be more specific: match opening tags that are NOT in our allowed list
    const nonBlockquoteHtmlRegex =
      /<(?!\/?(blockquote|p|br|ul|ol|li|strong|em|b|i)\b)[a-z][^>]*>/i;
    const hasOtherHtml = nonBlockquoteHtmlRegex.test(content);

    let parsed: {
      mainContent: string;
      inlineNote?: string;
      detailedNote?: string;
      children: any[];
    };

    if (hasOtherHtml) {
      // Skip note parsing for HTML content (except blockquotes)
      // This prevents parsing HTML attributes and URLs as notes
      parsed = {
        mainContent: content,
        children: node.children || [],
      };
    } else if (hasBlockquote) {
      // Extract blockquote from content and parse it as detailed note
      let mainContent = content;
      let detailedNote: string | undefined;

      // Extract all blockquotes
      // Create a new regex for replacement to avoid state issues
      const blockquoteRegex = /<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi;
      const blockquotes: string[] = [];
      mainContent = content.replace(blockquoteRegex, (match) => {
        blockquotes.push(match);
        return '';
      });

      // Clean up the main content
      mainContent = mainContent.trim();

      // Parse inline note from main content if present
      const inlineResult = parseInlineNote(
        mainContent,
        this.separators.note,
        this.separators.escape,
      );

      // Extract text from blockquotes
      if (blockquotes.length > 0) {
        const noteTexts = blockquotes.map((bq) =>
          extractBlockquoteContent(bq, 'blockquote'),
        );
        detailedNote = noteTexts.join('\n').trim();
      }

      parsed = {
        mainContent: inlineResult.mainContent,
        inlineNote: inlineResult.inlineNote,
        detailedNote,
        children: node.children || [],
      };
    } else {
      // Parse notes from plain text content
      // For nodes without blockquotes, only parse inline notes
      const inlineResult = parseInlineNote(
        content,
        this.separators.note,
        this.separators.escape,
      );

      parsed = {
        mainContent: inlineResult.mainContent,
        inlineNote: inlineResult.inlineNote,
        children: node.children || [],
      };
    }

    // Create enhanced node with parsed notes
    const enhancedNode: IPureNode = {
      ...node,
      content: parsed.mainContent,
      children: parsed.children.map((child) => this.parseNotesInTree(child)),
    };

    // Only add note fields if they exist (to avoid polluting snapshots)
    // Note: We check for !== undefined to include empty strings
    if (parsed.inlineNote !== undefined || parsed.detailedNote !== undefined) {
      (enhancedNode as any).inlineNote = parsed.inlineNote;
      (enhancedNode as any).detailedNote = parsed.detailedNote;
      (enhancedNode as any).hasNote = true;
    }

    return enhancedNode;
  }

  resolveJS(item: JSItem) {
    return patchJSItem(this.urlBuilder, item);
  }

  resolveCSS(item: CSSItem) {
    return patchCSSItem(this.urlBuilder, item);
  }

  /**
   * Get all assets from enabled plugins or filter them by plugin names as keys.
   */
  getAssets(keys?: string[]): IAssets {
    const styles: CSSItem[] = [];
    const scripts: JSItem[] = [];
    keys ??= this.plugins.map((plugin) => plugin.name);
    for (const assets of keys.map((key) => this.assetsMap[key])) {
      if (assets) {
        if (assets.styles) styles.push(...assets.styles);
        if (assets.scripts) scripts.push(...assets.scripts);
      }
    }
    return {
      styles: styles.map((item) => this.resolveCSS(item)),
      scripts: scripts.map((item) => this.resolveJS(item)),
    };
  }

  /**
   * Get used assets by features object returned by `transform`.
   */
  getUsedAssets(features: IFeatures): IAssets {
    const keys = this.plugins
      .map((plugin) => plugin.name)
      .filter((name) => features[name]);
    return this.getAssets(keys);
  }
}
