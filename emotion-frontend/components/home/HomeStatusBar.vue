<template>
  <view class="status-bar">
    <text class="status-time">14:49</text>

    <view class="status-meta">
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
        <text class="battery-level">60%</text>
        <view class="battery-fill"></view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18rpx;
}

.status-time {
  color: var(--text);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
}

.status-meta {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
  height: 20rpx;
}

.bar {
  width: 4rpx;
  background: var(--text);
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
  border-color: var(--text) transparent transparent transparent;
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
  background: var(--text);
}

.battery {
  position: relative;
  width: 58rpx;
  height: 22rpx;
  border: 2rpx solid var(--border-strong);
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.72);
}

.battery::after {
  content: '';
  position: absolute;
  right: -4rpx;
  top: 7rpx;
  width: 3rpx;
  height: 8rpx;
  border-radius: 0 4rpx 4rpx 0;
  background: var(--border-strong);
}

.battery-level {
  position: absolute;
  left: 5rpx;
  top: 3rpx;
  z-index: 1;
  color: var(--text-muted);
  font-size: 10rpx;
  font-weight: 700;
  line-height: 1;
}

.battery-fill {
  position: absolute;
  right: 3rpx;
  top: 3rpx;
  width: 24rpx;
  height: 14rpx;
  border-radius: 4rpx;
  background: linear-gradient(180deg, var(--primary-hover) 0%, var(--primary) 100%);
}
</style>
