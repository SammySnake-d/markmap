import type { INode } from '../models/node';
import type { IPosition } from '../models/position';
import type { IMarkmapAPI } from '../core/markmap-api';

/**
 * 菜单项配置接口
 */
export interface IMenuItem {
  /**
   * 菜单项的唯一标识符
   */
  id: string;

  /**
   * 菜单项显示的文本
   */
  label: string;

  /**
   * 菜单项的图标（可选）
   * 可以是图标类名、SVG 字符串或图片 URL
   */
  icon?: string;

  /**
   * 菜单项的操作函数
   * @param node - 当前操作的节点（画布右键时为 null）
   * @param api - Markmap API 实例
   * @returns 可以返回 Promise 以支持异步操作
   */
  action: (node: INode | null, api: IMarkmapAPI) => void | Promise<void>;

  /**
   * 是否为分隔符
   * @default false
   */
  separator?: boolean;

  /**
   * 是否禁用
   * 可以是布尔值或返回布尔值的函数
   * @default false
   */
  disabled?: boolean | ((node: INode | null) => boolean);

  /**
   * 子菜单项（可选）
   * 如果提供，此菜单项将显示为子菜单
   */
  children?: IMenuItem[];
}

/**
 * 右键菜单 Provider 接口
 * 负责右键菜单的渲染和交互
 */
export interface IContextMenuProvider {
  /**
   * 菜单项配置数组
   * 定义菜单中显示的所有项目
   */
  items: IMenuItem[];

  /**
   * 显示右键菜单
   * 当用户右键点击节点或画布时调用
   *
   * @param node - 被右键点击的节点（画布右键时为 null）
   * @param position - 鼠标点击位置
   * @param api - Markmap API 实例
   *
   * @example
   * ```typescript
   * show(node, position, api) {
   *   const menu = this.render(this.items, node, api);
   *   menu.style.left = `${position.x}px`;
   *   menu.style.top = `${position.y}px`;
   *   document.body.appendChild(menu);
   * }
   * ```
   */
  show(node: INode | null, position: IPosition, api: IMarkmapAPI): void;

  /**
   * 隐藏右键菜单
   * 当用户点击菜单外部或选择菜单项后调用
   *
   * @example
   * ```typescript
   * hide() {
   *   const menu = document.querySelector('.context-menu');
   *   if (menu) {
   *     menu.remove();
   *   }
   * }
   * ```
   */
  hide(): void;

  /**
   * 自定义渲染菜单
   * 允许完全自定义菜单的 HTML 结构和样式
   *
   * @param items - 要渲染的菜单项数组
   * @param node - 当前操作的节点（画布右键时为 null）
   * @param api - Markmap API 实例
   * @returns 菜单的 HTML 元素
   *
   * @example
   * ```typescript
   * render(items, node, api) {
   *   const menu = document.createElement('div');
   *   menu.className = 'context-menu';
   *
   *   items.forEach(item => {
   *     if (item.separator) {
   *       menu.appendChild(document.createElement('hr'));
   *     } else {
   *       const menuItem = document.createElement('div');
   *       menuItem.className = 'menu-item';
   *       menuItem.textContent = item.label;
   *       menuItem.onclick = () => {
   *         item.action(node, api);
   *         this.hide();
   *       };
   *       menu.appendChild(menuItem);
   *     }
   *   });
   *
   *   return menu;
   * }
   * ```
   */
  render(items: IMenuItem[], node: INode | null, api: IMarkmapAPI): HTMLElement;
}
