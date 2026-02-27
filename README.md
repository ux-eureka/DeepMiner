# DeepMiner - AI 驱动的产品诊断工具

DeepMiner 是一款现代化的人工智能诊断对话工具，专为产品设计师和业务分析师打造。通过结构化的 6 阶段提问流程，帮助用户深度剖析页面转化问题，将主观的设计经验转化为可量化的诊断框架，系统性地优化商业转化路径。

## 🎯 产品定位

*   **目标用户**：产品经理、UX 设计师、增长黑客、业务分析师。
*   **核心价值**：提供一套标准化的思维框架，辅助专业人员从商业目标、用户心理、交互阻力等多个维度审视产品设计，从而发现潜在的转化流失点。

## ✨ 核心功能

*   **多模式诊断**：
    *   **C 端模式**：聚焦流量变现与用户增长。
    *   **B 端模式**：聚焦效率提升与流程优化。
    *   **创建模式**：支持自定义诊断流程与问题集。
*   **结构化对话流**：基于预设的 6 阶段模型（商业基座 -> 欲望流失 -> 利益冲突 -> 竞品套路 -> 视觉手术 -> 转化验尸）进行引导式提问。
*   **可视化进度追踪**：右侧悬浮阶段轴实时展示当前诊断进度，支持点击回溯历史问题。
*   **智能交互体验**：
    *   渐进式消息加载与打字机效果。
    *   平滑的滚动与过渡动画（Framer Motion）。
    *   响应式布局，适配桌面、平板与移动端。
*   **会话管理**：侧边栏支持新建会话、查看历史记录、清空会话。
*   **报告导出**：诊断完成后自动生成 Markdown 格式的完整报告，支持预览与导出。

## 🛠 技术架构

DeepMiner 采用现代化的前端技术栈构建，确保高性能与良好的开发体验。

*   **核心框架**：[React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **构建工具**：[Vite](https://vitejs.dev/)
*   **样式方案**：[Tailwind CSS](https://tailwindcss.com/) + CSS Modules
*   **状态管理**：React Context + Hooks (useReducer)
*   **动画库**：[Framer Motion](https://www.framer.com/motion/)
*   **图标库**：[Lucide React](https://lucide.dev/)
*   **测试框架**：[Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/)
*   **组件开发**：[Storybook](https://storybook.js.org/)

### 目录结构

```
src/
├── assets/          # 静态资源
├── components/      # UI 组件
│   ├── ChatArea/    # 对话区域组件 (InputArea, SystemCard, UserBubble)
│   ├── Modals/      # 弹窗组件 (Settings, CreateMode, Report)
│   └── ...          # 通用组件 (Sidebar, FloatingStepper)
├── context/         # 全局状态管理 (ChatContext, AIConfigContext)
├── data/            # 静态数据配置 (questionsConfig)
├── hooks/           # 自定义 Hooks (useChatFlow, useDeepMinerEngine)
├── pages/           # 页面级组件
├── stories/         # Storybook 故事文件
├── styles/          # 全局样式与 CSS Modules
├── types/           # TypeScript 类型定义
└── utils/           # 工具函数
```

## 🚀 安装与部署指南

### 前置要求

*   Node.js >= 18.0.0
*   pnpm >= 8.0.0 (推荐) 或 npm/yarn

### 本地开发

1.  **克隆仓库**

    ```bash
    git clone https://github.com/ux-eureka/DeepMiner.git
    cd DeepMiner
    ```

2.  **安装依赖**

    ```bash
    pnpm install
    ```

3.  **启动开发服务器**

    ```bash
    pnpm dev
    ```

    访问 `http://localhost:5173` 即可预览应用。

### 构建部署

1.  **构建生产版本**

    ```bash
    pnpm build
    ```

    构建产物将输出到 `dist/` 目录。

2.  **本地预览生产构建**

    ```bash
    pnpm preview
    ```

### 测试与组件开发

*   **运行单元测试**：`pnpm test`
*   **启动 Storybook**：`pnpm storybook`

## 📖 使用场景

### 场景一：电商详情页转化率优化（C 端模式）
产品经理希望提升某商品详情页的下单转化率。
1.  启动 DeepMiner，选择 **C 端模式**。
2.  系统提问：“这个页面最终要帮公司捞到什么具体商业好处？” -> 回答：“提升 GMV”。
3.  系统追问：“用户滑到这个页面时，最原始的欲望是什么？” -> 回答：“贪便宜”。
4.  ...跟随系统引导，分析用户在比价、查看评论时的心理阻力。
5.  最终生成包含“视觉诱饵优化建议”和“交互路径缩短方案”的诊断报告。

### 场景二：内部 CRM 系统录入效率优化（B 端模式）
UX 设计师发现销售团队录入客户信息效率低下。
1.  启动 DeepMiner，选择 **B 端模式**。
2.  分析录入流程中的重复操作和非必要字段。
3.  识别“利益冲突”：销售为了省事不愿意填非必填项，而公司希望数据完整。
4.  得出优化方案：引入自动填充和 OCR 识别功能。

## 📝 版本历史

请参阅 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本变更记录。

## 🤝 贡献指南

我们非常欢迎社区贡献！请在提交 Pull Request 之前阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

1.  Fork 本仓库
2.  创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交您的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。详情请参阅 [LICENSE](./LICENSE) 文件（如有）。
