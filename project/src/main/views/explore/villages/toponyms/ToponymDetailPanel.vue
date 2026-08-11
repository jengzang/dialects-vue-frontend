<template>
  <section class="toponym-detail-panel">
    <p
      v-if="!selectedPoint"
      class="toponym-detail-panel__empty"
    >
      {{ t('villages.pages.toponyms.detail.empty') }}
    </p>

    <template v-else>
      <div class="toponym-detail-panel__selected">
        <span>{{ t('villages.pages.toponyms.detail.selectedPoint') }}</span>
        <strong>{{ formatCoordinates(selectedPoint.coordinates) }}</strong>
      </div>

      <div class="toponym-detail-panel__actions">
        <button
          class="glass-button"
          type="button"
          :disabled="localLoading"
          @click="emit('request-local-detail')"
        >
          {{
            localLoading
              ? t('villages.pages.toponyms.detail.localButtonLoading')
              : t('villages.pages.toponyms.detail.localButton')
          }}
        </button>
        <button
          class="glass-button"
          type="button"
          :disabled="officialLoading"
          @click="emit('request-official-detail')"
        >
          {{
            officialLoading
              ? t('villages.pages.toponyms.detail.officialLoading')
              : t('villages.pages.toponyms.detail.officialButton')
          }}
        </button>
      </div>

      <p
        v-if="localLoading"
        class="toponym-detail-panel__status"
      >
        {{ t('villages.pages.toponyms.detail.localLoading') }}
      </p>
      <p
        v-else-if="localError"
        class="toponym-detail-panel__error"
      >
        {{ localError }}
      </p>
      <p
        v-else-if="selectedPoint && !localDetail && localRequested"
        class="toponym-detail-panel__status"
      >
        {{ t('villages.pages.toponyms.detail.noLocalDetail') }}
      </p>
      <p
        v-else-if="selectedPoint && !localDetail"
        class="toponym-detail-panel__status"
      >
        {{ t('villages.pages.toponyms.detail.localHint') }}
      </p>

      <dl
        v-if="localDetail"
        class="toponym-detail-panel__list"
      >
        <div class="toponym-detail-panel__source-label">
          <dt>{{ t('villages.pages.toponyms.detail.localSource') }}</dt>
          <dd>{{ t('villages.pages.toponyms.detail.localSourceName') }}</dd>
        </div>
        <div>
          <dt>{{ t('villages.pages.toponyms.detail.name') }}</dt>
          <dd>{{ localDetail.name || t('villages.pages.toponyms.detail.unknown') }}</dd>
        </div>
        <div>
          <dt>{{ t('villages.pages.toponyms.detail.placeType') }}</dt>
          <dd>{{ localDetail.place_type || localDetail.place_type_code || t('villages.pages.toponyms.detail.unknown') }}</dd>
        </div>
        <div>
          <dt>{{ t('villages.pages.toponyms.detail.coordinates') }}</dt>
          <dd>{{ formatCoordinates([localDetail.longitude, localDetail.latitude]) }}</dd>
        </div>
        <div>
          <dt>{{ t('villages.pages.toponyms.detail.divisionPath') }}</dt>
          <dd>{{ divisionPathText }}</dd>
        </div>
      </dl>

      <div class="toponym-detail-panel__official">
        <p
          v-if="officialError"
          class="toponym-detail-panel__error"
        >
          {{ officialError }}
        </p>

        <dl
          v-if="officialDetail"
          class="toponym-detail-panel__list"
        >
          <div>
            <dt>{{ t('villages.pages.toponyms.detail.officialArea') }}</dt>
            <dd>{{ officialDetail.areaName || t('villages.pages.toponyms.detail.unknown') }}</dd>
          </div>
          <div>
            <dt>{{ t('villages.pages.toponyms.detail.officialCity') }}</dt>
            <dd>{{ officialDetail.cityName || t('villages.pages.toponyms.detail.unknown') }}</dd>
          </div>
          <div>
            <dt>{{ t('villages.pages.toponyms.detail.officialOldName') }}</dt>
            <dd>{{ officialDetail.oldName || t('villages.pages.toponyms.detail.unknown') }}</dd>
          </div>
        </dl>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  selectedPoint: {
    type: Object,
    default: null,
  },
  localDetail: {
    type: Object,
    default: null,
  },
  localLoading: {
    type: Boolean,
    default: false,
  },
  localError: {
    type: String,
    default: '',
  },
  officialDetail: {
    type: Object,
    default: null,
  },
  officialLoading: {
    type: Boolean,
    default: false,
  },
  officialError: {
    type: String,
    default: '',
  },
  localRequested: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['request-local-detail', 'request-official-detail']);
const { t } = useI18n();

const divisionPathText = computed(() => {
  const path = Array.isArray(props.localDetail?.division_path) ? props.localDetail.division_path : [];
  const names = path.map((item) => item?.name).filter(Boolean);
  return names.length ? names.join(' / ') : t('villages.pages.toponyms.detail.unknown');
});

function formatCoordinates(coordinates) {
  const [longitude, latitude] = Array.isArray(coordinates) ? coordinates : [];
  const lng = Number(longitude);
  const lat = Number(latitude);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return t('villages.pages.toponyms.detail.unknown');
  }

  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-detail-panel {
  @include flex-col;
  gap: 12px;

  &__source-label {
    padding-block-end: 2px;
  }

  &__empty,
  &__status,
  &__error {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }

  &__empty,
  &__status {
    color: var(--text-secondary);
  }

  &__error {
    color: var(--color-error);
  }

  &__selected {
    @include flex-col;
    gap: 4px;
    padding: 10px;
    border: 1px solid var(--border-glass-subtle);
    border-radius: var(--radius-sm2);
    background: var(--surface-panel-subtle);

    span {
      color: var(--text-secondary);
      font-size: 12px;
    }

    strong {
      color: var(--text-deep);
      font-size: 13px;
      font-weight: 600;
    }
  }

  &__list {
    @include flex-col;
    gap: 8px;
    margin: 0;

    div {
      @include flex-col;
      gap: 3px;
    }

    dt {
      color: var(--text-secondary);
      font-size: 12px;
    }

    dd {
      margin: 0;
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    button:disabled {
      @include disabled-state;
    }
  }

  &__official {
    @include flex-col;
    gap: 10px;
  }
}
</style>
