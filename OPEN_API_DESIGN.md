# Markmap 开放式 API 架构设计

## 🎯 设计理念

### 核心原则

1. **关注点分离**: 核心渲染 vs UI组件
2. **开放封闭**: 核心稳定,UI可扩展
3. **依赖注入**: 用户提供UI实现
4. **事件驱动**: 通过事件连接功能和UI

### 架构分层

```
┌─────────────────────────────────────┐
│     用户自定义 UI 层                  │
│  (备注面板、右键菜单、工具栏等)        │
└─────────────────────────────────────┘
              ↕ (事件/回调)
┌─────────────────────────────────────┐
│     Markmap 功能 API 层              │
│  (数据操作、视图控制、导出等)          │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│     Markmap 核心渲染层               │
│  (节点布局、连线绘制、动画)            │
└─────────────────────────────────────┘
```

---

## 📦 核心 API (Markmap Core)

### 1. 渲染引擎 (不可替换)

```typescript
interface MarkmapCore {
  // 数据渲染
  renderData(data: INode): void;
  
  // 布局计算
  calculateLayout(): void;
  
  // 动画系统
  transition(selection: any): any;
  
  // 视图变换
  applyTransform(transform: Transform): void;
}
```

### 2. 功能 API (开放调用)

```typescript
interface MarkmapAPI {
  // 数据操作
  setData(data: INode): void;
  getData(): INode;
  updateNode(node: INode, data: Partial<INode>): void;
  
  // 视图控制
  fit(maxScale?: number): void;
  centerNode(node: INode): void;
  ensureVisible(node: INode): void;
  
  // 节点操作
  toggleNode(node: INode, recursive?: boolean): void;
  expandAll(node?: INode): void;
  collapseAll(node?: INode): void;
  
  // 导出功能
  exportAsMarkdown(node?: INode): string;
  exportAsSVG(): string;
  exportAsPNG(): Promise<Blob>;
  exportAsJPG(): Promise<Blob>;
  
  // 搜索功能
  search(query: string): INode[];
  highlightNode(node: INode): void;
  clearHighlight(): void;
}
```

---

## 🎨 UI 组件接口 (用户可自定义)

### 1. 备注系统接口

```typescript
interface INoteProvider {
  // 渲染备注图标
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement;
  
  // 显示备注面板
  showNotePanel(node: INode, x: number, y: number): void;
  
  // 隐藏备注面板
  hideNotePanel(): void;
  
  // 备注变化回调
  onNoteChange?: (node: INode, note: string) => void;
}

// 用户自定义实现
class CustomNoteProvider implements INoteProvider {
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement {
    // 用户自定义图标样式
    const icon = document.createElement('span');
    icon.className = 'my-custom-note-icon';
    icon.innerHTML = '💡'; // 用户选择的图标
    icon.style.cssText = 'color: blue; font-size: 20px;'; // 自定义样式
    return icon;
  }
  
  showNotePanel(node: INode, x: number, y: number): void {
    // 用户自定义面板实现
    const panel = document.createElement('div');
    panel.className = 'my-custom-note-panel';
    // ... 用户的面板逻辑
  }
}
```

### 2. 右键菜单接口

