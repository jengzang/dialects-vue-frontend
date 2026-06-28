<template>
  <div class="derive-tool-page">
    <div class="glass-container glass-container-shell derive-tool-shell">
      <header class="derive-tool-hero">
        <div class="derive-tool-hero__badge">{{ t('tools.derive.page.badge') }}</div>
        <h2 class="derive-tool-hero__title">{{ t('tools.derive.page.title') }}</h2>
        <p class="derive-tool-hero__subtitle">{{ t('tools.derive.page.subtitle') }}</p>
      </header>

      <section class="derive-tool-grid">
        <article class="derive-tool-card derive-tool-card--primary">
          <h3 class="derive-tool-card__title">{{ t('tools.derive.sections.workflow.title') }}</h3>
          <p class="derive-tool-card__desc">{{ t('tools.derive.sections.workflow.desc') }}</p>
          <ol class="derive-tool-steps">
            <li v-for="step in workflowSteps" :key="step.key" class="derive-tool-step">
              <span class="derive-tool-step__index">{{ step.index }}</span>
              <div class="derive-tool-step__body">
                <div class="derive-tool-step__title">{{ step.title }}</div>
                <div class="derive-tool-step__desc">{{ step.desc }}</div>
              </div>
            </li>
          </ol>
        </article>

        <article class="derive-tool-card">
          <h3 class="derive-tool-card__title">{{ t('tools.derive.sections.inputs.title') }}</h3>
          <p class="derive-tool-card__desc">{{ t('tools.derive.sections.inputs.desc') }}</p>
          <ul class="derive-tool-list">
            <li v-for="item in inputItems" :key="item" class="derive-tool-list__item">
              <span class="derive-tool-list__dot"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>

        <article class="derive-tool-card">
          <h3 class="derive-tool-card__title">{{ t('tools.derive.sections.outputs.title') }}</h3>
          <p class="derive-tool-card__desc">{{ t('tools.derive.sections.outputs.desc') }}</p>
          <div class="derive-tool-tags">
            <span v-for="tag in outputTags" :key="tag" class="derive-tool-tag">{{ tag }}</span>
          </div>
        </article>

        <article class="derive-tool-card derive-tool-card--muted">
          <h3 class="derive-tool-card__title">{{ t('tools.derive.sections.status.title') }}</h3>
          <p class="derive-tool-card__desc">{{ t('tools.derive.sections.status.desc') }}</p>
          <div class="derive-tool-placeholder">
            <div class="derive-tool-placeholder__icon">🧪</div>
            <div class="derive-tool-placeholder__text">{{ t('tools.derive.sections.status.placeholder') }}</div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const workflowSteps = computed(() => [
  {
    key: 'source',
    index: '01',
    title: t('tools.derive.sections.workflow.steps.source.title'),
    desc: t('tools.derive.sections.workflow.steps.source.desc')
  },
  {
    key: 'rules',
    index: '02',
    title: t('tools.derive.sections.workflow.steps.rules.title'),
    desc: t('tools.derive.sections.workflow.steps.rules.desc')
  },
  {
    key: 'result',
    index: '03',
    title: t('tools.derive.sections.workflow.steps.result.title'),
    desc: t('tools.derive.sections.workflow.steps.result.desc')
  }
])

const inputItems = computed(() => [
  t('tools.derive.sections.inputs.items.seedTable'),
  t('tools.derive.sections.inputs.items.phonologyPreset'),
  t('tools.derive.sections.inputs.items.validationConfig')
])

const outputTags = computed(() => [
  t('tools.derive.sections.outputs.tags.derivedTable'),
  t('tools.derive.sections.outputs.tags.ruleTrace'),
  t('tools.derive.sections.outputs.tags.reviewChecklist')
])
</script>

<style scoped lang="scss">
.derive-tool-page {
  min-height: 100vh;
  padding: clamp(24px, 4vw, 40px);
}

.derive-tool-shell {
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: clamp(24px, 4vw, 40px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.derive-tool-hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.derive-tool-hero__badge {
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0, 122, 255, 0.12);
  border: 1px solid rgba(0, 122, 255, 0.18);
  color: #005ecb;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.derive-tool-hero__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #1d1d1f;
}

.derive-tool-hero__subtitle {
  margin: 0;
  max-width: 720px;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(29, 29, 31, 0.72);
}

.derive-tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.derive-tool-card {
  padding: 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(0, 122, 255, 0.12);
  box-shadow: 0 10px 28px rgba(0, 122, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.derive-tool-card--primary {
  grid-column: span 2;
}

.derive-tool-card--muted {
  background: linear-gradient(135deg, rgba(244, 248, 255, 0.92), rgba(255, 255, 255, 0.84));
}

.derive-tool-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
}

.derive-tool-card__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(29, 29, 31, 0.68);
}

.derive-tool-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.derive-tool-step {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(0, 122, 255, 0.06);
  border: 1px solid rgba(0, 122, 255, 0.08);
}

.derive-tool-step__index {
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 700;
  color: #007aff;
}

.derive-tool-step__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.derive-tool-step__title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

.derive-tool-step__desc {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(29, 29, 31, 0.64);
}

.derive-tool-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.derive-tool-list__item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #1d1d1f;
}

.derive-tool-list__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007aff;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.12);
  flex: 0 0 auto;
}

.derive-tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.derive-tool-tag {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 122, 255, 0.14);
  color: #005ecb;
  font-size: 13px;
  font-weight: 600;
}

.derive-tool-placeholder {
  min-height: 160px;
  border-radius: 18px;
  border: 1px dashed rgba(0, 122, 255, 0.22);
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 20px;
}

.derive-tool-placeholder__icon {
  font-size: 32px;
}

.derive-tool-placeholder__text {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(29, 29, 31, 0.68);
}

@media (max-width: 900px) {
  .derive-tool-grid {
    grid-template-columns: 1fr;
  }

  .derive-tool-card--primary {
    grid-column: auto;
  }

  .derive-tool-steps {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .derive-tool-page {
    padding: 16px;
  }

  .derive-tool-shell {
    padding: 20px;
    border-radius: 20px;
  }

  .derive-tool-card {
    padding: 18px;
    border-radius: 18px;
  }
}
</style>
