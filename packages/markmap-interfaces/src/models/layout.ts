import type { INode } from './node';

/**
 * 布局后的节点信息
 */
export interface ILayoutNode {
  /**
   * 节点的唯一标识符
   */
  id: string;

  /**
   * 节点在布局中的 X 坐标
   */
  x: number;

  /**
   * 节点在布局中的 Y 坐标
   */
  y: number;

  /**
   * 节点的原始数据
   */
  data: INode;
}

/**
 * 布局后的连线信息
 */
export interface ILayoutLink {
  /**
   * 连线的源节点
   */
  source: ILayoutNode;

  /**
   * 连线的目标节点
   */
  target: ILayoutNode;
}

/**
 * 布局计算结果
 * 包含所有节点和连线的位置信息
 */
export interface ILayoutResult {
  /**
   * 布局后的所有节点
   */
  nodes: ILayoutNode[];

  /**
   * 布局后的所有连线
   */
  links: ILayoutLink[];
}
