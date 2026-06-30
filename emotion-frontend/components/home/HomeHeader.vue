<script setup>
import { ref } from 'vue'

defineProps({
  showHero: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['menu'])
const isSpeakerOn = ref(false)

const toggleSpeaker = () => {
  isSpeakerOn.value = !isSpeakerOn.value
}
</script>

<template>
  <view class="header">
    <view class="header-row">
      <view class="menu-icon" hover-class="menu-icon--active" @tap="emit('menu')">
        <text></text>
        <text></text>
        <text></text>
      </view>

      <view
        class="mute-icon"
        :class="{ 'mute-icon--on': isSpeakerOn }"
        role="button"
        :aria-label="isSpeakerOn ? '关闭扬声器' : '开启扬声器'"
        hover-class="mute-icon--active"
        @tap="toggleSpeaker"
      >
        <view class="speaker-shape"></view>
        <view class="speaker-mouth"></view>
        <template v-if="isSpeakerOn">
          <view class="speaker-wave-line speaker-wave-line--inner"></view>
          <view class="speaker-wave-line speaker-wave-line--outer"></view>
        </template>
        <view v-else class="speaker-off-slash"></view>
      </view>
    </view>

    <view v-if="showHero" class="hero-title">
      <text class="hero-accent">你好！</text>
      <text class="hero-main">帮你吃爱情的苦</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.header {
  margin-top: 48rpx;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx;
}

.menu-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6rpx;
  width: 48rpx;
  min-height: 40rpx;
}

.menu-icon--active {
  opacity: 0.72;
}

.menu-icon text {
  display: block;
  width: 34rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #6027ac;
}

.mute-icon {
  position: relative;
  width: 52rpx;
  height: 42rpx;
  margin-right: -8rpx;
}

.mute-icon--active {
  opacity: 0.72;
}

.speaker-shape {
  position: absolute;
  left: 7rpx;
  top: 16rpx;
  width: 13rpx;
  height: 10rpx;
  border: 3rpx solid #98a5b4;
  border-right: 0;
  border-radius: 5rpx 0 0 5rpx;
}

.speaker-mouth {
  position: absolute;
  left: 19rpx;
  top: 11rpx;
  width: 14rpx;
  height: 20rpx;
  border: 3rpx solid #98a5b4;
  border-left: 0;
  border-radius: 0 16rpx 16rpx 0;
}

.speaker-wave-line {
  position: absolute;
  border: 3rpx solid #6027ac;
  border-left: 0;
  border-top-color: transparent;
  border-bottom-color: transparent;
  transform-origin: left center;
}

.speaker-wave-line--inner {
  right: 12rpx;
  top: 15rpx;
  width: 7rpx;
  height: 12rpx;
  border-radius: 0 999rpx 999rpx 0;
}

.speaker-wave-line--outer {
  right: 5rpx;
  top: 10rpx;
  width: 14rpx;
  height: 22rpx;
  border-radius: 0 999rpx 999rpx 0;
}

.speaker-off-slash {
  position: absolute;
  right: 10rpx;
  top: 8rpx;
  width: 3rpx;
  height: 27rpx;
  border-radius: 999rpx;
  background: #98a5b4;
  transform: rotate(42deg);
}

.mute-icon--on .speaker-shape,
.mute-icon--on .speaker-mouth {
  border-color: #6027ac;
}

.mute-icon--on .speaker-shape {
  border-right: 0;
}

.mute-icon--on .speaker-mouth,
.mute-icon--on .speaker-wave-line {
  border-left: 0;
}

.hero-title {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 110rpx;
}

.hero-accent,
.hero-main {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
}

.hero-accent {
  color: #347fff;
}

.hero-main {
  color: #5b23a5;
}
</style>
