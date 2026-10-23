<template>
  <!-- 新的"簡介"页面 -->
  <div ref="introContainer" class="thanks-container">
    <button
      type="button"
      class="intro-directory-toggle glass-button"
      data-intro-directory-toggle
      :aria-expanded="directoryOpen"
      aria-controls="intro-directory"
      @click="directoryOpen = !directoryOpen"
    >{{ $t('about.intro.directory') }}</button>
    <nav
      id="intro-directory"
      class="intro-directory glass-panel"
      :class="{ 'is-open': directoryOpen }"
      :aria-label="$t('about.intro.directory')"
    >
      <button
        v-for="section in directorySections"
        :key="section.id"
        type="button"
        class="intro-directory-item"
        :data-intro-directory-item="section.id"
        :aria-label="section.label"
        :aria-current="activeSection === section.id ? 'location' : undefined"
        :title="section.label"
        @click="jumpToSection(section.id)"
      >
        <span class="intro-directory-label">{{ section.label }}</span>
        <span class="intro-directory-dot" aria-hidden="true"></span>
      </button>
    </nav>
    <h1 class="tabs-title">{{ $t('navigation.pageTitles.support.aboutIntro') }}</h1>
    <p style=" text-align: left;">{{ $t('about.intro.description') }}</p>
    <section class="feature-topology" data-feature-topology aria-labelledby="feature-topology-title">
      <h2 id="feature-topology-title" class="tabs-title">功能拓扑图</h2>
      <p class="feature-topology-hint">点击节点进入对应功能；地图图型需在进入地图后选择。</p>
      <div ref="topologyGraph" class="topology-analysis">
        <svg class="topology-connections" aria-hidden="true">
          <path
            v-for="connection in topologyConnections"
            :key="`${connection.from}-${connection.to}`"
            :data-topology-from="connection.from"
            :data-topology-to="connection.to"
            :d="connectorPaths[`${connection.from}-${connection.to}`] || ''"
          />
        </svg>
        <template v-for="branch in analysisBranches" :key="branch.id">
          <div class="topology-branch glass-panel" :class="`topology-branch--${branch.id}`">
            <RouterLink :to="localeTo(branch.route)" class="topology-node topology-root glass-button" :data-topology-node="branch.id">
              {{ branch.label }}
            </RouterLink>
            <ul class="topology-groups">
              <li v-for="group in branch.groups" :key="group.id">
                <RouterLink :to="localeTo(group.route)" class="topology-node topology-group-link glass-button" :data-topology-node="group.id" :title="group.hint">
                  {{ group.label }}<small v-if="group.note" class="topology-node-note">{{ group.note }}</small>
                </RouterLink>
                <ul v-if="group.items?.length" class="topology-items">
                  <li v-for="item in group.items" :key="item.id">
                    <RouterLink :to="localeTo(item.route)" class="topology-node topology-item-link glass-button" :data-topology-node="item.id" :title="item.hint">
                      {{ item.label }}<small v-if="item.note" class="topology-node-note">{{ item.note }}</small>
                    </RouterLink>
                    <ul v-if="item.items?.length" class="topology-items topology-items--nested">
                      <li v-for="subitem in item.items" :key="subitem.id">
                        <RouterLink :to="localeTo(subitem.route)" class="topology-node topology-item-link glass-button" :data-topology-node="subitem.id" :title="subitem.hint">
                          {{ subitem.label }}<small v-if="subitem.note" class="topology-node-note">{{ subitem.note }}</small>
                        </RouterLink>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </template>
        <div class="topology-bridge" aria-label="多方言与单方言之间的关联功能">
          <RouterLink
            v-for="node in bridgeNodes"
            :key="node.id"
            :to="localeTo(node.route)"
            class="topology-node topology-bridge-node glass-button"
            :data-topology-node="node.id"
          >{{ node.label }}</RouterLink>
        </div>
        <div class="topology-secondary">
        <div v-for="branch in secondaryBranches" :key="branch.id" class="topology-branch glass-panel">
          <RouterLink :to="localeTo(branch.route)" class="topology-node topology-root glass-button" :data-topology-node="branch.id">
            {{ branch.label }}
          </RouterLink>
          <ul class="topology-groups">
            <li v-for="group in branch.groups" :key="group.id">
              <RouterLink :to="localeTo(group.route)" class="topology-node topology-group-link glass-button" :data-topology-node="group.id" :title="group.hint">
                {{ group.label }}<small v-if="group.note" class="topology-node-note">{{ group.note }}</small>
              </RouterLink>
              <ul v-if="group.items?.length" class="topology-items">
                <li v-for="item in group.items" :key="item.id">
                  <RouterLink :to="localeTo(item.route)" class="topology-node topology-item-link glass-button" :data-topology-node="item.id" :title="item.hint">
                    {{ item.label }}<small v-if="item.note" class="topology-node-note">{{ item.note }}</small>
                  </RouterLink>
                  <ul v-if="item.items?.length" class="topology-items topology-items--nested">
                    <li v-for="subitem in item.items" :key="subitem.id">
                      <RouterLink :to="localeTo(subitem.route)" class="topology-node topology-item-link glass-button" :data-topology-node="subitem.id" :title="subitem.hint">
                        {{ subitem.label }}<small v-if="subitem.note" class="topology-node-note">{{ subitem.note }}</small>
                      </RouterLink>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      </div>
    </section>
    <ul class="customlist">
      <li
        v-for="feature in featureList"
        :id="`intro-${feature.key.replace('feature', 'feature-')}`"
        :key="feature.key"
        class="feature-item"
        data-intro-directory-target
      >
        <h3 class="feature-heading">
          <RouterLink v-if="feature.route" :to="localeTo(feature.route)" class="feature-link feature-heading-link">
            {{ feature.heading }}
          </RouterLink>
          <span v-else>{{ feature.heading }}</span>
        </h3>
        <p class="feature-subtitle">
          <RouterLink v-if="feature.route" :to="localeTo(feature.route)" class="feature-link feature-subtitle-link">
            {{ feature.subtitle }}
          </RouterLink>
          <span v-else>{{ feature.subtitle }}</span>
        </p>
        <p class="feature-intro">{{ feature.intro }}</p>
        <ul v-if="feature.items.length" class="subfeature-list">
          <li
            v-for="(item, i) in feature.items"
            :key="i"
            class="subfeature-item"
          >
            <h4 class="subfeature-title">
              <RouterLink v-if="item.route" :to="localeTo(item.route)" class="feature-link subfeature-title-link">
                {{ item.title }}
              </RouterLink>
              <span v-else>{{ item.title }}</span>
            </h4>
            <p class="subfeature-body">{{ item.body }}</p>
          </li>
        </ul>
        <a v-if="feature.zhihuLink" :href="feature.zhihuLink" target="_blank" rel="noopener" class="zhihu-article-link">{{ $t('about.intro.readZhihuArticle') }}</a>
      </li>
      <p style="text-align: left;">
        <a href="https://zhuanlan.zhihu.com/p/1934345780199682731" target="_blank" rel="noopener" class="zhihu-article-link">{{ $t('about.intro.oldSiteZhihuArticle') }}</a>
      </p>
      <!-- <li v-html="$t('about.intro.features.blueText')"></li>
      <li v-html="$t('about.intro.features.mapClick')"></li> -->
    </ul>

    <ul v-if="false" class="customlist">
      <li>功能1：<strong>查中古</strong>（按中古地位整理讀音）。
        使用者可輸入各種組合進行分析，目前支持攝、韻、等、呼、調、系、組、母、清濁、發音部位、發聲方式等類別。
        網站會按輸入的組合分析聲母/韻母/聲調，並把結果呈現在表格和地圖中。</li>
      <li>功能2：<strong>查音位</strong>（分析音位的中古來源）。
        使用者可輸入上述類別，網站會分析輸入的音值（音位）對應字的中古來源，並把結果呈現在表格和地圖中。</li>
      <li>功能3：<strong>查調</strong>（查詢調值、調類）。
        網站會根據用戶選擇的分區、地點，整理調值、調類，不同的調類標上了不同的顏色。</li>
      <li>功能4：<strong>查字</strong>（查詢字音、地位）。
        根據用戶輸入漢字進行查詢，最終呈現各個地點的音值、注釋以及漢字中古地位</li>
      <li v-html="$t('about.intro.features.feature5.title')"></li>
      <li>功能6：<strong>自定義繪圖</strong>（用戶添加個人數據進行繪圖）。
        用戶可以自己在地圖上選點、標註，網站會根據特徵值自定分配顏色</li>
      <li v-html="$t('about.intro.features.blueText')"></li>
      <li>{{ $t('about.intro.features.mapClick') }}</li>
    </ul>

    <p style=" text-align: left;font-weight: bold;text-decoration: underline">{{ $t('about.intro.footer') }}</p>

    <h2 id="intro-thanks" class="tabs-title" style="margin-top: 20px" data-intro-directory-target>🙏 {{ $t('about.thanks.title') }}</h2>
    <ul class="thanks-list">
      <li>
        ✔ <a href="https://mcpdict.vear.vip/" target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.mcpdict') }}</a>
        - {{ $t('about.thanks.mcpdictDesc') }}<a href="https://github.com/osfans/MCPDict/tree/master/tools/tables/output"
                                                 target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.mcpdictData') }}</a>
      </li>
      <li>
        ✔ <RouterLink :to="localeTo('/menu/vocabulary')" class="thanks-link">{{ $t('about.thanks.contributors') }}</RouterLink>
        - {{ $t('about.thanks.contributorsDesc') }}
      </li>
      <li>
        ✔ <a href="https://zhongguoyuyan.cn/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.yuyan') }}</a> - {{ $t('about.thanks.yuyanDesc') }}
      </li>
      <li>
        ✔ <a href="https://zhuanlan.zhihu.com/p/1890022649830290824" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.quanyue') }}</a> - {{ $t('about.thanks.quanyueDesc') }}
      </li>
      <li>
        ✔ <a href="https://dmfw.mca.gov.cn/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.diming') }}</a> - {{ $t('about.thanks.dimingDesc') }}
      </li>
      <li>
        ✔ <a href="https://jyutjam.org/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.jyutjam') }}</a> - {{ $t('about.thanks.jyutjamDesc') }}<a href="https://jyutdict.org/"
                                                                                                              target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.jyutdict') }}</a>
      </li>
      <li>
        ✔ <a href="https://xiaoxue.iis.sinica.edu.tw/ccrdata/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.xiaoxue') }}</a> - {{ $t('about.thanks.xiaoxueDesc') }}
      </li>
      <li>
        ✔ <a href="http://1.14.238.88:8099/dialect/main/about.html" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.yuemin') }}</a> - {{ $t('about.thanks.yueminDesc') }}
      </li>
      <li>
        ✔ <a href="#" class="thanks-link">{{ $t('about.thanks.testers') }}</a> - {{ $t('about.thanks.testersDesc') }}
      </li>
      <li style="margin-bottom: 0">
        ✔ <a href="#" class="thanks-link">{{ $t('about.thanks.friends') }}</a> - {{ $t('about.thanks.friendsDesc') }}
      </li>
      <li>
        ✔ <a href="#" class="thanks-link">{{ $t('about.thanks.you') }}</a> - {{ $t('about.thanks.youDesc') }}
      </li>
    </ul>
    <p style="font-size:2rem;margin-top:0.5rem;margin-bottom: 3rem">💖🌟🥳</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import i18n from '@/i18n/index.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { locale, t } = useI18n()
