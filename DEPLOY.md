# DeepMiner 部署指南

DeepMiner 是一个基于 Vite 和 React 的前端项目，可以轻松部署到各种静态托管服务。

## 前置准备

确保你已经拥有以下服务之一的账号：
- [Vercel](https://vercel.com/) (推荐)
- [Netlify](https://www.netlify.com/)
- [GitHub](https://github.com/) (如果你使用 GitHub Pages)

确保项目代码已经推送到 GitHub 仓库。

## 1. 部署到 Vercel (最简单)

1.  登录 Vercel Dashboard。
2.  点击 "Add New..." -> "Project"。
3.  导入你的 DeepMiner GitHub 仓库。
4.  在 "Configure Project" 页面：
    -   Framework Preset 选择 `Vite`。
    -   Root Directory 保持默认 `./`。
    -   Build Command: `pnpm build` (如果没自动检测到，手动输入)。
    -   Output Directory: `dist`。
5.  点击 "Deploy"。

Vercel 会自动构建并部署你的应用。以后每次推送到 `main` 分支，都会自动触发重新部署。

## 2. 部署到 Netlify

1.  登录 Netlify Dashboard。
2.  点击 "Add new site" -> "Import an existing project"。
3.  选择 GitHub 并授权。
4.  选择 DeepMiner 仓库。
5.  在 "Build settings" 中：
    -   Base directory: `/` (保持默认)。
    -   Build command: `pnpm build`。
    -   Publish directory: `dist`。
6.  点击 "Deploy site"。

## 3. 部署到 GitHub Pages

本项目已配置 GitHub Actions 工作流 (`.github/workflows/deploy.yml`)。

1.  进入你的 GitHub 仓库页面。
2.  点击 "Settings" -> "Pages"。
3.  在 "Build and deployment" 部分，Source 选择 **GitHub Actions**。
4.  保存设置。
5.  以后每次推送到 `main` 分支，GitHub Actions 会自动构建并将静态文件部署到 GitHub Pages。

**注意：** 如果你的 GitHub Pages 不是部署在根路径（例如 `https://username.github.io/DeepMiner/`），你需要在 `vite.config.ts` 中添加 `base` 配置：

```typescript
// vite.config.ts
export default defineConfig({
  base: '/DeepMiner/', // 替换为你的仓库名称
  // ...其他配置
})
```

## 4. 本地构建测试

在部署之前，你可以在本地运行构建命令来确保一切正常：

```bash
pnpm build
pnpm preview
```

如果 `pnpm preview` 能够正常启动并在浏览器中访问，那么部署通常也会成功。

## 常见问题

### 构建失败？
检查控制台输出的错误信息。常见原因包括 TypeScript 类型错误或依赖缺失。确保本地 `pnpm build` 能成功运行。

### 页面空白？
如果是部署到非根路径（如 GitHub Pages 子目录），请检查 `vite.config.ts` 中的 `base` 配置是否正确。

### 路由问题？
由于这是单页应用 (SPA)，如果使用 `react-router` 且部署到不支持 SPA 重写的服务（如简单的静态文件服务器），刷新非首页路径可能会导致 404。Vercel 和 Netlify 会自动处理这个问题。GitHub Pages 可能需要特殊的 404.html 处理技巧。

---
祝部署顺利！
