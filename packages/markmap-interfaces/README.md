# markmap-interfaces

Markmap 开放式 API 架构的 TypeScript 接口定义包。

## 概述

此包提供了 Markmap 重构后的所有核心接口定义，支持完全自定义的 UI 组件和扩展功能。通过这些接口，开发者可以：

- 实现自定义的 UI Provider（备注、右键菜单、工具栏、搜索）
- 访问核心渲染引擎和功能 API
- 监听和响应各种事件
- 实现自定义命令

## 安装

```bash
npm install markmap-interfaces
# 或
pnpm add markmap-interfaces
```

## 接口分类

### 核心接口

#### IMarkmapCore

核心渲染引擎接口，负责节点布局、连线绘制和动画。

```typescript
import type { IMarkmapCore } from 'markmap-interfaces';

// 核心方法
interface IMarkmapCore {
  renderData(data: INode): void;
  calculateLayout(data: INode): ILayoutResult;
  applyTransform(transform: ITransform): void;
  transition(duration?: number): void;
  getSVG(): SVGElement;
  destroy(): void;
}
```

#### IMarkmapAPI

功能 API 接口，提供数据操作、视图控制、导出等高级功能。

```typescript
import type { IMarkmapAPI } from 'markmap-interfaces';

// 主要功能分类
interface IMarkmapAPI {
  // 数据操作
  setData(data: INode): void;
  getData(): INode;
  updateNode(nodeId: string, data: Partial<INode>): void;
  
  // 视图控制
  fit(maxScale?: number): void;
  centerNode(nodeId: string): void;
  ensureVisible(nodeId: string): void;
  
  // 节点操作
  toggleNode(nodeId: string, recursive?: boolean): void;
  expandAll(nodeId?: string): void;
  collapseAll(nodeId?: string): void;
  
  // 导出功能
  exportAsMarkdown(nodeId?: string): string;
  exportAsSVG(): string;
  exportAsPNG(): Promise<Blob>;
  
  // 搜索功能
  search(query: string): INode[];
  highlightNode(nodeId: string): void;
  clearHighlight(): void;
}
```

#### IMarkmapConfig

Markmap 配置接口，定义初始化时的所有选项。

```typescript
import type { IMarkmapConfig } from 'markmap-interfaces';

const config: IMarkmapConfig = {
  svg: '#markmap',
  data: rootNode,
  maxWidth: 300,
  paddingX: 8,
  spacingHorizontal: 80,
  spacingVertical: 5,
  duration: 500,
  autoFit: true,
  
  // 注入自定义 Provider
  noteProvider: new CustomNoteProvider(),
  contextMenuProvider: new CustomContextMenuProvider(),
  toolbarProvider: new CustomToolbarProvider(),
  searchProvider: new CustomSearchProvider(),
  
  // 事件回调
  onNodeClick: (node) => console.log('Clicked:', node),
  onNodeRightClick: (node, pos) => console.log('Right clicked:', node, pos),
  onDataChange: (data) => console.log('Data changed:', data),
  onError: (error) => console.error('Error:', error),
};
```

### Provider 接口

#### INoteProvider

备注系统 Provider 接口。

```typescript
import type { INoteProvider, INode, IPosition, IMarkmapAPI } from 'markmap-interfaces';

class CustomNoteProvider implements INoteProvider {
  renderNoteIcon(node: INode, container: HTMLElement, api: IMarkmapAPI): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'custom-note-icon';
    icon.textContent = '📝';
    icon.onclick = () => {
      const rect = icon.getBoundingClientRect();
      this.showNotePanel(node, { x: rect.left, y: rect.bottom }, api);
    };
    return icon;
  }

  showNotePanel(node: INode, position: IPosition, api: IMarkmapAPI): void {
    const panel = document.createElement('div');
    panel.className = 'custom-note-panel';
    panel.style.left = `${position.x}px`;
    panel.style.top = `${position.y}px`;
    
    const textarea = document.createElement('textarea');
    textarea.value = node.payload.note || '';
    textarea.oninput = () => {
      if (this.onNoteChange) {
        this.onNoteChange(node, textarea.value, api);
      }
    };
    
    panel.appendChild(textarea);
    document.body.appendChild(panel);
  }

  hideNotePanel(): void {
    const panel = document.querySelector('.custom-note-panel');
    if (panel) panel.remove();
  }

  onNoteChange(node: INode, note: string, api: IMarkmapAPI): void {
    node.payload.note = note;
    // 触发数据更新
  }
}
```

#### IContextMenuProvider

右键菜单 Provider 接口。

