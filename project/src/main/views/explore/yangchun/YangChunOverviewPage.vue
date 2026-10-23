<template>
  <main
    ref="pageEl"
    class="yangchun-overview"
  >
    <section
      id="yc-overview-top"
      class="yc-hero yc-reveal"
    >
      <div class="yc-hero__copy">
        <span class="yc-eyebrow">Yangchun Dialect Atlas</span>
        <h1><BarIcon icon="🌾" />{{ t('navigation.pageTitles.yangchun.overview') }}</h1>
        <p>
          从白话到涯话，从城镇中心到山边方言岛，阳春是两阳地区观察粤客接触、迁徙与方言分布的关键区域。
        </p>
        <div class="yc-hero__actions">
          <button
            class="glass-button"
            data-variant="primary"
            type="button"
            @click="scrollToSection('yc-map')"
          >
            看分布格局
          </button>
          <button
            class="glass-button"
            type="button"
            @click="scrollToSection('yc-phonology')"
          >
            看音系细节
          </button>
        </div>
      </div>

      <div
        class="yc-hero__visual"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 480 300"
          class="yc-contact-art"
        >
          <circle
            cx="184"
            cy="138"
            r="112"
            class="yc-contact-art__cantonese"
          />
          <circle
            cx="310"
            cy="158"
            r="94"
            class="yc-contact-art__hakka"
          />
          <path d="M80 245 C170 200 220 285 405 245" />
          <text
            x="158"
            y="140"
            class="yc-contact-art__title"
          >白话</text>
          <text
            x="323"
            y="167"
            class="yc-contact-art__title"
          >涯话</text>
          <text
            x="244"
            y="108"
            class="yc-contact-art__caption"
          >交汇</text>
          <circle
            cx="225"
            cy="214"
            r="5"
          />
          <circle
            cx="250"
            cy="230"
            r="3"
          />
          <circle
            cx="276"
            cy="214"
            r="4"
          />
          <text
            x="250"
            y="275"
            class="yc-contact-art__caption"
          >流域 · 迁徙 · 方言岛</text>
        </svg>
      </div>

      <div class="yc-hero__stats">
        <article
          v-for="stat in overviewStats"
          :key="stat.label"
          class="yc-stat"
        >
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
          <small>{{ stat.detail }}</small>
        </article>
      </div>
    </section>

    <nav
      class="yc-section-nav glass-panel"
      aria-label="阳春概览页内导航"
    >
      <button
        v-for="section in pageSections"
        :key="section.id"
        class="glass-button"
        data-size="small"
        type="button"
        @click="scrollToSection(section.id)"
      >
        {{ section.label }}
      </button>
    </nav>

    <section
      id="yc-map"
      class="yc-atlas-section yc-reveal"
    >
      <div class="yc-section-heading">
        <span class="yc-eyebrow">Distribution First</span>
        <h2>先看空间分布，再看音系细节</h2>
        <p>先把各方言板块的相对位置和接触关系放在一起，再向下展开更细的音系材料。</p>
      </div>

      <div class="yc-atlas-layout">
        <article class="yc-map-panel surface-panel">
          <div class="yc-map-panel__header">
            <div>
              <span class="yc-eyebrow">Distribution Map</span>
              <h3>阳春方言分布图</h3>
            </div>
            <span class="yc-map-panel__tag glass-subpanel">资料整理中</span>
          </div>

          <div
            class="yc-map-placeholder surface-subpanel"
            aria-label="阳春方言空间关系示意，非精确地理边界"
          >
            <svg
              class="yc-map-rivers"
              viewBox="0 0 600 430"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M290 28 C360 100 235 135 305 210 S345 300 370 400" />
              <path d="M85 290 C145 255 180 310 305 250" />
            </svg>
            <span
              class="yc-map-direction"
              aria-hidden="true"
            >↑ 北</span>
            <button
              v-for="group in dialectGroups"
              :key="group.id"
              class="yc-map-marker glass-button"
              :class="{ 'yc-map-marker--active': group.id === activeGroupId }"
              data-size="small"
              :data-active="group.id === activeGroupId"
              :aria-pressed="group.id === activeGroupId"
              :style="markerStyle(group)"
              type="button"
              @click="selectGroup(group.id)"
            >
              <span>{{ group.name }}</span>
            </button>
            <div class="yc-map-placeholder__river">
              漠阳江 / 潭水河流域
            </div>
          </div>
          <p class="yc-map-caption">
            空间关系示意 · 非精确地理边界，河流线条仅作示意
          </p>
        </article>

        <aside class="yc-active-panel glass-panel">
          <span class="yc-eyebrow">{{ selectedGroup.badge }}</span>
          <h3>{{ selectedGroup.name }}</h3>
          <p>{{ selectedGroup.distribution }}</p>
          <div class="yc-chip-list">
            <span
              v-for="trait in selectedGroup.traits"
              :key="trait"
              class="yc-chip glass-subpanel"
            >{{ trait }}</span>
          </div>
          <div class="yc-source-line">
            <span>参考：</span>
            <strong>{{ selectedGroup.sources.join('、') }}</strong>
          </div>
        </aside>
      </div>
    </section>

    <section
      id="yc-groups"
      class="yc-groups-section yc-reveal"
    >
      <div class="yc-section-heading">
        <span class="yc-eyebrow">Dialect Groups</span>
        <h2>六个分布板块</h2>
        <p>每个板块保留主要分布、简要特点和来源线索，方便以后与地图图层对应。</p>
      </div>

      <div class="yc-group-carousel">
        <button
          class="glass-button yc-group-carousel__arrow"
          :disabled="!groupCanPrev"
          aria-label="向左浏览方言板块"
          type="button"
          @click="scrollGroupCarousel('prev')"
        >
          ‹
        </button>

        <div
          ref="groupScroller"
          class="yc-group-scroller"
          tabindex="0"
          aria-label="阳春方言板块横向列表"
          @scroll="onGroupCarouselScroll"
        >
          <button
            v-for="group in dialectGroups"
            :key="group.id"
            class="glass-card yc-group-card"
            data-interactive="true"
            :data-group-id="group.id"
            :aria-pressed="group.id === activeGroupId"
            :data-active="group.id === activeGroupId"
            type="button"
            @click="selectGroup(group.id)"
          >
            <span class="yc-group-card__badge glass-subpanel">{{ group.badge }}</span>
            <strong>{{ group.name }}</strong>
            <p>{{ group.short }}</p>
            <small>{{ group.area }}</small>
          </button>
        </div>

        <button
          class="glass-button yc-group-carousel__arrow"
          :disabled="!groupCanNext"
          aria-label="向右浏览方言板块"
          type="button"
          @click="scrollGroupCarousel('next')"
        >
          ›
        </button>
      </div>

      <article class="yc-group-detail glass-panel yc-reveal">
        <div>
          <span class="yc-eyebrow">当前选中</span>
          <h3>{{ selectedGroup.name }}</h3>
        </div>
        <p>{{ selectedGroup.detail }}</p>
      </article>
    </section>

    <section
      id="yc-contact"
      class="yc-contact-section yc-reveal"
    >
      <article class="yc-contact-panel">
        <div class="yc-section-heading yc-section-heading--left">
          <span class="yc-eyebrow">Contact Zone</span>
          <h2>交汇、迁徙与方言岛</h2>
          <p>
            阳春概览页不只列出方言名称，也要解释为什么这些分布会形成现在的样子：流域、山边聚居、移民史和代际转用共同塑造了格局。
          </p>
        </div>

        <div class="yc-note-grid">
          <article
            v-for="note in migrationNotes"
            :key="note.title"
            class="surface-subpanel yc-note-card"
          >
            <strong>{{ note.title }}</strong>
            <p>{{ note.text }}</p>
          </article>
        </div>
      </article>
    </section>

    <section
      id="yc-phonology"
      class="yc-phonology-section yc-reveal"
    >
      <div class="yc-section-heading">
        <span class="yc-eyebrow">Phonology Below The Fold</span>
        <h2>音系细节放在下面，但信息不减</h2>
        <p>首屏保持概览，向下滚动后再展开声母、韵母、声调、词汇影响等研究者关心的内容。</p>
      </div>

      <div class="yc-phonology-layout">
        <div
          class="yc-phonology-tabs"
          role="tablist"
          aria-label="阳春音系细节"
        >
          <button
            v-for="item in phonologyDetails"
            :key="item.id"
            class="glass-button"
            :data-active="item.id === activePhonologyId"
            type="button"
            role="tab"
            :aria-selected="item.id === activePhonologyId"
            @click="activePhonologyId = item.id"
          >
            {{ item.title }}
          </button>
        </div>

        <article class="glass-panel yc-phonology-panel">
          <span class="yc-eyebrow">{{ activePhonology.title }}</span>
          <h3>{{ activePhonology.summary }}</h3>
          <ul>
            <li
              v-for="point in activePhonology.points"
              :key="point"
            >
              {{ point }}
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section
      id="yc-sources"
      class="yc-sources-section yc-reveal"
    >
      <div class="yc-section-heading">
        <span class="yc-eyebrow">Sources</span>
        <h2>资料来源</h2>
        <p>页面文案整理自本仓库 `docs/zhihu/阳春` 下的调查文章。</p>
      </div>

      <div class="yc-source-grid">
        <article
          v-for="article in sourceArticles"
          :key="article.path"
          class="yc-source-card"
        >
          <span>{{ article.date }}</span>
          <strong>{{ article.title }}</strong>
          <small>{{ article.path }}</small>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import BarIcon from '@/components/common/BarIcon.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  dialectGroups,
  migrationNotes,
  overviewStats,
  phonologyDetails,
  sourceArticles,
} from './yangchunOverviewData.js'

