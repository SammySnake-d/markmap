# 键盘快捷键

## 撤销/重做功能

Markmap 现在支持通过键盘快捷键进行撤销和重做操作。

### 快捷键

#### 撤销 (Undo)
- **Mac**: `Cmd+Z`
- **Windows/Linux**: `Ctrl+Z`

撤销最近的一次编辑操作，恢复到之前的状态。

#### 重做 (Redo)
- **Mac**: `Cmd+Shift+Z`
- **Windows/Linux**: `Ctrl+Y` 或 `Ctrl+Shift+Z`

重做上一次撤销的操作。

### 功能特性

- ✅ 自动检测操作系统，使用相应的快捷键
- ✅ 支持多次撤销/重做（默认保留 50 条历史记录）
- ✅ 当没有可撤销/重做的操作时，快捷键会被忽略
- ✅ 阻止浏览器默认行为，避免与浏览器快捷键冲突
- ✅ 撤销/重做后自动更新思维导图显示

### 使用示例

```typescript
import { Markmap } from 'markmap-view';

// 创建 Markmap 实例
const markmap = new Markmap(svg);

// 快捷键已自动绑定，无需额外配置
// 用户可以直接使用 Cmd+Z / Ctrl+Z 进行撤销
// 使用 Cmd+Shift+Z / Ctrl+Y 进行重做

// 也可以通过编程方式访问 UndoManager
console.log('可以撤销:', markmap.undoManager.canUndo());
console.log('可以重做:', markmap.undoManager.canRedo());

// 手动触发撤销/重做
markmap.undoManager.undo();
markmap.undoManager.redo();
```

### 支持的操作

目前撤销/重做功能支持以下操作：

1. **备注编辑** - 编辑节点的单行备注或详细备注
2. **节点展开/折叠** - 展开或折叠节点（未来支持）

### 历史记录管理

默认情况下，UndoManager 保留最多 50 条历史记录。可以通过以下方式调整：

```typescript
// 设置最大历史记录数
markmap.undoManager.setMaxStackSize(100);

// 清空所有历史记录
markmap.undoManager.clear();

// 查看历史记录数量
const undoCount = markmap.undoManager.getUndoStackSize();
const redoCount = markmap.undoManager.getRedoStackSize();
```

### 测试

运行集成测试：

```bash
cd packages/markmap-view
pnpm vitest run test/undo-integration.test.ts
```

手动测试：

在浏览器中打开 `test-undo-shortcuts.html` 文件，使用按钮模拟编辑操作，然后测试快捷键功能。

### 相关需求

- **需求 5.9**: 支持使用 Cmd+Z (Mac) 或 Ctrl+Z (Windows) 撤销到上一次修改
- **需求 12.2**: 按下 Cmd+Z (Mac) 或 Ctrl+Z (Windows) 时撤销最近的一次编辑操作
- **需求 12.3**: 按下 Cmd+Shift+Z (Mac) 或 Ctrl+Y (Windows) 时重做上一次撤销的操作

### 注意事项

1. **自动清理**: 当 Markmap 实例被销毁时，键盘事件监听器会自动清理，避免内存泄漏。

2. **平台检测**: 系统会自动检测用户的操作系统，使用相应的修饰键（Mac 使用 `metaKey`，Windows/Linux 使用 `ctrlKey`）。

3. **事件冒泡**: 快捷键事件会阻止默认行为，避免与浏览器的撤销/重做功能冲突。

4. **历史分支**: 当执行新操作时，重做栈会被清空。这是标准的撤销/重做行为。
