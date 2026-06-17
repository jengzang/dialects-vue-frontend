<template>
  <div class="home-page">
    <!-- Animated Background -->
    <div class="bg-gradient"></div>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <img src="@/assets/picture/title.png" :alt="$t('home.hero.logoAlt')" class="hero-logo" />
        <h1 class="hero-title">{{ $t('home.hero.title') }}</h1>
        <p class="hero-subtitle">{{ $t('home.hero.subtitle') }}</p>
        <div class="hero-actions">
          <button class="btn-primary" @click="navigateTo('/menu/query/zhonggu')">
            <span class="btn-icon">🚀</span>
            <span class="btn-text">{{ $t('home.hero.startExploring') }}</span>
          </button>
          <!-- <button class="btn-primary btn-explore" @click="navigateTo('/explore?page=YuBao')">
            <span class="btn-icon">🧰</span>
            <span class="btn-text">{{ $t('home.hero.expandTools') }}</span>
          </button> -->
          <button class="btn-secondary" @click="scrollToFeatures">
            <span class="btn-icon">📖</span>
            <span class="btn-text">{{ $t('home.hero.featuresIntro') }}</span>
          </button>
        </div>
        <img src="@/assets/picture/BlueCircle.png" :alt="$t('home.hero.decorationAlt')" class="hero-decoration" />
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section" ref="featuresSection">
      <h2 class="section-title">{{ $t('home.features.sectionTitle') }}</h2>

      <div class="features-grid">
        <!-- 查詢功能 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'query' }">
          <div class="card-header" @click="toggleCard('query')">
            <div class="card-icon">🔍</div>
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
                <span class="link-icon">📝</span>
                <span class="link-text">{{ $t('home.features.query.searchChar') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/query/zhonggu')" class="feature-link">
                <span class="link-icon">📜</span>
                <span class="link-text">{{ $t('home.features.query.searchMiddle') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/query/yinwei')" class="feature-link">
                <span class="link-icon">🗣️</span>
                <span class="link-text">{{ $t('home.features.query.searchPhoneme') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/query/tone')" class="feature-link">
                <span class="link-icon">🎶</span>
                <span class="link-text">{{ $t('home.features.query.searchTone') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 比較功能 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'compare' }">
          <div class="card-header" @click="toggleCard('compare')">
            <div class="card-icon">🔀</div>
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
                <span class="link-icon">📊</span>
                <span class="link-text">{{ $t('home.features.compare.compareChar') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/compare/zhonggu')" class="feature-link">
                <span class="link-icon">🎯</span>
                <span class="link-text">{{ $t('home.features.compare.compareMiddle') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/compare/tone')" class="feature-link">
                <span class="link-icon">🎹</span>
                <span class="link-text">{{ $t('home.features.compare.compareTone') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/compare/phonetic')" class="feature-link">
                <span class="link-icon">⚖️</span>
                <span class="link-text">{{ $t('home.features.compare.comparePhonetic') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 地圖可視化 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'map' }">
          <div class="card-header" @click="toggleCard('map')">
            <div class="card-icon">🗺️</div>
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
                <span class="link-icon">📍</span>
                <span class="link-text">{{ $t('home.features.map.dialectMap') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/map/divide')" class="feature-link">
                <span class="link-icon">🧭</span>
                <span class="link-text">{{ $t('home.features.map.regionMap') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/map/custom')" class="feature-link">
                <span class="link-icon">📁</span>
                <span class="link-text">{{ $t('home.features.map.customMap') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/map/draw')" class="feature-link">
                <span class="link-icon">✏️</span>
                <span class="link-text">{{ $t('home.features.map.drawMap') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 音系分析 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'pho' }">
          <div class="card-header" @click="toggleCard('pho')">
            <div class="card-icon">🧬</div>
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
                <span class="link-icon">⚗️</span>
                <span class="link-text">{{ $t('home.features.phonology.phonologyQuery') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/pho/custom')" class="feature-link">
                <span class="link-icon">🔬</span>
                <span class="link-text">{{ $t('home.features.phonology.phonemeClassify') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/pho/count')" class="feature-link">
                <span class="link-icon">📊</span>
                <span class="link-text">{{ $t('home.features.phonology.syllableCount') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/pho/evolution')" class="feature-link">
                <span class="link-icon">🥧</span>
                <span class="link-text">{{ $t('home.features.phonology.evolution') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 漢字字表 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'charClass' }">
          <div class="card-header" @click="toggleCard('charClass')">
            <div class="card-icon">📜</div>
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
                <span class="link-icon">🏛️</span>
                <span class="link-text">{{ $t('home.features.charClass.zhonggu') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/char-class?tab=shanggu')" class="feature-link">
                <span class="link-icon">📿</span>
                <span class="link-text">{{ $t('home.features.charClass.shanggu') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/char-class?tab=jingu')" class="feature-link">
                <span class="link-icon">📖</span>
                <span class="link-text">{{ $t('home.features.charClass.jingu') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/char-class?tab=yueyun')" class="feature-link">
                <span class="link-icon">🎵</span>
                <span class="link-text">{{ $t('home.features.charClass.yueyun') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 詞句資料 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'words' }">
          <div class="card-header" @click="toggleCard('words')">
            <div class="card-icon">📖</div>
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
              <a @click.stop="navigateTo('/explore/yubao?tab=vocabulary')" class="feature-link">
                <span class="link-icon">📚</span>
                <span class="link-text">{{ $t('home.features.words.yubaoVocab') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/yubao?tab=grammar')" class="feature-link">
                <span class="link-icon">🗣️</span>
                <span class="link-text">{{ $t('home.features.words.yubaoGrammar') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/yc-spoken')" class="feature-link">
                <span class="link-icon">💬</span>
                <span class="link-text">{{ $t('home.features.words.ycSpoken') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 自然村資料 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'villages' }">
          <div class="card-header" @click="toggleCard('villages')">
            <div class="card-icon">🏘️</div>
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
              <a @click.stop="navigateTo('/explore/villages/gd')" class="feature-link">
                <span class="link-icon">🏘️</span>
                <span class="link-text">{{ $t('home.features.villages.gdVillages') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/villages/ml')" class="feature-link">
                <span class="link-icon">🤖</span>
                <span class="link-text">{{ $t('home.features.villages.villagesML') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/villages/table')" class="feature-link">
                <span class="link-icon">📊</span>
                <span class="link-text">{{ $t('home.features.villages.gdVillagesTable') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/villages/yc')" class="feature-link">
                <span class="link-icon">🌾</span>
                <span class="link-text">{{ $t('home.features.villages.ycVillages') }}</span>
              </a>
            </div>
          </transition>
        </div>

        <!-- 專業工具 -->
        <div class="feature-card" :class="{ expanded: expandedCard === 'tools' }">
          <div class="card-header" @click="toggleCard('tools')">
            <div class="card-icon">🧰</div>
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
                <span class="link-icon">📋</span>
                <span class="link-text">{{ $t('home.features.tools.tableProcess') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/tools/jyut2ipa')" class="feature-link">
                <span class="link-icon">🔤</span>
                <span class="link-text">{{ $t('home.features.tools.jyut2ipa') }}</span>
              </a>
              <a @click.stop="navigateTo('/explore/tools/merge')" class="feature-link">
                <span class="link-icon">🔗</span>
                <span class="link-text">{{ $t('home.features.tools.tableMerge') }}</span>
              </a>
              <!-- <a @click.stop="navigateTo('/explore?page=praat')" class="feature-link">
                <span class="link-icon">🎙️</span>
                <span class="link-text">聲學分析 - 實驗語音學工具</span>
              </a> -->
            </div>
          </transition>
        </div>

        <!-- Praat 聲學分析 -->
        <div class="feature-card clickable" @click="navigateTo('/explore/tools/praat')">
          <div class="card-header">
            <div class="card-icon">🎙️</div>
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
<!--            <div class="card-icon">🧩</div>-->
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
            <div class="card-icon">🌐</div>
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
                <span class="link-icon">ℹ️</span>
                <span class="link-text">{{ $t('home.features.about.intro') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/about/suggestion')" class="feature-link">
                <span class="link-icon">💬</span>
                <span class="link-text">{{ $t('home.features.about.suggestion') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/about/like')" class="feature-link">
                <span class="link-icon">❤️</span>
                <span class="link-text">{{ $t('home.features.about.likeAuthor') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/about/settings')" class="feature-link">
                <span class="link-icon">⚙️</span>
                <span class="link-text">{{ $t('home.features.about.setting') }}</span>
              </a>
              <a @click.stop="navigateTo('/menu/source')" class="feature-link">
                <span class="link-icon">📚</span>
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
            <div class="roadmap-icon">📜</div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.charsGeneration.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.charsGeneration.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon">🎙️</div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.phoneticsToolbox.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.phoneticsToolbox.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon">🧬</div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.dialectClustering.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.dialectClustering.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon">🌳</div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.evolutionTree.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.evolutionTree.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon">🔊</div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.ipaTTS.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.ipaTTS.desc') }}</p>
        </div>
        <div class="roadmap-item">
          <div class="roadmap-header">
            <div class="roadmap-icon">🤖</div>
            <h3 class="roadmap-title">{{ $t('home.roadmap.dialectBot.title') }}</h3>
          </div>
          <p class="roadmap-desc">{{ $t('home.roadmap.dialectBot.desc') }}</p>
        </div>
      </div>
    </section>

    <!-- Login Benefits Section -->
    <section class="login-section">
      <div class="login-card">
        <div class="login-icon">🔐</div>
        <div class="login-content">
          <h3 class="login-title">{{ $t('home.login.title') }}</h3>
          <p class="login-desc">{{ $t('home.login.desc') }}</p>
          <div class="login-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">🗺️</span>
              <span class="benefit-text">{{ $t('home.login.benefits.customMap') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🗂️</span>
              <span class="benefit-text">{{ $t('home.login.benefits.customRegion') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🔍</span>
              <span class="benefit-text">{{ $t('home.login.benefits.moreLocations') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎙️</span>
              <span class="benefit-text">{{ $t('home.login.benefits.praatTools') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🧰</span>
              <span class="benefit-text">{{ $t('home.login.benefits.tableTools') }}</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📊</span>
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
        <div class="contact-icon">💬</div>
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
          <a @click="navigateTo('/menu/about/settings')" class="footer-link">{{ $t('home.footer.links.setting') }}</a>
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
      :version="homeUpdateNotice.version"
      :last-update-date="homeUpdateNotice.lastUpdateDate"
      :title="homeUpdateNotice.title"
      :items="homeUpdateNotice.items"
      @close="showUpdateNotice = false"
    />

    <!-- Support Modal -->
    <SupportPopup
      :visible="showSupport"
      @close="showSupport = false"
    />
    <!--      <div class="home-support-shell" @click.stop>
            <button class="close-btn close-btn-lg close-btn-corner" @click="showSupport = false">✕</button>
            <h3 class="home-support-title">{{ $t('home.supportModal.title') }}</h3>
            <p class="home-support-subtitle">{{ $t('home.supportModal.subtitle') }}</p>
            <div class="donate-qr-grid">
              <div class="donate-qr-box">
                <img src="@/assets/picture/weixin.png" :alt="$t('home.supportModal.weixinAlt')" />
                <p class="donate-qr-label">{{ $t('home.supportModal.weixinLabel') }}</p>
              </div>
              <div class="donate-qr-box">
                <img src="@/assets/picture/zfb.jpg" :alt="$t('home.supportModal.alipayAlt')" />
                <p class="donate-qr-label">{{ $t('home.supportModal.alipayLabel') }}</p>
              </div>
            </div>
      </div>
    -->
  </div>
</template>

<script setup>
import { computed, ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVisitStats } from '@/composables/useVisitStats.js'
import { queryCount } from '@/api'
import { getHomeUpdateNotice } from '@/main/config/updateNoticeConfig.js'

// ✅ 条件渲染的组件懒加载
const UserBenefitsPopup = defineAsyncComponent(() =>
  import('@/main/components/popup/user/UserBenefitsPopup.vue')
)
const SupportPopup = defineAsyncComponent(() =>
  import('@/main/components/popup/SupportPopup.vue')
)
const UpdateNoticeModal = defineAsyncComponent(() =>
  import('@/components/ToastAndHelp/UpdateNoticeModal.vue')
)

const { t } = useI18n()
const router = useRouter()
const {
  todayVisits,
  totalVisits,
  ensureVisitStats
} = useVisitStats()
const featuresSection = ref(null)
const expandedCard = ref(null)
const showSupport = ref(false)
const showBenefitsPopup = ref(false)
const showUpdateNotice = ref(false)
const sourceLocationCount = ref('...')
const sourceDataCount = ref('...')

// 当前版本号和更新时间
const homeUpdateNotice = computed(() => getHomeUpdateNotice(t))
const CURRENT_VERSION = computed(() => homeUpdateNotice.value.version)
const LAST_UPDATE_DATE = computed(() => homeUpdateNotice.value.lastUpdateDate)

const projects = [
  {
    name: 'dialects-vue-frontend',
    url: 'https://github.com/jengzang/dialects-vue-frontend',
    description: t('home.intro.likeAuthor.frontendRepo')
  },
  {
    name: 'dialects-backend',
    url: 'https://github.com/jengzang/dialects-backend',
    description: t('home.intro.likeAuthor.backendRepo')
  },
  {
    name: 'dialects-build',
    url: 'https://github.com/jengzang/dialects-build',
    description: t('home.intro.likeAuthor.buildRepo')
  },
  {
    name: 'villages-ML',
    url: 'https://github.com/jengzang/villages-ML',
    description: t('home.intro.likeAuthor.villagesMLRepo')
  }
]

const localizedProjects = computed(() => [
  {
    ...projects[0],
    description: t('home.intro.likeAuthor.frontendRepo')
  },
  {
    ...projects[1],
    description: t('home.intro.likeAuthor.backendRepo')
  },
  {
    ...projects[2],
    description: t('home.intro.likeAuthor.buildRepo')
  },
  {
    ...projects[3],
    description: t('home.intro.likeAuthor.villagesMLRepo')
  }
])

function navigateTo(path) {
  router.push(path)
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
    const [locationCount, dataCount] = await Promise.all([
      queryCount({ db_key: 'query', table_name: 'dialects', filter_column: '存儲標記', filter_value: 1 }),
      queryCount({ db_key: 'dialects', table_name: 'dialects' })
    ])
    sourceLocationCount.value = locationCount
    sourceDataCount.value = dataCount
  } catch (error) {
    console.error('獲取字表統計失敗:', error)
  }
}

onMounted(() => {
  fetchVisitStats()
  fetchSourceStats()
})
</script>

<style scoped>
/* Base */
.home-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, #e0e6f6 0%, #f5f7fa 100%);
  width: 90dvw;
  margin: 0 auto;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 122, 255, 0.12);
}

.bg-gradient {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 30%, rgba(0, 122, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(0, 95, 211, 0.08) 0%, transparent 50%);
  /* 移除动画以提升性能 */
}

/* Hero */
.hero-section {
  position: relative;
  z-index: 1;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.hero-content {
  text-align: center;
  max-width: 700px;
  animation: heroFadeIn 1s cubic-bezier(0.32, 0.72, 0, 1);
}

@keyframes heroFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-logo {
  width: clamp(220px, 40vw, 380px);
  height: auto;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 12px rgba(0, 122, 255, 0.15));
  /* 移除浮动动画以提升性能 */
}

.hero-title {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 600;
  color: rgba(0, 122, 255, 0.85);
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
}

.hero-subtitle {
  font-size: clamp(0.95rem, 2vw, 1.25rem);
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 2.5rem;
  line-height: 1.5;
  font-weight: 500;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.hero-decoration {
  max-height: 100px;
  width: auto;
  opacity: 0.9;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.btn-primary, .btn-secondary {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #007aff 0%, #005ecb 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.btn-primary.btn-explore {
  background: linear-gradient(135deg, #34c759 0%, #28a745 100%);
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  background: #007aff;
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.btn-primary.btn-explore:hover {
  box-shadow: 0 6px 24px rgba(52, 199, 89, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  color: #007aff;
  border: 1.5px solid rgba(0, 122, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 122, 255, 0.5);
  transform: translateY(-2px);
}

/* Features */
.features-section {
  position: relative;
  z-index: 1;
  padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 4vw, 2.5rem);
  max-width: 1300px;
  margin: 0 auto;
}

.section-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #007aff;
}

.section-subtitle {
  text-align: center;
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 2rem;
  font-weight: 500;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(350px, 100%), 1fr));
  gap: 1.25rem;
  align-items: start;
}

.feature-card {
  background: rgba(255, 255, 255, 0.7);
  /* 移除 backdrop-filter 以大幅提升性能 */
  border-radius: 16px;
  border: 1px solid rgba(0, 122, 255, 0.15);
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.08);
  /* 简化入场动画 */
  animation: cardFadeIn 0.4s ease backwards;
}

.feature-card:nth-child(1) { animation-delay: 0.02s; }
.feature-card:nth-child(2) { animation-delay: 0.04s; }
.feature-card:nth-child(3) { animation-delay: 0.06s; }
.feature-card:nth-child(4) { animation-delay: 0.08s; }
.feature-card:nth-child(5) { animation-delay: 0.1s; }
.feature-card:nth-child(6) { animation-delay: 0.12s; }
.feature-card:nth-child(7) { animation-delay: 0.14s; }
.feature-card:nth-child(8) { animation-delay: 0.16s; }
.feature-card:nth-child(9) { animation-delay: 0.18s; }

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

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.3);
  background: rgba(255, 255, 255, 0.85);
}

.feature-card.expanded {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 122, 255, 0.35);
  box-shadow: 0 6px 18px rgba(0, 122, 255, 0.18);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.card-header:hover {
  background: rgba(0, 122, 255, 0.03);
}

.card-header:active {
  transform: scale(0.98);
}

.card-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(0, 95, 211, 0.15) 100%);
  border-radius: 12px;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.feature-card:hover .card-icon {
  transform: scale(1.2);
}

.feature-card.expanded .card-icon {
  transform: scale(1.1);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.25rem;
}

.card-desc {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

.card-arrow {
  font-size: 1.5rem;
  color: #007aff;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.feature-card.clickable {
  cursor: pointer;
}

.feature-card.clickable:hover .card-arrow {
  transform: translateX(6px);
}

.expand-toggle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #007aff;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-toggle:hover {
  background: rgba(0, 122, 255, 0.2);
  transform: scale(1.1);
}

.feature-card.expanded .expand-toggle {
  background: #007aff;
  color: white;
  transform: rotate(180deg);
}

.feature-card.expanded .expand-toggle:hover {
  transform: rotate(180deg) scale(1.1);
}

.card-body {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(0, 122, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.feature-link::after {
  content: '→';
  margin-left: auto;
  color: rgba(0, 122, 255, 0.6);
  font-size: 1.4rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

.feature-link:hover {
  background: rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
}

.feature-link:hover::after {
  color: rgba(0, 122, 255, 1);
  transform: translateX(3px);
}

.link-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.feature-link:hover .link-icon {
  transform: scale(1.1);
}

.link-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1d1d1f;
  transition: color 0.2s ease;
}

.feature-link:hover .link-text {
  color: #007aff;
}

.expand-enter-active, .expand-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: opacity, transform;
}

.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.95);
}

.expand-enter-to, .expand-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1);
}

.card-body {
  transform-origin: top;
}

/* Roadmap */
.roadmap-section {
  position: relative;
  z-index: 1;
  padding: clamp(2rem, 6vw, 4rem) clamp(1.5rem, 4vw, 2.5rem);
  max-width: 1100px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(240, 248, 255, 0.6) 100%);
  border-radius: 20px;
}

.roadmap-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: 1rem;
}

.roadmap-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 122, 255, 0.12);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.roadmap-item:hover {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(0, 122, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.08);
}

.roadmap-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.roadmap-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 95, 211, 0.12) 100%);
  border-radius: 8px;
}

.roadmap-content {
  flex: 1;
  min-width: 0;
}

.roadmap-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #007aff;
  margin: 0;
}

.roadmap-desc {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.5;
  margin: 0;
}

/* Projects */
.projects-section {
  position: relative;
  z-index: 1;
  padding: clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 2.5rem) clamp(3rem, 8vw, 6rem);
  max-width: 1300px;
  margin: 0 auto;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.project-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(0, 122, 255, 0.15);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.08);
  will-change: transform;
}

.project-card:hover {
  transform: translateY(-3px) scale(1.02);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.18);
  border-color: rgba(0, 122, 255, 0.3);
}

.project-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
}

.project-icon svg {
  width: 20px;
  height: 20px;
  color: #007aff;
}

.project-content {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.2rem;
}

.project-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

.project-arrow {
  flex-shrink: 0;
  font-size: 1.25rem;
  color: #007aff;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .project-arrow {
    display: none;
  }
}

.project-card:hover .project-arrow {
  transform: translateX(4px);
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(0, 95, 211, 0.08) 100%);
  /* 移除 backdrop-filter */
  border-radius: 16px;
  border: 1px solid rgba(0, 122, 255, 0.2);
  transition: all 0.25s ease;
}

.contact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.18);
  border-color: rgba(0, 122, 255, 0.3);
}

.contact-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.contact-content {
  flex: 1;
  min-width: 0;
}

.contact-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.25rem;
}

.contact-desc {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

.contact-btn {
  padding: 0.75rem 1.75rem;
  background: linear-gradient(135deg, #007aff 0%, #005ecb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
  flex-shrink: 0;
}

.contact-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.35);
}

/* Login Section */
.login-section {
  position: relative;
  z-index: 1;
  padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 2.5rem);
  max-width: 1300px;
  margin: 0 auto;
}

.login-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 95, 211, 0.05) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1.5px solid rgba(0, 122, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.1);
}

.login-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.18);
  border-color: rgba(0, 122, 255, 0.3);
}

.login-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.login-content {
  flex: 1;
  min-width: 0;
}

.login-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #007aff;
  margin-bottom: 0.5rem;
}

.login-desc {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.login-benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1d1d1f;
  font-weight: 500;
}

.benefit-icon {
  font-size: 1.125rem;
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

.login-btn {
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  white-space: nowrap;
}

.login-btn.primary {
  background: linear-gradient(135deg, #007aff 0%, #005ecb 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.login-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.login-btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #007aff;
  border: 1.5px solid rgba(0, 122, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

.login-btn.secondary:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 122, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.2);
}

/* Footer */
.footer {
  position: relative;
  z-index: 1;
  padding: 2.5rem clamp(1.5rem, 4vw, 2.5rem);
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 122, 255, 0.1);
}

.footer-content {
  max-width: 1300px;
  margin: 0 auto;
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.875rem;
  margin-bottom: 1.25rem;
}

.footer-link {
  font-size: 0.9375rem;
  color: #007aff;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.footer-link:hover {
  color: #005ecb;
  background: rgba(0, 122, 255, 0.08);
  text-decoration: underline;
}

.footer-divider {
  color: rgba(0, 122, 255, 0.3);
  font-weight: 300;
}

.footer-stats {
  margin-bottom: 0.75rem;
  text-align: center;
}

.footer-stats-secondary {
  margin-top: -0.2rem;
}

.stat-text {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.footer-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.footer-text {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* Modal */
.home-support-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% + var(--modal-content-padding-top) + var(--modal-content-padding-bottom));
  margin:
    calc(-1 * var(--modal-content-padding-top))
    calc(-1 * var(--modal-content-padding-inline))
    calc(-1 * var(--modal-content-padding-bottom));
  overflow: auto;
  padding: 2.5rem 2rem;
}

.home-support-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #007aff;
}

.home-support-subtitle {
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 2rem;
}

.donate-qr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.donate-qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donate-qr-box img {
  width: 100%;
  max-width: 150px;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.donate-qr-box img:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.donate-qr-label {
  margin-top: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
}

/* Responsive */
@media (orientation: portrait) {
  .hero-section { min-height: 75vh; }
  .hero-logo {
    width: clamp(260px, 50vw, 400px);
  }
  .hero-actions{
    gap: 0.75rem;
    align-items: center;
  }
  .features-grid, .projects-grid { grid-template-columns: 1fr; }
  .projects-grid { gap: 0.75rem; }
  .project-card {
    flex-direction: column;
    text-align: center;
    padding: 0.875rem 1rem;
    gap: 0.75rem;
  }
  .project-name{
    margin:0;
  }
  .contact-card {
    flex-direction: column;
    text-align: center;
    padding: 1.25rem;
    gap:10px;
  }
  .contact-title{
    margin:0;
  }
  .login-card { 
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
    gap:10px;
  }
  .login-title{
    margin:0;
  }
  .login-benefits {
    grid-template-columns: 1fr;
  }
  .login-actions {
    width: 100%;
  }
  .footer-links {  gap: 0.625rem; }
  .footer-divider { display: none; }

  /* Modal 移動端優化 */
  .home-support-shell {
    padding: 2rem 1.5rem;
  }

  .home-support-title {
    font-size: 1.5rem;
  }

  .donate-qr-box img {
    max-width: 120px;
  }
}

@media (max-width: 600px) {
  .btn-primary, .btn-secondary { padding: 0.75rem 1.75rem; font-size: 0.9375rem; }
  .card-header { padding: 1rem; }
  .card-body { padding: 0 1rem 1rem; }
  .card-title { font-size: 1.0625rem; }
  .card-icon { width: 44px; height: 44px; font-size: 1.75rem; }
  .projects-grid { gap: 0.625rem; }
  .project-card {
    padding: 0.75rem 0.875rem;
    gap: 0.625rem;
  }
  .login-card {
    padding: 1.25rem;
  }
  .login-title {
    font-size: 1.125rem;
  }
  .login-desc {
    font-size: 0.875rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .hero-logo { animation: none; }
}
</style>