```typescript
import type { 
  IContextMenuProvider, 
  IMenuItem, 
  INode, 
  IPosition, 
  IMarkmapAPI 
} from 'markmap-interfaces';

class CustomContextMenuProvider implements IContextMenuProvider {
  items: IMenuItem[] = [
    {
      id: 'expand',
      label: '展开所有',
      icon: '➕',
      action: (node, api) => {
        if (node) {
          api.expandAll(node.state.id.toString());
        }
      },
    },
    {
      id: 'collapse',
      label: '折叠所有',
      icon: '➖',
      action: (node, api) => {
        if (node) {
          api.collapseAll(node.state.id.toString());
        }
      },
    },
    {
      id: 'separator',
      label: '',
      separator: true,
      action: () => {},
    },
    {
      id: 'export',
      label: '导出为 Markdown',
      icon: '📄',
      action: async (node, api) => {
        const markdown = api.exportAsMarkdown(node?.state.id.toString());
        // 复制到剪贴板或下载
        await navigator.clipboard.writeText(markdown);
      },
    },
  ];

  show(node: INode | null, position: IPosition, api: IMarkmapAPI): void {
    const menu = this.render(this.items, node, api);
    menu.style.left = `${position.x}px`;
    menu.style.top = `${position.y}px`;
    document.body.appendChild(menu);
    
    // 点击外部关闭菜单
    setTimeout(() => {
      document.addEventListener('click', () => this.hide(), { once: true });
    }, 0);
  }

  hide(): void {
    const menu = document.querySelector('.custom-context-menu');
    if (menu) menu.remove();
  }

  render(items: IMenuItem[], node: INode | null, api: IMarkmapAPI): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    
    items.forEach(item => {
      if (item.separator) {
        menu.appendChild(document.createElement('hr'));
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = 'menu-icon';
          icon.textContent = item.icon;
          menuItem.appendChild(icon);
        }
        
        const label = document.createElement('span');
        label.textContent = item.label;
        menuItem.appendChild(label);
        
        const isDisabled = typeof item.disabled === 'function' 
          ? item.disabled(node) 
          : item.disabled;
        
        if (isDisabled) {
          menuItem.classList.add('disabled');
        } else {
          menuItem.onclick = () => {
            item.action(node, api);
            this.hide();
          };
        }
        
        menu.appendChild(menuItem);
      }
    });
    
    return menu;
  }
}
```

#### IToolbarProvider

工具栏 Provider 接口。

```typescript
import type { IToolbarProvider, IToolItem, IMarkmapAPI } from 'markmap-interfaces';

class CustomToolbarProvider implements IToolbarProvider {
  tools: IToolItem[] = [
    {
      id: 'fit',
      label: '适配视图',
      icon: '🔍',
      type: 'button',
      action: (api) => api.fit(),
      tooltip: '将整个思维导图适配到视图中',
    },
    {
      id: 'expand-all',
      label: '展开全部',
      icon: '➕',
      type: 'button',
      action: (api) => api.expandAll(),
    },
    {
      id: 'collapse-all',
      label: '折叠全部',
      icon: '➖',
      type: 'button',
      action: (api) => api.collapseAll(),
    },
    {
      id: 'export',
      label: '导出',
      icon: '💾',
      type: 'dropdown',
      action: async (api, value) => {
        if (value === 'markdown') {
          const md = api.exportAsMarkdown();
          await navigator.clipboard.writeText(md);
        } else if (value === 'png') {
          const blob = await api.exportAsPNG();
          // 下载 PNG
        }
      },
      options: [
        { label: 'Markdown', value: 'markdown' },
        { label: 'PNG', value: 'png' },
        { label: 'SVG', value: 'svg' },
      ],
    },
  ];

  render(container: HTMLElement, api: IMarkmapAPI): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'custom-toolbar';
    
    this.tools.forEach(tool => {
      if (tool.type === 'button') {
        const button = document.createElement('button');
        button.dataset.toolId = tool.id;
        button.textContent = tool.icon || tool.label;
        button.title = tool.tooltip || tool.label;
        button.onclick = () => tool.action(api);
        toolbar.appendChild(button);
      } else if (tool.type === 'dropdown') {
        const select = document.createElement('select');
        select.dataset.toolId = tool.id;
        
        const placeholder = document.createElement('option');
        placeholder.textContent = tool.label;
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
        
        tool.options?.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          select.appendChild(option);
        });
        
        select.onchange = () => {
          tool.action(api, select.value);
          select.selectedIndex = 0; // 重置
        };
        
        toolbar.appendChild(select);
      }
    });
    
    container.appendChild(toolbar);
  }

  updateToolState(toolId: string, state: any): void {
    const element = document.querySelector(`[data-tool-id="${toolId}"]`);
    if (!element) return;
    
    if (state.disabled !== undefined) {
      (element as HTMLButtonElement).disabled = state.disabled;
    }
    
    if (state.active !== undefined) {
      element.classList.toggle('active', state.active);
    }
  }

  destroy(): void {
    const toolbar = document.querySelector('.custom-toolbar');
    if (toolbar) toolbar.remove();
  }
}
```

