<script setup>
import { computed, onMounted, ref } from 'vue'
import SettingsMenuCard from './SettingsMenuCard.vue'
import SettingsDetailScreen from './SettingsDetailScreen.vue'
import SettingsProfilePanel from './SettingsProfilePanel.vue'
import SettingsTopBar from './SettingsTopBar.vue'
import { settingsMenuItems } from '../../common/settings-data'
import {
  fetchLatestSystemVersion,
  logoutAuth,
} from '../../common/user-api.mjs'
import {
  fetchCurrentUserProfile,
  updateCurrentUserAvatar,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
} from '../../common/profile-api.mjs'

const props = defineProps({
  initialUserProfile: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['back', 'logout', 'open-chat', 'profile-updated'])
const activeDetailKey = ref('')
const userProfile = ref(props.initialUserProfile)
const appVersion = ref('')
const draftProfileName = ref('')
const isEditingProfileName = ref(false)
const isSavingProfileName = ref(false)
const isSavingProfileAvatar = ref(false)

const userDisplayName = computed(() => userProfile.value?.displayName || '')
const userAvatarUrl = computed(() => userProfile.value?.avatarUrl || '')
const footerVersion = computed(() => (
  appVersion.value ? `Emotion AI v${appVersion.value}` : ''
))

const detailMap = {
  mood: { key: 'mood', title: '心情日记' },
  history: { key: 'history', title: '历史咨询' },
  report: { key: 'report', title: '关系分析报告' },
  security: { key: 'security', title: '账号安全' },
  privacy: { key: 'privacy', title: '隐私政策' },
  about: { key: 'about', title: '关于我们' },
}

const activeDetail = computed(() => detailMap[activeDetailKey.value] || null)

function showToast(message) {
  if (typeof uni === 'undefined' || !uni.showToast) return

  uni.showToast({
    title: message,
    icon: 'none',
  })
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || '请求失败')
}

async function loadCurrentUserProfile() {
  try {
    const profile = await fetchCurrentUserProfile()
    userProfile.value = profile
    draftProfileName.value = profile.displayName || ''
    emit('profile-updated', profile)
  } catch (error) {
    userProfile.value = null
    draftProfileName.value = ''
    showToast(getErrorMessage(error))
  }
}

async function loadCurrentAppVersion() {
  try {
    const version = await fetchLatestSystemVersion({ platform: 'android' })
    appVersion.value = version?.version || ''
  } catch {
    appVersion.value = ''
  }
}

function editProfileName() {
  draftProfileName.value = userDisplayName.value
  isEditingProfileName.value = true
}

function cancelProfileNameEdit() {
  draftProfileName.value = userDisplayName.value
  isEditingProfileName.value = false
}

async function saveProfileName() {
  const nextName = draftProfileName.value.trim()
  if (isSavingProfileName.value) return

  if (!nextName) {
    showToast('请输入用户名')
    return
  }

  isSavingProfileName.value = true

  try {
    const profile = await updateCurrentUserProfile({ nickname: nextName })
    userProfile.value = profile
    draftProfileName.value = profile.displayName || ''
    isEditingProfileName.value = false
    emit('profile-updated', profile)
    showToast('用户名已更新')
  } catch (error) {
    showToast(getErrorMessage(error))
  } finally {
    isSavingProfileName.value = false
  }
}

function readChosenAvatarPath(result) {
  return result?.tempFilePaths?.[0]
    || result?.tempFiles?.[0]?.path
    || result?.tempFiles?.[0]?.tempFilePath
    || ''
}

function handleChooseAvatar() {
  if (typeof uni === 'undefined' || !uni.chooseImage) {
    showToast('当前环境不支持选择头像')
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: ({ tempFilePaths, tempFiles }) => {
      saveProfileAvatar(readChosenAvatarPath({ tempFilePaths, tempFiles }))
    },
    fail: () => showToast('未选择头像'),
  })
}

async function saveProfileAvatar(filePath) {
  if (!filePath || isSavingProfileAvatar.value) return

  isSavingProfileAvatar.value = true

  try {
    const uploaded = await uploadCurrentUserAvatar(filePath)
    const profile = await updateCurrentUserAvatar(uploaded.publicUrl)
    userProfile.value = profile
    emit('profile-updated', profile)
    showToast('头像已更新')
  } catch (error) {
    showToast(getErrorMessage(error))
  } finally {
    isSavingProfileAvatar.value = false
  }
}

function closeDetail() {
  activeDetailKey.value = ''
}

async function confirmLogout() {
  await logoutAuth().catch(() => {})
  emit('logout')
}

function handleMenuSelect(item) {
  if (item.key !== 'logout') {
    activeDetailKey.value = item.key
    return
  }

  if (typeof uni === 'undefined' || !uni.showModal) {
    confirmLogout()
    return
  }

  uni.showModal({
    content: '是否退出当前登录',
    confirmText: '是',
    cancelText: '否',
    success: ({ confirm }) => {
      if (confirm) confirmLogout()
    },
  })
}

onMounted(() => {
  loadCurrentUserProfile()
  loadCurrentAppVersion()
})
</script>

<template>
  <SettingsDetailScreen
    v-if="activeDetail"
    :detail="activeDetail"
    @back="closeDetail"
    @open-chat="emit('open-chat', $event)"
  />

  <view v-else class="settings-page">
    <view class="settings-page__inner">
      <SettingsTopBar @back="emit('back')" />

      <SettingsProfilePanel
        :name="userDisplayName"
        :avatar-url="userAvatarUrl"
        :is-editing-name="isEditingProfileName"
        :is-saving-name="isSavingProfileName"
        :is-saving-avatar="isSavingProfileAvatar"
        v-model:draft-name="draftProfileName"
        @edit-name="editProfileName"
        @save-name="saveProfileName"
        @cancel-name="cancelProfileNameEdit"
        @choose-avatar="handleChooseAvatar"
      />

      <SettingsMenuCard :items="settingsMenuItems" @select="handleMenuSelect" />

      <text v-if="footerVersion" class="settings-page__version">{{ footerVersion }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7f9 48%, #eef1f5 100%);
}

.settings-page__inner {
  position: relative;
  min-height: 100vh;
  padding: 66rpx 26rpx 40rpx;
}

.settings-page__version {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}
</style>
