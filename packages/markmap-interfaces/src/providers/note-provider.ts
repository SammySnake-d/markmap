import type { INode } from '../models/node';
import type { IPosition } from '../models/position';
import type { IMarkmapAPI } from '../core/markmap-api';

/**
 * 备注系统 Provider 接口
 * 负责备注图标的渲染和备注面板的显示
 */
export interface INoteProvider {
  /**
   * 渲染备注图标
   * 当节点包含备注内容时调用此方法
   *
   * @param node - 包含备注的节点数据
   * @param container - 图标的容器元素
   * @param api - Markmap API 实例，用于执行操作
   * @returns 备注图标的 HTML 元素
   *
   * @example
   * ```typescript
   * renderNoteIcon(node, container, api) {
   *   const icon = document.createElement('span');
   *   icon.className = 'note-icon';
   *   icon.textContent = '📝';
   *   icon.onclick = () => this.showNotePanel(node, { x: 0, y: 0 }, api);
   *   return icon;
   * }
   * ```
   */
  renderNoteIcon(
    node: INode,
    container: HTMLElement,
    api: IMarkmapAPI,
  ): HTMLElement;

  /**
   * 显示备注面板
   * 当用户点击备注图标或触发显示备注操作时调用
   *
   * @param node - 要显示备注的节点数据
   * @param position - 面板显示的位置坐标
   * @param api - Markmap API 实例，用于执行操作
   *
   * @example
   * ```typescript
   * showNotePanel(node, position, api) {
   *   const panel = document.createElement('div');
   *   panel.className = 'note-panel';
   *   panel.style.left = `${position.x}px`;
   *   panel.style.top = `${position.y}px`;
   *   panel.textContent = node.payload.note || '';
   *   document.body.appendChild(panel);
   * }
   * ```
   */
  showNotePanel(node: INode, position: IPosition, api: IMarkmapAPI): void;

  /**
   * 隐藏备注面板
   * 当用户关闭面板或切换到其他节点时调用
   *
   * @example
   * ```typescript
   * hideNotePanel() {
   *   const panel = document.querySelector('.note-panel');
   *   if (panel) {
   *     panel.remove();
   *   }
   * }
   * ```
   */
  hideNotePanel(): void;

  /**
   * 备注内容变化回调（可选）
   * 当用户编辑备注内容时调用
   *
   * @param node - 备注被修改的节点
   * @param note - 新的备注内容
   * @param api - Markmap API 实例
   *
   * @example
   * ```typescript
   * onNoteChange(node, note, api) {
   *   node.payload.note = note;
   *   api.updateNode(node.state.id.toString(), node);
   * }
   * ```
   */
  onNoteChange?(node: INode, note: string, api: IMarkmapAPI): void;
}
