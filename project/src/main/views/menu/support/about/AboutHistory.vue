<template>
  <section
    class="history-page"
    :class="{ 'history-page--featured': featured }"
    aria-labelledby="history-title"
  >
    <component
      :is="featured ? 'h2' : 'h1'"
      id="history-title"
      class="page-title"
    >
      {{ props.title || t('about.history.title') }}
    </component>
    <div v-if="!featured" class="history-filter">
      <SwitchToggle
        :model-value="onlyImportant"
        :width="50"
        :height="28"
        :thumb-size="24"
        :gap="8"
        :active-text="t('about.history.onlyImportant')"
        :inactive-text="t('about.history.allHistory')"
        label-position="right"
        :aria-label="t('about.history.filterLabel')"
        @update:model-value="onlyImportant = $event"
      />
    </div>
    <!-- <p
      class="history-filter-summary hint"
      aria-live="polite"
    >
      共 {{ visibleEntryCount }} 条更新
    </p> -->
    <section
      v-for="stage in renderedStages"
      :key="stage.major"
      class="history-stage"
      :class="{ 'glass-panel': featured }"
      :aria-labelledby="`history-stage-${stage.major}`"
    >
      <h2
        :id="`history-stage-${stage.major}`"
        class="history-stage-title"
      >
        {{ t(`about.history.stage${stage.major}`) }}
      </h2>
      <ol
        v-if="stage.entries.length"
        class="history-timeline"
      >
        <li
          v-for="(entry, index) in stage.entries"
          :key="entry.date"
          class="history-entry"
        >
          <div class="history-date-column">
            <time
              class="history-date"
              :datetime="entry.dateTime"
            >{{ entry.date }}</time>
            <span
              v-if="entry.important"
              class="hint"
              :title="localizedImportanceReason(entry)"
              role="img"
              :aria-label="t('about.history.importantLabel')"
            >⭐</span>
          </div>
          <p class="history-content">
            <template
              v-for="(part, partIndex) in entry.displayParts"
              :key="partIndex"
            >
              <template v-if="typeof part === 'string'">
                {{ part }}
              </template>
              <code
                v-else-if="part.version"
                class="history-version"
              >{{ part.version }}</code>
              <button
                v-else-if="part.action"
                type="button"
                class="text-action history-link history-link--action"
                @click="triggerFooterAction(part.action)"
              >
                {{ part.label }}
              </button>
              <RouterLink
                v-else-if="part.to"
                class="text-action history-link history-link--internal"
                :to="buildLocalePath(resolveRouteLocale(route), part.to)"
              >
                {{ part.text }}
              </RouterLink>
              <a
                v-else
                class="glass-button history-link--external"
                data-size="compact"
                :href="part.href"
                target="_blank"
                rel="noopener noreferrer"
              ><span>{{ part.label }}</span></a>
            </template>
          </p>
          <span
            v-if="index < stage.entries.length - 1"
            class="history-connector"
            aria-hidden="true"
          />
        </li>
      </ol>
    </section>
    <div
      v-if="featured"
      class="history-featured-actions"
    >
      <RouterLink
        class="glass-button history-featured-link"
        :to="buildLocalePath(resolveRouteLocale(route), '/menu/about/history')"
      >
        <span>{{ $t('home.history.viewAll') }}</span>
      </RouterLink>
    </div>
    <section
      v-if="!featured"
      class="thoughts-container"
      aria-labelledby="reflection-title"
    >
      <h2
        id="reflection-title"
        class="tabs-title"
      >
        {{ $t('about.reflection.title') }}
      </h2>
      <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph1') }}</p>
      <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph2') }}</p>
      <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph3') }}</p>
      <p class="thoughts" style="text-align: center;"><em v-html="$t('about.reflection.poem')"></em></p>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { historyEntries, historyStages } from './history.data.js'

const props = defineProps({
  featured: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
})

const { t } = useI18n()

const FOOTER_ACTION_EVENT = 'app-footer-action'

const route = useRoute()
const onlyImportant = ref(false)
function triggerFooterAction(action) {
  window.dispatchEvent(new CustomEvent(FOOTER_ACTION_EVENT, { detail: { action } }))
}

const renderedStages = computed(() => {
  const stages = historyStages.map(stage => ({ ...stage, entries: [] }))
  let currentMajor = 1

  for (const entry of historyEntries) {
    const displayParts = localizedParts(entry)
    const release = displayParts.find(part => part.version)
    if (release) currentMajor = Number(release.version.split('.')[0].slice(1))

    const stage = stages.find(item => item.major === currentMajor)
    if (!stage) continue

    const visible = (!props.featured && !onlyImportant.value) || entry.important
    if (visible) {
      stage.entries.push({
        ...entry,
        displayParts
      })
    }
  }

  return stages.map(stage => ({ ...stage, title: t(`about.history.stage${stage.major}`) }))
})

function localizedImportanceReason(entry) {
  return t(`about.history.importanceReasons.${entry.date.replaceAll('.', '_')}`)
}

function localizedParts(entry) {
  return parseLocalizedParts(t(`about.history.entries.${entry.date.replaceAll('.', '_')}`))
}

