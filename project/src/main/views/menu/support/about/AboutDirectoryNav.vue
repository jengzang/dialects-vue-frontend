<template>
  <button
    ref="toggleEl"
    type="button"
    class="directory-nav-toggle glass-button"
    data-directory-nav-toggle
    :aria-expanded="open"
    :aria-controls="navId"
    @click="open = !open"
  >{{ label }}</button>
  <nav
    :id="navId"
    ref="navEl"
    class="directory-nav glass-panel"
    :class="{ 'is-open': open }"
    :aria-label="label || undefined"
  >
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="directory-nav-item"
      :data-directory-nav-item="section.id"
      :aria-label="section.label"
      :aria-current="activeSection === section.id ? 'location' : undefined"
      :title="section.label"
      @click="jumpToSection(section.id)"
    >
      <span class="directory-nav-label">{{ section.label }}</span>
      <span class="directory-nav-dot" aria-hidden="true"></span>
    </button>
  </nav>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = defineProps({
  sections: {
    type: Array,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
})

const navId = `${useId()}-directory`
const navEl = ref(null)
const toggleEl = ref(null)
const open = ref(false)
const activeSection = ref(props.sections[0]?.id ?? '')

function handlePointerDown(event) {
  if (navEl.value?.contains(event.target) || toggleEl.value?.contains(event.target)) return
  open.value = false
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', handlePointerDown, true)
  else document.removeEventListener('pointerdown', handlePointerDown, true)
})

function jumpToSection(id) {
  document.getElementById(id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  activeSection.value = id
  open.value = false
}

function updateActiveSection() {
  const threshold = window.innerHeight * 0.35
  for (const section of props.sections) {
    const target = document.getElementById(section.id)
    if (target && target.getBoundingClientRect().top <= threshold) {
      activeSection.value = section.id
    } else {
      break
    }
  }
}

onMounted(() => window.addEventListener('scroll', updateActiveSection, { passive: true, capture: true }))
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateActiveSection, true)
  document.removeEventListener('pointerdown', handlePointerDown, true)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.directory-nav {
  position: fixed;
  top: 50%;
  right: 1rem;
  z-index: 1600;
  width: auto;
  max-height: 80dvh;
  padding: 0.35rem;
  transform: translateY(-50%);
}

.directory-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2rem;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--text-medium);
  font: inherit;
  text-align: right;
  cursor: pointer;

  &:hover,
  &:focus-visible,
  &[aria-current='location'] {
    color: var(--color-primary);
  }
}

.directory-nav-label {
  @include text-truncate;
  position: absolute;
  right: 2.35rem;
  max-width: 0;
  padding: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-glass-floating);
  font-size: var(--font-size-12);
  opacity: 0;
  pointer-events: none;
}

.directory-nav-item:hover .directory-nav-label,
.directory-nav-item:focus-visible .directory-nav-label,
.directory-nav-item[aria-current='location'] .directory-nav-label {
  max-width: 11rem;
  padding: 0.3rem 0.5rem;
  opacity: 1;
}

.directory-nav-dot {
  flex: 0 0 auto;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: var(--radius-pill);
  background: var(--color-primary-border);
}

.directory-nav-item[aria-current='location'] .directory-nav-dot {
  background: var(--color-primary);
}

.directory-nav-toggle {
  display: none;
}

:global([data-directory-nav-target]) {
  scroll-margin-top: 7rem;
}

@media (max-aspect-ratio: 1 / 1) {
  .directory-nav-toggle {
    display: block;
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 1601;
  }

  .directory-nav {
    display: none;
    top: auto;
    right: auto;
    left: 1rem;
    bottom: 4.5rem;
    width: min(15rem, calc(100vw - 2rem));
    max-height: 65dvh;
    overflow-y: auto;
    transform: none;

    &.is-open {
      display: block;
    }
  }

  .directory-nav-label {
    position: static;
    flex: 1;
    max-width: none;
    padding: 0;
    background: transparent;
    opacity: 1;
  }

  .directory-nav-item {
    justify-content: space-between;
    gap: 0.6rem;
    text-align: left;
  }

  .directory-nav-item[aria-current='location'] .directory-nav-label {
    max-width: none;
    padding: 0;
  }
}
</style>
