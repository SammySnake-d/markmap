import type { INode as INodeCommon } from 'markmap-common';
import type { INode, IMarkmapAPI } from 'markmap-interfaces';
import { walkTree } from 'markmap-common';
import type { MarkmapCore } from '../core/markmap-core';
import type { EventEmitter } from '../events/event-emitter';

/**
 * MarkmapAPI 类 - 功能 API 层
 *
 * 提供数据操作、视图控制、节点操作、导出和搜索等高级功能
 *
 * Requirements: 8.1, 8.2, 8.3
 *
 * 注意：此类使用 markmap-interfaces 的 INode 类型作为公共 API
 * 但内部使用 markmap-common 的 INode（包含 state）进行操作
 */
export class MarkmapAPI implements IMarkmapAPI {
  private core: MarkmapCore;
  private eventEmitter: EventEmitter;
  private data?: INodeCommon;

  constructor(core: MarkmapCore, eventEmitter: EventEmitter) {
    this.core = core;
    this.eventEmitter = eventEmitter;
  }

  // ==================== 数据操作 ====================

  /**
   * 设置思维导图数据
   * @param data - 根节点数据
   *
   * Requirements: 8.1
   */
  setData(data: INode): void {
    // 将接口类型转换为内部类型
    this.data = data as unknown as INodeCommon;
    this.core.renderData(this.data);
    this.eventEmitter.emit('data:change', data);
  }

  /**
   * 获取当前思维导图数据
   * @returns 根节点数据
   *
   * Requirements: 8.1
   */
  getData(): INode {
    if (!this.data) {
      throw new Error('No data has been set');
    }
    // 返回接口类型（state 属性是内部实现细节）
    return this.data as unknown as INode;
  }

  /**
   * 更新指定节点的数据
   * @param nodeId - 节点 ID
   * @param data - 要更新的节点数据（部分）
   *
   * Requirements: 8.1
   */
  updateNode(nodeId: string, data: Partial<INode>): void {
    if (!this.data) {
      throw new Error('No data has been set');
    }

    const node = this.findNodeById(nodeId);
    if (!node) {
      throw new Error(`Node with id "${nodeId}" not found`);
    }

    // 更新节点数据
    Object.assign(node, data);

    // 重新渲染
    this.core.renderData(this.data);
    this.eventEmitter.emit('data:change', this.data);
  }

  // ==================== 视图控制 ====================

