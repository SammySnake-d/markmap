import { mountDom } from '@gera2ld/jsx-dom';
import './search-box.css';

/**
 * SearchBox - 搜索框组件
 *
 * 提供实时搜索功能，用户输入时触发搜索回调
 *
 * Requirements: 9.3, 9.6
 */
export interface SearchBoxOptions {
  placeholder?: string;
  debounceMs?: number;
  showClearButton?: boolean;
}

export class SearchBox {
  private container: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private clearButton: HTMLElement | null = null;
  private options: SearchBoxOptions;
  private debounceTimer: number | null = null;

  // 回调函数
  onSearch: ((keyword: string) => void) | null = null;
  onClear: (() => void) | null = null;

  constructor(options: SearchBoxOptions = {}) {
    this.options = {
      placeholder: 'Search...',
      debounceMs: 300,
      showClearButton: true,
      ...options,
    };
  }

  /**
   * 渲染搜索框
   */
  render(): HTMLElement {
    const { placeholder, showClearButton } = this.options;

    // 创建搜索框容器
    this.container = mountDom(
      <div class="mm-search-box">
        <div class="mm-search-box-wrapper">
          {/* 搜索图标 */}
          <span class="mm-search-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
          </span>

          {/* 输入框 */}
          <input
            type="text"
            class="mm-search-input"
            placeholder={placeholder}
            onInput={(e) => this.handleInput(e)}
            onKeyDown={(e) => this.handleKeyDown(e)}
          />

          {/* 清除按钮 */}
          {showClearButton && (
            <button
              class="mm-search-clear"
              onClick={() => this.handleClear()}
              title="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          )}
        </div>
      </div>,
    ) as HTMLElement;

    // 保存输入框和清除按钮的引用
    this.input = this.container.querySelector(
      '.mm-search-input',
    ) as HTMLInputElement;
    this.clearButton = this.container.querySelector(
      '.mm-search-clear',
    ) as HTMLElement;

    // 设置清除按钮的初始隐藏状态
    if (this.clearButton) {
      this.clearButton.style.display = 'none';
    }

    return this.container;
  }

  /**
   * 处理输入事件
   */
  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const value = input.value.trim();

    // 显示或隐藏清除按钮
    this.updateClearButtonVisibility(value);

    // 使用防抖处理搜索
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      if (this.onSearch) {
        this.onSearch(value);
      }
      this.debounceTimer = null;
    }, this.options.debounceMs);
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.clear();
    }
  }

  /**
   * 处理清除按钮点击
   */
  private handleClear(): void {
    this.clear();
    if (this.onClear) {
      this.onClear();
    }
  }

  /**
   * 清除搜索框内容
   */
  clear(): void {
    if (this.input) {
      this.input.value = '';
      this.updateClearButtonVisibility('');

      // 立即触发搜索回调（清空搜索）
      if (this.onSearch) {
        this.onSearch('');
      }
    }
  }

  /**
   * 更新清除按钮的可见性
   */
  private updateClearButtonVisibility(value: string): void {
    if (this.clearButton) {
      this.clearButton.style.display = value ? 'flex' : 'none';
    }
  }

  /**
   * 获取当前搜索值
   */
  getValue(): string {
    return this.input?.value.trim() || '';
  }

  /**
   * 设置搜索值
   */
  setValue(value: string): void {
    if (this.input) {
      this.input.value = value;
      this.updateClearButtonVisibility(value);
    }
  }

  /**
   * 聚焦到搜索框
   */
  focus(): void {
    this.input?.focus();
  }

  /**
   * 销毁搜索框
   */
  destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.input = null;
    this.clearButton = null;
    this.onSearch = null;
    this.onClear = null;
  }
}
