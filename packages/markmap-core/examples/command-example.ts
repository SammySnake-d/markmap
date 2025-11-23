/**
 * 命令系统使用示例
 *
 * 展示如何使用 CommandManager 来注册、执行和撤销命令
 */

import { CommandManager } from '../src/commands/command-manager';
import { EventEmitter } from '../src/events/event-emitter';
import type { ICommand } from 'markmap-interfaces';

// 创建一个简单的 API mock
const mockAPI = {
  data: { content: 'Root', children: [] },
  setData(data: any) {
    this.data = data;
    console.log('Data updated:', data);
  },
  getData() {
    return this.data;
  },
};

// 创建事件发射器
const eventEmitter = new EventEmitter();

// 监听命令事件
eventEmitter.on('command:executed', ({ command, args }) => {
  console.log(`✓ Command executed: ${command.name}`, args);
});

eventEmitter.on('command:undone', ({ command }) => {
  console.log(`↶ Command undone: ${command.name}`);
});

eventEmitter.on('command:redone', ({ command }) => {
  console.log(`↷ Command redone: ${command.name}`);
});

eventEmitter.on('error', (error) => {
  console.error('✗ Error:', error.message);
});

// 创建命令管理器
const commandManager = new CommandManager(mockAPI, eventEmitter);

// ==================== 示例 1: 简单命令（不支持撤销） ====================

const simpleCommand: ICommand = {
  id: 'log-message',
  name: 'Log Message',
  description: 'Logs a message to the console',
  execute: async (api, message: string) => {
    console.log('Message:', message);
  },
};

// 注册并执行简单命令
commandManager.register(simpleCommand);
await commandManager.execute('log-message', 'Hello, Markmap!');

// ==================== 示例 2: 可撤销命令 ====================

// 保存数据状态用于撤销
let previousData: any = null;

const updateDataCommand: ICommand = {
  id: 'update-data',
  name: 'Update Data',
  description: 'Updates the mindmap data',
  execute: async (api, newData: any) => {
    // 保存当前数据以便撤销
    previousData = JSON.parse(JSON.stringify(api.getData()));
    // 更新数据
    api.setData(newData);
  },
  undo: async (api) => {
    // 恢复之前的数据
    if (previousData) {
      api.setData(previousData);
    }
  },
};

// 注册并执行可撤销命令
commandManager.register(updateDataCommand);

console.log('\n--- Executing update-data command ---');
await commandManager.execute('update-data', {
  content: 'New Root',
  children: [{ content: 'Child 1' }, { content: 'Child 2' }],
});

console.log('Current data:', mockAPI.getData());

// 撤销命令
console.log('\n--- Undoing update-data command ---');
await commandManager.undo();
console.log('Current data after undo:', mockAPI.getData());

// 重做命令
console.log('\n--- Redoing update-data command ---');
await commandManager.redo();
console.log('Current data after redo:', mockAPI.getData());

// ==================== 示例 3: 带条件检查的命令 ====================

const conditionalCommand: ICommand = {
  id: 'conditional-command',
  name: 'Conditional Command',
  description: 'Only executes if data has children',
  canExecute: (api) => {
    const data = api.getData();
    return data.children && data.children.length > 0;
  },
  execute: async (api) => {
    const data = api.getData();
    console.log(`Processing ${data.children.length} children`);
  },
};

commandManager.register(conditionalCommand);

console.log('\n--- Executing conditional command (should succeed) ---');
await commandManager.execute('conditional-command');

// 清空数据
mockAPI.setData({ content: 'Empty Root', children: [] });

console.log('\n--- Executing conditional command (should fail) ---');
try {
  await commandManager.execute('conditional-command');
} catch (error) {
  console.log('Expected error:', (error as Error).message);
}

// ==================== 示例 4: 命令历史管理 ====================

console.log('\n--- Command History ---');
console.log('Can undo:', commandManager.canUndo());
console.log('Can redo:', commandManager.canRedo());
console.log('History index:', commandManager.getHistoryIndex());
console.log('History length:', commandManager.getHistory().length);

// 清空历史
commandManager.clearHistory();
console.log('\n--- After clearing history ---');
console.log('Can undo:', commandManager.canUndo());
console.log('History length:', commandManager.getHistory().length);

// ==================== 示例 5: 批量命令 ====================

console.log('\n--- Batch Commands ---');

// 创建多个命令
const commands: ICommand[] = [
  {
    id: 'add-node-1',
    name: 'Add Node 1',
    execute: async (api) => {
      const data = api.getData();
      data.children = data.children || [];
      data.children.push({ content: 'Node 1' });
      api.setData(data);
    },
    undo: async (api) => {
      const data = api.getData();
      data.children.pop();
      api.setData(data);
    },
  },
  {
    id: 'add-node-2',
    name: 'Add Node 2',
    execute: async (api) => {
      const data = api.getData();
      data.children = data.children || [];
      data.children.push({ content: 'Node 2' });
      api.setData(data);
    },
    undo: async (api) => {
      const data = api.getData();
      data.children.pop();
      api.setData(data);
    },
  },
];

// 注册所有命令
commands.forEach((cmd) => commandManager.register(cmd));

// 执行所有命令
for (const cmd of commands) {
  await commandManager.execute(cmd.id);
}

console.log('Final data:', mockAPI.getData());

// 撤销所有命令
console.log('\n--- Undoing all commands ---');
while (commandManager.canUndo()) {
  await commandManager.undo();
}

console.log('Data after undoing all:', mockAPI.getData());

console.log('\n--- Example completed ---');
