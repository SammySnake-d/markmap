/**
 * Markmap Core - 核心渲染引擎和依赖注入系统
 *
 * 这个包提供了 Markmap 的核心功能，包括：
 * - 事件系统 (EventEmitter) ✓
 * - 依赖注入容器 (DIContainer) ✓
 * - 核心渲染引擎 (MarkmapCore) ✓
 * - 功能 API 层 (MarkmapAPI) ✓
 * - 命令系统 (CommandManager) ✓
 * - 错误处理 (ErrorHandler) ✓
 *
 * @packageDocumentation
 *
 * ## 使用示例
 *
 * ### 基础使用
 * ```typescript
 * import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';
 *
 * // 创建事件发射器
 * const eventEmitter = new EventEmitter();
 *
 * // 创建核心渲染引擎
 * const core = new MarkmapCore('#svg', {
 *   duration: 500,
 *   maxWidth: 300,
 * });
 *
 * // 创建功能 API
 * const api = new MarkmapAPI(core, eventEmitter);
 *
 * // 设置数据
 * api.setData({
 *   type: 'heading',
 *   depth: 0,
 *   content: 'Root',
 *   children: [],
 *   payload: {},
 * });
 * ```
 *
 * ### 使用依赖注入
 * ```typescript
 * import { DIContainer, ServiceLifetime } from 'markmap-core';
 *
 * const container = new DIContainer();
 *
 * // 注册服务
 * container.register('logger', new Logger(), ServiceLifetime.Singleton);
 *
 * // 解析服务
 * const logger = container.resolve<Logger>('logger');
 * ```
 *
 * ### 使用命令系统
 * ```typescript
 * import { CommandManager } from 'markmap-core';
 *
 * const commandManager = new CommandManager(api, eventEmitter);
 *
 * // 注册命令
 * commandManager.register({
 *   id: 'expand-all',
 *   execute: (api) => api.expandAll(),
 * });
 *
 * // 执行命令
 * await commandManager.execute('expand-all');
 * ```
 *
 * @module markmap-core
 */

// ==================== 事件系统 ====================
/**
 * 事件发射器类，实现发布订阅模式
 *
 * 支持功能：
 * - on: 注册事件监听器
 * - off: 移除事件监听器
 * - emit: 触发事件
 * - once: 注册一次性事件监听器
 * - removeAllListeners: 移除所有监听器
 *
 * @example
 * ```typescript
 * const emitter = new EventEmitter();
 *
 * // 注册监听器
 * emitter.on('data:change', (data) => {
 *   console.log('Data changed:', data);
 * });
 *
 * // 触发事件
 * emitter.emit('data:change', newData);
 *
 * // 移除监听器
 * emitter.off('data:change', listener);
 * ```
 */
export { EventEmitter } from './events/event-emitter';

// ==================== 依赖注入容器 ====================
/**
 * 依赖注入容器类，用于管理服务依赖关系
 *
 * 支持两种生命周期：
 * - Singleton: 单例模式，整个容器生命周期内只创建一次实例
 * - Transient: 瞬态模式，每次解析时都创建新实例
 *
 * @example
 * ```typescript
 * const container = new DIContainer();
 *
 * // 注册单例服务
 * container.register('config', new Config(), ServiceLifetime.Singleton);
 *
 * // 注册瞬态服务
 * container.register('request', () => new Request(), ServiceLifetime.Transient);
 *
 * // 解析服务
 * const config = container.resolve<Config>('config');
 * ```
 */
export { DIContainer, ServiceLifetime } from './di/di-container';

// ==================== 核心渲染引擎 ====================
/**
 * Markmap 核心渲染引擎
 *
 * 负责节点布局计算、SVG 渲染、连线绘制和动画系统
 * 不包含任何 UI 组件逻辑，完全独立
 *
 * @example
 * ```typescript
 * const core = new MarkmapCore('#svg', {
 *   duration: 500,
 *   maxWidth: 300,
 *   paddingX: 8,
 *   spacingHorizontal: 80,
 *   spacingVertical: 5,
 * });
 *
 * // 渲染数据
 * core.renderData(data);
 *
 * // 计算布局
 * const layout = core.calculateLayout(data);
 *
 * // 应用变换
 * core.applyTransform({ x: 0, y: 0, k: 1 });
 * ```
 */
export { MarkmapCore } from './core/markmap-core';

/**
 * 核心渲染选项接口
 *
 * 定义了 MarkmapCore 的配置选项
 */
export type {
  ICoreOptions,
  ILayoutNode,
  ILayoutLink,
  ILayoutResult,
  ITransform,
} from './core/markmap-core';

// ==================== 功能 API 层 ====================
/**
 * Markmap 功能 API 类
 *
 * 提供数据操作、视图控制、节点操作、导出和搜索等高级功能
 *
 * @example
 * ```typescript
 * const api = new MarkmapAPI(core, eventEmitter);
 *
 * // 数据操作
 * api.setData(data);
 * const currentData = api.getData();
 * api.updateNode('node-id', { content: 'New content' });
 *
 * // 视图控制
 * api.fit();
 * api.centerNode('node-id');
 * api.ensureVisible('node-id');
 *
 * // 节点操作
 * api.toggleNode('node-id');
 * api.expandAll();
 * api.collapseAll();
 *
 * // 导出功能
 * const markdown = api.exportAsMarkdown();
 * const svg = api.exportAsSVG();
 * const png = await api.exportAsPNG();
 *
 * // 搜索功能
 * const results = api.search('query');
 * api.highlightNode('node-id');
 * api.clearHighlight();
 * ```
 */
export { MarkmapAPI } from './api/markmap-api';

// ==================== 命令系统 ====================
/**
 * 命令管理器类
 *
 * 负责命令的注册、执行和撤销管理
 * 使用命令模式封装操作，支持撤销/重做功能
 *
 * @example
 * ```typescript
 * const commandManager = new CommandManager(api, eventEmitter);
 *
 * // 注册命令
 * commandManager.register({
 *   id: 'expand-all',
 *   execute: (api) => api.expandAll(),
 *   undo: (api) => api.collapseAll(),
 * });
 *
 * // 执行命令
 * await commandManager.execute('expand-all');
 *
 * // 撤销命令
 * await commandManager.undo();
 *
 * // 重做命令
 * await commandManager.redo();
 * ```
 */
export { CommandManager } from './commands/command-manager';

// ==================== 错误处理 ====================
/**
 * 错误处理模块
 *
 * 提供了完整的错误处理机制，包括：
 * - 自定义错误类型 (MarkmapError)
 * - 错误代码枚举 (MarkmapErrorCode)
 * - 错误处理器 (ErrorHandler)
 * - 错误恢复策略
 *
 * @example
 * ```typescript
 * import { ErrorHandler, MarkmapError, MarkmapErrorCode } from 'markmap-core';
 *
 * // 创建错误处理器
 * const errorHandler = new ErrorHandler(eventEmitter, {
 *   logErrors: true,
 *   throwOnCritical: true,
 * });
 *
 * // 处理错误
 * try {
 *   // 某些操作
 * } catch (error) {
 *   errorHandler.handleError(
 *     new MarkmapError(
 *       MarkmapErrorCode.RENDER_ERROR,
 *       'Failed to render',
 *       { originalError: error }
 *     )
 *   );
 * }
 * ```
 */
export { MarkmapError, MarkmapErrorCode, ErrorHandler } from './errors';

export type { IErrorHandler, ErrorHandlerOptions } from './errors';

// ==================== 版本信息 ====================
/**
 * Markmap Core 版本号
 */
export const VERSION = '0.1.0';
