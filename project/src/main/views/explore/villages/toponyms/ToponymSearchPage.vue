<template>
  <main class="toponym-search-page glass-shell">
    <section class="toponym-search-page__header glass-panel">
      <div class="toponym-search-page__copy">
        <h1>{{ t('villages.pages.toponymSearch.title') }}</h1>
        <p>{{ t('villages.pages.toponymSearch.subtitle') }}</p>
      </div>

      <form class="toponym-search-page__form" @submit.prevent="handleSearch">
        <label class="toponym-search-page__field toponym-search-page__field--query">
          <span>{{ t('villages.pages.toponymSearch.search.keyword') }}</span>
          <input
            v-model="query"
            class="glass-field"
            data-shape="search"
            type="text"
            autocomplete="off"
            :placeholder="t('villages.pages.toponymSearch.search.placeholder')"
          />
        </label>

        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.matchMode') }}</span>
          <SimpleSelectDropdown
            v-model="matchMode"
            :options="matchModeOptions"
            match-trigger-width
            width="100%"
          />
        </label>

        <div class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.placeType') }}</span>
          <button
            ref="placeTypeTriggerEl"
            class="toponym-search-page__select-trigger select-trigger"
            :class="{ 'is-open': placeTypeDropdownOpen }"
            type="button"
            @click="placeTypeDropdownOpen = !placeTypeDropdownOpen"
          >
            <span class="select-label">{{ placeTypeTriggerLabel }}</span>
            <span class="select-arrow" aria-hidden="true">⌄</span>
          </button>
          <MultiSelectDropdown
            v-if="placeTypeDropdownOpen"
            :model-value="selectedPlaceTypeCodes"
            :options="placeTypeOptions"
            :trigger-el="placeTypeTriggerEl"
            align="left"
            direction="down"
            @update:model-value="selectedPlaceTypeCodes = $event"
            @close="placeTypeDropdownOpen = false"
          />
        </div>

        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.areaCode') }}</span>
          <input
            v-model="areaCode"
            class="glass-field"
            type="text"
            autocomplete="off"
            :placeholder="t('villages.pages.toponymSearch.search.areaCodePlaceholder')"
          />
        </label>

        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.areaScope') }}</span>
          <SimpleSelectDropdown
            v-model="areaScope"
            :options="areaScopeOptions"
            :disabled="!areaCode.trim()"
            match-trigger-width
            width="100%"
          />
        </label>

        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.limit') }}</span>
          <SimpleSelectDropdown
            v-model="limit"
            :options="limitOptions"
            match-trigger-width
            width="100%"
          />
        </label>

        <div class="toponym-search-page__actions">
          <button
            class="glass-button"
            data-variant="primary"
            type="submit"
            :disabled="searchLoading"
          >
            {{ searchLoading ? t('villages.pages.toponymSearch.search.searching') : t('villages.pages.toponymSearch.search.submit') }}
          </button>
          <button
            class="glass-button"
            data-variant="secondary"
            type="button"
            :disabled="searchLoading"
            @click="handleReset"
          >
            {{ t('villages.pages.toponymSearch.search.reset') }}
          </button>
        </div>
      </form>
    </section>

    <section class="toponym-search-page__workspace">
      <section class="toponym-search-page__results glass-panel">
        <header class="toponym-search-page__section-header">
          <h2>{{ t('villages.pages.toponymSearch.results.title') }}</h2>
          <span v-if="hasSearched && !searchLoading && !searchError">
            {{ t('villages.pages.toponymSearch.results.count', { count: searchCount, shown: searchItems.length }) }}
          </span>
        </header>

        <div v-if="!hasSearched" class="main-list-state glass-subpanel">
          <p class="main-list-state-text">{{ t('villages.pages.toponymSearch.results.idle') }}</p>
        </div>

        <div v-else-if="searchLoading" class="main-list-state glass-subpanel">
          <p class="main-list-state-text">{{ t('villages.pages.toponymSearch.results.loading') }}</p>
        </div>

        <div v-else-if="searchError" class="main-list-state glass-subpanel" data-state="error">
          <div class="main-list-state-title">{{ t('villages.pages.toponymSearch.results.loadFailed') }}</div>
          <p class="main-list-state-text">{{ searchError }}</p>
          <button class="glass-button" type="button" @click="handleSearch">
            {{ t('villages.pages.toponymSearch.search.submit') }}
          </button>
        </div>

        <div v-else-if="!searchItems.length" class="main-list-state glass-subpanel">
          <p class="main-list-state-text">{{ t('villages.pages.toponymSearch.results.empty') }}</p>
        </div>

        <template v-else>
          <p v-if="searchTruncated" class="toponym-search-page__notice glass-subpanel">
            {{ t('villages.pages.toponymSearch.results.truncated') }}
          </p>
          <div class="toponym-search-page__result-grid main-card-grid">
            <button
              v-for="item in searchItems"
              :key="item.id || item.name"
              class="toponym-search-page__result-card glass-card"
              data-interactive="true"
              type="button"
              :disabled="!item.id"
            >
              <strong>{{ item.name || unknownLabel }}</strong>
              <span>{{ item.id || unknownLabel }}</span>
            </button>
          </div>
        </template>
      </section>

      <aside class="toponym-search-page__detail glass-panel">
        <header class="toponym-search-page__section-header">
          <h2>{{ t('villages.pages.toponymSearch.detail.title') }}</h2>
        </header>
        <div class="main-list-state glass-subpanel">
          <p class="main-list-state-text">{{ t('villages.pages.toponymSearch.detail.empty') }}</p>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getToponymSearch } from '@/api';
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';

