<script setup>
const emit = defineEmits(['back'])
</script>

<template>
  <view class="top-bar">
    <view class="top-bar__left" hover-class="top-bar__left--active" @tap="emit('back')">
      <view class="back-arrow">
        <text class="back-arrow__line back-arrow__line--1"></text>
        <text class="back-arrow__line back-arrow__line--2"></text>
      </view>
      <text class="top-bar__time">14:50</text>
    </view>

    <text class="top-bar__title">我的</text>

    <view class="top-bar__status">
      <view class="signal-bars">
        <text class="bar bar-1"></text>
        <text class="bar bar-2"></text>
        <text class="bar bar-3"></text>
        <text class="bar bar-4"></text>
      </view>

      <view class="wifi-icon">
        <view class="wifi-outer"></view>
        <view class="wifi-inner"></view>
        <view class="wifi-dot"></view>
      </view>

      <view class="battery">
        <view class="battery-fill"></view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.top-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56rpx;
}

.top-bar__left {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 120rpx;
}

.top-bar__left--active {
  opacity: 0.74;
}

.back-arrow {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  overflow: visible;
}

.back-arrow__line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #2f3342;
  transform-origin: left center;
}

.back-arrow__line--1 {
  transform: translateX(-8rpx) rotate(-42deg);
}

.back-arrow__line--2 {
  transform: translateX(-8rpx) rotate(42deg);
}

.top-bar__time {
  color: #2f3342;
  font-size: 11px;
  line-height: 1;
}

.top-bar__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #1f2432;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.top-bar__status {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 120rpx;
  justify-content: flex-end;
}

.signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
  height: 20rpx;
}

.bar {
  width: 4rpx;
  background: #111111;
  border-radius: 4rpx 4rpx 0 0;
}

.bar-1 {
  height: 8rpx;
}

.bar-2 {
  height: 12rpx;
}

.bar-3 {
  height: 16rpx;
}

.bar-4 {
  height: 20rpx;
}

.wifi-icon {
  position: relative;
  width: 22rpx;
  height: 18rpx;
  overflow: hidden;
}

.wifi-outer,
.wifi-inner {
  position: absolute;
  left: 50%;
  border-style: solid;
  border-color: #111111 transparent transparent transparent;
  border-radius: 50%;
  transform: translateX(-50%);
}

.wifi-outer {
  top: 0;
  width: 22rpx;
  height: 22rpx;
  border-width: 3rpx;
}

.wifi-inner {
  top: 5rpx;
  width: 12rpx;
  height: 12rpx;
  border-width: 3rpx;
}

.wifi-dot {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 4rpx;
  height: 4rpx;
  margin-left: -2rpx;
  border-radius: 50%;
  background: #111111;
}

.battery {
  position: relative;
  width: 36rpx;
  height: 16rpx;
  border: 1px solid #b7b7bf;
  border-radius: 5rpx;
}

.battery::after {
  content: '';
  position: absolute;
  right: -4rpx;
  top: 4rpx;
  width: 3rpx;
  height: 6rpx;
  border-radius: 0 4rpx 4rpx 0;
  background: #b7b7bf;
}

.battery-fill {
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  width: 20rpx;
  height: 10rpx;
  border-radius: 3rpx;
  background: #a9a9b3;
}
</style>
