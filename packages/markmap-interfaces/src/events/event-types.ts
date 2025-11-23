import type { INode } from '../models/node';
import type { IPosition } from '../models/position';
import type { ITransform } from '../models/transform';

/**
 * 事件回调函数类型
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * Markmap 事件类型映射
 * 定义了所有可能触发的事件及其回调函数签名
 */
export interface IMarkmapEvents {
  /**
   * 节点被点击时触发
   * @param node - 被点击的节点
   */
  'node:click': (node: INode) => void;

  /**
   * 节点被右键点击时触发
   * @param node - 被右键点击的节点
   * @param position - 鼠标位置
   */
  'node:rightclick': (node: INode, position: IPosition) => void;

  /**
   * 鼠标悬停在节点上时触发
   * @param node - 被悬停的节点
   */
  'node:hover': (node: INode) => void;

  /**
   * 节点展开/折叠状态切换时触发
   * @param node - 状态改变的节点
   * @param expanded - 是否展开（true 表示展开，false 表示折叠）
   */
  'node:toggle': (node: INode, expanded: boolean) => void;

  /**
   * 数据发生变化时触发
   * @param data - 新的根节点数据
   */
  'data:change': (data: INode) => void;

  /**
   * 数据加载完成时触发
   * @param data - 加载的根节点数据
   */
  'data:load': (data: INode) => void;

  /**
   * 视图变换（平移/缩放）时触发
   * @param transform - 新的变换状态
   */
  'view:transform': (transform: ITransform) => void;

  /**
   * 视图适配（fit）操作时触发
   */
  'view:fit': () => void;

  /**
   * 搜索查询时触发
   * @param query - 搜索查询字符串
   */
  'search:query': (query: string) => void;

  /**
   * 搜索结果返回时触发
   * @param results - 匹配的节点数组
   */
  'search:result': (results: INode[]) => void;

  /**
   * 发生错误时触发
   * @param error - 错误对象
   */
  error: (error: Error) => void;
}

/**
 * 事件名称类型
 */
export type EventName = keyof IMarkmapEvents;
