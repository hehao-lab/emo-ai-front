<script setup>
defineProps({
  messageLines: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <view class="chat-bubble">
    <view v-for="(line, index) in messageLines" :key="line" class="chat-line">
      <text>{{ line }}</text>
      <text v-if="index === 0" class="heart">❤</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.chat-bubble {
  margin-top: 24rpx;
  width: 100%;
  padding: 24rpx 26rpx 28rpx;
  border: 2rpx solid rgba(248, 166, 178, 0.76);
  border-radius: 12rpx 30rpx 30rpx 30rpx;
  background:
    radial-gradient(circle, rgba(248, 166, 178, 0.18) 1.5px, transparent 1.5px) 0 0 / 28rpx 28rpx,
    radial-gradient(circle, rgba(255, 255, 255, 0.18) 1px, transparent 1px) 7rpx 7rpx / 14rpx 14rpx,
    #fdf1f2;
  box-shadow: var(--shadow-soft);
}

.chat-line {
  color: #8c5360;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.55;
}

.heart {
  color: var(--error);
}
</style>
