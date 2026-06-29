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
  border-radius: 0 30rpx 30rpx 30rpx;
  background: rgba(255, 255, 255, 0.95);
}

.chat-line {
  color: #3f495c;
  font-size: 16px;
  line-height: 1.55;
}

.heart {
  color: #f01326;
}
</style>
