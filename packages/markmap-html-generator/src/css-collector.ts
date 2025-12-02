/**
 * CSS Collector for HTML Generator
 *
 * Requirements:
 * - 14.2: Collect and inline all CSS styles
 *
 * This module collects all necessary CSS from markmap packages
 * and combines them into a single inlined stylesheet.
 */

import { BASE_STYLES } from './template';

/**
 * Markmap view styles - core visualization styles
 * Copied from markmap-view/src/style.css
 */
const MARKMAP_VIEW_STYLES = `
.markmap {
  --markmap-max-width: 9999px;
  --markmap-a-color: #0097e6;
  --markmap-a-hover-color: #00a8ff;
  --markmap-code-bg: #f0f0f0;
  --markmap-code-color: #555;
  --markmap-highlight-bg: #ffeaa7;
  --markmap-table-border: 1px solid currentColor;
  --markmap-font: 300 16px/20px sans-serif;
  --markmap-circle-open-bg: #fff;
  --markmap-text-color: #333;
  --markmap-highlight-node-bg: #ff02;

  font: var(--markmap-font);
  color: var(--markmap-text-color);
}

.markmap-link {
  fill: none;
}

.markmap-node > circle {
  cursor: pointer;
}

.markmap-foreign {
  display: inline-block;
}

.markmap-foreign p {
  margin: 0;
}

.markmap-foreign a {
  color: var(--markmap-a-color);
}

.markmap-foreign a:hover {
  color: var(--markmap-a-hover-color);
}

.markmap-foreign code {
  padding: 0.25em;
  font-size: calc(1em - 2px);
  color: var(--markmap-code-color);
  background-color: var(--markmap-code-bg);
  border-radius: 2px;
}

.markmap-foreign pre {
  margin: 0;
}

.markmap-foreign pre > code {
  display: block;
}

.markmap-foreign del {
  text-decoration: line-through;
}

.markmap-foreign em {
  font-style: italic;
}

.markmap-foreign strong {
  font-weight: bold;
}

.markmap-foreign mark {
  background: var(--markmap-highlight-bg);
}

.markmap-foreign table,
.markmap-foreign th,
.markmap-foreign td {
  border-collapse: collapse;
  border: var(--markmap-table-border);
}

.markmap-foreign img {
  display: inline-block;
}

.markmap-foreign svg {
  fill: currentColor;
}

.markmap-foreign > div {
  width: var(--markmap-max-width);
  text-align: left;
}

.markmap-foreign > div > div {
  display: inline-block;
}

.markmap-note-icon {
  display: inline-block;
  margin-left: 0.5em;
  font-size: 0.9em;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.markmap-note-icon:hover {
  opacity: 1;
}

.markmap-highlight rect {
  fill: var(--markmap-highlight-node-bg);
}

.markmap-node.markmap-search-highlight > foreignObject {
  background-color: var(--markmap-highlight-bg);
  border-radius: 4px;
}

.markmap-dark .markmap {
  --markmap-code-bg: #1a1b26;
  --markmap-code-color: #ddd;
  --markmap-circle-open-bg: #444;
  --markmap-text-color: #eee;
}
`;

/**
 * Note panel styles
 */
const NOTE_PANEL_STYLES = `
.markmap-note-panel {
  position: fixed;
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
}

.markmap-dark .markmap-note-panel {
  background: #2d2d3d;
  border-color: #444;
  color: #e0e0e0;
}

.markmap-note-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.markmap-dark .markmap-note-panel h3 {
  color: #e0e0e0;
}

.markmap-note-panel textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  line-height: 1.6;
}

.markmap-dark .markmap-note-panel textarea {
  background: #1a1a2e;
  border-color: #555;
  color: #e0e0e0;
}
`;

/**
 * Context menu styles
 */
const CONTEXT_MENU_STYLES = `
.markmap-context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  z-index: 10000;
  min-width: 180px;
}

.markmap-dark .markmap-context-menu {
  background: #2d2d3d;
  border-color: #555;
}

.markmap-context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.markmap-dark .markmap-context-menu-item {
  color: #e0e0e0;
}

.markmap-context-menu-item:hover {
  background-color: #f5f5f5;
}

.markmap-dark .markmap-context-menu-item:hover {
  background-color: #3d3d4d;
}
`;

/**
 * Toolbar styles - Excalidraw style
 */
