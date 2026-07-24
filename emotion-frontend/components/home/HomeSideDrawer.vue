<script setup>
import { computed } from 'vue'
import objectIcon from '../../image/object.png'
import personIcon from '../../image/person.png'
import HomeStatusBar from './HomeStatusBar.vue'

const props = defineProps({
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
  chatRecords: {
    type: Array,
    default: () => [],
  },
  importantRecords: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'settings', 'open-page', 'new-chat', 'open-chat', 'open-important-record'])
const hasImportantRecords = computed(() => props.importantRecords.length > 0)
const hasChatRecords = computed(() => props.chatRecords.length > 0)
const quickIconSources = {
  blue: personIcon,
  purple: objectIcon,
}

const handleImportantAreaTap = () => {
  if (hasImportantRecords.value) return

  emit('open-page', 'important-record-create')
}
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
              <image
                v-if="profile.avatarUrl"
                class="avatar-image"
                :src="profile.avatarUrl"
                mode="aspectFill"
              />
              <view v-else class="avatar-face">
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
            <image
              class="quick-icon"
              :src="quickIconSources[link.accent]"
              mode="aspectFill"
            />

            <text class="quick-title">{{ link.title }}</text>
            <text class="quick-subtitle">{{ link.subtitle }}</text>
          </view>
        </view>

        <view class="knowledge-entry" hover-class="knowledge-entry--active" @tap="emit('open-page', 'knowledge')">
          <text class="knowledge-entry__icon">▤</text>
          <view class="knowledge-entry__copy">
            <text class="knowledge-entry__title">知识库</text>
            <text class="knowledge-entry__subtitle">文档与索引状态</text>
          </view>
          <text class="knowledge-entry__arrow">›</text>
        </view>

        <view class="record-block">
          <text class="record-title">重要记录</text>

          <view
            class="record-area record-area--important"
            :hover-class="hasImportantRecords ? '' : 'record-area--active'"
            @tap="handleImportantAreaTap"
          >
            <view v-if="hasImportantRecords" class="important-record-list">
              <view
                v-for="record in importantRecords"
                :key="record.id"
                class="important-record-item"
                hover-class="important-record-item--active"
                @tap.stop="emit('open-important-record', record.id)"
              >
                <view class="important-record-item__main">
                  <text class="important-record-item__title">{{ record.title }}</text>
                  <text class="important-record-item__preview">{{ record.eventDescription }}</text>
                </view>
                <text class="important-record-item__time">{{ record.recordTime }}</text>
              </view>

              <view
                class="important-record-add-button"
                hover-class="important-record-add-button--active"
                @tap.stop="emit('open-page', 'important-record-create')"
              >
                <text class="important-record-add-button__plus">+</text>
                <text class="important-record-add-button__text">新增记录</text>
              </view>
            </view>

            <template v-else>
              <view class="record-add">
                <text class="record-add__symbol">+</text>
              </view>
              <text class="record-empty">暂无重要记录</text>
            </template>
          </view>
        </view>

        <view class="record-block record-block--chat">
          <view class="record-heading">
            <text class="record-title">对话记录</text>
            <view class="chat-add-button" hover-class="chat-add-button--active" @tap="emit('new-chat')">
              <text class="chat-add-button__plus">+</text>
              <text class="chat-add-button__text">新增对话</text>
            </view>
          </view>

          <scroll-view class="record-area record-area--chat" scroll-y>
            <view v-if="hasChatRecords" class="chat-record-list">
              <view
                v-for="chat in chatRecords"
                :key="chat.id"
                class="chat-record-item"
                hover-class="chat-record-item--active"
                @tap="emit('open-chat', chat)"
              >
                <view class="chat-record-item__main">
                  <text class="chat-record-item__title">{{ chat.title }}</text>
                  <text class="chat-record-item__preview">{{ chat.preview }}</text>
                </view>
                <text class="chat-record-item__time">{{ chat.time }}</text>
              </view>
            </view>
            <text v-else class="record-empty record-empty--chat">暂无对话记录</text>
          </scroll-view>
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
  background: rgba(17, 24, 39, 0.22);
  opacity: 0;
  transition: opacity 220ms var(--ease);
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
  height: 100vh;
  max-height: 100vh;
  box-sizing: border-box;
  padding: 38rpx 22rpx 12rpx;
  overflow: hidden;
  background:
    linear-gradient(180deg, #ffffff 0%, #f7f8fa 100%);
  border-right: 2rpx solid var(--border);
  border-radius: 0 40rpx 40rpx 0;
  box-shadow: 18rpx 0 40rpx rgba(17, 24, 39, 0.08);
  transform: translateX(-104%);
  transition: transform 240ms var(--ease);
}

