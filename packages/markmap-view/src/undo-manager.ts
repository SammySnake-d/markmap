import type { IEnhancedNode } from 'markmap-lib';

/**
 * Represents a single action in the history.
 *
 * Requirements:
 * - 12.1: Record edit operations to history stack
 */
export interface HistoryEntry {
  /** Type of action performed */
  action: 'edit' | 'expand' | 'collapse';
  /** The node that was modified */
  node: IEnhancedNode;
  /** State before the action */
  before: {
    inlineNote?: string;
    detailedNote?: string;
    fold?: number;
  };
  /** State after the action */
  after: {
    inlineNote?: string;
    detailedNote?: string;
    fold?: number;
  };
  /** Timestamp when the action occurred */
  timestamp: number;
}

/**
 * UndoManager manages the undo/redo history for mindmap operations.
 *
 * This class maintains two stacks: one for undo operations and one for redo operations.
 * It supports recording edit actions and provides methods to undo and redo them.
 *
 * Requirements:
 * - 5.9: Support undo/redo for note editing
 * - 12.1: Record each modification to history stack
 * - 12.2: Undo most recent edit with Cmd+Z / Ctrl+Z
 * - 12.3: Redo last undone operation with Cmd+Shift+Z / Ctrl+Y
 */
export class UndoManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxStackSize: number;

  /**
   * Creates a new UndoManager instance.
   *
   * @param maxStackSize - Maximum number of history entries to keep (default: 50)
   */
  constructor(maxStackSize: number = 50) {
    this.maxStackSize = maxStackSize;
  }

  /**
   * Records an action to the undo stack.
   *
   * Requirement 12.1: Record each modification to history stack
   *
   * When a new action is recorded, the redo stack is cleared since
   * the history has diverged from the previous redo path.
   *
   * @param entry - The history entry to record
   */
  public record(entry: HistoryEntry): void {
    // Add to undo stack
    this.undoStack.push(entry);

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift(); // Remove oldest entry
    }

    // Clear redo stack when new action is recorded
    this.redoStack = [];
  }

  /**
   * Undoes the most recent action.
   *
   * Requirement 12.2: Undo most recent edit operation
   *
   * @returns The history entry that was undone, or null if nothing to undo
   */
  public undo(): HistoryEntry | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const entry = this.undoStack.pop()!;

    // Apply the "before" state to the node
    this.applyState(entry.node, entry.before);

    // Move to redo stack
    this.redoStack.push(entry);

    return entry;
  }

  /**
   * Redoes the most recently undone action.
   *
   * Requirement 12.3: Redo last undone operation
   *
   * @returns The history entry that was redone, or null if nothing to redo
   */
  public redo(): HistoryEntry | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const entry = this.redoStack.pop()!;

    // Apply the "after" state to the node
    this.applyState(entry.node, entry.after);

    // Move back to undo stack
    this.undoStack.push(entry);

    return entry;
  }

  /**
   * Checks if there are actions available to undo.
   *
   * Requirement 12.5: Ignore undo command when no operations to undo
   *
   * @returns True if undo is available, false otherwise
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Checks if there are actions available to redo.
   *
   * Requirement 12.6: Ignore redo command when no operations to redo
   *
   * @returns True if redo is available, false otherwise
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Applies a state to a node.
   *
   * Requirement 12.4: Update mindmap display and underlying Markdown data
   *
   * @param node - The node to update
   * @param state - The state to apply
   */
  private applyState(
    node: IEnhancedNode,
    state: {
      inlineNote?: string;
      detailedNote?: string;
      fold?: number;
    },
  ): void {
    // Update note fields if present in state
    if ('inlineNote' in state) {
      node.inlineNote = state.inlineNote;
    }
    if ('detailedNote' in state) {
      node.detailedNote = state.detailedNote;
    }

    // Update fold state if present
    if ('fold' in state) {
      if (!node.payload) {
        node.payload = {};
      }
      node.payload.fold = state.fold;
    }
  }

  /**
   * Clears all history (both undo and redo stacks).
   */
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Gets the current size of the undo stack.
   *
   * @returns Number of actions that can be undone
   */
  public getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Gets the current size of the redo stack.
   *
   * @returns Number of actions that can be redone
   */
  public getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Gets the most recent history entry without removing it.
   *
   * @returns The most recent history entry, or null if stack is empty
   */
  public peekUndo(): HistoryEntry | null {
    if (this.undoStack.length === 0) {
      return null;
    }
    return this.undoStack[this.undoStack.length - 1];
  }

  /**
   * Gets the most recent redo entry without removing it.
   *
   * @returns The most recent redo entry, or null if stack is empty
   */
  public peekRedo(): HistoryEntry | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    return this.redoStack[this.redoStack.length - 1];
  }

  /**
   * Sets the maximum stack size.
   *
   * If the new size is smaller than the current stack size,
   * older entries will be removed.
   *
   * @param size - The new maximum stack size
   */
  public setMaxStackSize(size: number): void {
    this.maxStackSize = size;

    // Trim stacks if necessary
    while (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    while (this.redoStack.length > this.maxStackSize) {
      this.redoStack.shift();
    }
  }

  /**
   * Gets the maximum stack size.
   *
   * @returns The maximum number of history entries
   */
  public getMaxStackSize(): number {
    return this.maxStackSize;
  }

  /**
   * Serializes the history stacks for persistence.
   *
   * Requirements: 16.6
   *
   * This method converts the history stacks into a format that can be
   * stored in localStorage. Node references are converted to node IDs.
   *
   * @returns Serialized history data
   */
  public serialize(): {
    undoStack: Array<{
      action: 'edit' | 'expand' | 'collapse';
      nodeId: string;
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
    }>;
    redoStack: Array<{
      action: 'edit' | 'expand' | 'collapse';
      nodeId: string;
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
    }>;
  } {
    return {
      undoStack: this.undoStack.map((entry) => ({
        action: entry.action,
        nodeId: this.getNodeId(entry.node),
        before: { ...entry.before },
        after: { ...entry.after },
        timestamp: entry.timestamp,
      })),
      redoStack: this.redoStack.map((entry) => ({
        action: entry.action,
        nodeId: this.getNodeId(entry.node),
        before: { ...entry.before },
        after: { ...entry.after },
        timestamp: entry.timestamp,
      })),
    };
  }

  /**
   * Restores history stacks from serialized data.
   *
   * Requirements: 16.6
   *
   * This method restores the history stacks from localStorage data.
   * Node IDs are converted back to node references using the provided node map.
   *
   * @param data - Serialized history data
   * @param nodeMap - Map of node IDs to node objects
   */
  public deserialize(
    data: {
      undoStack?: Array<{
        action: 'edit' | 'expand' | 'collapse';
        nodeId: string;
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
      }>;
      redoStack?: Array<{
        action: 'edit' | 'expand' | 'collapse';
        nodeId: string;
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
      }>;
    },
    nodeMap: Map<string, IEnhancedNode>,
  ): void {
    // Clear existing stacks
    this.undoStack = [];
    this.redoStack = [];

    // Restore undo stack
    if (data.undoStack) {
      for (const entry of data.undoStack) {
        const node = nodeMap.get(entry.nodeId);
        if (node) {
          this.undoStack.push({
            action: entry.action,
            node,
            before: { ...entry.before },
            after: { ...entry.after },
            timestamp: entry.timestamp,
          });
        }
      }
    }

    // Restore redo stack
    if (data.redoStack) {
      for (const entry of data.redoStack) {
        const node = nodeMap.get(entry.nodeId);
        if (node) {
          this.redoStack.push({
            action: entry.action,
            node,
            before: { ...entry.before },
            after: { ...entry.after },
            timestamp: entry.timestamp,
          });
        }
      }
    }
  }

  /**
   * Gets a unique identifier for a node.
   *
   * This method generates a unique ID for a node based on its content and position.
   * The ID is used to serialize node references for persistence.
   *
   * @param node - The node to get ID for
   * @returns A unique identifier string
   */
  private getNodeId(node: IEnhancedNode): string {
    // Use the node's state path as the unique ID
    // The path is a dot-separated sequence of the node and its ancestors
    // which provides a stable identifier across sessions
    if (node.state && node.state.path) {
      return node.state.path;
    }

    // Fallback: use a combination of depth and content
    const depth = node.state?.depth ?? 0;
    const contentHash = node.content.substring(0, 50); // First 50 chars
    return `${depth}-${contentHash}`;
  }
}
