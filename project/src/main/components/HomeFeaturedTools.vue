<template>
  <section class="featured-section glass-panel">
    <div class="featured-heading">
      <div>
        <h2 class="section-title">
          {{ t('home.featured.sectionTitle') }}
        </h2>
        <p class="section-subtitle">
          {{ t('home.featured.sectionSubtitle') }}
        </p>
      </div>
      <a
        class="featured-view-all"
        @click="emitViewAll"
      >
        {{ t('home.featured.viewAll') }}
      </a>
    </div>

    <div class="featured-carousel">
      <button
        class="featured-arrow featured-arrow--prev"
        :disabled="!featuredCanPrev"
        aria-label="Previous"
        @click="scrollFeatured('prev')"
      >
        <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      <div
        ref="featuredScroller"
        class="featured-scroller"
      >
        <div
          v-for="(item, i) in featuredItems"
          :key="item.key"
          :ref="el => setFeaturedRef(el, i)"
          class="featured-item"
        >
          <RouterLink
            class="app-card"
            :to="localeTo(item.route)"
          >
            <span class="app-card__mist" />
            <span class="app-card__vignette" />

            <div class="app-card__logo-zone">
              <div class="app-card__logo-ring">
                <div class="app-card__logo-inner">
                  <span class="app-card__logo"><InlineIcon :icon="item.icon" /></span>
                </div>
              </div>
            </div>

            <div class="app-card__content">
              <h3>
                {{ item.name }}
              </h3>
              <p>
                {{ item.desc }}
              </p>
              <div class="app-card__tags">
                <span>
                  {{ item.tag }}
                </span>
              </div>
              <span class="app-card__cta">
                {{ t('home.featured.discover') }}
              </span>
            </div>
          </RouterLink>
        </div>
      </div>

      <button
        class="featured-arrow featured-arrow--next"
        :disabled="!featuredCanNext"
        aria-label="Next"
        @click="scrollFeatured('next')"
      >
        <svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const emit = defineEmits(['view-all'])
const { t } = useI18n()
const route = useRoute()

const featuredScroller = ref(null)
const featuredRefs = ref([])
const featuredCanPrev = ref(false)
const featuredCanNext = ref(true)

const featuredKeys = [
  { key: 'zhonggu', icon: '🔍', route: '/menu/query/zhonggu' },
  { key: 'compare', icon: '🔀', route: '/menu/compare/char' },
  { key: 'gis', icon: '🗺️', route: '/explore/gis' },
  { key: 'phonology', icon: '🧬', route: '/menu/pho/matrix' },
  { key: 'tableProcess', icon: '🧰', route: '/explore/tools/check' },
  { key: 'praat', icon: '🎙️', route: '/explore/tools/praat' }
]

const featuredItems = computed(() =>
  featuredKeys.map(({ key, icon, route }) => ({
    key,
    icon,
    route,
    name: t(`home.featured.items.${key}.name`),
    desc: t(`home.featured.items.${key}.desc`),
    tag: t(`home.featured.items.${key}.tag`)
  }))
)

let featuredRaf = 0

const setFeaturedRef = (el, i) => {
  if (el) featuredRefs.value[i] = el
}

const updateFeatured = () => {
  const el = featuredScroller.value
  if (!el) return
  const rr = el.getBoundingClientRect()
  const center = rr.left + rr.width / 2
  const rects = featuredRefs.value.map(x => x?.getBoundingClientRect() || null)
  featuredRefs.value.forEach((node, i) => {
    const r = rects[i]
    if (!node || !r) return
    const d = Math.abs((r.left + r.width / 2 - center) / r.width)
    const scale = Math.max(0.82, 1 - 0.18 * Math.min(2, d))
    node.style.transform = `scale(${scale})`
  })
}