#### ISearchProvider

搜索功能 Provider 接口。

```typescript
import type { 
  ISearchProvider, 
  ISearchResult, 
  ISearchOptions, 
  INode, 
  IMarkmapAPI 
} from 'markmap-interfaces';

class CustomSearchProvider implements ISearchProvider {
  private results: ISearchResult[] = [];
  private currentIndex = -1;

  search(query: string, options: ISearchOptions, api: IMarkmapAPI): ISearchResult[] {
    this.results = [];
    const data = api.getData();
    
    const searchNode = (node: INode) => {
      const content = options.caseSensitive 
        ? node.content 
        : node.content.toLowerCase();
      const searchQuery = options.caseSensitive 
        ? query 
        : query.toLowerCase();
      
      if (content.includes(searchQuery)) {
        this.results.push({
          node,
          matches: [query],
        });
      }
      
      node.children?.forEach(searchNode);
    };
    
    searchNode(data);
    
    if (options.maxResults) {
      this.results = this.results.slice(0, options.maxResults);
    }
    
    return this.results;
  }

  highlightResults(results: ISearchResult[], api: IMarkmapAPI): void {
    results.forEach(result => {
      api.highlightNode(result.node.state.id.toString());
    });
  }

  clearHighlight(api: IMarkmapAPI): void {
    api.clearHighlight();
    this.results = [];
    this.currentIndex = -1;
  }

  nextResult(api: IMarkmapAPI): void {
    if (this.results.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.results.length;
    const result = this.results[this.currentIndex];
    api.centerNode(result.node.state.id.toString());
  }

  previousResult(api: IMarkmapAPI): void {
    if (this.results.length === 0) return;
    
    this.currentIndex = this.currentIndex <= 0 
      ? this.results.length - 1 
      : this.currentIndex - 1;
    const result = this.results[this.currentIndex];
    api.centerNode(result.node.state.id.toString());
  }
}
```

### 事件系统

#### IEventEmitter

事件发射器接口。

```typescript
import type { IEventEmitter, EventName } from 'markmap-interfaces';

// 使用示例
const emitter: IEventEmitter = /* ... */;

// 订阅事件
const unsubscribe = emitter.on('node:click', (node) => {
  console.log('Node clicked:', node);
});

// 取消订阅
unsubscribe();
// 或
emitter.off('node:click', handler);

// 订阅一次
emitter.once('data:load', (data) => {
  console.log('Data loaded:', data);
});

// 触发事件
emitter.emit('node:click', node);
emitter.emit('view:transform', transform);
```

#### IMarkmapEvents

所有可用的事件类型。

```typescript
import type { IMarkmapEvents } from 'markmap-interfaces';

// 事件类型映射
interface IMarkmapEvents {
  'node:click': (node: INode) => void;
  'node:rightclick': (node: INode, position: IPosition) => void;
  'node:hover': (node: INode) => void;
  'node:toggle': (node: INode, expanded: boolean) => void;
  'data:change': (data: INode) => void;
  'data:load': (data: INode) => void;
  'view:transform': (transform: ITransform) => void;
  'view:fit': () => void;
  'search:query': (query: string) => void;
  'search:result': (results: INode[]) => void;
  'error': (error: Error) => void;
}
```

### 数据模型

#### INode

节点数据结构。

```typescript
import type { INode, INodePayload } from 'markmap-interfaces';

const node: INode = {
  type: 'heading',
  depth: 0,
  content: '<h1>根节点</h1>',
  payload: {
    fold: 0,  // 0: 未折叠, 1: 折叠, 2: 递归折叠
    note: '这是一个备注',
    customData: 'any custom data',
  },
  children: [
    {
      type: 'heading',
      depth: 1,
      content: '<h2>子节点</h2>',
      payload: {},
      children: [],
    },
  ],
};
```

#### IPosition

位置坐标。

```typescript
import type { IPosition } from 'markmap-interfaces';

const position: IPosition = {
  x: 100,
  y: 200,
};
```

#### ITransform

视图变换。

```typescript
import type { ITransform } from 'markmap-interfaces';

const transform: ITransform = {
  x: 50,   // X 轴平移
  y: 100,  // Y 轴平移
  k: 1.5,  // 缩放比例（1.5 = 150%）
};
```

#### ILayoutResult

布局结果。

