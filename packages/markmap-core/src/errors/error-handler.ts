import { EventEmitter } from '../events/event-emitter';
import { MarkmapError, MarkmapErrorCode, IErrorHandler } from './markmap-error';

/**
 * 错误处理器配置选项
 */
export interface ErrorHandlerOptions {
  /**
   * 是否在控制台输出错误日志
   * @default true
   */
  logErrors?: boolean;

  /**
   * 是否在 Provider 错误时使用默认行为
   * @default true
   */
  fallbackOnProviderError?: boolean;

  /**
   * 是否在渲染错误时尝试恢复
   * @default true
   */
  recoverFromRenderError?: boolean;

  /**
   * 自定义错误处理函数
   */
  onError?: (error: MarkmapError) => void;
}

/**
 * 默认错误处理器实现
 *
 * 负责捕获、记录和处理系统中的各种错误
 * 通过事件系统通知外部监听器
 *
 * @example
 * ```typescript
 * const eventEmitter = new EventEmitter();
 * const errorHandler = new ErrorHandler(eventEmitter, {
 *   logErrors: true,
 *   fallbackOnProviderError: true
 * });
 *
 * errorHandler.handleError(new Error('Something went wrong'));
 * ```
 */
export class ErrorHandler implements IErrorHandler {
  private eventEmitter: EventEmitter;
  private options: Required<ErrorHandlerOptions>;

  /**
   * 创建错误处理器实例
   *
   * @param eventEmitter - 事件发射器，用于触发错误事件
   * @param options - 错误处理器配置选项
   */
  constructor(eventEmitter: EventEmitter, options: ErrorHandlerOptions = {}) {
    this.eventEmitter = eventEmitter;
    this.options = {
      logErrors: options.logErrors ?? true,
      fallbackOnProviderError: options.fallbackOnProviderError ?? true,
      recoverFromRenderError: options.recoverFromRenderError ?? true,
      onError: options.onError ?? (() => {}),
    };
  }

  /**
   * 处理通用错误
   *
   * @param error - 要处理的错误
   */
  handleError(error: Error): void {
    const markmapError =
      error instanceof MarkmapError
        ? error
        : new MarkmapError(MarkmapErrorCode.RENDER_ERROR, error.message, {
            originalError: error,
          });

    this.logError(markmapError);
    this.emitError(markmapError);
    this.options.onError(markmapError);
  }

  /**
   * 处理 Provider 错误
   *
   * 策略：捕获并记录错误，使用默认行为或优雅降级
   *
   * @param provider - Provider 名称
   * @param error - 错误对象
   */
  handleProviderError(provider: string, error: Error): void {
    const markmapError = MarkmapError.providerError(provider, error);

    this.logError(markmapError);
    this.emitError(markmapError);
    this.options.onError(markmapError);

    if (this.options.fallbackOnProviderError) {
      if (this.options.logErrors) {
        console.warn(`Falling back to default behavior for ${provider}`);
      }
    }
  }

  /**
   * 处理渲染错误
   *
   * 策略：捕获并触发 error 事件，保持系统稳定
   *
   * @param error - 错误对象
   */
  handleRenderError(error: Error): void {
    const markmapError =
      error instanceof MarkmapError
        ? error
        : MarkmapError.renderError('Failed to render mindmap', error);

    this.logError(markmapError);
    this.emitError(markmapError);
    this.options.onError(markmapError);

    if (this.options.recoverFromRenderError) {
      if (this.options.logErrors) {
        console.warn('Attempting to recover from render error...');
      }
      // 恢复逻辑将由调用者实现
    }
  }

  /**
   * 处理命令错误
   *
   * 策略：捕获并触发 error 事件，不影响其他功能
   *
   * @param commandId - 命令 ID
   * @param error - 错误对象
   */
  handleCommandError(commandId: string, error: Error): void {
    const markmapError = MarkmapError.commandError(commandId, error);

    this.logError(markmapError);
    this.emitError(markmapError);
    this.options.onError(markmapError);
  }

  /**
   * 处理导出错误
   *
   * 策略：抛出明确的错误信息，让用户处理
   *
   * @param format - 导出格式
   * @param error - 错误对象
   * @throws {MarkmapError} 导出错误
   */
  handleExportError(format: string, error: Error): never {
    const markmapError = MarkmapError.exportError(format, error);

    this.logError(markmapError);
    this.emitError(markmapError);
    this.options.onError(markmapError);

    throw markmapError;
  }

  /**
   * 记录错误到控制台
   *
   * @param error - 要记录的错误
   */
  private logError(error: MarkmapError): void {
    if (!this.options.logErrors) return;

    console.error(`[Markmap Error] ${error.code}:`, error.message);

    if (error.context) {
      console.error('Context:', error.context);
    }

    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }

  /**
   * 通过事件系统发送错误
   *
   * @param error - 要发送的错误
   */
  private emitError(error: MarkmapError): void {
    try {
      this.eventEmitter.emit('error', error);
    } catch (emitError) {
      // 如果发送错误事件本身失败，只记录到控制台
      console.error('Failed to emit error event:', emitError);
    }
  }

  /**
   * 更新错误处理器配置
   *
   * @param options - 新的配置选项
   */
  updateOptions(options: Partial<ErrorHandlerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * 创建一个安全的函数包装器
   * 捕获函数执行过程中的错误并通过错误处理器处理
   *
   * @param fn - 要包装的函数
   * @param errorType - 错误类型（用于分类处理）
   * @returns 包装后的安全函数
   */
  wrapFunction<T extends (...args: any[]) => any>(
    fn: T,
    errorType: 'provider' | 'render' | 'command' = 'render',
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        switch (errorType) {
          case 'provider':
            this.handleProviderError('unknown', err);
            break;
          case 'command':
            this.handleCommandError('unknown', err);
            break;
          case 'render':
          default:
            this.handleRenderError(err);
            break;
        }

        return undefined;
      }
    }) as T;
  }

  /**
   * 创建一个安全的异步函数包装器
   * 捕获异步函数执行过程中的错误并通过错误处理器处理
   *
   * @param fn - 要包装的异步函数
   * @param errorType - 错误类型（用于分类处理）
   * @returns 包装后的安全异步函数
   */
  wrapAsyncFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorType: 'provider' | 'render' | 'command' = 'render',
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        switch (errorType) {
          case 'provider':
            this.handleProviderError('unknown', err);
            break;
          case 'command':
            this.handleCommandError('unknown', err);
            break;
          case 'render':
          default:
            this.handleRenderError(err);
            break;
        }

        return undefined;
      }
    }) as T;
  }
}
