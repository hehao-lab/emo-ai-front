<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  voiceListening: {
    type: Boolean,
    default: false,
  },
  voiceEnabled: {
    type: Boolean,
    default: false,
  },
  voiceSupported: {
    type: Boolean,
    default: true,
  },
  voiceStatusText: {
    type: String,
    default: '点按开启语音输入',
  },
})

const emit = defineEmits(['send', 'voice-enable-requested', 'voice-disable-requested'])
const isVoiceMode = ref(false)
const textValue = ref('')
const voiceWaveBars = [18, 28, 42, 24, 34, 50, 30, 40, 22]

const isVoiceInputActive = computed(() => props.voiceListening)

watch(
  () => props.voiceEnabled,
  (enabled) => {
    isVoiceMode.value = enabled
  },
)

const toggleVoiceMode = () => {
  isVoiceMode.value = !isVoiceMode.value

  if (isVoiceMode.value) {
    emit('voice-enable-requested')
    return
  }

  emit('voice-disable-requested')
}

const startVoiceInput = () => {
  if (!isVoiceMode.value || props.voiceEnabled || !props.voiceSupported) return

  emit('voice-enable-requested')
}

const stopVoiceInput = () => {}

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
          <text class="voice-status">{{ voiceStatusText }}</text>
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

  </view>
</template>

<style scoped lang="scss">
.composer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10rpx 16rpx calc(12rpx + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
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
  border: 2rpx solid var(--border);
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
  line-height: 1;
  transition: background 160ms var(--ease), transform 160ms var(--ease), box-shadow 160ms var(--ease);
}

.add-button--voice {
  border-color: var(--primary);
  background: var(--primary-bg);
}

.composer-input {
  flex: 1;
  height: 66rpx;
  border: 2rpx solid var(--border);
  border-radius: 999rpx;
  background: #f8f9fb;
  padding: 0 26rpx;
  display: flex;
  align-items: center;
  min-width: 0;
  transition: background 160ms var(--ease), transform 160ms var(--ease), box-shadow 160ms var(--ease);
}

.composer-input--voice {
  padding: 0 20rpx 0 12rpx;
}

.composer-input--recording {
  border-color: var(--primary);
  background: var(--primary-bg);
  box-shadow: 0 0 0 6rpx rgba(10, 124, 255, 0.1);
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
  background: var(--primary);
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
  border: 2rpx solid var(--border);
  background: #ffffff;
}

.voice-button--recording {
  border-color: var(--primary-active);
  background: var(--primary);
}

.voice-button__mic {
  width: 14rpx;
  height: 20rpx;
  border: 3rpx solid var(--primary);
  border-radius: 999rpx;
}

.voice-button__stem {
  position: absolute;
  left: 50%;
  bottom: 10rpx;
  width: 3rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: var(--primary);
  transform: translateX(-50%);
}

.voice-button__base {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  width: 16rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: var(--primary);
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

.voice-status {
  flex: 0 0 auto;
  max-width: 220rpx;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice-wave__bar {
  width: 7rpx;
  min-height: 12rpx;
  border-radius: 999rpx;
  background: rgba(10, 124, 255, 0.24);
  transition: background 160ms var(--ease), transform 160ms var(--ease);
}

.composer-text-input {
  width: 100%;
  height: 66rpx;
  color: var(--text-body);
  font-size: 15px;
  font-weight: 600;
  line-height: 66rpx;
}

.placeholder {
  color: var(--text-disabled);
  font-size: 15px;
  line-height: 1;
}

.voice-wave--recording .voice-wave__bar {
  background: var(--primary);
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
  background: var(--primary);
  color: #ffffff;
  font-size: 34rpx;
  line-height: 1;
  font-weight: 800;
  box-shadow: 0 8rpx 0 0 var(--focus-yellow-d);
}

</style>
