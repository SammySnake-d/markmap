# markmap-ui-default

Markmap 的默认 UI 实现包，提供开箱即用的 UI 组件。

## 功能特性

- **备注系统** (`DefaultNoteProvider`): 显示和编辑节点备注
- **右键菜单** (`DefaultContextMenuProvider`): 节点和画布的上下文菜单
- **工具栏** (`DefaultToolbarProvider`): 常用操作工具栏

## 安装

```bash
pnpm add markmap-ui-default
```

## 使用方法

### 方式 1: 使用默认配置

最简单的方式，使用所有默认 UI 组件：

```typescript
import { Markmap } from 'markmap-view';
import { defaultUI } from 'markmap-ui-default';
import 'markmap-ui-default/style.css';

const markmap = new Markmap({
  svg: '#markmap',
  ...defaultUI
});
```

### 方式 2: 部分自定义

保留部分默认实现，自定义其他组件：

```typescript
import { createDefaultUI } from 'markmap-ui-default';
import { CustomContextMenuProvider } from './custom-providers';

const ui = createDefaultUI({
  contextMenuProvider: new CustomContextMenuProvider(),
  // noteProvider 和 toolbarProvider 使用默认实现
});

const markmap = new Markmap({
  svg: '#markmap',
  ...ui
});
```

### 方式 3: 完全自定义

单独导入和配置每个 Provider：

```typescript
import {
  DefaultNoteProvider,
  DefaultContextMenuProvider,
  DefaultToolbarProvider
} from 'markmap-ui-default';

const markmap = new Markmap({
  svg: '#markmap',
  noteProvider: new DefaultNoteProvider(),
  contextMenuProvider: new DefaultContextMenuProvider([
    // 自定义菜单项
    {
      id: 'custom-action',
      label: '自定义操作',
      icon: '⚡',
      action: (node, api) => {
        console.log('Custom action', node);
      }
    }
  ]),
  toolbarProvider: new DefaultToolbarProvider()
});
```

## API 文档

### DefaultNoteProvider

备注系统的默认实现。

**方法：**
- `renderNoteIcon(node, container, api)`: 渲染备注图标
- `showNotePanel(node, position, api)`: 显示备注面板
- `hideNotePanel()`: 隐藏备注面板
- `onNoteChange(node, note, api)`: 备注变化回调

### DefaultContextMenuProvider

右键菜单的默认实现。

**构造函数：**
```typescript
new DefaultContextMenuProvider(customItems?: IMenuItem[])
```

**方法：**
- `show(node, position, api)`: 显示菜单
- `hide()`: 隐藏菜单
- `render(items, node, api)`: 自定义渲染

### DefaultToolbarProvider

工具栏的默认实现。

**构造函数：**
```typescript
new DefaultToolbarProvider(customTools?: IToolItem[])
```

**方法：**
- `render(container, api)`: 渲染工具栏
- `updateToolState(toolId, state)`: 更新工具状态
- `destroy()`: 销毁工具栏

## 样式定制

可以通过 CSS 变量或覆盖样式来定制 UI 外观：

```css
/* 自定义备注面板样式 */
.markmap-note-panel {
  background: #f5f5f5;
  border-radius: 12px;
}

/* 自定义右键菜单样式 */
.markmap-context-menu {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

/* 自定义工具栏样式 */
.markmap-toolbar {
  background: linear-gradient(to right, #667eea, #764ba2);
}
```

## 许可证

MIT
