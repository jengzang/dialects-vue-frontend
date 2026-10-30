# 字号 token 使用说明

统一定义位于 `project/src/styles/global/_tokens.scss`，主站及 VillagesML 的全局样式入口都会加载。

## 精确档位

`--font-size-14` 的值为 `0.875rem`，在默认根字号 16px 下等于原来的 14px。名称中的数字表示默认根字号下的等效 CSS 像素，而非固定物理像素。

- 10–20 之间提供每 0.5px 一档，包括 12.5、13.5、14.5、15.5 等。
- 大字号保留现有的 22、24、26、28、30、32、36、40、48、64、80 等档位。
- 历史 rem 尺寸按原值保留：`0.9rem` 对应 `--font-size-14-4`，`0.95rem` 对应 `--font-size-15-2`，`1.8rem` 对应 `--font-size-28-8`。小数点在变量名中写作 `-`。
- 5、7、8、9 等小档位用于保留原有细节或计算增量，不推荐用于新的正文。

```scss
.existing-label {
  font-size: var(--font-size-14);
}

.existing-secondary-label {
  font-size: var(--font-size-13-5);
}
```

现有组件优先使用精确档位，以便迁移时不取整、不改变原始视觉层级。新建通用 UI 可使用 `--font-size-caption`、`--font-size-small`、`--font-size-body`、`--font-size-label`、`--font-size-section`、`--font-size-title` 等语义别名。

## 三个导航 bar

NavBar、ExploreBar、CommonBar 保留现有 `fontSize` / `mobileFontSize` 数值配置，它们表示导航基准的倍率。横屏和竖屏分别使用 `--font-size-nav-unit` / `--font-size-nav-mobile-unit`。基准为 `clamp(1rem, 1.5dvh, 1.25rem)`：默认根字号下从 16px 增长至最多 20px，不设置宽度断点。

```js
display: {
  preset: 'standard',
  overrides: {
    fontSize: 1.4,
    mobileFontSize: 1.5
  }
}
```

- 横屏文字：导航基准 × `fontSize` × 状态倍率。
- 竖屏文字：竖屏基准 × `mobileFontSize`（缺省回退 `fontSize`）× 状态倍率。
- 未选中倍率 `--font-size-nav-inactive` 为 `0.9em`，选中倍率 `--font-size-nav-active` 为 `1.1em`。
- 竖屏堆叠小字 `--font-size-nav-caption` 为 `max(0.75rem, 0.65em)`，默认根字号下不低于 12px。
- CommonBar 图标跟随当前布局的字号配置及状态倍率。

整栏默认值、预设、单个 tab 的覆盖优先级不变；CommonBar 的 schema 默认值仍可能被模块配置中的显式字号覆盖。修改根字号或用户浏览器默认字号后，rem token 会跟随缩放；迁移不会主动设置全局根字号。

## 本轮迁移边界

迁移组件 `<style>` 和共享 SCSS 中 `font-size` 的静态 px/rem 长度及对应字号自定义属性；流体表达式保留原有视口项，相对 em 关系保持原样。保留现有 CSS 规则的优先级、媒体查询及布局。

暂不替换模板或 JS 字符串中的内联样式、ECharts/Canvas 数值字号、地图动态字号、截图/导出文档样式，以及可能参与布局运算的 Sass 变量。它们需要按运行环境分别处理，不能直接把数值换成 CSS `var()`。