const TOOLBAR_STYLES = `
.mm-toolbar {
  display: flex;
  align-items: center;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  line-height: 1;
  padding: 8px;
  user-select: none;
  gap: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.mm-toolbar:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.1);
}

.mm-toolbar svg {
  display: block;
  transition: transform 0.2s;
}

.mm-toolbar a {
  display: inline-block;
  text-decoration: none;
}

.mm-toolbar-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.mm-toolbar-brand > img {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  transition: transform 0.2s;
}

.mm-toolbar-brand > span {
  font-size: 14px;
  font-weight: 500;
}

.mm-toolbar-brand:hover {
  background: #f3f4f6;
}

.mm-toolbar-brand:hover > img {
  transform: rotate(12deg);
}

.mm-toolbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.2s ease-out;
}

.mm-toolbar-item > * {
  cursor: pointer;
  color: #4b5563;
  text-align: center;
  transition: color 0.2s;
}

.mm-toolbar-item:hover {
  background: #f3f4f6;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.mm-toolbar-item:hover > * {
  color: #111827;
}

.mm-toolbar-item:hover svg {
  transform: scale(1.1);
}

.mm-toolbar-item:active {
  background: #e5e7eb;
  transform: scale(0.95);
}

.mm-toolbar-item.active {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.mm-toolbar-item.active > * {
  color: #2563eb;
}

.markmap-dark .mm-toolbar {
  background: #1f2937;
  border-color: #374151;
  color: #d1d5db;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-toolbar:hover {
  border-color: #4b5563;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.35);
}

.markmap-dark .mm-toolbar-brand:hover {
  background: #374151;
}

.markmap-dark .mm-toolbar-item > * {
  color: #d1d5db;
}

.markmap-dark .mm-toolbar-item:hover {
  background: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-toolbar-item:hover > * {
  color: #f3f4f6;
}

.markmap-dark .mm-toolbar-item:active {
  background: #4b5563;
}

.markmap-dark .mm-toolbar-item.active {
  background: #1e3a5f;
  border-color: #1d4ed8;
}

.markmap-dark .mm-toolbar-item.active > * {
  color: #93c5fd;
}
`;

/**
 * Enhanced toolbar styles
 */
const ENHANCED_TOOLBAR_STYLES = `
.mm-enhanced-toolbar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease-in-out;
}

.mm-enhanced-toolbar:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.1), 0 12px 32px rgba(0, 0, 0, 0.08);
}

.mm-enhanced-toolbar-top {
  top: 20px;
}

.mm-enhanced-toolbar-bottom {
  bottom: 20px;
}

.mm-enhanced-toolbar .mm-toolbar-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease-out;
  background: transparent;
}

.mm-enhanced-toolbar .mm-toolbar-item:hover {
  background: #f3f4f6;
  color: #111827;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.mm-enhanced-toolbar .mm-toolbar-item:active {
  transform: scale(0.95);
  background: #e5e7eb;
}

.mm-enhanced-toolbar .mm-toolbar-item.active {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.mm-enhanced-toolbar .mm-toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 4px;
}

.mm-enhanced-toolbar .mm-toolbar-item svg {
  width: 20px;
  height: 20px;
  transition: transform 0.2s;
}

.mm-enhanced-toolbar .mm-toolbar-item:hover svg {
  transform: scale(1.1);
}

.markmap-dark .mm-enhanced-toolbar {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.25);
}

.markmap-dark .mm-enhanced-toolbar:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-enhanced-toolbar .mm-toolbar-item {
  color: #d1d5db;
}

.markmap-dark .mm-enhanced-toolbar .mm-toolbar-item:hover {
  background: #374151;
  color: #f3f4f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-enhanced-toolbar .mm-toolbar-item:active {
  background: #4b5563;
}

.markmap-dark .mm-enhanced-toolbar .mm-toolbar-item.active {
  background: #1e3a5f;
  color: #93c5fd;
  border-color: #1d4ed8;
}
`;

/**
 * Search box styles
 */
