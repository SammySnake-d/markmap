/**
 * Markmap UI Default - 默认 UI 实现包
 *
 * 提供 Markmap 的默认 UI 组件实现，包括：
 * - 备注系统 (DefaultNoteProvider)
 * - 右键菜单 (DefaultContextMenuProvider)
 * - 工具栏 (DefaultToolbarProvider)
 *
 * Requirements: 11.2 - 导出所有 Provider 和配置
 *
 * @packageDocumentation
 */

// 导出所有 Provider 类
export { DefaultNoteProvider } from './providers/default-note-provider';
export { DefaultContextMenuProvider } from './providers/default-context-menu-provider';
export { DefaultToolbarProvider } from './providers/default-toolbar-provider';

// 导出默认 UI 配置
export { defaultUI, createDefaultUI } from './default-ui';

// 导出样式（用户可以选择性导入）
// import 'markmap-ui-default/style.css';

/**
 * 使用示例：
 *
 * ```typescript
 * // 方式 1: 使用默认 UI 配置
 * import { Markmap } from 'markmap-view';
 * import { defaultUI } from 'markmap-ui-default';
 * import 'markmap-ui-default/style.css';
 *
 * const markmap = new Markmap({
 *   svg: '#markmap',
 *   ...defaultUI
 * });
 *
 * // 方式 2: 自定义部分 Provider
 * import { createDefaultUI, DefaultNoteProvider } from 'markmap-ui-default';
 * import { CustomContextMenuProvider } from './custom-providers';
 *
 * const ui = createDefaultUI({
 *   contextMenuProvider: new CustomContextMenuProvider(),
 *   // 其他 Provider 使用默认实现
 * });
 *
 * const markmap = new Markmap({
 *   svg: '#markmap',
 *   ...ui
 * });
 *
 * // 方式 3: 完全自定义
 * import {
 *   DefaultNoteProvider,
 *   DefaultContextMenuProvider,
 *   DefaultToolbarProvider
 * } from 'markmap-ui-default';
 *
 * const markmap = new Markmap({
 *   svg: '#markmap',
 *   noteProvider: new DefaultNoteProvider(),
 *   contextMenuProvider: new DefaultContextMenuProvider(),
 *   toolbarProvider: new DefaultToolbarProvider()
 * });
 * ```
 */
