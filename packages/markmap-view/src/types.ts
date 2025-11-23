import { INode } from 'markmap-common';
import type {
  INoteProvider,
  IContextMenuProvider,
  IToolbarProvider,
  ISearchProvider,
} from 'markmap-interfaces';

export interface IMarkmapState {
  id: string;
  data?: INode;
  highlight?: INode;
  rect: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };
}

/**
 * Portable options that can be derived into `IMarkmapOptions`.
 */
export interface IMarkmapJSONOptions {
  color: string[];
  colorFreezeLevel: number;
  duration: number;
  extraCss: string[];
  extraJs: string[];
  fitRatio: number;
  initialExpandLevel: number;
  maxInitialScale: number;
  maxWidth: number;
  nodeMinHeight: number;
  paddingX: number;
  pan: boolean;
  spacingHorizontal: number;
  spacingVertical: number;
  zoom: boolean;
  lineWidth: number | number[];
}

export interface IMarkmapOptions {
  autoFit: boolean;
  duration: number;
  embedGlobalCSS: boolean;
  fitRatio: number;
  id?: string;
  initialExpandLevel: number;
  maxInitialScale: number;
  pan: boolean;
  scrollForPan: boolean;
  style?: (id: string) => string;
  toggleRecursively: boolean;
  zoom: boolean;

  // Mobile support options
  // Requirements: 11.2, 11.3
  enableTouch?: boolean; // Enable touch gestures (default: true)

  // Storage options
  // Requirements: 16.1, 16.2, 16.3
  enableAutoSave?: boolean; // Enable auto-save to localStorage (default: false)
  storageKey?: string; // Custom localStorage key (default: 'markmap-data')

  // Theme options
  color: (node: INode) => string;
  lineWidth: (node: INode) => number;
  maxWidth: number;
  nodeMinHeight: number;
  paddingX: number;
  spacingHorizontal: number;
  spacingVertical: number;

  // UI Providers (optional)
  // Requirements: 3.1, 3.2
  noteProvider?: INoteProvider;
  contextMenuProvider?: IContextMenuProvider;
  toolbarProvider?: IToolbarProvider;
  searchProvider?: ISearchProvider;

  // Callback functions
  // Requirements: 13.7
  onMarkdownChange?: (markdown: string) => void; // Called when markdown content changes
  onNodeClick?: (node: INode) => void; // Called when a node is clicked
  onNoteEdit?: (node: INode, note: string) => void; // Called when a note is edited
}

export interface IPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type ID3SVGElement = d3.Selection<SVGElement, INode, HTMLElement, INode>;