```typescript
interface IContextMenuProvider {
  // 菜单项定义
  items: IMenuItem[];
  
  // 显示菜单
  show(node: INode | null, x: number, y: number): void;
  
  // 隐藏菜单
  hide(): void;
  
  // 自定义渲染
  render(items: IMenuItem[]): HTMLElement;
}

interface IMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: (node: INode | null, api: MarkmapAPI) => void;
  separator?: boolean;
  disabled?: boolean;
  children?: IMenuItem[];
}

// 用户自定义实现
class CustomContextMenu implements IContextMenuProvider {
  items: IMenuItem[] = [
    {
      id: 'copy',
      label: '复制为 Markdown',
      icon: '📋',
      action: (node, api) => {
        const md = api.exportAsMarkdown(node);
        navigator.clipboard.writeText(md);
      }
    },
    {
      id: 'expand',
      label: '展开全部',
      icon: '➕',
      action: (node, api) => {
        api.expandAll(node);
      }
    },
    {
      id: 'collapse',
      label: '折叠全部',
      icon: '➖',
      action: (node, api) => {
        api.collapseAll(node);
      }
    },
    {
      separator: true
    },
    {
      id: 'export',
      label: '导出',
      icon: '💾',
      children: [
        {
          id: 'export-png',
          label: '导出为 PNG',
          action: (node, api) => {
            api.exportAsPNG().then(blob => {
              // 下载逻辑
            });
          }
        },
        {
          id: 'export-svg',
          label: '导出为 SVG',
          action: (node, api) => {
            const svg = api.exportAsSVG();
            // 下载逻辑
          }
        }
      ]
    }
  ];
  
  render(items: IMenuItem[]): HTMLElement {
    // 用户自定义菜单样式
    const menu = document.createElement('div');
    menu.className = 'my-custom-context-menu';
    menu.style.cssText = `
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px 0;
    `;
    
    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 1px; background: #eee; margin: 4px 0;';
        menu.appendChild(sep);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `${item.icon || ''} ${item.label}`;
        menuItem.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.2s;
        `;
        menuItem.onmouseenter = () => {
          menuItem.style.background = '#f5f5f5';
        };
        menuItem.onmouseleave = () => {
          menuItem.style.background = 'transparent';
        };
        menu.appendChild(menuItem);
      }
    });
    
    return menu;
  }
  
  show(node: INode | null, x: number, y: number): void {
    const menu = this.render(this.items);
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.zIndex = '10000';
    document.body.appendChild(menu);
  }
  
  hide(): void {
    // 隐藏逻辑
  }
}
```

### 3. 工具栏接口

```typescript
interface IToolbarProvider {
  // 工具项定义
  tools: IToolItem[];
  
  // 渲染工具栏
  render(container: HTMLElement): void;
  
  // 更新工具状态
  updateToolState(toolId: string, state: any): void;
}

interface IToolItem {
  id: string;
  label: string;
  icon?: string;
  action: (api: MarkmapAPI) => void;
  type?: 'button' | 'dropdown' | 'toggle';
  options?: any[];
}

// 用户自定义实现
class CustomToolbar implements IToolbarProvider {
  tools: IToolItem[] = [
    {
      id: 'fit',
      label: '适应视图',
      icon: '🎯',
      type: 'button',
      action: (api) => api.fit()
    },
    {
      id: 'search',
      label: '搜索',
      icon: '🔍',
      type: 'button',
      action: (api) => {
        // 显示搜索框
      }
    },
    {
      id: 'color-scheme',
      label: '颜色方案',
      icon: '🎨',
      type: 'dropdown',
      options: ['default', 'ocean', 'forest'],
      action: (api) => {
        // 切换颜色
      }
    }
  ];
  
  render(container: HTMLElement): void {
    // 用户自定义工具栏样式
  }
}
```

---

## 🔌 依赖注入模式

### 初始化配置

```typescript
interface MarkmapConfig {
  // 核心配置
  svg: string | SVGElement;
  data?: INode;
  
  // 渲染配置
  maxWidth?: number;
  paddingX?: number;
  spacingHorizontal?: number;
  spacingVertical?: number;
  duration?: number;
  
  // UI 提供者 (可选,用户自定义)
  noteProvider?: INoteProvider;
  contextMenuProvider?: IContextMenuProvider;
  toolbarProvider?: IToolbarProvider;
  searchProvider?: ISearchProvider;
  
  // 事件回调
  onNodeClick?: (node: INode) => void;
  onNodeRightClick?: (node: INode, x: number, y: number) => void;
  onDataChange?: (data: INode) => void;
}

