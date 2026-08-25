<template>
  <div class="home-page" ref="homePageRef">
    <!-- Animated Background -->
    <div class="bg-gradient"></div>

    <!-- Hero Section -->
    <section class="hero-section">
      <GlobeBackground :points="globePoints" />

      <div class="hero-content">
        <img src="/brand/title.webp" :alt="$t('home.hero.logoAlt')" class="hero-logo title-logo" />
        <div class="hero-title-row">
          <h1 class="hero-title">{{ $t('home.hero.title') }}</h1>
        </div>
        <p class="hero-subtitle">{{ $t('home.hero.subtitle') }}</p>
        <div class="hero-bottom-row">
          <div class="hero-actions">
            <RouterLink class="btn-primary" :to="localeTo('/menu/query/zhonggu')">
              <span class="btn-icon"><InlineIcon icon="🚀" /></span>
              <span class="btn-text">{{ $t('home.hero.startExploring') }}</span>
            </RouterLink>
            <button class="btn-secondary" @click="scrollToFeatures">
              <span class="btn-icon"><InlineIcon icon="📖" /></span>
              <span class="btn-text">{{ $t('home.hero.featuresIntro') }}</span>
            </button>
          </div>
          <img :src="heroDecorationSrc" :alt="$t('home.hero.decorationAlt')" class="hero-decoration" />
        </div>
      </div>
      
      <!-- Featured Tools Section -->
      <section class="featured-section glass-panel">
        <div class="featured-heading">
          <div>
            <h2 class="section-title">{{ $t('home.featured.sectionTitle') }}</h2>
            <p class="section-subtitle">{{ $t('home.featured.sectionSubtitle') }}</p>
          </div>
          <a class="featured-view-all" @click="scrollToFeatures">{{ $t('home.featured.viewAll') }}</a>
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

          <div ref="featuredScroller" class="featured-scroller">
            <div
              v-for="(item, i) in featuredItems"
              :key="item.key"
              :ref="el => setFeaturedRef(el, i)"
              class="featured-item"
            >
              <RouterLink class="app-card" :to="localeTo(item.route)">
                <span class="app-card__mist"></span>
                <span class="app-card__vignette"></span>

                <div class="app-card__logo-zone">
                  <div class="app-card__logo-ring">
                    <div class="app-card__logo-inner">
                      <span class="app-card__logo"><InlineIcon :icon="item.icon" /></span>
                    </div>
                  </div>
                </div>

                <div class="app-card__content">
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.desc }}</p>
                  <div class="app-card__tags">
                    <span>{{ item.tag }}</span>
                  </div>
                  <span class="app-card__cta">{{ $t('home.featured.discover') }}</span>
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

    </section>

    <!-- Platform Section -->
    <section class="platform-section reveal">
      <article class="platform-card">
        <span class="platform-eyebrow">{{ $t('home.platform.eyebrow') }}</span>
        <h2 class="platform-title">{{ $t('home.platform.title') }}</h2>
        <p class="platform-desc">{{ $t('home.platform.desc') }}</p>
        <div class="platform-stats">
          <div class="platform-stat">
            <span>{{ $t('home.platform.stats.visits') }}</span>
            <strong>{{ totalVisits }}</strong>
          </div>
          <div class="platform-stat">
            <span>{{ $t('home.platform.stats.locations') }}</span>
            <strong>{{ sourceLocationCount }}</strong>
          </div>
          <div class="platform-stat">
            <span>{{ $t('home.platform.stats.records') }}</span>
            <strong>{{ sourceDataCount }}</strong>
          </div>
        </div>
      </article>
    </section>

    <FeaturesSection />

    <!-- Showcase Section (lazy mounted) -->
    <section class="showcase-section" ref="showcaseSectionRef">
      <HeroShowcase v-if="showShowcase" />
    </section>

    <!-- Roadmap Section -->
    <!-- <section class="roadmap-section">
      <h2 class="section-title">{{ $t('home.roadmap.sectionTitle') }}</h2>
      <p class="section-subtitle">{{ $t('home.roadmap.sectionSubtitle') }}</p>
      <div class="roadmap-list">
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon"><InlineIcon icon="📜" /></div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.charsGeneration.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.charsGeneration.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon"><InlineIcon icon="🎙️" /></div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.phoneticsToolbox.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.phoneticsToolbox.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon"><InlineIcon icon="🧬" /></div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.dialectClustering.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.dialectClustering.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon"><InlineIcon icon="🌳" /></div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.evolutionTree.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.evolutionTree.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon"><InlineIcon icon="🔊" /></div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.ipaTTS.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.ipaTTS.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon"><InlineIcon icon="🤖" /></div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.dialectBot.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.dialectBot.desc') }}</p>
        </div>
      </div>
    </section> -->

    <!-- Login Benefits Section -->
    <section class="login-section reveal">
      <div class="login-card">
        <div class="login-icon"><InlineIcon icon="🔐" /></div>
        <div class="login-content">
          <h3 class="login-title">{{ $t('home.login.title') }}</h3>
          <p class="login-desc">{{ $t('home.login.desc') }}</p>
          <div class="login-benefits">
            <div class="benefit-item">
              <span class="benefit-icon"><InlineIcon icon="🗺️" /></span>
              <span class="benefit-text">{{ $t('home.login.benefits.customMap') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon"><InlineIcon icon="🗂️" /></span>
              <span class="benefit-text">{{ $t('home.login.benefits.customRegion') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon"><InlineIcon icon="🔍" /></span>
              <span class="benefit-text">{{ $t('home.login.benefits.moreLocations') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon"><InlineIcon icon="🎙️" /></span>
              <span class="benefit-text">{{ $t('home.login.benefits.praatTools') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon"><InlineIcon icon="🧰" /></span>
              <span class="benefit-text">{{ $t('home.login.benefits.tableTools') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon"><InlineIcon icon="📊" /></span>
              <span class="benefit-text">{{ $t('home.login.benefits.queryHistory') }}</span>
            </div>
          </div>
        </div>
        <div class="login-actions">
          <RouterLink class="login-btn primary" :to="localeTo('/auth')">
            {{ $t('home.login.loginNow') }}
          </RouterLink>
          <button class="login-btn secondary" @click="showBenefitsPopup = true">
            {{ $t('home.login.viewDetails') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Projects Section -->
    <section class="projects-section reveal">
      <h2 class="section-title">{{ $t('home.projects.sectionTitle') }}</h2>
      <p class="section-subtitle">{{ $t('home.projects.sectionSubtitle') }}</p>
      <div class="projects-grid">
        <a
          v-for="project in localizedProjects"
          :key="project.name"
          :href="project.url"
          target="_blank"
          rel="noopener noreferrer"
          class="project-card"
        >
          <div class="project-icon">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </div>
          <div class="project-content">
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="project-desc">{{ project.description }}</p>
          </div>
          <div class="project-arrow">→</div>
        </a>
      </div>

      <div class="contact-card">
        <div class="contact-icon"><InlineIcon icon="💬" /></div>
        <div class="contact-content">
          <h3 class="contact-title">{{ $t('home.contact.title') }}</h3>
          <p class="contact-desc">{{ $t('home.contact.desc') }}</p>
        </div>
        <button class="contact-btn" @click="openZhihu">
          {{ $t('home.contact.button') }}
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
          <RouterLink :to="localeTo('/menu/about/intro')" class="footer-link">{{ $t('home.footer.links.about') }}</RouterLink>
          <span class="footer-divider">·</span>
          <RouterLink :to="localeTo('/menu/source')" class="footer-link">{{ $t('home.footer.links.source') }}</RouterLink>
          <span class="footer-divider">·</span>
          <RouterLink :to="localeTo('/menu/privacy')" class="footer-link">{{ $t('home.footer.links.privacy') }}</RouterLink>
          <span class="footer-divider">·</span>
          <RouterLink :to="localeTo('/menu/settings')" class="footer-link">{{ $t('home.footer.links.setting') }}</RouterLink>
          <span class="footer-divider">·</span>
          <a href="https://dialects.yzup.top/detail/" target="_blank" class="footer-link">{{ $t('home.footer.links.oldSite') }}</a>
          <span class="footer-divider">·</span>
          <a @click="showSupport = true" class="footer-link">{{ $t('home.footer.links.support') }}</a>
        </div>

        <!-- Visit Stats -->
        <div class="footer-stats">
          <span class="stat-text">{{ $t('home.footer.stats', { today: todayVisits, total: totalVisits }) }}</span>
        </div>

        <div class="footer-stats footer-stats-secondary">
          <span class="stat-text">{{ $t('source.totalRecords', { locationCount: sourceLocationCount, dataCount: sourceDataCount }) }}</span>
          <span class="stat-text stat-text-muted">{{ $t('source.databaseVersion', { version: sourceDbVersion }) }}</span>
        </div>

        <div class="footer-info">
          <p class="footer-text">{{ $t('home.footer.copyright') }}</p>
          <p class="footer-text">{{ $t('home.footer.versionInfo', { version: CURRENT_VERSION, date: LAST_UPDATE_DATE }) }}</p>
          <p class="footer-text">{{ $t('home.footer.icp') }}</p>
        </div>
      </div>
    </footer>

    <!-- User Benefits Popup -->
    <UserBenefitsPopup
      :visible="showBenefitsPopup"
      @close="showBenefitsPopup = false"
      @register="navigateTo('/auth')"
    />

    <!-- Update Notice Modal -->
    <UpdateNoticeModal
      v-model:visible="showUpdateNotice"
      :auto-show="true"
      :mode="updateNoticeMode"
      :version="homeUpdateNotice.version"
      :last-update-date="homeUpdateNotice.lastUpdateDate"
      :title="homeUpdateNotice.title"
      :items="homeUpdateNotice.items"
      :view-detail-text="$t('home.viewDetails')"
      @close="showUpdateNotice = false"
      @show-detail="showUpdateNotice = true"
    />

    <!-- Support Modal -->
    <SupportPopup
      :visible="showSupport"
      @close="showSupport = false"
    />
    <!--      <div class="home-support-shell" @click.stop>
            <button class="close-btn close-btn-lg close-btn-corner" @click="showSupport = false"><InlineIcon icon="✕" /></button>
            <h3 class="home-support-title">{{ $t('home.supportModal.title') }}</h3>
            <p class="home-support-subtitle">{{ $t('home.supportModal.subtitle') }}</p>
            <div class="donate-qr-grid">
              <div class="donate-qr-box">
                <img src="/brand/weixin.webp" :alt="$t('home.supportModal.weixinAlt')" />
                <p class="donate-qr-label">{{ $t('home.supportModal.weixinLabel') }}</p>
              </div>
              <div class="donate-qr-box">
                <img src="/brand/zfb.webp" :alt="$t('home.supportModal.alipayAlt')" />
                <p class="donate-qr-label">{{ $t('home.supportModal.alipayLabel') }}</p>
              </div>
            </div>
      </div>
    -->
  </div>

</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import FeaturesSection from '@/main/components/FeaturesSection.vue'
import { computed, ref, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { currentColorTheme, COLOR_THEME_GREEN } from '@/composables/core/uiPreferences.js'
import { useVisitStats } from '@/composables/data/useVisitStats.js'
import { useClickParticles } from '@/main/composables/useClickParticles.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'

// ✅ 懒加载：先弹窗 → 地球 → Hero 展示
const UpdateNoticeModal = defineAsyncComponent(() =>
  import('@/main/components/user/popups/UpdateNoticeModal.vue')
)
const GlobeBackground = defineAsyncComponent(() =>
  import('@/main/components/globe/GlobeBackground.vue')
)
const HeroShowcase = defineAsyncComponent(() =>
  import('@/main/components/HeroShowcase.vue')
)
const UserBenefitsPopup = defineAsyncComponent(() =>
  import('@/main/components/user/popups/UserBenefitsPopup.vue')
)
const SupportPopup = defineAsyncComponent(() =>
  import('@/main/components/user/popups/SupportPopup.vue')
)

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const {
  todayVisits,
  totalVisits,
  ensureVisitStats
} = useVisitStats()
const homePageRef = ref(null)
const globePoints = ref([])
const showShowcase = ref(false)
const showcaseSectionRef = ref(null)
const featuredScroller = ref(null)
const featuredRefs = ref([])
const featuredCanPrev = ref(false)
const featuredCanNext = ref(true)
const showSupport = ref(false)
const showBenefitsPopup = ref(false)
const showUpdateNotice = ref(false)
const sourceDbVersion = getHomeUpdateNotice(t).dbVersion
const cachedSourceStats = getCachedSourceStats()
const sourceLocationCount = ref(cachedSourceStats.locationCount)
const sourceDataCount = ref(cachedSourceStats.dataCount)

// 当前版本号和更新时间
const homeUpdateNotice = computed(() => getHomeUpdateNotice((key, values) => t(key, values, { locale: locale.value })))
const updateNoticeMode = computed(() => localStorage.getItem('update-notice-mode') || 'showinfo')
const CURRENT_VERSION = computed(() => homeUpdateNotice.value.version)
const LAST_UPDATE_DATE = computed(() => homeUpdateNotice.value.lastUpdateDate)

const heroDecorationSrc = computed(() =>
  currentColorTheme.value === COLOR_THEME_GREEN
    ? '/brand/GreenCircle.webp'
    : '/brand/BlueCircle.webp'
)

const projects = [
  {
    name: 'dialects-vue-frontend',
    url: 'https://github.com/jengzang/dialects-vue-frontend',
    description: t('home.intro.likeAuthor.frontendRepo', undefined, { locale: locale.value })
  },
  {
    name: 'dialects-backend',
    url: 'https://github.com/jengzang/dialects-backend',
    description: t('home.intro.likeAuthor.backendRepo', undefined, { locale: locale.value })
  },
  {
    name: 'dialects-build',
    url: 'https://github.com/jengzang/dialects-build',
    description: t('home.intro.likeAuthor.buildRepo', undefined, { locale: locale.value })
  },
  {
    name: 'villages-ML',
    url: 'https://github.com/jengzang/villages-ML',
    description: t('home.intro.likeAuthor.villagesMLRepo', undefined, { locale: locale.value })
  }
]

const localizedProjects = computed(() => [
  {
    ...projects[0],
    description: t('home.intro.likeAuthor.frontendRepo', undefined, { locale: locale.value })
  },
  {
    ...projects[1],
    description: t('home.intro.likeAuthor.backendRepo', undefined, { locale: locale.value })
  },
  {
    ...projects[2],
    description: t('home.intro.likeAuthor.buildRepo', undefined, { locale: locale.value })
  },
  {
    ...projects[3],
    description: t('home.intro.likeAuthor.villagesMLRepo', undefined, { locale: locale.value })
  }
])

function navigateTo(path) {
  const [pathname, queryString = ''] = path.split('?')
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), pathname),
    query: queryString ? Object.fromEntries(new URLSearchParams(queryString).entries()) : undefined
  })
}

function localeTo(path) {
  return buildLocalePath(resolveRouteLocale(route), path)
}

// 特色工具 carousel 数据（应用/工具入口）
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

// featured carousel
let featuredRaf = 0
const setFeaturedRef = (el, i) => { if (el) featuredRefs.value[i] = el }

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

// reveal 淡入
let revealObserver = null
const initReveal = () => {
  const root = homePageRef.value
  if (!root) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const nodes = root.querySelectorAll('.reveal')
  if (reduced) {
    nodes.forEach(n => n.classList.add('visible'))
    return
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        revealObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
  nodes.forEach(n => revealObserver.observe(n))
}

// HeroShowcase 延迟挂载
let showcaseObserver = null
const initShowcaseLazy = () => {
  const target = showcaseSectionRef.value
  if (!target) return
  showcaseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        showShowcase.value = true
        showcaseObserver.disconnect()
      }
    })
  }, { rootMargin: '400px 0px' })
  showcaseObserver.observe(target)
}

function scrollToFeatures() {
  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })
}

function openZhihu() {
  window.open('https://www.zhihu.com/people/da-shu-18-11', '_blank')
}

// Fetch visit statistics
async function fetchVisitStats() {
  try {
    await ensureVisitStats()
  } catch (error) {
    console.error('獲取訪問統計失敗:', error)
  }
}

async function fetchSourceStats() {
  try {
    const stats = await getSourceStats()
    sourceLocationCount.value = stats.locationCount
    sourceDataCount.value = stats.dataCount
  } catch (error) {
    console.error('獲取字表統計失敗:', error)
  }
}

async function fetchGlobePoints() {
  try {
    const res = await fetch('/data/dots.json')
    const json = await res.json()
    const lonIdx = json.fields.indexOf('lon')
    const latIdx = json.fields.indexOf('lat')
    const nameIdx = json.fields.indexOf('語言')
    globePoints.value = json.data.map(row => ({
      lng: row[lonIdx],
      lat: row[latIdx],
      name: row[nameIdx],
    }))
  } catch (error) {
    console.error('获取地球散点数据失败:', error)
  }
}

useClickParticles()

onMounted(() => {
  fetchGlobePoints()
  setTimeout(() => {
    fetchVisitStats()
    fetchSourceStats()
  }, 1000)
  initReveal()
  initShowcaseLazy()
  centerFeatured()
  updateFeatured()
  updateFeaturedArrows()
  featuredScroller.value?.addEventListener('scroll', onFeaturedScroll, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(featuredRaf)
  revealObserver?.disconnect()
  showcaseObserver?.disconnect()
  featuredScroller.value?.removeEventListener('scroll', onFeaturedScroll)
})
</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$primary-deep: var(--color-primary-hover);
$success: var(--color-success);
$success-dark: var(--color-success);
$text-primary: var(--text-primary);

$ease-apple: cubic-bezier(0.32, 0.72, 0, 1);@mixin primary-gradient {
  background: linear-gradient(
    135deg,
    $primary 0%,
    $primary-dark 100%
  );
}

@mixin section-container($max-width: 1300px) {
  position: relative;
  z-index: 1;
  max-width: $max-width;
  margin: 0 auto;
}

/* Base */
.home-page {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  overflow-x: hidden;
  background: linear-gradient(135deg, var(--bg-body) 0%, var(--bg-light-gray) 100%);
}

.bg-gradient {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 20% 30%,
      rgba(var(--color-primary-rgb), 0.12) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(var(--color-primary-hover-rgb), 0.08) 0%,
      transparent 50%
    );
}

/* Hero */
.hero {
  &-section {
    position: relative;
    z-index: 1;
    min-height: 100dvh;
    overflow: hidden;
    border-radius: var(--radius-2xl);

    @include flex-col;
    align-items: flex-start;
    justify-content: center;
    gap: 1rem;
    padding: 2rem 1.5rem;
  }

  &-content {
    padding: 2rem;
    position: relative;
    z-index: 1;
    max-width: 520px;
    margin-right: auto;
    margin-left: 1rem;
    margin-bottom: 5rem;
    text-align: left;
    animation: heroFadeIn 1s $ease-apple;
    backdrop-filter: blur(8px) saturate(180%);
    border-radius: var(--radius-lg);
    // background: var(--bg-blue-hover);
    border: 1px solid var(--glass-40);
    background: color-mix(in srgb, var(--bg-body) 50%, transparent);
  }

  &-logo {
    display: block;
    width: clamp(220px, 40vw, 380px);
    height: auto;
    margin: 1rem auto 0.6rem;
    filter: drop-shadow(0 4px 12px rgba(var(--color-primary-rgb), 0.15));
  }

  &-title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  &-title {
    margin-bottom: 0;
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: 600;
    letter-spacing: 0.05em;
    color: rgba(var(--color-primary-rgb), 0.85);
  }

  &-subtitle {
    margin-bottom: 2rem;
    font-size: clamp(0.95rem, 2vw, 1.25rem);
    line-height: 1.5;
    font-weight: 500;
    color: var(--text-dark-lighter);
  }

  &-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    // margin-bottom: 2rem;
  }

  &-bottom-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    // margin-bottom: 5rem;
  }

  &-decoration {
    width: 72px;
    height: 72px;
    opacity: 0.85;
    animation: float 6s ease-in-out infinite;
  }
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.05rem 2.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s $ease-apple;
}

.btn-primary {
  @include primary-gradient;

  color: var(--action-primary-text);
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(var(--color-primary-rgb), 0.4);
  }

  &.btn-explore {
    background: linear-gradient(
      135deg,
      $success 0%,
      $success-dark 100%
    );
    box-shadow: 0 4px 16px rgba(var(--color-success-rgb), 0.3);

    &:hover {
      box-shadow: 0 6px 24px rgba(var(--color-success-rgb), 0.4);
    }
  }
}

