/**
 * 视图变换接口
 * 表示 SVG 视图的平移和缩放状态
 */
export interface ITransform {
  /**
   * X 轴平移量
   */
  x: number;

  /**
   * Y 轴平移量
   */
  y: number;

  /**
   * 缩放比例（k = scale）
   * - k = 1: 原始大小
   * - k > 1: 放大
   * - k < 1: 缩小
   */
  k: number;
}