const SEARCH_BOX_STYLES = `
.mm-search-box {
  display: inline-flex;
  align-items: center;
  margin-right: 12px;
}

.mm-search-box-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease-out;
  min-width: 220px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.mm-search-box-wrapper:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mm-search-box-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mm-search-icon {
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  pointer-events: none;
  transition: color 0.2s;
}

.mm-search-box-wrapper:focus-within .mm-search-icon {
  color: #3b82f6;
}

.mm-search-input {
  width: 100%;
  padding: 8px 40px 8px 40px;
  font-size: 14px;
  background: transparent;
  border: 0;
  outline: none;
  color: #374151;
  transition: all 0.2s;
}

.mm-search-input::placeholder {
  color: #9ca3af;
}

.mm-search-input:focus::placeholder {
  color: #d1d5db;
}

.mm-search-clear {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #9ca3af;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.mm-search-clear:hover {
  color: #4b5563;
  background: #f3f4f6;
  transform: scale(1.1);
}

.mm-search-clear:active {
  background: #e5e7eb;
  transform: scale(0.95);
}

.markmap-dark .mm-search-box-wrapper {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-search-box-wrapper:hover {
  border-color: #4b5563;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.markmap-dark .mm-search-box-wrapper:focus-within {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2), 0 2px 4px rgba(0, 0, 0, 0.4);
}

.markmap-dark .mm-search-input {
  color: #e5e7eb;
}

.markmap-dark .mm-search-input::placeholder {
  color: #6b7280;
}

.markmap-dark .mm-search-input:focus::placeholder {
  color: #4b5563;
}

.markmap-dark .mm-search-icon {
  color: #6b7280;
}

.markmap-dark .mm-search-box-wrapper:focus-within .mm-search-icon {
  color: #60a5fa;
}

.markmap-dark .mm-search-clear {
  color: #6b7280;
}

.markmap-dark .mm-search-clear:hover {
  color: #d1d5db;
  background: #374151;
}

.markmap-dark .mm-search-clear:active {
  background: #4b5563;
}
`;

/**
 * Export menu styles
 */
const EXPORT_MENU_STYLES = `
.mm-export-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.mm-export-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border-radius: 8px;
  border: 0;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.mm-export-trigger:hover {
  background: #f3f4f6;
  color: #111827;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.mm-export-trigger:active {
  background: #e5e7eb;
  transform: scale(0.95);
}

.mm-export-menu-open .mm-export-trigger {
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.mm-export-label {
  font-size: 14px;
}

.mm-export-arrow {
  transition: transform 0.2s;
}

.mm-export-menu-open .mm-export-arrow {
  transform: rotate(180deg);
}

.mm-export-dropdown {
  position: absolute;
  z-index: 50;
  min-width: 200px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 8px 0;
  margin-top: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.1), 0 12px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease-out;
  opacity: 1;
  transform: scale(1);
}

.mm-export-dropdown-bottom {
  top: 100%;
  left: 0;
  transform-origin: top left;
}

.mm-export-dropdown-top {
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  transform-origin: bottom left;
}

.mm-export-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 14px;
  color: #374151;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-align: left;
  border-radius: 8px;
  margin: 0 4px;
}

.mm-export-item:hover {
  background: #f3f4f6;
  transform: scale(1.02);
}

.mm-export-item:active {
  background: #e5e7eb;
  transform: scale(0.98);
}

.mm-export-item svg {
  flex-shrink: 0;
  color: #6b7280;
  transition: all 0.15s;
}

.mm-export-item:hover svg {
  color: #374151;
  transform: scale(1.1);
}

.markmap-dark .mm-export-trigger {
  color: #d1d5db;
}

.markmap-dark .mm-export-trigger:hover {
  background: #374151;
  color: #f3f4f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-export-trigger:active {
  background: #4b5563;
}

.markmap-dark .mm-export-menu-open .mm-export-trigger {
  background: #1e3a5f;
  color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-export-dropdown {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.3);
}

.markmap-dark .mm-export-item {
  color: #e5e7eb;
}

.markmap-dark .mm-export-item:hover {
  background: #374151;
}

.markmap-dark .mm-export-item:active {
  background: #4b5563;
}

.markmap-dark .mm-export-item svg {
  color: #9ca3af;
}

.markmap-dark .mm-export-item:hover svg {
  color: #e5e7eb;
}
`;

/**
 * Color picker styles
 */
