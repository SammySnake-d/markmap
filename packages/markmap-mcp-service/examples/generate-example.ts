/**
 * 示例脚本：使用 MCP 服务生成思维导图
 *
 * 运行方式：
 * npx tsx examples/generate-example.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateStandaloneHTML } from 'markmap-html-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 示例 Markdown 内容
const sampleMarkdown = `# 项目架构

- 前端: React + TypeScript
  > 使用 Vite 构建工具
  > 状态管理使用 Zustand
  - 组件
    - 通用组件
    - 业务组件
  - 页面
    - 首页
    - 详情页
  - 工具函数

- 后端: Node.js + Express
  > RESTful API 设计
  > 使用 TypeScript
  - API 层
    - 路由
    - 中间件
    - 控制器
  - 服务层
    - 业务逻辑
    - 数据验证
  - 数据层
    - 数据库模型
    - 查询构建器

- 基础设施
  - Docker: 容器化部署
  - CI/CD: GitHub Actions
  - 监控: Prometheus + Grafana
`;

async function main() {
  const outputDir = path.join(__dirname, 'output');

  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  // 生成不同配置的思维导图
  const configs = [
    {
      name: 'default-theme',
      options: { title: '项目架构 - 默认主题' },
    },
    {
      name: 'ocean-theme',
      options: { title: '项目架构 - 海洋主题', colorScheme: 'ocean' as const },
    },
    {
      name: 'forest-theme',
      options: { title: '项目架构 - 森林主题', colorScheme: 'forest' as const },
    },
    {
      name: 'dark-mode',
      options: { title: '项目架构 - 暗色模式', theme: 'dark' as const },
    },
    {
      name: 'readonly',
      options: { title: '项目架构 - 只读模式', enableEdit: false },
    },
  ];

  for (const config of configs) {
    const html = generateStandaloneHTML(sampleMarkdown, config.options);
    const outputPath = path.join(outputDir, `${config.name}.html`);
    await fs.writeFile(outputPath, html, 'utf-8');
    console.log(`✅ 生成: ${outputPath}`);
  }

  // 从文件读取 Markdown 并生成
  const sampleMdPath = path.join(__dirname, 'sample-mindmap.md');
  const sampleMdContent = await fs.readFile(sampleMdPath, 'utf-8');
  const sampleHtml = generateStandaloneHTML(sampleMdContent, {
    title: 'AI 学习路径',
    colorScheme: 'sunset',
  });
  const sampleOutputPath = path.join(outputDir, 'ai-learning-path.html');
  await fs.writeFile(sampleOutputPath, sampleHtml, 'utf-8');
  console.log(`✅ 生成: ${sampleOutputPath}`);

  console.log('\n🎉 所有示例生成完成！');
  console.log(`📁 输出目录: ${outputDir}`);
}

main().catch(console.error);
