# Markmap Enhanced

[![Join the chat at https://gitter.im/gera2ld/markmap](https://badges.gitter.im/gera2ld/markmap.svg)](https://gitter.im/gera2ld/markmap?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

将 Markdown 文档可视化为交互式思维导图的增强版工具。

本项目基于 [markmap](https://github.com/markmap/markmap) 进行深度二次开发，灵感来源于 [dundalek's markmap](https://github.com/dundalek/markmap)。

👉 [在线体验](https://markmap.js.org/repl)

---

## ✨ 增强功能

Markmap Enhanced 在原版基础上新增了以下强大功能：

### 🔍 智能搜索
- 模糊匹配搜索节点内容和备注
- 自动高亮和展开匹配结果
- 快速导航（上一个/下一个）
- 支持快捷键 `Ctrl+F` / `Cmd+F`

### 📝 备注系统
- **单行备注**：使用冒号分隔 `- 节点: 备注内容`
- **详细备注**：使用引用块 `> 详细说明`
- 备注图标显示和面板编辑
- 实时保存和撤销/重做支持

### 🎯 展开/折叠控制
- 一键展开/折叠全部节点
- 节点级别的子树展开/折叠
- 右键菜单快速操作
- 平滑动画过渡

### 📤 多格式导出
- **Markdown**：复制节点子树为 Markdown
- **图片**：导出为 PNG、JPG、SVG 格式
- 保持层级结构和备注格式
- 一键下载

### 🎨 颜色主题
- 5+ 预设主题（Default、Ocean、Forest、Sunset、Monochrome）
- 平滑颜色过渡动画
- 主题自动保存
- 自定义颜色支持

### 📱 移动端优化
- 触摸手势支持（拖动、捏合缩放）
- 响应式布局自适应
- 屏幕方向自动调整
- 移动端优化的工具栏

### 🎮 画布交互
- `Space` + 拖动平移画布
- 鼠标滚轮缩放
- 右键上下文菜单
- 流畅的 60fps 动画

### 💾 数据持久化
- 自动保存到本地存储
- 编辑历史持久化
- 视图状态保存
- 数据完整性验证

### ⚡ 其他特性
- 撤销/重做功能（`Ctrl+Z` / `Cmd+Z`）
- Excalidraw 风格工具栏
- 自动动态布局
- 转义字符支持
- 自定义分隔符配置

---

## 📦 安装

### 使用 npm

```bash
npm install markmap-lib markmap-view markmap-toolbar
```

### 使用 pnpm（推荐）

```bash
pnpm add markmap-lib markmap-view markmap-toolbar
```

### 使用 yarn

```bash
yarn add markmap-lib markmap-view markmap-toolbar
```

---

## 🚀 快速开始

### 基础使用

```typescript
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

// 创建 Transformer
const transformer = new Transformer();

// 解析 Markdown
const markdown = `
# 主题
## 子主题 1: 这是单行备注
- 要点 1
  > 这是详细备注
  > 可以多行
- 要点 2
## 子主题 2
- 要点 3
`;

const { root } = transformer.transform(markdown);

// 渲染思维导图
const svg = document.querySelector('#mindmap');
const mm = Markmap.create(svg, {
  colorScheme: 'ocean',
  enableTouch: true,
  autoSave: true
});

mm.setData(root);
mm.fit();
```

### 使用工具栏

```typescript
import { EnhancedToolbar } from 'markmap-toolbar';

// 创建工具栏
const toolbar = new EnhancedToolbar(document.querySelector('#toolbar'), {
  showSearch: true,
  showExpandCollapse: true,
  showExport: true,
  showColorPicker: true
});

// 绑定事件
toolbar.onSearch = (keyword) => mm.search(keyword);
toolbar.onExpandAll = () => mm.expandAll();
toolbar.onCollapseAll = () => mm.collapseAll();
toolbar.onExport = (format) => {
  if (format === 'markdown') {
    const md = mm.exportAsMarkdown();
    navigator.clipboard.writeText(md);
  } else {
    mm.exportAsImage(format);
  }
};
toolbar.onColorSchemeChange = (scheme) => mm.setColorScheme(scheme);
```

### 自定义分隔符

```typescript
const transformer = new Transformer({
  separators: {
    note: '::',        // 自定义备注分隔符
    noteBlock: '>>',   // 自定义备注块标记
    escape: '\\'       // 转义字符
  }
});
```

---

## 📖 文档

完整的文档资源：

- **[用户指南](./USER_GUIDE.md)** - 详细的功能说明和使用教程
- **[快捷键速查表](./KEYBOARD_SHORTCUTS.md)** - 所有快捷键和操作
- **[功能特性](./FEATURES.md)** - 深入了解所有功能
- **[API 文档](./api/README.md)** - 开发者 API 参考
- **[文档索引](./DOCUMENTATION_INDEX.md)** - 快速找到所需文档

### 开发文档

- **[需求文档](../.kiro/specs/markmap-enhanced/requirements.md)** - 功能需求说明
- **[设计文档](../.kiro/specs/markmap-enhanced/design.md)** - 系统架构和设计
- **[测试框架](./TEST_FRAMEWORK_SETUP.md)** - 测试环境配置

---

## 💡 使用示例

### 备注功能

```markdown
# 项目管理
## 需求分析: 第一阶段
- 用户调研
  > 目标用户：企业用户
  > 调研方式：问卷 + 访谈
  > 时间：2周
- 竞品分析: 分析3-5个竞品
```

### 搜索功能

```typescript
// 搜索节点
const results = mm.search('用户');

// 导航到下一个结果
mm.navigateToNext();

// 清除搜索
mm.clearSearch();
```

### 展开/折叠

```typescript
// 展开所有节点
mm.expandAll();

// 折叠所有节点
mm.collapseAll();

// 展开特定节点的子树
mm.expandAll(specificNode);
```

### 导出功能

```typescript
// 导出为 Markdown
const markdown = mm.exportAsMarkdown();

// 导出为 PNG
const pngBlob = await mm.exportAsPNG();

// 导出为 SVG
const svgString = mm.exportAsSVG();
```

### 颜色主题

```typescript
// 设置主题
mm.setColorScheme('ocean');

// 获取可用主题
const schemes = mm.getAvailableColorSchemes();

// 自定义主题
mm.setColorScheme({
  name: 'custom',
  colors: ['#5e6ad2', '#26b5ce', '#f9c52a', '#f98e52', '#e29578']
});
```

---

## 🎯 使用场景

### 学习和笔记
- 课程笔记整理
- 知识点梳理
- 概念关系图
- 学习路径规划

### 项目管理
- 项目结构规划
- 任务分解
- 进度跟踪
- 团队协作

### 演示和讲解
- 课程讲解
- 产品演示
- 技术分享
- 培训教学

### 头脑风暴
- 创意整理
- 思路梳理
- 方案对比
- 决策分析

---

## 🔧 开发

### 环境要求

- Node.js >= 22
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter markmap-lib build
pnpm --filter markmap-view build
pnpm --filter markmap-toolbar build
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter markmap-lib test
pnpm --filter markmap-view test

# 运行属性测试
pnpm test -- --grep "Property"
```

### 代码检查

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

---

## 🌟 相关项目

Markmap 也可在以下平台使用：

- **[VSCode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode)** 和 **[Open VSX](https://open-vsx.org/extension/gera2ld/markmap-vscode)**
- **Vim / Neovim**:
  - [coc-markmap](https://github.com/gera2ld/coc-markmap) ![NPM](https://img.shields.io/npm/v/coc-markmap.svg) - 基于 [coc.nvim](https://github.com/neoclide/coc.nvim)
  - [markmap.vim](https://github.com/Zeioth/markmap.nvim) - 无需 coc.nvim
- **Emacs**: [eaf-markmap](https://github.com/emacs-eaf/eaf-markmap) - 基于 [EAF](https://github.com/emacs-eaf/emacs-application-framework)
- **MCP Server**: [markmap-mcp-server](https://github.com/jinzcdev/markmap-mcp-server) [![NPM Version](https://img.shields.io/npm/v/@jinzcdev/markmap-mcp-server.svg)](https://www.npmjs.com/package/@jinzcdev/markmap-mcp-server) - 基于 [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 📊 性能

- ✅ 支持 200+ 节点
- ✅ 60fps 流畅动画
- ✅ 300ms 内响应
- ✅ 低内存占用
- ✅ 移动端优化

---

## 🌐 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 报告问题

在 [GitHub Issues](https://github.com/markmap/markmap/issues) 中报告问题时，请提供：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器、版本等）

---

## 📄 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](./LICENSE) 文件。

---

## 🙏 致谢

- 感谢 [dundalek](https://github.com/dundalek) 创建了原始的 markmap 项目
- 感谢 [gera2ld](https://github.com/gera2ld) 维护和改进 markmap
- 感谢所有贡献者的支持和贡献

---

## 📞 联系方式

- **GitHub Issues**: [提交问题](https://github.com/markmap/markmap/issues)
- **Gitter Chat**: [加入讨论](https://gitter.im/gera2ld/markmap)
- **官方文档**: [markmap.js.org](https://markmap.js.org/)

---

**开始使用 Markmap Enhanced，让思维可视化！** 🚀
