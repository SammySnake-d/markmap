# Markmap 自定义 UI 指南

## 概述

Markmap 开放式架构允许您完全自定义所有 UI 组件，包括备注面板、右键菜单、工具栏和搜索界面。本指南将详细说明如何实现自定义 UI Provider。

## 目录

- [Provider 接口概述](#provider-接口概述)
- [实现自定义备注 Provider](#实现自定义备注-provider)
- [实现自定义右键菜单 Provider](#实现自定义右键菜单-provider)
- [实现自定义工具栏 Provider](#实现自定义工具栏-provider)
- [实现自定义搜索 Provider](#实现自定义搜索-provider)
- [注册和使用自定义 Provider](#注册和使用自定义-provider)
- [最佳实践](#最佳实践)
- [完整示例](#完整示例)

## Provider 接口概述

Markmap 定义了四个主要的 Provider 接口：

1. **INoteProvider** - 备注系统
2. **IContextMenuProvider** - 右键菜单
3. **IToolbarProvider** - 工具栏
4. **ISearchProvider** - 搜索功能

每个 Provider 都是独立的，您可以只自定义需要的部分，其他部分使用默认实现。

## 实现自定义备注 Provider

### INoteProvider 接口

```typescript
interface INoteProvider {
  // 渲染备注图标
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement;
  
  // 显示备注面板
  showNotePanel(node: INode, position: IPosition): void;
  
  // 隐藏备注面板
  hideNotePanel(): void;
  
  // 备注变化回调（可选）
  onNoteChange?: (node: INode, note: string) => void;
}
```

### 基础实现

```typescript
class CustomNoteProvider implements INoteProvider {
  private panel: HTMLElement | null = null;
  
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement {
    // 创建自定义图标
    const icon = document.createElement('span');
    icon.className = 'custom-note-icon';
    icon.textContent = '📝';
    icon.style.cursor = 'pointer';
    icon.style.marginLeft = '8px';
    
    // 添加点击事件
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = icon.getBoundingClientRect();
      this.showNotePanel(node, { x: rect.left, y: rect.bottom });
    });
    
    return icon;
  }
  
  showNotePanel(node: INode, position: IPosition): void {
    // 隐藏现有面板
    this.hideNotePanel();
    
    // 创建面板
    this.panel = document.createElement('div');
    this.panel.className = 'custom-note-panel';
    this.panel.style.position = 'fixed';
    this.panel.style.left = `${position.x}px`;
    this.panel.style.top = `${position.y}px`;
    this.panel.style.background = 'white';
    this.panel.style.border = '1px solid #ccc';
    this.panel.style.borderRadius = '4px';
    this.panel.style.padding = '12px';
    this.panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    this.panel.style.zIndex = '1000';
    this.panel.style.minWidth = '300px';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = node.content;
    title.style.margin = '0 0 8px 0';
    this.panel.appendChild(title);
    
    // 添加文本区域
    const textarea = document.createElement('textarea');
    textarea.value = node.payload.note || '';
    textarea.style.width = '100%';
    textarea.style.minHeight = '100px';
    textarea.style.border = '1px solid #ddd';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.resize = 'vertical';
    
    // 监听变化
    textarea.addEventListener('input', () => {
      if (this.onNoteChange) {
        this.onNoteChange(node, textarea.value);
      }
    });
    
    this.panel.appendChild(textarea);
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.marginTop = '8px';
    closeBtn.addEventListener('click', () => this.hideNotePanel());
    this.panel.appendChild(closeBtn);
    
    // 添加到页面
    document.body.appendChild(this.panel);
  }
  
  hideNotePanel(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
```

### 高级功能

```typescript
class AdvancedNoteProvider implements INoteProvider {
  private panel: HTMLElement | null = null;
  private editor: any = null; // 可以集成富文本编辑器
  
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement {
    const icon = document.createElement('div');
    icon.className = 'advanced-note-icon';
    
    // 根据是否有备注显示不同样式
    if (node.payload.note) {
      icon.innerHTML = '📌'; // 有备注
      icon.style.color = '#f66f6a';
    } else {
      icon.innerHTML = '📝'; // 无备注
      icon.style.color = '#999';
    }
    
    icon.style.cursor = 'pointer';
    icon.style.fontSize = '16px';
    icon.style.marginLeft = '8px';
    icon.style.transition = 'transform 0.2s';
    
    // 悬停效果
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.2)';
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.transform = 'scale(1)';
    });
    
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = icon.getBoundingClientRect();
      this.showNotePanel(node, { x: rect.left, y: rect.bottom + 5 });
    });
    
    return icon;
  }
  
  showNotePanel(node: INode, position: IPosition): void {
    this.hideNotePanel();
    
    // 创建模态背景
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.right = '0';
    backdrop.style.bottom = '0';
    backdrop.style.background = 'rgba(0,0,0,0.3)';
    backdrop.style.zIndex = '999';
    backdrop.addEventListener('click', () => this.hideNotePanel());
    document.body.appendChild(backdrop);
    
    // 创建面板
    this.panel = document.createElement('div');
    this.panel.className = 'advanced-note-panel';
    this.panel.style.position = 'fixed';
    this.panel.style.left = '50%';
    this.panel.style.top = '50%';
    this.panel.style.transform = 'translate(-50%, -50%)';
    this.panel.style.background = 'white';
    this.panel.style.borderRadius = '8px';
    this.panel.style.padding = '20px';
    this.panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    this.panel.style.zIndex = '1000';
    this.panel.style.width = '600px';
    this.panel.style.maxHeight = '80vh';
    this.panel.style.overflow = 'auto';
    
    // 添加头部
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '16px';
    
    const title = document.createElement('h2');
    title.textContent = `编辑备注: ${node.content}`;
    title.style.margin = '0';
    title.style.fontSize = '18px';
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#999';
    closeBtn.addEventListener('click', () => this.hideNotePanel());
    header.appendChild(closeBtn);
    
    this.panel.appendChild(header);
    
    // 添加编辑器
    const editorContainer = document.createElement('div');
    editorContainer.style.minHeight = '200px';
    editorContainer.style.border = '1px solid #ddd';
    editorContainer.style.borderRadius = '4px';
    editorContainer.style.padding = '12px';
    
    // 这里可以集成富文本编辑器，如 Quill、TinyMCE 等
    const textarea = document.createElement('textarea');
    textarea.value = node.payload.note || '';
    textarea.style.width = '100%';
    textarea.style.minHeight = '200px';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'vertical';
    textarea.style.fontFamily = 'inherit';
    
    textarea.addEventListener('input', () => {
      if (this.onNoteChange) {
        this.onNoteChange(node, textarea.value);
      }
    });
    
    editorContainer.appendChild(textarea);
    this.panel.appendChild(editorContainer);
    
    // 添加底部按钮
    const footer = document.createElement('div');
    footer.style.marginTop = '16px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '8px';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.style.padding = '8px 16px';
    saveBtn.style.background = '#5e7ce0';
    saveBtn.style.color = 'white';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.cursor = 'pointer';
    saveBtn.addEventListener('click', () => {
      if (this.onNoteChange) {
        this.onNoteChange(node, textarea.value);
      }
      this.hideNotePanel();
    });
    footer.appendChild(saveBtn);
    
    this.panel.appendChild(footer);
    
    // 添加到页面
    document.body.appendChild(this.panel);
    
    // 聚焦到文本区域
    textarea.focus();
  }
  
  hideNotePanel(): void {
    // 移除背景
    const backdrop = document.querySelector('.advanced-note-panel')?.previousElementSibling;
    if (backdrop) {
      backdrop.remove();
    }
    
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
```


## 实现自定义右键菜单 Provider

### IContextMenuProvider 接口

```typescript
interface IContextMenuProvider {
  // 菜单项配置
  items: IMenuItem[];
  
  // 显示菜单
  show(node: INode | null, position: IPosition): void;
  
  // 隐藏菜单
  hide(): void;
  
  // 自定义渲染（可选）
  render?(items: IMenuItem[]): HTMLElement;
}

interface IMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: (node: INode | null, api: IMarkmapAPI) => void | Promise<void>;
  separator?: boolean;
  disabled?: boolean | ((node: INode | null) => boolean);
  children?: IMenuItem[];
}
```

### 基础实现

```typescript
class CustomContextMenuProvider implements IContextMenuProvider {
  private menu: HTMLElement | null = null;
  private api: IMarkmapAPI;
  
  items: IMenuItem[] = [
    {
      id: 'expand',
      label: '展开',
      icon: '➕',
      action: (node, api) => {
        if (node?.payload.id) {
          api.toggleNode(node.payload.id);
        }
      }
    },
    {
      id: 'expand-all',
      label: '展开全部',
      icon: '🔽',
      action: (node, api) => {
        api.expandAll(node?.payload.id);
      }
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
      action: () => {}
    },
    {
      id: 'copy',
      label: '复制为 Markdown',
      icon: '📋',
      action: (node, api) => {
        const markdown = api.exportAsMarkdown(node?.payload.id);
        navigator.clipboard.writeText(markdown);
      }
    },
    {
      id: 'export',
      label: '导出',
      icon: '💾',
      children: [
        {
          id: 'export-svg',
          label: '导出为 SVG',
          action: async (node, api) => {
            const svg = api.exportAsSVG();
            // 下载逻辑
          }
        },
        {
          id: 'export-png',
          label: '导出为 PNG',
          action: async (node, api) => {
            const blob = await api.exportAsPNG();
            // 下载逻辑
          }
        }
      ]
    }
  ];
  
  constructor(api: IMarkmapAPI) {
    this.api = api;
  }
  
  show(node: INode | null, position: IPosition): void {
    this.hide();
    
    this.menu = this.render(this.items);
    this.menu.style.position = 'fixed';
    this.menu.style.left = `${position.x}px`;
    this.menu.style.top = `${position.y}px`;
    
    document.body.appendChild(this.menu);
    
    // 点击外部关闭
    setTimeout(() => {
      document.addEventListener('click', () => this.hide(), { once: true });
    }, 0);
  }
  
  hide(): void {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }
  
  render(items: IMenuItem[]): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    menu.style.padding = '4px 0';
    menu.style.minWidth = '200px';
    menu.style.zIndex = '1000';
    
    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.background = '#eee';
        separator.style.margin = '4px 0';
        menu.appendChild(separator);
      } else {
        const menuItem = this.renderMenuItem(item);
        menu.appendChild(menuItem);
      }
    });
    
    return menu;
  }
  
  private renderMenuItem(item: IMenuItem): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.style.padding = '8px 16px';
    menuItem.style.cursor = 'pointer';
    menuItem.style.display = 'flex';
    menuItem.style.alignItems = 'center';
    menuItem.style.gap = '8px';
    
    // 图标
    if (item.icon) {
      const icon = document.createElement('span');
      icon.textContent = item.icon;
      menuItem.appendChild(icon);
    }
    
    // 标签
    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.flex = '1';
    menuItem.appendChild(label);
    
    // 子菜单指示器
    if (item.children) {
      const arrow = document.createElement('span');
      arrow.textContent = '▶';
      arrow.style.fontSize = '12px';
      menuItem.appendChild(arrow);
    }
    
    // 悬停效果
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = '#f5f5f5';
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
    });
    
    // 点击事件
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!item.children) {
        item.action(null, this.api);
        this.hide();
      }
    });
    
    return menuItem;
  }
}
```

### 高级实现（支持子菜单）

```typescript
class AdvancedContextMenuProvider implements IContextMenuProvider {
  private menu: HTMLElement | null = null;
  private submenus: HTMLElement[] = [];
  private api: IMarkmapAPI;
  
  items: IMenuItem[] = [
    // ... 菜单项配置
  ];
  
  constructor(api: IMarkmapAPI) {
    this.api = api;
  }
  
  show(node: INode | null, position: IPosition): void {
    this.hide();
    
    this.menu = this.render(this.items, node);
    this.menu.style.position = 'fixed';
    this.menu.style.left = `${position.x}px`;
    this.menu.style.top = `${position.y}px`;
    
    // 确保菜单在视口内
    document.body.appendChild(this.menu);
    this.adjustPosition(this.menu, position);
    
    // 点击外部关闭
    setTimeout(() => {
      document.addEventListener('click', () => this.hide(), { once: true });
    }, 0);
  }
  
  hide(): void {
    this.submenus.forEach(submenu => submenu.remove());
    this.submenus = [];
    
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }
  
  render(items: IMenuItem[], node: INode | null): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'advanced-context-menu';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '6px';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    menu.style.padding = '6px 0';
    menu.style.minWidth = '220px';
    menu.style.zIndex = '1000';
    
    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.background = '#e8e8e8';
        separator.style.margin = '6px 12px';
        menu.appendChild(separator);
      } else {
        const isDisabled = typeof item.disabled === 'function' 
          ? item.disabled(node) 
          : item.disabled;
          
        if (!isDisabled) {
          const menuItem = this.renderMenuItem(item, node);
          menu.appendChild(menuItem);
        }
      }
    });
    
    return menu;
  }
  
  private renderMenuItem(item: IMenuItem, node: INode | null): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.style.padding = '10px 16px';
    menuItem.style.cursor = 'pointer';
    menuItem.style.display = 'flex';
    menuItem.style.alignItems = 'center';
    menuItem.style.gap = '12px';
    menuItem.style.transition = 'background 0.2s';
    
    // 图标
    if (item.icon) {
      const icon = document.createElement('span');
      icon.textContent = item.icon;
      icon.style.fontSize = '16px';
      icon.style.width = '20px';
      icon.style.textAlign = 'center';
      menuItem.appendChild(icon);
    }
    
    // 标签
    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.flex = '1';
    label.style.fontSize = '14px';
    menuItem.appendChild(label);
    
    // 子菜单指示器
    if (item.children) {
      const arrow = document.createElement('span');
      arrow.textContent = '▶';
      arrow.style.fontSize = '10px';
      arrow.style.color = '#999';
      menuItem.appendChild(arrow);
      
      // 子菜单逻辑
      menuItem.addEventListener('mouseenter', () => {
        const rect = menuItem.getBoundingClientRect();
        const submenu = this.render(item.children!, node);
        submenu.style.position = 'fixed';
        submenu.style.left = `${rect.right}px`;
        submenu.style.top = `${rect.top}px`;
        
        document.body.appendChild(submenu);
        this.submenus.push(submenu);
      });
      
      menuItem.addEventListener('mouseleave', () => {
        // 延迟关闭子菜单，允许鼠标移动到子菜单
        setTimeout(() => {
          if (this.submenus.length > 0) {
            const lastSubmenu = this.submenus.pop();
            lastSubmenu?.remove();
          }
        }, 100);
      });
    }
    
    // 悬停效果
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = '#f0f0f0';
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
    });
    
    // 点击事件
    if (!item.children) {
      menuItem.addEventListener('click', async (e) => {
        e.stopPropagation();
        await item.action(node, this.api);
        this.hide();
      });
    }
    
    return menuItem;
  }
  
  private adjustPosition(menu: HTMLElement, position: IPosition): void {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 调整水平位置
    if (rect.right > viewportWidth) {
      menu.style.left = `${viewportWidth - rect.width - 10}px`;
    }
    
    // 调整垂直位置
    if (rect.bottom > viewportHeight) {
      menu.style.top = `${viewportHeight - rect.height - 10}px`;
    }
  }
}
```


## 实现自定义工具栏 Provider

### IToolbarProvider 接口

```typescript
interface IToolbarProvider {
  // 工具项配置
  tools: IToolItem[];
  
  // 渲染工具栏
  render(container: HTMLElement, api: IMarkmapAPI): void;
  
  // 更新工具状态
  updateToolState(toolId: string, state: any): void;
}

interface IToolItem {
  id: string;
  label: string;
  icon?: string;
  type: 'button' | 'dropdown' | 'toggle';
  action: (api: IMarkmapAPI) => void | Promise<void>;
  options?: any[];
  disabled?: boolean;
}
```

### 基础实现

```typescript
class CustomToolbarProvider implements IToolbarProvider {
  private toolbar: HTMLElement | null = null;
  private toolElements: Map<string, HTMLElement> = new Map();
  
  tools: IToolItem[] = [
    {
      id: 'fit',
      label: '适应视图',
      icon: '🔍',
      type: 'button',
      action: (api) => api.fit()
    },
    {
      id: 'expand-all',
      label: '展开全部',
      icon: '➕',
      type: 'button',
      action: (api) => api.expandAll()
    },
    {
      id: 'collapse-all',
      label: '折叠全部',
      icon: '➖',
      type: 'button',
      action: (api) => api.collapseAll()
    },
    {
      id: 'export',
      label: '导出',
      icon: '💾',
      type: 'dropdown',
      options: ['SVG', 'PNG', 'Markdown'],
      action: (api) => {
        // 下拉菜单的默认操作
      }
    }
  ];
  
  render(container: HTMLElement, api: IMarkmapAPI): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'custom-toolbar';
    this.toolbar.style.display = 'flex';
    this.toolbar.style.gap = '8px';
    this.toolbar.style.padding = '12px';
    this.toolbar.style.background = 'white';
    this.toolbar.style.borderBottom = '1px solid #ddd';
    
    this.tools.forEach(tool => {
      const toolElement = this.renderTool(tool, api);
      this.toolbar!.appendChild(toolElement);
      this.toolElements.set(tool.id, toolElement);
    });
    
    container.appendChild(this.toolbar);
  }
  
  updateToolState(toolId: string, state: any): void {
    const toolElement = this.toolElements.get(toolId);
    if (toolElement) {
      // 更新工具状态（例如禁用/启用）
      if (state.disabled !== undefined) {
        const button = toolElement.querySelector('button');
        if (button) {
          button.disabled = state.disabled;
          button.style.opacity = state.disabled ? '0.5' : '1';
        }
      }
    }
  }
  
  private renderTool(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tool-item';
    
    if (tool.type === 'button') {
      const button = document.createElement('button');
      button.className = 'tool-button';
      button.title = tool.label;
      button.style.padding = '8px 12px';
      button.style.border = '1px solid #ddd';
      button.style.borderRadius = '4px';
      button.style.background = 'white';
      button.style.cursor = 'pointer';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.gap = '6px';
      button.style.transition = 'all 0.2s';
      
      if (tool.icon) {
        const icon = document.createElement('span');
        icon.textContent = tool.icon;
        button.appendChild(icon);
      }
      
      const label = document.createElement('span');
      label.textContent = tool.label;
      button.appendChild(label);
      
      button.addEventListener('mouseenter', () => {
        button.style.background = '#f5f5f5';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'white';
      });
      
      button.addEventListener('click', () => {
        tool.action(api);
      });
      
      container.appendChild(button);
    } else if (tool.type === 'dropdown') {
      const dropdown = this.renderDropdown(tool, api);
      container.appendChild(dropdown);
    } else if (tool.type === 'toggle') {
      const toggle = this.renderToggle(tool, api);
      container.appendChild(toggle);
    }
    
    return container;
  }
  
  private renderDropdown(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.style.position = 'relative';
    
    const button = document.createElement('button');
    button.textContent = `${tool.icon || ''} ${tool.label} ▼`;
    button.style.padding = '8px 12px';
    button.style.border = '1px solid #ddd';
    button.style.borderRadius = '4px';
    button.style.background = 'white';
    button.style.cursor = 'pointer';
    
    const menu = document.createElement('div');
    menu.style.display = 'none';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '0';
    menu.style.marginTop = '4px';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ddd';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    menu.style.minWidth = '150px';
    menu.style.zIndex = '100';
    
    tool.options?.forEach(option => {
      const item = document.createElement('div');
      item.textContent = option;
      item.style.padding = '8px 12px';
      item.style.cursor = 'pointer';
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f5f5f5';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = 'white';
      });
      
      item.addEventListener('click', () => {
        // 处理选项点击
        menu.style.display = 'none';
      });
      
      menu.appendChild(item);
    });
    
    button.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    
    dropdown.appendChild(button);
    dropdown.appendChild(menu);
    
    return dropdown;
  }
  
  private renderToggle(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    const toggle = document.createElement('label');
    toggle.style.display = 'flex';
    toggle.style.alignItems = 'center';
    toggle.style.gap = '8px';
    toggle.style.cursor = 'pointer';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cursor = 'pointer';
    
    checkbox.addEventListener('change', () => {
      tool.action(api);
    });
    
    const label = document.createElement('span');
    label.textContent = tool.label;
    
    toggle.appendChild(checkbox);
    toggle.appendChild(label);
    
    return toggle;
  }
}
```

## 注册和使用自定义 Provider

### 使用依赖注入容器

```typescript
import { 
  MarkmapCore, 
  MarkmapAPI, 
  EventEmitter, 
  DIContainer, 
  ServiceLifetime 
} from 'markmap-core';

// 1. 创建核心组件
const svg = document.querySelector('#markmap');
const core = new MarkmapCore(svg);
const eventEmitter = new EventEmitter();
const api = new MarkmapAPI(core, eventEmitter);

// 2. 创建依赖注入容器
const container = new DIContainer();

// 3. 注册核心服务
container.register('core', core, ServiceLifetime.Singleton);
container.register('eventEmitter', eventEmitter, ServiceLifetime.Singleton);
container.register('api', api, ServiceLifetime.Singleton);

// 4. 创建和注册自定义 Provider
const customNoteProvider = new CustomNoteProvider();
const customMenuProvider = new CustomContextMenuProvider(api);
const customToolbarProvider = new CustomToolbarProvider();

container.register('noteProvider', customNoteProvider, ServiceLifetime.Singleton);
container.register('menuProvider', customMenuProvider, ServiceLifetime.Singleton);
container.register('toolbarProvider', customToolbarProvider, ServiceLifetime.Singleton);

// 5. 使用 Provider
const noteProvider = container.resolve<INoteProvider>('noteProvider');
const menuProvider = container.resolve<IContextMenuProvider>('menuProvider');
const toolbarProvider = container.resolve<IToolbarProvider>('toolbarProvider');

// 6. 初始化 UI
if (toolbarProvider) {
  const toolbarContainer = document.querySelector('#toolbar');
  toolbarProvider.render(toolbarContainer, api);
}

// 7. 加载数据
api.setData(data);
```

### 混合使用默认和自定义 Provider

```typescript
import { DefaultNoteProvider } from 'markmap-ui-default';

// 使用默认备注 Provider
const defaultNoteProvider = new DefaultNoteProvider();
container.register('noteProvider', defaultNoteProvider, ServiceLifetime.Singleton);

// 使用自定义菜单 Provider
const customMenuProvider = new CustomContextMenuProvider(api);
container.register('menuProvider', customMenuProvider, ServiceLifetime.Singleton);

// 使用自定义工具栏 Provider
const customToolbarProvider = new CustomToolbarProvider();
container.register('toolbarProvider', customToolbarProvider, ServiceLifetime.Singleton);
```

## 最佳实践

### 1. 样式隔离

使用 CSS 类名前缀避免样式冲突：

```typescript
class CustomNoteProvider implements INoteProvider {
  private readonly CSS_PREFIX = 'my-app-note';
  
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement {
    const icon = document.createElement('span');
    icon.className = `${this.CSS_PREFIX}-icon`;
    // ...
    return icon;
  }
}
```

### 2. 事件清理

在 Provider 销毁时清理事件监听器：

```typescript
class CustomNoteProvider implements INoteProvider {
  private listeners: Array<{ element: HTMLElement; event: string; handler: Function }> = [];
  
  renderNoteIcon(node: INode, container: HTMLElement): HTMLElement {
    const icon = document.createElement('span');
    
    const clickHandler = (e: Event) => {
      // 处理点击
    };
    
    icon.addEventListener('click', clickHandler as EventListener);
    this.listeners.push({ element: icon, event: 'click', handler: clickHandler });
    
    return icon;
  }
  
  destroy(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler as EventListener);
    });
    this.listeners = [];
  }
}
```

### 3. 响应式设计

确保 UI 在不同屏幕尺寸下正常工作：

```typescript
class ResponsiveToolbarProvider implements IToolbarProvider {
  render(container: HTMLElement, api: IMarkmapAPI): void {
    const toolbar = document.createElement('div');
    
    // 使用媒体查询或 ResizeObserver
    const updateLayout = () => {
      if (window.innerWidth < 768) {
        toolbar.style.flexDirection = 'column';
      } else {
        toolbar.style.flexDirection = 'row';
      }
    };
    
    window.addEventListener('resize', updateLayout);
    updateLayout();
    
    container.appendChild(toolbar);
  }
}
```

### 4. 可访问性

添加适当的 ARIA 属性：

```typescript
renderNoteIcon(node: INode, container: HTMLElement): HTMLElement {
  const icon = document.createElement('button');
  icon.setAttribute('aria-label', '编辑备注');
  icon.setAttribute('role', 'button');
  icon.setAttribute('tabindex', '0');
  
  // 支持键盘操作
  icon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // 触发操作
    }
  });
  
  return icon;
}
```

### 5. 错误处理

妥善处理错误情况：

```typescript
class SafeNoteProvider implements INoteProvider {
  showNotePanel(node: INode, position: IPosition): void {
    try {
      // 创建面板逻辑
    } catch (error) {
      console.error('显示备注面板失败:', error);
      // 显示用户友好的错误消息
      this.showErrorMessage('无法显示备注面板');
    }
  }
  
  private showErrorMessage(message: string): void {
    // 显示错误提示
  }
}
```

## 完整示例

### 创建一个完整的自定义 UI 系统

```typescript
// custom-ui.ts
import {
  MarkmapCore,
  MarkmapAPI,
  EventEmitter,
  DIContainer,
  ServiceLifetime
} from 'markmap-core';
import type { INoteProvider, IContextMenuProvider, IToolbarProvider } from 'markmap-interfaces';

// 自定义主题配置
interface CustomTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

class CustomUISystem {
  private container: DIContainer;
  private core: MarkmapCore;
  private api: MarkmapAPI;
  private eventEmitter: EventEmitter;
  private theme: CustomTheme;
  
  constructor(svg: SVGElement, theme?: Partial<CustomTheme>) {
    this.theme = {
      primaryColor: '#5e7ce0',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#dddddd',
      ...theme
    };
    
    // 初始化核心组件
    this.core = new MarkmapCore(svg);
    this.eventEmitter = new EventEmitter();
    this.api = new MarkmapAPI(this.core, this.eventEmitter);
    
    // 创建容器
    this.container = new DIContainer();
    this.registerServices();
    this.setupEventListeners();
  }
  
  private registerServices(): void {
    // 注册核心服务
    this.container.register('core', this.core, ServiceLifetime.Singleton);
    this.container.register('api', this.api, ServiceLifetime.Singleton);
    this.container.register('eventEmitter', this.eventEmitter, ServiceLifetime.Singleton);
    
    // 注册自定义 Provider
    const noteProvider = new ThemedNoteProvider(this.theme);
    const menuProvider = new ThemedContextMenuProvider(this.api, this.theme);
    const toolbarProvider = new ThemedToolbarProvider(this.theme);
    
    this.container.register('noteProvider', noteProvider, ServiceLifetime.Singleton);
    this.container.register('menuProvider', menuProvider, ServiceLifetime.Singleton);
    this.container.register('toolbarProvider', toolbarProvider, ServiceLifetime.Singleton);
  }
  
  private setupEventListeners(): void {
    // 监听数据变化
    this.eventEmitter.on('data:change', (data) => {
      console.log('数据已更新');
    });
    
    // 监听错误
    this.eventEmitter.on('error', (error) => {
      console.error('Markmap 错误:', error);
    });
  }
  
  // 公共 API
  getAPI(): MarkmapAPI {
    return this.api;
  }
  
  getContainer(): DIContainer {
    return this.container;
  }
  
  setData(data: INode): void {
    this.api.setData(data);
  }
  
  destroy(): void {
    // 清理资源
    this.container.clear();
  }
}

// 使用示例
const svg = document.querySelector('#markmap');
const customUI = new CustomUISystem(svg, {
  primaryColor: '#f66f6a',
  backgroundColor: '#fafafa'
});

// 加载数据
customUI.setData(myData);

// 获取 API 进行操作
const api = customUI.getAPI();
api.fit();
```

## 相关资源

- [API 文档](./API_DOCUMENTATION.md)
- [示例集合](./examples/)
- [默认 UI 实现](./packages/markmap-ui-default/)

## 许可证

MIT License
