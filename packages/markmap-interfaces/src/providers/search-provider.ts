import type { INode } from '../models/node';
import type { IMarkmapAPI } from '../core/markmap-api';

/**
 * 搜索结果接口
 */
export interface ISearchResult {
  /**
   * 匹配的节点
   */
  node: INode;

  /**
   * 匹配的文本片段
   */
  matches: string[];

  /**
   * 匹配得分（可选）
   * 用于排序搜索结果
   */
  score?: number;
}

/**
 * 搜索选项接口
 */
export interface ISearchOptions {
  /**
   * 是否区分大小写
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * 是否使用正则表达式
   * @default false
   */
  useRegex?: boolean;

  /**
   * 是否搜索整个单词
   * @default false
   */
  wholeWord?: boolean;

  /**
   * 最大结果数量
   * @default 无限制
   */
  maxResults?: number;
}

/**
 * 搜索功能 Provider 接口
 * 负责搜索功能的实现和结果展示
 */
export interface ISearchProvider {
  /**
   * 执行搜索
   * 在思维导图中搜索匹配的节点
   *
   * @param query - 搜索查询字符串
   * @param options - 搜索选项
   * @param api - Markmap API 实例
   * @returns 搜索结果数组
   *
   * @example
   * ```typescript
   * search(query, options, api) {
   *   const results: ISearchResult[] = [];
   *   const data = api.getData();
   *
   *   const searchNode = (node: INode) => {
   *     if (node.content.toLowerCase().includes(query.toLowerCase())) {
   *       results.push({
   *         node,
   *         matches: [query]
   *       });
   *     }
   *     node.children?.forEach(searchNode);
   *   };
   *
   *   searchNode(data);
   *   return results;
   * }
   * ```
   */
  search(
    query: string,
    options: ISearchOptions,
    api: IMarkmapAPI,
  ): ISearchResult[];

  /**
   * 高亮搜索结果
   * 在视图中高亮显示搜索到的节点
   *
   * @param results - 搜索结果数组
   * @param api - Markmap API 实例
   *
   * @example
   * ```typescript
   * highlightResults(results, api) {
   *   results.forEach(result => {
   *     api.highlightNode(result.node.state.id.toString());
   *   });
   * }
   * ```
   */
  highlightResults(results: ISearchResult[], api: IMarkmapAPI): void;

  /**
   * 清除搜索高亮
   * 移除所有搜索相关的高亮显示
   *
   * @param api - Markmap API 实例
   *
   * @example
   * ```typescript
   * clearHighlight(api) {
   *   api.clearHighlight();
   * }
   * ```
   */
  clearHighlight(api: IMarkmapAPI): void;

  /**
   * 导航到下一个搜索结果
   *
   * @param api - Markmap API 实例
   *
   * @example
   * ```typescript
   * nextResult(api) {
   *   if (this.currentIndex < this.results.length - 1) {
   *     this.currentIndex++;
   *     const result = this.results[this.currentIndex];
   *     api.centerNode(result.node.state.id.toString());
   *   }
   * }
   * ```
   */
  nextResult?(api: IMarkmapAPI): void;

  /**
   * 导航到上一个搜索结果
   *
   * @param api - Markmap API 实例
   */
  previousResult?(api: IMarkmapAPI): void;
}
