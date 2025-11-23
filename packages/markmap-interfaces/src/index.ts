/**
 * Markmap Interfaces
 *
 * 此包提供 Markmap 开放式 API 架构的所有 TypeScript 接口定义
 * 包括核心接口、Provider 接口、事件系统、数据模型和命令系统
 */

// ==================== 核心接口 ====================
export type { IMarkmapCore } from './core/markmap-core';
export type { IMarkmapAPI } from './core/markmap-api';
export type { IMarkmapConfig } from './core/config';

// ==================== Provider 接口 ====================
export type { INoteProvider } from './providers/note-provider';
export type {
  IContextMenuProvider,
  IMenuItem,
} from './providers/context-menu-provider';
export type {
  IToolbarProvider,
  IToolItem,
  ToolItemType,
} from './providers/toolbar-provider';
export type {
  ISearchProvider,
  ISearchResult,
  ISearchOptions,
} from './providers/search-provider';

// ==================== 事件系统 ====================
export type {
  IMarkmapEvents,
  EventName,
  EventCallback,
} from './events/event-types';
export type { IEventEmitter } from './events/event-emitter';

// ==================== 数据模型 ====================
export type { INode, INodePayload } from './models/node';
export type { IPosition } from './models/position';
export type { ITransform } from './models/transform';
export type { ILayoutResult, ILayoutNode, ILayoutLink } from './models/layout';

// ==================== 命令系统 ====================
export type { ICommand, ICommandManager } from './commands/command';
