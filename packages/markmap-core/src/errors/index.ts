/**
 * 错误处理模块
 *
 * 提供了完整的错误处理机制，包括：
 * - 自定义错误类型
 * - 错误处理器
 * - 错误恢复策略
 *
 * @module errors
 */

export { MarkmapError, MarkmapErrorCode } from './markmap-error';

export type { IErrorHandler } from './markmap-error';

export { ErrorHandler } from './error-handler';

export type { ErrorHandlerOptions } from './error-handler';