const route = useRoute()
const introContainer = ref(null)
const directoryOpen = ref(false)
const activeSection = ref('intro-feature-1')
const topologyGraph = ref(null)
const connectorPaths = ref({})
let topologyObserver

const mapViewHint = '进入方言地图后选择图型；部分图型需要先完成查询。'
const topologyConnections = [
  { from: 'compare', to: 'phonetic-compare' },
  { from: 'phonetic-compare', to: 'single-analysis' },
  { from: 'compare', to: 'syllable-count' },
  { from: 'syllable-count', to: 'single-analysis' },
]
const analysisBranches = [
  {
    id: 'multi-analysis', label: '多方言地理语言学分析', route: '/menu/query/zhonggu',
    groups: [
      { id: 'query', label: '查询', route: '/menu/query/zhonggu', items: [
        { id: 'query-char', label: '查字', route: '/menu/query/char' },
        { id: 'query-history', label: '查中古', note: '上古 · 中古 · 近古 · 粤语', route: '/menu/query/zhonggu', hint: '上古、中古、近古、粤语共用此查询入口。' },
        { id: 'query-phoneme', label: '查音位', route: '/menu/query/yinwei' },
        { id: 'query-tone', label: '查调', route: '/menu/query/tone' },
      ] },
      { id: 'compare', label: '比较', route: '/menu/compare/zhonggu', items: [
        { id: 'compare-char', label: '比较汉字', route: '/menu/compare/char' },
        { id: 'compare-history', label: '比较中古', route: '/menu/compare/zhonggu' },
        { id: 'compare-tone', label: '比较调类', route: '/menu/compare/tone' },
      ] },
      { id: 'dialect-map', label: '方言地图', route: '/menu/map/view', items: [
        { id: 'geo-map', label: '地理语言学地图', route: '/menu/map/view', items: [
          { id: 'map-feature', label: '特征图', route: '/menu/map/view', hint: mapViewHint },
          { id: 'map-district-points', label: '分区点图', route: '/menu/map/view', hint: mapViewHint },
          { id: 'map-compare', label: '比较图', route: '/menu/map/view', hint: mapViewHint },
          { id: 'map-place-name', label: '地名图', route: '/menu/map/view', hint: mapViewHint },
          { id: 'map-heat', label: '热力图', route: '/menu/map/view', hint: mapViewHint },
          { id: 'map-isoline', label: '等值线图', route: '/menu/map/view', hint: mapViewHint },
        ] },
        { id: 'map-divide', label: '分区图', route: '/menu/map/divide' },
        { id: 'gis-voronoi', label: '泰森多边形绘制分布图', route: '/explore/gis', hint: '进入绘图页后选择泰森多边形。' },
        { id: 'map-custom', label: '自定义数据', route: '/menu/map/custom' },
      ] },
    ],
  },
  {
    id: 'single-analysis', label: '单方言深入分析', route: '/menu/pho/matrix',
    groups: [
      { id: 'phonology-query', label: '音系查询', route: '/menu/pho/matrix' },
      { id: 'phoneme-query', label: '音素查询', route: '/menu/pho/custom' },
      { id: 'evolution', label: '演化', route: '/menu/pho/evolution' },
    ],
  },
]
const bridgeNodes = [
  { id: 'phonetic-compare', label: '音值比较', route: '/menu/compare/phonetic' },
  { id: 'syllable-count', label: '音节统计', route: '/menu/pho/count' },
]
const secondaryBranches = [
  {
    id: 'words', label: '词句', route: '/menu/yubao?tab=vocabulary', groups: [
      { id: 'yubao', label: '语保', route: '/menu/yubao?tab=vocabulary', items: [
        { id: 'yubao-vocabulary', label: '1000词', route: '/menu/yubao?tab=vocabulary' },
        { id: 'yubao-grammar', label: '50句', route: '/menu/yubao?tab=grammar' },
      ] },
      { id: 'vocabulary', label: '词表', route: '/menu/vocabulary/view', items: [
        { id: 'vocabulary-query', label: '查询', route: '/menu/vocabulary/view?tab=card', items: [
          { id: 'vocabulary-card', label: '卡片', route: '/menu/vocabulary/view?tab=card' },
          { id: 'vocabulary-map', label: '地图', route: '/menu/vocabulary/view?tab=map' },
          { id: 'vocabulary-table', label: '表格', route: '/menu/vocabulary/view?tab=table' },
        ] },
        { id: 'vocabulary-upload', label: '上传', route: '/menu/vocabulary/import' },
        { id: 'vocabulary-manage', label: '管理', route: '/menu/vocabulary/manage' },
      ] },
      { id: 'yangchun-words', label: '阳春口语词', route: '/explore/yc/words' },
    ],
  },
  {
    id: 'tools', label: '工具', route: '/menu/tools', groups: [
      { id: 'praat', label: 'Praat', route: '/explore/tools/praat' },
      { id: 'character-table', label: '字表', route: '/explore/tools/check', items: [
        { id: 'table-check', label: '检查工具', route: '/explore/tools/check' },
        { id: 'jyut-to-ipa', label: '粤拼转IPA', route: '/explore/tools/jyut2ipa' },
        { id: 'table-merge', label: '合并工具', route: '/explore/tools/merge' },
      ] },
      { id: 'villages', label: '自然村', route: '/menu/villages', items: [
        { id: 'villages-ml', label: '机器学习', route: '/explore/villages/ml' },
        { id: 'villages-toponyms', label: '地名分布', route: '/explore/villages/toponyms' },
        { id: 'villages-tree', label: '广东自然村树状图', route: '/explore/villages/gd' },
      ] },
      { id: 'char-class', label: '汉字字集', route: '/explore/char-class?tab=zhonggu', items: [
        { id: 'char-shanggu', label: '上古', route: '/explore/char-class?tab=shanggu' },
        { id: 'char-zhonggu', label: '中古', route: '/explore/char-class?tab=zhonggu' },
        { id: 'char-jingu', label: '近古', route: '/explore/char-class?tab=jingu' },
        { id: 'char-yueyun', label: '粤语', route: '/explore/char-class?tab=yueyun' },
      ] },
    ],
  },
]