// 使用示例
const mm = new Markmap({
  svg: '#mindmap',
  
  // 注入自定义 UI 组件
  noteProvider: new CustomNoteProvider(),
  contextMenuProvider: new CustomContextMenu(),
  toolbarProvider: new CustomToolbar(),
  
  // 或使用默认实现
  // noteProvider: new DefaultNoteProvider(),
  // contextMenuProvider: new DefaultContextMenu(),
  
  // 事件回调
  onNodeRightClick: (node, x, y) => {
    // 用户可以完全自定义右键行为
    if (mm.contextMenuProvider) {
      mm.contextMenuProvider.show(node, x, y);
    }
  }
});
```

---

## 🎭 默认实现 (可选包)

### 包结构

```
markmap/
├── markmap-core/          # 核心渲染引擎 (必需)
├── markmap-api/           # 功能 API (必需)
├── markmap-ui-default/    # 默认 UI 组件 (可选)
│   ├── DefaultNoteProvider
│   ├── DefaultContextMenu
│   ├── DefaultToolbar
│   └── DefaultSearchPanel
└── markmap-ui-material/   # Material Design UI (可选)
    ├── MaterialNoteProvider
    ├── MaterialContextMenu
    └── MaterialToolbar
```

### 使用方式

```typescript
// 方式1: 使用默认 UI
import { Markmap } from 'markmap-core';
import { DefaultNoteProvider, DefaultContextMenu } from 'markmap-ui-default';

const mm = new Markmap({
  svg: '#mindmap',
  noteProvider: new DefaultNoteProvider(),
  contextMenuProvider: new DefaultContextMenu()
});

// 方式2: 完全自定义 UI
import { Markmap } from 'markmap-core';

const mm = new Markmap({
  svg: '#mindmap',
  noteProvider: new MyCustomNoteProvider(),
  contextMenuProvider: new MyCustomContextMenu()
});

// 方式3: 不使用任何 UI 组件,只用核心功能
import { Markmap } from 'markmap-core';

const mm = new Markmap({
  svg: '#mindmap'
  // 不注入任何 UI 组件
});

// 通过 API 手动控制
mm.api.expandAll();
mm.api.fit();
```

---

## 🔗 功能与 UI 的连接

### 事件系统

```typescript
interface MarkmapEvents {
  // 节点事件
  'node:click': (node: INode) => void;
  'node:rightclick': (node: INode, x: number, y: number) => void;
  'node:hover': (node: INode) => void;
  'node:toggle': (node: INode, expanded: boolean) => void;
  
  // 数据事件
  'data:change': (data: INode) => void;
  'data:load': (data: INode) => void;
  
  // 视图事件
  'view:transform': (transform: Transform) => void;
  'view:fit': () => void;
  
  // 搜索事件
  'search:query': (query: string) => void;
  'search:result': (results: INode[]) => void;
}

// 用户订阅事件
mm.on('node:rightclick', (node, x, y) => {
  // 显示自定义右键菜单
  myCustomMenu.show(node, x, y);
});

mm.on('node:click', (node) => {
  // 自定义点击行为
  console.log('Clicked:', node.content);
});
```

### 命令模式

```typescript
interface ICommand {
  execute(api: MarkmapAPI, ...args: any[]): void;
  undo?(api: MarkmapAPI): void;
}

// 用户定义命令
class CopyMarkdownCommand implements ICommand {
  execute(api: MarkmapAPI, node?: INode): void {
    const md = api.exportAsMarkdown(node);
    navigator.clipboard.writeText(md);
  }
}

class ExpandAllCommand implements ICommand {
  private previousState: any;
  
  execute(api: MarkmapAPI, node?: INode): void {
    this.previousState = api.getData();
    api.expandAll(node);
  }
  
  undo(api: MarkmapAPI): void {
    api.setData(this.previousState);
  }
}

// 注册命令
mm.registerCommand('copy-markdown', new CopyMarkdownCommand());
mm.registerCommand('expand-all', new ExpandAllCommand());

// 在 UI 中调用
menuItem.onclick = () => {
  mm.executeCommand('copy-markdown', node);
};
```

---

## 📝 完整示例

### 示例1: 使用默认 UI

```typescript
import { Markmap } from 'markmap-core';
import { DefaultUI } from 'markmap-ui-default';

const mm = new Markmap({
  svg: '#mindmap',
  ...DefaultUI // 使用所有默认 UI 组件
});

