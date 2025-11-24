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
  // 注意：导出功能已移至 markmap-view 层
  // 请使用 Markmap 类的导出方法：
  // - Markmap.exportAsMarkdown()
  // - Markmap.exportAsSVG()
  // - Markmap.exportAsPNG()
  // - Markmap.downloadAsSVG()
  //
  // 这些方法包含完整的样式、命名空间和优化的实现

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
