# Markmap 迁移指南

## 概述

本指南帮助您从旧版本的 Markmap 迁移到新的开放式架构版本。新架构提供了更好的可扩展性和自定义能力，同时保持向后兼容性。

## 架构变化

### 旧架构

```
markmap-view (单一包)
├── 核心渲染
├── UI 组件（备注、菜单、工具栏）
└── 所有功能耦合在一起
```

### 新架构

```
markmap-interfaces (接口定义)
├── markmap-core (核心引擎)
│   ├── 渲染引擎
│   ├── 功能 API
│   ├── 事件系统
│   ├── 依赖注入
│   └── 命令管理
├── markmap-ui-default (默认 UI)
│   └── 默认 Provider 实现
└── markmap-view (主入口 + 兼容层)
    └── 向后兼容 API
```

## 迁移步骤

### 步骤 1：更新依赖

#### 旧版本

```json
{
  "dependencies": {
    "markmap-view": "^0.x.x"
  }
}
```

#### 新版本

```json
{
  "dependencies": {
    "markmap-view": "^2.0.0",
    "markmap-core": "^0.1.0",
    "markmap-interfaces": "^0.1.0"
  }
}
```

如果您想使用默认 UI：

```json
{
  "dependencies": {
    "markmap-view": "^2.0.0",
    "markmap-core": "^0.1.0",
    "markmap-interfaces": "^0.1.0",
    "markmap-ui-default": "^0.1.0"
  }
}
```

### 步骤 2：更新导入语句

#### 旧版本

```typescript
import { Markmap } from 'markmap-view';
```

#### 新版本（向后兼容）

```typescript
// 方式 1：使用兼容层（推荐用于快速迁移）
import { Markmap } from 'markmap-view';

// 方式 2：使用新 API（推荐用于新项目）
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';
```

### 步骤 3：更新初始化代码

#### 旧版本

```typescript
const svg = document.querySelector('#markmap');
const mm = Markmap.create(svg, {
  maxWidth: 300,
  duration: 500
});

mm.setData(data);
```

#### 新版本（向后兼容）

```typescript
// 完全相同的代码，无需修改！
const svg = document.querySelector('#markmap');
const mm = Markmap.create(svg, {
  maxWidth: 300,
  duration: 500
});

mm.setData(data);
```

#### 新版本（使用新 API）

```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg, {
  maxWidth: 300,
  duration: 500
});

const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

api.setData(data);
```

## API 变化

### 保持不变的 API

以下 API 在新版本中保持完全兼容：

```typescript
// 数据操作
mm.setData(data);
mm.getData();

// 视图控制
mm.fit();

// 节点操作
mm.toggleNode(nodeId);
mm.expandAll();
mm.collapseAll();
```

### 新增的 API

新版本添加了以下 API：

```typescript
// 导出功能
const markdown = api.exportAsMarkdown();
const svg = api.exportAsSVG();
const png = await api.exportAsPNG();

// 搜索功能
const results = api.search('keyword');
api.highlightNode(nodeId);
api.clearHighlight();

// 视图控制
api.centerNode(nodeId);
api.ensureVisible(nodeId);

// 节点更新
api.updateNode(nodeId, { content: 'New Content' });
```

### 配置选项变化

#### 旧版本

```typescript
const options = {
  maxWidth: 300,
  paddingX: 8,
  duration: 500,
  // ... 其他选项
};
```

#### 新版本

```typescript
// 所有旧选项仍然支持
const options = {
  maxWidth: 300,
  paddingX: 8,
  duration: 500,
  
  // 新增选项
  autoFit: true,
  initialExpandLevel: 2,
  
  // 自定义 Provider（可选）
  noteProvider: new CustomNoteProvider(),
  contextMenuProvider: new CustomContextMenuProvider(),
  toolbarProvider: new CustomToolbarProvider()
};
```

## 自定义 UI 迁移

### 旧版本（修改源代码）

在旧版本中，自定义 UI 需要修改 markmap-view 的源代码或使用 fork。

### 新版本（使用 Provider）

```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter, DIContainer } from 'markmap-core';
import type { INoteProvider } from 'markmap-interfaces';

// 1. 实现自定义 Provider
class MyCustomNoteProvider implements INoteProvider {
  renderNoteIcon(node, container) {
    const icon = document.createElement('span');
    icon.textContent = '📝';
    // 自定义样式和行为
    return icon;
  }
  
  showNotePanel(node, position) {
    // 自定义面板实现
  }
  
  hideNotePanel() {
    // 隐藏面板
  }
}

// 2. 注册 Provider
const container = new DIContainer();
const noteProvider = new MyCustomNoteProvider();
container.register('noteProvider', noteProvider);

// 3. 使用自定义 Provider
const core = new MarkmapCore(svg);
const api = new MarkmapAPI(core, new EventEmitter());
```

## 事件系统迁移

### 旧版本

```typescript
// 旧版本可能使用回调函数
const mm = Markmap.create(svg, {
  onClick: (node) => {
    console.log('节点被点击:', node);
  }
});
```

### 新版本

