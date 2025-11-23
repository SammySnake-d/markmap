# Markmap Enhanced API 文档

## 📚 目录

- [初始化选项](#初始化选项)
- [实例方法](#实例方法)
- [颜色管理](#颜色管理)
- [备注系统](#备注系统)
- [样式自定义](#样式自定义)
- [回调函数](#回调函数)
- [导出功能](#导出功能)

---

## 初始化选项

### 基础配置

```typescript
const mm = Markmap.create(svg, {
  // 布局配置
  maxWidth: 300,              // 节点最大宽度 (0 = 无限制)
  nodeMinHeight: 16,          // 节点最小高度
  paddingX: 8,                // 节点水平内边距
  spacingHorizontal: 80,      // 节点水平间距
  spacingVertical: 5,         // 节点垂直间距
  
  // 动画配置
  duration: 250,              // 动画持续时间(毫秒)
  
  // 视图配置
  autoFit: false,             // 是否自动适应视图
  fitRatio: 0.95,             // 适应视图的缩放比例
  maxInitialScale: 2,         // 初始最大缩放比例
  initialExpandLevel: -1,     // 初始展开层级 (-1 = 全部展开)
  
  // 交互配置
  zoom: true,                 // 启用缩放
  pan: true,                  // 启用平移
  scrollForPan: false,        // 使用滚轮平移(Mac默认true)
  toggleRecursively: false,   // 递归切换子节点
  
  // 移动端支持
  enableTouch: true,          // 启用触摸手势
  
  // 数据持久化
  enableAutoSave: false,      // 启用自动保存
  storageKey: 'markmap-data', // localStorage键名
  
  // 样式配置
  embedGlobalCSS: true,       // 嵌入全局CSS
  id: 'my-markmap',          // 自定义ID
  
  // 颜色配置
  color: (node) => string,    // 节点颜色函数
  lineWidth: (node) => number,// 连线宽度函数
  
  // 回调函数
  onNodeClick: (node) => void,        // 节点点击回调
  onMarkdownChange: (md) => void,     // Markdown变化回调
  onNoteEdit: (node, note) => void,   // 备注编辑回调
});
```

---

## 实例方法

### 数据操作

```typescript
// 设置数据
mm.setData(root, options?);

// 更新数据
mm.renderData(originData?);

// 获取当前数据
const data = mm.state.data;
```

### 视图控制

```typescript
// 适应视图
mm.fit(maxScale?);

// 确保节点可见
mm.ensureVisible(node, padding?);

// 居中节点
mm.centerNode(node, padding?);

// 缩放
mm.rescale(scale);

// 调整视口(当内容超出时)
mm.adjustViewportIfNeeded();
```

### 节点操作

```typescript
// 切换节点展开/折叠
mm.toggleNode(node, recursive?);

// 展开所有节点
mm.expandAll(node?);

// 折叠所有节点
mm.collapseAll(node?);

// 查找节点元素
mm.findElement(node);

// 设置高亮节点
mm.setHighlight(node?);
```

### 导出功能

```typescript
// 导出为 Markdown
const markdown = mm.exportAsMarkdown(node?);

// 导出为 SVG
const svgString = mm.exportAsSVG();

// 导出为 PNG
const pngBlob = await mm.exportAsPNG();

// 导出为 JPG
const jpgBlob = await mm.exportAsJPG();

// 下载图片
mm.downloadAsPNG(filename?);
mm.downloadAsJPG(filename?);
mm.downloadAsSVG(filename?);
```

### 撤销/重做

```typescript
// 撤销
mm.undoManager.undo();

// 重做
mm.undoManager.redo();

// 检查是否可以撤销/重做
mm.undoManager.canUndo();
mm.undoManager.canRedo();
```

### 数据持久化

```typescript
// 保存到 localStorage
mm.saveToStorage();

// 从 localStorage 加载
mm.loadFromStorage();
```

---

## 颜色管理

### 预设颜色方案

```typescript
const colorSchemes = {
  default: ['#5e6ad2', '#26b5ce', '#f9c52a', '#f98e52', '#e55e5e'],
  ocean: ['#006d77', '#83c5be', '#edf6f9', '#ffddd2', '#e29578'],
  forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
  sunset: ['#ff6b6b', '#ee5a6f', '#c44569', '#774c60', '#2d4059'],
  monochrome: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7']
};
```

### 应用颜色方案

```typescript
// 创建颜色函数
const colorFn = (node) => {
  const depth = node.state?.depth || 0;
  return colors[depth % colors.length];
};

// 应用颜色(带动画)
mm.applyColorSchemeWithAnimation(colorFn);

// 更新配置
mm.options.color = colorFn;
```

### 使用 ColorManager

```typescript
import { ColorManager, DEFAULT_SCHEMES } from 'markmap-view';

// 创建颜色管理器
const colorManager = new ColorManager('ocean');

// 获取所有方案
const schemes = colorManager.getAllSchemes();

// 切换方案
colorManager.setScheme('forest');

// 获取节点颜色
const color = colorManager.getColorForNode(node);

// 应用到节点
colorManager.applyToNodes(nodes);
```

---

## 备注系统

### 备注数据结构

```typescript
interface NodeWithNotes extends INode {
  inlineNote?: string;    // 单行备注
  detailedNote?: string;  // 详细备注
  hasNote?: boolean;      // 是否有备注
}
```

### Markdown 格式

```markdown
# 标题

- 节点内容: 这是单行备注
- 节点内容
  > 这是详细备注
  > 支持多行
- 混合备注: 单行部分
  > 详细部分
  > 可以有多行
```

### 备注解析配置

```typescript
import { Transformer } from 'markmap-lib';

const transformer = new Transformer(plugins, {
  separators: {
    note: ':',           // 备注分隔符
    noteBlock: '>',      // 备注块标记
    escape: '\\',        // 转义字符
    node: '-'            // 节点标记
  }
});
```

### 备注面板

备注面板会在点击备注图标(📝)时自动显示,支持:
- 统一的文本编辑区域
- 第一行自动作为单行备注
- 其余行作为详细备注
- 自动保存修改
- 关闭时更新显示

---

## 样式自定义

### CSS 变量

```css
.markmap {
  /* 字体 */
  --markmap-font: 300 16px/20px sans-serif;
  --markmap-text-color: #333;
  
  /* 链接 */
  --markmap-a-color: #0097e6;
  --markmap-a-hover-color: #00a8ff;
  
  /* 代码 */
  --markmap-code-bg: #f0f0f0;
  --markmap-code-color: #555;
  
  /* 高亮 */
  --markmap-highlight-bg: #ffeaa7;
  --markmap-highlight-node-bg: #ff02;
  
  /* 其他 */
  --markmap-circle-open-bg: #fff;
  --markmap-table-border: 1px solid currentColor;
  --markmap-max-width: 9999px;
}
```

### 自定义字体

```typescript
// 方法1: 通过 CSS 变量
const mm = Markmap.create(svg, {
  style: (id) => `
    .${id} {
      --markmap-font: 400 18px/24px "Helvetica Neue", Arial, sans-serif;
      --markmap-text-color: #2c3e50;
    }
  `
});

// 方法2: 通过全局 CSS
<style>
.markmap {
  --markmap-font: 400 18px/24px "PingFang SC", "Microsoft YaHei", sans-serif;
}
</style>
```

### 自定义样式函数

```typescript
const mm = Markmap.create(svg, {
  style: (id) => `
    .${id} .markmap-foreign {
      font-family: "Consolas", "Monaco", monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .${id} .markmap-node > circle {
      stroke-width: 2px;
    }
    
    .${id} .markmap-link {
      stroke-width: 2px;
      opacity: 0.8;
    }
  `
});
```

---

## 回调函数

### onNodeClick

```typescript
const mm = Markmap.create(svg, {
  onNodeClick: (node) => {
    console.log('节点被点击:', node);
    console.log('节点内容:', node.content);
    console.log('节点深度:', node.state?.depth);
    console.log('节点路径:', node.state?.path);
  }
});
```

### onMarkdownChange

```typescript
const mm = Markmap.create(svg, {
  onMarkdownChange: (markdown) => {
    console.log('Markdown 已更新:', markdown);
    // 可以保存到服务器或本地存储
  }
});
```

### onNoteEdit

```typescript
const mm = Markmap.create(svg, {
  onNoteEdit: (node, note) => {
    console.log('备注已编辑:', node, note);
    // 可以触发自动保存或同步
  }
});
```

---

## 导出功能

### 导出为 Markdown

```typescript
// 导出整个思维导图
const markdown = mm.exportAsMarkdown();

// 导出特定节点的子树
const subtreeMarkdown = mm.exportAsMarkdown(node);

// 复制到剪贴板
navigator.clipboard.writeText(markdown);
```

### 导出为图片

```typescript
// PNG 格式
const pngBlob = await mm.exportAsPNG();
const pngUrl = URL.createObjectURL(pngBlob);

// JPG 格式
const jpgBlob = await mm.exportAsJPG();

// SVG 格式
const svgString = mm.exportAsSVG();
const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });

// 直接下载
mm.downloadAsPNG('mindmap.png');
mm.downloadAsJPG('mindmap.jpg');
mm.downloadAsSVG('mindmap.svg');
```

---

## 完整示例

```typescript
import { Transformer, Markmap } from 'markmap';

// 1. 解析 Markdown
const transformer = new Transformer();
const { root } = transformer.transform(markdown);

// 2. 创建思维导图
const mm = Markmap.create('#mindmap', {
  // 布局
  maxWidth: 300,
  paddingX: 80,
  spacingHorizontal: 80,
  spacingVertical: 20,
  
  // 动画
  duration: 500,
  
  // 视图
  autoFit: true,
  fitRatio: 0.95,
  initialExpandLevel: 2,
  
  // 交互
  zoom: true,
  pan: true,
  enableTouch: true,
  
  // 颜色
  color: (node) => {
    const colors = ['#5e6ad2', '#26b5ce', '#f9c52a', '#f98e52', '#e55e5e'];
    const depth = node.state?.depth || 0;
    return colors[depth % colors.length];
  },
  
  // 回调
  onNodeClick: (node) => {
    console.log('点击节点:', node.content);
  },
  
  // 样式
  style: (id) => `
    .${id} {
      --markmap-font: 400 16px/22px "PingFang SC", sans-serif;
    }
  `
});

// 3. 设置数据
mm.setData(root);

// 4. 适应视图
mm.fit();

// 5. 导出
const markdown = mm.exportAsMarkdown();
await mm.downloadAsPNG('mindmap.png');
```

---

## 字体自定义 API

### 方法1: CSS 变量(推荐)

```typescript
const mm = Markmap.create(svg, {
  style: (id) => `
    .${id} {
      /* 全局字体 */
      --markmap-font: 400 18px/24px "PingFang SC", "Microsoft YaHei", sans-serif;
      
      /* 文本颜色 */
      --markmap-text-color: #2c3e50;
    }
    
    /* 针对特定元素 */
    .${id} .markmap-foreign strong {
      font-weight: 600;
    }
    
    .${id} .markmap-foreign code {
      font-family: "Consolas", "Monaco", monospace;
      font-size: 14px;
    }
  `
});
```

### 方法2: 全局 CSS

```html
<style>
.markmap {
  --markmap-font: 400 16px/22px "Helvetica Neue", Arial, sans-serif;
}

/* 中文优化 */
.markmap-zh {
  --markmap-font: 400 16px/24px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* 等宽字体 */
.markmap-mono {
  --markmap-font: 400 14px/20px "Fira Code", "Consolas", monospace;
}
</style>
```

### 方法3: 动态修改

```typescript
// 修改字体大小
document.documentElement.style.setProperty('--markmap-font', '400 20px/28px sans-serif');

// 修改文本颜色
document.documentElement.style.setProperty('--markmap-text-color', '#1a1a1a');
```

---

## 总结

Markmap Enhanced 提供了丰富的 API,支持:

✅ **布局控制**: 节点大小、间距、缩放
✅ **交互配置**: 缩放、平移、触摸手势
✅ **颜色管理**: 5种预设方案 + 自定义
✅ **备注系统**: 单行/详细备注 + 可视化编辑
✅ **样式自定义**: CSS变量 + 自定义样式函数
✅ **字体配置**: 通过CSS变量灵活配置
✅ **导出功能**: Markdown、PNG、JPG、SVG
✅ **数据持久化**: localStorage自动保存
✅ **回调函数**: 节点点击、内容变化、备注编辑
✅ **撤销/重做**: 完整的历史记录管理

字体可以通过 `--markmap-font` CSS变量轻松自定义,无需额外API! 🎨