.btn-secondary {
  background: var(--surface-panel);
  border: 1.5px solid rgba(var(--color-primary-rgb), 0.3);
  color: $primary;

  &:hover {
    background: var(--surface-panel-strong);
    border-color: rgba(var(--color-primary-rgb), 0.5);
    transform: translateY(-2px);
  }
}

/* Reveal */
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity 0.8s $ease-apple,
    transform 0.8s $ease-apple;

  &.visible {
    opacity: 1;
    transform: none;
  }
}

/* Platform */
.platform-section {
  @include section-container;

  padding:
    clamp(3rem, 6dvw, 6rem)
    clamp(1.5rem, 4dvw, 2.5rem);
}

.platform-card {
  position: relative;
  overflow: hidden;
  padding: clamp(2rem, 4vw, 3.5rem);
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb), 0.08) 0%,
    rgba(var(--color-primary-hover-rgb), 0.04) 100%
  );
  border: 1px solid rgba(var(--color-primary-rgb), 0.18);
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.08);
}

.platform-eyebrow {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-full);
  color: $primary;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.platform-title {
  margin: 1.25rem 0 0;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  line-height: 1.2;
  color: $text-primary;
}

.platform-desc {
  max-width: 64ch;
  margin: 1rem 0 0;
  color: var(--text-dark-lighter);
  line-height: 1.7;
}

