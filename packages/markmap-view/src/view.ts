import type * as d3 from 'd3';
import {
  linkHorizontal,
  max,
  min,
  minIndex,
  select,
  zoom,
  zoomIdentity,
  zoomTransform,
} from 'd3';
import { flextree } from 'd3-flextree';
import {
  Hook,
  INode,
  IPureNode,
  addClass,
  debounce,
  getId,
  noop,
  walkTree,
} from 'markmap-common';
import {
  DIContainer,
  EventEmitter,
  MarkmapCore,
  MarkmapAPI,
} from 'markmap-core';
import type {
  INoteProvider,
  IContextMenuProvider,
  IToolbarProvider,
  ISearchProvider,
} from 'markmap-interfaces';
import { defaultOptions, isMacintosh } from './constants';
import css from './style.css?inline';
import {
  ID3SVGElement,
  IMarkmapOptions,
  IMarkmapState,
  IPadding,
} from './types';
import { UndoManager } from './undo-manager';
import { ContextMenu } from './context-menu';
import { TouchManager } from './touch-manager';
import { StorageManager } from './storage-manager';
import { NotePanel } from './note-panel';
import { childSelector, simpleHash, exportNodeAsMarkdown } from './util';

export const globalCSS = css;

const SELECTOR_NODE = 'g.markmap-node';
const SELECTOR_LINK = 'path.markmap-link';
const SELECTOR_HIGHLIGHT = 'g.markmap-highlight';

const linkShape = linkHorizontal();

function minBy(numbers: number[], by: (v: number) => number): number {
  const index = minIndex(numbers, by);
  return numbers[index];
}

function stopPropagation(e: Event) {
  e.stopPropagation();
}

/**
 * A global hook to refresh all markmaps when called.
 */
export const refreshHook = new Hook<[]>();

export class Markmap {
  options = { ...defaultOptions };

  state: IMarkmapState;

  svg: ID3SVGElement;

  styleNode: d3.Selection<HTMLStyleElement, INode, HTMLElement, INode>;

  g: d3.Selection<SVGGElement, INode, HTMLElement, INode>;

  zoom: d3.ZoomBehavior<SVGElement, INode>;

  private _observer: ResizeObserver;

  private _disposeList: (() => void)[] = [];

  /**
   * 依赖注入容器
   * Requirements: 3.1, 3.2
   */
  private diContainer: DIContainer;

  /**
   * 事件发射器
   * Requirements: 7.1, 7.2, 7.3
   */
  private eventEmitter: EventEmitter;

  /**
   * 核心渲染引擎（可选，用于新架构）
   * Requirements: 1.1, 1.2
   */
  private core?: MarkmapCore;

  /**
   * 功能 API 层（可选，用于新架构）
   * Requirements: 8.1
   */
  public api?: MarkmapAPI;

  /**
   * Flag to track if window resize handler should auto-fit
   * Requirements: 3.2
   */
  private _enableWindowResize: boolean = true;

  /**
   * Flag to track if this is the first data load
   * Requirements: 3.3
   */
  private _isFirstLoad: boolean = true;

  /**
   * Space key drag state
   * Requirements: 8.2
   */
  private _spaceKeyPressed: boolean = false;
  private _isDragging: boolean = false;
  private _dragStartX: number = 0;
  private _dragStartY: number = 0;

  /**
   * UndoManager for handling undo/redo operations.
   * Requirements: 5.9, 12.1, 12.2, 12.3
   */
  public undoManager: UndoManager;

  /**
   * ContextMenu for node right-click interactions.
   * Requirements: 8.4
   */
  private contextMenu: ContextMenu;

  /**
   * TouchManager for handling touch gestures on mobile devices.
   * Requirements: 11.2, 11.3
   */
  private touchManager: TouchManager;

  /**
   * StorageManager for handling data persistence to localStorage.
   * Requirements: 16.1, 16.2, 16.3
   */
  private storageManager: StorageManager | null = null;

  /**
   * Original markdown content for persistence.
   * Requirements: 16.1
   */
  private markdownContent: string = '';

  /**
   * NotePanel for displaying and editing node notes.
   * Requirements: 5.5, 5.6, 5.7, 5.8
   */
  private notePanel: NotePanel;

  constructor(
    svg: string | SVGElement | ID3SVGElement,
    opts?: Partial<IMarkmapOptions>,
  ) {
    // Initialize DIContainer and EventEmitter first
    // Requirements: 3.1, 3.2, 7.1
    this.diContainer = new DIContainer();
    this.eventEmitter = new EventEmitter();

    this.svg = (svg as ID3SVGElement).datum
      ? (svg as ID3SVGElement)
      : select(svg as string);
    this.styleNode = this.svg.append('style');
    this.zoom = zoom<SVGElement, INode>()
      .filter((event) => {
        if (this.options.scrollForPan) {
          // Pan with wheels, zoom with ctrl+wheels
          if (event.type === 'wheel') return event.ctrlKey && !event.button;
        }
        return (!event.ctrlKey || event.type === 'wheel') && !event.button;
      })
      .on('zoom', this.handleZoom);

    // Initialize UndoManager
    // Requirements: 5.9, 12.1, 12.2, 12.3
    this.undoManager = new UndoManager();

    // Initialize ContextMenu
    // Requirements: 8.4, 8.5
    this.contextMenu = new ContextMenu({
      onCopyAsMarkdown: (node) => this.handleCopyAsMarkdown(node),
      onExpandAll: (node) => this.expandAll(node),
      onCollapseAll: (node) => this.collapseAll(node),
      onExportPNG: () => this.downloadAsPNG(),
      onExportJPG: () => this.downloadAsJPG(),
      onExportSVG: () => this.downloadAsSVG(),
      onExportMarkdown: () => this.handleExportMarkdownFromCanvas(),
    });

    // Initialize TouchManager
    // Requirements: 11.2, 11.3, 11.4, 11.5
    this.touchManager = new TouchManager(
      // Pan callback - translate the view
      (dx: number, dy: number) => this.handleTouchPan(dx, dy),
      // Zoom callback - scale the view
      (scale: number, centerX: number, centerY: number) =>
        this.handleTouchZoom(scale, centerX, centerY),
      // Node tap callback - toggle expand/collapse
      (element: Element) => this.handleNodeTap(element),
      // Node long press callback - show context menu
      (element: Element, x: number, y: number) =>
        this.handleNodeLongPress(element, x, y),
    );

    // Initialize NotePanel
    // Requirements: 5.5, 5.6, 5.7, 5.8
    this.notePanel = new NotePanel({
      onSave: (node, inlineNote, detailedNote) =>
        this.handleNoteSave(node, inlineNote, detailedNote),
      onClose: () => this.handleNotePanelClose(),
    });

    this.setOptions(opts);

    // Register Providers if provided in options
    // Requirements: 3.1, 3.2
    this.registerProviders(opts);

    this.state = {
      id: this.options.id || this.svg.attr('id') || getId(),
      rect: { x1: 0, y1: 0, x2: 0, y2: 0 },
    };
    this.g = this.svg.append('g');
    this.g.append('g').attr('class', 'markmap-highlight');
    this._observer = new ResizeObserver(
      debounce(() => {
        this.renderData();
      }, 100),
    );

    // Setup keyboard shortcuts for undo/redo
    // Requirements: 12.2, 12.3
    this.setupKeyboardShortcuts();

    // Setup window resize handler
    // Requirements: 3.2
    this.setupWindowResizeHandler();

    // Setup Space key drag functionality
    // Requirements: 8.2
    this.setupSpaceKeyDrag();

    // Setup canvas right-click menu
    // Requirements: 8.5
    this.setupCanvasContextMenu();

    // Initialize StorageManager if auto-save is enabled
    // Requirements: 16.1, 16.2, 16.3
    if (this.options.enableAutoSave) {
      this.storageManager = new StorageManager(this.options.storageKey);
      // Try to load saved data
      this.loadFromStorage();
    }

    // Initialize UI components
    // Requirements: 3.1, 3.2
    this.initializeUI();

    this._disposeList.push(
      refreshHook.tap(() => {
        this.setData();
      }),
      () => this._observer.disconnect(),
      () => this.diContainer.clear(),
    );
  }

  getStyleContent(): string {
    const { style } = this.options;
    const { id } = this.state;
    const styleText = typeof style === 'function' ? style(id) : '';
    return [this.options.embedGlobalCSS && css, styleText]
      .filter(Boolean)
      .join('\n');
  }

  updateStyle(): void {
    this.svg.attr(
      'class',
      addClass(this.svg.attr('class'), 'markmap', this.state.id),
    );
    const style = this.getStyleContent();
    this.styleNode.text(style);
  }

