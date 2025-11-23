/**
 * 命令接口
 * 使用命令模式封装操作，支持撤销/重做功能
 */
export interface ICommand {
  /**
   * 命令的唯一标识符
   */
  id: string;

  /**
   * 命令的显示名称
   */
  name: string;

  /**
   * 命令的描述信息
   */
  description?: string;

  /**
   * 执行命令
   * @param api - Markmap API 实例
   * @param args - 命令参数
   * @returns 执行结果或 Promise
   */
  execute(api: any, ...args: any[]): void | Promise<void>;

  /**
   * 撤销命令（可选）
   * 如果实现此方法，命令将支持撤销操作
   * @param api - Markmap API 实例
   * @returns 撤销结果或 Promise
   */
  undo?(api: any): void | Promise<void>;

  /**
   * 判断命令是否可以执行（可选）
   * @param api - Markmap API 实例
   * @returns 是否可以执行
   */
  canExecute?(api: any): boolean;
}

/**
 * 命令管理器接口
 * 负责命令的注册、执行和撤销管理
 */
export interface ICommandManager {
  /**
   * 注册命令
   * @param command - 要注册的命令实例
   */
  register(command: ICommand): void;

  /**
   * 取消注册命令
   * @param commandId - 命令 ID
   */
  unregister(commandId: string): void;

  /**
   * 执行命令
   * @param commandId - 命令 ID
   * @param args - 命令参数
   * @returns 执行结果或 Promise
   */
  execute(commandId: string, ...args: any[]): void | Promise<void>;

  /**
   * 撤销上一个命令
   * @returns 是否成功撤销
   */
  undo(): boolean | Promise<boolean>;

  /**
   * 重做上一个被撤销的命令
   * @returns 是否成功重做
   */
  redo(): boolean | Promise<boolean>;

  /**
   * 获取已注册的命令
   * @param commandId - 命令 ID
   * @returns 命令实例或 undefined
   */
  getCommand(commandId: string): ICommand | undefined;

  /**
   * 获取所有已注册的命令
   * @returns 命令数组
   */
  getAllCommands(): ICommand[];

  /**
   * 清空命令历史
   */
  clearHistory(): void;
}