.platform-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 2rem;

  @media (min-aspect-ratio: 1/1) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.platform-stat {
  padding: 1.25rem 1.5rem;
  background: var(--glass-60);
  border: 1px solid rgba(var(--color-primary-rgb), 0.12);
  border-radius: var(--radius-lg);

  span {
    display: block;
    color: var(--text-dark-lighter);
    font-size: 0.85rem;
    font-weight: 600;
  }

  strong {
    display: block;
    margin-top: 0.5rem;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    color: $primary;
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

/* Featured */
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
  display: flex;
  min-height: 360px;
  height: 100%;
  flex-direction: column;
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
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 24px;

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

/* Showcase (lazy) */
.showcase-section {
  @include section-container;

  padding:
    clamp(2rem, 6vw, 4rem)
    clamp(1rem, 4vw, 2rem);
}

/* Roadmap */
.roadmap {
  &-section {
    @include section-container(1100px);

    padding:
      clamp(2rem, 6vw, 4rem)
      clamp(1.5rem, 4vw, 2.5rem);
    background: linear-gradient(
      135deg,
      var(--glass-50) 0%,
      rgba(240, 248, 255, 0.6) 100%
    );
    border-radius: var(--radius-xl);
  }

  &-list {
    display: grid;
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(320px, 100%), 1fr)
    );
    gap: 1rem;
  }

  &-item {
    @include flex-col;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: var(--glass-60);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(var(--color-primary-rgb), 0.12);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;

    &:hover {
      background: var(--glass-80);
      border-color: rgba(var(--color-primary-rgb), 0.2);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.08);
      transform: translateY(-2px);
    }
  }

  &-header {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  &-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.08) 0%,
      rgba(var(--color-primary-hover-rgb), 0.12) 100%
    );
    border-radius: var(--radius-sm2);
    font-size: 1.25rem;

    @include flex-center;
  }

  &-content {
    flex: 1;
    min-width: 0;
  }

  &-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: $primary;
  }

  &-desc {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--text-dark-lighter);
  }
}

