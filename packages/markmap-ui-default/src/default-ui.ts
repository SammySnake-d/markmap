import { DefaultNoteProvider } from './providers/default-note-provider';
import { DefaultContextMenuProvider } from './providers/default-context-menu-provider';
import { DefaultToolbarProvider } from './providers/default-toolbar-provider';

/**
 * DefaultUI 配置对象
 *
 * 包含所有默认 Provider 实例，可直接用于 Markmap 初始化
 *
 * Requirements:
 * - 9.4: 提供包含所有默认 Provider 的配置对象
 *
 * @example
 * ```typescript
 * import { Markmap } from 'markmap-view';
 * import { defaultUI } from 'markmap-ui-default';
 *
 * const markmap = new Markmap({
 *   svg: '#markmap',
 *   ...defaultUI
 * });
 * ```
 */
export const defaultUI = {
  /**
   * 默认备注系统 Provider
   */
  noteProvider: new DefaultNoteProvider(),

  /**
   * 默认右键菜单 Provider
   */
  contextMenuProvider: new DefaultContextMenuProvider(),

  /**
   * 默认工具栏 Provider
   */
  toolbarProvider: new DefaultToolbarProvider(),
};

/**
 * 创建默认 UI 配置的工厂函数
 *
 * 允许用户自定义部分 Provider 的配置
 *
 * @param options - 可选的自定义配置
 * @returns 包含所有 Provider 的配置对象
 *
 * @example
 * ```typescript
 * import { createDefaultUI } from 'markmap-ui-default';
 *
 * const ui = createDefaultUI({
 *   noteProvider: new CustomNoteProvider(),
 *   // 其他 Provider 使用默认实现
 * });
 * ```
 */
export function createDefaultUI(options?: {
  noteProvider?: any;
  contextMenuProvider?: any;
  toolbarProvider?: any;
}) {
  return {
    noteProvider: options?.noteProvider || new DefaultNoteProvider(),
    contextMenuProvider:
      options?.contextMenuProvider || new DefaultContextMenuProvider(),
    toolbarProvider: options?.toolbarProvider || new DefaultToolbarProvider(),
  };
}

/**
 * 导出所有 Provider 类，供用户自定义使用
 */
export {
  DefaultNoteProvider,
  DefaultContextMenuProvider,
  DefaultToolbarProvider,
};