.drawer-panel--open {
  transform: translateX(0);
}

.drawer-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
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
  overflow: hidden;
  border-radius: 18rpx;
  border: 2rpx solid var(--border);
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
}

.avatar-image {
  display: block;
  width: 100%;
  height: 100%;
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
  background: #20242b;
}

.avatar-head {
  position: absolute;
  left: 9rpx;
  top: 12rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #d9dde5;
}

.avatar-shirt {
  position: absolute;
  left: 4rpx;
  bottom: 0;
  width: 38rpx;
  height: 18rpx;
  border-radius: 14rpx 14rpx 8rpx 8rpx;
  background: linear-gradient(180deg, #6aa8ff 0%, var(--primary) 100%);
}

.profile-name {
  color: var(--text);
  font-size: 18px;
  font-weight: 800;
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
  border: 2rpx solid var(--border);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-soft);
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
  background: var(--text);
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
  background: var(--text);
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
  color: var(--text-secondary);
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
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
}

.quick-card--active,
.record-area--active {
  opacity: 0.74;
  transform: scale(0.99);
}

.quick-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  object-fit: cover;
}

.knowledge-entry {
  display: flex;
  align-items: center;
  min-height: 86rpx;
  margin-top: 18rpx;
  padding: 0 20rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
}

.knowledge-entry--active {
  opacity: 0.78;
  transform: translateY(2rpx);
}

.knowledge-entry__icon {
  color: var(--primary);
  font-size: 24px;
  line-height: 1;
}

.knowledge-entry__copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 7rpx;
  margin-left: 18rpx;
}

.knowledge-entry__title {
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
}

.knowledge-entry__subtitle,
.knowledge-entry__arrow {
  color: var(--text-secondary);
}

.knowledge-entry__subtitle {
  font-size: 11px;
  line-height: 1;
}

.knowledge-entry__arrow {
  font-size: 28px;
  line-height: 1;
}

.quick-title {
  margin-top: 20rpx;
  color: var(--text);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
}

.quick-subtitle {
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.25;
}

.record-block {
  margin-top: 24rpx;
}

.record-block--chat {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 14rpx;
}

.record-title {
  color: var(--text);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}

.record-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.chat-add-button {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-height: 46rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  border: 2rpx solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}

.chat-add-button--active,
.chat-record-item--active,
.important-record-item--active {
  opacity: 0.78;
  transform: scale(0.99);
}

.chat-add-button__plus {
  color: var(--primary);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
}

.chat-add-button__text {
  color: var(--text-body);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
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
  align-items: stretch;
  justify-content: flex-start;
  padding: 20rpx 0 0;
}

.record-area--chat {
  flex: 1;
  height: 0;
  min-height: 0;
  margin-top: 18rpx;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-right: 4rpx;
  scrollbar-width: thin;
  scrollbar-color: rgba(10, 124, 255, 0.38) transparent;
}

.record-area--chat::-webkit-scrollbar {
  width: 8rpx;
}

.record-area--chat::-webkit-scrollbar-track {
  background: transparent;
}

.record-area--chat::-webkit-scrollbar-thumb {
  border-radius: 999rpx;
  background: rgba(10, 124, 255, 0.36);
}

.record-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  margin: auto;
  border-radius: 50%;
  border: 2rpx solid var(--border);
  background: #ffffff;
}

.record-add__symbol {
  color: var(--text);
  font-size: 34rpx;
  line-height: 1;
  transform: translateY(-1rpx);
}

.record-empty {
  margin-top: 22rpx;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1;
  text-align: center;
}

.record-empty--chat {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  margin-top: 0;
}

.important-record-list,
.chat-record-list {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 14rpx;
}

.important-record-item,
.chat-record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  width: 100%;
  min-height: 86rpx;
  padding: 16rpx 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
}

.important-record-item__main,
.chat-record-item__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.important-record-item__title,
.chat-record-item__title {
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.15;
}

.important-record-item__preview,
.chat-record-item__preview {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.important-record-item__time,
.chat-record-item__time {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1;
}

.important-record-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 78rpx;
  border: 2rpx dashed rgba(10, 124, 255, 0.34);
  border-radius: 24rpx;
  background: rgba(232, 242, 255, 0.72);
}

.important-record-add-button--active {
  opacity: 0.8;
  transform: translateY(2rpx);
}

.important-record-add-button__plus {
  color: var(--primary);
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1;
}

.important-record-add-button__text {
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.drawer-indicator {
  width: 214rpx;
  height: 8rpx;
  margin: 12rpx auto 0;
  border-radius: 999rpx;
  background: rgba(111, 118, 128, 0.32);
}
</style>
