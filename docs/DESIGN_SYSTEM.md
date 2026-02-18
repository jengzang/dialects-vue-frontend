# 設計系統

> 方音圖鑑平台的視覺設計規範和組件模式

**文檔語言:** [English](./DESIGN_SYSTEM.en.md) | 中文

---

## 設計理念

### 核心原則

1. **清晰** - 信息應易於查找和理解
2. **一致性** - 相似元素應具有相似的外觀和行為
3. **效率** - 最小化點擊和認知負擔
4. **美觀** - 美學設計增強用戶體驗
5. **可訪問性** - 所有人都可使用，無論能力如何

### 視覺風格

平台使用 **現代玻璃擬態** 美學：
- 帶背景模糊的半透明背景
- 微妙的陰影和邊框
- 流暢的過渡和動畫
- 高對比度文本以提高可讀性
- 簡潔、極簡的界面

---

## 顏色系統

### CSS 變量

所有顏色在 `src/style.css` 中定義為 CSS 變量：

```css
:root {
  /* 主要顏色 */
  --primary-color: #4a90e2;        /* 藍色 - 主要操作 */
  --secondary-color: #50c878;      /* 綠色 - 成功狀態 */
  --accent-color: #f39c12;         /* 橙色 - 高亮 */

  /* 文本顏色 */
  --text-primary: #2c3e50;         /* 深灰色 - 主要文本 */
  --text-secondary: #7f8c8d;       /* 中灰色 - 次要文本 */
  --text-light: #ffffff;           /* 白色 - 深色背景上的文本 */

  /* 背景顏色 */
  --bg-primary: #ffffff;           /* 白色 - 主要背景 */
  --bg-secondary: #f8f9fa;         /* 淺灰色 - 次要背景 */

  /* 玻璃效果 */
  --glass-bg: rgba(255, 255, 255, 0.7);      /* 半透明白色 */
  --glass-border: rgba(255, 255, 255, 0.8);  /* 玻璃元素邊框 */
  --glass-shadow: rgba(0, 0, 0, 0.1);        /* 微妙陰影 */

  /* 語義顏色 */
  --success-color: #50c878;        /* 綠色 - 成功 */
  --warning-color: #f39c12;        /* 橙色 - 警告 */
  --error-color: #e74c3c;          /* 紅色 - 錯誤 */
  --info-color: #3498db;           /* 藍色 - 信息 */
}
```

### 顏色使用指南

**主要顏色 (`--primary-color`):**
- 主要按鈕
- 活動導航項
- 鏈接
- 焦點狀態

**次要顏色 (`--secondary-color`):**
- 成功消息
- 確認按鈕
- 正面指示器

**強調顏色 (`--accent-color`):**
- 高亮
- 徽章
- 重要通知

---

## 排版

### 字體堆棧

```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                 'Roboto', 'Helvetica Neue', Arial, sans-serif,
                 'Apple Color Emoji', 'Segoe UI Emoji';

  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code',
                      'Roboto Mono', Consolas, 'Courier New', monospace;
}
```

### 字體大小

```css
:root {
  --font-size-xs: 0.75rem;    /* 12px - 說明文字 */
  --font-size-sm: 0.875rem;   /* 14px - 小文本 */
  --font-size-base: 1rem;     /* 16px - 正文 */
  --font-size-lg: 1.125rem;   /* 18px - 大文本 */
  --font-size-xl: 1.25rem;    /* 20px - 標題 */
  --font-size-2xl: 1.5rem;    /* 24px - 大標題 */
  --font-size-3xl: 1.875rem;  /* 30px - 頁面標題 */
}
```

### 字體粗細

```css
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

---

## 間距與佈局

### 間距比例

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}
```

---

## 玻璃擬態風格

### 核心玻璃效果

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 var(--glass-shadow);
}
```

### 玻璃變體

**淺色玻璃:**
```css
.glass-light {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
}
```

**深色玻璃:**
```css
.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  color: var(--text-light);
}
```

### 玻璃性能優化

**對於粘性元素:**
```css
.sticky-glass {
  position: sticky;
  top: 0;
  transform: translateZ(0);  /* 強制 GPU 層 */
  isolation: isolate;
}

.sticky-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);  /* 隔離到偽元素 */
  z-index: -1;
}
```

---

## 組件模式

### 按鈕

**主要按鈕:**
```css
.btn-primary {
  background: var(--primary-color);
  color: var(--text-light);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: 8px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #3a7bc8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}
```

**次要按鈕:**
```css
.btn-secondary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--primary-color);
  color: var(--text-light);
}
```

### 卡片

**玻璃卡片:**
```css
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: var(--spacing-lg);
  box-shadow: 0 8px 32px 0 var(--glass-shadow);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.15);
}
```

### 輸入框

**文本輸入:**
```css
.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: var(--font-size-base);
  transition: all 0.3s ease;
  background: var(--bg-primary);
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}
```

### 表格

**玻璃表格:**
```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
}

.table th {
  background: rgba(74, 144, 226, 0.1);
  padding: var(--spacing-md);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  position: sticky;
  top: 0;
}

.table tr:hover {
  background: rgba(74, 144, 226, 0.05);
}
```

---

## 動畫與過渡

### 過渡時長

```css
:root {
  --transition-fast: 150ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;
  --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 常見過渡

**淡入:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--transition-base) var(--transition-ease);
}
```

**向上滑動:**
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp var(--transition-base) var(--transition-ease);
}
```

---

## 響應式設計

### 斷點

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### 媒體查詢

**移動優先:**
```css
/* 移動設備（默認） */
.container {
  padding: var(--spacing-md);
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-xl);
  }
}
```

---

## 可訪問性

### 焦點狀態

```css
*:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

### 僅屏幕閱讀器

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 減少動畫

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 實施指南

### 使用 CSS 變量

```vue
<style scoped>
.my-component {
  color: var(--text-primary);
  background: var(--glass-bg);
  padding: var(--spacing-md);
  border-radius: 12px;
  transition: all var(--transition-base) var(--transition-ease);
}
</style>
```

### 最佳實踐

1. **始終使用 CSS 變量** - 絕不硬編碼顏色或間距
2. **遵循命名約定** - 使用 BEM 或類似方法
3. **作用域樣式** - 在 Vue 組件中使用 `scoped`
4. **優化性能** - 對動畫使用 `will-change` 和 `contain`
5. **測試可訪問性** - 檢查鍵盤導航和屏幕閱讀器
6. **默認響應式** - 移動優先設計
7. **一致的間距** - 對所有邊距和內邊距使用間距比例
8. **流暢過渡** - 使用 300ms 作為默認過渡時長

---

**更多詳細信息，請參閱：**
- [架構文檔](./ARCHITECTURE.md)
- [API 文檔](./API.md)
- [貢獻指南](./CONTRIBUTING.md)
- [完整英文版](./DESIGN_SYSTEM.en.md)
