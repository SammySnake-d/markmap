import type * as d3 from 'd3';
import { linkHorizontal, max, min, select, zoom, zoomIdentity } from 'd3';
import { flextree } from 'd3-flextree';
import { INode, IPureNode, walkTree, getId } from 'markmap-common';

/**
 * 布局节点
 */
export interface ILayoutNode {
  id: string;
  x: number;
  y: number;
  data: INode;
}

/**
 * 布局连线
 */
export interface ILayoutLink {
  source: ILayoutNode;
  target: ILayoutNode;
}

/**
 * 布局结果
 */
export interface ILayoutResult {
  nodes: ILayoutNode[];
  links: ILayoutLink[];
}

/**
 * 视图变换
 */
export interface ITransform {
  x: number;
  y: number;
  k: number; // scale
}

/**
 * 核心渲染选项
 */
export interface ICoreOptions {
  /** SVG 元素或选择器 */
  svg?: string | SVGElement;
  /** 最大宽度 */
  maxWidth?: number;
  /** 水平内边距 */
  paddingX?: number;
  /** 水平间距 */
  spacingHorizontal?: number;
  /** 垂直间距 */
  spacingVertical?: number;
  /** 动画持续时间 */
  duration?: number;
  /** 适应比例 */
  fitRatio?: number;
  /** 最大初始缩放 */
  maxInitialScale?: number;
  /** 颜色函数 */
  color?: (node: INode) => string;
  /** 线宽函数 */
  lineWidth?: (node: INode) => number;
  /** 初始展开层级 */
  initialExpandLevel?: number;
  /** 是否嵌入全局 CSS */
  embedGlobalCSS?: boolean;
  /** 自定义样式 */
  style?: string | ((id: string) => string);
  /** 唯一标识符 */
  id?: string;
}

/**
 * 默认选项
 */
const defaultCoreOptions: Required<ICoreOptions> = {
  svg: '',
  maxWidth: 0,
  paddingX: 8,
  spacingHorizontal: 80,
  spacingVertical: 5,
  duration: 500,
  fitRatio: 0.95,
  maxInitialScale: 2,
  color: () => '',
  lineWidth: () => 2,
  initialExpandLevel: -1,
  embedGlobalCSS: true,
  style: '',
  id: '',
};

const SELECTOR_NODE = 'g.markmap-node';
const SELECTOR_LINK = 'path.markmap-link';

const linkShape = linkHorizontal();

function stopPropagation(e: Event) {
  e.stopPropagation();
}

/**
 * Markmap 核心渲染引擎
 *
 * 负责节点布局计算、SVG 渲染、连线绘制和动画系统
 * 不包含任何 UI 组件逻辑，完全独立
 *
 * Requirements: 1.1, 1.2
 *
 * 注意：此类使用 markmap-common 的 INode 类型（包含 state 属性）
 * 而不是 markmap-interfaces 的 INode（不包含 state）
 * 这是因为核心渲染引擎需要 state 来存储布局信息
 */
export class MarkmapCore {
  private options: Required<ICoreOptions>;
  private svg: d3.Selection<SVGElement, unknown, null, undefined>;
  private styleNode: d3.Selection<SVGStyleElement, unknown, null, undefined>;
  private g: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom: d3.ZoomBehavior<SVGElement, unknown>;
  private _observer: ResizeObserver;
  private state: {
    id: string;
    data?: INode;
    rect: { x1: number; y1: number; x2: number; y2: number };
  };

