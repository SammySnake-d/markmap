/**
 * 错误处理系统使用示例
 *
 * 本示例展示了如何使用 Markmap Core 的错误处理系统
 */

import {
  EventEmitter,
  ErrorHandler,
  MarkmapError,
  MarkmapErrorCode,
} from '../src';

// ==================== 示例 1: 基本错误处理 ====================

function example1_BasicErrorHandling() {
  console.log('\n=== 示例 1: 基本错误处理 ===\n');

  // 创建事件发射器
  const eventEmitter = new EventEmitter();

  // 创建错误处理器
  const errorHandler = new ErrorHandler(eventEmitter, {
    logErrors: true,
    fallbackOnProviderError: true,
    recoverFromRenderError: true,
  });

  // 监听错误事件
  eventEmitter.on('error', (error: MarkmapError) => {
    console.log('捕获到错误事件:');
    console.log('  - 错误代码:', error.code);
    console.log('  - 错误消息:', error.message);
    if (error.context) {
      console.log('  - 上下文:', error.context);
    }
  });

  // 模拟不同类型的错误
  try {
    throw new Error('Provider 执行失败');
  } catch (error) {
    errorHandler.handleProviderError('CustomNoteProvider', error as Error);
  }

  try {
    throw new Error('渲染计算失败');
  } catch (error) {
    errorHandler.handleRenderError(error as Error);
  }

  try {
    throw new Error('命令执行失败');
  } catch (error) {
    errorHandler.handleCommandError('toggleNode', error as Error);
  }
}

// ==================== 示例 2: 自定义错误处理 ====================

function example2_CustomErrorHandling() {
  console.log('\n=== 示例 2: 自定义错误处理 ===\n');

  const eventEmitter = new EventEmitter();
  const errorLog: MarkmapError[] = [];

  const errorHandler = new ErrorHandler(eventEmitter, {
    logErrors: false, // 禁用默认日志
    onError: (error: MarkmapError) => {
      // 自定义错误处理逻辑
      errorLog.push(error);

      console.log(`[自定义处理] ${error.code}: ${error.message}`);

      // 根据错误类型执行不同的操作
      switch (error.code) {
        case MarkmapErrorCode.PROVIDER_ERROR:
          console.log('  → 使用默认 Provider');
          break;
        case MarkmapErrorCode.RENDER_ERROR:
          console.log('  → 尝试恢复到上一个状态');
          break;
        case MarkmapErrorCode.COMMAND_ERROR:
          console.log('  → 跳过该命令，继续执行');
          break;
      }
    },
  });

  // 触发一些错误
  errorHandler.handleProviderError(
    'CustomProvider',
    new Error('Provider 错误'),
  );
  errorHandler.handleRenderError(new Error('渲染错误'));
  errorHandler.handleCommandError('customCommand', new Error('命令错误'));

  console.log(`\n总共记录了 ${errorLog.length} 个错误`);
}

// ==================== 示例 3: 使用 MarkmapError 静态方法 ====================

function example3_MarkmapErrorFactories() {
  console.log('\n=== 示例 3: 使用 MarkmapError 静态方法 ===\n');

  const eventEmitter = new EventEmitter();
  const errorHandler = new ErrorHandler(eventEmitter);

  // 监听错误
  eventEmitter.on('error', (error: MarkmapError) => {
    console.log(`${error.code}: ${error.message}`);
  });

  // 使用静态工厂方法创建错误
  const invalidDataError = MarkmapError.invalidData('节点缺少必需字段', {
    node: { id: 'node-1' },
  });
  errorHandler.handleError(invalidDataError);

  const providerError = MarkmapError.providerError(
    'CustomNoteProvider',
    new Error('渲染失败'),
    { nodeId: 'node-2' },
  );
  errorHandler.handleError(providerError);

  const renderError = MarkmapError.renderError(
    '布局计算失败',
    new Error('节点数量过多'),
    { nodeCount: 10000 },
  );
  errorHandler.handleError(renderError);

  const exportError = MarkmapError.exportError(
    'PNG',
    new Error('Canvas 不可用'),
    { width: 1920, height: 1080 },
  );
  errorHandler.handleError(exportError);

  const commandError = MarkmapError.commandError(
    'toggleNode',
    new Error('节点不存在'),
    { nodeId: 'node-3' },
  );
  errorHandler.handleError(commandError);
}

// ==================== 示例 4: 函数包装器 ====================

function example4_FunctionWrappers() {
  console.log('\n=== 示例 4: 函数包装器 ===\n');

  const eventEmitter = new EventEmitter();
  const errorHandler = new ErrorHandler(eventEmitter, {
    logErrors: true,
  });

  // 监听错误
  let errorCount = 0;
  eventEmitter.on('error', () => {
    errorCount++;
  });

  // 可能抛出错误的函数
  function riskyFunction(shouldFail: boolean): string {
    if (shouldFail) {
      throw new Error('函数执行失败');
    }
    return '成功';
  }

  // 包装函数
  const safeFunction = errorHandler.wrapFunction(riskyFunction, 'render');

  // 测试包装后的函数
  console.log('调用 safeFunction(false):', safeFunction(false));
  console.log('调用 safeFunction(true):', safeFunction(true)); // 返回 undefined，错误被捕获

  console.log(`\n捕获了 ${errorCount} 个错误`);
}

