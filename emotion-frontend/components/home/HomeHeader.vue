<script setup>
import { computed } from 'vue'

const props = defineProps({
  showHero: {
    type: Boolean,
    default: true,
  },
  heroTitleParts: {
    type: Array,
    default: () => ['', ''],
  },
  speakerEnabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['menu', 'speaker-toggle'])
const isSpeakerOn = computed(() => props.speakerEnabled)
const visibleHeroAccent = computed(() => props.heroTitleParts[0] || '')
const visibleHeroMain = computed(() => props.heroTitleParts[1] || '')

const toggleSpeaker = () => {
  emit('speaker-toggle')
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
      <text class="hero-accent">{{ visibleHeroAccent }}</text>
      <text class="hero-main">{{ visibleHeroMain }}</text>
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
  opacity: 0.78;
  transform: translateY(1rpx);
}

.menu-icon text {
  display: block;
  width: 34rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: var(--text);
}

.mute-icon {
  position: relative;
  width: 52rpx;
  height: 42rpx;
  margin-right: -8rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.88);
}

.mute-icon--active {
  opacity: 0.8;
}

.speaker-shape {
  position: absolute;
  left: 7rpx;
  top: 16rpx;
  width: 13rpx;
  height: 10rpx;
  border: 3rpx solid var(--text-secondary);
  border-right: 0;
  border-radius: 5rpx 0 0 5rpx;
}

.speaker-mouth {
  position: absolute;
  left: 19rpx;
  top: 11rpx;
  width: 14rpx;
  height: 20rpx;
  border: 3rpx solid var(--text-secondary);
  border-left: 0;
  border-radius: 0 16rpx 16rpx 0;
}

.speaker-wave-line {
  position: absolute;
  border: 3rpx solid var(--primary);
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
  background: var(--text-secondary);
  transform: rotate(42deg);
}

.mute-icon--on .speaker-shape,
.mute-icon--on .speaker-mouth {
  border-color: var(--primary-active);
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
  padding: 18rpx 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-soft);
}

.hero-accent,
.hero-main {
  min-height: 27px;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.hero-accent {
  color: var(--primary);
}

.hero-main {
  color: var(--text);
}
</style>
