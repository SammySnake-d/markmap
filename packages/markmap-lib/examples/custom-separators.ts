/**
 * 自定义分隔符示例
 *
 * 这个示例展示了如何使用自定义分隔符配置来解析 Markdown 内容。
 */

import { Transformer } from '../src/transform';

// 示例 1: 使用默认分隔符
console.log('=== 示例 1: 默认分隔符 ===');
const defaultTransformer = new Transformer();
const result1 = defaultTransformer.transform(`
# 项目计划
- 任务 1: 完成设计文档
  > 需要包含架构图和数据模型
- 任务 2: 实现核心功能
`);
console.log('默认分隔符配置:', defaultTransformer.separators);
console.log('解析结果:', JSON.stringify(result1.root, null, 2));

// 示例 2: 自定义备注分隔符（使用 :: 而不是 :）
console.log('\n=== 示例 2: 自定义备注分隔符 ===');
const customNoteTransformer = new Transformer(undefined, {
  separators: {
    note: '::',
  },
});
const result2 = customNoteTransformer.transform(`
# 会议记录
- 时间: 14:00-15:00 :: 这是备注，不是时间的一部分
- 地点: https://zoom.us/j/123 :: 在线会议
`);
console.log('自定义分隔符配置:', customNoteTransformer.separators);
console.log('解析结果:', JSON.stringify(result2.root, null, 2));

// 示例 3: 自定义备注块标记（使用 >> 而不是 >）
console.log('\n=== 示例 3: 自定义备注块标记 ===');
const customBlockTransformer = new Transformer(undefined, {
  separators: {
    noteBlock: '>>',
  },
});
const result3 = customBlockTransformer.transform(`
# 技术文档
- API 端点
  >> 详细说明：
  >> POST /api/users
  >> 创建新用户
  > 这是普通引用，不是备注
`);
console.log('自定义分隔符配置:', customBlockTransformer.separators);
console.log('解析结果:', JSON.stringify(result3.root, null, 2));

// 示例 4: 自定义转义字符（使用 ^ 而不是 \）
console.log('\n=== 示例 4: 自定义转义字符 ===');
const customEscapeTransformer = new Transformer(undefined, {
  separators: {
    escape: '^',
  },
});
const result4 = customEscapeTransformer.transform(`
# 代码示例
- 变量声明^: let x = 10
- 函数调用: console.log('Hello')
`);
console.log('自定义分隔符配置:', customEscapeTransformer.separators);
console.log('解析结果:', JSON.stringify(result4.root, null, 2));

// 示例 5: 自定义所有分隔符
console.log('\n=== 示例 5: 自定义所有分隔符 ===');
const allCustomTransformer = new Transformer(undefined, {
  separators: {
    node: '+',
    note: '|',
    noteBlock: ':::',
    escape: '^^',
  },
});
const result5 = allCustomTransformer.transform(`
# 自定义语法
+ 节点 1 | 使用竖线作为备注分隔符
  ::: 使用三个冒号作为详细备注标记
  ::: 支持多行内容
+ 节点 2^^| 内容中包含转义的竖线
`);
console.log('自定义分隔符配置:', allCustomTransformer.separators);
console.log('解析结果:', JSON.stringify(result5.root, null, 2));

// 示例 6: 多个 Transformer 实例
console.log('\n=== 示例 6: 多个独立的 Transformer 实例 ===');
const transformer1 = new Transformer(undefined, {
  separators: { note: '::' },
});
const transformer2 = new Transformer(undefined, {
  separators: { note: '|' },
});

console.log('Transformer 1 配置:', transformer1.separators);
console.log('Transformer 2 配置:', transformer2.separators);

transformer1.transform('- 节点:: 备注1');
transformer2.transform('- 节点| 备注2');

console.log('两个实例可以独立工作，互不影响');