```typescript
import type { ILayoutResult, ILayoutNode, ILayoutLink } from 'markmap-interfaces';

const layoutResult: ILayoutResult = {
  nodes: [
    {
      id: '1',
      x: 0,
      y: 0,
      data: rootNode,
    },
    // ...
  ],
  links: [
    {
      source: node1,
      target: node2,
    },
    // ...
  ],
};
```

### 命令系统

#### ICommand

命令接口。

```typescript
import type { ICommand, IMarkmapAPI } from 'markmap-interfaces';

class ExpandAllCommand implements ICommand {
  id = 'expand-all';
  name = '展开所有节点';
  description = '展开思维导图中的所有节点';
  
  private previousState: any;

  execute(api: IMarkmapAPI): void {
    // 保存当前状态以支持撤销
    this.previousState = this.captureState(api);
    api.expandAll();
  }

  undo(api: IMarkmapAPI): void {
    // 恢复之前的状态
    this.restoreState(api, this.previousState);
  }

  canExecute(api: IMarkmapAPI): boolean {
    // 检查是否有折叠的节点
    return this.hasCollapsedNodes(api.getData());
  }

  private captureState(api: IMarkmapAPI): any {
    // 实现状态捕获逻辑
  }

  private restoreState(api: IMarkmapAPI, state: any): void {
    // 实现状态恢复逻辑
  }

  private hasCollapsedNodes(node: INode): boolean {
    // 实现检查逻辑
  }
}
```

#### ICommandManager

命令管理器接口。

```typescript
import type { ICommandManager, ICommand } from 'markmap-interfaces';

// 使用示例
const commandManager: ICommandManager = /* ... */;

// 注册命令
const expandAllCommand = new ExpandAllCommand();
commandManager.register(expandAllCommand);

// 执行命令
await commandManager.execute('expand-all');

// 撤销
await commandManager.undo();

// 重做
await commandManager.redo();

// 获取命令
const command = commandManager.getCommand('expand-all');

// 获取所有命令
const allCommands = commandManager.getAllCommands();

// 清空历史
commandManager.clearHistory();
```

## 完整示例

### 创建自定义 Markmap 实例

```typescript
import type {
  IMarkmapConfig,
  INoteProvider,
  IContextMenuProvider,
  IToolbarProvider,
  INode,
} from 'markmap-interfaces';

// 实现自定义 Provider
class MyNoteProvider implements INoteProvider {
  // ... 实现接口方法
}

class MyContextMenuProvider implements IContextMenuProvider {
  // ... 实现接口方法
}

class MyToolbarProvider implements IToolbarProvider {
  // ... 实现接口方法
}

// 配置 Markmap
const config: IMarkmapConfig = {
  svg: '#markmap',
  data: myData,
  
  // 注入自定义 Provider
  noteProvider: new MyNoteProvider(),
  contextMenuProvider: new MyContextMenuProvider(),
  toolbarProvider: new MyToolbarProvider(),
  
  // 配置渲染选项
  maxWidth: 300,
  spacingHorizontal: 80,
  duration: 500,
  
  // 事件回调
  onNodeClick: (node) => {
    console.log('Clicked:', node.content);
  },
  
  onError: (error) => {
    console.error('Markmap error:', error);
  },
};

// 创建 Markmap 实例（需要 markmap-view 包）
// const markmap = new Markmap(config);
```

## TypeScript 支持

所有接口都提供完整的 TypeScript 类型定义，支持：

- 类型检查
- 智能提示
- 接口实现验证
- 泛型支持

```typescript
import type { INode, IMarkmapAPI } from 'markmap-interfaces';

// TypeScript 会验证接口实现
class MyProvider implements INoteProvider {
  // 必须实现所有必需的方法
  renderNoteIcon(node: INode, container: HTMLElement, api: IMarkmapAPI): HTMLElement {
    // 实现
  }
  
  showNotePanel(node: INode, position: IPosition, api: IMarkmapAPI): void {
    // 实现
  }
  
  hideNotePanel(): void {
    // 实现
  }
  
  // 可选方法
  onNoteChange?(node: INode, note: string, api: IMarkmapAPI): void {
    // 实现
  }
}
```

## 相关包

- `markmap-core`: 核心渲染引擎实现
- `markmap-ui-default`: 默认 UI Provider 实现
- `markmap-view`: Markmap 主入口和兼容层
- `markmap-lib`: Markdown 解析和转换
- `markmap-common`: 共享工具和类型

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更多信息

- [API 文档](../../API_DOCUMENTATION.md)
- [自定义 UI 指南](../../CUSTOM_UI_GUIDE.md)
- [迁移指南](../../MIGRATION_GUIDE.md)
