<template>
  <div>
    <div class="cards-container">
      <h2 class="tabs-title like-author-title">
        {{ $t('home.intro.likeAuthor.title') }}
        <span class="follow-buttons">
          <button class="follow-button zhihu-follow" @click="followClicked">
            <img
              class="follow-logo"
              src="https://static.zhihu.com/heifetz/favicon.ico"
              alt="Zhihu"
              @error="e => e.target.src = zhihuFallback"
            />
            {{ $t('home.intro.likeAuthor.follow') }}
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
      </h2>
      <p style="display: block; width: 100%; clear: both; margin: 0;">
        {{ $t('home.intro.likeAuthor.starText') }}
      </p>

      <a
          class="project-card"
          v-for="project in projects"
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
      <p style="margin-top: 2rem">
        {{ $t('home.intro.likeAuthor.supportText') }}
        <br />
        <button class="support-button" @click="showQRCodes = true">
          🙌 {{ $t('home.intro.likeAuthor.supportButton') }}
        </button>
        <br />
        <span class="support-note">
          {{ $t('home.intro.likeAuthor.supportNote') }}
        </span>
      </p>
      <p></p>
      <p></p>
    </div>
    <SupportPopup
      :visible="showQRCodes"
      @close="showQRCodes = false"
    />
  </div>

</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SupportPopup from '@/main/components/popup/SupportPopup.vue'

const { t } = useI18n()
const showQRCodes = ref(false)

const zhihuFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0066FF"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">知</text></svg>')
const githubFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#24292f"/><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.78.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" fill="white"/></svg>')

const projects = computed(() => [
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
])

function followClicked() {
  window.open('https://www.zhihu.com/people/da-shu-18-11', '_blank');
}

function splitDesc(text) {
  const idx = text.indexOf(' - ')
  return idx === -1 ? [text, ''] : [text.slice(0, idx), text.slice(idx)]
}

</script>

<style scoped>
.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  text-align: center;
}

.project-card {
  position: relative;
  display: block;
  flex: 1 1 300px;
  max-width: 350px;
  border-radius: 12px;
  padding: 1.1rem;
  background: rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 2px 10px rgba(0, 122, 255, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.project-card:hover {
  transform: translateY(-6px) scale(1.01);
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #3f8eff; /* 蘋果藍，清爽版 */
}

.github-icon {
  width: 22px;
  height: 22px;
  margin-right: 0.5rem;
}

.project-card p {
  color: #444;
  line-height: 1.6;
  margin: 0.5rem 0.5rem 0.2rem;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-card .desc-sub {
  color: #999;
  font-size: 0.85em;
}

.like-author-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.follow-buttons {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.follow-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  font-size: 1.2rem;
  text-decoration: none;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.zhihu-follow {
  background: rgba(0, 102, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #0066FF;
  border: 1px solid rgba(0, 102, 255, 0.25);
  box-shadow: none;
}

.zhihu-follow:hover {
  background: rgba(0, 102, 255, 0.22);
  transform: scale(1.05);
}

.follow-logo {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.github-follow {
  background-color: #24292f;
  color: #fff;
  box-shadow: 0 2px 5px rgba(36, 41, 47, 0.3);
}

.github-follow:hover {
  background-color: #3a3f44;
  transform: scale(1.05);
}

.support-button {
  margin-top: 1rem;
  background-color: #c52f27; /* Apple-style 紅 */
  color: white!important;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.1rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.35);
  transition: all 0.2s ease;
}

.support-button:hover {
  background-color: #ff615c;
  transform: scale(1.05);
}


.support-note {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.5;
  max-width: 500px;
}


/* ✅ 手機版適配 */
@media (max-width: 600px) {
  .project-card {
    padding: 1.5rem;
  }

  .card-header {
    font-size: 1.4rem;
  }

  .project-card p {
    font-size: 1.1rem;
  }

  .github-icon {
    width: 24px;
    height: 24px;
  }
}

</style>
