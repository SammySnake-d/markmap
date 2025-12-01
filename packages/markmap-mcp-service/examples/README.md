# MCP 服务示例

本目录包含 markmap-mcp-service 的使用示例。

## 文件说明

| 文件 | 说明 |
|------|------|
| `sample-mindmap.md` | 示例 Markdown 文件，展示备注语法 |
| `generate-example.ts` | TypeScript 脚本，演示如何生成思维导图 |
| `mcp-call-example.json` | MCP 工具调用示例，展示各种参数组合 |

## 运行示例

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建项目

```bash
pnpm build
```

### 3. 运行生成脚本

```bash
npx tsx examples/generate-example.ts
```

生成的 HTML 文件将保存在 `examples/output/` 目录中。

## 示例 Markdown 语法

### 基本结构

```markdown
# 标题

- 节点 1
  - 子节点 1.1
  - 子节点 1.2
- 节点 2
```

### 单行备注

使用冒号 `:` 分隔主内容和备注：

```markdown
- 节点内容: 这是备注
```

### 详细备注

使用引用块 `>` 添加多行备注：

```markdown
- 节点内容
  > 详细备注第一行
  > 详细备注第二行
```

### 混合备注

同时使用单行和详细备注：

```markdown
- 节点内容: 简短备注
  > 详细说明
  > 更多信息
```

## MCP 调用示例

查看 `mcp-call-example.json` 了解各种参数组合的调用方式。

### 基本调用

```json
{
  "tool": "generate_mindmap",
  "input": {
    "markdown": "# 示例\n- 节点 1\n- 节点 2",
    "outputPath": "./output/example.html"
  }
}
```

### 完整参数

```json
{
  "tool": "generate_mindmap",
  "input": {
    "markdown": "# 示例\n- 节点 1: 备注\n  > 详细说明",
    "outputPath": "./output/full.html",
    "title": "示例标题",
    "colorScheme": "ocean",
    "enableEdit": true,
    "theme": "light"
  }
}
```

## 颜色主题预览

| 主题 | 说明 |
|------|------|
| `default` | 默认蓝紫渐变 |
| `ocean` | 蓝绿海洋色调 |
| `forest` | 绿色自然色调 |
| `sunset` | 暖橙红色调 |
| `monochrome` | 灰度 |
