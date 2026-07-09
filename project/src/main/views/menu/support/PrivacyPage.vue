<script setup>
import { useI18n } from 'vue-i18n'
import { showSuccess } from '@/utils/message.js'

const { t } = useI18n()

const copyCitation = () => {
  navigator.clipboard.writeText(t('privacy.citation.text'))
  showSuccess(t('privacy.citation.copySuccess'))
}
</script>

<template>
  <div class="privacy-container">
    <div class="privacy-content glass-container glass-container-soft">
      <!-- 标题和语言切换 -->
      <div class="header">
        <h1 class="title">📜 {{ t('privacy.title') }}</h1>
      </div>

      <div class="content-section">
        <!-- 引用建议 -->
        <section class="section">
          <h2>📖 {{ t('privacy.citation.title') }}</h2>
          <div class="citation-box">
            <p class="citation-text">
              {{ t('privacy.citation.text') }}
            </p>
            <button class="copy-btn" @click="copyCitation">
              📋 {{ t('privacy.citation.copyButton') }}
            </button>
          </div>
          <p class="note">
            {{ t('privacy.citation.note') }}
          </p>
        </section>

        <!-- 隐私政策 -->
        <section class="section">
          <h2>🔒 {{ t('privacy.privacy.title') }}</h2>

          <h3>{{ t('privacy.privacy.dataCollection.title') }}</h3>
          <p>
            {{ t('privacy.privacy.dataCollection.intro') }}
          </p>
          <ul>
            <li v-html="t('privacy.privacy.dataCollection.minimal')"></li>
            <li v-html="t('privacy.privacy.dataCollection.noPersonal')"></li>
            <li v-html="t('privacy.privacy.dataCollection.security')"></li>
          </ul>

          <h3>{{ t('privacy.privacy.cookies.title') }}</h3>
          <p>
            {{ t('privacy.privacy.cookies.intro') }}
          </p>
          <ul>
            <li>{{ t('privacy.privacy.cookies.login') }}</li>
            <li>{{ t('privacy.privacy.cookies.analytics') }}</li>
            <li>{{ t('privacy.privacy.cookies.personalization') }}</li>
          </ul>
          <p class="note">
            {{ t('privacy.privacy.cookies.note') }}
          </p>

          <h3>{{ t('privacy.privacy.commitment.title') }}</h3>
          <p>
            {{ t('privacy.privacy.commitment.intro') }}
          </p>
          <ul>
            <li v-html="t('privacy.privacy.commitment.noSell')"></li>
            <li v-html="t('privacy.privacy.commitment.noLeak')"></li>
            <li v-html="t('privacy.privacy.commitment.review')"></li>
            <li v-html="t('privacy.privacy.commitment.transparent')"></li>
          </ul>

          <h3>{{ t('privacy.privacy.rights.title') }}</h3>
          <p>
            {{ t('privacy.privacy.rights.intro') }}
          </p>
          <ul>
            <li>{{ t('privacy.privacy.rights.know') }}</li>
            <li>{{ t('privacy.privacy.rights.correct') }}</li>
            <li>{{ t('privacy.privacy.rights.optOut') }}</li>
          </ul>

          <h3>{{ t('privacy.privacy.contact.title') }}</h3>
          <p>
            {{ t('privacy.privacy.contact.intro') }}
          </p>
          <ul>
            <li>{{ t('privacy.privacy.contact.website') }}<a href="https://dialects.yzup.top" target="_blank">https://dialects.yzup.top</a></li>
            <li>{{ t('privacy.privacy.contact.github') }}<a href="https://github.com/jengzang" target="_blank">https://github.com/jengzang</a></li>
            <li>{{ t('privacy.privacy.contact.zhihu') }}<a href="https://www.zhihu.com/people/da-shu-18-11" target="_blank">https://www.zhihu.com/people/da-shu-18-11</a></li>
          </ul>

          <p class="update-note" v-html="t('privacy.privacy.lastUpdated')"></p>
        </section>

        <!-- 免责声明 -->
        <section class="section">
          <h2>⚠️ {{ t('privacy.disclaimer.title') }}</h2>
          <p>
            {{ t('privacy.disclaimer.text') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-container {
  width: 100%;
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8), rgba(230, 240, 255, 0.6));
}

.privacy-content {
  max-width: 900px;
  width: 100%;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.glass-container {
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  background: linear-gradient(135deg, #007aff, #5856d6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content-section {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(0, 122, 255, 0.15);
}

.section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-top: 24px;
  margin-bottom: 12px;
}

.section p {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
}

.section ul {
  margin: 16px 0;
  padding-left: 24px;
}

.section li {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 8px;
}

.citation-box {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(88, 86, 214, 0.05));
  border-left: 4px solid #007aff;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.citation-text {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin: 0;
  flex: 1;
  font-style: italic;
}

.citation-text a {
  color: #007aff;
  text-decoration: none;
}

.citation-text a:hover {
  text-decoration: underline;
}

.copy-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
}

.note {
  font-size: 14px;
  color: #666;
  font-style: italic;
  padding: 12px;
  background: rgba(0, 122, 255, 0.03);
  border-radius: 8px;
  margin-top: 12px;
}

.update-note {
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 204, 0, 0.1);
  border-left: 4px solid #ffcc00;
  border-radius: 8px;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .privacy-container {
    padding: 20px 10px;
  }

  .privacy-content {
    padding: 24px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .title {
    font-size: 24px;
  }

  .citation-box {
    flex-direction: column;
    align-items: stretch;
  }

  .copy-btn {
    width: 100%;
  }

  .section h2 {
    font-size: 20px;
  }

  .section h3 {
    font-size: 16px;
  }
}
</style>