function updateTopologyConnectors() {
  const graph = topologyGraph.value
  if (!graph) return
  const graphRect = graph.getBoundingClientRect()
  const isPortrait = window.matchMedia?.('(max-aspect-ratio: 1 / 1)').matches ?? false
  connectorPaths.value = Object.fromEntries(topologyConnections.map(({ from, to }) => {
    const fromRect = graph.querySelector(`[data-topology-node="${from}"]`)?.getBoundingClientRect()
    const toRect = graph.querySelector(`[data-topology-node="${to}"]`)?.getBoundingClientRect()
    if (!fromRect || !toRect) return [`${from}-${to}`, '']
    const startX = fromRect.right - graphRect.left
    const startY = fromRect.top + fromRect.height / 2 - graphRect.top
    const endX = (isPortrait ? toRect.right : toRect.left) - graphRect.left
    const endY = toRect.top + toRect.height / 2 - graphRect.top
    const path = isPortrait
      ? `M ${startX} ${startY} L ${graphRect.width - 4} ${startY} L ${graphRect.width - 4} ${endY} L ${endX} ${endY}`
      : `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`
    return [`${from}-${to}`, path]
  }))
}

const featureRouteMap = {
  feature1: '/menu/query/zhonggu',
  feature2: '/menu/map/view',
  feature3: '/menu/compare/zhonggu',
  feature4: '/menu/pho/matrix',
  feature5: '/explore/char-class?tab=zhonggu',
  feature6: '/explore/tools/check',
  feature7: '/menu/yubao?tab=vocabulary',
  feature8: '/menu/villages',
  feature9: '/explore/tools/praat'
}

