<template>
  <div class="cards-container">
    <h1 class="tabs-title like-author-title">
      {{ $t('navigation.pageTitles.support.aboutLike') }}
      <span class="follow-buttons">
        <button class="follow-button zhihu-follow" @click="followClicked">
          <img
            class="follow-logo"
            src="https://static.zhihu.com/heifetz/favicon.ico"
            alt="Zhihu"
            @error="e => e.target.src = zhihuFallback"
              />
          {{ $t('about.like.followButton') }}
        </button>
        <a class="follow-button github-follow" href="https://github.com/jengzang" target="_blank" rel="noopener noreferrer">
          <img
            class="follow-logo"
            src="https://github.githubassets.com/favicons/favicon-dark.svg"
            alt="GitHub"
            @error="e => e.target.src = githubFallback"
              />
          GitHub
        </a>
      </span>
    </h1>
    <p style="display: block; width: 100%; clear: both; margin: 0 0 0.8rem;">
      {{ $t('about.like.starMessage') }}
    </p>
    <a
      class="project-card glass-card"
      data-interactive="true"
      v-for="project in githubProjects"
      :key="project.name"
      :href="project.url"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="card-header">
        <img class="github-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
        <span class="thanks-link" style="font-weight: bold">{{ project.name }}</span>
      </div>
      <p :title="project.description">{{ splitDesc(project.description)[0] }}<span class="desc-sub">{{ splitDesc(project.description)[1] }}</span></p>
      <div class="glow-border"></div>
    </a>

    <p style="display: block; width: 100%; clear: both; margin: 1.2rem 0 0.8rem;">
      {{ $t('about.like.zhihuLike') }}
    </p>
    <a
      class="project-card glass-card"
      data-interactive="true"
      v-for="project in zhihuProjects"
      :key="project.name"
      :href="project.url"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="card-header">
        <img class="github-icon" src="https://static.zhihu.com/heifetz/favicon.ico" alt="Zhihu" />
        <span class="thanks-link" style="font-weight: bold">{{ project.name }}</span>
      </div>
      <p :title="project.description">{{ splitDesc(project.description)[0] }}<span class="desc-sub">{{ splitDesc(project.description)[1] }}</span></p>
      <div class="glow-border"></div>
    </a>

    <p style="margin-top: 2rem">
      {{ $t('about.like.supportMessage') }}
      <br />
      <button class="support-button" @click="showQRCodes = true">
        🙌 {{ $t('about.like.supportButton') }}
      </button>
      <br />
      <span class="support-note">{{ $t('about.like.supportNote') }}</span>
    </p>
    <p></p>
    <p></p>

    <!-- 感悟部分 -->
    <div class="thoughts-container">
      <h2 class="tabs-title" style="margin-top: 3rem">{{ $t('about.reflection.title') }}</h2>
      <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph1') }}</p>
      <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph2') }}</p>
      <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph3') }}</p>
      <p class="thoughts" style="text-align: center;"><em v-html="$t('about.reflection.poem')"></em></p>
    </div>
  </div>
  <SupportPopup
    :visible="showQRCodes"
    @close="showQRCodes = false"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SupportPopup from '@/main/components/user/popups/SupportPopup.vue'

const { t } = useI18n()
const showQRCodes = ref(false)

const zhihuFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0066FF"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">知</text></svg>')
const githubFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#24292f"/><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.78.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" fill="white"/></svg>')

const localizedProjects = computed(() => [
  {
    name: 'dialects-vue-frontend',
    url: 'https://github.com/jengzang/dialects-vue-frontend',
    description: t('about.like.projects.frontend.description'),
    icon: 'github'
  },
  {
    name: 'dialects-backend',
    url: 'https://github.com/jengzang/dialects-backend',
    description: t('about.like.projects.backend.description'),
    icon: 'github'
  },
  {
    name: 'dialects-build',
    url: 'https://github.com/jengzang/dialects-build',
    description: t('about.like.projects.build.description'),
    icon: 'github'
  },
  {
    name: t('about.like.projects.zhihuProject.name'),
    url: 'https://www.zhihu.com/project/detail/60225',
    description: t('about.like.projects.zhihuProject.description'),
    icon: 'zhihu'
  },
  {
    name: t('about.like.projects.zhihuColumn.name'),
    url: 'https://www.zhihu.com/column/c_1899090664681080236',
    description: t('about.like.projects.zhihuColumn.description'),
    icon: 'zhihu'
  },
])

