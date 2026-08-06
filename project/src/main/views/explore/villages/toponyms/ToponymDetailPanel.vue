<template>
  <section class="toponym-detail-panel">
    <div class="toponym-detail-panel__header">
      <h3>{{ t('villages.pages.toponyms.detail.title') }}</h3>
      <span v-if="selectedPoint">{{ selectedPoint.id }}</span>
    </div>

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
        v-else-if="selectedPoint && !localDetail"
        class="toponym-detail-panel__status"
      >
        {{ t('villages.pages.toponyms.detail.noLocalDetail') }}
      </p>

      <dl
        v-if="localDetail"
        class="toponym-detail-panel__list"
      >
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
        <button
          class="main-glass-button"
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
});

const emit = defineEmits(['request-official-detail']);
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
  padding-block-start: 12px;
  border-block-start: 1px solid var(--border-glass-subtle);

  &__header {
    @include flex-col;
    gap: 4px;

    h3 {
      margin: 0;
      color: var(--text-deep);
      font-size: 16px;
      line-height: 1.4;
    }

    span {
      @include text-truncate;
      color: var(--text-tertiary);
      font-size: 12px;
    }
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

  &__official {
    @include flex-col;
    gap: 10px;

    button:disabled {
      @include disabled-state;
    }
  }
}
</style>