const subfeatureRouteMap = {
  feature1: ['/menu/query/zhonggu', '/menu/query/yinwei', '/menu/query/char', '/menu/query/tone'],
  feature2: ['/menu/map/view', '/menu/map/divide', '/menu/map/custom', '/explore/gis'],
  feature3: ['/menu/compare/char', '/menu/compare/zhonggu', '/menu/compare/tone', '/menu/compare/phonetic'],
  feature4: ['/menu/pho/matrix', '/menu/pho/custom', '/menu/pho/count', '/menu/pho/evolution'],
  feature5: [
    '/explore/char-class?tab=zhonggu',
    '/explore/char-class?tab=shanggu',
    '/explore/char-class?tab=jingu',
    '/explore/char-class?tab=yueyun'
  ],
  feature6: ['/explore/tools/check', '/explore/tools/jyut2ipa', '/explore/tools/merge', '/explore/tools/derive'],
  feature7: ['/menu/yubao?tab=vocabulary', '/menu/yubao?tab=grammar', '/explore/yc/words'],
  feature8: [
    '/explore/villages/gd',
    '/explore/villages/toponyms',
    '/explore/villages/table',
    '/explore/yc/villages',
    '/explore/villages/ml'
  ],
  feature9: [
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat'
  ]
}

const featureList = computed(() => {
  const messages = i18n.global.messages.value[locale.value]
  const featureKeys = Object.keys(messages.about.intro.features)
  return featureKeys.map((key) => {
    const f = messages.about.intro.features[key]
    return {
      key,
      heading: f.heading,
      subtitle: f.subtitle,
      intro: f.intro,
      route: featureRouteMap[key] || '',
      items: (f.items || []).map((item, index) => ({
        ...item,
        route: subfeatureRouteMap[key]?.[index] || ''
      })),
      zhihuLink: f.zhihuLink || '',
    }
  })
})

