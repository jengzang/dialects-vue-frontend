<template>
  <main
    ref="pageEl"
    class="yangchun-overview"
  >
    <section
      id="yc-overview-top"
      class="yc-hero glass-shell yc-reveal"
    >
      <div class="yc-hero__copy">
        <span class="yc-eyebrow">Yangchun Dialect Atlas</span>
        <h1><BarIcon icon="🌾" />阳春方言概览</h1>
        <p>
          从白话到涯话，从城镇中心到山边方言岛，阳春是两阳地区观察粤客接触、迁徙与方言分布的关键区域。
        </p>
        <div class="yc-hero__actions">
          <button
            class="main-glass-button"
            data-variant="primary"
            type="button"
            @click="scrollToSection('yc-map')"
          >
            看分布格局
          </button>
          <button
            class="main-glass-button"
            type="button"
            @click="scrollToSection('yc-phonology')"
          >
            看音系细节
          </button>
        </div>
      </div>

      <div class="yc-hero__stats">
        <article
          v-for="stat in overviewStats"
          :key="stat.label"
          class="glass-subpanel yc-stat"
        >
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
          <small>{{ stat.detail }}</small>
        </article>
      </div>
    </section>

    <nav
      class="yc-section-nav glass-subpanel yc-reveal"
      aria-label="阳春概览页内导航"
    >
      <button
        v-for="section in pageSections"
        :key="section.id"
        class="main-glass-button"
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
        <article class="yc-map-panel glass-panel">
          <div class="yc-map-panel__header">
            <div>
              <span class="yc-eyebrow">Distribution Map</span>
              <h3>阳春方言分布图</h3>
            </div>
            <span class="yc-map-panel__tag glass-subpanel">资料整理中</span>
          </div>

          <div
            class="yc-map-placeholder glass-subpanel"
            aria-label="阳春方言分布草图"
          >
            <button
              v-for="group in dialectGroups"
              :key="group.id"
              class="yc-map-marker main-glass-button"
              :class="{ 'yc-map-marker--active': group.id === activeGroupId }"
              data-size="small"
              :data-active="group.id === activeGroupId"
              :style="markerStyle(group)"
              type="button"
              @click="selectGroup(group.id)"
            >
              <span>{{ group.name }}</span>
            </button>
            <div class="yc-map-placeholder__river glass-subpanel">
              漠阳江 / 潭水河流域
            </div>
          </div>
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

      <div class="main-card-grid yc-group-grid">
        <button
          v-for="group in dialectGroups"
          :key="group.id"
          class="glass-card yc-group-card"
          data-interactive="true"
          :aria-pressed="group.id === activeGroupId"
          type="button"
          @click="selectGroup(group.id)"
        >
          <span class="yc-group-card__badge glass-subpanel">{{ group.badge }}</span>
          <strong>{{ group.name }}</strong>
          <p>{{ group.short }}</p>
          <small>{{ group.area }}</small>
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
      <article class="yc-contact-panel glass-panel">
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
            class="glass-subpanel yc-note-card"
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
            class="main-glass-button"
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

      <div class="main-card-grid yc-source-grid">
        <article
          v-for="article in sourceArticles"
          :key="article.path"
          class="glass-card yc-source-card"
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
import {
  dialectGroups,
  migrationNotes,
  overviewStats,
  phonologyDetails,
  sourceArticles,
} from './yangchunOverviewData.js'

const pageEl = ref(null)
const activeGroupId = ref(dialectGroups[0].id)
const activePhonologyId = ref(phonologyDetails[0].id)

const pageSections = [
  { id: 'yc-map', label: '分布' },
  { id: 'yc-groups', label: '板块' },
  { id: 'yc-contact', label: '交汇' },
  { id: 'yc-phonology', label: '音系' },
  { id: 'yc-sources', label: '来源' },
]

const selectedGroup = computed(() => (
  dialectGroups.find((group) => group.id === activeGroupId.value) || dialectGroups[0]
))

const activePhonology = computed(() => (
  phonologyDetails.find((item) => item.id === activePhonologyId.value) || phonologyDetails[0]
))

let revealObserver = null

function markerStyle(group) {
  return {
    left: `${group.marker.left}%`,
    top: `${group.marker.top}%`,
  }
}

function selectGroup(id) {
  activeGroupId.value = id
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.yangchun-overview {
  @include flex-col;
  gap: 28px;
  width: min(1180px, 94dvw);
  margin: 0 auto;
  padding: 24px 0 64px;
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
  grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
  gap: 22px;
  padding: 32px;
  min-height: 42dvh;
}

.yc-hero__copy {
  @include flex-col;
  justify-content: center;
  gap: 18px;

  h1 {
    margin: 0;
    font-size: 4rem;
    line-height: 1.05;
  }

  p {
    max-width: 660px;
    margin: 0;
    color: var(--text-secondary);
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
  @include flex-col;
  gap: 12px;
  justify-content: center;
}

.yc-stat {
  @include flex-col;
  gap: 8px;
  padding: 18px;

  span,
  small {
    color: var(--text-tertiary);
  }

  strong {
    color: var(--text-primary);
    font-size: 1.45rem;
  }
}

.yc-eyebrow {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.yc-section-nav {
  position: sticky;
  top: 14px;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 10px;
}

.yc-section-heading {
  @include flex-col;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  text-align: center;

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.8rem;
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
  min-height: 430px;
  overflow: hidden;
}

.yc-map-placeholder__river {
  position: absolute;
  left: 18%;
  top: 48%;
  width: 66%;
  padding: 8px 14px;
  color: var(--text-tertiary);
  font-size: 0.9rem;
  text-align: center;
  transform: rotate(-18deg);
}

.yc-map-marker {
  position: absolute;
  z-index: 1;
  --main-glass-button-padding: 8px 12px;
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

.yc-group-grid,
.yc-source-grid {
  --main-card-min-width: 260px;
}

.yc-group-card {
  min-height: 190px;
  text-align: left;

  strong {
    font-size: 1.18rem;
  }

  p,
  small {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.7;
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

  .main-glass-button {
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
  cursor: default;

  span,
  small {
    color: var(--text-tertiary);
  }

  small {
    word-break: break-all;
    white-space: normal;
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .yangchun-overview {
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
    padding: 22px;

    h1 {
      font-size: 2.6rem;
    }
  }

  .yc-map-placeholder {
    min-height: 380px;
  }

  .yc-section-nav {
    top: 8px;
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
