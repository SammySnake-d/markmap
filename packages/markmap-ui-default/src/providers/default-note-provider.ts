import type { INode } from 'markmap-interfaces/src/models/node';
import type { IPosition } from 'markmap-interfaces/src/models/position';
import type { IMarkmapAPI } from 'markmap-interfaces/src/core/markmap-api';
import type { INoteProvider } from 'markmap-interfaces/src/providers/note-provider';

/**
 * DefaultNoteProvider - 默认备注系统实现
 *
 * 从 markmap-view 提取的备注功能，实现 INoteProvider 接口
 *
 * Requirements:
 * - 4.1: 自定义备注图标渲染
 * - 4.2: 显示备注面板
 * - 9.1: 提供默认UI实现
 */
export class DefaultNoteProvider implements INoteProvider {
  private panel: HTMLDivElement | null = null;
  private currentNode: INode | null = null;
  private currentApi: IMarkmapAPI | null = null;

  /**
   * 渲染备注图标
   *
   * Requirements:
   * - 4.1: 当节点包含备注时，渲染可点击的图标
   */
  renderNoteIcon(
    node: INode,
    container: HTMLElement,
    api: IMarkmapAPI,
  ): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'markmap-note-icon';
    icon.textContent = '📝';
    icon.title = '点击查看备注';
    icon.style.cssText = `
      cursor: pointer;
      margin-left: 8px;
      font-size: 14px;
      opacity: 0.7;
      user-select: none;
    `;

    // 点击图标显示备注面板
    icon.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      const mouseEvent = e as MouseEvent;
      this.showNotePanel(
        node,
        { x: mouseEvent.clientX, y: mouseEvent.clientY },
        api,
      );
    });

    return icon;
  }

  /**
   * 显示备注面板
   *
   * Requirements:
   * - 4.2: 在指定位置显示备注面板，允许编辑
   */
  showNotePanel(node: INode, position: IPosition, api: IMarkmapAPI): void {
    // 如果面板已经显示且是同一个节点，则隐藏
    if (this.currentNode === node && this.panel) {
      this.hideNotePanel();
      return;
    }

    // 隐藏现有面板
    this.hideWithoutCallback();

    this.currentNode = node;
    this.currentApi = api;

    // 创建面板元素
    this.panel = document.createElement('div');
    this.panel.className = 'markmap-note-panel';
    this.panel.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      z-index: 10000;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      min-width: 300px;
      max-width: 500px;
      max-height: 400px;
      overflow: auto;
    `;

    // 获取备注数据
    const inlineNote = (node as any).inlineNote || '';
    const detailedNote = (node as any).detailedNote || '';

    // 合并备注内容
    let combinedNote = '';
    if (inlineNote && detailedNote) {
      combinedNote = `${inlineNote}\n\n${detailedNote}`;
    } else if (inlineNote) {
      combinedNote = inlineNote;
    } else if (detailedNote) {
      combinedNote = detailedNote;
    }

    // 创建面板内容
    const html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">备注</h3>
        <button class="note-panel-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
      </div>
      
      <div>
        <textarea 
          class="note-panel-content" 
          placeholder="输入备注内容（支持多行）..."
          style="width: 100%; min-height: 200px; padding: 12px; border: 1px solid #d0d0d0; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical; line-height: 1.6;"
        >${this.escapeHtml(combinedNote)}</textarea>
      </div>
      
      <div style="margin-top: 12px; font-size: 12px; color: #999;">
        提示: 修改会自动保存
      </div>
    `;

    this.panel.innerHTML = html;

    // 添加事件监听器
    const closeBtn = this.panel.querySelector(
      '.note-panel-close',
    ) as HTMLButtonElement;
    const noteTextarea = this.panel.querySelector(
      '.note-panel-content',
    ) as HTMLTextAreaElement;

    closeBtn.addEventListener('click', () => this.hideNotePanel());

    // 自动保存
    const handleInput = () => {
      if (this.currentNode && this.onNoteChange && this.currentApi) {
        const content = noteTextarea.value.trim();

        // 解析内容：第一行为内联备注，其余为详细备注
        const lines = content.split('\n');
        const firstLine = lines[0] || '';
        const restLines = lines.slice(1).join('\n').trim();

        const inlineNote = firstLine;
        const detailedNote = restLines;

        // 更新节点数据
        (this.currentNode as any).inlineNote = inlineNote;
        (this.currentNode as any).detailedNote = detailedNote;
        (this.currentNode as any).hasNote = !!(inlineNote || detailedNote);

        // 调用回调
        if (this.onNoteChange) {
          this.onNoteChange(this.currentNode, content);
        }
      }
    };

    noteTextarea.addEventListener('input', handleInput);

    // 阻止事件冒泡
    this.panel.addEventListener('mousedown', (e) => e.stopPropagation());
    this.panel.addEventListener('click', (e) => e.stopPropagation());

    // 添加到文档
    document.body.appendChild(this.panel);

    // 调整位置
    this.adjustPosition();
  }

  /**
   * 隐藏备注面板
   *
   * Requirements:
   * - 4.2: 关闭备注面板
   */
  hideNotePanel(): void {
    this.hideWithoutCallback();
  }

  /**
   * 备注内容变化回调
   *
   * Requirements:
   * - 4.3: 当备注内容变化时通知系统
   */
  onNoteChange?(node: INode, note: string): void {
    // 默认实现：更新节点并触发重新渲染
    // 实际使用时可以被覆盖
    const nodeId = (node.payload as any).id;
    console.log('Note changed for node:', nodeId, note);
  }

  /**
   * 内部方法：隐藏面板但不触发回调
   */
  private hideWithoutCallback(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.currentNode = null;
    this.currentApi = null;
  }

  /**
   * 调整面板位置以保持在视口内
   */
  private adjustPosition(): void {
    if (!this.panel) return;

    const rect = this.panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = parseFloat(this.panel.style.left);
    let top = parseFloat(this.panel.style.top);

    // 调整水平位置
    if (rect.right > viewportWidth) {
      left = viewportWidth - rect.width - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // 调整垂直位置
    if (rect.bottom > viewportHeight) {
      top = viewportHeight - rect.height - 20;
    }
    if (top < 20) {
      top = 20;
    }

    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  /**
   * 转义 HTML 特殊字符
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 销毁 Provider 并清理资源
   */
  destroy(): void {
    this.hideNotePanel();
  }
}