/* Projects */
.projects {
  &-section {
    @include section-container;

    padding:
      clamp(1.5rem, 4vw, 2.5rem)
      clamp(1.5rem, 4vw, 2.5rem)
      clamp(3rem, 8vw, 6rem);
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(min(280px, 100%), 1fr)
    );
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
}

.project {
  &-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--glass-60);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(var(--color-primary-rgb), 0.15);
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.08);
    text-decoration: none;
    transition: all 0.3s $ease-apple;
    will-change: transform;

    &:hover {
      background: var(--glass-80);
      border-color: rgba(var(--color-primary-rgb), 0.3);
      box-shadow: 0 12px 32px rgba(var(--color-primary-rgb), 0.18);
      transform: translateY(-3px) scale(1.02);

      .project-arrow {
        transform: translateX(4px);
      }
    }
  }

  &-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: rgba(var(--color-primary-rgb), 0.1);
    border-radius: var(--radius-sm2);

    @include flex-center;

    svg {
      width: 20px;
      height: 20px;
      color: $primary;
    }
  }

  &-content {
    flex: 1;
    min-width: 0;
  }

  &-name {
    margin-bottom: 0.2rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: $text-primary;
  }

  &-desc {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-dark-lighter);
  }

  &-arrow {
    flex-shrink: 0;
    font-size: 1.25rem;
    color: $primary;
    transition: transform 0.3s ease;
  }
}