const directorySections = computed(() => [
  ...featureList.value.map(feature => ({
    id: `intro-${feature.key.replace('feature', 'feature-')}`,
    label: feature.heading,
  })),
  { id: 'intro-thanks', label: t('about.thanks.title') },
])

function jumpToSection(id) {
  introContainer.value?.querySelector(`#${id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  activeSection.value = id
  directoryOpen.value = false
}

function updateActiveSection() {
  const threshold = window.innerHeight * 0.35
  for (const section of directorySections.value) {
    const target = introContainer.value?.querySelector(`#${section.id}`)
    if (target && target.getBoundingClientRect().top <= threshold) {
      activeSection.value = section.id
    } else {
      break
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection, { passive: true, capture: true })
  window.addEventListener('resize', updateTopologyConnectors)
  nextTick(updateTopologyConnectors)
  if (typeof ResizeObserver !== 'undefined') {
    topologyObserver = new ResizeObserver(updateTopologyConnectors)
    topologyObserver.observe(topologyGraph.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateActiveSection, true)
  window.removeEventListener('resize', updateTopologyConnectors)
  topologyObserver?.disconnect()
})

function localeTo(path) {
  return buildLocalePath(resolveRouteLocale(route), path)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use './aboutShared' as *;

/* 简介与鸣谢 */
.feature-topology {
  margin: 2rem 0;
  text-align: left;
}

.feature-topology > .tabs-title {
  text-align: center;
}

.feature-topology-hint {
  margin: 0 0 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

.topology-analysis {
  position: relative;
  display: grid;
  grid-template-areas: 'multi bridge single' 'multi . secondary';
  grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.38fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.topology-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;

  path {
    fill: none;
    stroke: var(--color-primary-medium2);
    stroke-width: 2;
  }
}

.topology-branch {
  position: relative;
  min-width: 0;
  padding: 0.85rem;
}

.topology-branch--multi-analysis {
  grid-area: multi;
}

.topology-branch--single-analysis {
  grid-area: single;
}

.topology-node {
  position: relative;
  z-index: 1;
  @include flex-col;
  align-items: flex-start;
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  min-height: 2rem;
  padding: 0.3rem 0.6rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.35;
  text-align: left;
  text-decoration: none;
  white-space: normal;
}

.topology-root {
  width: 100%;
  align-items: center;
  font-weight: 700;
  text-align: center;
}

.topology-node-note {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 400;
}

.topology-group-link {
  font-weight: 600;
}

.topology-groups,
.topology-items {
  margin: 0.5rem 0 0 0.65rem;
  padding: 0 0 0 0.7rem;
  border-left: 1px solid var(--color-primary-border2);
  list-style: none;

  > li {
    position: relative;
    margin: 0.45rem 0;

    &::before {
      position: absolute;
      top: 1rem;
      left: -0.7rem;
      width: 0.7rem;
      border-top: 1px solid var(--color-primary-border2);
      content: '';
    }
  }
}

.topology-items {
  margin-top: 0.25rem;
}

.topology-items--nested {
  margin-left: 0.4rem;
}

.topology-bridge {
  grid-area: bridge;
  @include flex-col;
  gap: 1.5rem;
  align-items: center;
  margin-top: 9rem;
}

.topology-bridge-node {
  width: 100%;
  align-items: center;
  text-align: center;
}

.topology-secondary {
  grid-area: secondary;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
}

.thanks-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  text-align: center;
  font-family: var(--font-serif);
  font-weight: 500;
  color: var(--text-primary);
}

.intro-directory {
  position: fixed;
  top: 50%;
  right: 1rem;
  z-index: 1600;
  width: auto;
  max-height: 80dvh;
  padding: 0.35rem;
  transform: translateY(-50%);
}

.intro-directory-item {
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

.intro-directory-label {
  @include text-truncate;
  position: absolute;
  right: 2.35rem;
  max-width: 0;
  padding: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-glass-floating);
  font-size: 0.8rem;
  opacity: 0;
  pointer-events: none;
}

.intro-directory-item:hover .intro-directory-label,
.intro-directory-item:focus-visible .intro-directory-label,
.intro-directory-item[aria-current='location'] .intro-directory-label {
  max-width: 11rem;
  padding: 0.3rem 0.5rem;
  opacity: 1;
}

.intro-directory-dot {
  flex: 0 0 auto;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: var(--radius-pill);
  background: var(--color-primary-border);
}

.intro-directory-item[aria-current='location'] .intro-directory-dot {
  background: var(--color-primary);
}

.intro-directory-toggle {
  display: none;
}

[data-intro-directory-target] {
  scroll-margin-top: 7rem;
}

.thanks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.8;

  li {
    margin-bottom: 0.5rem;
  }
}
.customlist {
  margin-left: 20px;
  padding-left: 20px;
  color: $text-primary;
  font-size: 16px;
  list-style-type: none;

  ol {
    list-style-type: decimal;
  }

  ul {
    list-style-type: none;
  }

  li {
    margin-bottom: 6px;
    line-height: 1.5;
    text-align: left;

    a {
      color: $primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.feature-item {
  margin-bottom: 24px !important;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.feature-heading {
  margin: 0 0 4px;
  color: $text-heading;
  font-size: 18px;
  font-weight: 700;
}

.feature-subtitle {
  margin: 0 0 6px;
  color: $primary;
  font-size: 14px;
  font-weight: 500;
}

.feature-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.feature-intro {
  margin: 0 0 12px;
  color: $text-secondary;
  font-size: 15px;
  line-height: 1.6;
}

.zhihu-article-link {
  display: inline-block;
  margin-top: 8px;
  color: $zhihu-blue;
  font-size: 14px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.subfeature-list {
  margin: 8px 0 0 16px;
  padding: 0;
}

.subfeature-item {
  margin-bottom: 10px !important;
}

.subfeature-title {
  margin: 0 0 2px;
  color: var(--text-deep);
  font-size: 15px;
  font-weight: 600;
}

.subfeature-body {
  margin: 0;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.65;
}
@media (max-width: 768px) {
  .thanks-list {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .thanks-list {
    font-size: 1.35rem;
  }
}

@media (max-aspect-ratio: #{1 / 1}) {
  .topology-analysis {
    grid-template-areas: 'multi' 'bridge' 'single' 'secondary';
    grid-template-columns: minmax(0, 1fr);
    gap: 0.8rem;
  }

  .topology-bridge {
    gap: 0.6rem;
    align-items: flex-end;
    margin: 0;
    padding-right: 1.25rem;
  }

  .topology-bridge-node {
    width: auto;
  }

  .topology-secondary {
    gap: 0.8rem;
  }

  .intro-directory-toggle {
    display: block;
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 1601;
  }

  .intro-directory {
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

  .intro-directory-label {
    position: static;
    flex: 1;
    max-width: none;
    padding: 0;
    background: transparent;
    opacity: 1;
  }

  .intro-directory-item {
    justify-content: space-between;
    gap: 0.6rem;
    text-align: left;
  }

  .intro-directory-item[aria-current='location'] .intro-directory-label {
    max-width: none;
    padding: 0;
  }

  .customlist {
    margin-left: 14px;
    padding-left: 16px;
    font-size: 15px;

    li {
      margin-bottom: 4px;
      line-height: 1.45;
    }
  }

  .feature-heading {
    font-size: 17px;
  }

  .feature-subtitle {
    font-size: 13px;
  }

  .feature-intro {
    font-size: 14px;
  }

  .zhihu-article-link {
    font-size: 13px;
  }

  .subfeature-list {
    margin-left: 12px;
  }

  .subfeature-title {
    font-size: 14px;
  }

  .subfeature-body {
    font-size: 13px;
    line-height: 1.55;
  }
}
</style>
