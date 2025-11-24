# Markmap 重构版 API 使用指南

## 概述

重构后的 Markmap 采用了模块化架构，将核心功能、视图渲染和 UI 组件分离。本指南介绍如何正确使用新的 API。

## 核心概念

### 1. 架构层次

```
markmap-view (视图层)
    ↓
markmap-core (核心层)
    ↓
markmap-common (通用层)
```

### 2. 主要组件

- **Markmap**: 主视图类，负责渲染和交互
- **MarkmapCore**: 核心渲染引擎
- **MarkmapAPI**: 统一的 API 接口
- **EventEmitter**: 事件系统
- **DIContainer**: 依赖注入容器

## 基本使用

### 初始化

```javascript
// 1. 导入库
const { Transformer, Markmap } = window.markmap;

// 2. 解析 Markdown
const transformer = new Transformer();
const { root } = transformer.transform('# 标题\n## 子标题');

// 3. 创建 Markmap 实例
const svg = document.querySelector('#mindmap');
const view = Markmap.create(svg, {
  duration: 500,
  maxWidth: 300,
  initialExpandLevel: 3
});

// 4. 设置数据
await view.setData(root);
```

## API 参考

### 数据管理

#### 访问当前数据
```javascript
// ✅ 正确
const data = view.state.data;

// ❌ 错误 - 没有 getData() 方法
const data = view.getData();
```

#### 设置数据
```javascript
await view.setData(root);
```

#### Markdown 内容管理
```javascript
// 设置内容
view.setMarkdownContent('# 新内容');

// 获取内容
const content = view.getMarkdownContent();
```

### 视图控制

#### 适应视图
```javascript
await view.fit();
```

#### 缩放
```javascript
// 缩放到 1.2 倍
await view.rescale(1.2);

// 恢复原始大小
await view.rescale(1.0);
```

#### 确保节点可见
```javascript
await view.ensureVisible(node);
```

#### 居中节点
```javascript
await view.centerNode(node);
```

#### 自动调整视口
```javascript
await view.adjustViewportIfNeeded();
```

### 节点操作

#### 切换节点折叠状态
```javascript
view.toggleNode(node);
```

#### 展开所有节点
```javascript
if (view.state.data) {
  view.expandAll(view.state.data);
}
```

#### 折叠所有节点
```javascript
if (view.state.data) {
  view.collapseAll(view.state.data);
}
```

### 导出功能

**注意**: 导出功能统一由 `markmap-view` 提供，`markmap-core` 不再提供导出方法。

#### 导出为 Markdown
```javascript
// 导出整个思维导图
const markdown = view.exportAsMarkdown();

// 导出特定节点
const markdown = view.exportAsMarkdown(node);
```

#### 导出为 SVG
```javascript
const svgString = view.exportAsSVG();
```

#### 导出为 PNG
```javascript
const pngBlob = await view.exportAsPNG();
```

#### 下载为 SVG
```javascript
view.downloadAsSVG('mindmap.svg');
```

### 配置和样式

#### 设置选项
```javascript
view.setOptions({
  duration: 300,
  maxWidth: 400,
  paddingX: 100
});
```

#### 应用配色方案
```javascript
const colorFn = (node) => {
  // 安全检查：node 可能为 undefined
  if (!node) return '#5e6ad2';
  
  const colors = ['#5e6ad2', '#26b5ce', '#f9c52a', '#f98e52', '#e55e5e'];
  // 注意：使用 node.state.depth 或 node.depth
  const depth = node.state?.depth ?? node.depth ?? 0;
  return colors[depth % colors.length];
};

view.applyColorSchemeWithAnimation(colorFn);
```

### 事件系统

#### 监听事件

```javascript
// ✅ 正确 - 通过 EventEmitter
const emitter = view.getEventEmitter();

emitter.on('node:click', (node) => {
  console.log('节点被点击:', node);
});

emitter.on('data:load', () => {
  console.log('数据已加载');
});

emitter.on('view:fit', () => {
  console.log('视图已适应');
});

// ❌ 错误 - Markmap 实例没有 on 方法
view.on('node:click', handler); // 这不会工作
```

#### 可用事件列表

- `node:click` - 节点被点击
- `node:rightclick` - 节点被右键点击
- `data:load` - 数据加载完成
- `view:fit` - 视图适应完成
- `view:transform` - 视图变换（缩放/平移）
- `note:change` - 备注内容变化
- `search:result` - 搜索结果

#### 发射自定义事件

```javascript
const emitter = view.getEventEmitter();
emitter.emit('custom:event', data);
```

### 依赖注入

#### 获取 DI 容器
```javascript
const container = view.getContainer();
```

