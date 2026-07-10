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

```vue

$primary-blue: var(--color-primary);
$primary-blue-dark: var(--color-primary-hover);
$purple: var(--color-purple);
$warning-yellow: #ffcc00;

$text-primary: var(--text-primary);
$text-secondary: var(--text-dark);
$text-muted: var(--text-tertiary);
$white: #fff;

$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 20px;

$transition-base: 0.3s;

.privacy-container {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(
    135deg,
    rgba(240, 248, 255, 0.8),
    rgba(230, 240, 255, 0.6)
  );

  @media (max-width: 768px) {
    padding: 20px 10px;
  }
}

.privacy-content {
  width: 100%;
  max-width: 900px;
  padding: 40px;
  border-radius: $radius-lg;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 24px;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  margin-bottom: 30px;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

.title {
  margin: 0;
  color: $text-primary;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, $primary-blue, $purple);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 24px;
  }
}

.content-section {
  animation: fade-in 0.5s ease-in;
}

.section {
  margin-bottom: 40px;

  h2 {
    padding-bottom: 10px;
    margin-bottom: 20px;
    color: $text-primary;
    font-size: 24px;
    font-weight: 700;
    border-bottom: 2px solid rgba(0, 122, 255, 0.15);

    @media (max-width: 768px) {
      font-size: 20px;
    }
  }

  h3 {
    margin-top: 24px;
    margin-bottom: 12px;
    color: $text-secondary;
    font-size: 18px;
    font-weight: 600;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  p {
    color: $text-secondary;
    font-size: 15px;
    line-height: 1.8;
  }

  ul {
    padding-left: 24px;
    margin: 16px 0;
  }

  li {
    margin-bottom: 8px;
    color: $text-secondary;
    font-size: 15px;
    line-height: 1.8;
  }
}

.citation-box {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  margin: 20px 0;
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.05),
    rgba(88, 86, 214, 0.05)
  );
  border-left: 4px solid $primary-blue;
  border-radius: $radius-md;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.citation-text {
  flex: 1;
  margin: 0;
  color: $text-primary;
  font-size: 16px;
  font-style: italic;
  font-weight: 500;

  a {
    color: $primary-blue;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.copy-btn {
  padding: 10px 20px;
  color: $white;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    $primary-blue,
    $primary-blue-dark
  );
  border: none;
  border-radius: $radius-sm;
  transition: all $transition-base;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
}

.note {
  padding: 12px;
  margin-top: 12px;
  color: $text-muted;
  font-size: 14px;
  font-style: italic;
  background: rgba(0, 122, 255, 0.03);
  border-radius: $radius-sm;
}

.update-note {
  padding: 16px;
  margin-top: 24px;
  font-size: 14px;
  background: rgba(255, 204, 0, 0.1);
  border-left: 4px solid $warning-yellow;
  border-radius: $radius-sm;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

```

