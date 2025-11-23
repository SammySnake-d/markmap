import type { INode } from '../models/node';
import type { ILayoutResult } from '../models/layout';
import type { ITransform } from '../models/transform';

/**
 * Markmap 核心渲染引擎接口
 * 负责节点布局、连线绘制和动画等底层渲染功能
 */
export interface IMarkmapCore {
  /**
   * 渲染数据到 SVG
   * @param data - 根节点数据
   */
  renderData(data: INode): void;

  /**
   * 计算节点布局
   * @param data - 根节点数据
   * @returns 布局结果，包含所有节点和连线的位置信息
   */
  calculateLayout(data: INode): ILayoutResult;

  /**
   * 应用视图变换（平移和缩放）
   * @param transform - 变换参数
   */
  applyTransform(transform: ITransform): void;

  /**
   * 执行动画过渡
   * @param duration - 动画持续时间（毫秒），默认使用配置的值
   */
  transition(duration?: number): void;

  /**
   * 获取 SVG 元素
   * @returns SVG DOM 元素
   */
  getSVG(): SVGElement;

  /**
   * 销毁核心实例，清理资源
   */
  destroy(): void;
}