const pageEl = ref(null)
const groupScroller = ref(null)
const { t } = useI18n()
const FALLBACK_MARKER_POSITION = { left: 50, top: 50 }
const FALLBACK_DIALECT_GROUP = {
  id: '',
  name: '',
  badge: '',
  distribution: '',
  detail: '',
  traits: [],
  sources: [],
}
const FALLBACK_PHONOLOGY_DETAIL = {
  id: '',
  title: '',
  summary: '',
  points: [],
}
const activeGroupId = ref(dialectGroups[0]?.id || '')
const activePhonologyId = ref(phonologyDetails[0]?.id || '')
const groupCanPrev = ref(false)
const groupCanNext = ref(false)

const pageSections = [
  { id: 'yc-map', label: '分布' },
  { id: 'yc-groups', label: '板块' },
  { id: 'yc-contact', label: '交汇' },
  { id: 'yc-phonology', label: '音系' },
  { id: 'yc-sources', label: '来源' },
]

const selectedGroup = computed(() => (
  dialectGroups.find((group) => group.id === activeGroupId.value) || dialectGroups[0] || FALLBACK_DIALECT_GROUP
))

const activePhonology = computed(() => (
  phonologyDetails.find((item) => item.id === activePhonologyId.value) || phonologyDetails[0] || FALLBACK_PHONOLOGY_DETAIL
))