  handleZoom = (e: any) => {
    const { transform } = e;
    this.g.attr('transform', transform);

    // Requirement 7.4: Emit view:transform event
    this.eventEmitter.emit('view:transform', {
      x: transform.x,
      y: transform.y,
      k: transform.k,
    });
  };

  handlePan = (e: WheelEvent) => {
    e.preventDefault();
    const transform = zoomTransform(this.svg.node()!);
    const newTransform = transform.translate(
      -e.deltaX / transform.k,
      -e.deltaY / transform.k,
    );
    this.svg.call(this.zoom.transform, newTransform);
  };

  /**
   * Handle touch pan gesture.
   *
   * This method is called by TouchManager when a single-finger drag is detected.
   * It translates the view by the given delta values.
   *
   * Requirements:
   * - 11.2: Support single-finger drag to pan canvas
   *
   * @param dx - Horizontal movement delta in pixels
   * @param dy - Vertical movement delta in pixels
   */
  private handleTouchPan = (dx: number, dy: number): void => {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    const transform = zoomTransform(svgNode);
    // Translate by the delta, accounting for current scale
    const newTransform = transform.translate(
      dx / transform.k,
      dy / transform.k,
    );
    this.svg.call(this.zoom.transform, newTransform);
  };

  /**
   * Handle touch zoom gesture.
   *
   * This method is called by TouchManager when a two-finger pinch is detected.
   * It scales the view around the center point of the pinch gesture.
   *
   * Requirements:
   * - 11.3: Support two-finger pinch to zoom canvas
   *
   * @param scale - Scale factor (relative to previous scale)
   * @param centerX - X coordinate of pinch center in screen space
   * @param centerY - Y coordinate of pinch center in screen space
   */
  private handleTouchZoom = (
    scale: number,
    centerX: number,
    centerY: number,
  ): void => {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    const transform = zoomTransform(svgNode);
    const rect = svgNode.getBoundingClientRect();

    // Convert screen coordinates to SVG coordinates
    const x = centerX - rect.left;
    const y = centerY - rect.top;

    // Calculate the point in the SVG coordinate system
    const svgX = (x - transform.x) / transform.k;
    const svgY = (y - transform.y) / transform.k;

    // Apply zoom around the pinch center point
    const newTransform = transform
      .translate(svgX, svgY)
      .scale(scale)
      .translate(-svgX, -svgY);

    this.svg.call(this.zoom.transform, newTransform);
  };

  /**
   * Handle node tap gesture.
   *
   * This method is called by TouchManager when a single tap on a node is detected.
   * It toggles the expand/collapse state of the node.
   *
   * Requirements:
   * - 11.4: Single tap on node toggles expand/collapse state
   *
   * @param element - The node element that was tapped
   */
  private handleNodeTap = (element: Element): void => {
    // Find the node data associated with this element
    const nodeData = select(element).datum() as INode | undefined;

    if (nodeData) {
      // Toggle the node (same behavior as click)
      // Use the same logic as handleClick but without the recursive modifier
      this.toggleNode(nodeData, false);
    }
  };

  /**
   * Handle node long press gesture.
   *
   * This method is called by TouchManager when a long press on a node is detected.
   * It shows the context menu for the node.
   *
   * Requirements:
   * - 11.5: Long press on node shows context menu
   *
   * @param element - The node element that was long-pressed
   * @param x - X coordinate of the long press in screen space
   * @param y - Y coordinate of the long press in screen space
   */
  private handleNodeLongPress = (
    element: Element,
    x: number,
    y: number,
  ): void => {
    // Find the node data associated with this element
    const nodeData = select(element).datum() as INode | undefined;

    if (nodeData) {
      // Show context menu at the touch position
      this.contextMenu.show(nodeData, x, y);
    }
  };

  async toggleNode(data: INode, recursive = false) {
    const fold = data.payload?.fold ? 0 : 1;
    const wasExpanding = fold === 0; // Track if we're expanding

    if (recursive) {
      // recursively
      walkTree(data, (item, next) => {
        item.payload = {
          ...item.payload,
          fold,
        };
        next();
      });
    } else {
      data.payload = {
        ...data.payload,
        fold: data.payload?.fold ? 0 : 1,
      };
    }
    await this.renderData(data);

    // Requirement 7.1: Emit node:toggle event
    this.eventEmitter.emit('node:toggle', data, fold === 0);

    // Requirement 3.6: Auto-adjust viewport when expanded content exceeds viewport
    if (wasExpanding) {
      await this.adjustViewportIfNeeded();
    }

    // Auto-save after node state changes
    // Requirements: 16.1
    if (this.options.enableAutoSave && this.storageManager) {
      this.saveToStorage();
    }
  }

  /**
   * Expand a node and all its descendants.
   *
   * Requirements:
   * - 2.1: Expand node and all its children when user selects "Expand All"
   * - 3.6: Auto-adjust viewport when expanded content exceeds viewport
   *
   * @param node - The node to expand. If not provided, expands from root.
   */
  async expandAll(node?: INode): Promise<void> {
    const targetNode = node || this.state.data;
    if (!targetNode) return;

    // Walk through the tree and set fold to 0 (expanded) for all nodes
    walkTree(targetNode, (item, next) => {
      item.payload = {
        ...item.payload,
        fold: 0,
      };
      next();
    });

    await this.renderData(targetNode);

    // Requirement 3.6: Auto-adjust viewport when expanded content exceeds viewport
    await this.adjustViewportIfNeeded();

    // Auto-save after expand all
    // Requirements: 16.1
    if (this.options.enableAutoSave && this.storageManager) {
      this.saveToStorage();
    }
  }

  /**
   * Collapse a node and all its descendants.
   *
   * Requirements:
   * - 2.2: Collapse all children under a node when user selects "Collapse All"
   *
   * @param node - The node to collapse. If not provided, collapses from root.
   */
  async collapseAll(node?: INode): Promise<void> {
    const targetNode = node || this.state.data;
    if (!targetNode) return;

    // Walk through the tree and set fold to 1 (collapsed) for all nodes
    walkTree(targetNode, (item, next) => {
      item.payload = {
        ...item.payload,
        fold: 1,
      };
      next();
    });

    await this.renderData(targetNode);

    // Auto-save after collapse all
    // Requirements: 16.1
    if (this.options.enableAutoSave && this.storageManager) {
      this.saveToStorage();
    }
  }

  handleClick = (e: MouseEvent, d: INode) => {
    let recursive = this.options.toggleRecursively;
    if (isMacintosh ? e.metaKey : e.ctrlKey) recursive = !recursive;
    this.toggleNode(d, recursive);

    // Requirement 7.1: Emit node:click event
    this.eventEmitter.emit('node:click', d);

    // Requirement 13.7: Notify external application when node is clicked
    if (this.options.onNodeClick) {
      this.options.onNodeClick(d);
    }
  };

  private _initializeData(node: IPureNode | INode) {
    let nodeId = 0;
    const { color, initialExpandLevel } = this.options;

    let foldRecursively = 0;
    let depth = 0;
    walkTree(node as INode, (item, next, parent) => {
      depth += 1;
      item.children = item.children?.map((child) => ({ ...child }));
      nodeId += 1;
      item.state = {
        ...item.state,
        depth,
        id: nodeId,
        rect: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
        size: [0, 0],
      };
      item.state.key =
        [parent?.state?.id, item.state.id].filter(Boolean).join('.') +
        simpleHash(item.content);
      item.state.path = [parent?.state?.path, item.state.id]
        .filter(Boolean)
        .join('.');
      color(item); // preload colors

      const isFoldRecursively = item.payload?.fold === 2;
      if (isFoldRecursively) {
        foldRecursively += 1;
      } else if (
        foldRecursively ||
        (initialExpandLevel >= 0 &&
          (item.state?.depth ?? 0) >= initialExpandLevel)
      ) {
        item.payload = { ...item.payload, fold: 1 };
      }
      next();
      if (isFoldRecursively) foldRecursively -= 1;
      depth -= 1;
    });

    return node as INode;
  }

