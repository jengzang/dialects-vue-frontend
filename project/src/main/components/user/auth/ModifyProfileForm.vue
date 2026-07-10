<template>
  <div class="modify-profile-form">
    <h3>{{ $t('auth.modifyProfile.welcome', { username: displayUsername }) }}</h3>

    <div v-if="safeUser" class="modify-avatar-card">
      <UserAvatarEditor
        ref="avatarEditorRef"
        class="modify-avatar-preview"
        :user="safeUser"
      />

      <button
        class="avatar-edit-btn"
        type="button"
        @click="avatarEditorRef?.open()"
      >
        🎨 {{ avatarEditText }}
      </button>
    </div>

    <!-- Tab Switcher -->
    <TabSwitcher
      :tabs="tabs"
      :modelValue="modeType"
      @update:modelValue="$emit('update:modeType', $event)"
    />

    <!-- Modify Username Section -->
    <div v-if="modeType === 'username'">
      <FormInput
        v-model="localNewUsername"
        type="text"
        :placeholder="$t('auth.modifyProfile.username.placeholder')"
        icon="👤"
        :error="error"
      />
      <div class="form-row">
        <button
          class="btn-search"
          type="button"
          :disabled="loading || !safeUser"
          @click="handleSaveUsername"
        >
          {{ $t('auth.modifyProfile.username.button') }}
        </button>
      </div>
    </div>

    <!-- Modify Password Section -->
    <div v-if="modeType === 'password'">
      <FormInput
        v-model="localCurrentPassword"
        type="password"
        :placeholder="$t('auth.modifyProfile.password.currentPlaceholder')"
        :showPasswordToggle="true"
        :error="error"
      />

      <FormInput
        v-model="localNewPassword"
        type="password"
        :placeholder="$t('auth.modifyProfile.password.newPlaceholder')"
        :showPasswordToggle="true"
        :error="error"
      />

      <div class="form-row">
        <button
          class="btn-search"
          type="button"
          :disabled="loading || !safeUser"
          @click="handleSavePassword"
        >
          {{ $t('auth.modifyProfile.password.button') }}
        </button>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <p v-if="error" class="err" v-html="error"></p>
    <p v-if="success" class="success" v-html="success"></p>

    <!-- Back Button -->
    <div class="form-row form-row-back">
      <button
        class="btn-search btn-back"
        type="button"
        @click="$emit('back')"
      >
        {{ $t('auth.modifyProfile.backButton') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from './FormInput.vue'
import TabSwitcher from './TabSwitcher.vue'
import UserAvatarEditor from './UserAvatarEditor.vue'

const { t, te } = useI18n()

const props = defineProps({
  user: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  success: {
    type: String,
    default: ''
  },
  modeType: {
    type: String,
    default: 'username'
  }
})

const emit = defineEmits(['saveUsername', 'savePassword', 'back', 'update:modeType'])

const avatarEditorRef = ref(null)

const safeUser = computed(() => props.user)

const displayUsername = computed(() => props.user?.username || '')

const avatarEditText = computed(() => (
  te('auth.profile.avatar.editButton')
    ? t('auth.profile.avatar.editButton')
    : t('auth.profile.avatar.editOverlay')
))

const tabs = computed(() => [
  { label: '👤 ' + t('auth.modifyProfile.tabs.username'), value: 'username' },
  { label: '🔒 ' + t('auth.modifyProfile.tabs.password'), value: 'password' }
])

const localNewUsername = ref('')
const localCurrentPassword = ref('')
const localNewPassword = ref('')

const handleSaveUsername = () => {
  emit('saveUsername', { newUsername: localNewUsername.value })
}

const handleSavePassword = () => {
  emit('savePassword', {
    currentPassword: localCurrentPassword.value,
    newPassword: localNewPassword.value
  })
}
</script>

```vue

$primary-blue: var(--color-primary);
$primary-blue-dark: #0051d5;
$back-gold: #b8860b;
$back-gold-dark: #8a5a00;
$text-title: #1c1c1e;
$error-color: #ff3b30;
$success-color: #34c759;
$white: #fff;

$transition-fast: 0.18s;
$transition-base: 0.2s;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modify-profile-form {
  padding: 12px;
  text-align: center;
}

h3 {
  margin: 0 0 16px;
  color: $text-title;
  font-size: 30px;
  font-weight: 700;
}

.modify-avatar-card {
  @include flex-center;

  gap: 16px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 16px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 22px;
  box-shadow:
    0 18px 46px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
}

.modify-avatar-preview {
  flex-shrink: 0;
}

.avatar-edit-btn {
  min-height: 36px;
  padding: 8px 14px;
  color: $white;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(135deg, $primary-blue, $primary-blue-dark);
  border: none;
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 10px 22px rgba(0, 122, 255, 0.22);
  transition:
    transform $transition-fast ease,
    box-shadow $transition-fast ease,
    opacity $transition-fast ease;

  &:hover {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 14px 30px rgba(0, 122, 255, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.985);
  }

  @media (max-width: 480px) {
    width: 100%;
  }
}

.form-row {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 12px 0;

  &-back {
    margin-top: 10px;
  }
}

.btn-search {
  padding: 12px 24px;
  color: $white;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, $primary-blue, $primary-blue-dark);
  border: none;
  border-radius: 12px;
  transition:
    transform $transition-base ease,
    box-shadow $transition-base ease,
    opacity $transition-base ease;

  &:hover:not(:disabled) {
    box-shadow: 0 10px 24px rgba(0, 122, 255, 0.24);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-aspect-ratio: 1/1) {
    width: 100%;
    padding: 16px;
    font-size: 18px;
  }
}

.btn-back {
  background: linear-gradient(135deg, $back-gold, $back-gold-dark);

  &:hover:not(:disabled) {
    box-shadow: 0 10px 24px rgba(184, 134, 11, 0.22);
  }
}

.err,
.success {
  margin-top: 10px;
  font-size: 15px;
  font-weight: 700;

  @media (max-aspect-ratio: 1/1) {
    font-size: 16px;
  }
}

.err {
  color: $error-color;
}

.success {
  color: $success-color;
}

```