function parseLocalizedParts(content) {
  const markerPattern = /\[\[(link|external|action)::([^:]+)::([^\]]+)\]\]|\[\[version:([^\]]+)\]\]/g
  const parts = []
  let cursor = 0

  for (const match of content.matchAll(markerPattern)) {
    const type = match[1]
    const value = match[2]
    const label = match[3]
    const version = match[4]
    if (match.index > cursor) parts.push(content.slice(cursor, match.index))

    if (version) parts.push({ version })
    else if (type === 'link') parts.push({ text: label, to: value })
    else if (type === 'action') parts.push({ label, action: value })
    else parts.push({ label, href: decodeURIComponent(value) })

    cursor = match.index + match[0].length
  }

  if (cursor < content.length) parts.push(content.slice(cursor))
  return parts
}
// const visibleEntryCount = computed(() => visibleStages.value.reduce((count, stage) => count + stage.entries.length, 0))
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.history-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 70rem;
  margin-inline: auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.history-page--featured {
  max-width: 82rem;

  .page-title {
    color: var(--color-primary);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
  }
}

.tabs-title {
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: bold;
}

.thoughts-container {
  width: 100%;
  max-width: 800px;
  margin: 3rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-primary-border);
}

.thoughts-container .tabs-title {
  margin-top: 0;
}

.thoughts {
  max-width: 800px;
  margin: 20px auto;
  color: var(--text-dark);
  font-family: var(--font-serif);
  font-size: 18px;
  line-height: 1.8;
  text-align: left;
  text-indent: 2em;

  em {
    color: var(--text-primary);
    font-weight: bold;
    text-decoration: underline;
  }
}

.history-stage {
  max-width: 60rem;
  margin: 2.5rem auto 0;

  & + & {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-primary-border);
  }
}

.history-page--featured .history-stage {
  --glass-panel-background: var(--glass-60);
  --glass-panel-backdrop-filter: blur(20px);
  --glass-panel-border: 1px solid rgba(var(--color-primary-rgb), 0.15);
  --glass-panel-radius: var(--radius-md);
  --glass-panel-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.08);
  --glass-panel-hover-shadow: 0 12px 32px rgba(var(--color-primary-rgb), 0.18);

  box-sizing: border-box;
  width: 100%;
  margin-top: 1.5rem;
  padding: clamp(1rem, 3vw, 2rem);

  & + & {
    margin-top: 1.5rem;
    border-top: 0;
  }
}

.history-page--featured {
  .history-stage-title {
    font-size: 1.2rem;
  }

  .history-date,
  .history-content {
    font-size: 0.9rem;
  }
}

.history-filter {
  display: flex;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  margin: 1.5rem auto 0;
}

.history-filter-summary {
  margin: 0.75rem 0 0;
  text-align: center;
}

.history-featured-actions {
  @include flex-center;
  margin-top: 2rem;
}

.history-featured-link {
  text-decoration: none;
}

.history-stage-title {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.6;
  text-align: center;
}

.history-timeline {
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.history-entry {
  position: relative;
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 1.5rem;
  padding: 0 0 1rem 2rem;

  &::before {
    content: '';
    position: absolute;
    top: 0.55rem;
    left: 0;
    width: 0.65rem;
    height: 0.65rem;
    border-radius: var(--radius-pill);
    background: var(--color-primary);
  }

  &:last-child {
    padding-bottom: 0;
  }
}

.history-date-column {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-date {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-weight: 600;
  line-height: 1.9;
}

.history-content {
  min-width: 0;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.9;
  overflow-wrap: anywhere;
}

// 本页的版本标签与两类行内链接需要在同一段原文中明显区分。
.history-version {
  padding: 0.1em 0.4em;
  margin-inline: 0.15em;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-weight: 600;
  white-space: nowrap;
}

.history-link {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 0.2em;

  &:hover,
  &:focus-visible {
    color: var(--color-primary-hover);
  }
}

.history-link--external {
  --glass-button-color: var(--color-secondary-text);
  --glass-button-compact-font-size: 0.9em;
  --glass-button-compact-padding: 0.2em 0.5em;
  --glass-button-border-radius: var(--radius-sm);

  max-width: 100%;
  margin-inline: 0.25em;
  box-sizing: border-box;
  vertical-align: middle;
  text-align: start;
  text-decoration: none;

  &::after {
    content: '↗';
    flex-shrink: 0;
  }
}

// 时间线节点和箭头是本页独有的图形，其余表面与文字复用全站样式。
.history-connector {
  position: absolute;
  top: 1.5rem;
  bottom: 0.35rem;
  left: 0.3rem;
  border-left: 1px solid var(--color-primary-medium2);
}

@media (max-aspect-ratio: 1 / 1) {
  .history-page {
    font-size: 0.875rem;
  }

  .history-page .page-title {
    font-size: 1.25rem;
  }

  .history-page--featured .page-title {
    font-size: 1.75rem;
  }

  .history-page--featured {
    .history-stage-title {
      font-size: 1.05rem;
    }

    .history-date,
    .history-content {
      font-size: 0.8125rem;
    }
  }

  .history-stage-title {
    font-size: 1.2rem;
  }

  .history-filter-summary {
    font-size: 0.8rem;
  }

  .history-date-column .hint {
    font-size: 0.75rem;
  }

  .thoughts {
    margin: 24px auto;
    font-size: 0.875rem;
    line-height: 1.65;
  }

  .tabs-title {
    font-size: 1.2rem;
  }

  .history-entry {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.5rem;
    padding-left: 1.5rem;
  }
}
</style>
