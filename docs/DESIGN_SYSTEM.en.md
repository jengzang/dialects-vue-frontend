# Design System

> Visual design guidelines and component patterns for the 方音圖鑑 platform

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Glassmorphism Style](#glassmorphism-style)
6. [Component Patterns](#component-patterns)
7. [Animations & Transitions](#animations--transitions)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)
10. [Implementation Guidelines](#implementation-guidelines)

---

## Design Philosophy

### Core Principles

1. **Clarity** - Information should be easy to find and understand
2. **Consistency** - Similar elements should look and behave similarly
3. **Efficiency** - Minimize clicks and cognitive load
4. **Beauty** - Aesthetic design enhances user experience
5. **Accessibility** - Usable by everyone, regardless of ability

### Visual Style

The platform uses a **modern glassmorphism** aesthetic:
- Semi-transparent backgrounds with backdrop blur
- Subtle shadows and borders
- Smooth transitions and animations
- High contrast text for readability
- Clean, minimal interface

---

## Color System

### CSS Variables

All colors are defined as CSS variables in `src/style.css`:

```css
:root {
  /* Primary Colors */
  --primary-color: #4a90e2;        /* Blue - primary actions */
  --secondary-color: #50c878;      /* Green - success states */
  --accent-color: #f39c12;         /* Orange - highlights */

  /* Text Colors */
  --text-primary: #2c3e50;         /* Dark gray - main text */
  --text-secondary: #7f8c8d;       /* Medium gray - secondary text */
  --text-light: #ffffff;           /* White - text on dark backgrounds */

  /* Background Colors */
  --bg-primary: #ffffff;           /* White - main background */
  --bg-secondary: #f8f9fa;         /* Light gray - secondary background */
  --bg-dark: #2c3e50;              /* Dark gray - dark mode background */

  /* Glass Effect */
  --glass-bg: rgba(255, 255, 255, 0.7);      /* Semi-transparent white */
  --glass-border: rgba(255, 255, 255, 0.8);  /* Border for glass elements */
  --glass-shadow: rgba(0, 0, 0, 0.1);        /* Subtle shadow */

  /* Semantic Colors */
  --success-color: #50c878;        /* Green - success */
  --warning-color: #f39c12;        /* Orange - warning */
  --error-color: #e74c3c;          /* Red - error */
  --info-color: #3498db;           /* Blue - info */

  /* Border & Divider */
  --border-color: #e1e8ed;         /* Light gray - borders */
  --divider-color: #ecf0f1;        /* Very light gray - dividers */
}
```

### Color Usage Guidelines

**Primary Color (`--primary-color`):**
- Primary buttons
- Active navigation items
- Links
- Focus states

**Secondary Color (`--secondary-color`):**
- Success messages
- Confirmation buttons
- Positive indicators

**Accent Color (`--accent-color`):**
- Highlights
- Badges
- Important notifications

**Text Colors:**
- Use `--text-primary` for main content
- Use `--text-secondary` for labels and captions
- Use `--text-light` on dark backgrounds

**Semantic Colors:**
- `--success-color` - Successful operations
- `--warning-color` - Warnings and cautions
- `--error-color` - Errors and destructive actions
- `--info-color` - Informational messages

### Color Contrast

Ensure sufficient contrast for accessibility:
- Text on white: minimum 4.5:1 ratio
- Text on colored backgrounds: minimum 4.5:1 ratio
- Large text (18pt+): minimum 3:1 ratio

---

## Typography

### Font Stack

```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                 'Roboto', 'Helvetica Neue', Arial, sans-serif,
                 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';

  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code',
                      'Roboto Mono', Consolas, 'Courier New', monospace;
}
```

### Font Sizes

```css
:root {
  --font-size-xs: 0.75rem;    /* 12px - captions */
  --font-size-sm: 0.875rem;   /* 14px - small text */
  --font-size-base: 1rem;     /* 16px - body text */
  --font-size-lg: 1.125rem;   /* 18px - large text */
  --font-size-xl: 1.25rem;    /* 20px - headings */
  --font-size-2xl: 1.5rem;    /* 24px - large headings */
  --font-size-3xl: 1.875rem;  /* 30px - page titles */
}
```

### Font Weights

```css
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Line Heights

```css
:root {
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### Typography Usage

**Headings:**
```css
h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
}

h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
}
```

**Body Text:**
```css
body {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
}
```

**Small Text:**
```css
.caption {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
```

---

## Spacing & Layout

### Spacing Scale

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

### Layout Containers

**Page Container:**
```css
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}
```

**Section Spacing:**
```css
.section {
  margin-bottom: var(--spacing-2xl);
}
```

**Component Spacing:**
```css
.component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
```

### Grid System

**Flexbox Grid:**
```css
.grid {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.grid-col {
  flex: 1;
  min-width: 250px;
}
```

**CSS Grid:**
```css
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}
```

---

## Glassmorphism Style

### Core Glass Effect

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

### Glass Variations

**Light Glass:**
```css
.glass-light {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
}
```

**Dark Glass:**
```css
.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  color: var(--text-light);
}
```

**Intense Glass:**
```css
.glass-intense {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
}
```

### Glass Performance Optimization

**For Sticky Elements:**
```css
.sticky-glass {
  position: sticky;
  top: 0;
  transform: translateZ(0);  /* Force GPU layer */
  isolation: isolate;
}

.sticky-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);  /* Isolated to pseudo-element */
  z-index: -1;
}
```

**For Scrollable Containers:**
```css
.scrollable-glass {
  will-change: transform;
  contain: layout style;
}
```

---

## Component Patterns

### Buttons

**Primary Button:**
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

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 8px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--primary-color);
  color: var(--text-light);
}
```

**Glass Button:**
```css
.btn-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}
```

### Cards

**Glass Card:**
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

### Input Fields

**Text Input:**
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

**Glass Input:**
```css
.input-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all 0.3s ease;
}

.input-glass:focus {
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--primary-color);
}
```

### Navigation

**Nav Bar:**
```css
.navbar {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--spacing-md) var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-item {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.nav-item.active {
  background: var(--primary-color);
  color: var(--text-light);
}
```

### Tables

**Glass Table:**
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
  z-index: 10;
}

.table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.table tr:hover {
  background: rgba(74, 144, 226, 0.05);
}
```

### Modals

**Glass Modal:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: var(--spacing-xl);
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.3);
}
```

### Toast Notifications

**Toast:**
```css
.toast {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: 0 8px 32px 0 var(--glass-shadow);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toast.success {
  border-left: 4px solid var(--success-color);
}

.toast.error {
  border-left: 4px solid var(--error-color);
}

.toast.warning {
  border-left: 4px solid var(--warning-color);
}
```

---

## Animations & Transitions

### Transition Timing

```css
:root {
  --transition-fast: 150ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;
  --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Common Transitions

**Fade In:**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn var(--transition-base) var(--transition-ease);
}
```

**Slide Up:**
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

**Scale In:**
```css
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn var(--transition-base) var(--transition-ease);
}
```

### Hover Effects

**Lift Effect:**
```css
.lift {
  transition: transform var(--transition-base) var(--transition-ease),
              box-shadow var(--transition-base) var(--transition-ease);
}

.lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.15);
}
```

**Glow Effect:**
```css
.glow {
  transition: box-shadow var(--transition-base) var(--transition-ease);
}

.glow:hover {
  box-shadow: 0 0 20px rgba(74, 144, 226, 0.5);
}
```

---

## Responsive Design

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Media Queries

**Mobile First:**
```css
/* Mobile (default) */
.container {
  padding: var(--spacing-md);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-xl);
  }
}
```

### Responsive Typography

```css
html {
  font-size: 14px;
}

@media (min-width: 768px) {
  html {
    font-size: 16px;
  }
}

@media (min-width: 1024px) {
  html {
    font-size: 18px;
  }
}
```

---

## Accessibility

### Focus States

```css
*:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

### Screen Reader Only

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

### Reduced Motion

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

## Implementation Guidelines

### Using CSS Variables

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

### Component Structure

```vue
<template>
  <div class="glass card">
    <h2 class="card-title">Title</h2>
    <p class="card-content">Content</p>
    <button class="btn-primary">Action</button>
  </div>
</template>

<style scoped>
.card {
  /* Use design system variables */
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
}

.card-content {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}
</style>
```

### Best Practices

1. **Always use CSS variables** - Never hardcode colors or spacing
2. **Follow naming conventions** - Use BEM or similar methodology
3. **Scope styles** - Use `scoped` in Vue components
4. **Optimize performance** - Use `will-change` and `contain` for animations
5. **Test accessibility** - Check keyboard navigation and screen readers
6. **Responsive by default** - Design mobile-first
7. **Consistent spacing** - Use spacing scale for all margins and padding
8. **Smooth transitions** - Use 300ms as default transition duration

---

## Resources

- [CSS Variables Reference](./src/style.css)
- [Component Examples](./src/components/)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

**Design with purpose, build with care. ✨**