import type { IMarkmapAPI } from '../core/markmap-api';

/**
 * 工具项类型
 */
export type ToolItemType = 'button' | 'dropdown' | 'toggle';

/**
 * 工具项配置接口
 */
export interface IToolItem {
  /**
   * 工具项的唯一标识符
   */
  id: string;

  /**
   * 工具项显示的文本
   */
  label: string;

  /**
   * 工具项的图标（可选）
   * 可以是图标类名、SVG 字符串或图片 URL
   */
  icon?: string;

  /**
   * 工具项类型
   * - button: 普通按钮
   * - dropdown: 下拉选择
   * - toggle: 开关按钮
   */
  type: ToolItemType;

  /**
   * 工具项的操作函数
   * @param api - Markmap API 实例
   * @param value - 对于 dropdown 类型，传递选中的值
   * @returns 可以返回 Promise 以支持异步操作
   */
  action: (api: IMarkmapAPI, value?: any) => void | Promise<void>;

  /**
   * 下拉选项（仅用于 dropdown 类型）
   */
  options?: Array<{
    label: string;
    value: any;
  }>;

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;

  /**
   * 工具提示文本（可选）
   */
  tooltip?: string;
}

/**
 * 工具栏 Provider 接口
 * 负责工具栏的渲染和状态管理
 */
export interface IToolbarProvider {
  /**
   * 工具项配置数组
   * 定义工具栏中显示的所有工具
   */
  tools: IToolItem[];

  /**
   * 渲染工具栏
   * 在指定容器中创建工具栏 UI
   *
   * @param container - 工具栏的容器元素
   * @param api - Markmap API 实例
   *
   * @example
   * ```typescript
   * render(container, api) {
   *   const toolbar = document.createElement('div');
   *   toolbar.className = 'markmap-toolbar';
   *
   *   this.tools.forEach(tool => {
   *     const button = document.createElement('button');
   *     button.textContent = tool.label;
   *     button.onclick = () => tool.action(api);
   *     toolbar.appendChild(button);
   *   });
   *
   *   container.appendChild(toolbar);
   * }
   * ```
   */
  render(container: HTMLElement, api: IMarkmapAPI): void;

  /**
   * 更新工具状态
   * 当 Markmap 状态变化时调用，用于同步工具栏显示
   *
   * @param toolId - 要更新的工具 ID
   * @param state - 新的状态数据
   *
   * @example
   * ```typescript
   * updateToolState(toolId, state) {
   *   const button = document.querySelector(`[data-tool-id="${toolId}"]`);
   *   if (button && state.disabled !== undefined) {
   *     button.disabled = state.disabled;
   *   }
   *   if (button && state.active !== undefined) {
   *     button.classList.toggle('active', state.active);
   *   }
   * }
   * ```
   */
  updateToolState(toolId: string, state: any): void;

  /**
   * 销毁工具栏
   * 清理工具栏相关的 DOM 和事件监听器
   *
   * @example
   * ```typescript
   * destroy() {
   *   const toolbar = document.querySelector('.markmap-toolbar');
   *   if (toolbar) {
   *     toolbar.remove();
   *   }
   * }
   * ```
   */
  destroy?(): void;
}
