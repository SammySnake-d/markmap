# Markdown 导出功能

## 概述

`exportToMarkdown` 函数将 markmap 的节点树转换回 Markdown 格式，支持：

- 层级结构保持（需求 4.2, 4.3, 4.4）
- 单行备注（使用冒号分隔符）
- 详细备注（使用引用块格式）
- 转义字符处理（需求 6.10）
- 自定义分隔符支持

## 基本用法

```typescript
import { Transformer, exportToMarkdown } from 'markmap-lib';

// 解析 Markdown
const transformer = new Transformer();
const { root } = transformer.transform('- Topic: Note\n  - Subtopic');

// 导出为 Markdown
const markdown = exportToMarkdown(root);
console.log(markdown);
// 输出:
// - Topic: Note
//   - Subtopic
```

## 功能特性

### 1. 保持层级结构

```typescript
const markdown = `- Level 1
  - Level 2
    - Level 3`;

const { root } = transformer.transform(markdown);
const exported = exportToMarkdown(root);
// 输出保持相同的层级结构和缩进
```

### 2. 支持单行备注

```typescript
const markdown = '- Main content: This is a note';
const { root } = transformer.transform(markdown);
const exported = exportToMarkdown(root);
// 输出: - Main content: This is a note
```

### 3. 支持详细备注

```typescript
const markdown = `- Main content
  > Detailed note line 1
  > Detailed note line 2`;

const { root } = transformer.transform(markdown);
const exported = exportToMarkdown(root);
// 输出保持引用块格式
```

### 4. 自动转义分隔符

当内容中包含分隔符时，导出时会自动添加转义字符：

```typescript
const node = {
  content: 'Content with: colon',
  inlineNote: 'Note with: colon',
  children: []
};

const exported = exportToMarkdown(node);
// 输出: - Content with\: colon: Note with\: colon
```

### 5. 导出子树

可以导出节点树的任意子树：

```typescript
const { root } = transformer.transform('- Root\n  - Branch\n    - Leaf');

// 导出第一个子节点
const subtree = root.children[0];
const exported = exportToMarkdown(subtree);
// 输出: - Branch
//   - Leaf
```

### 6. 自定义分隔符

```typescript
const customTransformer = new Transformer(undefined, {
  separators: { note: '|' }
});

const { root } = customTransformer.transform('- Topic | Note');
const exported = exportToMarkdown(root, { noteSeparator: '|' });
// 输出: - Topic | Note
```

## API 参考

### exportToMarkdown(node, options?)

将节点树导出为 Markdown 格式。

**参数:**

- `node` - 要导出的节点（或子树的根节点）
- `options` (可选) - 导出选项
  - `noteSeparator` - 备注分隔符（默认: `':'`）
  - `noteBlockMarker` - 详细备注标记（默认: `'>'`）
  - `escapeChar` - 转义字符（默认: `'\'`）
  - `nodeMarker` - 列表标记（默认: `'-'`）

**返回值:**

- `string` - Markdown 格式的文本

## Round-trip 一致性

导出功能确保 round-trip 一致性（需求 5.11）：

```typescript
const original = '- Topic: Note\n  > Detail\n  - Subtopic';

// 解析 -> 导出 -> 再解析
const { root: tree1 } = transformer.transform(original);
const exported = exportToMarkdown(tree1);
const { root: tree2 } = transformer.transform(exported);

// tree1 和 tree2 应该具有相同的结构和内容
```

## 使用场景

1. **复制节点为 Markdown** - 用户右键点击节点，复制为 Markdown 格式（需求 4.1, 4.2）
2. **保存编辑** - 将编辑后的节点树保存回 Markdown 格式
3. **数据导出** - 将思维导图导出为 Markdown 文件
4. **调试和测试** - 验证解析和导出的一致性

## 注意事项

1. 空的根节点会被跳过，直接导出其子节点
2. 空的 inline note 不会被导出
3. 详细备注中的空行会被保留
4. 转义字符会自动添加到包含分隔符的内容中

## 相关需求

- 需求 4.2: 保持层级结构
- 需求 4.3: 保持缩进关系
- 需求 4.4: 保留备注格式
- 需求 5.11: Round-trip 一致性
- 需求 6.10: 自动添加转义字符
