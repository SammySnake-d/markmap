# 分隔符配置指南

## 概述

从版本 0.18.12 开始，markmap-lib 支持自定义分隔符配置，允许您自定义用于解析备注的分隔符。

## 功能

- **自定义备注分隔符**: 更改用于分隔主内容和单行备注的字符（默认: `:`）
- **自定义备注块标记**: 更改用于标识详细备注的块标记（默认: `>`）
- **自定义转义字符**: 更改用于转义特殊字符的字符（默认: `\`）
- **自定义节点分隔符**: 更改用于标识列表项的字符（默认: `-` 或 `*`）

## 使用方法

### 基本用法（使用默认分隔符）

```typescript
import { Transformer } from 'markmap-lib';

const transformer = new Transformer();
const result = transformer.transform(`
# 根节点
- 节点 1: 这是一个单行备注
  > 这是一个详细备注
- 节点 2
`);
```

### 自定义备注分隔符

如果您想使用 `::` 而不是 `:` 来分隔主内容和备注：

```typescript
import { Transformer } from 'markmap-lib';

const transformer = new Transformer(undefined, {
  separators: {
    note: '::'
  }
});

const result = transformer.transform(`
# 根节点
- 节点 1:: 这是使用自定义分隔符的备注
- 节点 2: 这不是备注（单个冒号）
`);
```

### 自定义备注块标记

如果您想使用 `>>` 而不是 `>` 来标识详细备注：

```typescript
import { Transformer } from 'markmap-lib';

const transformer = new Transformer(undefined, {
  separators: {
    noteBlock: '>>'
  }
});

const result = transformer.transform(`
# 根节点
- 节点 1
  >> 这是使用自定义标记的详细备注
  > 这是普通的引用块，不是备注
`);
```

### 自定义转义字符

如果您想使用 `^` 而不是 `\` 来转义特殊字符：

```typescript
import { Transformer } from 'markmap-lib';

const transformer = new Transformer(undefined, {
  separators: {
    escape: '^'
  }
});

const result = transformer.transform(`
# 根节点
- 节点 1^: 内容中包含转义的冒号
- 节点 2: 正常的备注
`);
```

### 自定义所有分隔符

您可以同时自定义所有分隔符：

```typescript
import { Transformer } from 'markmap-lib';

const transformer = new Transformer(undefined, {
  separators: {
    node: '+',
    note: '::',
    noteBlock: '>>',
    escape: '^^'
  }
});

const result = transformer.transform(`
# 根节点
+ 节点 1:: 使用自定义分隔符的单行备注
  >> 使用自定义标记的详细备注
+ 节点 2^^:: 内容中包含转义的分隔符
`);
```

## 默认值

如果您不提供自定义配置，将使用以下默认值：

```typescript
{
  node: '-',
  note: ':',
  noteBlock: '>',
  escape: '\\'
}
```

## 注意事项

1. **部分配置**: 您只需要指定想要更改的分隔符，其他分隔符将使用默认值。

2. **配置持久性**: 分隔符配置在 Transformer 实例的整个生命周期内保持不变。

3. **多个实例**: 您可以创建多个具有不同配置的 Transformer 实例。

4. **特殊字符**: 如果使用正则表达式特殊字符作为分隔符，它们会被自动转义。

## 示例场景

### 场景 1: 避免与现有内容冲突

如果您的 Markdown 内容中经常使用冒号（例如时间格式、URL），您可能想使用不同的备注分隔符：

```typescript
const transformer = new Transformer(undefined, {
  separators: {
    note: '|'
  }
});

// 现在可以安全地使用冒号
const result = transformer.transform(`
- 会议时间: 14:00-15:00 | 这是备注
- 网站: https://example.com | 这也是备注
`);
```

### 场景 2: 与其他 Markdown 工具兼容

如果您需要与使用不同语法的其他工具兼容：

```typescript
const transformer = new Transformer(undefined, {
  separators: {
    noteBlock: ':::'
  }
});

const result = transformer.transform(`
- 节点 1
  ::: 这是详细备注
  支持多行
  :::
`);
```

## API 参考

### IEnhancedParseOptions

```typescript
interface IEnhancedParseOptions {
  separators?: ISeparatorConfig;
}
```

### ISeparatorConfig

```typescript
interface ISeparatorConfig {
  node?: string;      // 节点分隔符，默认: '-'
  note?: string;      // 备注分隔符，默认: ':'
  noteBlock?: string; // 备注块标记，默认: '>'
  escape?: string;    // 转义字符，默认: '\\'
}
```

## 相关需求

- Requirement 6.7: 自定义分隔符支持
- Requirement 13.3: 组件初始化时接受分隔符配置
- Requirement 13.8: 未指定时使用默认值

## 测试

完整的测试套件位于：
- `test/separator-config.test.ts` - 基本配置测试
- `test/separator-config-usage.test.ts` - 使用示例测试
