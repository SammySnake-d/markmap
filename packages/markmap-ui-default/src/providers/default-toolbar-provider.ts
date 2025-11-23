import type { IMarkmapAPI } from 'markmap-interfaces/src/core/markmap-api';
import type {
  IToolbarProvider,
  IToolItem,
} from 'markmap-interfaces/src/providers/toolbar-provider';

/**
 * DefaultToolbarProvider - 默认工具栏实现
 *
 * 实现 IToolbarProvider 接口，提供常用的工具栏功能
 *
 * Requirements:
 * - 6.1: 自定义工具栏渲染
 * - 6.2: 工具项配置系统
 * - 6.3: 状态同步机制
 * - 9.3: 提供默认工具栏实现
 */
export class DefaultToolbarProvider implements IToolbarProvider {
  private container: HTMLElement | null = null;
  private toolElements: Map<string, HTMLElement> = new Map();
  private currentApi: IMarkmapAPI | null = null;

  /**
   * 默认工具项配置
   */
  tools: IToolItem[] = [
    {
      id: 'fit',
      label: '适应视图',
      icon: '🔍',
      type: 'button',
      tooltip: '调整视图以适应所有内容',
      action: async (api) => {
        await api.fit();
      },
    },
    {
      id: 'expand-all',
      label: '全部展开',
      icon: '➕',
      type: 'button',
      tooltip: '展开所有节点',
      action: async (api) => {
        await api.expandAll();
      },
    },
    {
      id: 'collapse-all',
      label: '全部折叠',
      icon: '➖',
      type: 'button',
      tooltip: '折叠所有节点',
      action: async (api) => {
        await api.collapseAll();
      },
    },
    {
      id: 'export',
      label: '导出',
      icon: '💾',
      type: 'dropdown',
      tooltip: '导出思维导图',
      options: [
        { label: 'PNG 图片', value: 'png' },
        { label: 'SVG 图片', value: 'svg' },
        { label: 'Markdown', value: 'markdown' },
      ],
      action: async (api, value) => {
        switch (value) {
          case 'png':
            await api.exportAsPNG();
            break;
          case 'svg': {
            const svg = await api.exportAsSVG();
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'markmap.svg';
            a.click();
            URL.revokeObjectURL(url);
            break;
          }
          case 'markdown': {
            const markdown = await api.exportAsMarkdown();
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'markmap.md';
            a.click();
            URL.revokeObjectURL(url);
            break;
          }
        }
      },
    },
  ];

  constructor(customTools?: IToolItem[]) {
    if (customTools) {
      this.tools = customTools;
    }
  }