.contact {
  &-card {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1) 0%,
      rgba(var(--color-primary-hover-rgb), 0.08) 100%
    );
    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-lg);
    transition: all 0.25s ease;

    &:hover {
      border-color: rgba(var(--color-primary-rgb), 0.3);
      box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.18);
      transform: translateY(-2px);
    }
  }

  &-icon {
    flex-shrink: 0;
    font-size: 2.5rem;
  }

  &-content {
    flex: 1;
    min-width: 0;
  }

  &-title {
    margin-bottom: 0.25rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: $text-primary;
  }

  &-desc {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--text-dark-lighter);
  }

  &-btn {
    flex-shrink: 0;
    padding: 0.75rem 1.75rem;

    @include primary-gradient;

    border: none;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.25);
    color: var(--action-primary-text);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s $ease-apple;

    &:hover {
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.35);
      transform: translateY(-2px);
    }
  }
}

/* Login Section */
.login {
  &-section {
    @include section-container;

    padding:
      clamp(3rem, 8vw, 6rem)
      clamp(1.5rem, 4vw, 2.5rem)
      clamp(1.5rem, 4vw, 2.5rem);
  }

  &-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.08) 0%,
      rgba(var(--color-primary-hover-rgb), 0.05) 100%
    );
    backdrop-filter: blur(20px);
    border: 1.5px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-xl);
    box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.1);
    transition: all 0.3s $ease-apple;

    &:hover {
      border-color: rgba(var(--color-primary-rgb), 0.3);
      box-shadow: 0 12px 32px rgba(var(--color-primary-rgb), 0.18);
      transform: translateY(-3px);
    }
  }

  &-icon {
    flex-shrink: 0;
    font-size: 3rem;
  }

  &-content {
    flex: 1;
    min-width: 0;
  }

  &-title {
    margin-bottom: 0.5rem;
    font-size: 1.375rem;
    font-weight: 700;
    color: $primary;
  }

  &-desc {
    margin-bottom: 1rem;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: var(--text-dark-lighter);
  }

  &-benefits {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  &-actions {
    flex-shrink: 0;
    @include flex-col;
    gap: 0.75rem;
  }

  &-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 1.75rem;
    border: none;
    border-radius: var(--radius-md);
    white-space: nowrap;
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s $ease-apple;

    &.primary {
      @include primary-gradient;

      color: var(--action-primary-text);
      box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.3);

      &:hover {
        box-shadow: 0 6px 24px rgba(var(--color-primary-rgb), 0.4);
        transform: translateY(-2px);
      }
    }

    &.secondary {
      background: var(--surface-panel);
      border: 1.5px solid rgba(var(--color-primary-rgb), 0.3);
      box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.1);
      color: $primary;

      &:hover {
        background: white;
        border-color: rgba(var(--color-primary-rgb), 0.5);
        box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.2);
        transform: translateY(-2px);

        :root[data-color-theme='dark'] & {
          color: var(--text-primary);
          background: var(--surface-panel-strong);
        }
      }
    }
  }
}

