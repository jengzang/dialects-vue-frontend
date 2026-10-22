# 汉字字集工作区调整

**目标：** 上方配置工作区，点击查询后在下方展示分类结果。

**实现范围：** 保留 CharacterClassification.vue 和原有树组件；在页面内区分待查询配置与已提交配置。仅新增查询按钮文案，不改已有文案。

- [x] 使用组件行为测试覆盖首次不加载、显式查询、编辑配置时保留旧结果、旧节点懒加载和重试、URL 恢复、切换页签清理与请求竞争。
- [x] 将配置编辑与请求分开；结果标题、加载、重试和懒加载使用提交时的配置快照。查询时同步 URL，带查询参数的链接自动加载。
- [x] 布局改为上下排列，取消面板固定高度；分层字段横向排列，竖屏使用项目规定的宽高比断点。
- [x] 运行相关 Vitest、ESLint 和 Vite 构建，检查差异及中文/emoji 编码，CR 后只提交本步骤文件。

验证命令：在 project 目录运行 `npm test -- tests/characterClassification.test.js tests/charClassTreeItem.test.js`、`./node_modules/.bin/eslint src/main/views/explore/charClass/CharacterClassification.vue`、`./node_modules/.bin/vite build`。直接运行 Vite 避免 sitemap 脚本改写用户现有改动。

验证结果：9 项相关测试通过；ESLint 0 错误，原有格式警告由 41 项降为 40 项；Vite 构建通过。浏览器检查 1280×720 和 390×844 的首次工作区布局，数据请求行为由组件测试验证，本地没有运行后端。独立 CR 的列宽问题已修正为最小 320px，并补充跨表草稿与层级操作测试。既有翻译逐项相等，组件既有非 ASCII 字符计数一致，严格 UTF-8 解码通过。

扩展检查中发现 4 项已有失败：legacyRouteMap 的 YuBao 与 vocabulary 路径断言、mainStyleStructureConventions 的 PhoPage 标题样式断言、seoHeadingSemantics 的 PhoPage header 插槽断言。失败涉及的源码及测试与 HEAD 相同，与本次改动无关，未扩大范围修复。