  constructor(svg: string | SVGElement, options?: Partial<ICoreOptions>) {
    this.options = { ...defaultCoreOptions, ...options };

    // 初始化 SVG
    const svgSelection = typeof svg === 'string' ? select(svg) : select(svg);
    this.svg = svgSelection as d3.Selection<
      SVGElement,
      unknown,
      null,
      undefined
    >;
    this.styleNode = this.svg.append('style') as unknown as d3.Selection<
      SVGStyleElement,
      unknown,
      null,
      undefined
    >;

    // 初始化缩放行为
    this.zoom = zoom<SVGElement, unknown>().on('zoom', this.handleZoom);

    // 初始化状态
    this.state = {
      id: this.options.id || this.svg.attr('id') || getId(),
      rect: { x1: 0, y1: 0, x2: 0, y2: 0 },
    };

    // 创建主容器组
    this.g = this.svg.append('g') as d3.Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    >;

    // 初始化 ResizeObserver
    this._observer = new ResizeObserver(() => {
      if (this.state.data) {
        this.renderData(this.state.data);
      }
    });

    // 应用缩放
    this.svg.call(this.zoom);
  }

  /**
   * 处理缩放事件
   */
  private handleZoom = (e: any) => {
    const { transform } = e;
    this.g.attr('transform', transform);
  };