.benefit {
  &-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
    background: var(--glass-60);
    border-radius: var(--radius-sm2);
    font-size: 0.875rem;
    font-weight: 500;
    color: $text-primary;
  }

  &-icon {
    font-size: 1.125rem;
  }
}

/* Footer */
.footer {
  position: relative;
  z-index: 1;
  padding: 2.5rem clamp(1.5rem, 4vw, 2.5rem);
  background: var(--glass-40);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(var(--color-primary-rgb), 0.1);

  &-content {
    max-width: 1300px;
    margin: 0 auto;
    text-align: center;
  }

  &-links {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 0.875rem;
    margin-bottom: 1.25rem;
  }

  &-link {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    color: $primary;
    font-size: 0.9375rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.08);
      color: $primary-dark;
      text-decoration: underline;
    }
  }

  &-divider {
    color: rgba(var(--color-primary-rgb), 0.3);
    font-weight: 300;
  }

  &-stats {
    margin-bottom: 0.75rem;
    text-align: center;
    gap: 1rem;

    &-secondary {
      @include flex-center;
      flex-wrap: nowrap;
      gap: 1rem 3rem;
      margin-top: -0.2rem;
    }
  }

  &-info {
    @include flex-col;
    gap: 0.375rem;
  }

  &-text {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }
}