const COLOR_PICKER_STYLES = `
.mm-color-picker {
  position: relative;
  display: inline-block;
}

.mm-color-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  border: 1px solid #d4d4d8;
  color: #3f3f46;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.mm-color-trigger:hover {
  background: #fafafa;
  border-color: #a1a1aa;
}

.mm-color-trigger:active {
  background: #f4f4f5;
}

.mm-color-picker-open .mm-color-trigger {
  background: #f4f4f5;
  border-color: #a1a1aa;
}

.mm-color-label {
  font-size: 14px;
}

.mm-color-arrow {
  transition: transform 0.2s;
}

.mm-color-picker-open .mm-color-arrow {
  transform: rotate(180deg);
}

.mm-color-dropdown {
  position: absolute;
  z-index: 50;
  margin-top: 8px;
  background: white;
  border: 1px solid #d4d4d8;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.mm-color-dropdown-bottom {
  top: 100%;
  left: 0;
}

.mm-color-dropdown-top {
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
}

.mm-color-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  border: 0;
  border-bottom: 1px solid #e4e4e7;
}

.mm-color-item:last-child {
  border-bottom: 0;
}

.mm-color-item-active {
  background: #eff6ff;
}

.mm-color-item:hover {
  background: #f4f4f5;
}

.mm-color-item-active:hover {
  background: #dbeafe;
}

.mm-color-preview {
  display: flex;
  gap: 4px;
}

.mm-color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #d4d4d8;
  transition: transform 0.15s;
}

.mm-color-item:hover .mm-color-dot {
  transform: scale(1.1);
}

.mm-color-name {
  flex: 1;
  font-size: 14px;
  color: #3f3f46;
  text-transform: capitalize;
}

.mm-color-check {
  color: #2563eb;
}

.mm-color-empty {
  padding: 16px 12px;
  text-align: center;
  font-size: 14px;
  color: #71717a;
}

.markmap-dark .mm-color-trigger {
  background: #27272a;
  border-color: #52525b;
  color: #d4d4d8;
}

.markmap-dark .mm-color-trigger:hover {
  background: #3f3f46;
  border-color: #71717a;
}

.markmap-dark .mm-color-trigger:active {
  background: #3f3f46;
}

.markmap-dark .mm-color-picker-open .mm-color-trigger {
  background: #3f3f46;
  border-color: #71717a;
}

.markmap-dark .mm-color-dropdown {
  background: #27272a;
  border-color: #52525b;
}

.markmap-dark .mm-color-item {
  border-color: #3f3f46;
}

.markmap-dark .mm-color-item:hover {
  background: #3f3f46;
}

.markmap-dark .mm-color-item-active {
  background: #3f3f46;
}

.markmap-dark .mm-color-item-active:hover {
  background: #52525b;
}

.markmap-dark .mm-color-name {
  color: #d4d4d8;
}

.markmap-dark .mm-color-empty {
  color: #71717a;
}
`;

/**
 * Responsive styles for mobile devices
 */
const RESPONSIVE_STYLES = `
@media (max-width: 768px) {
  .mm-enhanced-toolbar {
    left: 16px;
    right: 16px;
    transform: none;
    gap: 6px;
    padding: 6px 10px;
  }

  .mm-enhanced-toolbar .mm-toolbar-item {
    width: 32px;
    height: 32px;
  }

  .mm-enhanced-toolbar .mm-toolbar-item svg {
    width: 18px;
    height: 18px;
  }

  .mm-search-box-wrapper {
    min-width: 150px;
  }

  .mm-search-input {
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .mm-enhanced-toolbar {
    left: 12px;
    right: 12px;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    padding: 6px 8px;
    border-radius: 8px;
  }

  .mm-enhanced-toolbar .mm-toolbar-item {
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }

  .mm-export-label,
  .mm-color-label {
    display: none;
  }

  .mm-export-trigger,
  .mm-color-trigger {
    padding: 8px;
  }

  .mm-export-dropdown,
  .mm-color-dropdown {
    min-width: 180px;
  }

  .mm-export-item {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .mm-enhanced-toolbar {
    left: 8px;
    right: 8px;
    padding: 4px 6px;
    gap: 2px;
    border-radius: 6px;
  }

  .mm-enhanced-toolbar .mm-toolbar-item {
    width: 28px;
    height: 28px;
    border-radius: 4px;
  }

  .mm-enhanced-toolbar .mm-toolbar-item svg {
    width: 16px;
    height: 16px;
  }
}
`;

/**
 * Collect all CSS styles needed for the standalone HTML
 *
 * Requirements:
 * - 14.2: Collect and inline all CSS styles
 *
 * @returns Combined CSS string
 */
export function collectCSS(): string {
  const allStyles = [
    BASE_STYLES,
    MARKMAP_VIEW_STYLES,
    NOTE_PANEL_STYLES,
    CONTEXT_MENU_STYLES,
    TOOLBAR_STYLES,
    ENHANCED_TOOLBAR_STYLES,
    SEARCH_BOX_STYLES,
    EXPORT_MENU_STYLES,
    COLOR_PICKER_STYLES,
    RESPONSIVE_STYLES,
  ];

  return allStyles.join('\n');
}

/**
 * Minify CSS by removing comments and unnecessary whitespace
 *
 * @param css - CSS string to minify
 * @returns Minified CSS string
 */
export function minifyCSS(css: string): string {
  return (
    css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove newlines and extra spaces
      .replace(/\s+/g, ' ')
      // Remove spaces around special characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolons before closing braces
      .replace(/;}/g, '}')
      // Trim
      .trim()
  );
}
