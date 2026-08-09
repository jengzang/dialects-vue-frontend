# 项目约定

## 响应式媒体查询

本项目只使用横屏/竖屏（aspect-ratio）媒体查询，**不使用** `min-width` / `max-width` 断点查询。

```scss
// 竖屏（宽高比 <= 1:1）
@media (max-aspect-ratio: 1/1) { ... }

// 横屏低高度（宽高比 >= 1:1 且高度较矮）
@media (min-aspect-ratio: 1/1) and (max-height: 560px) { ... }
```

判断紧凑模式的逻辑在 JS 中通过 `viewport.width <= 900` 实现，但 CSS 中不做宽度断点。
