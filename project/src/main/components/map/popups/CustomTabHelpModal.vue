<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :title="t('map.customTab.helpModal.title')"
    :close-label="t('common.button.close')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="help-content">
      <section class="help-section">
        <h4 class="section-title">
          🌟 {{ t('map.customTab.helpModal.sections.overview.title') }}
        </h4>

        <ul class="help-list">
          <li
            v-for="item in helpOverviewItems"
            :key="item.key"
          >
            <strong>{{ item.label }}</strong>{{ item.text }}
          </li>
        </ul>
      </section>

      <section class="help-section help-section--blue">
        <h4 class="section-title">
          🎨 {{ t('map.customTab.helpModal.sections.fieldGuide.title') }}
        </h4>

        <ul class="help-list">
          <li
            v-for="item in helpFieldGuideItems"
            :key="item.key"
          >
            <strong>{{ item.label }}</strong>{{ item.text }}
          </li>
        </ul>

        <div class="example-hint">
          <ul>
            <li
              v-for="example in helpFieldGuideExamples"
              :key="example"
            >
              {{ example }}
            </li>
          </ul>
        </div>

        <div class="table-container">
          <table class="example-table">
            <thead>
              <tr>
                <th style="min-width: 60px">簡稱</th>
                <th style="min-width: 40px">分區</th>
                <th style="min-width: 90px">經緯度</th>
                <th style="min-width: 50px">聲韻調</th>
                <th style="min-width: 30px">特徵</th>
                <th style="min-width: 40px">值</th>
                <th style="min-width: 60px">說明</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td class="highlight-location">陽春圭崗</td>
                <td class="highlight-region">嶺南</td>
                <td class="highlight-geo">111.742615,22.35676</td>
                <td>韻母</td>
                <td><strong>豪</strong></td>
                <td>
                  <span class="value-tag">ɐu</span>
                </td>
                <td class="note-text">個人田調</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="help-section help-section--blue">
        <h4 class="section-title">
          💫 {{ t('map.customTab.helpModal.sections.customCollection.title') }}
        </h4>

        <p class="help-paragraph">
          {{ t('map.customTab.helpModal.sections.customCollection.intro') }}
        </p>

        <ul class="help-list">
          <li
            v-for="item in helpCollectionItems"
            :key="item.key"
          >
            <strong>{{ item.label }}</strong>{{ item.text }}
          </li>
        </ul>

        <div class="example-hint">
          <ul>
            <li
              v-for="note in helpCollectionNotes"
              :key="note"
            >
              {{ note }}
            </li>
          </ul>
        </div>

        <div class="table-container">
          <table class="example-table">
            <thead>
              <tr>
                <th style="min-width: 60px">簡稱</th>
                <th style="min-width: 30px">分區</th>
                <th style="min-width: 70px">經緯度</th>
                <th style="min-width: 50px">聲韻調</th>
                <th style="min-width: 30px">特徵</th>
                <th style="min-width: 40px">值</th>
                <th style="min-width: 60px">說明</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  rowspan="5"
                  class="highlight-location"
                >
                  陽春雙滘
                </td>
                <td
                  rowspan="10"
                  class="highlight-region"
                >
                  2025田調
                </td>
                <td
                  rowspan="5"
                  class="highlight-geo"
                >
                  111.332451,<br>22.109056
                </td>
                <td>韻母</td>
                <td><strong>止·精組·開</strong></td>
                <td>
                  <span class="value-tag">ei/i</span>
                </td>
                <td class="note-text">兩讀</td>
              </tr>

              <tr>
                <td>聲母</td>
                <td><strong>來</strong></td>
                <td>
                  <span class="value-tag">l</span>
                </td>
                <td class="note-text" />
              </tr>

              <tr>
                <td>調值</td>
                <td><strong>陰去</strong></td>
                <td>
                  <span class="value-tag">53</span>
                </td>
                <td class="note-text">可能是受涯話影響</td>
              </tr>

              <tr>
                <td>詞彙</td>
                <td><strong>昨天</strong></td>
                <td>
                  <span class="value-tag">從日</span>
                </td>
                <td class="note-text">ʦuŋ21 ȵɐt51</td>
              </tr>

              <tr>
                <td>詞彙</td>
                <td><strong>玩耍</strong></td>
                <td>
                  <span class="value-tag">嬲</span>
                </td>
                <td class="note-text">liɛu53</td>
              </tr>

              <tr>
                <td
                  rowspan="5"
                  class="highlight-location"
                >
                  阳春合水
                </td>
                <td
                  rowspan="5"
                  class="highlight-geo"
                >
                  111.856357,<br>22.289037
                </td>
                <td>韻母</td>
                <td><strong>止·精組·開</strong></td>
                <td>
                  <span class="value-tag">ei</span>
                </td>
                <td class="note-text">兩陽的特點</td>
              </tr>

              <tr>
                <td>泥來母</td>
                <td><strong>來母</strong></td>
                <td>
                  <span class="value-tag">l</span>
                </td>
                <td class="note-text" />
              </tr>

              <tr>
                <td>調值</td>
                <td><strong>陰去</strong></td>
                <td>
                  <span class="value-tag">33</span>
                </td>
                <td class="note-text" />
              </tr>

              <tr>
                <td>詞彙</td>
                <td><strong>昨天</strong></td>
                <td>
                  <span class="value-tag">撞日</span>
                </td>
                <td class="note-text">tsoŋ53 ŋɐt53</td>
              </tr>

              <tr>
                <td>詞彙</td>
                <td><strong>玩耍</strong></td>
                <td>
                  <span class="value-tag">耍</span>
                </td>
                <td class="note-text">ʃa323</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="help-section help-section--blue">
        <h4 class="section-title">
          💡 {{ t('map.customTab.helpModal.sections.dailyUsage.title') }}
        </h4>

        <p class="help-paragraph">
          {{ t('map.customTab.helpModal.sections.dailyUsage.intro') }}
        </p>

        <ul class="help-list help-list--daily">
          <li>
            📁 <strong>「聲韻調/類別」即文件夾：</strong>比如填入
            <code>我的探店地圖</code>。
          </li>
          <li>
            🏷️ <strong>「特徵」即分類：</strong>比如填入
            <code>咖啡館</code>、<code>火鍋店</code> 或 <code>燒烤攤</code>。
          </li>
          <li>
            📍 <strong>「簡稱」即名字：</strong>可以填入景點/店鋪名稱（如<code>時光咖啡館</code>）。
          </li>
          <li>
            ✅️ <strong>「值」即標記：</strong>可以填入評分（如<code>9分</code>）或簡介。
          </li>
        </ul>

        <div class="usage-diagram">
          <div class="usage-level region-level">
            <div class="level-icon">📂</div>
            <div class="level-content">
              <div class="field-tag">
                {{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.label') }}
              </div>
              <div class="usage-text">
                {{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.text') }}
              </div>
              <div class="usage-example">
                {{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.example') }}
              </div>
            </div>
          </div>

          <div class="connector-line">
            ⬇️ {{ t('map.customTab.helpModal.sections.dailyUsage.connectors.regionToLocation') }}
          </div>

          <div class="usage-level location-level">
            <div class="level-icon">📍</div>
            <div class="level-content">
              <div class="field-tag">
                {{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.label') }}
              </div>
              <div class="usage-text">
                {{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.text') }}
              </div>
              <div class="usage-example">
                {{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.example') }}
              </div>
            </div>
          </div>

          <div class="connector-line">
            ⬇️ {{ t('map.customTab.helpModal.sections.dailyUsage.connectors.locationToData') }}
          </div>

          <div class="usage-level data-level">
            <div class="level-group">
              <div class="sub-level feature-box">
                <div class="level-icon-sm">🏷️</div>
                <div>
                  <div class="field-tag-sm">
                    {{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.label') }}
                  </div>
                  <div class="usage-text-sm">
                    {{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.text') }}
                  </div>
                  <div class="usage-example-sm">
                    {{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.example') }}
                  </div>
                </div>
              </div>

              <div class="arrow-right">👉</div>

              <div class="sub-level value-box">
                <div class="level-icon-sm">💬</div>
                <div>
                  <div class="field-tag-sm">
                    {{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.label') }}
                  </div>
                  <div class="usage-text-sm">
                    {{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.text') }}
                  </div>
                  <div class="usage-example-sm">
                    {{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.example') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="example-hint example-hint--result">
          ✨ {{ t('map.customTab.helpModal.sections.dailyUsage.result') }}
        </p>
      </section>

      <section class="help-section help-section--blue">
        <h4 class="section-title">
          📋 {{ t('map.customTab.helpModal.sections.searchMapping.title') }}
        </h4>

        <p class="help-paragraph">
          {{ t('map.customTab.helpModal.sections.searchMapping.intro') }}
        </p>

        <div class="table-container">
          <table class="example-table">
            <thead>
              <tr>
                <th>{{ t('map.customTab.helpModal.sections.searchMapping.columns.scene') }}</th>
                <th>{{ t('map.customTab.helpModal.sections.searchMapping.columns.phonology') }}</th>
                <th>{{ t('map.customTab.helpModal.sections.searchMapping.columns.feature') }}</th>
                <th>{{ t('map.customTab.helpModal.sections.searchMapping.columns.value') }}</th>
                <th>{{ t('map.customTab.helpModal.sections.searchMapping.columns.desc') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in searchMappingRows" :key="row.scene">
                <td><strong>{{ row.scene }}</strong></td>
                <td>{{ row.phonology }}</td>
                <td>{{ row.feature }}</td>
                <td>{{ row.value }}</td>
                <td class="note-text">{{ row.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="example-hint">
          {{ t('map.customTab.helpModal.sections.searchMapping.note') }}
        </p>
      </section>

      <section class="help-section help-section--blue">
        <h4 class="section-title">
          📍 {{ t('map.customTab.helpModal.sections.steps.title') }}
        </h4>

        <ul class="help-list">
          <li
            v-for="item in helpStepsItems"
            :key="item.key"
          >
            <strong>{{ item.label }}</strong>{{ item.text }}
          </li>
        </ul>
      </section>
    </div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const helpOverviewItems = computed(() => [
  {
    key: 'privateSpace',
    label: t('map.customTab.helpModal.sections.overview.items.privateSpace.label'),
    text: t('map.customTab.helpModal.sections.overview.items.privateSpace.text'),
  },
  {
    key: 'mapRendering',
    label: t('map.customTab.helpModal.sections.overview.items.mapRendering.label'),
    text: t('map.customTab.helpModal.sections.overview.items.mapRendering.text'),
  },
]);

const helpFieldGuideItems = computed(() => [
  {
    key: 'feature',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.feature.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.feature.text'),
  },
  {
    key: 'value',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.value.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.value.text'),
  },
  {
    key: 'featureType',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.featureType.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.featureType.text'),
  },
  {
    key: 'location',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.location.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.location.text'),
  },
  {
    key: 'region',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.region.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.region.text'),
  },
]);

const helpFieldGuideExamples = computed(() => [
  t('map.customTab.helpModal.sections.fieldGuide.examples.middleChinese'),
  t('map.customTab.helpModal.sections.fieldGuide.examples.personalCorpus'),
]);

const helpCollectionItems = computed(() => [
  {
    key: 'region',
    label: t('map.customTab.helpModal.sections.customCollection.items.region.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.region.text'),
  },
  {
    key: 'featureType',
    label: t('map.customTab.helpModal.sections.customCollection.items.featureType.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.featureType.text'),
  },
  {
    key: 'feature',
    label: t('map.customTab.helpModal.sections.customCollection.items.feature.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.feature.text'),
  },
  {
    key: 'value',
    label: t('map.customTab.helpModal.sections.customCollection.items.value.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.value.text'),
  },
]);

const helpCollectionNotes = computed(() => [
  t('map.customTab.helpModal.sections.customCollection.notes.scope'),
  t('map.customTab.helpModal.sections.customCollection.notes.search'),
  t('map.customTab.helpModal.sections.customCollection.notes.display'),
]);

const searchMappingRows = computed(() => [
  {
    scene: t('map.customTab.helpModal.sections.searchMapping.rows.chars.scene'),
    phonology: t('map.customTab.helpModal.sections.searchMapping.rows.chars.phonology'),
    feature: t('map.customTab.helpModal.sections.searchMapping.rows.chars.feature'),
    value: t('map.customTab.helpModal.sections.searchMapping.rows.chars.value'),
    desc: t('map.customTab.helpModal.sections.searchMapping.rows.chars.desc'),
  },
  {
    scene: t('map.customTab.helpModal.sections.searchMapping.rows.tones.scene'),
    phonology: t('map.customTab.helpModal.sections.searchMapping.rows.tones.phonology'),
    feature: t('map.customTab.helpModal.sections.searchMapping.rows.tones.feature'),
    value: t('map.customTab.helpModal.sections.searchMapping.rows.tones.value'),
    desc: t('map.customTab.helpModal.sections.searchMapping.rows.tones.desc'),
  },
  {
    scene: t('map.customTab.helpModal.sections.searchMapping.rows.zhongGu.scene'),
    phonology: t('map.customTab.helpModal.sections.searchMapping.rows.zhongGu.phonology'),
    feature: t('map.customTab.helpModal.sections.searchMapping.rows.zhongGu.feature'),
    value: t('map.customTab.helpModal.sections.searchMapping.rows.zhongGu.value'),
    desc: t('map.customTab.helpModal.sections.searchMapping.rows.zhongGu.desc'),
  },
  {
    scene: t('map.customTab.helpModal.sections.searchMapping.rows.yinWei.scene'),
    phonology: t('map.customTab.helpModal.sections.searchMapping.rows.yinWei.phonology'),
    feature: t('map.customTab.helpModal.sections.searchMapping.rows.yinWei.feature'),
    value: t('map.customTab.helpModal.sections.searchMapping.rows.yinWei.value'),
    desc: t('map.customTab.helpModal.sections.searchMapping.rows.yinWei.desc'),
  },
]);

const helpStepsItems = computed(() => [
  {
    key: 'mode',
    label: t('map.customTab.helpModal.sections.steps.items.mode.label'),
    text: t('map.customTab.helpModal.sections.steps.items.mode.text'),
  },
  {
    key: 'coordinates',
    label: t('map.customTab.helpModal.sections.steps.items.coordinates.label'),
    text: t('map.customTab.helpModal.sections.steps.items.coordinates.text'),
  },
  {
    key: 'save',
    label: t('map.customTab.helpModal.sections.steps.items.save.label'),
    text: t('map.customTab.helpModal.sections.steps.items.save.text'),
  },
]);
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-blue: var(--color-primary);
$primary-blue-dark: var(--color-primary-hover);
$success-green: var(--color-success);
$usage-green: var(--color-success);
$location-orange: var(--color-warning);

$text-main: var(--text-dark);
$text-secondary: var(--text-medium);
$text-muted: var(--text-lightest);

$glass-card: var(--glass-50);

.help-content {
  @include flex-col;
  gap: 20px;
}

.help-section {
  padding: 15px;
  background: $glass-card;
  border-radius: var(--radius-md);

  &--blue {
    border-left: 4px solid $primary-blue;
  }
}

.section-title {
  margin: 0 0 12px;
  color: $primary-blue;
  font-size: 16px;
  font-weight: 600;
}

.help-list {
  margin: 0;
  padding: 0;
  list-style: none;

  &--daily {
    margin-top: 8px;
  }

  li {
    padding: 8px 0;
    color: $text-secondary;
    font-size: 14px;
    line-height: 1.6;

    strong {
      color: $text-main;
      font-weight: 600;
    }

    code {
      padding: 1px 5px;
      background: rgba(var(--color-primary-rgb), 0.08);
      border-radius: var(--radius-xs);
      color: $primary-blue-dark;
      font-size: 12px;
    }
  }
}

.help-paragraph {
  margin: 0 0 12px;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.6;
}

.example-hint {
  padding: 8px 12px;
  background: var(--bg-hover-light);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 12px;

  &--result {
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  li {
    margin-bottom: 4px;
  }
}

/* 示例表格 */
.table-container {
  margin-bottom: 8px;
  overflow-x: auto;
  background: var(--bg-white);
  border: 1px solid var(--border-light-gray);
  border-radius: var(--radius-sm2);
}

.example-table {
  width: 100%;
  min-width: 500px;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;

  th {
    padding: 8px 6px;
    background-color: var(--bg-light-gray);
    border-bottom: 2px solid var(--border-gray);
    color: $text-main;
    white-space: nowrap;
    font-weight: 600;
  }

  td {
    padding: 8px 6px;
    border-right: 1px solid var(--bg-light);
    border-bottom: 1px solid var(--border-divider);
    color: $text-secondary;
    vertical-align: middle;

    &:last-child {
      border-right: none;
    }
  }
}

.highlight-location {
  background-color: var(--bg-warning-light);
  color: $text-main;
  font-weight: 700;
}

.highlight-region {
  background-color: var(--bg-blue-tint);
  color: $primary-blue;
  font-weight: 600;
}

.highlight-geo {
  background-color: var(--bg-light-gray);
  color: var(--text-muted);
  font-family: monospace;
  font-size: 11px;
}

.value-tag {
  display: inline-block;
  padding: 1px 6px;
  background: rgba(var(--color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-xs);
  color: $primary-blue-dark;
  font-weight: 700;
}

.note-text {
  color: $text-muted;
  font-size: 11px;
  font-style: italic;
}

/* 使用方式示意图 */
.usage-diagram {
  @include flex-col;
  align-items: center;
  padding: 10px;
  border-radius: var(--radius-md);
}

.usage-level {
  position: relative;
  width: 90%;
  max-width: 400px;
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.region-level {
  border-left: 5px solid $primary-blue;
}

.location-level {
  border-left: 5px solid $location-orange;
}

.data-level {
  flex-direction: column;
  padding: 10px;
  border-left: 5px solid $success-green;
}

.level-icon {
  width: 30px;
  margin-right: 15px;
  text-align: center;
  font-size: 24px;
}

.level-content {
  flex: 1;
}

.field-tag {
  margin-bottom: 4px;
  color: $text-main;
  font-size: 14px;
  font-weight: 700;
}

.usage-text {
  margin-bottom: 4px;
  color: $text-secondary;
  font-size: 13px;
}

.usage-example {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(var(--color-primary-rgb), 0.08);
  border-radius: var(--radius-xs);
  color: $primary-blue;
  font-family: monospace;
  font-size: 12px;
}

.connector-line {
  position: relative;
  margin: 8px 0;
  color: $text-muted;
  font-size: 12px;
  font-weight: 700;
}

.level-group {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sub-level {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--bg-success-light);
  border-radius: var(--radius-sm);
}

.feature-box {
  margin-right: 5px;
}

.value-box {
  margin-left: 5px;
}

.level-icon-sm {
  margin-right: 8px;
  font-size: 18px;
}

.field-tag-sm {
  color: $usage-green;
  font-size: 12px;
  font-weight: 700;
}

.usage-text-sm {
  color: $text-secondary;
  font-size: 11px;
}

.usage-example-sm {
  margin-top: 2px;
  color: $usage-green;
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
}

.arrow-right {
  margin: 0 4px;
  color: $text-muted;
  font-size: 14px;
}

/* 竖屏 */
@media (max-aspect-ratio: 1/1) {
  .help-section {
    padding: 12px;
  }

  .level-group {
    gap: 8px;
  }

  .sub-level {
    padding: 7px;
  }
}
</style>
