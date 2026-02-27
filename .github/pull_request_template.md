## 需求勾选

- [ ] 1. 侧边栏收起/展开按钮：收起后按钮移动到左上角，展开后回到原位，含 `aria-label`
- [ ] 2. 移除机器人头像 DOM 节点与相关引用，控制台无 404/未定义错误
- [ ] 3. 提问框水平居中，`max-width: 1240px`，宽度变化 200ms 过渡
- [ ] 4. <768px：侧边栏默认收起；点击后 fixed 抽屉 + 80% 宽度 + 遮罩；点击遮罩/菜单项自动关闭；300ms ease-out
- [ ] 5. 交付：提供代码片段；Jest+RTL 单测；Storybook 四个宽度故事；Lighthouse ≥90/≥95 截图

## 说明

### 改动概览

- 

### 测试

- `pnpm test`
- `pnpm storybook`

### Lighthouse

- 贴图：Performance
- 贴图：Accessibility

