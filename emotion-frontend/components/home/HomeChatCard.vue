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
  border: 2rpx solid var(--border);
  border-radius: 12rpx 30rpx 30rpx 30rpx;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.chat-line {
  color: var(--text-body);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.55;
}

.heart {
  color: var(--error);
}
</style>
