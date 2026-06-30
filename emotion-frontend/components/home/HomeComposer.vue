<script setup>
import { ref } from 'vue'

const emit = defineEmits(['send'])
const isVoiceMode = ref(false)
const isVoiceInputActive = ref(false)
const textValue = ref('')
const voiceWaveBars = [18, 28, 42, 24, 34, 50, 30, 40, 22]

const toggleVoiceMode = () => {
  isVoiceMode.value = !isVoiceMode.value
  isVoiceInputActive.value = false
}

const startVoiceInput = () => {
  if (!isVoiceMode.value) return

  isVoiceInputActive.value = true
}

const stopVoiceInput = () => {
  isVoiceInputActive.value = false
}

const sendTextMessage = () => {
  const message = textValue.value.trim()

  if (!message) return

  emit('send', message)
  textValue.value = ''
}
</script>

<template>
  <view class="composer">
    <view class="composer-top">
      <view
        class="add-button"
        :class="{ 'add-button--voice': isVoiceMode }"
        @tap="toggleVoiceMode"
      >
        <view class="mode-icon mode-icon--keyboard" v-if="isVoiceMode">
          <view class="mode-icon__key"></view>
          <view class="mode-icon__key"></view>
          <view class="mode-icon__key"></view>
          <view class="mode-icon__space"></view>
        </view>
        <view class="voice-button" v-else>
          <view class="voice-button__mic"></view>
          <view class="voice-button__stem"></view>
          <view class="voice-button__base"></view>
        </view>
      </view>
      <view
        class="composer-input"
        :class="{ 'composer-input--voice': isVoiceMode, 'composer-input--recording': isVoiceInputActive }"
        @touchstart="startVoiceInput"
        @touchend="stopVoiceInput"
        @touchcancel="stopVoiceInput"
      >
        <view v-if="isVoiceMode" class="voice-input">
          <view class="voice-button" :class="{ 'voice-button--recording': isVoiceInputActive }">
            <view class="voice-button__mic"></view>
            <view class="voice-button__stem"></view>
            <view class="voice-button__base"></view>
          </view>
          <view class="voice-wave" :class="{ 'voice-wave--recording': isVoiceInputActive }">
            <view
              v-for="(height, index) in voiceWaveBars"
              :key="index"
              class="voice-wave__bar"
              :style="{ height: `${height}rpx` }"
            ></view>
          </view>
        </view>
        <input
          v-else
          v-model="textValue"
          class="composer-text-input"
          type="text"
          confirm-type="send"
          placeholder="输入问题或描述症状..."
          placeholder-class="placeholder"
          @confirm="sendTextMessage"
        />
      </view>
      <view class="send-button" @tap="sendTextMessage">↑</view>
    </view>

    <view class="home-indicator"></view>
  </view>
</template>

<style scoped lang="scss">
.composer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 16rpx 12rpx;
  border-top: 1px dashed rgba(99, 159, 255, 0.7);
  background: rgba(220, 235, 250, 0.72);
  backdrop-filter: blur(8px);
}

.composer-top {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 66rpx;
  width: 66rpx;
  height: 66rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8rpx 18rpx rgba(122, 77, 174, 0.08);
  line-height: 1;
  transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.add-button--voice {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12rpx 26rpx rgba(162, 70, 244, 0.14);
}

.composer-input {
  flex: 1;
  height: 66rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.5);
  padding: 0 26rpx;
  display: flex;
  align-items: center;
  min-width: 0;
  transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.composer-input--voice {
  padding: 0 20rpx 0 12rpx;
}

.composer-input--recording {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12rpx 26rpx rgba(162, 70, 244, 0.16);
  transform: scale(0.992);
}

.voice-input {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.mode-icon--keyboard {
  display: grid;
  grid-template-columns: repeat(3, 7rpx);
  grid-auto-rows: 7rpx;
  gap: 4rpx;
  justify-content: center;
  width: 34rpx;
}

.mode-icon__key,
.mode-icon__space {
  border-radius: 3rpx;
  background: #a246f4;
}

.mode-icon__space {
  grid-column: span 3;
  width: 26rpx;
  justify-self: center;
}

.voice-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42rpx;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 8rpx 18rpx rgba(122, 77, 174, 0.12);
}

.voice-button--recording {
  background: #a246f4;
  box-shadow: 0 10rpx 22rpx rgba(162, 70, 244, 0.24);
}

.voice-button__mic {
  width: 14rpx;
  height: 20rpx;
  border: 3rpx solid #a246f4;
  border-radius: 999rpx;
}

.voice-button__stem {
  position: absolute;
  left: 50%;
  bottom: 10rpx;
  width: 3rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #a246f4;
  transform: translateX(-50%);
}

.voice-button__base {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  width: 16rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #a246f4;
  transform: translateX(-50%);
}

.voice-button--recording .voice-button__mic {
  border-color: #ffffff;
}

.voice-button--recording .voice-button__stem,
.voice-button--recording .voice-button__base {
  background: #ffffff;
}

.voice-wave {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  height: 52rpx;
  min-width: 0;
}

.voice-wave__bar {
  width: 7rpx;
  min-height: 12rpx;
  border-radius: 999rpx;
  background: rgba(162, 70, 244, 0.34);
  transition: background 160ms ease, transform 160ms ease;
}

.composer-text-input {
  width: 100%;
  height: 66rpx;
  color: #303544;
  font-size: 15px;
  line-height: 66rpx;
}

.placeholder {
  color: #a2abb8;
  font-size: 15px;
  line-height: 1;
}

.voice-wave--recording .voice-wave__bar {
  background: #a246f4;
  animation: voice-wave-pulse 860ms ease-in-out infinite;
}

.voice-wave--recording .voice-wave__bar:nth-child(2n) {
  animation-delay: 100ms;
}

.voice-wave--recording .voice-wave__bar:nth-child(3n) {
  animation-delay: 180ms;
}

@keyframes voice-wave-pulse {
  0%,
  100% {
    transform: scaleY(0.72);
  }

  50% {
    transform: scaleY(1.18);
  }
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66rpx;
  height: 66rpx;
  border-radius: 50%;
  background: #a246f4;
  color: #ffffff;
  font-size: 34rpx;
  line-height: 1;
  font-weight: 600;
}

.home-indicator {
  width: 220rpx;
  height: 8rpx;
  border-radius: 999rpx;
  margin: 18rpx auto 0;
  background: rgba(95, 103, 114, 0.28);
}
</style>
