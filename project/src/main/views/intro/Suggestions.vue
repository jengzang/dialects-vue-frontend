<template>
  <div class="suggestion-box">
    <h2 class="tabs-title">💬 {{ $t('home.intro.suggestions.title') }}</h2>
    <p v-html="$t('home.intro.suggestions.desc')"></p>
    <p class="subtext">👇 {{ $t('home.intro.suggestions.subtext') }}</p>
    <div class="card-links">
      <a
          href="https://github.com/jengzang/dialects-js-frontend/issues"
          target="_blank"
          rel="noopener"
          class="card"
      >
        <span v-html="$t('home.intro.suggestions.frontendCard')"></span>
        <span class="thanks-link">👉 {{ $t('home.intro.suggestions.frontendLink') }}</span>
      </a>
      <a
          href="https://github.com/jengzang/dialects-build/issues"
          target="_blank"
          rel="noopener"
          class="card"
      >
        <span v-html="$t('home.intro.suggestions.buildCard')"></span>
        <span class="thanks-link">👉 {{ $t('home.intro.suggestions.buildLink') }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.suggestion-box {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  color: #1f2937; /* 深灰黑 */
  justify-content: center;
}

.suggestion-box p {
  font-size: 18px;
  color: #6b7280; /* 淺灰 */
  margin: 8px 0;
}

.subtext {
  font-size: 15px;
  color: #9ca3af;
}

.card-links {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom right, #b7cffa, #ffffff);
  padding: 20px;
  border-radius: 16px;
  text-decoration: none;
  color: black; /* 深藍，用於主內容 */
  font-weight: 600;
  font-size: 18px;
  box-shadow: 0 6px 12px rgba(0, 122, 255, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transform: scale(1);
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 122, 255, 0.2);
  border-color: #007aff;
  background: linear-gradient(to bottom right, #a5c1f6, #ffffff);
}

.card span {
  font-size: 15px;
  /* color: #003cff; Apple 藍 */
  margin-top: 10px;
  /* text-decoration: underline; */
  transition: color 0.3s ease;
}


/* 📱 Mobile Friendly */
@media (max-width: 600px) {
  .card-links {
    gap: 16px;
  }

  .card {
    font-size: 18px; /* 原本是 16px → 加大 */
    padding: 20px;
  }

  .suggestion-box p {
    font-size: 18px; /* 原本是 16px → 加大 */
  }

}

</style>