let revealObserver = null

function markerStyle(group) {
  const left = Number(group?.marker?.left)
  const top = Number(group?.marker?.top)

  return {
    left: `${Number.isFinite(left) ? left : FALLBACK_MARKER_POSITION.left}%`,
    top: `${Number.isFinite(top) ? top : FALLBACK_MARKER_POSITION.top}%`,
  }
}

function selectGroup(id) {
  activeGroupId.value = id
  nextTick(() => {
    const scroller = groupScroller.value
    const target = scroller?.querySelector(`[data-group-id="${id}"]`)
    if (!scroller || !target || scroller.scrollWidth <= scroller.clientWidth) return
    const scrollerRect = scroller.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const left = targetRect.left - scrollerRect.left + scroller.scrollLeft - ((scroller.clientWidth - targetRect.width) / 2)
    scroller.scrollTo({ left, behavior: 'smooth' })
  })
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function updateGroupCarousel() {
  const scroller = groupScroller.value
  if (!scroller) return
  groupCanPrev.value = scroller.scrollLeft > 4
  groupCanNext.value = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4
}

function onGroupCarouselScroll() {
  updateGroupCarousel()
}

function scrollGroupCarousel(direction) {
  const scroller = groupScroller.value
  if (!scroller) return
  const card = scroller.querySelector('.yc-group-card')
  const cardWidth = card?.clientWidth || Math.round(scroller.clientWidth * 0.72)
  const gap = 14
  scroller.scrollBy({
    left: direction === 'next' ? cardWidth + gap : -(cardWidth + gap),
    behavior: 'smooth',
  })
}

function initReveal() {
  if (!pageEl.value || typeof window === 'undefined') return
  const nodes = pageEl.value.querySelectorAll('.yc-reveal')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduced || typeof IntersectionObserver === 'undefined') {
    nodes.forEach((node) => node.classList.add('yc-reveal--visible'))
    return
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('yc-reveal--visible')
      revealObserver.unobserve(entry.target)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })

  nodes.forEach((node) => revealObserver.observe(node))
}