  private _relayout() {
    if (!this.state.data) return;

    this.g
      .selectAll<SVGGElement, INode>(childSelector<SVGGElement>(SELECTOR_NODE))
      .selectAll<SVGForeignObjectElement, INode>(
        childSelector<SVGForeignObjectElement>('foreignObject'),
      )
      .each(function (d) {
        const el = this.firstChild?.firstChild as HTMLDivElement;
        const newSize: [number, number] = [el.scrollWidth, el.scrollHeight];
        if (d.state) {
          d.state.size = newSize;
        }
      });

    const { lineWidth, paddingX, spacingHorizontal, spacingVertical } =
      this.options;
    const layout = flextree<INode>({})
      .children((d) => {
        if (!d.payload?.fold) return d.children;
      })
      .nodeSize((node) => {
        const [width, height] = node.data.state?.size || [0, 0];
        return [height, width + (width ? paddingX * 2 : 0) + spacingHorizontal];
      })
      .spacing((a, b) => {
        return (
          (a.parent === b.parent ? spacingVertical : spacingVertical * 2) +
          lineWidth(a.data)
        );
      });
    const tree = layout.hierarchy(this.state.data);
    layout(tree);
    const fnodes = tree.descendants();
    fnodes.forEach((fnode) => {
      const node = fnode.data;
      if (node.state) {
        node.state.rect = {
          x: fnode.y,
          y: fnode.x - fnode.xSize / 2,
          width: fnode.ySize - spacingHorizontal,
          height: fnode.xSize,
        };
      }
    });
    this.state.rect = {
      x1: min(fnodes, (fnode) => fnode.data.state?.rect?.x ?? 0) || 0,
      y1: min(fnodes, (fnode) => fnode.data.state?.rect?.y ?? 0) || 0,
      x2:
        max(
          fnodes,
          (fnode) =>
            (fnode.data.state?.rect?.x ?? 0) +
            (fnode.data.state?.rect?.width ?? 0),
        ) || 0,
      y2:
        max(
          fnodes,
          (fnode) =>
            (fnode.data.state?.rect?.y ?? 0) +
            (fnode.data.state?.rect?.height ?? 0),
        ) || 0,
    };
  }

  setOptions(opts?: Partial<IMarkmapOptions>): void {
    this.options = {
      ...this.options,
      ...opts,
    };
    if (this.options.zoom) {
      this.svg.call(this.zoom);
    } else {
      this.svg.on('.zoom', null);
    }
    if (this.options.pan) {
      this.svg.on('wheel', this.handlePan);
    } else {
      this.svg.on('wheel', null);
    }
    // Enable or disable touch support based on options
    // Requirements: 11.2, 11.3
    const svgNode = this.svg.node();
    if (svgNode) {
      if (this.options.enableTouch !== false) {
        // Touch is enabled by default (unless explicitly disabled)
        this.touchManager.enableTouch(svgNode);
      } else {
        this.touchManager.disableTouch();
      }
    }
  }

  async setData(data?: IPureNode | null, opts?: Partial<IMarkmapOptions>) {
    if (opts) this.setOptions(opts);
    if (data) this.state.data = this._initializeData(data);
    if (!this.state.data) return;
    this.updateStyle();
    await this.renderData();

    // Requirement 7.3: Emit data:change event when data is updated
    if (this.state.data) {
      this.eventEmitter.emit('data:change', this.state.data);
    }

    // Requirement 3.3: Auto-center and scale on initial load
    // When mindmap finishes loading, automatically center and set appropriate initial scale
    if (this._isFirstLoad) {
      this._isFirstLoad = false;
      await this.fit();
    }

    // Auto-save after data changes
    // Requirements: 16.1
    if (this.options.enableAutoSave && this.storageManager) {
      this.saveToStorage();
    }
  }

  async setHighlight(node?: INode | null) {
    this.state.highlight = node || undefined;
    await this.renderData();
  }

  private _getHighlightRect(highlight: INode) {
    const svgNode = this.svg.node()!;
    const transform = zoomTransform(svgNode);
    const padding = 4 / transform.k;
    const rect = {
      ...highlight.state.rect,
    };
    rect.x -= padding;
    rect.y -= padding;
    rect.width += 2 * padding;
    rect.height += 2 * padding;
    return rect;
  }

  async renderData(originData?: INode) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this; // Capture 'this' for use in event handlers
    const { paddingX, autoFit, color, maxWidth, lineWidth } = this.options;
    const rootNode = this.state.data;
    if (!rootNode) return;

    const nodeMap: Record<number, INode> = {};
    const parentMap: Record<number, number> = {};
    const nodes: INode[] = [];
    walkTree(rootNode, (item, next, parent) => {
      if (!item.payload?.fold) next();
      if (item.state?.id !== undefined) {
        nodeMap[item.state.id] = item;
        if (parent && parent.state?.id !== undefined) {
          parentMap[item.state.id] = parent.state.id;
        }
      }
      nodes.push(item);
    });

    const originMap: Record<number, number> = {};
    const sourceRectMap: Record<
      number,
      { x: number; y: number; width: number; height: number }
    > = {};
    const setOriginNode = (originNode: INode | undefined) => {
      if (!originNode || originMap[originNode.state.id]) return;
      walkTree(originNode, (item, next) => {
        originMap[item.state.id] = originNode.state.id;
        next();
      });
    };
    const getOriginSourceRect = (node: INode) => {
      if (!node.state?.id) return { x: 0, y: 0, width: 0, height: 0 };
      const rect = sourceRectMap[originMap[node.state.id]];
      return (
        rect || rootNode.state?.rect || { x: 0, y: 0, width: 0, height: 0 }
      );
    };
    const getOriginTargetRect = (node: INode) => {
      if (!node.state?.id) return { x: 0, y: 0, width: 0, height: 0 };
      return (
        (nodeMap[originMap[node.state.id]] || rootNode).state?.rect || {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }
      );
    };
    if (rootNode.state?.id !== undefined && rootNode.state?.rect) {
      sourceRectMap[rootNode.state.id] = rootNode.state.rect;
    }
    if (originData) setOriginNode(originData);