const { t } = useI18n();

const query = ref('');
const matchMode = ref('prefix');
const selectedPlaceTypeCodes = ref(['22200', '21610', '27610']);
const placeTypeTriggerEl = ref(null);
const placeTypeDropdownOpen = ref(false);
const areaCode = ref('');
const areaScope = ref('descendants');
const limit = ref(50);
const hasSearched = ref(false);
const searchItems = ref([]);
const searchCount = ref(0);
const searchTruncated = ref(false);
const searchLoading = ref(false);
const searchError = ref('');
const searchRequestId = ref(0);

const unknownLabel = computed(() => t('villages.pages.toponymSearch.detail.unknown'));

const matchModeOptions = computed(() => [
  { value: 'prefix', label: t('villages.pages.toponyms.matchModes.prefix') },
  { value: 'suffix', label: t('villages.pages.toponyms.matchModes.suffix') },
  { value: 'exact', label: t('villages.pages.toponyms.matchModes.exact') },
  { value: 'contains', label: t('villages.pages.toponyms.matchModes.contains') },
]);

const placeTypeOptions = computed(() => [
  { value: '22200', label: t('villages.pages.toponymSearch.placeTypes.22200') },
  { value: '21610', label: t('villages.pages.toponymSearch.placeTypes.21610') },
  { value: '27610', label: t('villages.pages.toponymSearch.placeTypes.27610') },
]);

const areaScopeOptions = computed(() => [
  { value: 'descendants', label: t('villages.pages.toponymSearch.areaScopes.descendants') },
  { value: 'exact', label: t('villages.pages.toponymSearch.areaScopes.exact') },
]);

const limitOptions = computed(() => [
  { value: 50, label: t('villages.pages.toponymSearch.limits.50') },
  { value: 100, label: t('villages.pages.toponymSearch.limits.100') },
  { value: 200, label: t('villages.pages.toponymSearch.limits.200') },
]);

const placeTypeTriggerLabel = computed(() => (
  formatMultiSelectLabel(
    selectedPlaceTypeCodes.value,
    placeTypeOptions.value,
    t('villages.pages.toponymSearch.search.placeType')
  )
));

function formatMultiSelectLabel(selectedValues, options, placeholder) {
  const selectedLabels = selectedValues
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean);

  if (!selectedLabels.length) return placeholder;
  if (selectedLabels.length === 1) return selectedLabels[0];
  return `${selectedLabels[0]} +${selectedLabels.length - 1}`;
}

