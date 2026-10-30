# 字号 token

在 `project/src/styles/global/_tokens.scss` 统一保留 10 个字号 token，主站和 VillagesML 共用：

| Token | xl 档 rem | xl 档、根字号 16px 下 |
| --- | --- | --- |
| `--font-size-12` | 0.6875rem | 11px（保留旧变量名） |
| `--font-size-13` | 0.8125rem | 13px |
| `--font-size-14` | 0.875rem | 14px |
| `--font-size-16` | 1rem | 16px |
| `--font-size-18` | 1.125rem | 18px |
| `--font-size-20` | 1.25rem | 20px |
| `--font-size-24` | 1.5rem | 24px |
| `--font-size-28` | 1.75rem | 28px |
| `--font-size-32` | 2rem | 32px |
| `--font-size-48` | 3rem | 48px |

现有静态 px/rem 字号最初按默认根字号换算后就近归并，距离相同时取较大档；后续按用户要求定向恢复原始 13px、28px 和 28.8px。原始 13px 及等值 0.8125rem 使用新增的 13 档，原始 14px 保留 14 档；原始 28px、28.8px 及其等值 rem 使用 28 档，原始 32px 保留 32 档。原 `--font-size-12` 调整为 11px 基准，保留变量名及其全部引用。

```scss
.label {
  font-size: var(--font-size-14);
}
```

只调整字号声明和字号自定义属性。`padding`、`margin`、宽高、间距、已有布局媒体查询及其他布局值保持原样。没有额外的字号别名。

根字号由浏览器默认设置决定，通常为 16px，项目不强制固定。按用户明确指定的宽度断点，仅对以上十个字号 token 应用倍率：

| 档位 | 起始视口宽度 | 相对 xl | 16 档实际字号（根字号 16px） |
| --- | --- | --- | --- |
| ssm | 300px | 92% | 14.72px |
| sm | 560px | 94% | 15.04px |
| md | 768px | 96% | 15.36px |
| lg | 1024px | 98% | 15.68px |
| xl | 1280px | 100% | 16px |
| 2xl | 1536px | 104% | 16.64px |

倍率集中在 `_tokens.scss` 的 `$font-size-width-scales` 中。最小字号下限为 0.625rem（默认根字号下 10px；它是下限而非新增档位），不足 300px 时保留原始基准值。字号不额外叠加横竖屏倍率，现有布局的横竖屏规则保持不变。由于只改字号 token，已有 rem 间距不会随档位缩放。

三个 bar 的 `fontSize` / `mobileFontSize` 数值配置仍作为倍率。导航基准为 `clamp(var(--font-size-16), 1.5dvh, var(--font-size-20))`，上下限跟随宽度档位；xl 下为默认 16–20px，2xl 下为 16.64–20.8px。选中/未选中倍率保持 1.1em / 0.9em；竖屏堆叠小字为 `max(0.625rem, 0.65em)`，默认不低于 10px。CommonBar 横屏图标读取横屏配置，竖屏图标保留原有 1.2 倍率。

本轮迁移组件 `<style>` 和共享 SCSS 中的静态字号。相对 em 和流体视口项保留；插值计算按端点字号归并。模板或 JS 字符串中的内联样式、图表/Canvas 数值、地图动态字号、独立截图/导出样式、参与布局运算的 Sass 变量暂不迁移。
