<script setup>
import SettingsMenuCard from './SettingsMenuCard.vue'
import SettingsProfilePanel from './SettingsProfilePanel.vue'
import SettingsTopBar from './SettingsTopBar.vue'
import { settingsMenuItems, settingsProfile } from '../../common/settings-data'

const emit = defineEmits(['back', 'logout'])

const handleMenuSelect = (item) => {
  if (item.key !== 'logout') {
    return
  }

  uni.showModal({
    content: '是否退出当前登录',
    confirmText: '是',
    cancelText: '否',
    success: ({ confirm }) => {
      if (confirm) {
        emit('logout')
      }
    },
  })
}
</script>

<template>
  <view class="settings-page">
    <view class="settings-page__inner">
      <SettingsTopBar @back="emit('back')" />

      <SettingsProfilePanel :name="settingsProfile.name" />

      <SettingsMenuCard :items="settingsMenuItems" @select="handleMenuSelect" />

      <text class="settings-page__version">{{ settingsProfile.version }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f3ecf8 0%, #e8ebf9 34%, #dceafb 100%);
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
  bottom: 40rpx;
  color: #9aa1b1;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}
</style>
