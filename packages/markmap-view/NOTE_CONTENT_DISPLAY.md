# 备注内容显示实现

## 概述

任务 38 实现了 NotePanel 组件的备注内容显示功能，满足以下需求：

- **需求 5.3**: 同时显示单行备注和详细备注
- **需求 6.4**: 保留详细备注中的换行符和格式
- **需求 6.5**: 保留并渲染详细备注中的 Markdown 格式

## 功能特性

### 1. 备注内容显示（需求 5.3）

NotePanel 可以显示三种状态：

- **仅单行备注**: 显示"单行备注"标签和内容
- **仅详细备注**: 显示"详细备注"标签和内容
- **同时显示**: 同时显示单行备注和详细备注
- **无备注**: 显示"此节点没有备注"消息

```typescript
// 示例：显示单行备注
const node = {
  content: '节点标题',
  inlineNote: '这是一个简短的备注',
  children: []
};
notePanel.show(node, { x: 100, y: 100 });

// 示例：同时显示两种备注
const node = {
  content: '节点标题',
  inlineNote: '简短备注',
  detailedNote: '这是详细备注\n可以有多行',
  children: []
};
notePanel.show(node, { x: 100, y: 100 });
```

### 2. 多行内容格式保留（需求 6.4）

详细备注中的换行符和格式会被完整保留：

```typescript
const node = {
  content: '节点标题',
  detailedNote: 'Line 1\nLine 2\n\nLine 4',
  children: []
};
// 显示时会保留所有换行符，包括空行
```

实现方式：
- 使用 `white-space: pre-wrap` CSS 属性
- 在 HTML 中保留文本节点中的 `\n` 字符
- `textContent` 可以正确返回包含换行符的原始文本

### 3. Markdown 格式渲染（需求 6.5）

详细备注支持以下 Markdown 格式：

#### 粗体
```markdown
**粗体文本** 或 __粗体文本__
```
渲染为 `<strong>粗体文本</strong>`

#### 斜体
```markdown
*斜体文本* 或 _斜体文本_
```
渲染为 `<em>斜体文本</em>`

#### 内联代码
```markdown
`代码文本`
```
渲染为带样式的 `<code>` 元素

#### 列表
```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```
渲染为 `<ul>` 或 `<ol>` 列表

#### 组合使用
```typescript
const node = {
  content: '节点标题',
  detailedNote: '**重要**: 这是 *关键* 信息\n使用 `code` 标记代码',
  children: []
};
// 所有格式都会被正确渲染
```

### 4. 安全性

所有用户输入都经过 HTML 转义，防止 XSS 攻击：

```typescript
const node = {
  content: '节点标题',
  detailedNote: '<script>alert("xss")</script>',
  children: []
};
// 会显示为纯文本，不会执行脚本
```

## API 使用

### updateContent 方法

```typescript
/**
 * 更新备注面板的内容
 * 
 * @param inlineNote - 单行备注内容（可选）
 * @param detailedNote - 详细备注内容（可选）
 */
notePanel.updateContent(inlineNote?: string, detailedNote?: string): void
```

### 示例

```typescript
// 创建 NotePanel
const notePanel = new NotePanel(document.body);

// 显示单行备注
notePanel.updateContent('这是单行备注', undefined);

// 显示详细备注
notePanel.updateContent(undefined, '这是详细备注\n支持多行');

// 同时显示两种备注
notePanel.updateContent('单行备注', '详细备注\n**支持** Markdown');

// 清空内容
notePanel.updateContent(undefined, undefined);
```

## 测试覆盖

实现包含全面的单元测试：

- ✅ 显示单行备注
- ✅ 显示详细备注
- ✅ 同时显示两种备注
- ✅ 显示空消息（无备注时）
- ✅ 保留换行符
- ✅ 处理空行
- ✅ 渲染粗体格式
- ✅ 渲染斜体格式
- ✅ 渲染内联代码
- ✅ 组合多种格式
- ✅ 格式与换行符共存
- ✅ 单行备注不渲染 Markdown
- ✅ XSS 防护

所有测试都通过，确保功能的正确性和稳定性。

## 实现细节

### CSS 样式

```css
.markmap-note-detailed-content {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;  /* 保留换行符 */
  word-wrap: break-word;  /* 自动换行 */
}
```

### Markdown 渲染

使用 `renderMarkdownContent` 私有方法处理 Markdown 格式：

1. 转义 HTML 字符（防止 XSS）
2. 替换 Markdown 语法为 HTML 标签
3. 保留文本节点中的换行符
4. 返回安全的 HTML 字符串

### 区分单行和详细备注

- **单行备注**: 使用 `textContent` 设置，不渲染 Markdown
- **详细备注**: 使用 `innerHTML` 设置，渲染 Markdown 格式

这确保了单行备注保持简洁，而详细备注可以使用丰富的格式。

## 下一步

任务 39 将实现备注内容显示的单元测试（如果需要额外的测试）。

当前实现已经包含了全面的测试覆盖，满足所有需求。
