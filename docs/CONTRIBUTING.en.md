# Contributing Guide

> Guidelines for contributing to the 方音圖鑑 (Chinese Dialect Atlas) project

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Component Guidelines](#component-guidelines)
5. [API Guidelines](#api-guidelines)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Pull Request Process](#pull-request-process)
9. [Issue Guidelines](#issue-guidelines)
10. [Community](#community)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- **Node.js** >= 18
- **npm** >= 9
- **Git** installed and configured
- A code editor (VS Code recommended)
- Basic knowledge of Vue 3 and Composition API

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dialects-js-frontend.git
   cd dialects-js-frontend
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/jengzang/dialects-js-frontend.git
   ```

4. **Install dependencies**
   ```bash
   cd project
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Verify setup**
   - Open `http://localhost:5173` in browser
   - Check that the application loads correctly

---

## Development Workflow

### Branch Strategy

**Main Branches:**
- `master` - Production-ready code
- `develop` - Integration branch for features (if used)

**Feature Branches:**
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/topic` - Documentation updates

### Creating a Feature Branch

```bash
# Update your local master
git checkout master
git pull upstream master

# Create feature branch
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/my-new-feature
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `style` - Code style changes (formatting, etc.)
- `docs` - Documentation changes
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements

**Examples:**
```bash
feat(query): add phoneme search functionality
fix(map): resolve marker clustering issue
refactor(api): centralize API module exports
docs(readme): update installation instructions
style(components): format code with prettier
perf(table): implement progressive rendering
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream master into your local master
git checkout master
git merge upstream/master

# Update your fork on GitHub
git push origin master

# Rebase your feature branch
git checkout feature/my-feature
git rebase master
```

---

## Code Standards

### Vue 3 Composition API

**Always use `<script setup>` syntax:**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits(['update', 'delete'])

// Reactive state
const count = ref(0)

// Computed properties
const doubleCount = computed(() => count.value * 2)

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted')
})

// Methods
function handleClick() {
  emit('update', count.value)
}
</script>

<template>
  <div>{{ doubleCount }}</div>
</template>

<style scoped>
/* Component styles */
</style>
```

### Naming Conventions

**Components:**
- PascalCase: `PhonologyTable.vue`, `NavBar.vue`
- Descriptive names: `AudioInputPanel.vue` not `Input.vue`

**Files:**
- Components: PascalCase
- Utilities: camelCase (`store.js`, `message.js`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

**Variables:**
- camelCase: `userData`, `isLoading`
- Boolean: prefix with `is`, `has`, `should`
- Arrays: plural names (`locations`, `results`)

**Functions:**
- camelCase: `fetchData()`, `handleClick()`
- Event handlers: prefix with `handle` or `on`
- Async functions: use `async/await`

### Code Formatting

**Indentation:**
- 2 spaces (no tabs)
- Consistent across all files

**Line Length:**
- Maximum 100 characters
- Break long lines logically

**Quotes:**
- Single quotes for strings: `'hello'`
- Template literals for interpolation: `` `Hello ${name}` ``

**Semicolons:**
- Optional but be consistent
- Project uses semicolons

**Spacing:**
```javascript
// Good
function example(a, b) {
  return a + b
}

// Bad
function example(a,b){
  return a+b
}
```

### Import Order

```javascript
// 1. Vue core
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 2. External libraries
import { useDebounceFn } from '@vueuse/core'

// 3. Internal APIs (always from @/api)
import { searchChars, showSuccess, showError } from '@/api'

// 4. Internal utilities
import { globalPayload, userStore } from '@/utils/store.js'

// 5. Components
import NavBar from '@/components/NavBar.vue'
import ResultList from '@/components/result/ResultList.vue'
```

### API Import Convention

**CRITICAL:** Always import from `@/api`, never from subdirectories.

```javascript
// ✅ CORRECT
import { searchChars, getLocations, sqlQuery } from '@/api'

// ❌ WRONG
import { searchChars } from '@/api/query/core.js'
import { getLocations } from '@/api/query/LocationAndRegion.js'
```

---

## Component Guidelines

### Component Structure

```vue
<script setup>
// 1. Imports
import { ref } from 'vue'

// 2. Props
const props = defineProps({
  // ...
})

// 3. Emits
const emit = defineEmits(['event'])

// 4. Reactive state
const state = ref(null)

// 5. Computed properties
const computed = computed(() => {})

// 6. Methods
function method() {}

// 7. Lifecycle hooks
onMounted(() => {})

// 8. Watchers
watch(state, () => {})
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Styles */
</style>
```

### Props Definition

```javascript
// Good - with validation
const props = defineProps({
  data: {
    type: Array,
    required: true,
    validator: (value) => value.length > 0
  },
  mode: {
    type: String,
    default: 'list',
    validator: (value) => ['list', 'grid'].includes(value)
  }
})

// Bad - no validation
const props = defineProps(['data', 'mode'])
```

### Event Naming

```javascript
// Good - kebab-case
emit('update-data', newData)
emit('item-selected', item)

// Bad - camelCase
emit('updateData', newData)
emit('itemSelected', item)
```

### Scoped Styles

```vue
<style scoped>
/* Use CSS variables from design system */
.component {
  color: var(--text-primary);
  background: var(--glass-bg);
  padding: var(--spacing-md);
}

/* Avoid deep selectors unless necessary */
:deep(.child-component) {
  /* Only when you need to style child components */
}
</style>
```

### Component Size

- Keep components under 300 lines
- Extract reusable logic into composables
- Split large components into smaller ones
- Use slots for flexible composition

---

## API Guidelines

### Creating New API Functions

**Location:** `src/api/<category>/<file>.js`

**Pattern:**
```javascript
import { api } from '../auth/auth.js'

/**
 * Search characters across dialects
 * @param {Object} payload - Query payload
 * @param {string} payload.chars - Characters to search
 * @param {string[]} payload.locations - Location names
 * @returns {Promise<Array>} Query results
 */
export async function searchChars(payload) {
  return await api('/phonology', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

**Export from central hub:**
```javascript
// src/api/index.js
export * from './query/core.js'
```

### Error Handling

```javascript
import { showError } from '@/utils/message.js'

try {
  const results = await searchChars(payload)
  return results
} catch (error) {
  showError(error.message)
  throw error  // Re-throw for caller to handle
}
```

### API Documentation

Document all API functions with JSDoc:

```javascript
/**
 * Get phonology matrix for locations
 * @param {string[]} locations - Array of location names
 * @returns {Promise<Object[]>} Matrix data
 * @throws {Error} If locations array is empty
 * @example
 * const matrix = await getPhonologyMatrix(['广州', '深圳'])
 */
export async function getPhonologyMatrix(locations) {
  if (!locations || locations.length === 0) {
    throw new Error('Locations array cannot be empty')
  }
  return await api('/phonology_matrix', {
    method: 'POST',
    body: JSON.stringify({ locations })
  })
}
```

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile, tablet, desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] Keyboard navigation works
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] No performance regressions

### Testing New Features

1. **Test happy path** - Normal usage
2. **Test edge cases** - Empty data, large datasets
3. **Test error cases** - Network errors, invalid input
4. **Test accessibility** - Keyboard navigation, screen readers
5. **Test performance** - Large datasets, slow connections

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Testing

For components with large datasets:
- Test with 100, 1000, 10000 items
- Monitor memory usage
- Check for memory leaks
- Verify smooth scrolling

---

## Documentation

### Code Comments

**When to comment:**
- Complex algorithms
- Non-obvious logic
- Workarounds for bugs
- Performance optimizations

**When NOT to comment:**
- Self-explanatory code
- Obvious operations
- Redundant descriptions

```javascript
// Good - explains WHY
// Use progressive rendering to avoid blocking UI thread
// with 6,400+ cells
const visibleRows = ref(15)

// Bad - explains WHAT (obvious from code)
// Set visible rows to 15
const visibleRows = ref(15)
```

### Component Documentation

Add README.md for complex components:

```markdown
# PhonologyTable

Displays phonology matrix with progressive rendering.

## Props

- `matrix` (Array, required) - Matrix data
- `location` (String, required) - Location name

## Events

- `cell-click` - Emitted when cell is clicked

## Performance

Uses progressive rendering for 6,400+ cells.
First 15 rows render immediately, rest load progressively.
```

### API Documentation

Update [API.md](./API.md) when adding new endpoints.

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout master
   git pull upstream master
   git checkout feature/my-feature
   git rebase master
   ```

2. **Test thoroughly**
   - Run `npm run dev` and test manually
   - Check for console errors
   - Test on different browsers

3. **Review your changes**
   ```bash
   git diff master
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat(query): add phoneme search"
   ```

### Creating Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/my-feature
   ```

2. **Open PR on GitHub**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Tested manually
- [ ] Tested on multiple browsers
- [ ] Tested responsive design

## Screenshots
(if applicable)

## Related Issues
Closes #123
```

### PR Review Process

1. **Automated checks** - Must pass
2. **Code review** - At least one approval required
3. **Testing** - Reviewer tests changes
4. **Feedback** - Address review comments
5. **Merge** - Maintainer merges PR

### Addressing Review Comments

```bash
# Make changes based on feedback
git add .
git commit -m "fix: address review comments"
git push origin feature/my-feature
```

---

## Issue Guidelines

### Reporting Bugs

**Use bug report template:**

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Version: 1.2.0

## Screenshots
(if applicable)
```

### Feature Requests

**Use feature request template:**

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Any other information
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `performance` - Performance improvements
- `question` - Further information requested

---

## Community

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Assume good intentions

### Getting Help

- **Documentation:** Check [README.md](./README.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md)
- **Issues:** Search existing issues first
- **Discussions:** Use GitHub Discussions for questions
- **Email:** Contact maintainers for sensitive issues

### Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Project README

---

## Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [MapLibre GL Documentation](https://maplibre.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label
4. Contact maintainers

---

**Thank you for contributing! 🎉**

Your contributions help make Chinese dialect research more accessible to everyone.