  /**
   * 自适应视图，使整个思维导图可见
   * @param maxScale - 最大缩放比例，默认不限制
   *
   * Requirements: 8.1
   */
  fit(maxScale?: number): void {
    if (!this.data) return;

    const svg = this.core.getSVG();
    const svgRect = svg.getBoundingClientRect();
    const layout = this.core.calculateLayout(this.data);

    if (layout.nodes.length === 0) return;

    // 计算所有节点的边界
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    layout.nodes.forEach((node) => {
      const rect = node.data.state?.rect;
      if (rect) {
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.width);
        maxY = Math.max(maxY, rect.y + rect.height);
      }
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const scaleX = svgRect.width / contentWidth;
    const scaleY = svgRect.height / contentHeight;
    let scale = Math.min(scaleX, scaleY) * 0.95; // 留 5% 边距

    // 应用最大缩放限制
    if (maxScale !== undefined && scale > maxScale) {
      scale = maxScale;
    }

    // 计算居中位置
    const centerX = (svgRect.width - contentWidth * scale) / 2 - minX * scale;
    const centerY = (svgRect.height - contentHeight * scale) / 2 - minY * scale;

    this.core.applyTransform({
      x: centerX,
      y: centerY,
      k: scale,
    });

    this.eventEmitter.emit('view:fit');
  }

  /**
   * 将指定节点居中显示
   * @param nodeId - 节点 ID
   *
   * Requirements: 8.1
   */
  centerNode(nodeId: string): void {
    if (!this.data) return;

    const node = this.findNodeById(nodeId);
    if (!node || !node.state?.rect) {
      throw new Error(`Node with id "${nodeId}" not found or has no layout`);
    }

    const svg = this.core.getSVG();
    const svgRect = svg.getBoundingClientRect();
    const rect = node.state.rect;

    // 计算节点中心点
    const nodeCenterX = rect.x + rect.width / 2;
    const nodeCenterY = rect.y + rect.height / 2;

    // 获取当前缩放比例
    const currentTransform = this.getCurrentTransform();
    const scale = currentTransform.k;

    // 计算使节点居中的变换
    const x = svgRect.width / 2 - nodeCenterX * scale;
    const y = svgRect.height / 2 - nodeCenterY * scale;

    this.core.applyTransform({ x, y, k: scale });
    this.eventEmitter.emit('view:transform', { x, y, k: scale });
  }

  /**
   * 确保指定节点在可视区域内
   * @param nodeId - 节点 ID
   *
   * Requirements: 8.1
   */
  ensureVisible(nodeId: string): void {
    if (!this.data) return;

    const node = this.findNodeById(nodeId);
    if (!node || !node.state?.rect) {
      throw new Error(`Node with id "${nodeId}" not found or has no layout`);
    }

    const svg = this.core.getSVG();
    const svgRect = svg.getBoundingClientRect();
    const rect = node.state.rect;
    const currentTransform = this.getCurrentTransform();
    const scale = currentTransform.k;

    // 计算节点在视口中的位置
    const nodeLeft = rect.x * scale + currentTransform.x;
    const nodeTop = rect.y * scale + currentTransform.y;
    const nodeRight = (rect.x + rect.width) * scale + currentTransform.x;
    const nodeBottom = (rect.y + rect.height) * scale + currentTransform.y;

    // 检查是否需要调整
    let newX = currentTransform.x;
    let newY = currentTransform.y;

    const padding = 20; // 边距

    if (nodeLeft < padding) {
      newX = padding - rect.x * scale;
    } else if (nodeRight > svgRect.width - padding) {
      newX = svgRect.width - padding - (rect.x + rect.width) * scale;
    }

    if (nodeTop < padding) {
      newY = padding - rect.y * scale;
    } else if (nodeBottom > svgRect.height - padding) {
      newY = svgRect.height - padding - (rect.y + rect.height) * scale;
    }

    // 如果需要调整，应用新的变换
    if (newX !== currentTransform.x || newY !== currentTransform.y) {
      this.core.applyTransform({ x: newX, y: newY, k: scale });
      this.eventEmitter.emit('view:transform', { x: newX, y: newY, k: scale });
    }
  }

  // ==================== 节点操作 ====================

  /**
   * 切换节点的展开/折叠状态
   * @param nodeId - 节点 ID
   * @param recursive - 是否递归应用到所有子节点，默认 false
   *
   * Requirements: 8.2
   */
  toggleNode(nodeId: string, recursive = false): void {
    if (!this.data) return;

    const node = this.findNodeById(nodeId);
    if (!node) {
      throw new Error(`Node with id "${nodeId}" not found`);
    }

    // 切换折叠状态
    const newFoldState = node.payload?.fold ? 0 : 1;
    node.payload = { ...node.payload, fold: newFoldState };

    // 如果是递归模式，应用到所有子节点
    if (recursive && node.children) {
      this.setFoldRecursive(node, newFoldState);
    }

    // 重新渲染
    this.core.renderData(this.data);
    this.eventEmitter.emit('node:toggle', node, !newFoldState);
  }

  /**
   * 展开指定节点及其所有子节点
   * @param nodeId - 节点 ID，如果不提供则展开所有节点
   *
   * Requirements: 8.3
   */
  expandAll(nodeId?: string): void {
    if (!this.data) return;

    const targetNode = nodeId ? this.findNodeById(nodeId) : this.data;
    if (!targetNode) {
      throw new Error(`Node with id "${nodeId}" not found`);
    }

    // 递归展开所有节点
    this.setFoldRecursive(targetNode, 0);

    // 重新渲染
    this.core.renderData(this.data);
    this.eventEmitter.emit('data:change', this.data);
  }

  /**
   * 折叠指定节点及其所有子节点
   * @param nodeId - 节点 ID，如果不提供则折叠所有节点
   *
   * Requirements: 8.3
   */
  collapseAll(nodeId?: string): void {
    if (!this.data) return;

    const targetNode = nodeId ? this.findNodeById(nodeId) : this.data;
    if (!targetNode) {
      throw new Error(`Node with id "${nodeId}" not found`);
    }

    // 递归折叠所有节点
    this.setFoldRecursive(targetNode, 1);

    // 重新渲染
    this.core.renderData(this.data);
    this.eventEmitter.emit('data:change', this.data);
  }

  // ==================== 导出功能 ====================

  // ==================== 导出功能 ====================
  // 注意：导出功能已移至 markmap-view 层
  // 推荐使用 Markmap.exportAsMarkdown(), Markmap.exportAsSVG(), Markmap.exportAsPNG()
  // 这些方法包含完整的样式、命名空间和优化的实现
  //
  // MarkmapAPI 不再提供导出方法，以避免功能重复和维护负担
  // 如果需要导出功能，请使用 markmap-view 层的 Markmap 类

  // ==================== 搜索功能 ====================

  /**
   * 搜索匹配查询的节点
   * @param query - 搜索查询字符串
   * @returns 匹配的节点数组
   *
   * Requirements: 8.6
   */
  search(query: string): INode[] {
    if (!this.data) {
      return [];
    }

    const results: INodeCommon[] = [];
    const lowerQuery = query.toLowerCase();

    walkTree(this.data, (node, next) => {
      // 从 HTML 内容中提取文本
      const textContent = this.extractTextFromHTML(node.content);

      if (textContent.toLowerCase().includes(lowerQuery)) {
        results.push(node);
      }

      next();
    });

    this.eventEmitter.emit('search:result', results);
    // 返回接口类型
    return results as unknown as INode[];
  }

  /**
   * 高亮显示指定节点
   * @param nodeId - 节点 ID
   *
   * Requirements: 8.6
   */
  highlightNode(nodeId: string): void {
    const svg = this.core.getSVG();
    const nodeElement = svg.querySelector(`[data-path*="${nodeId}"]`);

    if (nodeElement) {
      nodeElement.classList.add('markmap-highlight');
    }
  }

  /**
   * 清除所有高亮
   *
   * Requirements: 8.6
   */
  clearHighlight(): void {
    const svg = this.core.getSVG();
    const highlightedNodes = svg.querySelectorAll('.markmap-highlight');

    highlightedNodes.forEach((node) => {
      node.classList.remove('markmap-highlight');
    });
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 根据 ID 查找节点
   */
  private findNodeById(nodeId: string): INodeCommon | undefined {
    if (!this.data) return undefined;

    let foundNode: INodeCommon | undefined;

    walkTree(this.data, (node, next) => {
      if (
        node.state?.id?.toString() === nodeId ||
        node.state?.path === nodeId
      ) {
        foundNode = node;
        return;
      }
      next();
    });

    return foundNode;
  }

  /**
   * 递归设置节点的折叠状态
   */
  private setFoldRecursive(node: INodeCommon, foldState: number): void {
    walkTree(node, (item, next) => {
      item.payload = { ...item.payload, fold: foldState };
      next();
    });
  }

  /**
   * 从 HTML 内容中提取纯文本
   */
  private extractTextFromHTML(html: string): string {
    if (!html) return '';
    // 简单的 HTML 标签移除
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * 获取当前视图变换
   */
  private getCurrentTransform(): { x: number; y: number; k: number } {
    const svg = this.core.getSVG();
    const g = svg.querySelector('g');

    if (!g) {
      return { x: 0, y: 0, k: 1 };
    }

    const transform = g.getAttribute('transform');
    if (!transform) {
      return { x: 0, y: 0, k: 1 };
    }

    // 解析 transform 属性
    const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);

    const x = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const y = translateMatch ? parseFloat(translateMatch[2]) : 0;
    const k = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    return { x, y, k };
  }
}