// ==================== 示例 5: 异步函数包装器 ====================

async function example5_AsyncFunctionWrappers() {
  console.log('\n=== 示例 5: 异步函数包装器 ===\n');

  const eventEmitter = new EventEmitter();
  const errorHandler = new ErrorHandler(eventEmitter, {
    logErrors: true,
  });

  // 可能抛出错误的异步函数
  async function riskyAsyncFunction(shouldFail: boolean): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (shouldFail) {
      throw new Error('异步函数执行失败');
    }
    return '异步成功';
  }

  // 包装异步函数
  const safeAsyncFunction = errorHandler.wrapAsyncFunction(
    riskyAsyncFunction,
    'render',
  );

  // 测试包装后的异步函数
  console.log('调用 safeAsyncFunction(false):', await safeAsyncFunction(false));
  console.log('调用 safeAsyncFunction(true):', await safeAsyncFunction(true)); // 返回 undefined
}

// ==================== 示例 6: 错误恢复机制 ====================

function example6_ErrorRecovery() {
  console.log('\n=== 示例 6: 错误恢复机制 ===\n');

  const eventEmitter = new EventEmitter();
  const errorHandler = new ErrorHandler(eventEmitter, {
    logErrors: true,
    recoverFromRenderError: true,
  });

  // 模拟一个有状态的系统
  class StatefulSystem {
    private currentState: any = { version: 1, data: 'initial' };
    private lastStableState: any = this.currentState;

    constructor() {
      // 监听渲染错误，自动恢复
      eventEmitter.on('error', (error: MarkmapError) => {
        if (error.code === MarkmapErrorCode.RENDER_ERROR) {
          this.recover();
        }
      });
    }

    updateState(newState: any, shouldFail: boolean = false): void {
      console.log(`更新状态: ${JSON.stringify(newState)}`);

      if (shouldFail) {
        errorHandler.handleRenderError(new Error('状态更新失败'));
        return;
      }

      this.lastStableState = this.currentState;
      this.currentState = newState;
      console.log('  → 状态更新成功');
    }

    recover(): void {
      console.log(
        '  → 恢复到上一个稳定状态:',
        JSON.stringify(this.lastStableState),
      );
      this.currentState = this.lastStableState;
    }

    getState(): any {
      return this.currentState;
    }
  }

  const system = new StatefulSystem();

  // 正常更新
  system.updateState({ version: 2, data: 'updated' });

  // 失败的更新（会触发恢复）
  system.updateState({ version: 3, data: 'bad' }, true);

  // 检查当前状态
  console.log('当前状态:', JSON.stringify(system.getState()));
}

// ==================== 示例 7: 错误上下文信息 ====================

function example7_ErrorContext() {
  console.log('\n=== 示例 7: 错误上下文信息 ===\n');

  const eventEmitter = new EventEmitter();
  const errorHandler = new ErrorHandler(eventEmitter);

  eventEmitter.on('error', (error: MarkmapError) => {
    console.log('错误详情:');
    console.log('  - 代码:', error.code);
    console.log('  - 消息:', error.message);
    console.log('  - 上下文:', JSON.stringify(error.context, null, 2));
  });

  // 创建包含丰富上下文信息的错误
  const error = new MarkmapError(
    MarkmapErrorCode.RENDER_ERROR,
    '节点渲染失败',
    {
      nodeId: 'node-123',
      nodeContent: '示例节点',
      nodeDepth: 3,
      parentId: 'node-100',
      timestamp: new Date().toISOString(),
      userAgent: 'Example Browser',
      viewport: { width: 1920, height: 1080 },
    },
  );

  errorHandler.handleError(error);
}

// ==================== 示例 8: 更新错误处理器配置 ====================

function example8_UpdateConfiguration() {
  console.log('\n=== 示例 8: 更新错误处理器配置 ===\n');

  const eventEmitter = new EventEmitter();
  const errorHandler = new ErrorHandler(eventEmitter, {
    logErrors: true,
  });

  console.log('初始配置: logErrors = true');
  errorHandler.handleRenderError(new Error('错误 1'));

  // 更新配置
  console.log('\n更新配置: logErrors = false');
  errorHandler.updateOptions({ logErrors: false });
  errorHandler.handleRenderError(new Error('错误 2')); // 不会输出日志

  // 再次更新配置
  console.log('\n更新配置: logErrors = true, 添加自定义处理');
  errorHandler.updateOptions({
    logErrors: true,
    onError: () => {
      console.log('  [自定义] 错误已记录');
    },
  });
  errorHandler.handleRenderError(new Error('错误 3'));
}

// ==================== 运行所有示例 ====================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        Markmap Core 错误处理系统使用示例              ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  example1_BasicErrorHandling();
  example2_CustomErrorHandling();
  example3_MarkmapErrorFactories();
  example4_FunctionWrappers();
  await example5_AsyncFunctionWrappers();
  example6_ErrorRecovery();
  example7_ErrorContext();
  example8_UpdateConfiguration();

  console.log('\n所有示例运行完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicErrorHandling,
  example2_CustomErrorHandling,
  example3_MarkmapErrorFactories,
  example4_FunctionWrappers,
  example5_AsyncFunctionWrappers,
  example6_ErrorRecovery,
  example7_ErrorContext,
  example8_UpdateConfiguration,
};