#### 注册服务
```javascript
container.register('myService', myServiceInstance, ServiceLifetime.Singleton);
```

#### 解析服务
```javascript
const service = container.resolve('myService');
```

### 生命周期

#### 销毁实例
```javascript
view.destroy();
```

## 常见错误和解决方案

### 错误 1: `view.getData is not a function`

**原因**: 新架构中没有 `getData()` 方法

**解决方案**:
```javascript
// ❌ 错误
const data = view.getData();

// ✅ 正确
const data = view.state.data;
```

### 错误 2: `view.on is not a function`

**原因**: Markmap 实例没有直接的 `on` 方法

**解决方案**:
```javascript
// ❌ 错误
view.on('node:click', handler);

// ✅ 正确
const emitter = view.getEventEmitter();
emitter.on('node:click', handler);
```

### 错误 3: `Cannot read properties of undefined (reading 'depth')` 或 `Cannot read properties of undefined (reading 'state')`

**原因**: 
1. 节点结构中 `depth` 可能在 `state` 对象中
2. 在某些情况下，传递给回调函数的 `node` 可能为 `undefined`

**解决方案**:
```javascript
// ❌ 可能出错
const depth = node.depth;
const depth = node.state.depth;

// ✅ 安全访问 - 添加 node 检查
const colorFn = (node) => {
  if (!node) return '#5e6ad2'; // 默认颜色
  const depth = node.state?.depth ?? node.depth ?? 0;
  return colors[depth % colors.length];
};
```

### 错误 4: `view.setData is not a function`

**原因**: 可能是异步问题或实例未正确创建

**解决方案**:
```javascript
// 确保使用 await
await view.setData(root);

// 或使用 Promise
view.setData(root).then(() => {
  console.log('数据已设置');
});
```

## 完整示例

### 基础示例

```javascript
// 初始化
const { Transformer, Markmap } = window.markmap;
const transformer = new Transformer();
const { root } = transformer.transform(`
# 我的思维导图
## 第一章
- 内容 A
- 内容 B
## 第二章
- 内容 C
`);

const svg = document.querySelector('#mindmap');
const view = Markmap.create(svg, {
  duration: 500,
  maxWidth: 300,
  initialExpandLevel: 3,
  paddingX: 80,
  spacingHorizontal: 80,
  spacingVertical: 20,
  autoFit: true,
  fitRatio: 0.95
});

await view.setData(root);

// 监听事件
const emitter = view.getEventEmitter();
emitter.on('node:click', (node) => {
  console.log('点击了:', node.content);
});

// 适应视图
await view.fit();
```

### 高级示例：自定义配色和交互

```javascript
// 创建实例
const view = Markmap.create(svg);
await view.setData(root);

// 应用自定义配色
const colorFn = (node) => {
  if (!node) return '#5e6ad2'; // 安全检查
  const depth = node.state?.depth ?? node.depth ?? 0;
  const colors = {
    0: '#5e6ad2', // 根节点
    1: '#26b5ce', // 一级节点
    2: '#f9c52a', // 二级节点
    3: '#f98e52', // 三级节点
  };
  return colors[depth] || '#e55e5e';
};
view.applyColorSchemeWithAnimation(colorFn);

// 监听多个事件
const emitter = view.getEventEmitter();

emitter.on('node:click', (node) => {
  // 点击节点时居中显示
  view.centerNode(node);
});

emitter.on('node:rightclick', (node, position) => {
  // 右键点击时显示自定义菜单
  showCustomMenu(node, position);
});

emitter.on('view:transform', () => {
  // 视图变换时保存状态
  saveViewState();
});

// 添加工具栏按钮
document.getElementById('btn-expand-all').addEventListener('click', () => {
  if (view.state.data) {
    view.expandAll(view.state.data);
  }
});

document.getElementById('btn-collapse-all').addEventListener('click', () => {
  if (view.state.data) {
    view.collapseAll(view.state.data);
  }
});

document.getElementById('btn-export').addEventListener('click', () => {
  const markdown = view.exportAsMarkdown();
  downloadFile(markdown, 'mindmap.md');
});
```

## 迁移指南

如果你正在从旧版本迁移，请参考 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)。

## 更多资源

- [API 文档](./packages/markmap-core/API_DOCUMENTATION.md)
- [自定义 UI 指南](./packages/markmap-core/CUSTOM_UI_GUIDE.md)
- [测试示例](./demo-api-test.html)

## 支持

如果遇到问题，请：
1. 查看本指南的"常见错误和解决方案"部分
2. 查看浏览器控制台的错误信息
3. 运行 API 测试套件 (demo-api-test.html) 来诊断问题
