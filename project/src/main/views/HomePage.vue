<template>
  <div class="home-page">
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
            <button class="btn-primary" @click="navigateTo('/menu/query/zhonggu')">
              <span class="btn-icon"><InlineIcon icon="🚀" /></span>
              <span class="btn-text">{{ $t('home.hero.startExploring') }}</span>
            </button>
            <button class="btn-secondary" @click="scrollToFeatures">
              <span class="btn-icon"><InlineIcon icon="📖" /></span>
              <span class="btn-text">{{ $t('home.hero.featuresIntro') }}</span>
            </button>
          </div>
          <img :src="heroDecorationSrc" :alt="$t('home.hero.decorationAlt')" class="hero-decoration" />
        </div>
      </div>

      <HeroShowcase />
    </section>

    <!-- Features Section -->
    <section class="features-section" ref="featuresSection">
      <h2 class="section-title">{{ $t('home.features.sectionTitle') }}</h2>

      <div class="features-grid">
        <!-- 查詢功能 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'query' }">
          <div class="card-header" @click="toggleCard('query')">
            <div class="card-icon"><InlineIcon icon="🔍" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.query.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.query.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'query' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'query'" class="card-body">
              <a @click.stop="navigateTo('/menu/query/char')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📝" /></span>
                <span class="link-text">{{ $t('home.features.query.searchChar') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/query/zhonggu')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📜" /></span>
                <span class="link-text">{{ $t('home.features.query.searchMiddle') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/query/yinwei')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🗣️" /></span>
                <span class="link-text">{{ $t('home.features.query.searchPhoneme') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/query/tone')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🎶" /></span>
                <span class="link-text">{{ $t('home.features.query.searchTone') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 比較功能 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'compare' }">
          <div class="card-header" @click="toggleCard('compare')">
            <div class="card-icon"><InlineIcon icon="🔀" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.compare.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.compare.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'compare' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'compare'" class="card-body">
              <a @click.stop="navigateTo('/menu/compare/char')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📊" /></span>
                <span class="link-text">{{ $t('home.features.compare.compareChar') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/compare/zhonggu')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🎯" /></span>
                <span class="link-text">{{ $t('home.features.compare.compareMiddle') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/compare/tone')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🎹" /></span>
                <span class="link-text">{{ $t('home.features.compare.compareTone') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/compare/phonetic')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="⚖️" /></span>
                <span class="link-text">{{ $t('home.features.compare.comparePhonetic') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 地圖可視化 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'map' }">
          <div class="card-header" @click="toggleCard('map')">
            <div class="card-icon"><InlineIcon icon="🗺️" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.map.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.map.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'map' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'map'" class="card-body">
              <a @click.stop="navigateTo('/menu/map/view')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📍" /></span>
                <span class="link-text">{{ $t('home.features.map.dialectMap') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/map/divide')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🧭" /></span>
                <span class="link-text">{{ $t('home.features.map.regionMap') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/map/custom')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📁" /></span>
                <span class="link-text">{{ $t('home.features.map.customMap') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/gis')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="✏️" /></span>
                <span class="link-text">{{ $t('home.features.map.drawMap') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 音系分析 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'pho' }">
          <div class="card-header" @click="toggleCard('pho')">
            <div class="card-icon"><InlineIcon icon="🧬" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.phonology.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.phonology.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'pho' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'pho'" class="card-body">
              <a @click.stop="navigateTo('/menu/pho/matrix')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="⚗️" /></span>
                <span class="link-text">{{ $t('home.features.phonology.phonologyQuery') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/pho/custom')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🔬" /></span>
                <span class="link-text">{{ $t('home.features.phonology.phonemeClassify') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/pho/count')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📊" /></span>
                <span class="link-text">{{ $t('home.features.phonology.syllableCount') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/pho/evolution')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🥧" /></span>
                <span class="link-text">{{ $t('home.features.phonology.evolution') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 漢字字表 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'charClass' }">
          <div class="card-header" @click="toggleCard('charClass')">
            <div class="card-icon"><InlineIcon icon="📜" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.charClass.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.charClass.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'charClass' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'charClass'" class="card-body">
              <a @click.stop="navigateTo('/explore/char-class?tab=zhonggu')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🏛️" /></span>
                <span class="link-text">{{ $t('home.features.charClass.zhonggu') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/char-class?tab=shanggu')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📿" /></span>
                <span class="link-text">{{ $t('home.features.charClass.shanggu') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/char-class?tab=jingu')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📖" /></span>
                <span class="link-text">{{ $t('home.features.charClass.jingu') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/char-class?tab=yueyun')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🎵" /></span>
                <span class="link-text">{{ $t('home.features.charClass.yueyun') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 詞句資料 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'words' }">
          <div class="card-header" @click="toggleCard('words')">
            <div class="card-icon"><InlineIcon icon="📖" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.words.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.words.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'words' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'words'" class="card-body">
              <a @click.stop="navigateTo('/menu/vocabulary')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📋" /></span>
                <span class="link-text">{{ $t('home.features.words.wordList') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/yubao?tab=vocabulary')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📖" /></span>
                <span class="link-text">{{ $t('home.features.words.yubaoVocab') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/yubao?tab=grammar')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🗣️" /></span>
                <span class="link-text">{{ $t('home.features.words.yubaoGrammar') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/yc/words')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="💬" /></span>
                <span class="link-text">{{ $t('home.features.words.ycSpoken') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 自然村資料 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'villages' }">
          <div class="card-header" @click="toggleCard('villages')">
            <div class="card-icon"><InlineIcon icon="🏘️" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.villages.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.villages.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'villages' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'villages'" class="card-body">
              <a @click.stop="navigateTo('/explore/villages/toponyms')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📍" /></span>
                <span class="link-text">{{ $t('home.features.villages.toponyms') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/villages/ml')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🤖" /></span>
                <span class="link-text">{{ $t('home.features.villages.villagesML') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/villages/gd')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🏘️" /></span>
                <span class="link-text">{{ $t('home.features.villages.gdVillages') }}</span>
              </a>
              <!-- <a @click.stop="navigateTo('/explore/villages/table')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📊" /></span>
                <span class="link-text">{{ $t('home.features.villages.gdVillagesTable') }}</span>
              </a> -->
              <a @click.stop="navigateTo('/explore/villages/yc')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🌾" /></span>
                <span class="link-text">{{ $t('home.features.villages.ycVillages') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 專業工具 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'tools' }">
          <div class="card-header" @click="toggleCard('tools')">
            <div class="card-icon"><InlineIcon icon="🧰" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.tools.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.tools.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'tools' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'tools'" class="card-body">
              <a @click.stop="navigateTo('/explore/tools/check')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="📋" /></span>
                <span class="link-text">{{ $t('home.features.tools.tableProcess') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/tools/jyut2ipa')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🔤" /></span>
                <span class="link-text">{{ $t('home.features.tools.jyut2ipa') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/tools/merge')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🔗" /></span>
                <span class="link-text">{{ $t('home.features.tools.tableMerge') }}</span>
              </a>
              <!-- <a @click.stop="navigateTo('/explore/tools/derive')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🧪" /></span>
                <span class="link-text">{{ $t('home.features.tools.tableDerive') }}</span>
              </a> -->
              <!-- <a @click.stop="navigateTo('/explore?page=praat')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🎙️" /></span>
                <span class="link-text">聲學分析 - 實驗語音學工具</span>
              </a> -->
            </div>
          </transition>
        </div>

        <!-- Praat 聲學分析 -->
        <div class="feature-card clickable" @click="navigateTo('/explore/tools/praat')">
          <div class="card-header">
            <div class="card-icon"><InlineIcon icon="🎙️" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.praat.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.praat.desc') }}</p>
            </div>
            <div class="card-arrow">→</div>
          </div>
        </div>

        <!-- 方言聚类 -->
<!--        <div class="feature-card clickable" @click="navigateTo('/menu/luster')">-->
<!--          <div class="card-header">-->
<!--            <div class="card-icon"><InlineIcon icon="🧩" /></div>-->
<!--            <div class="card-info">-->
<!--              <h3 class="card-title">{{ $t('home.features.dialectClustering.title') }}</h3>-->
<!--              <p class="card-desc">{{ $t('home.features.dialectClustering.desc') }}</p>-->
<!--            </div>-->
<!--            <div class="card-arrow">→</div>-->
<!--          </div>-->
<!--        </div>-->

        <!-- 關於網站 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'about' }">
          <div class="card-header" @click="toggleCard('about')">
            <div class="card-icon"><InlineIcon icon="🌐" /></div>
            <div class="card-info">
              <h3 class="card-title">{{ $t('home.features.about.title') }}</h3>
              <p class="card-desc">{{ $t('home.features.about.desc') }}</p>
            </div>
            <button class="expand-toggle">
              <span class="toggle-icon">{{ expandedCard === 'about' ? '−' : '+' }}</span>
            </button>
          </div>
          <transition name="expand">
            <div v-if="expandedCard === 'about'" class="card-body">
              <a @click.stop="navigateTo('/menu/about/intro')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="ℹ️" /></span>
                <span class="link-text">{{ $t('home.features.about.intro') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/about/suggestion')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="💬" /></span>
                <span class="link-text">{{ $t('home.features.about.suggestion') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/about/like')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="❤️" /></span>
                <span class="link-text">{{ $t('home.features.about.likeAuthor') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/settings')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="⚙️" /></span>
                <span class="link-text">{{ $t('home.features.about.setting') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/source')" class="feature-link">
                <span class="link-icon"><InlineIcon icon="🔗" /></span>
                <span class="link-text">{{ $t('home.features.about.source') }}</span>
              </a>
            </div>
          </transition>
        </div>
      </div>
    </section>

    <!-- Roadmap Section -->
    <section class="roadmap-section">
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
    </section>

    <!-- Login Benefits Section -->
    <section class="login-section">
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
          <button class="login-btn primary" @click="navigateTo('/auth')">
            {{ $t('home.login.loginNow') }}
          </button>
          <button class="login-btn secondary" @click="showBenefitsPopup = true">
            {{ $t('home.login.viewDetails') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Projects Section -->
    <section class="projects-section">
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
          <a @click="navigateTo('/menu/about/intro')" class="footer-link">{{ $t('home.footer.links.about') }}</a>
          <span class="footer-divider">·</span>
          <a @click="navigateTo('/menu/source')" class="footer-link">{{ $t('home.footer.links.source') }}</a>
          <span class="footer-divider">·</span>
          <a @click="navigateTo('/menu/privacy')" class="footer-link">{{ $t('home.footer.links.privacy') }}</a>
          <span class="footer-divider">·</span>
          <a @click="navigateTo('/menu/settings')" class="footer-link">{{ $t('home.footer.links.setting') }}</a>
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
import HeroShowcase from '@/main/components/HeroShowcase.vue'
import { computed, ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { currentColorTheme, COLOR_THEME_GREEN } from '@/composables/core/uiPreferences.js'
import { useVisitStats } from '@/composables/data/useVisitStats.js'
import { useClickParticles } from '@/main/composables/useClickParticles.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'

// ✅ 条件渲染的组件懒加载
const UserBenefitsPopup = defineAsyncComponent(() =>
  import('@/main/components/user/popups/UserBenefitsPopup.vue')
)
const SupportPopup = defineAsyncComponent(() =>
  import('@/main/components/user/popups/SupportPopup.vue')
)
const UpdateNoticeModal = defineAsyncComponent(() =>
  import('@/main/components/user/popups/UpdateNoticeModal.vue')
)
const GlobeBackground = defineAsyncComponent(() =>
  import('@/main/components/globe/GlobeBackground.vue')
)

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const {
  todayVisits,
  totalVisits,
  ensureVisitStats
} = useVisitStats()
const featuresSection = ref(null)
const expandedCard = ref(null)
const globePoints = ref([])
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

function scrollToFeatures() {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function toggleCard(cardName) {
  expandedCard.value = expandedCard.value === cardName ? null : cardName
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
  fetchVisitStats()
  fetchSourceStats()
  fetchGlobePoints()
})
</script>



<style scoped lang="scss">
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

/* Features */
.features-section {
  @include section-container;

  padding:
    clamp(3rem, 6dvw, 6rem)
    clamp(1.5rem, 4dvw, 2.5rem);
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

.features-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(350px, 100%), 1fr)
  );
  align-items: start;
  gap: 1.25rem;
}

.feature-card {
  overflow: hidden;
  background: var(--glass-70);
  border: 1px solid rgba(var(--color-primary-rgb), 0.15);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.08);
  animation: cardFadeIn 0.4s ease backwards;
  transition: all 0.25s ease;

  @for $index from 1 through 9 {
    &:nth-child(#{$index}) {
      animation-delay: 0.02s * $index;
    }
  }

  &:hover {
    background: var(--glass-90);
    border-color: rgba(var(--color-primary-rgb), 0.3);
    box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.15);
    transform: translateY(-2px);

    .card-icon {
      transform: scale(1.2);
    }
  }

  &.expanded {
    background: var(--glass-90);
    border-color: rgba(var(--color-primary-rgb), 0.35);
    box-shadow: 0 6px 18px rgba(var(--color-primary-rgb), 0.18);

    .card-icon {
      transform: scale(1.1);
    }

    .expand-toggle {
      background: $primary;
      color: var(--action-primary-text);
      transform: rotate(180deg);

      &:hover {
        transform: rotate(180deg) scale(1.1);
      }
    }
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      .card-arrow {
        transform: translateX(6px);
      }
    }
  }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  &-header {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1.25rem;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s $ease-apple;

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.03);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1) 0%,
      rgba(var(--color-primary-hover-rgb), 0.15) 100%
    );
    border-radius: var(--radius-md);
    font-size: 2rem;
    transition: transform 0.25s ease;

    @include flex-center;
  }

  &-info {
    flex: 1;
    min-width: 0;
  }

  &-title {
    margin-bottom: 0.25rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: $text-primary;
  }

  &-desc {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-dark-lighter);
  }

  &-arrow {
    flex-shrink: 0;
    font-size: 1.5rem;
    color: $primary;
    transition: transform 0.3s ease;
  }

  &-body {
    @include flex-col;
    gap: 0.5rem;
    padding: 0 1.25rem 1.25rem;
    transform-origin: top;
  }
}

.expand-toggle {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 2px solid $primary;
  border-radius: var(--radius-full);
  color: $primary;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  @include flex-center;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.2);
    transform: scale(1.1);
  }
}

.feature-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--glass-80);
  border: 1px solid rgba(var(--color-primary-rgb), 0.1);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: '→';
    margin-left: auto;
    color: rgba(var(--color-primary-rgb), 0.6);
    font-size: 1.4rem;
    font-weight: bold;
    transition: all 0.2s ease;
  }

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.08);
    border-color: rgba(var(--color-primary-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.15);
    transform: translateX(4px);

    &::after {
      color: rgba(var(--color-primary-rgb), 1);
      transform: translateX(3px);
    }

    .link-icon {
      transform: scale(1.1);
    }

    .link-text {
      color: $primary;
    }
  }
}

.link {
  &-icon {
    flex-shrink: 0;
    font-size: 1.25rem;
    transition: transform 0.2s ease;
  }

  &-text {
    font-size: 0.9375rem;
    font-weight: 500;
    color: $text-primary;
    transition: color 0.2s ease;
  }
}

.expand {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s $ease-apple;
    will-change: opacity, transform;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(-10px) scaleY(0.95);
  }

  &-enter-to,
  &-leave-from {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
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
    padding: 0.875rem 1.75rem;
    border: none;
    border-radius: var(--radius-md);
    white-space: nowrap;
    font-size: 0.9375rem;
    font-weight: 600;
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

  .features-grid,
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

  .card {
    &-header {
      padding: 1rem;
    }

    &-body {
      padding: 0 1rem 1rem;
    }

    &-title {
      font-size: 1.0625rem;
    }

    &-icon {
      width: 44px;
      height: 44px;
      font-size: 1.75rem;
    }
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
