/**
 * Markmap 错误代码枚举
 * 定义了系统中可能出现的所有错误类型
 */
export enum MarkmapErrorCode {
  /**
   * 无效的数据格式或结构
   */
  INVALID_DATA = 'INVALID_DATA',

  /**
   * Provider 执行过程中的错误
   */
  PROVIDER_ERROR = 'PROVIDER_ERROR',

  /**
   * 渲染过程中的错误
   */
  RENDER_ERROR = 'RENDER_ERROR',

  /**
   * 导出功能执行错误
   */
  EXPORT_ERROR = 'EXPORT_ERROR',

  /**
   * 命令执行错误
   */
  COMMAND_ERROR = 'COMMAND_ERROR',
}

/**
 * Markmap 自定义错误类
 *
 * 扩展了标准 Error 类，添加了错误代码和上下文信息
 * 用于提供更详细的错误信息和更好的错误处理
 *
 * @example
 * ```typescript
 * throw new MarkmapError(
 *   MarkmapErrorCode.INVALID_DATA,
 *   'Node data is missing required fields',
 *   { node: invalidNode }
 * );
 * ```
 */
export class MarkmapError extends Error {
  /**
   * 错误代码，用于标识错误类型
   */
  public readonly code: MarkmapErrorCode;

  /**
   * 错误上下文信息，包含与错误相关的额外数据
   */
  public readonly context?: any;

  /**
   * 创建一个新的 MarkmapError 实例
   *
   * @param code - 错误代码
   * @param message - 错误描述信息
   * @param context - 可选的上下文信息，用于调试和错误追踪
   */
  constructor(code: MarkmapErrorCode, message: string, context?: any) {
    super(message);

    // 设置正确的原型链（TypeScript 继承 Error 的问题）
    Object.setPrototypeOf(this, MarkmapError.prototype);

    this.name = 'MarkmapError';
    this.code = code;
    this.context = context;

    // 捕获堆栈跟踪（如果可用）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MarkmapError);
    }
  }

  /**
   * 将错误转换为 JSON 格式
   * 用于日志记录和错误报告
   *
   * @returns 包含错误信息的对象
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * 创建一个无效数据错误
   *
   * @param message - 错误描述
   * @param context - 上下文信息
   * @returns MarkmapError 实例
   */
  static invalidData(message: string, context?: any): MarkmapError {
    return new MarkmapError(MarkmapErrorCode.INVALID_DATA, message, context);
  }

  /**
   * 创建一个 Provider 错误
   *
   * @param provider - Provider 名称
   * @param originalError - 原始错误对象
   * @param context - 额外的上下文信息
   * @returns MarkmapError 实例
   */
  static providerError(
    provider: string,
    originalError: Error,
    context?: any,
  ): MarkmapError {
    return new MarkmapError(
      MarkmapErrorCode.PROVIDER_ERROR,
      `Error in ${provider}: ${originalError.message}`,
      { provider, originalError, ...context },
    );
  }

  /**
   * 创建一个渲染错误
   *
   * @param message - 错误描述
   * @param originalError - 原始错误对象
   * @param context - 上下文信息
   * @returns MarkmapError 实例
   */
  static renderError(
    message: string,
    originalError?: Error,
    context?: any,
  ): MarkmapError {
    return new MarkmapError(MarkmapErrorCode.RENDER_ERROR, message, {
      originalError,
      ...context,
    });
  }

  /**
   * 创建一个导出错误
   *
   * @param format - 导出格式
   * @param originalError - 原始错误对象
   * @param context - 上下文信息
   * @returns MarkmapError 实例
   */
  static exportError(
    format: string,
    originalError: Error,
    context?: any,
  ): MarkmapError {
    return new MarkmapError(
      MarkmapErrorCode.EXPORT_ERROR,
      `Failed to export as ${format}: ${originalError.message}`,
      { format, originalError, ...context },
    );
  }

  /**
   * 创建一个命令错误
   *
   * @param commandId - 命令 ID
   * @param originalError - 原始错误对象
   * @param context - 上下文信息
   * @returns MarkmapError 实例
   */
  static commandError(
    commandId: string,
    originalError: Error,
    context?: any,
  ): MarkmapError {
    return new MarkmapError(
      MarkmapErrorCode.COMMAND_ERROR,
      `Command "${commandId}" failed: ${originalError.message}`,
      { commandId, originalError, ...context },
    );
  }
}

/**
 * 错误处理器接口
 * 定义了错误处理的标准方法
 */
export interface IErrorHandler {
  /**
   * 处理错误
   *
   * @param error - 要处理的错误
   */
  handleError(error: Error): void;

  /**
   * 处理 Provider 错误
   *
   * @param provider - Provider 名称
   * @param error - 错误对象
   */
  handleProviderError(provider: string, error: Error): void;

  /**
   * 处理渲染错误
   *
   * @param error - 错误对象
   */
  handleRenderError(error: Error): void;

  /**
   * 处理命令错误
   *
   * @param commandId - 命令 ID
   * @param error - 错误对象
   */
  handleCommandError(commandId: string, error: Error): void;
}