mm.setData(root);
```

### 示例2: 部分自定义

```typescript
import { Markmap } from 'markmap-core';
import { DefaultContextMenu, DefaultToolbar } from 'markmap-ui-default';

const mm = new Markmap({
  svg: '#mindmap',
  
  // 使用默认右键菜单
  contextMenuProvider: new DefaultContextMenu(),
  
  // 使用默认工具栏
  toolbarProvider: new DefaultToolbar(),
  
  // 自定义备注系统
  noteProvider: {
    renderNoteIcon: (node, container) => {
      const icon = document.createElement('i');
      icon.className = 'fas fa-sticky-note'; // Font Awesome 图标
      icon.style.color = '#ff6b6b';
      return icon;
    },
    showNotePanel: (node, x, y) => {
      // 使用 Bootstrap Modal
      $('#noteModal').modal('show');
    }
  }
});
```

### 示例3: 完全自定义

```typescript
import { Markmap } from 'markmap-core';

// 自定义右键菜单
class MyContextMenu {
  show(node, x, y) {
    const menu = document.createElement('div');
    menu.innerHTML = `
      <div class="my-menu">
        <button onclick="copyMarkdown()">📋 复制</button>
        <button onclick="expandAll()">➕ 展开</button>
        <button onclick="exportPNG()">💾 导出</button>
      </div>
    `;
    menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(menu);
  }
}

const mm = new Markmap({
  svg: '#mindmap',
  contextMenuProvider: new MyContextMenu(),
  
  // 连接功能
  onNodeRightClick: (node, x, y) => {
    window.copyMarkdown = () => {
      const md = mm.api.exportAsMarkdown(node);
      navigator.clipboard.writeText(md);
    };
    
    window.expandAll = () => {
      mm.api.expandAll(node);
    };
    
    window.exportPNG = async () => {
      const blob = await mm.api.exportAsPNG();
      // 下载逻辑
    };
    
    mm.contextMenuProvider.show(node, x, y);
  }
});
```

---

## 🎯 优势总结

### ✅ 对用户的好处

1. **完全控制 UI**: 样式、布局、交互完全自定义
2. **灵活集成**: 可以集成任何 UI 框架 (React, Vue, Bootstrap, Material-UI)
3. **按需加载**: 只加载需要的组件,减小包体积
4. **品牌一致性**: UI 可以完全符合自己的设计系统
5. **功能扩展**: 可以添加自定义功能项

### ✅ 对开发者的好处

1. **关注点分离**: 核心渲染和 UI 解耦
2. **易于维护**: 核心稳定,UI 可以独立演进
3. **易于测试**: 核心功能可以独立测试
4. **社区贡献**: 社区可以贡献不同的 UI 实现

---

## 🚀 迁移路径

### 当前架构 → 开放架构

```typescript
// 当前 (封闭)
const mm = Markmap.create(svg, options);
// 备注图标、右键菜单都是内置的,无法自定义

// 未来 (开放)
const mm = new Markmap({
  svg,
  ...options,
  
  // 可选:使用默认 UI
  ...DefaultUI,
  
  // 或:完全自定义
  noteProvider: new MyNoteProvider(),
  contextMenuProvider: new MyContextMenu()
});
```

### 向后兼容

```typescript
// 提供兼容层
Markmap.create = (svg, options) => {
  return new Markmap({
    svg,
    ...options,
    ...DefaultUI // 默认使用原有 UI
  });
};
```

---

## 📋 实施建议

### 阶段1: 接口定义
- 定义所有 UI 组件接口
- 定义事件系统
- 定义命令模式

### 阶段2: 核心重构
- 分离核心渲染和 UI 逻辑
- 实现依赖注入
- 实现事件系统

### 阶段3: 默认实现
- 将现有 UI 改造为默认实现
- 创建 markmap-ui-default 包
- 保持向后兼容

### 阶段4: 文档和示例
- 编写自定义 UI 指南
- 提供多个示例实现
- 创建 UI 组件模板

这样的架构设计让 Markmap 真正成为一个**可扩展的思维导图引擎**,而不仅仅是一个固定的组件! 🎉
