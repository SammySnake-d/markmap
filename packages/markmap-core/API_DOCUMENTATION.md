# Markmap Core API 文档

## 概述

Markmap Core 是 Markmap 开放式架构的核心包，提供了核心渲染引擎、功能 API、事件系统、依赖注入容器和命令管理器。

本文档详细说明了所有公共 API 的使用方法。

## 目录

- [核心类](#核心类)
  - [MarkmapCore](#markmapcore)
  - [MarkmapAPI](#markmapapi)
  - [EventEmitter](#eventemitter)
  - [DIContainer](#dicontainer)
  - [CommandManager](#commandmanager)
- [接口定义](#接口定义)
- [配置选项](#配置选项)
- [代码示例](#代码示例)

## 安装

```bash
npm install markmap-core markmap-interfaces markmap-common
```

或使用 pnpm:

```bash
pnpm add markmap-core markmap-interfaces markmap-common
```

## 核心类

### MarkmapCore

核心渲染引擎，负责节点布局、连线绘制和动画。

#### 构造函数

```typescript
constructor(svg: SVGElement, options?: Partial<IMarkmapOptions>)
```

**参数**:
- `svg`: SVG 元素，用于渲染思维导图
- `options`: 可选的配置选项

**示例**:
```typescript
import { MarkmapCore } from 'markmap-core';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg, {
  maxWidth: 300,
  paddingX: 8,
  duration: 500
});
```

#### 方法

##### renderData()

渲染节点数据到 SVG。

```typescript
renderData(data: INode): void
```

**参数**:
- `data`: 节点树数据

**示例**:
```typescript
const data = {
  type: 'heading',
  depth: 0,
  content: 'Root',
  payload: { fold: 0 },
  children: []
};

core.renderData(data);
```


### MarkmapAPI

功能 API 层，提供数据操作、视图控制、节点操作、导出和搜索功能。

#### 构造函数

```typescript
constructor(core: IMarkmapCore, eventEmitter: EventEmitter)
```

**参数**:
- `core`: MarkmapCore 实例
- `eventEmitter`: EventEmitter 实例

**示例**:
```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);
```

#### 数据操作方法

##### setData()

设置思维导图数据并触发渲染。

```typescript
setData(data: INode): void
```

**参数**:
- `data`: 节点树数据

**触发事件**: `data:change`

**示例**:
```typescript
api.setData({
  type: 'heading',
  depth: 0,
  content: 'My Mindmap',
  payload: { fold: 0 },
  children: [
    {
      type: 'heading',
      depth: 1,
      content: 'Topic 1',
      payload: { fold: 0 },
      children: []
    }
  ]
});
```

##### getData()

获取当前的思维导图数据。

```typescript
getData(): INode
```

**返回**: 当前的节点树数据

**示例**:
```typescript
const currentData = api.getData();
console.log(currentData.content); // 'My Mindmap'
```

##### updateNode()

更新指定节点的数据。

```typescript
updateNode(nodeId: string, updates: Partial<INode>): void
```

**参数**:
- `nodeId`: 节点 ID
- `updates`: 要更新的节点属性

**示例**:
```typescript
api.updateNode('node-123', {
  content: 'Updated Content',
  payload: { fold: 1 }
});
```

#### 视图控制方法

##### fit()

自动调整视图以适应所有节点。

```typescript
fit(maxScale?: number): void
```

**参数**:
- `maxScale`: 可选的最大缩放比例

**示例**:
```typescript
api.fit(2.0); // 最大放大到 2 倍
```

##### centerNode()

将指定节点居中显示。

```typescript
centerNode(nodeId: string): void
```

**参数**:
- `nodeId`: 要居中的节点 ID

**示例**:
```typescript
api.centerNode('node-123');
```

##### ensureVisible()

确保指定节点在可见区域内。

```typescript
ensureVisible(nodeId: string): void
```

**参数**:
- `nodeId`: 要确保可见的节点 ID

**示例**:
```typescript
api.ensureVisible('node-123');
```

#### 节点操作方法

##### toggleNode()

切换节点的展开/折叠状态。

```typescript
toggleNode(nodeId: string, recursive?: boolean): void
```

**参数**:
- `nodeId`: 节点 ID
- `recursive`: 是否递归切换子节点（默认 false）

**触发事件**: `node:toggle`

**示例**:
```typescript
// 切换单个节点
api.toggleNode('node-123');

// 递归切换节点及其所有子节点
api.toggleNode('node-123', true);
```

##### expandAll()

展开指定节点及其所有子节点。

```typescript
expandAll(nodeId?: string): void
```

**参数**:
- `nodeId`: 可选的节点 ID，如果不提供则展开所有节点

**示例**:
```typescript
// 展开所有节点
api.expandAll();

// 展开指定节点及其子节点
api.expandAll('node-123');
```

##### collapseAll()

折叠指定节点及其所有子节点。

```typescript
collapseAll(nodeId?: string): void
```

**参数**:
- `nodeId`: 可选的节点 ID，如果不提供则折叠所有节点

**示例**:
```typescript
// 折叠所有节点
api.collapseAll();

// 折叠指定节点及其子节点
api.collapseAll('node-123');
```

#### 导出方法

##### exportAsMarkdown()

将节点树导出为 Markdown 格式。

```typescript
exportAsMarkdown(nodeId?: string): string
```

**参数**:
- `nodeId`: 可选的节点 ID，如果不提供则导出整个树

**返回**: Markdown 格式的字符串

**示例**:
```typescript
// 导出整个思维导图
const markdown = api.exportAsMarkdown();
console.log(markdown);

// 导出指定节点及其子树
const subtreeMarkdown = api.exportAsMarkdown('node-123');
```

##### exportAsSVG()

将思维导图导出为 SVG 格式。

```typescript
exportAsSVG(): string
```

**返回**: SVG 格式的字符串

**示例**:
```typescript
const svgString = api.exportAsSVG();
// 可以保存为文件或在其他地方使用
```

##### exportAsPNG()

将思维导图导出为 PNG 图片。

```typescript
exportAsPNG(): Promise<Blob>
```

**返回**: Promise，解析为 PNG 图片的 Blob 对象

**示例**:
```typescript
const pngBlob = await api.exportAsPNG();
const url = URL.createObjectURL(pngBlob);
// 可以用于下载或显示
```

#### 搜索方法

##### search()

搜索包含指定查询的节点。

```typescript
search(query: string): INode[]
```

**参数**:
- `query`: 搜索查询字符串

**返回**: 匹配的节点数组

**触发事件**: `search:query`, `search:result`

**示例**:
```typescript
const results = api.search('important');
console.log(`找到 ${results.length} 个匹配的节点`);
```

##### highlightNode()

高亮显示指定节点。

```typescript
highlightNode(nodeId: string): void
```

**参数**:
- `nodeId`: 要高亮的节点 ID

**示例**:
```typescript
api.highlightNode('node-123');
```

##### clearHighlight()

清除所有高亮。

```typescript
clearHighlight(): void
```

**示例**:
```typescript
api.clearHighlight();
```


### EventEmitter

事件系统，用于组件间通信。

#### 构造函数

```typescript
constructor()
```

**示例**:
```typescript
import { EventEmitter } from 'markmap-core';

const eventEmitter = new EventEmitter();
```

#### 方法

##### on()

注册事件监听器。

```typescript
on(event: string, listener: Function): void
```

**参数**:
- `event`: 事件名称
- `listener`: 监听器函数

**示例**:
```typescript
eventEmitter.on('data:change', (data) => {
  console.log('数据已更改:', data);
});
```

##### off()

移除事件监听器。

```typescript
off(event: string, listener: Function): void
```

**参数**:
- `event`: 事件名称
- `listener`: 要移除的监听器函数

**示例**:
```typescript
const listener = (data) => console.log(data);
eventEmitter.on('data:change', listener);
// 稍后移除
eventEmitter.off('data:change', listener);
```

##### emit()

触发事件。

```typescript
emit(event: string, ...args: any[]): void
```

**参数**:
- `event`: 事件名称
- `args`: 传递给监听器的参数

**示例**:
```typescript
eventEmitter.emit('custom:event', { message: 'Hello' });
```

##### once()

注册一次性事件监听器。

```typescript
once(event: string, listener: Function): void
```

**参数**:
- `event`: 事件名称
- `listener`: 监听器函数（只会被调用一次）

**示例**:
```typescript
eventEmitter.once('data:load', (data) => {
  console.log('数据首次加载:', data);
});
```

#### 内置事件

##### 节点事件

- `node:click` - 节点被点击
  ```typescript
  eventEmitter.on('node:click', (node: INode) => {
    console.log('点击了节点:', node.content);
  });
  ```

- `node:rightclick` - 节点被右键点击
  ```typescript
  eventEmitter.on('node:rightclick', (node: INode, position: IPosition) => {
    console.log('右键点击节点:', node.content, '位置:', position);
  });
  ```

- `node:toggle` - 节点展开/折叠状态改变
  ```typescript
  eventEmitter.on('node:toggle', (node: INode, expanded: boolean) => {
    console.log('节点状态:', expanded ? '展开' : '折叠');
  });
  ```

##### 数据事件

- `data:change` - 数据发生变化
  ```typescript
  eventEmitter.on('data:change', (data: INode) => {
    console.log('数据已更新');
  });
  ```

- `data:load` - 数据加载完成
  ```typescript
  eventEmitter.on('data:load', (data: INode) => {
    console.log('数据加载完成');
  });
  ```

##### 视图事件

- `view:transform` - 视图变换（缩放、平移）
  ```typescript
  eventEmitter.on('view:transform', (transform: ITransform) => {
    console.log('视图变换:', transform);
  });
  ```

- `view:fit` - 视图自适应
  ```typescript
  eventEmitter.on('view:fit', () => {
    console.log('视图已自适应');
  });
  ```

##### 搜索事件

- `search:query` - 搜索查询
  ```typescript
  eventEmitter.on('search:query', (query: string) => {
    console.log('搜索:', query);
  });
  ```

- `search:result` - 搜索结果
  ```typescript
  eventEmitter.on('search:result', (results: INode[]) => {
    console.log('找到', results.length, '个结果');
  });
  ```

##### 错误事件

- `error` - 错误发生
  ```typescript
  eventEmitter.on('error', (error: Error) => {
    console.error('发生错误:', error);
  });
  ```


### DIContainer

依赖注入容器，用于管理服务的注册和解析。

#### 构造函数

```typescript
constructor()
```

**示例**:
```typescript
import { DIContainer, ServiceLifetime } from 'markmap-core';

const container = new DIContainer();
```

#### 方法

##### register()

注册服务。

```typescript
register<T>(key: string, implementation: T | (() => T), lifetime?: ServiceLifetime): void
```

**参数**:
- `key`: 服务键
- `implementation`: 服务实现或工厂函数
- `lifetime`: 服务生命周期（Singleton 或 Transient）

**示例**:
```typescript
// 注册单例服务
container.register('noteProvider', new CustomNoteProvider(), ServiceLifetime.Singleton);

// 注册瞬态服务（每次解析都创建新实例）
container.register('tempService', () => new TempService(), ServiceLifetime.Transient);
```

##### resolve()

解析服务。

```typescript
resolve<T>(key: string): T | undefined
```

**参数**:
- `key`: 服务键

**返回**: 服务实例，如果未注册则返回 undefined

**示例**:
```typescript
const noteProvider = container.resolve<INoteProvider>('noteProvider');
if (noteProvider) {
  noteProvider.renderNoteIcon(node, container);
}
```

##### has()

检查服务是否已注册。

```typescript
has(key: string): boolean
```

**参数**:
- `key`: 服务键

**返回**: 如果服务已注册则返回 true

**示例**:
```typescript
if (container.has('noteProvider')) {
  console.log('备注 Provider 已注册');
}
```

##### clear()

清除所有已注册的服务。

```typescript
clear(): void
```

**示例**:
```typescript
container.clear();
```

##### keys()

获取所有已注册的服务键。

```typescript
keys(): string[]
```

**返回**: 服务键数组

**示例**:
```typescript
const registeredKeys = container.keys();
console.log('已注册的服务:', registeredKeys);
```

#### ServiceLifetime 枚举

```typescript
enum ServiceLifetime {
  Singleton = 'singleton',  // 单例：整个应用生命周期内只创建一次
  Transient = 'transient'   // 瞬态：每次解析都创建新实例
}
```


### CommandManager

命令管理器，支持命令的注册、执行、撤销和重做。

#### 构造函数

```typescript
constructor(api: IMarkmapAPI, eventEmitter: EventEmitter)
```

**参数**:
- `api`: MarkmapAPI 实例
- `eventEmitter`: EventEmitter 实例

**示例**:
```typescript
import { CommandManager } from 'markmap-core';

const commandManager = new CommandManager(api, eventEmitter);
```

#### 方法

##### register()

注册命令。

```typescript
register(command: ICommand): void
```

**参数**:
- `command`: 命令对象

**触发事件**: `command:registered`

**示例**:
```typescript
const expandAllCommand = {
  id: 'expand-all',
  name: 'Expand All',
  execute: async (api) => {
    api.expandAll();
  },
  undo: async (api) => {
    api.collapseAll();
  }
};

commandManager.register(expandAllCommand);
```

##### execute()

执行命令。

```typescript
execute(commandId: string, ...args: any[]): Promise<void>
```

**参数**:
- `commandId`: 命令 ID
- `args`: 传递给命令的参数

**触发事件**: `command:before-execute`, `command:executed`

**示例**:
```typescript
await commandManager.execute('expand-all');
```

##### undo()

撤销上一个命令。

```typescript
undo(): Promise<boolean>
```

**返回**: 如果成功撤销则返回 true

**触发事件**: `command:undone`

**示例**:
```typescript
const success = await commandManager.undo();
if (success) {
  console.log('命令已撤销');
}
```

##### redo()

重做上一个被撤销的命令。

```typescript
redo(): Promise<boolean>
```

**返回**: 如果成功重做则返回 true

**触发事件**: `command:executed`

**示例**:
```typescript
const success = await commandManager.redo();
if (success) {
  console.log('命令已重做');
}
```

##### canUndo()

检查是否可以撤销。

```typescript
canUndo(): boolean
```

**返回**: 如果有可撤销的命令则返回 true

**示例**:
```typescript
if (commandManager.canUndo()) {
  await commandManager.undo();
}
```

##### canRedo()

检查是否可以重做。

```typescript
canRedo(): boolean
```

**返回**: 如果有可重做的命令则返回 true

**示例**:
```typescript
if (commandManager.canRedo()) {
  await commandManager.redo();
}
```

##### clearHistory()

清空命令历史。

```typescript
clearHistory(): void
```

**示例**:
```typescript
commandManager.clearHistory();
```

##### getHistory()

获取命令历史。

```typescript
getHistory(): ICommand[]
```

**返回**: 命令历史数组

**示例**:
```typescript
const history = commandManager.getHistory();
console.log(`执行了 ${history.length} 个命令`);
```

#### ICommand 接口

```typescript
interface ICommand {
  id: string;                                    // 命令唯一标识
  name: string;                                  // 命令名称
  execute: (api: IMarkmapAPI, ...args: any[]) => Promise<void>;  // 执行方法
  undo?: (api: IMarkmapAPI) => Promise<void>;    // 可选的撤销方法
  canExecute?: (api: IMarkmapAPI) => boolean;    // 可选的执行条件检查
}
```

**示例**:
```typescript
const customCommand: ICommand = {
  id: 'custom-action',
  name: 'Custom Action',
  execute: async (api, nodeId: string) => {
    const node = api.findNode(nodeId);
    if (node) {
      node.content = 'Modified';
      api.setData(api.getData());
    }
  },
  undo: async (api) => {
    // 恢复操作
  },
  canExecute: (api) => {
    return api.getData() !== null;
  }
};
```


## 配置选项

### IMarkmapOptions

```typescript
interface IMarkmapOptions {
  // 布局配置
  maxWidth?: number;              // 节点最大宽度（默认: 300）
  paddingX?: number;              // 水平内边距（默认: 8）
  spacingHorizontal?: number;     // 水平间距（默认: 80）
  spacingVertical?: number;       // 垂直间距（默认: 5）
  
  // 动画配置
  duration?: number;              // 动画持续时间（毫秒，默认: 500）
  zoom?: boolean;                 // 是否启用缩放（默认: true）
  pan?: boolean;                  // 是否启用平移（默认: true）
  
  // 颜色配置
  color?: string | ((node: INode) => string);  // 节点颜色
  
  // 其他配置
  autoFit?: boolean;              // 是否自动适应视图（默认: true）
  initialExpandLevel?: number;    // 初始展开层级（-1 表示全部展开，默认: -1）
}
```

**示例**:
```typescript
const options: IMarkmapOptions = {
  maxWidth: 400,
  paddingX: 10,
  spacingHorizontal: 100,
  spacingVertical: 10,
  duration: 300,
  zoom: true,
  pan: true,
  color: (node) => {
    // 根据深度返回不同颜色
    const colors = ['#5e7ce0', '#f66f6a', '#f9cf58', '#7eddde'];
    return colors[node.depth % colors.length];
  },
  autoFit: true,
  initialExpandLevel: 2
};

const core = new MarkmapCore(svg, options);
```

## 完整示例

### 基础使用

```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';

// 1. 获取 SVG 元素
const svg = document.querySelector('#markmap');

// 2. 创建核心组件
const core = new MarkmapCore(svg, {
  maxWidth: 300,
  duration: 500
});

const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

// 3. 监听事件
eventEmitter.on('data:change', (data) => {
  console.log('数据已更新');
});

eventEmitter.on('node:click', (node) => {
  console.log('点击了节点:', node.content);
});

// 4. 加载数据
const data = {
  type: 'heading',
  depth: 0,
  content: 'My Mindmap',
  payload: { fold: 0 },
  children: [
    {
      type: 'heading',
      depth: 1,
      content: 'Topic 1',
      payload: { fold: 0 },
      children: []
    },
    {
      type: 'heading',
      depth: 1,
      content: 'Topic 2',
      payload: { fold: 0 },
      children: []
    }
  ]
};

api.setData(data);

// 5. 使用 API
api.fit();  // 自适应视图
```

### 使用依赖注入

```typescript
import { 
  MarkmapCore, 
  MarkmapAPI, 
  EventEmitter, 
  DIContainer, 
  ServiceLifetime 
} from 'markmap-core';

// 1. 创建容器
const container = new DIContainer();

// 2. 创建和注册服务
const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

container.register('core', core, ServiceLifetime.Singleton);
container.register('eventEmitter', eventEmitter, ServiceLifetime.Singleton);
container.register('api', api, ServiceLifetime.Singleton);

// 3. 注册自定义 Provider
const customProvider = {
  id: 'custom-note-provider',
  renderNoteIcon: (node, container) => {
    const icon = document.createElement('span');
    icon.textContent = '📝';
    return icon;
  }
};

container.register('noteProvider', customProvider, ServiceLifetime.Singleton);

// 4. 解析和使用服务
const resolvedApi = container.resolve('api');
resolvedApi.setData(data);
```

### 使用命令系统

```typescript
import { 
  MarkmapCore, 
  MarkmapAPI, 
  EventEmitter, 
  CommandManager 
} from 'markmap-core';

// 1. 创建核心组件
const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);
const commandManager = new CommandManager(api, eventEmitter);

// 2. 定义命令
const expandAllCommand = {
  id: 'expand-all',
  name: 'Expand All Nodes',
  execute: async (api) => {
    api.expandAll();
  },
  undo: async (api) => {
    api.collapseAll();
  }
};

const collapseAllCommand = {
  id: 'collapse-all',
  name: 'Collapse All Nodes',
  execute: async (api) => {
    api.collapseAll();
  },
  undo: async (api) => {
    api.expandAll();
  }
};

// 3. 注册命令
commandManager.register(expandAllCommand);
commandManager.register(collapseAllCommand);

// 4. 执行命令
await commandManager.execute('expand-all');

// 5. 撤销命令
if (commandManager.canUndo()) {
  await commandManager.undo();
}

// 6. 重做命令
if (commandManager.canRedo()) {
  await commandManager.redo();
}
```

### 搜索和高亮

```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

// 加载数据
api.setData(data);

// 监听搜索事件
eventEmitter.on('search:result', (results) => {
  console.log(`找到 ${results.length} 个匹配的节点`);
  
  // 高亮第一个结果
  if (results.length > 0 && results[0].payload.id) {
    api.highlightNode(results[0].payload.id);
  }
});

// 执行搜索
const results = api.search('important');

// 清除高亮
setTimeout(() => {
  api.clearHighlight();
}, 3000);
```

### 导出功能

```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

api.setData(data);

// 导出为 Markdown
const markdown = api.exportAsMarkdown();
console.log(markdown);

// 导出为 SVG
const svgString = api.exportAsSVG();
const blob = new Blob([svgString], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);

// 导出为 PNG
const pngBlob = await api.exportAsPNG();
const pngUrl = URL.createObjectURL(pngBlob);

// 创建下载链接
const downloadLink = document.createElement('a');
downloadLink.href = pngUrl;
downloadLink.download = 'mindmap.png';
downloadLink.click();
```

## 最佳实践

### 1. 错误处理

始终监听错误事件并妥善处理：

```typescript
eventEmitter.on('error', (error) => {
  console.error('Markmap 错误:', error);
  // 显示用户友好的错误消息
  showErrorMessage('操作失败，请重试');
});
```

### 2. 内存管理

在组件销毁时清理事件监听器：

```typescript
class MarkmapComponent {
  private listeners: Array<{ event: string; listener: Function }> = [];
  
  constructor(private eventEmitter: EventEmitter) {
    this.setupListeners();
  }
  
  private setupListeners() {
    const dataChangeListener = (data) => {
      // 处理数据变化
    };
    
    this.eventEmitter.on('data:change', dataChangeListener);
    this.listeners.push({ event: 'data:change', listener: dataChangeListener });
  }
  
  destroy() {
    // 清理所有监听器
    this.listeners.forEach(({ event, listener }) => {
      this.eventEmitter.off(event, listener);
    });
    this.listeners = [];
  }
}
```

### 3. 性能优化

对于大型思维导图，使用初始折叠状态：

```typescript
const core = new MarkmapCore(svg, {
  initialExpandLevel: 2  // 只展开前两层
});
```

### 4. 类型安全

使用 TypeScript 类型定义确保类型安全：

```typescript
import type { INode, IMarkmapAPI } from 'markmap-interfaces';

function processNode(node: INode, api: IMarkmapAPI): void {
  // TypeScript 会提供类型检查和自动补全
  console.log(node.content);
  api.toggleNode(node.payload.id);
}
```

## 相关资源

- [Markmap 官方文档](https://markmap.js.org/)
- [GitHub 仓库](https://github.com/markmap/markmap)
- [示例集合](https://markmap.js.org/examples)

## 许可证

MIT License
