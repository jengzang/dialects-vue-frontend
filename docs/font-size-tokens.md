# 字号 token

在 `project/src/styles/global/_tokens.scss` 统一保留 8 档，主站和 VillagesML 共用：

| Token | rem | 默认根字号 16px 下 |
| --- | --- | --- |
| `--font-size-12` | 0.75rem | 12px |
| `--font-size-14` | 0.875rem | 14px |
| `--font-size-16` | 1rem | 16px |
| `--font-size-18` | 1.125rem | 18px |
| `--font-size-20` | 1.25rem | 20px |
| `--font-size-24` | 1.5rem | 24px |
| `--font-size-32` | 2rem | 32px |
| `--font-size-48` | 3rem | 48px |

现有静态 px/rem 字号按默认根字号换算后就近归并，距离相同时取较大档。例如 13px → 14 档、15px → 16 档、0.9rem → 14 档、1.8rem → 32 档。

```scss
.label {
  font-size: var(--font-size-14);
}
```

只调整字号声明和字号自定义属性。`padding`、`margin`、宽高、间距、媒体查询及其他布局值保持原样。没有额外的字号别名。

三个 bar 的 `fontSize` / `mobileFontSize` 数值配置仍作为倍率。导航基准为 `clamp(var(--font-size-16), 1.5dvh, var(--font-size-20))`，大屏从默认 16px 适度增长至最多 20px。选中/未选中倍率保持 1.1em / 0.9em；竖屏堆叠小字为 `max(var(--font-size-12), 0.65em)`，默认不低于 12px。CommonBar 横屏图标读取横屏配置，竖屏图标保留原有 1.2 倍率。

本轮迁移组件 `<style>` 和共享 SCSS 中的静态字号。相对 em 和流体视口项保留；插值计算按端点字号归并。模板或 JS 字符串中的内联样式、图表/Canvas 数值、地图动态字号、独立截图/导出样式、参与布局运算的 Sass 变量暂不迁移。