.stat-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-dark-lighter);

  &-muted {
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }
}

/* Modal */
.home-support {
  &-shell {
    position: relative;
    @include flex-col;
    height: calc(
      100% +
      var(--modal-content-padding-top) +
      var(--modal-content-padding-bottom)
    );
    margin:
      calc(-1 * var(--modal-content-padding-top))
      calc(-1 * var(--modal-content-padding-inline))
      calc(-1 * var(--modal-content-padding-bottom));
    overflow: auto;
    padding: 2.5rem 2rem;
  }

  &-title {
    margin-bottom: 0.5rem;
    text-align: center;
    font-size: 1.75rem;
    font-weight: 700;
    color: $primary;
  }

  &-subtitle {
    margin-bottom: 2rem;
    text-align: center;
    color: var(--text-dark-lighter);
  }
}

.donate-qr {
  &-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  &-box {
    @include flex-col;
    align-items: center;

    img {
      width: 100%;
      max-width: 150px;
      height: auto;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        transform: scale(1.05);
      }
    }
  }

  &-label {
    margin-top: 0.625rem;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 600;
    color: $text-primary;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .project-arrow {
    display: none;
  }
}

@media (orientation: portrait) {
  .hero {
    &-section {
      min-height: 100dvh;
    }

    &-title {
      margin: 0;
    }

    &-subtitle {
      margin-top: 0;
      font-size: clamp(0.7rem, 3dvw, 1.1rem);
    }

    &-content {
      margin: 0 auto 6rem;
      padding: 1rem;
      text-align: center;
      background: var(--glass-30);
      backdrop-filter: blur(8px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: var(--radius-xl);
      border: 1px solid var(--glass-40);
    }

    &-logo {
      display: block;
      width: clamp(180px, 50vw, 340px);
      margin: 0 auto;
    }

    &-actions {
      align-items: center;
      flex-direction: column;
      gap: 0.75rem;
    }
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }

  .projects-grid {
    gap: 0.75rem;
  }

  .project {
    &-card {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      text-align: center;
    }

    &-name {
      margin: 0;
    }
  }

  .contact {
    &-card {
      flex-direction: column;
      gap: 10px;
      padding: 1.25rem;
      text-align: center;
    }

    &-title {
      margin: 0;
    }
  }

  .login {
    &-card {
      flex-direction: column;
      gap: 10px;
      padding: 1.5rem;
      text-align: center;
    }

    &-title {
      margin: 0;
    }

    &-benefits {
      grid-template-columns: 1fr;
    }

    &-actions {
      width: 100%;
    }
  }

  .footer {
    &-links {
      gap: 0.625rem;
    }

    &-divider {
      display: none;
    }

    &-stats-secondary {
      flex-direction: column;
      gap: 0.35rem;
    }
  }

  .home-support {
    &-shell {
      padding: 2rem 1.5rem;
    }

    &-title {
      font-size: 1.5rem;
    }
  }

  .donate-qr-box {
    img {
      max-width: 120px;
    }
  }
}

@media (max-width: 600px) {
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.75rem;
    font-size: 0.9375rem;
  }

  .projects-grid {
    gap: 0.625rem;
  }

  .project-card {
    gap: 0.625rem;
    padding: 0.75rem 0.875rem;
  }

  .login {
    &-card {
      padding: 1.25rem;
    }

    &-title {
      font-size: 1.125rem;
    }

    &-desc {
      font-size: 0.875rem;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  .hero-logo {
    animation: none;
  }
}
</style>

<style lang="scss">
.simple-layout:has(.home-page) {
  padding: 0 !important;

  .content-area {
    width: 100%;
    padding: 0;
  }
}
</style>