const githubProjects = computed(() => localizedProjects.value.filter(p => p.icon !== 'zhihu'))
const zhihuProjects = computed(() => localizedProjects.value.filter(p => p.icon === 'zhihu'))

function followClicked() {
  window.open('https://www.zhihu.com/people/da-shu-18-11', '_blank')
}

function splitDesc(text) {
  const idx = text.indexOf(' - ')
  return idx === -1 ? [text, ''] : [text.slice(0, idx), text.slice(idx)]
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use './aboutShared' as *;

/* 感悟 */
.thoughts {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: transparent;
  border-radius: var(--radius-sm2);
  color: $text-primary;
  font-family: var(--font-serif);
  font-size: 18px;
  line-height: 1.8;
  text-align: left;
  text-indent: 2em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  em {
    color: var(--text-primary);
    font-weight: bold;
    text-decoration: underline;
  }
}

.thoughts-container {
  width: 100%;
  max-width: 800px;
}

/* 项目卡片 */
.cards-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

.project-card {
  position: relative;
  flex: 1 1 280px;
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 1.1rem;
  box-sizing: border-box;
  background: var(--glass-70);

  // @include glass-card;

  // border-radius: var(--radius-md);
  box-shadow: 0 2px 10px rgba(var(--color-primary-rgb), 0.08);
  color: inherit;
  text-decoration: none;

  // &:hover {
    // background: var(--glass-80);
    // box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.15);
    // transform: translateY(-6px) scale(1.01);
  // }

  p {
    margin: 0.5rem 0.5rem 0.2rem;
    overflow: hidden;
    color: var(--text-dark);
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 1rem;
    line-height: 1.6;
  }

  .desc-sub {
    color: $text-light;
    font-size: 0.85em;
  }
}

.card-header {
  @include flex-center;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
  font-size: 1.2rem;
  font-weight: bold;
}

.github-icon {
  width: 22px;
  height: 22px;
  margin-right: 0.5rem;
}

/* 关注与支持按钮 */
.like-author-title {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.follow-buttons {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.follow-button,
.support-button {
  border: none;
  border-radius: var(--radius-sm2);
  cursor: pointer;
}

.follow-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  font-size: 1.2rem;
  text-decoration: none;
  transition:
    background-color $ease-standard,
    transform 0.2s ease;
}

.follow-logo {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.zhihu-follow {
  background: rgba(0, 102, 255, 0.12);
  border: 1px solid rgba(0, 102, 255, 0.25);
  box-shadow: none;
  color: $zhihu-blue;

  @include glass-blur(6px);

  &:hover {
    background: rgba(0, 102, 255, 0.22);
    transform: scale(1.05);
  }
}

.github-follow {
  background-color: $github-dark;
  box-shadow: 0 2px 5px rgba(36, 41, 47, 0.3);
  color: var(--text-white);

  &:hover {
    background-color: var(--text-dark);
    transform: scale(1.05);
  }
}

.support-button {
  margin-top: 1rem;
  padding: 0.5rem 1.1rem;
  background-color: $danger;
  box-shadow: 0 2px 6px rgba(var(--color-error-light-rgb), 0.35);
  color: var(--text-white);
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-error-light);
    transform: scale(1.05);
  }
}

.support-note {
  display: inline-block;
  max-width: 500px;
  margin-top: 0.5rem;
  color: $text-secondary;
  font-size: 0.88rem;
  line-height: 1.5;
}

@media (max-aspect-ratio: #{1 / 1}) {
  .thoughts {
    margin: 24px auto;
    padding: 14px;
    font-size: 16px;
    line-height: 1.65;
  }

  .cards-container {
    gap: 12px;
  }

  .project-card {
    flex-basis: 100%;
    max-width: 100%;
    padding: 14px;

    p {
      margin: 6px 4px 2px;
      white-space: normal;
      font-size: 15px;
      line-height: 1.45;
    }
  }

  .card-header {
    margin-bottom: 6px;
    font-size: 18px;
  }

  .github-icon {
    width: 22px;
    height: 22px;
    margin-right: 6px;
  }

  .like-author-title {
    gap: 8px;
    flex-direction: column;
  }

  .follow-button {
    padding: 6px 12px;
    font-size: 16px;
  }

  .follow-logo {
    width: 16px;
    height: 16px;
  }

  .support-button {
    margin-top: 12px;
    padding: 7px 14px;
    font-size: 15px;
  }

  .support-note {
    font-size: 13px;
  }
}
</style>
