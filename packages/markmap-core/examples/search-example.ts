/**
 * 搜索功能使用示例
 *
 * 此示例展示如何使用 MarkmapAPI 的搜索功能：
 * - search(): 搜索匹配的节点
 * - highlightNode(): 高亮指定节点
 * - clearHighlight(): 清除所有高亮
 */

import { MarkmapCore } from '../src/core/markmap-core';
import { MarkmapAPI } from '../src/api/markmap-api';
import { EventEmitter } from '../src/events/event-emitter';
import type { INode } from 'markmap-interfaces';

// 创建示例数据
const sampleData: INode = {
  type: 'heading',
  depth: 0,
  content: 'JavaScript 学习路线',
  payload: {},
  children: [
    {
      type: 'heading',
      depth: 1,
      content: '基础知识',
      payload: {},
      children: [
        {
          type: 'heading',
          depth: 2,
          content: '变量和数据类型',
          payload: {},
          children: [],
        },
        {
          type: 'heading',
          depth: 2,
          content: '函数和作用域',
          payload: {},
          children: [],
        },
      ],
    },
    {
      type: 'heading',
      depth: 1,
      content: '高级特性',
      payload: {},
      children: [
        {
          type: 'heading',
          depth: 2,
          content: '闭包和原型',
          payload: {},
          children: [],
        },
        {
          type: 'heading',
          depth: 2,
          content: '异步编程',
          payload: {},
          children: [],
        },
      ],
    },
  ],
};

// 初始化 Markmap
function initializeMarkmap() {
  // 创建 SVG 元素
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');
  document.body.appendChild(svg);

  // 创建实例
  const eventEmitter = new EventEmitter();
  const core = new MarkmapCore(svg);
  const api = new MarkmapAPI(core, eventEmitter);

  // 设置数据
  api.setData(sampleData);

  return { api, eventEmitter };
}

// 示例 1: 基本搜索
function example1_basicSearch() {
  console.log('=== 示例 1: 基本搜索 ===');

  const { api } = initializeMarkmap();

  // 搜索包含 "函数" 的节点
  const results = api.search('函数');
  console.log(`找到 ${results.length} 个匹配的节点:`);
  results.forEach((node) => {
    console.log(`- ${node.content}`);
  });
}

// 示例 2: 不区分大小写搜索
function example2_caseInsensitiveSearch() {
  console.log('\n=== 示例 2: 不区分大小写搜索 ===');

  const { api } = initializeMarkmap();

  // 搜索时不区分大小写
  const results1 = api.search('javascript');
  const results2 = api.search('JavaScript');
  const results3 = api.search('JAVASCRIPT');

  console.log(`搜索 "javascript": ${results1.length} 个结果`);
  console.log(`搜索 "JavaScript": ${results2.length} 个结果`);
  console.log(`搜索 "JAVASCRIPT": ${results3.length} 个结果`);
  console.log('所有搜索返回相同数量的结果（不区分大小写）');
}

// 示例 3: 高亮搜索结果
function example3_highlightResults() {
  console.log('\n=== 示例 3: 高亮搜索结果 ===');

  const { api } = initializeMarkmap();

  // 搜索节点
  const results = api.search('高级');
  console.log(`找到 ${results.length} 个匹配的节点`);

  // 高亮所有搜索结果
  results.forEach((node) => {
    // 注意：这里需要使用节点的实际 ID
    // 在实际应用中，您需要从 node.state.path 或 node.state.id 获取
    console.log(`高亮节点: ${node.content}`);
    // api.highlightNode(nodeId);
  });
}

// 示例 4: 清除高亮
function example4_clearHighlight() {
  console.log('\n=== 示例 4: 清除高亮 ===');

  const { api } = initializeMarkmap();

  // 先高亮一些节点
  console.log('高亮节点...');
  // api.highlightNode('0-0');
  // api.highlightNode('0-1');

  // 清除所有高亮
  console.log('清除所有高亮');
  api.clearHighlight();
}

// 示例 5: 监听搜索事件
function example5_searchEvents() {
  console.log('\n=== 示例 5: 监听搜索事件 ===');

  const { api, eventEmitter } = initializeMarkmap();

  // 监听搜索结果事件
  eventEmitter.on('search:result', (results) => {
    console.log(`搜索完成，找到 ${results.length} 个结果`);
  });

  // 执行搜索
  api.search('编程');
}

// 示例 6: 搜索并自动展开
function example6_searchAndExpand() {
  console.log('\n=== 示例 6: 搜索并自动展开 ===');

  const { api } = initializeMarkmap();

  // 先折叠所有节点
  api.collapseAll();
  console.log('已折叠所有节点');

  // 搜索节点
  const results = api.search('异步');
  console.log(`找到 ${results.length} 个匹配的节点`);

  // 展开包含搜索结果的路径
  // 注意：这需要遍历节点树找到父节点并展开
  console.log('展开搜索结果的父节点...');
}

// 运行所有示例
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.addEventListener('DOMContentLoaded', () => {
    example1_basicSearch();
    example2_caseInsensitiveSearch();
    example3_highlightResults();
    example4_clearHighlight();
    example5_searchEvents();
    example6_searchAndExpand();
  });
} else {
  // Node.js 环境（仅用于文档）
  console.log('此示例需要在浏览器环境中运行');
}

export {
  example1_basicSearch,
  example2_caseInsensitiveSearch,
  example3_highlightResults,
  example4_clearHighlight,
  example5_searchEvents,
  example6_searchAndExpand,
};
