// 简单的 Node.js 测试脚本
const fs = require('fs');

// 读取构建后的文件
const libCode = fs.readFileSync('./packages/markmap-lib/dist/index.js', 'utf8');

// 创建一个简单的测试
console.log('测试 Markdown 解析...\n');

const testMarkdown = `# 测试
- 用户调研: 第一阶段完成
  > 调研对象: 企业用户 50 人
  > 调研方式: 问卷 + 深度访谈`;

console.log('输入 Markdown:');
console.log(testMarkdown);
console.log('\n预期结果:');
console.log('- 节点内容: "用户调研"');
console.log('- inlineNote: "第一阶段完成"');
console.log('- detailedNote: "调研对象: 企业用户 50 人\\n调研方式: 问卷 + 深度访谈"');