onMounted(async () => {
  await nextTick()
  initReveal()
  updateGroupCarousel()
  window.addEventListener('resize', updateGroupCarousel)
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  window.removeEventListener('resize', updateGroupCarousel)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use '@/styles/global/scrollbars' as scrollbars;

.yangchun-overview {
  @include flex-col;
  --yc-nav-top: calc(6.5dvh + 28px);
  gap: 64px;
  width: min(1180px, 94dvw);
  margin: 0 auto;
  padding: 40px 0 80px;

  section[id] {
    scroll-margin-top: calc(var(--yc-nav-top) + 80px);
  }
}

.yc-reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.yc-reveal--visible {
  opacity: 1;
  transform: translateY(0);
}

.yc-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 28px 40px;
  align-items: center;
  padding: 20px 16px 0;
}

.yc-hero__copy {
  @include flex-col;
  justify-content: center;
  gap: 18px;

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 4.2dvw, 3.5rem);
    line-height: 1.2;
    text-wrap: balance;

    :deep(svg),
    :deep(.bar-icon-emoji) {
      margin-right: 10px;
      font-size: 0.7em;
    }
  }

  p {
    max-width: 660px;
    margin: 0;
    color: var(--text-tertiary);
    font-size: 1.05rem;
    line-height: 1.8;
  }
}

.yc-hero__actions,
.yc-map-panel__header,
.yc-phonology-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.yc-hero__stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-control);
}

.yc-stat {
  @include flex-col;
  gap: 8px;
  padding: 0;

  span,
  small {
    color: var(--text-tertiary);
  }

  strong {
    color: var(--text-primary);
    font-size: 1.45rem;
  }
}

.yc-hero__visual {
  min-width: 0;
}

// Editorial illustration of language contact; it does not depict geographic boundaries.
.yc-contact-art {
  width: 100%;
  overflow: visible;
  fill: var(--color-primary);
  color: var(--color-primary);

  &__cantonese {
    fill: var(--color-primary-light);
    stroke: var(--color-primary-border);
  }

  &__hakka {
    fill: var(--color-secondary-light);
    stroke: var(--color-secondary-border);
  }

  path {
    fill: none;
    stroke: var(--color-primary-border);
    stroke-width: 2;
  }

  text {
    text-anchor: middle;
    dominant-baseline: middle;
  }

  &__title {
    fill: var(--text-deep);
    font-family: var(--font-serif);
    font-size: 38px;
    font-weight: 700;
  }

  &__caption {
    fill: var(--text-tertiary);
    font-size: 14px;
    letter-spacing: 2px;
  }
}

.yc-eyebrow {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.yc-section-nav {
  position: sticky;
  top: var(--yc-nav-top);
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 10px;
  margin-top: -32px;
  --glass-panel-background: var(--surface-glass-floating-strong);
}

.yc-section-heading {
  @include flex-col;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  text-align: center;

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.8rem;
    text-wrap: balance;
  }

  p {
    max-width: 760px;
    color: var(--text-secondary);
    line-height: 1.8;
  }
}

.yc-section-heading--left {
  align-items: flex-start;
  text-align: left;
}

.yc-atlas-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 18px;
}

.yc-map-panel,
.yc-active-panel,
.yc-contact-panel,
.yc-phonology-panel,
.yc-group-detail {
  padding: 22px;
}

.yc-contact-panel {
  padding: 0;
}

.yc-map-panel {
  @include flex-col;
  gap: 18px;
}

.yc-map-panel__header {
  justify-content: space-between;

  h3 {
    margin: 4px 0 0;
  }
}

.yc-map-panel__tag,
.yc-chip,
.yc-group-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.yc-map-placeholder {
  position: relative;
  min-height: 400px;
  overflow: hidden;
}

.yc-map-rivers {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--color-primary-border);
  stroke-width: 7;
  stroke-linecap: round;
}

.yc-map-direction {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.yc-map-caption {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  line-height: 1.6;
}

.yc-map-placeholder__river {
  position: absolute;
  left: 18%;
  top: 82%;
  width: 66%;
  padding: 8px 14px;
  color: var(--text-tertiary);
  font-size: 0.9rem;
  text-align: center;
}

.yc-map-marker {
  position: absolute;
  z-index: 1;
  --glass-button-small-padding: 8px 12px;
  transform: translate(-50%, -50%);
  transition: transform 0.18s ease;

  &:hover,
  &--active {
    transform: translate(-50%, -50%) scale(1.04);
  }

  span {
    white-space: nowrap;
  }
}

.yc-active-panel {
  @include flex-col;
  gap: 14px;

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--text-secondary);
    line-height: 1.8;
  }
}

