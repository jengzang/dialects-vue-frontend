# 粤拼转 IPA

批量将 Excel 文件中的粤拼（Jyutping）转换为国际音标（IPA）。

## 基本操作

1. 登录账号
2. 在设置面板中调整转换规则（可选，默认规则已涵盖常见转换）
3. 上传 Excel 文件（.xlsx、.xls，单文件上限 3 MB）
4. 等待任务处理完成
5. 预览结果并下载
![粤拼1.png](/tutorial/explore-jyut2ipa/粤拼1.webp)

## 自定义规则

- 可在设置面板中调整替换规则
- 规则按分类整理，方便检查
- 可导出规则为 JSON 备份
- 可从 JSON 导入规则
- 重设会恢复为默认规则
- 规则保存到 localStorage，跨会话保持
![粤拼2.png](/tutorial/explore-jyut2ipa/粤拼2.webp)

## 输出结果

- 预览表显示前 10 笔数据
- 字段包括：字、粤拼、IPA、声母、韵母、音调
- 下载文件保留原始文件名并加前缀
![粤拼3.png](/tutorial/explore-jyut2ipa/粤拼3.webp)
![粤拼4.png](/tutorial/explore-jyut2ipa/粤拼4.webp)

## 提示

- 表中必须有「粤拼」列
- 导入规则后需手动点击储存才能持久化
- 文件格式不正确或过大时会直接报错
