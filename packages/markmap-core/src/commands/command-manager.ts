import type { ICommand, ICommandManager } from 'markmap-interfaces';
import type { EventEmitter } from '../events/event-emitter';

/**
 * 命令历史记录项
 */
interface CommandHistoryEntry {
  command: ICommand;
  args: any[];
  timestamp: number;
}

/**
 * CommandManager 类 - 命令管理器
 *
 * 负责命令的注册、执行和撤销管理
 * 使用命令模式封装操作，支持撤销/重做功能
 *
 * Requirements: 13.1, 13.2, 13.3
 */
export class CommandManager implements ICommandManager {
  private commands: Map<string, ICommand>;
  private history: CommandHistoryEntry[];
  private historyIndex: number;
  private maxHistorySize: number;
  private eventEmitter: EventEmitter;
  private api: any; // MarkmapAPI 实例

  /**
   * 创建命令管理器实例
   * @param api - Markmap API 实例
   * @param eventEmitter - 事件发射器
   * @param maxHistorySize - 最大历史记录数量，默认 50
   */
  constructor(api: any, eventEmitter: EventEmitter, maxHistorySize = 50) {
    this.commands = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = maxHistorySize;
    this.eventEmitter = eventEmitter;
    this.api = api;
  }

  /**
   * 注册命令
   * @param command - 要注册的命令实例
   *
   * Requirements: 13.1
   */
  register(command: ICommand): void {
    if (!command.id) {
      throw new Error('Command must have an id');
    }

    if (this.commands.has(command.id)) {
      console.warn(
        `Command with id "${command.id}" is already registered. Overwriting.`,
      );
    }

    this.commands.set(command.id, command);
    this.eventEmitter.emit('command:registered', command);
  }

  /**
   * 取消注册命令
   * @param commandId - 命令 ID
   *
   * Requirements: 13.1
   */
  unregister(commandId: string): void {
    const command = this.commands.get(commandId);
    if (command) {
      this.commands.delete(commandId);
      this.eventEmitter.emit('command:unregistered', command);
    }
  }

  /**
   * 执行命令
   * @param commandId - 命令 ID
   * @param args - 命令参数
   * @returns 执行结果或 Promise
   *
   * Requirements: 13.2
   */
  async execute(commandId: string, ...args: any[]): Promise<void> {
    const command = this.commands.get(commandId);

    if (!command) {
      const error = new Error(`Command with id "${commandId}" not found`);
      this.eventEmitter.emit('error', error);
      throw error;
    }

    // 检查命令是否可以执行
    if (command.canExecute && !command.canExecute(this.api)) {
      const error = new Error(
        `Command "${commandId}" cannot be executed at this time`,
      );
      this.eventEmitter.emit('error', error);
      throw error;
    }

    try {
      // 执行命令
      this.eventEmitter.emit('command:before-execute', { command, args });
      await command.execute(this.api, ...args);
      this.eventEmitter.emit('command:executed', { command, args });

      // 如果命令支持撤销，添加到历史记录
      if (command.undo) {
        this.addToHistory(command, args);
      }
    } catch (error) {
      // 捕获并触发错误事件
      const commandError = new Error(
        `Failed to execute command "${commandId}": ${error instanceof Error ? error.message : String(error)}`,
      );
      this.eventEmitter.emit('error', commandError);
      this.eventEmitter.emit('command:error', {
        command,
        args,
        error: commandError,
      });
      throw commandError;
    }
  }

  /**
   * 撤销上一个命令
   * @returns 是否成功撤销
   *
   * Requirements: 13.3
   */
  async undo(): Promise<boolean> {
    if (this.historyIndex < 0) {
      return false;
    }

    const entry = this.history[this.historyIndex];
    const { command } = entry;

    if (!command.undo) {
      console.warn(`Command "${command.id}" does not support undo`);
      return false;
    }

    try {
      this.eventEmitter.emit('command:before-undo', { command });
      await command.undo(this.api);
      this.historyIndex--;
      this.eventEmitter.emit('command:undone', { command });
      return true;
    } catch (error) {
      const undoError = new Error(
        `Failed to undo command "${command.id}": ${error instanceof Error ? error.message : String(error)}`,
      );
      this.eventEmitter.emit('error', undoError);
      this.eventEmitter.emit('command:undo-error', {
        command,
        error: undoError,
      });
      return false;
    }
  }

  /**
   * 重做上一个被撤销的命令
   * @returns 是否成功重做
   *
   * Requirements: 13.3
   */
  async redo(): Promise<boolean> {
    if (this.historyIndex >= this.history.length - 1) {
      return false;
    }

    const entry = this.history[this.historyIndex + 1];
    const { command, args } = entry;

    try {
      this.eventEmitter.emit('command:before-redo', { command, args });
      await command.execute(this.api, ...args);
      this.historyIndex++;
      this.eventEmitter.emit('command:redone', { command, args });
      return true;
    } catch (error) {
      const redoError = new Error(
        `Failed to redo command "${command.id}": ${error instanceof Error ? error.message : String(error)}`,
      );
      this.eventEmitter.emit('error', redoError);
      this.eventEmitter.emit('command:redo-error', {
        command,
        args,
        error: redoError,
      });
      return false;
    }
  }

  /**
   * 获取已注册的命令
   * @param commandId - 命令 ID
   * @returns 命令实例或 undefined
   */
  getCommand(commandId: string): ICommand | undefined {
    return this.commands.get(commandId);
  }

  /**
   * 获取所有已注册的命令
   * @returns 命令数组
   */
  getAllCommands(): ICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * 清空命令历史
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
    this.eventEmitter.emit('command:history-cleared');
  }

  /**
   * 获取命令历史
   * @returns 历史记录数组
   */
  getHistory(): ReadonlyArray<Readonly<CommandHistoryEntry>> {
    return this.history;
  }

  /**
   * 获取当前历史索引
   * @returns 历史索引
   */
  getHistoryIndex(): number {
    return this.historyIndex;
  }

  /**
   * 检查是否可以撤销
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  /**
   * 检查是否可以重做
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 添加命令到历史记录
   * @param command - 命令实例
   * @param args - 命令参数
   */
  private addToHistory(command: ICommand, args: any[]): void {
    // 如果当前不在历史记录的末尾，删除后面的记录
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 添加新记录
    this.history.push({
      command,
      args,
      timestamp: Date.now(),
    });

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    this.eventEmitter.emit('command:history-changed', {
      history: this.history,
      index: this.historyIndex,
    });
  }
}