.yc-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.yc-source-line {
  @include flex-col;
  gap: 4px;
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

.yc-source-grid {
  @include flex-col;
}

.yc-group-carousel {
  position: relative;
}

.yc-group-carousel__arrow {
  display: none;
  min-width: 42px;
  min-height: 42px;
  padding: 0;
  font-size: 1.35rem;
}

.yc-group-scroller {
  @include scrollbars.hidden-scrollbar;
  @include scrollbars.hidden-scrollbar-webkit;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
  overflow-x: auto;
  padding: 6px;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
}

.yc-group-card {
  @include flex-col;
  gap: 12px;
  align-items: flex-start;
  flex: 0 0 min(320px, 76dvw);
  min-width: 0;
  min-height: 190px;
  padding: 22px;
  scroll-snap-align: center;
  text-align: left;

  &[data-active='true'] {
    --glass-card-background: var(--surface-selected);
  }

  small {
    font-size: 0.8rem;
  }

  strong {
    font-size: 1.18rem;
  }

  p,
  small {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  small {
    margin-top: auto;
  }
}

.yc-group-detail {
  @include flex-col;
  gap: 10px;
  margin-top: 18px;

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--text-secondary);
    line-height: 1.8;
  }
}

.yc-contact-panel {
  @include flex-col;
  gap: 20px;
}

.yc-note-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.yc-note-card {
  @include flex-col;
  gap: 10px;
  padding: 18px;

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.75;
  }
}

.yc-phonology-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.35fr) minmax(0, 0.65fr);
  gap: 18px;
}

.yc-phonology-tabs {
  align-content: flex-start;

  .glass-button {
    width: 100%;
    justify-content: flex-start;
  }
}

.yc-phonology-panel {
  @include flex-col;
  gap: 14px;

  h3 {
    margin: 0;
    line-height: 1.6;
  }

  ul {
    @include flex-col;
    gap: 10px;
    margin: 0;
    padding-left: 20px;
    color: var(--text-secondary);
    line-height: 1.8;
  }
}

.yc-source-card {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 6px 20px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-glass-subtle);

  span,
  small {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  small {
    grid-column: 2;
    word-break: break-all;
    white-space: normal;
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .yangchun-overview {
    --yc-nav-top: calc(max(7dvh, 40px) + max(8px, env(safe-area-inset-top)) + 16px);
    gap: 40px;
    width: min(94dvw, 760px);
    padding-top: 14px;
  }

  .yc-hero,
  .yc-atlas-layout,
  .yc-phonology-layout,
  .yc-note-grid {
    grid-template-columns: 1fr;
  }

  .yc-hero {
    gap: 20px;
    padding: 12px 4px 0;

    h1 {
      font-size: clamp(1.9rem, 7dvw, 2.6rem);
    }
  }

  .yc-hero__visual {
    width: min(100%, 360px);
    margin: 0 auto;
  }

  .yc-hero__stats {
    gap: 12px;

    strong {
      font-size: 1.05rem;
    }

    small {
      font-size: 0.75rem;
      line-height: 1.6;
    }
  }

  .yc-map-placeholder {
    min-height: 360px;
  }

  .yc-map-marker {
    --glass-button-small-padding: 8px;
    --glass-button-small-font-size: 12px;
    max-width: 46%;

    span {
      white-space: normal;
    }
  }

  .yc-map-panel,
  .yc-active-panel,
  .yc-phonology-panel,
  .yc-group-detail {
    padding: 18px;
  }

  .yc-group-carousel {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 6px;
    align-items: center;
  }

  .yc-group-carousel__arrow {
    display: inline-flex;
    min-width: 32px;
    min-height: 40px;
  }

  .yc-group-scroller {
    display: flex;
  }

  .yc-group-card {
    flex-basis: 88%;
  }

  .yc-source-card {
    grid-template-columns: 1fr;

    small {
      grid-column: 1;
    }
  }

  .yc-section-nav {
    margin-top: -12px;
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 4px;
    overflow-x: auto;

    .glass-button {
      flex-shrink: 0;
      --glass-button-small-padding: 10px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .yc-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .yc-group-scroller {
    scroll-behavior: auto;
  }
}
</style>
