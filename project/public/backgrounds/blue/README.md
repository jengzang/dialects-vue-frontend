# 蓝色模式：山河有音背景（方案 A）

仅用于 MenuLayout、ExploreLayout 的蓝色模式，首页不使用。

古籍、题字、山水与地图分层，避免拉伸或整幅裁切主要元素。古籍贴左下角，地图保留统一投影。屏幕宽高比不大于 1 时采用竖屏构图。背景固定于视口，不拦截鼠标操作，也不随页面内容高度拉长。

地图从项目现有 GeoJSON 读取国界、34 个省级区域、三级河流；点位读取 `/data/dots.json`。它们共用 Albers 等积投影。资源每次打开应用时重新验证，布局间复用；点位不烘焙到图片中。山水避让古籍、题字和地图北纬 17° 以北的区域。

## 素材来源

- `fangyan.webp`：用户提供的透明《方言》图片，裁掉顶部 210 像素空白纸边，转为冷白纸张、蓝灰字迹，增加明显的右上圆弧与边缘羽化。素材不透明度约 57%，绘制时再乘 50%。
- `mountains-upper.webp`、`mountains-lower.webp`：用户提供的视觉参考截图中不含 UI 的山景局部，保留原始水墨纹理，进行蓝灰调色、透明化和边缘羽化。
- `quote-landscape.webp`、`quote-portrait.webp`：繁体小篆题字「蓋時有古今，地有南北，字有更革，音有轉移，亦勢所必至」，不显示正文标点。左侧署名「——陳第《毛詩古音考》」。汉字由真实字体排版，字体缺少的破折号与书名号单独绘制为竖排标点。
- `base.webp`：浅蓝白底色纹理。

小篆使用王心怡、季旭昇製作，中研院小學堂釋出的「崇羲篆體」。字体文件未修改，站点仅使用排版后的图片。

- 官方介绍：https://xiaoxue.iis.sinica.edu.tw/chongxi/
- 授权说明：https://xiaoxue.iis.sinica.edu.tw/chongxi/copyright.htm
- 授权：CC BY-ND 3.0 TW or later，https://creativecommons.org/licenses/by-nd/3.0/tw/