function buildSearchParams() {
  const params = {
    q: query.value.trim(),
    match_mode: matchMode.value,
    place_type_code: selectedPlaceTypeCodes.value,
    limit: limit.value,
  };

  const nextAreaCode = areaCode.value.trim();
  if (nextAreaCode) {
    params.area_code = nextAreaCode;
    params.area_scope = areaScope.value;
  }

  return params;
}

async function handleSearch() {
  const keyword = query.value.trim();
  hasSearched.value = true;
  searchError.value = '';
  searchItems.value = [];
  searchCount.value = 0;
  searchTruncated.value = false;

  if (!keyword) {
    searchError.value = t('villages.pages.toponymSearch.errors.emptyQuery');
    return;
  }

  const requestId = searchRequestId.value + 1;
  searchRequestId.value = requestId;
  searchLoading.value = true;

  try {
    const payload = await getToponymSearch(buildSearchParams());
    if (requestId !== searchRequestId.value) return;

    searchItems.value = Array.isArray(payload.items) ? payload.items : [];
    searchCount.value = Number(payload.count) || searchItems.value.length;
    searchTruncated.value = Boolean(payload.truncated);
  } catch (error) {
    if (requestId !== searchRequestId.value) return;
    searchError.value = error?.message || t('villages.pages.toponymSearch.errors.search');
  } finally {
    if (requestId === searchRequestId.value) {
      searchLoading.value = false;
    }
  }
}

function handleReset() {
  query.value = '';
  matchMode.value = 'prefix';
  selectedPlaceTypeCodes.value = ['22200', '21610', '27610'];
  placeTypeDropdownOpen.value = false;
  areaCode.value = '';
  areaScope.value = 'descendants';
  limit.value = 50;
  hasSearched.value = false;
  searchItems.value = [];
  searchCount.value = 0;
  searchTruncated.value = false;
  searchError.value = '';
  searchLoading.value = false;
  searchRequestId.value += 1;
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-search-page {
  @include flex-col;
  gap: 16px;
  width: 100%;
  min-height: 70dvh;
  padding: 20px;
}

.toponym-search-page__header {
  display: grid;
  grid-template-columns: minmax(220px, 0.32fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 18px;
}

.toponym-search-page__copy {
  @include flex-col;
  gap: 8px;

  h1,
  p {
    margin: 0;
  }
}

.toponym-search-page__form {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) repeat(3, minmax(140px, 1fr));
  gap: 12px;
  align-items: end;
}

.toponym-search-page__field {
  @include flex-col;
  gap: 6px;

  span {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
  }
}

.toponym-search-page__field--query {
  grid-column: span 2;
}

.toponym-search-page__select-trigger {
  width: 100%;
}

.select-label {
  @include text-truncate;
}

.toponym-search-page__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toponym-search-page__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.toponym-search-page__results,
.toponym-search-page__detail {
  @include flex-col;
  gap: 14px;
  padding: 18px;
}

.toponym-search-page__section-header {
  display: flex;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;

  h2 {
    margin: 0;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.toponym-search-page__notice {
  margin: 0;
  padding: 10px 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.toponym-search-page__result-grid {
  --main-card-min-width: 240px;
}

.toponym-search-page__result-card {
  @include flex-col;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  text-align: left;

  strong {
    color: var(--text-primary);
    font-size: 16px;
  }

  span {
    max-width: 100%;
    color: var(--text-secondary);
    font-family: var(--font-monospace);
    font-size: 12px;

    @include text-truncate;
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .toponym-search-page {
    padding: 14px;
  }

  .toponym-search-page__header,
  .toponym-search-page__workspace {
    grid-template-columns: 1fr;
  }

  .toponym-search-page__form {
    grid-template-columns: 1fr;
  }

  .toponym-search-page__field--query {
    grid-column: auto;
  }

  .toponym-search-page__actions {
    flex-wrap: wrap;
  }
}
</style>