const updateFeaturedArrows = () => {
  const el = featuredScroller.value
  if (!el) return
  featuredCanPrev.value = el.scrollLeft > 4
  featuredCanNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

const onFeaturedScroll = () => {
  cancelAnimationFrame(featuredRaf)
  featuredRaf = requestAnimationFrame(updateFeatured)
  updateFeaturedArrows()
}

const scrollFeatured = (dir) => {
  const el = featuredScroller.value
  if (!el) return
  const width = featuredRefs.value[0]?.clientWidth || el.clientWidth / 3
  el.scrollBy({ left: dir === 'next' ? width + 24 : -(width + 24), behavior: 'smooth' })
}

const centerFeatured = () => {
  const el = featuredScroller.value
  const target = featuredRefs.value[1] || featuredRefs.value[0]
  if (!el || !target) return
  const cr = el.getBoundingClientRect()
  const tr = target.getBoundingClientRect()
  el.scrollLeft = tr.left - cr.left + tr.width / 2 - el.clientWidth / 2
}

function emitViewAll() {
  emit('view-all')
}

function localeTo(path) {
  return buildLocalePath(resolveRouteLocale(route), path)
}

onMounted(() => {
  centerFeatured()
  updateFeatured()
  updateFeaturedArrows()
  featuredScroller.value?.addEventListener('scroll', onFeaturedScroll, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(featuredRaf)
  featuredScroller.value?.removeEventListener('scroll', onFeaturedScroll)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$text-primary: var(--text-primary);

@mixin section-container($max-width: 1300px) {
  position: relative;
  z-index: 1;
  max-width: $max-width;
  margin: 0 auto;
}

.featured-section {
  @include section-container;

  width: 100%;
  margin-top: auto;
  padding:
    0
    clamp(1.5rem, 4dvw, 2.5rem)
    clamp(1rem, 2dvw, 1.5rem);
}

.featured-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;

  .section-title {
    margin-bottom: 0.25rem;
    text-align: left;
  }

  .section-subtitle {
    margin-bottom: 0;
    text-align: left;
  }
}

.section {
  &-title {
    margin-bottom: 0.5rem;
    text-align: center;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: $primary;
  }

  &-subtitle {
    margin-bottom: 2rem;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-dark-lighter);
  }
}

.featured-view-all {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding-inline: 1.25rem;
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-full);
  background: var(--glass-70);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  color: $primary;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s ease;

  &:hover {
    background: var(--glass-90);
    transform: translateY(-2px);
  }
}

.featured-carousel {
  position: relative;
}

.featured-arrow {
  @include flex-center;

  position: absolute;
  top: 50%;
  z-index: 200;
  display: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 50%;
  background: var(--glass-80);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  color: $primary;
  cursor: pointer;
  transform: translateY(-50%);
  transition: background 0.25s ease, box-shadow 0.25s ease;

  @media (min-aspect-ratio: 1/1) {
    display: flex;
  }

  &:hover:not(:disabled) {
    background: var(--glass-90);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.15);
  }

  &:disabled {
    opacity: 0;
    pointer-events: none;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &--prev {
    left: 8px;
  }

  &--next {
    right: 8px;
  }
}

.featured-scroller {
  display: flex;
  align-items: stretch;
  gap: 32px;
  overflow-x: auto;
  padding: 24px max(1.5rem, calc(50% - 170px));
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.featured-item {
  width: clamp(260px, 22vw, 340px);
  flex: 0 0 auto;
  transform-origin: center;
  will-change: transform;
  transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
}

.app-card {
  position: relative;
  min-height: 360px;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 34px;
  text-align: center;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  background: linear-gradient(
    180deg,
    rgba(var(--color-primary-rgb), 0.14) 0%,
    rgba(var(--color-primary-hover-rgb), 0.08) 100%
  );
  box-shadow:
    0 26px 46px rgba(var(--color-primary-rgb), 0.12),
    inset 1px 1px 0 rgba(255, 255, 255, 0.32);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: transform 220ms ease-out;

  @include flex-col;

  &:hover {
    transform: translateY(-4px);

    .app-card__logo-ring {
      transform: scale(1.1);
    }

    .app-card__logo-inner {
      transform: scale(1.18);
    }
  }

  &__mist,
  &__vignette {
    position: absolute;
    z-index: 0;
    pointer-events: none;
  }

  &__mist {
    right: 0;
    bottom: 0;
    left: 0;
    height: 118px;
    background:
      radial-gradient(circle at 15% 65%, rgba(var(--color-primary-rgb), 0.22), transparent 28%),
      radial-gradient(circle at 50% 60%, rgba(var(--color-primary-rgb), 0.28), transparent 30%),
      radial-gradient(circle at 85% 70%, rgba(var(--color-primary-rgb), 0.16), transparent 26%);
    opacity: 0.5;
    filter: blur(10px);
  }

  &__vignette {
    inset: 0;
    background: radial-gradient(
      ellipse 110% 100% at 50% 50%,
      rgba(var(--color-primary-rgb), 0.03),
      rgba(var(--color-primary-hover-rgb), 0.1)
    );
  }

  &__logo-zone {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: center;
    padding-top: 28px;
  }

  &__logo-ring {
    display: flex;
    width: 128px;
    height: 128px;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(var(--color-primary-rgb), 0.26);
    border-radius: 50%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.5),
      rgba(var(--color-primary-rgb), 0.08)
    );
    box-shadow:
      0 16px 28px rgba(0, 0, 0, 0.08),
      inset 1px 1px 0 rgba(255, 255, 255, 0.5);
    transition: 0.3s;
  }

  &__logo-inner {
    display: flex;
    width: 80px;
    height: 80px;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
  }

  &__logo {
    font-size: 3rem;
    line-height: 1;
  }

  &__content {
    position: relative;
    z-index: 10;
    flex: 1;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 24px;

    @include flex-col;

    h3 {
      margin: 8px 0 4px;
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.25;
      color: $text-primary;
    }

    > p {
      display: -webkit-box;
      min-height: 4.8em;
      max-width: 27ch;
      margin: 0;
      overflow: hidden;
      color: var(--text-dark-lighter);
      line-height: 1.6;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  }

  &__tags {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 6px;

    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      padding-inline: 12px;
      border: 1px solid rgba(var(--color-primary-rgb), 0.18);
      border-radius: 999px;
      background: rgba(var(--color-primary-rgb), 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      color: $primary;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
    }
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    margin-top: auto;
    padding-inline: 20px;
    border: 1px solid rgba(var(--color-primary-rgb), 0.26);
    border-radius: 999px;
    background: rgba(var(--color-primary-rgb), 0.14);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 14px 24px rgba(var(--color-primary-rgb), 0.1);
    color: $primary;
    font-weight: 700;
    white-space: nowrap;
  }
}
</style>
