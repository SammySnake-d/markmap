import type { INode } from '../models/node';

/**
 * Markmap 功能 API 接口
 * 提供数据操作、视图控制、导出等高级功能
 */
export interface IMarkmapAPI {
  // ==================== 数据操作 ====================

  /**
   * 设置思维导图数据
   * @param data - 根节点数据
   */
  setData(data: INode): void;

  /**
   * 获取当前思维导图数据
   * @returns 根节点数据
   */
  getData(): INode;

  /**
   * 更新指定节点的数据
   * @param nodeId - 节点 ID
   * @param data - 要更新的节点数据（部分）
   */
  updateNode(nodeId: string, data: Partial<INode>): void;

  // ==================== 视图控制 ====================

  /**
   * 自适应视图，使整个思维导图可见
   * @param maxScale - 最大缩放比例，默认不限制
   */
  fit(maxScale?: number): void;

  /**
   * 将指定节点居中显示
   * @param nodeId - 节点 ID
   */
  centerNode(nodeId: string): void;

  /**
   * 确保指定节点在可视区域内
   * @param nodeId - 节点 ID
   */
  ensureVisible(nodeId: string): void;

  // ==================== 节点操作 ====================

  /**
   * 切换节点的展开/折叠状态
   * @param nodeId - 节点 ID
   * @param recursive - 是否递归应用到所有子节点，默认 false
   */
  toggleNode(nodeId: string, recursive?: boolean): void;

  /**
   * 展开指定节点及其所有子节点
   * @param nodeId - 节点 ID，如果不提供则展开所有节点
   */
  expandAll(nodeId?: string): void;

  /**
   * 折叠指定节点及其所有子节点
   * @param nodeId - 节点 ID，如果不提供则折叠所有节点
   */
  collapseAll(nodeId?: string): void;

  // ==================== 导出功能 ====================

  /**
   * 导出节点及其子树为 Markdown 文本
   * @param nodeId - 节点 ID，如果不提供则导出整个思维导图
   * @returns Markdown 格式的文本
   */
  exportAsMarkdown(nodeId?: string): string;

  /**
   * 导出思维导图为 SVG 文本
   * @returns SVG 格式的文本
   */
  exportAsSVG(): string;

  /**
   * 导出思维导图为 PNG 图片
   * @returns PNG 图片的 Blob 对象
   */
  exportAsPNG(): Promise<Blob>;

  // ==================== 搜索功能 ====================

  /**
   * 搜索匹配查询的节点
   * @param query - 搜索查询字符串
   * @returns 匹配的节点数组
   */
  search(query: string): INode[];

  /**
   * 高亮显示指定节点
   * @param nodeId - 节点 ID
   */
  highlightNode(nodeId: string): void;

  /**
   * 清除所有高亮
   */
  clearHighlight(): void;
}