    // Update highlight
    let { highlight } = this.state;
    if (highlight && !nodeMap[highlight.state.id]) highlight = undefined;
    let highlightNodes = this.g
      .selectAll(childSelector(SELECTOR_HIGHLIGHT))
      .selectAll<SVGRectElement, INode>(childSelector<SVGRectElement>('rect'))
      .data(highlight ? [this._getHighlightRect(highlight)] : [])
      .join('rect')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height);

    // Update the nodes
    const mmG = this.g
      .selectAll<SVGGElement, INode>(childSelector<SVGGElement>(SELECTOR_NODE))
      .each((d) => {
        // Save the current rects before updating nodes
        if (d.state?.id !== undefined) {
          sourceRectMap[d.state.id] = d.state.rect;
        }
      })
      .data(nodes, (d) => d.state?.key || '');
    const mmGEnter = mmG
      .enter()
      .append('g')
      .attr('data-depth', (d) => d.state?.depth ?? 0)
      .attr('data-path', (d) => d.state?.path ?? '')
      .each((d) => {
        if (d.state?.id !== undefined) {
          setOriginNode(nodeMap[parentMap[d.state.id]]);
        }
      });
    const mmGExit = mmG.exit<INode>().each((d) => {
      if (d.state?.id !== undefined) {
        setOriginNode(nodeMap[parentMap[d.state.id]]);
      }
    });
    const mmGMerge = mmG
      .merge(mmGEnter)
      .attr('class', (d) =>
        [
          'markmap-node',
          d.payload?.fold && 'markmap-fold',
          d.payload?.highlighted && 'markmap-search-highlight',
        ]
          .filter(Boolean)
          .join(' '),
      );

    // Update lines under the content
    const mmLine = mmGMerge
      .selectAll<SVGLineElement, INode>(childSelector<SVGLineElement>('line'))
      .data(
        (d) => [d],
        (d) => d.state?.key || '',
      );
    const mmLineEnter = mmLine
      .enter()
      .append('line')
      .attr('stroke', (d) => color(d))
      .attr('stroke-width', 0);
    const mmLineMerge = mmLine.merge(mmLineEnter);

    // Circle to link to children of the node
    const mmCircle = mmGMerge
      .selectAll<
        SVGCircleElement,
        INode
      >(childSelector<SVGCircleElement>('circle'))
      .data(
        (d) => (d.children?.length ? [d] : []),
        (d) => d.state?.key || '',
      );
    const mmCircleEnter = mmCircle
      .enter()
      .append('circle')
      .attr('stroke-width', 0)
      .attr('r', 0)
      .on('click', (e, d) => this.handleClick(e, d))
      .on('mousedown', stopPropagation)
      .on('contextmenu', (e, d) => this.handleContextMenu(e, d));
    const mmCircleMerge = mmCircleEnter
      .merge(mmCircle)
      .attr('stroke', (d) => color(d))
      .attr('fill', (d) =>
        d.payload?.fold && d.children
          ? color(d)
          : 'var(--markmap-circle-open-bg)',
      );

    const observer = this._observer;
    const mmFo = mmGMerge
      .selectAll<
        SVGForeignObjectElement,
        INode
      >(childSelector<SVGForeignObjectElement>('foreignObject'))
      .data(
        (d) => [d],
        (d) => d.state?.key || '',
      );
    const mmFoEnter = mmFo
      .enter()
      .append('foreignObject')
      .attr('class', 'markmap-foreign')
      .attr('x', paddingX)
      .attr('y', 0)
      .style('opacity', 0)
      .on('mousedown', stopPropagation)
      .on('dblclick', stopPropagation)
      .on('contextmenu', (e, d) => this.handleContextMenu(e, d));
    mmFoEnter
      // The outer `<div>` with a width of `maxWidth`
      .append<HTMLDivElement>('xhtml:div')
      // The inner `<div>` with `display: inline-block` to get the proper width
      .append<HTMLDivElement>('xhtml:div')
      .html((d) => {
        // Check if node has notes (Requirements 5.4)
        // Notes are stored directly on the node object (not in payload)
        const hasNote =
          (d as any).hasNote ||
          (d as any).inlineNote ||
          (d as any).detailedNote;

        if (hasNote) {
          // Add clickable note icon after content
          // Requirements: 5.5 - Click icon to show note panel
          // 支持自定义图标，默认为 📝
          const noteIcon = self.options.noteIcon || '📝';
          return `${d.content}<span class="markmap-note-icon" title="点击查看备注">${noteIcon}</span>`;
        }
        return d.content;
      })
      .attr('xmlns', 'http://www.w3.org/1999/xhtml');
    mmFoEnter.each(function (d) {
      const el = this.firstChild?.firstChild as Element;
      observer.observe(el);

      // Add click handler for note icon
      // Requirements: 5.5 - Show note panel when clicking note icon
      const noteIcon = el.querySelector('.markmap-note-icon');
      if (noteIcon) {
        noteIcon.addEventListener('click', (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          const mouseEvent = e as MouseEvent;
          // Show note panel at click position
          self.handleNoteIconClick(d, mouseEvent.clientX, mouseEvent.clientY);
        });
      }
    });
    const mmFoExit = mmGExit.selectAll<SVGForeignObjectElement, INode>(
      childSelector<SVGForeignObjectElement>('foreignObject'),
    );
    mmFoExit.each(function () {
      const el = this.firstChild?.firstChild as Element;
      observer.unobserve(el);
    });
    const mmFoMerge = mmFoEnter.merge(mmFo);

    // Update the links
    const links = nodes.flatMap((node) =>
      node.payload?.fold
        ? []
        : node.children.map((child) => ({ source: node, target: child })),
    );
    const mmPath = this.g
      .selectAll<
        SVGPathElement,
        { source: INode; target: INode }
      >(childSelector<SVGPathElement>(SELECTOR_LINK))
      .data(links, (d) => d.target.state?.key || '');
    const mmPathExit = mmPath.exit<{ source: INode; target: INode }>();
    const mmPathEnter = mmPath
      .enter()
      .insert('path', 'g')
      .attr('class', 'markmap-link')
      .attr('data-depth', (d) => d.target.state?.depth ?? 0)
      .attr('data-path', (d) => d.target.state?.path ?? '')
      .attr('d', (d) => {
        const originRect = getOriginSourceRect(d.target);
        const pathOrigin: [number, number] = [
          originRect.x + originRect.width,
          originRect.y + originRect.height,
        ];
        return linkShape({ source: pathOrigin, target: pathOrigin });
      })
      .attr('stroke-width', 0);
    const mmPathMerge = mmPathEnter.merge(mmPath);

    this.svg.style(
      '--markmap-max-width',
      maxWidth ? `${maxWidth}px` : (null as any),
    );
    await new Promise(requestAnimationFrame);
    // Note: d.state.rect is only available after relayout
    this._relayout();

    highlightNodes = highlightNodes
      .data(highlight ? [this._getHighlightRect(highlight)] : [])
      .join('rect');
    this.transition(highlightNodes)
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height);

    mmGEnter.attr('transform', (d) => {
      const originRect = getOriginSourceRect(d);
      const rect = d.state?.rect || { x: 0, y: 0, width: 0, height: 0 };
      return `translate(${originRect.x + originRect.width - rect.width},${
        originRect.y + originRect.height - rect.height
      })`;
    });
    this.transition(mmGExit)
      .attr('transform', (d) => {
        const targetRect = getOriginTargetRect(d);
        const rect = d.state?.rect || { x: 0, y: 0, width: 0, height: 0 };
        const targetX = targetRect.x + targetRect.width - rect.width;
        const targetY = targetRect.y + targetRect.height - rect.height;
        return `translate(${targetX},${targetY})`;
      })
      .remove();

    this.transition(mmGMerge).attr('transform', (d) => {
      const rect = d.state?.rect || { x: 0, y: 0, width: 0, height: 0 };
      return `translate(${rect.x},${rect.y})`;
    });

    const mmLineExit = mmGExit.selectAll<SVGLineElement, INode>(
      childSelector<SVGLineElement>('line'),
    );
    this.transition(mmLineExit)
      .attr('x1', (d) => d.state?.rect?.width ?? 0)
      .attr('stroke-width', 0);
    mmLineEnter
      .attr('x1', (d) => d.state?.rect?.width ?? 0)
      .attr('x2', (d) => d.state?.rect?.width ?? 0);
    mmLineMerge
      .attr('y1', (d) => (d.state?.rect?.height ?? 0) + lineWidth(d) / 2)
      .attr('y2', (d) => (d.state?.rect?.height ?? 0) + lineWidth(d) / 2);
    this.transition(mmLineMerge)
      .attr('x1', -1)
      .attr('x2', (d) => (d.state?.rect?.width ?? 0) + 2)
      .attr('stroke', (d) => color(d))
      .attr('stroke-width', lineWidth);

    const mmCircleExit = mmGExit.selectAll<SVGCircleElement, INode>(
      childSelector<SVGCircleElement>('circle'),
    );
    this.transition(mmCircleExit).attr('r', 0).attr('stroke-width', 0);
    mmCircleMerge
      .attr('cx', (d) => d.state?.rect?.width ?? 0)
      .attr('cy', (d) => (d.state?.rect?.height ?? 0) + lineWidth(d) / 2);
    this.transition(mmCircleMerge).attr('r', 6).attr('stroke-width', '1.5');

    this.transition(mmFoExit).style('opacity', 0);
    mmFoMerge
      .attr('width', (d) =>
        Math.max(0, (d.state?.rect?.width ?? 0) - paddingX * 2),
      )
      .attr('height', (d) => d.state?.rect?.height ?? 0);
    this.transition(mmFoMerge).style('opacity', 1);

    this.transition(mmPathExit)
      .attr('d', (d) => {
        const targetRect = getOriginTargetRect(d.target);
        const pathTarget: [number, number] = [
          targetRect.x + targetRect.width,
          targetRect.y + targetRect.height + lineWidth(d.target) / 2,
        ];
        return linkShape({ source: pathTarget, target: pathTarget });
      })
      .attr('stroke-width', 0)
      .remove();

    this.transition(mmPathMerge)
      .attr('stroke', (d) => color(d.target))
      .attr('stroke-width', (d) => lineWidth(d.target))
      .attr('d', (d) => {
        const origSource = d.source;
        const origTarget = d.target;
        const source: [number, number] = [
          origSource.state.rect.x + origSource.state.rect.width,
          origSource.state.rect.y +
            origSource.state.rect.height +
            lineWidth(origSource) / 2,
        ];
        const target: [number, number] = [
          origTarget.state.rect.x,
          origTarget.state.rect.y +
            origTarget.state.rect.height +
            lineWidth(origTarget) / 2,
        ];
        return linkShape({ source, target });
      });

    if (autoFit) this.fit();
  }

  transition<T extends d3.BaseType, U, P extends d3.BaseType, Q>(
    sel: d3.Selection<T, U, P, Q>,
  ): d3.Transition<T, U, P, Q> {
    const { duration } = this.options;
    return sel.transition().duration(duration);
  }

  /**
   * Fit the content to the viewport.
   */
  async fit(maxScale = this.options.maxInitialScale): Promise<void> {
    const svgNode = this.svg.node()!;
    const { width: offsetWidth, height: offsetHeight } =
      svgNode.getBoundingClientRect();
    const { fitRatio } = this.options;
    const { x1, y1, x2, y2 } = this.state.rect;
    const naturalWidth = x2 - x1;
    const naturalHeight = y2 - y1;
    const scale = Math.min(
      (offsetWidth / naturalWidth) * fitRatio,
      (offsetHeight / naturalHeight) * fitRatio,
      maxScale,
    );
    const initialZoom = zoomIdentity
      .translate(
        (offsetWidth - naturalWidth * scale) / 2 - x1 * scale,
        (offsetHeight - naturalHeight * scale) / 2 - y1 * scale,
      )
      .scale(scale);

    // Requirement 7.4: Emit view:fit event
    this.eventEmitter.emit('view:fit');

    return this.transition(this.svg)
      .call(this.zoom.transform, initialZoom)
      .end()
      .catch(noop);
  }

  findElement(node: INode) {
    let result:
      | {
          data: INode;
          g: SVGGElement;
        }
      | undefined;
    this.g
      .selectAll<SVGGElement, INode>(childSelector<SVGGElement>(SELECTOR_NODE))
      .each(function walk(d) {
        if (d === node) {
          result = {
            data: d,
            g: this,
          };
        }
      });
    return result;
  }

  /**
   * Pan the content to make the provided node visible in the viewport.
   */
  async ensureVisible(node: INode, padding?: Partial<IPadding>) {
    const itemData = this.findElement(node)?.data;
    if (!itemData) return;
    const svgNode = this.svg.node()!;
    const relRect = svgNode.getBoundingClientRect();
    const transform = zoomTransform(svgNode);
    const [left, right] = [
      itemData.state.rect.x,
      itemData.state.rect.x + itemData.state.rect.width + 2,
    ].map((x) => x * transform.k + transform.x);
    const [top, bottom] = [
      itemData.state.rect.y,
      itemData.state.rect.y + itemData.state.rect.height,
    ].map((y) => y * transform.k + transform.y);
    // Skip if the node includes or is included in the container.
    const pd: IPadding = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      ...padding,
    };
    const dxs = [pd.left - left, relRect.width - pd.right - right];
    const dys = [pd.top - top, relRect.height - pd.bottom - bottom];
    const dx = dxs[0] * dxs[1] > 0 ? minBy(dxs, Math.abs) / transform.k : 0;
    const dy = dys[0] * dys[1] > 0 ? minBy(dys, Math.abs) / transform.k : 0;
    if (dx || dy) {
      const newTransform = transform.translate(dx, dy);
      return this.transition(this.svg)
        .call(this.zoom.transform, newTransform)
        .end()
        .catch(noop);
    }
  }

  /** @deprecated Use `ensureVisible` instead */
  ensureView = this.ensureVisible;

  async centerNode(node: INode, padding?: Partial<IPadding>) {
    const itemData = this.findElement(node)?.data;
    if (!itemData) return;
    const svgNode = this.svg.node()!;
    const relRect = svgNode.getBoundingClientRect();
    const transform = zoomTransform(svgNode);
    const x =
      (itemData.state.rect.x + itemData.state.rect.width / 2) * transform.k +
      transform.x;
    const y =
      (itemData.state.rect.y + itemData.state.rect.height / 2) * transform.k +
      transform.y;
    const pd: IPadding = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      ...padding,
    };
    const cx = (pd.left + relRect.width - pd.right) / 2;
    const cy = (pd.top + relRect.height - pd.bottom) / 2;
    const dx = (cx - x) / transform.k;
    const dy = (cy - y) / transform.k;
    if (dx || dy) {
      const newTransform = transform.translate(dx, dy);
      return this.transition(this.svg)
        .call(this.zoom.transform, newTransform)
        .end()
        .catch(noop);
    }
  }

  /**
   * Scale content with it pinned at the center of the viewport.
   */
  async rescale(scale: number): Promise<void> {
    const svgNode = this.svg.node()!;
    const { width: offsetWidth, height: offsetHeight } =
      svgNode.getBoundingClientRect();
    const halfWidth = offsetWidth / 2;
    const halfHeight = offsetHeight / 2;
    const transform = zoomTransform(svgNode);
    const newTransform = transform
      .translate(
        ((halfWidth - transform.x) * (1 - scale)) / transform.k,
        ((halfHeight - transform.y) * (1 - scale)) / transform.k,
      )
      .scale(scale);
    return this.transition(this.svg)
      .call(this.zoom.transform, newTransform)
      .end()
      .catch(noop);
  }

  /**
   * Adjust viewport if content exceeds current viewport bounds.
   *
   * Requirements:
   * - 3.6: Auto-adjust zoom or viewport position when expanded content exceeds viewport
   */
  async adjustViewportIfNeeded(): Promise<void> {
    if (!this.state.data) return;

    const svgNode = this.svg.node()!;
    const { width: viewportWidth, height: viewportHeight } =
      svgNode.getBoundingClientRect();
    const transform = zoomTransform(svgNode);

    // Get the content bounds in screen coordinates
    const { x1, y1, x2, y2 } = this.state.rect;
    const contentWidth = x2 - x1;
    const contentHeight = y2 - y1;

    // Transform content bounds to screen coordinates
    const screenX1 = x1 * transform.k + transform.x;
    const screenY1 = y1 * transform.k + transform.y;
    const screenX2 = x2 * transform.k + transform.x;
    const screenY2 = y2 * transform.k + transform.y;

    // Check if content exceeds viewport
    const exceedsLeft = screenX1 < 0;
    const exceedsRight = screenX2 > viewportWidth;
    const exceedsTop = screenY1 < 0;
    const exceedsBottom = screenY2 > viewportHeight;

    const exceedsViewport =
      exceedsLeft || exceedsRight || exceedsTop || exceedsBottom;

    if (!exceedsViewport) {
      // Content fits within viewport, no adjustment needed
      return;
    }

    // Calculate if we need to zoom out or just pan
    const scaledContentWidth = contentWidth * transform.k;
    const scaledContentHeight = contentHeight * transform.k;

    const needsZoomOut =
      scaledContentWidth > viewportWidth ||
      scaledContentHeight > viewportHeight;

    if (needsZoomOut) {
      // Content is too large, zoom out to fit
      const { fitRatio } = this.options;
      const scaleX = (viewportWidth / contentWidth) * fitRatio;
      const scaleY = (viewportHeight / contentHeight) * fitRatio;
      const newScale = Math.min(scaleX, scaleY, this.options.maxInitialScale);

      // Center the content
      const newTransform = zoomIdentity
        .translate(
          (viewportWidth - contentWidth * newScale) / 2 - x1 * newScale,
          (viewportHeight - contentHeight * newScale) / 2 - y1 * newScale,
        )
        .scale(newScale);

      return this.transition(this.svg)
        .call(this.zoom.transform, newTransform)
        .end()
        .catch(noop);
    } else {
      // Content fits at current scale, just pan to show the exceeding parts
      let dx = 0;
      let dy = 0;

      // Calculate pan adjustments
      if (exceedsLeft) {
        dx = -screenX1; // Pan right to show left edge
      } else if (exceedsRight) {
        dx = viewportWidth - screenX2; // Pan left to show right edge
      }

      if (exceedsTop) {
        dy = -screenY1; // Pan down to show top edge
      } else if (exceedsBottom) {
        dy = viewportHeight - screenY2; // Pan up to show bottom edge
      }

      // If content exceeds on both sides, center it
      if (exceedsLeft && exceedsRight) {
        dx = (viewportWidth - scaledContentWidth) / 2 - screenX1;
      }
      if (exceedsTop && exceedsBottom) {
        dy = (viewportHeight - scaledContentHeight) / 2 - screenY1;
      }

      if (dx !== 0 || dy !== 0) {
        const newTransform = transform.translate(
          dx / transform.k,
          dy / transform.k,
        );
        return this.transition(this.svg)
          .call(this.zoom.transform, newTransform)
          .end()
          .catch(noop);
      }
    }
  }

  /**
   * Handle context menu (right-click) on node
   *
   * Requirements:
   * - 8.4: Display context menu on node right-click with options
   * - 7.2: Emit node:rightclick event
   */
  private handleContextMenu = (e: MouseEvent, d: INode) => {
    e.preventDefault();
    e.stopPropagation();

    // Requirement 7.2: Emit node:rightclick event with node data and position
    this.eventEmitter.emit('node:rightclick', d, {
      x: e.clientX,
      y: e.clientY,
    });

    this.contextMenu.show(d, e.clientX, e.clientY);
  };

  /**
   * Handle context menu (right-click) on canvas
   *
   * Requirements:
   * - 8.5: Display canvas-level context menu on canvas right-click with export options
   */
  private handleCanvasContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.contextMenu.showCanvasMenu(e.clientX, e.clientY);
  };

  /**
   * Handle "Copy as Markdown" action from context menu
   *
   * Requirements:
   * - 8.4: Provide "Copy as Markdown" option in context menu
   * - 4.1: Copy node subtree as Markdown to clipboard
   * - 4.2: Preserve hierarchical structure in export
   */
  private async handleCopyAsMarkdown(node: INode): Promise<void> {
    try {
      // Export the node and its subtree to Markdown
      const markdown = exportNodeAsMarkdown(node);

      // Copy to clipboard
      await navigator.clipboard.writeText(markdown);

      // Optional: Show a brief success notification
      // This could be enhanced with a toast notification in the future
      console.log('Copied to clipboard:', markdown);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  /**
   * Handle "Export as Markdown" action from canvas context menu
   *
   * Requirements:
   * - 8.5: Provide export options in canvas context menu
   */
  private async handleExportMarkdownFromCanvas(): Promise<void> {
    try {
      // Export the entire mindmap to Markdown
      const markdown = this.exportAsMarkdown();

      // Copy to clipboard
      await navigator.clipboard.writeText(markdown);

      // Optional: Show a brief success notification
      console.log('Exported entire mindmap to clipboard');
    } catch (error) {
      console.error('Failed to export markdown:', error);
    }
  }

  /**
   * Handle note icon click event.
   *
   * This method is called when the user clicks on a note icon.
   * It shows the note panel at the click position.
   *
   * Requirements:
   * - 5.5: Display note panel when user clicks note icon
   *
   * @param node - The node whose notes to display
   * @param x - X coordinate of click position
   * @param y - Y coordinate of click position
   */
  private handleNoteIconClick(node: INode, x: number, y: number): void {
    this.notePanel.show(node, x, y);
  }

  /**
   * Handle note save event.
   *
   * This method is called when the user edits notes in the note panel.
   * It updates the node data without triggering a re-render.
   * Re-render will happen when the panel is closed.
   *
   * Requirements:
   * - 5.7: Allow direct editing of inline and detailed notes
   * - 5.8: Auto-save changes to original Markdown data
   *
   * @param node - The node being edited
   * @param inlineNote - The new inline note content
   * @param detailedNote - The new detailed note content
   */
  private handleNoteSave(
    node: INode,
    inlineNote: string,
    detailedNote: string,
  ): void {
    // Update node data only, don't re-render yet
    (node as any).inlineNote = inlineNote || undefined;
    (node as any).detailedNote = detailedNote || undefined;
    (node as any).hasNote = !!(inlineNote || detailedNote);

    // Auto-save if storage is enabled
    // Requirements: 16.1
    if (this.options.enableAutoSave && this.storageManager) {
      this.saveToStorage();
    }
  }

  /**
   * Handle note panel close event.
   *
   * This method is called when the note panel is closed.
   * It triggers a re-render to update the display with any changes.
   * Note: Does not trigger auto-fit to avoid unwanted viewport changes.
   *
   * Requirements:
   * - 5.6: Close note panel and update display
   */
  private handleNotePanelClose(): void {
    // Re-render to update the display with any note changes
    // Pass originData to avoid triggering autoFit
    this.renderData();
  }

  /**
   * Sets up window resize handler to auto-scale mindmap.
   *
   * Requirements:
   * - 3.2: Auto-scale mindmap when browser window size changes
   */
  private setupWindowResizeHandler(): void {
    const handleResize = debounce(() => {
      if (this._enableWindowResize && this.state.data) {
        // Auto-fit the mindmap to the new viewport size
        this.fit();
      }
    }, 300);

    // Add window resize event listener
    window.addEventListener('resize', handleResize);

    // Add cleanup to dispose list
    this._disposeList.push(() => {
      window.removeEventListener('resize', handleResize);
    });
  }

  /**
   * Sets up keyboard shortcuts for undo/redo operations.
   *
   * Requirements:
   * - 5.9: Support undo with Cmd+Z (Mac) or Ctrl+Z (Windows)
   * - 12.2: Undo most recent edit with Cmd+Z / Ctrl+Z
   * - 12.3: Redo last undone operation with Cmd+Shift+Z / Ctrl+Y
   */
  private setupKeyboardShortcuts(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Determine if we should use Cmd (Mac) or Ctrl (Windows/Linux)
      const ctrlKey = isMacintosh ? e.metaKey : e.ctrlKey;

      // Cmd+Z / Ctrl+Z: Undo
      // Requirement 12.2: Undo most recent edit
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.handleUndo();
        return;
      }

      // Cmd+Shift+Z / Ctrl+Y: Redo
      // Requirement 12.3: Redo last undone operation
      if (
        (ctrlKey && e.key === 'z' && e.shiftKey) ||
        (ctrlKey && e.key === 'y')
      ) {
        e.preventDefault();
        this.handleRedo();
        return;
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Add cleanup to dispose list
    this._disposeList.push(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  /**
   * Sets up canvas context menu for right-click on empty canvas area.
   *
   * When the user right-clicks on the canvas (not on a node), a context menu
   * with export options should be displayed.
   *
   * Requirements:
   * - 8.5: Display canvas-level context menu on canvas right-click with export options
   */
  private setupCanvasContextMenu(): void {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    // Add context menu listener to the SVG element
    svgNode.addEventListener('contextmenu', this.handleCanvasContextMenu);

    // Add cleanup to dispose list
    this._disposeList.push(() => {
      svgNode.removeEventListener('contextmenu', this.handleCanvasContextMenu);
    });
  }

  /**
   * Sets up Space key drag functionality for canvas panning.
   *
   * When the user holds down the Space key and drags the mouse,
   * the canvas view should pan accordingly.
   *
   * Requirements:
   * - 8.2: Pan canvas view when user holds Space key and drags mouse
   */
  private setupSpaceKeyDrag(): void {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    // Track Space key state
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Space key is pressed
      if (e.key === ' ') {
        // Always prevent default space key behavior (page scroll)
        e.preventDefault();

        // Only activate drag mode if not already pressed
        if (!this._spaceKeyPressed) {
          this._spaceKeyPressed = true;

          // Change cursor to indicate drag mode
          svgNode.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        this._spaceKeyPressed = false;
        this._isDragging = false;

        // Reset cursor
        svgNode.style.cursor = '';
      }
    };

    // Handle mouse events for dragging
    const handleMouseDown = (e: MouseEvent) => {
      if (this._spaceKeyPressed) {
        e.preventDefault();
        this._isDragging = true;
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;

        // Change cursor to indicate active dragging
        svgNode.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (this._spaceKeyPressed && this._isDragging) {
        e.preventDefault();

        // Calculate the delta movement
        const dx = e.clientX - this._dragStartX;
        const dy = e.clientY - this._dragStartY;

        // Update drag start position for next move
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;

        // Pan the canvas
        const transform = zoomTransform(svgNode);
        const newTransform = transform.translate(
          dx / transform.k,
          dy / transform.k,
        );
        this.svg.call(this.zoom.transform, newTransform);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (this._isDragging) {
        e.preventDefault();
        this._isDragging = false;

        // Change cursor back to grab (Space is still held)
        if (this._spaceKeyPressed) {
          svgNode.style.cursor = 'grab';
        }
      }
    };

    // Handle case where mouse leaves the SVG while dragging
    const handleMouseLeave = () => {
      if (this._isDragging) {
        this._isDragging = false;

        // Change cursor back to grab if Space is still held
        if (this._spaceKeyPressed) {
          svgNode.style.cursor = 'grab';
        }
      }
    };

    // Add event listeners
    // Use capture phase to ensure our handlers run before D3's zoom handlers
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    svgNode.addEventListener('mousedown', handleMouseDown, true);
    svgNode.addEventListener('mousemove', handleMouseMove, true);
    svgNode.addEventListener('mouseup', handleMouseUp, true);
    svgNode.addEventListener('mouseleave', handleMouseLeave, true);

    // Add cleanup to dispose list
    this._disposeList.push(() => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      svgNode.removeEventListener('mousedown', handleMouseDown, true);
      svgNode.removeEventListener('mousemove', handleMouseMove, true);
      svgNode.removeEventListener('mouseup', handleMouseUp, true);
      svgNode.removeEventListener('mouseleave', handleMouseLeave, true);
    });
  }

  /**
   * Handles undo operation.
   *
   * Requirements:
   * - 12.2: Undo most recent edit operation
   * - 12.4: Update mindmap display and underlying Markdown data
   * - 12.5: Ignore undo command when no operations to undo
   */
  private handleUndo(): void {
    // Requirement 12.5: Ignore if nothing to undo
    if (!this.undoManager.canUndo()) {
      return;
    }

    // Perform undo
    const entry = this.undoManager.undo();
    if (entry) {
      // Requirement 12.4: Update mindmap display
      // The node state has already been updated by UndoManager.undo()
      // We just need to re-render the mindmap
      this.renderData();
    }
  }

  /**
   * Handles redo operation.
   *
   * Requirements:
   * - 12.3: Redo last undone operation
   * - 12.4: Update mindmap display and underlying Markdown data
   * - 12.6: Ignore redo command when no operations to redo
   */
  private handleRedo(): void {
    // Requirement 12.6: Ignore if nothing to redo
    if (!this.undoManager.canRedo()) {
      return;
    }

    // Perform redo
    const entry = this.undoManager.redo();
    if (entry) {
      // Requirement 12.4: Update mindmap display
      // The node state has already been updated by UndoManager.redo()
      // We just need to re-render the mindmap
      this.renderData();
    }
  }

  /**
   * Exports the mindmap (or a subtree) to Markdown format.
   *
   * This method converts the node tree back to Markdown, preserving:
   * - Hierarchical structure with proper indentation
   * - Inline notes (using colon separator)
   * - Detailed notes (using blockquote format)
   * - Escape characters for special characters
   *
   * Requirements:
   * - 4.1: Copy node subtree as Markdown to clipboard
   * - 4.2: Preserve hierarchical structure in export
   *
   * @param node - Optional node to export. If not provided, exports the entire tree.
   * @returns Markdown string representation of the node tree
   */
  exportAsMarkdown(node?: INode): string {
    // If no node is provided, use the root node
    const targetNode = node || this.state.data;

    // If there's no data, return empty string
    if (!targetNode) {
      return '';
    }

    // Use the utility function to export the node tree
    return exportNodeAsMarkdown(targetNode);
  }

  /**
   * Exports the mindmap as SVG string.
   *
   * This method returns the SVG content as a string, which can be saved
   * as an SVG file or used for further processing.
   *
   * Requirements:
   * - 4.5: Provide export as PNG, JPG, or SVG format
   * - 4.6: Generate image file containing current visible mindmap content
   *
   * @returns SVG string representation of the mindmap
   */
  exportAsSVG(): string {
    const svgNode = this.svg.node();
    if (!svgNode) {
      throw new Error('SVG element not found');
    }

    // Clone the SVG node to avoid modifying the original
    const clonedSvg = svgNode.cloneNode(true) as SVGElement;

    // Use the same rect calculation as fit() method
    const { x1, y1, x2, y2 } = this.state.rect;
    const naturalWidth = x2 - x1;
    const naturalHeight = y2 - y1;

    // Add padding to ensure content is not clipped
    const padding = 40;

    // Calculate the final dimensions with padding
    const finalWidth = naturalWidth + padding * 2;
    const finalHeight = naturalHeight + padding * 2;

    // Calculate the transform to center the content
    // This uses the same logic as fit() method
    const translateX = padding - x1;
    const translateY = padding - y1;

    // Apply the transform to the g element
    const clonedG = clonedSvg.querySelector('g');
    if (clonedG) {
      // Remove any existing transform and apply only our centering translation
      // This ensures the content is positioned correctly in the exported SVG
      clonedG.setAttribute(
        'transform',
        `translate(${translateX},${translateY})`,
      );
    }

    // Set viewBox to start at (0, 0) with the calculated dimensions
    clonedSvg.setAttribute('viewBox', `0 0 ${finalWidth} ${finalHeight}`);
    clonedSvg.setAttribute('width', finalWidth.toString());
    clonedSvg.setAttribute('height', finalHeight.toString());

    // Add all necessary XML namespaces
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Get computed styles from the original SVG
    const styleContent = this.getStyleContent();

    // Create a style element with all necessary styles
    const styleElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'style',
    );
    styleElement.setAttribute('type', 'text/css');
    styleElement.textContent = styleContent || '';

    // Insert style at the beginning of the SVG
    const defs =
      clonedSvg.querySelector('defs') ||
      document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!clonedSvg.querySelector('defs')) {
      clonedSvg.insertBefore(defs, clonedSvg.firstChild);
    }
    defs.insertBefore(styleElement, defs.firstChild);

    // Serialize the SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);

    return svgString;
  }

  /**
   * Exports the mindmap as PNG image.
   *
   * This method converts the SVG to a PNG blob using a canvas element.
   *
   * Requirements:
   * - 4.5: Provide export as PNG, JPG, or SVG format
   * - 4.6: Generate image file containing current visible mindmap content
   *
   * @returns Promise that resolves to a PNG Blob
   */
  async exportAsPNG(): Promise<Blob> {
    return this._exportAsRasterImage('image/png');
  }

  /**
   * Exports the mindmap as JPG image.
   *
   * This method converts the SVG to a JPG blob using a canvas element.
   *
   * Requirements:
   * - 4.5: Provide export as PNG, JPG, or SVG format
   * - 4.6: Generate image file containing current visible mindmap content
   *
   * @returns Promise that resolves to a JPG Blob
   */
  async exportAsJPG(): Promise<Blob> {
    return this._exportAsRasterImage('image/jpeg');
  }

  /**
   * Internal helper method to export mindmap as raster image (PNG or JPG).
   *
   * This method:
   * 1. Gets the SVG string
   * 2. Creates an Image element from the SVG
   * 3. Draws the image onto a canvas
   * 4. Converts the canvas to a Blob
   *
   * @param mimeType - The MIME type for the output image ('image/png' or 'image/jpeg')
   * @returns Promise that resolves to an image Blob
   */
  private async _exportAsRasterImage(
    mimeType: 'image/png' | 'image/jpeg',
  ): Promise<Blob> {
    // Get SVG string
    const svgString = this.exportAsSVG();

    // Get dimensions from state with padding
    const { x1, y1, x2, y2 } = this.state.rect;
    const padding = 20;
    const width = x2 - x1 + padding * 2;
    const height = y2 - y1 + padding * 2;

    // Validate dimensions
    if (width <= 0 || height <= 0) {
      throw new Error('Invalid SVG dimensions');
    }

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const scale = 2; // Use 2x scale for better quality
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Scale the context for high-DPI rendering
    ctx.scale(scale, scale);

    // For JPG, fill background with white (JPG doesn't support transparency)
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Create an image from the SVG string
    const img = new Image();

    // Use data URL instead of blob URL for better compatibility
    const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timeout'));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          // Draw the image onto the canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            mimeType,
            0.95, // Quality for JPEG
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Image load error:', error);
        reject(
          new Error(
            'Failed to load SVG image. This may be due to external resources or CORS issues.',
          ),
        );
      };

      // Set crossOrigin to handle CORS
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  }

  /**
   * Triggers browser download for a blob.
   *
   * This helper method creates a temporary anchor element and triggers
   * a download with the specified filename.
   *
   * Requirements:
   * - 4.7: Trigger browser download for exported image file
   *
   * @param blob - The blob to download
   * @param filename - The filename for the download
   */
  private _triggerDownload(blob: Blob, filename: string): void {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // Add to document, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Downloads the mindmap as PNG file.
   *
   * This method exports the mindmap as PNG and triggers a browser download.
   *
   * Requirements:
   * - 4.5: Provide export as PNG format
   * - 4.6: Generate image file containing current visible mindmap content
   * - 4.7: Trigger browser download for exported image file
   *
   * @param filename - Optional filename for the download (default: 'mindmap.png')
   */
  async downloadAsPNG(filename: string = 'mindmap.png'): Promise<void> {
    const blob = await this.exportAsPNG();
    this._triggerDownload(blob, filename);
  }

  /**
   * Downloads the mindmap as JPG file.
   *
   * This method exports the mindmap as JPG and triggers a browser download.
   *
   * Requirements:
   * - 4.5: Provide export as JPG format
   * - 4.6: Generate image file containing current visible mindmap content
   * - 4.7: Trigger browser download for exported image file
   *
   * @param filename - Optional filename for the download (default: 'mindmap.jpg')
   */
  async downloadAsJPG(filename: string = 'mindmap.jpg'): Promise<void> {
    const blob = await this.exportAsJPG();
    this._triggerDownload(blob, filename);
  }

  /**
   * Downloads the mindmap as SVG file.
   *
   * This method exports the mindmap as SVG and triggers a browser download.
   *
   * Requirements:
   * - 4.5: Provide export as SVG format
   * - 4.6: Generate image file containing current visible mindmap content
   * - 4.7: Trigger browser download for exported image file
   *
   * @param filename - Optional filename for the download (default: 'mindmap.svg')
   */
  downloadAsSVG(filename: string = 'mindmap.svg'): void {
    const svgString = this.exportAsSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    this._triggerDownload(blob, filename);
  }

  /**
   * Apply color scheme with smooth transition animation.
   *
   * This method updates the colors of all nodes and links with a smooth
   * transition animation, providing a better visual experience when
   * switching color schemes.
   *
   * Requirements:
   * - 10.6: Use smooth transition animation when switching colors
   *
   * @param colorFn - Function that returns color for a node
   */
  applyColorSchemeWithAnimation(colorFn: (node: INode) => string): void {
    const { duration } = this.options;

    // Animate node lines (the horizontal lines)
    this.g
      .selectAll<SVGLineElement, INode>(SELECTOR_NODE)
      .select<SVGLineElement>('line')
      .transition()
      .duration(duration)
      .attr('stroke', (d) => colorFn(d));

    // Animate node circles (the fold/unfold indicators)
    this.g
      .selectAll<SVGCircleElement, INode>(SELECTOR_NODE)
      .select<SVGCircleElement>('circle')
      .transition()
      .duration(duration)
      .attr('stroke', (d) => colorFn(d))
      .attr('fill', (d) =>
        d.payload?.fold && d.children
          ? colorFn(d)
          : 'var(--markmap-circle-open-bg)',
      );

    // Animate links (the connections between nodes)
    this.g
      .selectAll<SVGPathElement, d3.HierarchyPointLink<INode>>(SELECTOR_LINK)
      .transition()
      .duration(duration)
      .attr('stroke', (d) => colorFn(d.target.data));
  }

  /**
   * Save current state to localStorage.
   *
   * This method saves the current markdown content and view state
   * (transform and expanded nodes) to localStorage.
   *
   * Requirements:
   * - 16.1: Auto-save Markdown content when modified
   *
   * @returns true if save was successful, false otherwise
   */
  saveToStorage(): boolean {
    if (!this.storageManager || this.storageManager.isReadOnly()) {
      return false;
    }

    const svgNode = this.svg.node();
    if (!svgNode) return false;

    const transform = zoomTransform(svgNode);

    // Collect expanded node paths
    const expandedNodes: string[] = [];
    if (this.state.data) {
      walkTree(this.state.data, (node, next) => {
        if (!node.payload?.fold) {
          expandedNodes.push(node.state?.path ?? '');
          next();
        }
      });
    }

    return this.storageManager.save({
      markdown: this.markdownContent,
      viewState: {
        transform: {
          x: transform.x,
          y: transform.y,
          k: transform.k,
        },
        expandedNodes,
      },
    });
  }

  /**
   * Load saved state from localStorage.
   *
   * This method loads the saved markdown content and view state
   * from localStorage and applies it to the current mindmap.
   *
   * Requirements:
   * - 16.2: Load saved Markdown content and view state on app restart
   *
   * @returns true if load was successful, false otherwise
   */
  loadFromStorage(): boolean {
    if (!this.storageManager) {
      return false;
    }

    const data = this.storageManager.load();
    if (!data) {
      return false;
    }

    // Restore markdown content
    if (data.markdown) {
      this.markdownContent = data.markdown;
      // Note: The actual parsing and rendering of markdown should be done
      // by the caller (e.g., using Transformer from markmap-lib)
      // This method only restores the raw markdown content
    }

    // Restore view state
    if (data.viewState) {
      // Restore transform
      if (data.viewState.transform) {
        const { x, y, k } = data.viewState.transform;
        const svgNode = this.svg.node();
        if (svgNode) {
          const newTransform = zoomIdentity.translate(x, y).scale(k);
          this.svg.call(this.zoom.transform, newTransform);
        }
      }

      // Restore expanded nodes
      if (data.viewState.expandedNodes && this.state.data) {
        const expandedSet = new Set(data.viewState.expandedNodes);
        walkTree(this.state.data, (node, next) => {
          if (expandedSet.has(node.state?.path ?? '')) {
            node.payload = {
              ...node.payload,
              fold: 0,
            };
            next();
          } else {
            node.payload = {
              ...node.payload,
              fold: 1,
            };
          }
        });
      }
    }

    return true;
  }

  /**
   * Set markdown content and optionally save to storage.
   *
   * This method updates the internal markdown content and triggers
   * auto-save if enabled.
   *
   * Requirements:
   * - 16.1: Auto-save Markdown content when modified
   * - 13.7: Notify external application when content changes
   *
   * @param markdown - The markdown content to set
   */
  setMarkdownContent(markdown: string): void {
    this.markdownContent = markdown;

    // Auto-save if enabled
    if (this.options.enableAutoSave && this.storageManager) {
      this.saveToStorage();
    }

    // Requirement 13.7: Notify external application when markdown changes
    if (this.options.onMarkdownChange) {
      this.options.onMarkdownChange(markdown);
    }
  }

  /**
   * Get current markdown content.
   *
   * @returns The current markdown content
   */
  getMarkdownContent(): string {
    return this.markdownContent;
  }

  /**
   * Check if storage is in read-only mode.
   *
   * Requirements:
   * - 16.3: Display warning and run in read-only mode when localStorage unavailable
   *
   * @returns true if in read-only mode, false otherwise
   */
  isStorageReadOnly(): boolean {
    return this.storageManager?.isReadOnly() ?? false;
  }

  destroy() {
    this.svg.on('.zoom', null);
    this.svg.html(null);
    this.contextMenu.destroy();
    this.touchManager.disableTouch();
    this._disposeList.forEach((fn) => {
      fn();
    });
  }

  /**
   * Register Providers from options into DIContainer.
   *
   * This method registers custom UI providers if they are provided in the options.
   * If a provider is not provided, the system will use default implementations or
   * gracefully degrade.
   *
   * Requirements:
   * - 3.1: Use custom Provider when provided in configuration
   * - 3.2: Use default Provider for unprovided ones
   * - 3.3: Gracefully degrade when no Provider is available
   *
   * @param opts - Markmap options that may contain custom providers
   */
  private registerProviders(opts?: Partial<IMarkmapOptions>): void {
    if (!opts) return;

    // Register NoteProvider if provided
    if ((opts as any).noteProvider) {
      this.diContainer.register<INoteProvider>(
        'noteProvider',
        (opts as any).noteProvider,
      );
    }

    // Register ContextMenuProvider if provided
    if ((opts as any).contextMenuProvider) {
      this.diContainer.register<IContextMenuProvider>(
        'contextMenuProvider',
        (opts as any).contextMenuProvider,
      );
    }

    // Register ToolbarProvider if provided
    if ((opts as any).toolbarProvider) {
      this.diContainer.register<IToolbarProvider>(
        'toolbarProvider',
        (opts as any).toolbarProvider,
      );
    }

    // Register SearchProvider if provided
    if ((opts as any).searchProvider) {
      this.diContainer.register<ISearchProvider>(
        'searchProvider',
        (opts as any).searchProvider,
      );
    }
  }

  /**
   * Initialize UI components.
   *
   * This method initializes UI components based on registered providers.
   * It connects the providers to the core functionality and sets up
   * event handlers.
   *
   * Requirements:
   * - 3.1: Initialize UI with registered providers
   * - 7.1: Connect events to UI components
   *
   * @private
   */
  private initializeUI(): void {
    // Get registered providers from DIContainer
    // const noteProvider = this.diContainer.resolve<INoteProvider>('noteProvider');
    // const contextMenuProvider = this.diContainer.resolve<IContextMenuProvider>('contextMenuProvider');
    // const toolbarProvider = this.diContainer.resolve<IToolbarProvider>('toolbarProvider');
    // const searchProvider = this.diContainer.resolve<ISearchProvider>('searchProvider');

    // Initialize providers if they exist
    // For now, we keep the existing UI components (NotePanel, ContextMenu, etc.)
    // In the future, these will be replaced by the provider implementations

    // Set up event listeners for UI integration
    // Requirements: 7.1, 7.2, 7.3
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for UI integration.
   *
   * This method connects core events to UI components and external callbacks.
   *
   * Requirements:
   * - 7.1: Emit node:click event when node is clicked
   * - 7.2: Emit node:rightclick event when node is right-clicked
   * - 7.3: Emit data:change event when data is updated
   *
   * @private
   */
  private setupEventHandlers(): void {
    // These events will be emitted by the existing methods
    // The event emission is integrated into the existing event handlers
  }

  /**
   * Get the DIContainer instance.
   *
   * This allows external code to access the dependency injection container
   * for advanced use cases.
   *
   * Requirements: 3.1
   *
   * @returns The DIContainer instance
   */
  public getContainer(): DIContainer {
    return this.diContainer;
  }

  /**
   * Get the EventEmitter instance.
   *
   * This allows external code to listen to events emitted by Markmap.
   *
   * Requirements: 7.1
   *
   * @returns The EventEmitter instance
   */
  public getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Create a Markmap instance with default UI.
   *
   * This static method provides backward compatibility with the old API.
   * It creates a Markmap instance with all default UI components if no
   * custom providers are specified.
   *
   * Requirements:
   * - 10.1: Create instance with default UI when using Markmap.create
   * - 10.2: Parse old configuration options correctly
   * - 10.3: Maintain same behavior as old API
   *
   * @param svg - SVG element or selector
   * @param opts - Markmap options (optional)
   * @param data - Initial data (optional)
   * @returns Markmap instance
   */
  static create(
    svg: string | SVGElement | ID3SVGElement,
    opts?: Partial<IMarkmapOptions>,
    data: IPureNode | null = null,
  ): Markmap {
    // Note: In the future, when markmap-ui-default is fully implemented,
    // we would automatically inject default providers here if none are provided.
    // For now, the existing UI components (NotePanel, ContextMenu, etc.) serve
    // as the default UI.

    const mm = new Markmap(svg, opts);
    if (data) {
      mm.setData(data).then(() => {
        mm.fit(); // always fit for the first render
      });
    }
    return mm;
  }
}
