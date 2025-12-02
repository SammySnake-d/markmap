import type { INode } from 'markmap-interfaces/src/models/node';
import type { IPosition } from 'markmap-interfaces/src/models/position';
import type { IMarkmapAPI } from 'markmap-interfaces/src/core/markmap-api';
import type {
  IContextMenuProvider,
  IMenuItem,
} from 'markmap-interfaces/src/providers/context-menu-provider';

/**
 * DefaultContextMenuProvider - 默认右键菜单实现
 *
 * 从 markmap-view 提取的右键菜单功能，实现 IContextMenuProvider 接口
 *
 * Requirements:
 * - 5.1: 自定义右键菜单渲染
 * - 5.2: 显示菜单并传递节点数据和位置
 * - 5.3: 支持菜单项配置和子菜单
 * - 9.2: 提供默认右键菜单实现
 */
export class DefaultContextMenuProvider implements IContextMenuProvider {
  private container: HTMLDivElement | null = null;
  private currentNode: INode | null = null;
  private currentApi: IMarkmapAPI | null = null;

  /**
   * 默认菜单项配置
   */
  items: IMenuItem[] = [
    {
      id: 'expand-all',
      label: '展开全部',
      icon: '➕',
      action: async (node, api) => {
        if (node) {
          const nodeId = (
            node.payload as Record<string, unknown>
          )?.id?.toString();
          if (nodeId) {
            api.expandAll(nodeId);
          }
        }
      },
    },
    {
      id: 'collapse-all',
      label: '折叠全部',
      icon: '➖',
      action: async (node, api) => {
        if (node) {
          const nodeId = (
            node.payload as Record<string, unknown>
          )?.id?.toString();
          if (nodeId) {
            api.collapseAll(nodeId);
          }
        }
      },
    },
  ];

  /**
   * 画布级别的菜单项（当 node 为 null 时使用）
   * 注意：导出功能需要通过 Markmap 实例调用，不在 IMarkmapAPI 接口中
   * 如需导出功能，请在创建 DefaultContextMenuProvider 时传入自定义 items
   */
  private canvasItems: IMenuItem[] = [
    {
      id: 'fit-view',
      label: '适应视图',
      icon: '🔍',
      action: async (_node, api) => {
        api.fit();
      },
    },
    {
      id: 'expand-all-global',
      label: '全部展开',
      icon: '➕',
      action: async (_node, api) => {
        api.expandAll();
      },
    },
    {
      id: 'collapse-all-global',
      label: '全部折叠',
      icon: '➖',
      action: async (_node, api) => {
        api.collapseAll();
      },
    },
  ];

  constructor(customItems?: IMenuItem[]) {
    if (customItems) {
      this.items = customItems;
    }
    this.setupEventListeners();
  }

  /**
   * 设置全局事件监听器
   */
  private setupEventListeners(): void {
    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (this.container && !this.container.contains(e.target as Node)) {
        this.hide();
      }
    });

    // ESC 键关闭菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  /**
   * 显示右键菜单
   *
   * Requirements:
   * - 5.2: 在指定位置显示菜单，传递节点数据
   */
  show(node: INode | null, position: IPosition, api: IMarkmapAPI): void {
    this.currentNode = node;
    this.currentApi = api;

    // 选择合适的菜单项
    const menuItems = node ? this.items : this.canvasItems;

    // 渲染菜单
    const menu = this.render(menuItems, node, api);

    // 设置位置
    menu.style.left = `${position.x}px`;
    menu.style.top = `${position.y}px`;

    // 添加到文档
    document.body.appendChild(menu);
    this.container = menu;

    // 调整位置以保持在视口内
    this.adjustPosition();
  }

  /**
   * 隐藏右键菜单
   */
  hide(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.currentNode = null;
    this.currentApi = null;
  }

  /**
   * 渲染菜单
   *
   * Requirements:
   * - 5.1: 自定义菜单渲染，支持图标、分隔符和子菜单
   * - 5.3: 支持菜单项配置系统
   */
  render(
    items: IMenuItem[],
    node: INode | null,
    api: IMarkmapAPI,
  ): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'markmap-context-menu';
    menu.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      z-index: 10000;
      min-width: 180px;
    `;

    items.forEach((item) => {
      // 渲染分隔符
      if (item.separator) {
        const separator = document.createElement('hr');
        separator.style.cssText = `
          margin: 4px 0;
          border: none;
          border-top: 1px solid #e0e0e0;
        `;
        menu.appendChild(separator);
        return;
      }

      // 检查是否禁用
      const isDisabled =
        typeof item.disabled === 'function'
          ? item.disabled(node)
          : item.disabled || false;

      // 创建菜单项
      const menuItem = document.createElement('div');
      menuItem.className = 'markmap-context-menu-item';
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: ${isDisabled ? '#999' : '#333'};
        opacity: ${isDisabled ? '0.5' : '1'};
      `;

      // 添加图标
      if (item.icon) {
        const icon = document.createElement('span');
        icon.style.fontSize = '16px';
        icon.textContent = item.icon;
        menuItem.appendChild(icon);
      }

      // 添加标签
      const label = document.createElement('span');
      label.textContent = item.label;
      menuItem.appendChild(label);

      // 如果有子菜单，添加箭头
      if (item.children && item.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.textContent = '▶';
        arrow.style.marginLeft = 'auto';
        menuItem.appendChild(arrow);
      }

      // 悬停效果
      if (!isDisabled) {
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.backgroundColor = '#f5f5f5';
        });
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.backgroundColor = 'transparent';
        });

        // 点击事件
        menuItem.addEventListener('click', async (e) => {
          e.stopPropagation();

          // 如果有子菜单，显示子菜单
          if (item.children && item.children.length > 0) {
            // TODO: 实现子菜单显示逻辑
            return;
          }

          // 执行操作
          try {
            await item.action(node, api);
          } catch (error) {
            console.error('Menu action failed:', error);
          }

          // 关闭菜单
          this.hide();
        });
      }

      menu.appendChild(menuItem);
    });

    return menu;
  }

  /**
   * 调整菜单位置以保持在视口内
   */
  private adjustPosition(): void {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = parseFloat(this.container.style.left);
    let top = parseFloat(this.container.style.top);

    // 调整水平位置
    if (rect.right > viewportWidth) {
      left = viewportWidth - rect.width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    // 调整垂直位置
    if (rect.bottom > viewportHeight) {
      top = viewportHeight - rect.height - 10;
    }
    if (top < 10) {
      top = 10;
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  /**
   * 销毁 Provider 并清理资源
   */
  destroy(): void {
    this.hide();
  }
}