```typescript
// 使用事件系统
const eventEmitter = new EventEmitter();

eventEmitter.on('node:click', (node) => {
  console.log('节点被点击:', node);
});

eventEmitter.on('data:change', (data) => {
  console.log('数据已更新');
});

const api = new MarkmapAPI(core, eventEmitter);
```

## 常见问题

### Q1: 我的旧代码还能用吗？

**A**: 是的！新版本提供了完整的向后兼容层。您的旧代码无需修改即可运行。

```typescript
// 这段旧代码仍然有效
const mm = Markmap.create(svg);
mm.setData(data);
mm.fit();
```

### Q2: 我应该立即迁移到新 API 吗？

**A**: 不是必须的。您可以：
- 继续使用旧 API（通过兼容层）
- 逐步迁移到新 API
- 新功能使用新 API，旧代码保持不变

### Q3: 包大小会增加吗？

**A**: 不会。新架构支持按需导入：
- 只使用核心功能：`markmap-core` (~12KB gzipped)
- 使用默认 UI：`markmap-core` + `markmap-ui-default`
- 使用兼容层：`markmap-view`（包含所有功能）

### Q4: 性能会受影响吗？

**A**: 不会。新架构的性能与旧版本相当或更好：
- 核心渲染引擎经过优化
- 事件系统更高效
- 支持按需加载

### Q5: 如何自定义 UI？

**A**: 实现相应的 Provider 接口：

```typescript
// 实现 INoteProvider
class MyNoteProvider implements INoteProvider {
  // 实现接口方法
}

// 注册并使用
container.register('noteProvider', new MyNoteProvider());
```

详见 [自定义 UI 指南](./CUSTOM_UI_GUIDE.md)。

## 破坏性变更

### 无破坏性变更

新版本 2.0.0 **没有破坏性变更**。所有旧 API 都通过兼容层保持支持。

### 废弃的 API

以下 API 已废弃但仍然可用（会显示警告）：

```typescript
// 废弃：使用 mm.setData() 替代
mm.render(data); // 仍然有效，但建议使用 setData()
```

## 迁移检查清单

- [ ] 更新 package.json 中的依赖版本
- [ ] 运行 `npm install` 或 `pnpm install`
- [ ] 运行现有测试，确保全部通过
- [ ] 检查控制台是否有废弃警告
- [ ] （可选）逐步迁移到新 API
- [ ] （可选）实现自定义 Provider
- [ ] 更新文档和示例

## 迁移示例

### 示例 1：基础使用（无需修改）

#### 旧代码

```typescript
import { Markmap } from 'markmap-view';

const svg = document.querySelector('#markmap');
const mm = Markmap.create(svg);

const data = {
  type: 'heading',
  depth: 0,
  content: 'Root',
  children: []
};

mm.setData(data);
mm.fit();
```

#### 新代码（完全相同）

```typescript
import { Markmap } from 'markmap-view';

const svg = document.querySelector('#markmap');
const mm = Markmap.create(svg);

const data = {
  type: 'heading',
  depth: 0,
  content: 'Root',
  children: []
};

mm.setData(data);
mm.fit();
```

### 示例 2：使用新 API

```typescript
import { MarkmapCore, MarkmapAPI, EventEmitter } from 'markmap-core';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg, {
  maxWidth: 300,
  duration: 500
});

const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

// 监听事件
eventEmitter.on('data:change', () => {
  console.log('数据已更新');
});

// 加载数据
api.setData(data);

// 使用新功能
const markdown = api.exportAsMarkdown();
const results = api.search('keyword');
```

### 示例 3：自定义 UI

```typescript
import { 
  MarkmapCore, 
  MarkmapAPI, 
  EventEmitter, 
  DIContainer 
} from 'markmap-core';
import { DefaultNoteProvider } from 'markmap-ui-default';

const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

// 使用依赖注入
const container = new DIContainer();
container.register('api', api);

// 使用默认备注 Provider
const noteProvider = new DefaultNoteProvider();
container.register('noteProvider', noteProvider);

// 或使用自定义 Provider
class MyNoteProvider implements INoteProvider {
  // 自定义实现
}
container.register('noteProvider', new MyNoteProvider());

api.setData(data);
```

## 获取帮助

如果您在迁移过程中遇到问题：

1. 查看 [API 文档](./API_DOCUMENTATION.md)
2. 查看 [自定义 UI 指南](./CUSTOM_UI_GUIDE.md)
3. 查看 [示例代码](./examples/)
4. 在 GitHub 上提交 Issue

## 总结

新版本的 Markmap 提供了：

✅ **完全向后兼容** - 旧代码无需修改
✅ **更好的可扩展性** - 通过 Provider 系统自定义 UI
✅ **更清晰的架构** - 核心与 UI 分离
✅ **更多功能** - 导出、搜索、命令系统等
✅ **更好的性能** - 优化的渲染引擎
✅ **更小的包体积** - 支持按需导入

我们建议：
- 现有项目：继续使用兼容层，逐步迁移
- 新项目：直接使用新 API
- 需要自定义 UI：实现 Provider 接口

欢迎升级到新版本！
