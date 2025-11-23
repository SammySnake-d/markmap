import type { INode } from '../models/node';
import type { IPosition } from '../models/position';

/**
 * Markmap 配置接口
 * 定义初始化 Markmap 实例时的所有配置选项
 */
export interface IMarkmapConfig {
  // ==================== 核心配置 ====================

  /**
   * SVG 容器元素或选择器
   */
  svg: string | SVGElement;

  /**
   * 初始数据（可选）
   */
  data?: INode;

  // ==================== 渲染配置 ====================

  /**
   * 节点内容的最大宽度（像素）
   * @default 0 (无限制)
   */
  maxWidth?: number;

  /**
   * 节点内边距 X（像素）
   * @default 8
   */
  paddingX?: number;

  /**
   * 节点水平间距（像素）
   * @default 80
   */
  spacingHorizontal?: number;

  /**
   * 节点垂直间距（像素）
   * @default 5
   */
  spacingVertical?: number;

  /**
   * 动画持续时间（毫秒）
   * @default 500
   */
  duration?: number;

  /**
   * 是否自动适配视图
   * @default false
   */
  autoFit?: boolean;

  /**
   * 颜色方案
   */
  color?: (node: INode) => string;

  // ==================== UI Provider（可选）====================

  /**
   * 备注系统 Provider
   */
  noteProvider?: any; // INoteProvider - 避免循环依赖

  /**
   * 右键菜单 Provider
   */
  contextMenuProvider?: any; // IContextMenuProvider

  /**
   * 工具栏 Provider
   */
  toolbarProvider?: any; // IToolbarProvider

  /**
   * 搜索功能 Provider
   */
  searchProvider?: any; // ISearchProvider

  // ==================== 事件回调（可选）====================

  /**
   * 节点点击回调
   */
  onNodeClick?: (node: INode) => void;

  /**
   * 节点右键点击回调
   */
  onNodeRightClick?: (node: INode, position: IPosition) => void;

  /**
   * 数据变化回调
   */
  onDataChange?: (data: INode) => void;

  /**
   * 错误回调
   */
  onError?: (error: Error) => void;
}
