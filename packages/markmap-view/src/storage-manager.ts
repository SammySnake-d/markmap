/**
 * StorageManager handles persistence of mindmap data and view state to localStorage.
 *
 * Requirements:
 * - 16.1: Auto-save Markdown content when modified
 * - 16.2: Load saved Markdown content and view state on app restart
 * - 16.3: Display warning and run in read-only mode when localStorage unavailable
 * - 16.6: Save undo/redo history to support undo/redo in standalone HTML
 */

export interface SerializedHistoryEntry {
  action: 'edit' | 'expand' | 'collapse';
  nodeId: string; // Store node ID instead of reference
  before: {
    inlineNote?: string;
    detailedNote?: string;
    fold?: number;
  };
  after: {
    inlineNote?: string;
    detailedNote?: string;
    fold?: number;
  };
  timestamp: number;
}

export interface StorageData {
  markdown?: string;
  viewState?: {
    transform?: {
      x: number;
      y: number;
      k: number;
    };
    expandedNodes?: string[];
  };
  history?: {
    undoStack?: SerializedHistoryEntry[];
    redoStack?: SerializedHistoryEntry[];
  };
  timestamp?: number;
}

export class StorageManager {
  private storageKey: string;
  private isAvailable: boolean;
  private readOnlyMode: boolean = false;

  constructor(storageKey: string = 'markmap-data') {
    this.storageKey = storageKey;
    this.isAvailable = this.checkStorageAvailability();

    if (!this.isAvailable) {
      this.readOnlyMode = true;
      this.showStorageWarning();
    }
  }

  /**
   * Check if localStorage is available.
   * Requirements: 16.3
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = '__markmap_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Show warning message when localStorage is unavailable.
   * Requirements: 16.3
   */
  private showStorageWarning(): void {
    console.warn(
      '[Markmap] localStorage is not available. Running in read-only mode. Changes will not be saved.',
    );

    // Create a visual warning banner if in browser environment
    if (typeof document !== 'undefined') {
      const banner = document.createElement('div');
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: #ff9800;
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 10000;
        font-family: sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      banner.textContent =
        '⚠️ Storage unavailable - Running in read-only mode. Changes will not be saved.';

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        margin-left: 10px;
        padding: 0 5px;
      `;
      closeBtn.onclick = () => banner.remove();
      banner.appendChild(closeBtn);

      document.body.appendChild(banner);
    }
  }

  /**
   * Check if storage is in read-only mode.
   * Requirements: 16.3
   */
  public isReadOnly(): boolean {
    return this.readOnlyMode;
  }

  /**
   * Save data to localStorage.
   * Requirements: 16.1
   *
   * @param data - Data to save
   * @returns true if save was successful, false otherwise
   */
  public save(data: StorageData): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const dataWithTimestamp = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataWithTimestamp));
      return true;
    } catch (e) {
      console.error('[Markmap] Failed to save data to localStorage:', e);
      return false;
    }
  }

  /**
   * Load data from localStorage.
   * Requirements: 16.2, 16.5
   *
   * @returns Saved data or null if not found or invalid
   */
  public load(): StorageData | null {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored) as StorageData;

      // Validate data integrity
      // Requirements: 16.5
      if (!this.validateData(data)) {
        console.warn(
          '[Markmap] Stored data is corrupted or invalid. Ignoring saved data.',
        );
        return null;
      }

      return data;
    } catch (e) {
      console.error('[Markmap] Failed to load data from localStorage:', e);
      return null;
    }
  }

  /**
   * Validate data integrity.
   * Requirements: 16.5, 16.6
   *
   * @param data - Data to validate
   * @returns true if data is valid, false otherwise
   */
  private validateData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if markdown is a string (if present)
    if (data.markdown !== undefined && typeof data.markdown !== 'string') {
      return false;
    }

    // Check if viewState has valid structure (if present)
    if (data.viewState !== undefined) {
      if (typeof data.viewState !== 'object' || data.viewState === null) {
        return false;
      }

      // Validate transform if present
      if (data.viewState.transform !== undefined) {
        const { transform } = data.viewState;
        if (
          typeof transform !== 'object' ||
          transform === null ||
          typeof transform.x !== 'number' ||
          typeof transform.y !== 'number' ||
          typeof transform.k !== 'number' ||
          !isFinite(transform.x) ||
          !isFinite(transform.y) ||
          !isFinite(transform.k)
        ) {
          return false;
        }
      }

      // Validate expandedNodes if present
      if (data.viewState.expandedNodes !== undefined) {
        if (!Array.isArray(data.viewState.expandedNodes)) {
          return false;
        }
        // Validate that all elements are strings
        for (const node of data.viewState.expandedNodes) {
          if (typeof node !== 'string') {
            return false;
          }
        }
      }
    }

    // Validate history if present
    // Requirements: 16.6
    if (data.history !== undefined) {
      if (typeof data.history !== 'object' || data.history === null) {
        return false;
      }

      // Validate undoStack if present
      if (data.history.undoStack !== undefined) {
        if (!Array.isArray(data.history.undoStack)) {
          return false;
        }
        for (const entry of data.history.undoStack) {
          if (!this.validateHistoryEntry(entry)) {
            return false;
          }
        }
      }

      // Validate redoStack if present
      if (data.history.redoStack !== undefined) {
        if (!Array.isArray(data.history.redoStack)) {
          return false;
        }
        for (const entry of data.history.redoStack) {
          if (!this.validateHistoryEntry(entry)) {
            return false;
          }
        }
      }
    }

    // Validate timestamp if present
    if (
      data.timestamp !== undefined &&
      (typeof data.timestamp !== 'number' || !isFinite(data.timestamp))
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate a single history entry.
   * Requirements: 16.6
   *
   * @param entry - History entry to validate
   * @returns true if entry is valid, false otherwise
   */
  private validateHistoryEntry(entry: any): boolean {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    // Validate action
    if (
      typeof entry.action !== 'string' ||
      !['edit', 'expand', 'collapse'].includes(entry.action)
    ) {
      return false;
    }

    // Validate nodeId
    if (typeof entry.nodeId !== 'string') {
      return false;
    }

    // Validate before state
    if (!this.validateHistoryState(entry.before)) {
      return false;
    }

    // Validate after state
    if (!this.validateHistoryState(entry.after)) {
      return false;
    }

    // Validate timestamp
    if (typeof entry.timestamp !== 'number' || !isFinite(entry.timestamp)) {
      return false;
    }

    return true;
  }

  /**
   * Validate a history state object.
   * Requirements: 16.6
   *
   * @param state - State object to validate
   * @returns true if state is valid, false otherwise
   */
  private validateHistoryState(state: any): boolean {
    if (!state || typeof state !== 'object') {
      return false;
    }

    // Validate inlineNote if present
    if (
      state.inlineNote !== undefined &&
      typeof state.inlineNote !== 'string'
    ) {
      return false;
    }

    // Validate detailedNote if present
    if (
      state.detailedNote !== undefined &&
      typeof state.detailedNote !== 'string'
    ) {
      return false;
    }

    // Validate fold if present
    if (state.fold !== undefined && typeof state.fold !== 'number') {
      return false;
    }

    return true;
  }

  /**
   * Clear all saved data.
   *
   * @returns true if clear was successful, false otherwise
   */
  public clear(): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.error('[Markmap] Failed to clear localStorage:', e);
      return false;
    }
  }

  /**
   * Get the timestamp of the last save.
   *
   * @returns Timestamp in milliseconds or null if not available
   */
  public getLastSaveTime(): number | null {
    const data = this.load();
    return data?.timestamp || null;
  }
}
