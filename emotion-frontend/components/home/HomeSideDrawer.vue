<script setup>
import HomeStatusBar from './HomeStatusBar.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  profile: {
    type: Object,
    default: () => ({}),
  },
  quickLinks: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'settings', 'open-page'])
</script>

<template>
  <view class="drawer-layer" :class="{ 'drawer-layer--open': open }">
    <view class="drawer-mask" @tap="emit('close')"></view>

    <view class="drawer-panel" :class="{ 'drawer-panel--open': open }" @tap.stop>
      <HomeStatusBar />

      <view class="drawer-content">
        <view class="profile-row">
          <view class="profile-main">
            <view class="avatar-card">
              <view class="avatar-face">
                <view class="avatar-hair"></view>
                <view class="avatar-head"></view>
                <view class="avatar-shirt"></view>
              </view>
            </view>

            <text class="profile-name">{{ profile.name }}</text>
          </view>

          <view class="settings-box">
            <view class="settings-circle" hover-class="settings-circle--active" @tap="emit('settings')">
              <view class="settings-gear">
                <view class="settings-gear__tooth settings-gear__tooth--top"></view>
                <view class="settings-gear__tooth settings-gear__tooth--right"></view>
                <view class="settings-gear__tooth settings-gear__tooth--bottom"></view>
                <view class="settings-gear__tooth settings-gear__tooth--left"></view>
                <view class="settings-gear__tooth settings-gear__tooth--top-right"></view>
                <view class="settings-gear__tooth settings-gear__tooth--bottom-right"></view>
                <view class="settings-gear__tooth settings-gear__tooth--bottom-left"></view>
                <view class="settings-gear__tooth settings-gear__tooth--top-left"></view>
                <view class="settings-gear__ring">
                  <view class="settings-gear__hole"></view>
                </view>
              </view>
            </view>
            <text class="settings-text">设置</text>
          </view>
        </view>

        <view class="quick-links">
          <view
            v-for="link in quickLinks"
            :key="link.key"
            class="quick-card"
            hover-class="quick-card--active"
            @tap="emit('open-page', link.key)"
          >
            <view
              class="quick-icon"
              :class="{
                'quick-icon--blue': link.accent === 'blue',
                'quick-icon--purple': link.accent === 'purple',
              }"
            >
              <text v-if="link.iconType === 'initials'" class="quick-icon-text">
                {{ link.iconText }}
              </text>
              <view v-else class="document-icon">
                <view class="document-icon__sheet"></view>
                <view class="document-icon__line document-icon__line--1"></view>
                <view class="document-icon__line document-icon__line--2"></view>
              </view>
            </view>

            <text class="quick-title">{{ link.title }}</text>
            <text class="quick-subtitle">{{ link.subtitle }}</text>
          </view>
        </view>

        <view class="record-block">
          <text class="record-title">重要记录</text>

          <view
            class="record-area record-area--important"
            hover-class="record-area--active"
            @tap="emit('open-page', 'important-records')"
          >
            <view class="record-add" @tap.stop="emit('open-page', 'important-record-create')">
              <text class="record-add__symbol">+</text>
            </view>
            <text class="record-empty">暂无重要记录</text>
          </view>
        </view>

        <view class="record-block record-block--chat">
          <text class="record-title">对话记录</text>

          <view
            class="record-area record-area--chat"
            hover-class="record-area--active"
            @tap="emit('open-page', 'chat-records')"
          >
            <text class="record-empty record-empty--chat">暂无对话记录</text>
          </view>
        </view>
      </view>

      <view class="drawer-indicator"></view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.drawer-layer {
  position: fixed;
  inset: 0;
  z-index: 30;
  pointer-events: none;
}

.drawer-layer--open {
  pointer-events: auto;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(94, 106, 126, 0.12);
  opacity: 0;
  transition: opacity 220ms ease;
}

.drawer-layer--open .drawer-mask {
  opacity: 1;
}

.drawer-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 82%;
  max-width: 660rpx;
  min-height: 100vh;
  padding: 38rpx 22rpx 12rpx;
  background: linear-gradient(180deg, #f2ecf8 0%, #e9ebf9 35%, #dcebfa 100%);
  border-radius: 0 34rpx 34rpx 0;
  box-shadow: 12rpx 0 40rpx rgba(125, 135, 171, 0.2);
  transform: translateX(-104%);
  transition: transform 240ms ease;
}

.drawer-panel--open {
  transform: translateX(0);
}

