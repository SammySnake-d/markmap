/**
 * Context Menu Tests
 *
 * Requirements:
 * - 8.4: Display context menu on node right-click with options
 *
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextMenu } from '../src/context-menu';
import { INode } from 'markmap-common';

describe('ContextMenu', () => {
  let contextMenu: ContextMenu;
  let mockNode: INode;

  beforeEach(() => {
    // Create a mock node
    mockNode = {
      content: 'Test Node',
      children: [],
      state: {
        id: 1,
        depth: 1,
        path: '1',
        key: '1',
        rect: { x: 0, y: 0, width: 100, height: 50 },
        size: [100, 50],
      },
      payload: {},
    };
  });

  afterEach(() => {
    if (contextMenu) {
      contextMenu.destroy();
    }
  });

  test('creates context menu container', () => {
    contextMenu = new ContextMenu();

    const container = document.querySelector('.markmap-context-menu');
    expect(container).toBeTruthy();
    expect(container?.tagName).toBe('DIV');
  });

  test('shows context menu at specified position', () => {
    contextMenu = new ContextMenu();

    contextMenu.show(mockNode, 100, 200);

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    expect(container.style.display).toBe('block');
    expect(container.style.left).toBe('100px');
    expect(container.style.top).toBe('200px');
  });

  test('hides context menu', () => {
    contextMenu = new ContextMenu();

    contextMenu.show(mockNode, 100, 200);
    contextMenu.hide();

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    expect(container.style.display).toBe('none');
  });

  test('displays three menu items', () => {
    contextMenu = new ContextMenu();

    contextMenu.show(mockNode, 100, 200);

    const menuItems = document.querySelectorAll('.markmap-context-menu-item');
    expect(menuItems.length).toBe(3);
  });

  test('calls onCopyAsMarkdown callback when copy option is clicked', () => {
    const onCopyAsMarkdown = vi.fn();
    contextMenu = new ContextMenu({ onCopyAsMarkdown });

    contextMenu.show(mockNode, 100, 200);

    const menuItems = document.querySelectorAll('.markmap-context-menu-item');
    const copyItem = menuItems[0] as HTMLElement;

    copyItem.click();

    expect(onCopyAsMarkdown).toHaveBeenCalledWith(mockNode);
  });

  test('calls onExpandAll callback when expand option is clicked', () => {
    const onExpandAll = vi.fn();
    contextMenu = new ContextMenu({ onExpandAll });

    contextMenu.show(mockNode, 100, 200);

    const menuItems = document.querySelectorAll('.markmap-context-menu-item');
    const expandItem = menuItems[1] as HTMLElement;

    expandItem.click();

    expect(onExpandAll).toHaveBeenCalledWith(mockNode);
  });

  test('calls onCollapseAll callback when collapse option is clicked', () => {
    const onCollapseAll = vi.fn();
    contextMenu = new ContextMenu({ onCollapseAll });

    contextMenu.show(mockNode, 100, 200);

    const menuItems = document.querySelectorAll('.markmap-context-menu-item');
    const collapseItem = menuItems[2] as HTMLElement;

    collapseItem.click();

    expect(onCollapseAll).toHaveBeenCalledWith(mockNode);
  });

  test('hides menu after clicking an option', () => {
    const onCopyAsMarkdown = vi.fn();
    contextMenu = new ContextMenu({ onCopyAsMarkdown });

    contextMenu.show(mockNode, 100, 200);

    const menuItems = document.querySelectorAll('.markmap-context-menu-item');
    const copyItem = menuItems[0] as HTMLElement;

    copyItem.click();

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    expect(container.style.display).toBe('none');
  });

  test('hides menu when clicking outside', () => {
    contextMenu = new ContextMenu();

    contextMenu.show(mockNode, 100, 200);

    // Simulate click outside
    document.body.click();

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    expect(container.style.display).toBe('none');
  });

  test('hides menu when pressing Escape key', () => {
    contextMenu = new ContextMenu();

    contextMenu.show(mockNode, 100, 200);

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    expect(container.style.display).toBe('none');
  });

  test('adjusts position if menu goes off screen (right edge)', () => {
    contextMenu = new ContextMenu();

    // Position near right edge of screen
    const x = window.innerWidth - 50;
    contextMenu.show(mockNode, x, 100);

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Menu should be adjusted to stay within viewport
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
  });

  test('adjusts position if menu goes off screen (bottom edge)', () => {
    contextMenu = new ContextMenu();

    // Position near bottom edge of screen
    const y = window.innerHeight - 50;
    contextMenu.show(mockNode, 100, y);

    const container = document.querySelector(
      '.markmap-context-menu',
    ) as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Menu should be adjusted to stay within viewport
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
  });

  test('cleans up DOM element on destroy', () => {
    contextMenu = new ContextMenu();

    let container = document.querySelector('.markmap-context-menu');
    expect(container).toBeTruthy();

    contextMenu.destroy();

    container = document.querySelector('.markmap-context-menu');
    expect(container).toBeFalsy();
  });
});