  /**
   * 初始化节点数据
   * 为每个节点分配 ID、深度、路径等状态信息
   */
  private _initializeData(node: IPureNode | INode): INode {
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
        this._simpleHash(item.content);
      item.state.path = [parent?.state?.path, item.state.id]
        .filter(Boolean)
        .join('.');

      color(item); // 预加载颜色

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

  /**
   * 简单哈希函数
   */
  private _simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * 计算节点布局
   * 使用 d3-flextree 计算每个节点的位置
   *
   * Requirements: 1.1
   */
  calculateLayout(data: INode): ILayoutResult {
    if (!data) {
      return { nodes: [], links: [] };
    }

    const { lineWidth, paddingX, spacingHorizontal, spacingVertical } =
      this.options;

    // 创建布局算法
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

    // 构建层次结构
    const tree = layout.hierarchy(data);
    layout(tree);

    // 提取节点和连线
    const fnodes = tree.descendants() as any[];
    const nodes: ILayoutResult['nodes'] = [];
    const links: ILayoutResult['links'] = [];

    fnodes.forEach((fnode: any) => {
      const node = fnode.data as INode;
      if (node.state) {
        node.state.rect = {
          x: fnode.y as number,
          y: (fnode.x as number) - (fnode.xSize as number) / 2,
          width: (fnode.ySize as number) - spacingHorizontal,
          height: fnode.xSize as number,
        };
      }

      nodes.push({
        id: node.state?.id?.toString() || '',
        x: fnode.y as number,
        y: fnode.x as number,
        data: node,
      });

      // 添加连线
      if (fnode.parent && !node.payload?.fold) {
        const parentData = fnode.parent.data as INode;
        links.push({
          source: {
            id: parentData.state?.id?.toString() || '',
            x: fnode.parent.y as number,
            y: fnode.parent.x as number,
            data: parentData,
          },
          target: {
            id: node.state?.id?.toString() || '',
            x: fnode.y as number,
            y: fnode.x as number,
            data: node,
          },
        });
      }
    });

    // 更新状态矩形
    this.state.rect = {
      x1:
        min(
          fnodes,
          (fnode: any) => (fnode.data as INode).state?.rect?.x ?? 0,
        ) || 0,
      y1:
        min(
          fnodes,
          (fnode: any) => (fnode.data as INode).state?.rect?.y ?? 0,
        ) || 0,
      x2:
        max(
          fnodes,
          (fnode: any) =>
            ((fnode.data as INode).state?.rect?.x ?? 0) +
            ((fnode.data as INode).state?.rect?.width ?? 0),
        ) || 0,
      y2:
        max(
          fnodes,
          (fnode: any) =>
            ((fnode.data as INode).state?.rect?.y ?? 0) +
            ((fnode.data as INode).state?.rect?.height ?? 0),
        ) || 0,
    };

    return { nodes, links };
  }

  /**
   * 重新计算布局
   * 在节点大小变化后调用
   */
  private _relayout() {
    if (!this.state.data) return;

    // 更新节点大小
    this.g
      .selectAll<SVGGElement, INode>(SELECTOR_NODE)
      .selectAll<SVGForeignObjectElement, INode>('foreignObject')
      .each(function (d) {
        const el = this.firstChild?.firstChild as HTMLDivElement;
        if (el) {
          const newSize: [number, number] = [el.scrollWidth, el.scrollHeight];
          if (d.state) {
            d.state.size = newSize;
          }
        }
      });

    // 重新计算布局
    this.calculateLayout(this.state.data);
  }

  /**
   * 渲染数据到 SVG
   *
   * Requirements: 1.1, 1.2
   */
  renderData(data: INode): void {
    // 初始化数据
    if (!this.state.data) {
      this.state.data = this._initializeData(data);
    } else {
      this.state.data = data;
    }

    const { paddingX, color, maxWidth, lineWidth } = this.options;
    const rootNode = this.state.data;

    // 收集所有可见节点
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

    // 用于动画的源矩形映射
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

    // 更新节点
    const mmG = this.g
      .selectAll<SVGGElement, INode>(SELECTOR_NODE)
      .each((d) => {
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
        ['markmap-node', d.payload?.fold && 'markmap-fold']
          .filter(Boolean)
          .join(' '),
      );

    // 渲染节点下的线条
    const mmLine = mmGMerge.selectAll<SVGLineElement, INode>('line').data(
      (d) => [d],
      (d) => d.state?.key || '',
    );

    const mmLineEnter = mmLine
      .enter()
      .append('line')
      .attr('stroke', (d) => color(d))
      .attr('stroke-width', 0);

    const mmLineMerge = mmLine.merge(mmLineEnter);

    // 渲染折叠/展开圆圈
    const mmCircle = mmGMerge.selectAll<SVGCircleElement, INode>('circle').data(
      (d) => (d.children?.length ? [d] : []),
      (d) => d.state?.key || '',
    );

    const mmCircleEnter = mmCircle
      .enter()
      .append('circle')
      .attr('stroke-width', 0)
      .attr('r', 0)
      .on('mousedown', stopPropagation);

    const mmCircleMerge = mmCircleEnter
      .merge(mmCircle)
      .attr('stroke', (d) => color(d))
      .attr('fill', (d) =>
        d.payload?.fold && d.children
          ? color(d)
          : 'var(--markmap-circle-open-bg)',
      );

    // 渲染节点内容
    const observer = this._observer;
    const mmFo = mmGMerge
      .selectAll<SVGForeignObjectElement, INode>('foreignObject')
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
      .on('dblclick', stopPropagation);

    mmFoEnter
      .append<HTMLDivElement>('xhtml:div')
      .append<HTMLDivElement>('xhtml:div')
      .html((d) => d.content)
      .attr('xmlns', 'http://www.w3.org/1999/xhtml');

    mmFoEnter.each(function () {
      const el = this.firstChild?.firstChild as Element;
      if (el) observer.observe(el);
    });

    const mmFoExit = mmGExit.selectAll<SVGForeignObjectElement, INode>(
      'foreignObject',
    );

    mmFoExit.each(function () {
      const el = this.firstChild?.firstChild as Element;
      if (el) observer.unobserve(el);
    });

    const mmFoMerge = mmFoEnter.merge(mmFo);

    // 渲染连线
    const links = nodes.flatMap((node) =>
      node.payload?.fold
        ? []
        : node.children.map((child) => ({ source: node, target: child })),
    );

    const mmPath = this.g
      .selectAll<
        SVGPathElement,
        { source: INode; target: INode }
      >(SELECTOR_LINK)
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

    // 设置最大宽度
    this.svg.style(
      '--markmap-max-width',
      maxWidth ? `${maxWidth}px` : (null as any),
    );

    // 等待下一帧，然后重新计算布局
    requestAnimationFrame(() => {
      this._relayout();

      // 应用动画
      // 节点进入动画
      mmGEnter.attr('transform', (d) => {
        const originRect = getOriginSourceRect(d);
        const rect = d.state?.rect || { x: 0, y: 0, width: 0, height: 0 };
        return `translate(${originRect.x + originRect.width - rect.width},${
          originRect.y + originRect.height - rect.height
        })`;
      });

      // 节点退出动画
      this._transition(mmGExit)
        .attr('transform', (d) => {
          const targetRect = getOriginTargetRect(d);
          const rect = d.state?.rect || { x: 0, y: 0, width: 0, height: 0 };
          const targetX = targetRect.x + targetRect.width - rect.width;
          const targetY = targetRect.y + targetRect.height - rect.height;
          return `translate(${targetX},${targetY})`;
        })
        .remove();

      // 节点更新动画
      this._transition(mmGMerge).attr('transform', (d) => {
        const rect = d.state?.rect || { x: 0, y: 0, width: 0, height: 0 };
        return `translate(${rect.x},${rect.y})`;
      });

      // 线条动画
      const mmLineExit = mmGExit.selectAll<SVGLineElement, INode>('line');

      this._transition(mmLineExit)
        .attr('x1', (d) => d.state?.rect?.width ?? 0)
        .attr('stroke-width', 0);

      mmLineEnter
        .attr('x1', (d) => d.state?.rect?.width ?? 0)
        .attr('x2', (d) => d.state?.rect?.width ?? 0);

      mmLineMerge
        .attr('y1', (d) => (d.state?.rect?.height ?? 0) + lineWidth(d) / 2)
        .attr('y2', (d) => (d.state?.rect?.height ?? 0) + lineWidth(d) / 2);

      this._transition(mmLineMerge)
        .attr('x1', -1)
        .attr('x2', (d) => (d.state?.rect?.width ?? 0) + 2)
        .attr('stroke', (d) => color(d))
        .attr('stroke-width', lineWidth);

      // 圆圈动画
      const mmCircleExit = mmGExit.selectAll<SVGCircleElement, INode>('circle');

      this._transition(mmCircleExit).attr('r', 0).attr('stroke-width', 0);

      mmCircleMerge
        .attr('cx', (d) => d.state?.rect?.width ?? 0)
        .attr('cy', (d) => (d.state?.rect?.height ?? 0) + lineWidth(d) / 2);

      this._transition(mmCircleMerge).attr('r', 6).attr('stroke-width', '1.5');

      // 内容动画
      this._transition(mmFoExit).style('opacity', 0);

      mmFoMerge
        .attr('width', (d) =>
          Math.max(0, (d.state?.rect?.width ?? 0) - paddingX * 2),
        )
        .attr('height', (d) => d.state?.rect?.height ?? 0);

      this._transition(mmFoMerge).style('opacity', 1);

      // 连线动画
      this._transition(mmPathExit)
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

      this._transition(mmPathMerge)
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
    });
  }

  /**
   * 创建过渡动画
   */
  private _transition<T extends d3.BaseType, U, P extends d3.BaseType, Q>(
    sel: d3.Selection<T, U, P, Q>,
  ): d3.Transition<T, U, P, Q> {
    const { duration } = this.options;
    return sel.transition().duration(duration);
  }

  /**
   * 执行动画过渡
   *
   * Requirements: 1.1
   */
  transition(duration?: number): void {
    if (duration !== undefined) {
      this.options.duration = duration;
    }
  }

  /**
   * 应用视图变换
   *
   * Requirements: 1.1
   */
  applyTransform(transform: ITransform): void {
    const svgNode = this.svg.node();
    if (!svgNode) return;

    const newTransform = zoomIdentity
      .translate(transform.x, transform.y)
      .scale(transform.k);

    this.svg.call(this.zoom.transform, newTransform);
  }

  /**
   * 获取 SVG 元素
   *
   * Requirements: 1.1
   */
  getSVG(): SVGElement {
    return this.svg.node()!;
  }

  /**
   * 销毁核心实例
   */
  destroy(): void {
    this.svg.on('.zoom', null);
    this._observer.disconnect();
  }
}
