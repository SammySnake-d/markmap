/**
 * 节点的附加数据载荷
 */
export interface INodePayload {
  /**
   * 节点的折叠状态
   * - 0 或 undefined: 未折叠
   * - 1: 折叠
   * - 2: 折叠（包括所有子节点）
   */
  fold?: number;

  /**
   * 节点的备注内容
   */
  note?: string;

  /**
   * 其他自定义数据
   */
  [key: string]: unknown;
}

/**
 * 思维导图节点接口
 * 表示思维导图中的一个节点及其层级关系
 */
export interface INode {
  /**
   * 节点类型（如 'heading', 'list' 等）
   */
  type: string;

  /**
   * 节点在树中的深度（0-based）
   */
  depth: number;

  /**
   * 节点的 HTML 内容
   */
  content: string;

  /**
   * 子节点数组
   */
  children?: INode[];

  /**
   * 节点的附加数据载荷
   */
  payload: INodePayload;
}