.drawer-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 18rpx 2rpx 0;
}

.profile-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 4rpx;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.avatar-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 8rpx 18rpx rgba(144, 151, 186, 0.18);
}

.avatar-face {
  position: relative;
  width: 46rpx;
  height: 50rpx;
}

.avatar-hair {
  position: absolute;
  left: 6rpx;
  top: 2rpx;
  width: 34rpx;
  height: 22rpx;
  border-radius: 18rpx 18rpx 14rpx 14rpx;
  background: #2b2e3e;
}

.avatar-head {
  position: absolute;
  left: 9rpx;
  top: 12rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #f3c6a3;
}

.avatar-shirt {
  position: absolute;
  left: 4rpx;
  bottom: 0;
  width: 38rpx;
  height: 18rpx;
  border-radius: 14rpx 14rpx 8rpx 8rpx;
  background: linear-gradient(180deg, #6297ff 0%, #4b76e8 100%);
}

.profile-name {
  color: #2e3140;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.settings-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.settings-circle {
  position: relative;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8rpx 18rpx rgba(144, 151, 186, 0.16);
}

.settings-circle--active {
  opacity: 0.74;
}

.settings-gear {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 30rpx;
  height: 30rpx;
}

.settings-gear__ring {
  position: absolute;
  inset: 5rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #3b4254;
}

.settings-gear__hole {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #ffffff;
}

.settings-gear__tooth {
  position: absolute;
  left: 12rpx;
  top: 0;
  width: 6rpx;
  height: 9rpx;
  border-radius: 2rpx;
  background: #3b4254;
  transform-origin: 3rpx 15rpx;
}

.settings-gear__tooth--top {
  transform: rotate(0deg);
}

.settings-gear__tooth--top-right {
  transform: rotate(45deg);
}

.settings-gear__tooth--right {
  transform: rotate(90deg);
}

.settings-gear__tooth--bottom-right {
  transform: rotate(135deg);
}

.settings-gear__tooth--bottom {
  transform: rotate(180deg);
}

.settings-gear__tooth--bottom-left {
  transform: rotate(225deg);
}

.settings-gear__tooth--left {
  transform: rotate(270deg);
}

.settings-gear__tooth--top-left {
  transform: rotate(315deg);
}

.settings-text {
  color: #8f96a7;
  font-size: 11px;
  line-height: 1;
}

.quick-links {
  display: flex;
  gap: 18rpx;
  margin-top: 34rpx;
}

.quick-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-height: 188rpx;
  padding: 24rpx 16rpx 20rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.56);
}

.quick-card--active,
.record-area--active {
  opacity: 0.74;
  transform: scale(0.99);
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.quick-icon--blue {
  background: linear-gradient(180deg, #5093ff 0%, #3b76f0 100%);
}

.quick-icon--purple {
  background: linear-gradient(180deg, #a04eff 0%, #853df0 100%);
}

.quick-icon-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.document-icon {
  position: relative;
  width: 30rpx;
  height: 34rpx;
}

.document-icon__sheet {
  position: absolute;
  inset: 0;
  border: 3rpx solid #ffffff;
  border-radius: 6rpx;
}

.document-icon__line {
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #ffffff;
}

.document-icon__line--1 {
  top: 11rpx;
}

.document-icon__line--2 {
  top: 18rpx;
}

.quick-title {
  margin-top: 20rpx;
  color: #2e3140;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.quick-subtitle {
  margin-top: 10rpx;
  color: #8e95a7;
  font-size: 11px;
  line-height: 1.25;
}

.record-block {
  margin-top: 24rpx;
}

.record-block--chat {
  margin-top: 14rpx;
}

.record-title {
  color: #2e3140;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.record-area {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 24rpx;
}

.record-area--important {
  min-height: 284rpx;
}

.record-area--chat {
  min-height: 220rpx;
}

.record-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 24rpx rgba(255, 255, 255, 0.72);
}

.record-add__symbol {
  color: #1d1f2a;
  font-size: 34rpx;
  line-height: 1;
  transform: translateY(-1rpx);
}

.record-empty {
  margin-top: 22rpx;
  color: #a7aeba;
  font-size: 14px;
  line-height: 1;
}

.record-empty--chat {
  margin-top: 0;
}

.drawer-indicator {
  width: 214rpx;
  height: 8rpx;
  margin: 12rpx auto 0;
  border-radius: 999rpx;
  background: rgba(95, 103, 114, 0.28);
}
</style>