  /**
   * 渲染工具栏
   *
   * Requirements:
   * - 6.1: 在指定容器中渲染工具栏
   * - 6.2: 根据工具项配置创建 UI
   */
  render(container: HTMLElement, api: IMarkmapAPI): void {
    this.container = container;
    this.currentApi = api;
    this.toolElements.clear();

    // 创建工具栏容器
    const toolbar = document.createElement('div');
    toolbar.className = 'markmap-toolbar';
    toolbar.style.cssText = `
      display: flex;
      gap: 8px;
      padding: 8px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    // 渲染每个工具项
    this.tools.forEach((tool) => {
      const toolElement = this.renderTool(tool, api);
      toolbar.appendChild(toolElement);
      this.toolElements.set(tool.id, toolElement);
    });

    // 清空容器并添加工具栏
    container.innerHTML = '';
    container.appendChild(toolbar);
  }

  /**
   * 渲染单个工具项
   */
  private renderTool(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    switch (tool.type) {
      case 'button':
        return this.renderButton(tool, api);
      case 'dropdown':
        return this.renderDropdown(tool, api);
      case 'toggle':
        return this.renderToggle(tool, api);
      default:
        return this.renderButton(tool, api);
    }
  }

  /**
   * 渲染按钮类型工具
   */
  private renderButton(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    const button = document.createElement('button');
    button.className = 'markmap-toolbar-button';
    button.dataset.toolId = tool.id;
    button.disabled = tool.disabled || false;
    button.title = tool.tooltip || tool.label;
    button.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: white;
      cursor: ${tool.disabled ? 'not-allowed' : 'pointer'};
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      opacity: ${tool.disabled ? '0.5' : '1'};
    `;

    // 添加图标
    if (tool.icon) {
      const icon = document.createElement('span');
      icon.textContent = tool.icon;
      button.appendChild(icon);
    }

    // 添加标签
    const label = document.createElement('span');
    label.textContent = tool.label;
    button.appendChild(label);

    // 悬停效果
    if (!tool.disabled) {
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#f5f5f5';
        button.style.borderColor = '#999';
      });
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'white';
        button.style.borderColor = '#d0d0d0';
      });

      // 点击事件
      button.addEventListener('click', async () => {
        try {
          await tool.action(api);
        } catch (error) {
          console.error('Tool action failed:', error);
        }
      });
    }

    return button;
  }

  /**
   * 渲染下拉选择类型工具
   */
  private renderDropdown(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    const container = document.createElement('div');
    container.className = 'markmap-toolbar-dropdown';
    container.dataset.toolId = tool.id;
    container.style.cssText = `
      position: relative;
      display: inline-block;
    `;

    // 创建按钮
    const button = document.createElement('button');
    button.disabled = tool.disabled || false;
    button.title = tool.tooltip || tool.label;
    button.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: white;
      cursor: ${tool.disabled ? 'not-allowed' : 'pointer'};
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: ${tool.disabled ? '0.5' : '1'};
    `;

    // 添加图标
    if (tool.icon) {
      const icon = document.createElement('span');
      icon.textContent = tool.icon;
      button.appendChild(icon);
    }

    // 添加标签
    const label = document.createElement('span');
    label.textContent = tool.label;
    button.appendChild(label);

    // 添加下拉箭头
    const arrow = document.createElement('span');
    arrow.textContent = '▼';
    arrow.style.fontSize = '10px';
    button.appendChild(arrow);

    // 创建下拉菜单
    const dropdown = document.createElement('div');
    dropdown.className = 'markmap-toolbar-dropdown-menu';
    dropdown.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 150px;
    `;

    // 添加选项
    if (tool.options) {
      tool.options.forEach((option) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'markmap-toolbar-dropdown-option';
        optionElement.textContent = option.label;
        optionElement.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
        `;

        optionElement.addEventListener('mouseenter', () => {
          optionElement.style.backgroundColor = '#f5f5f5';
        });
        optionElement.addEventListener('mouseleave', () => {
          optionElement.style.backgroundColor = 'white';
        });

        optionElement.addEventListener('click', async () => {
          try {
            await tool.action(api, option.value);
          } catch (error) {
            console.error('Tool action failed:', error);
          }
          dropdown.style.display = 'none';
        });

        dropdown.appendChild(optionElement);
      });
    }

    // 按钮点击切换下拉菜单
    if (!tool.disabled) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display =
          dropdown.style.display === 'none' ? 'block' : 'none';
      });

      // 点击外部关闭下拉菜单
      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
      });
    }

    container.appendChild(button);
    container.appendChild(dropdown);

    return container;
  }

  /**
   * 渲染开关类型工具
   */
  private renderToggle(tool: IToolItem, api: IMarkmapAPI): HTMLElement {
    const button = document.createElement('button');
    button.className = 'markmap-toolbar-toggle';
    button.dataset.toolId = tool.id;
    button.disabled = tool.disabled || false;
    button.title = tool.tooltip || tool.label;
    button.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: white;
      cursor: ${tool.disabled ? 'not-allowed' : 'pointer'};
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      opacity: ${tool.disabled ? '0.5' : '1'};
    `;

    // 添加图标
    if (tool.icon) {
      const icon = document.createElement('span');
      icon.textContent = tool.icon;
      button.appendChild(icon);
    }

    // 添加标签
    const label = document.createElement('span');
    label.textContent = tool.label;
    button.appendChild(label);

    // 切换状态
    let isActive = false;

    if (!tool.disabled) {
      button.addEventListener('click', async () => {
        isActive = !isActive;
        button.style.backgroundColor = isActive ? '#e3f2fd' : 'white';
        button.style.borderColor = isActive ? '#2196f3' : '#d0d0d0';

        try {
          await tool.action(api, isActive);
        } catch (error) {
          console.error('Tool action failed:', error);
        }
      });
    }

    return button;
  }

  /**
   * 更新工具状态
   *
   * Requirements:
   * - 6.3: 当 Markmap 状态变化时同步工具栏显示
   */
  updateToolState(toolId: string, state: any): void {
    const toolElement = this.toolElements.get(toolId);
    if (!toolElement) return;

    // 更新禁用状态
    if (state.disabled !== undefined) {
      const button = toolElement.querySelector('button') || toolElement;
      if (button instanceof HTMLButtonElement) {
        button.disabled = state.disabled;
        button.style.opacity = state.disabled ? '0.5' : '1';
        button.style.cursor = state.disabled ? 'not-allowed' : 'pointer';
      }
    }

    // 更新激活状态（用于 toggle 类型）
    if (state.active !== undefined) {
      const button = toolElement.querySelector('button') || toolElement;
      if (button instanceof HTMLElement) {
        button.style.backgroundColor = state.active ? '#e3f2fd' : 'white';
        button.style.borderColor = state.active ? '#2196f3' : '#d0d0d0';
      }
    }

    // 更新标签
    if (state.label !== undefined) {
      const labelElement = toolElement.querySelector('span:last-child');
      if (labelElement) {
        labelElement.textContent = state.label;
      }
    }
  }

  /**
   * 销毁工具栏并清理资源
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.toolElements.clear();
    this.currentApi = null;
  }
}
