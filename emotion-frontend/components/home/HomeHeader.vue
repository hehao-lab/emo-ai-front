<script setup>
const emit = defineEmits(['menu'])
</script>

<template>
  <view class="header">
    <view class="header-row">
      <view class="menu-icon" hover-class="menu-icon--active" @tap="emit('menu')">
        <text></text>
        <text></text>
        <text></text>
      </view>

      <view class="mute-icon" aria-hidden="true">
        <view class="mute-icon__body"></view>
        <view class="mute-icon__cone"></view>
        <view class="mute-icon__slash"></view>
      </view>
    </view>

    <view class="hero-title">
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
  width: 36rpx;
  height: 28rpx;
}

.mute-icon__body {
  position: absolute;
  left: 4rpx;
  top: 8rpx;
  width: 10rpx;
  height: 12rpx;
  border-radius: 2rpx;
  background: #98a5b4;
}

.mute-icon__cone {
  position: absolute;
  left: 12rpx;
  top: 6rpx;
  width: 0;
  height: 0;
  border-top: 8rpx solid transparent;
  border-bottom: 8rpx solid transparent;
  border-left: 12rpx solid #98a5b4;
}

.mute-icon__slash {
  position: absolute;
  right: 0;
  top: 2rpx;
  width: 4rpx;
  height: 24rpx;
  border-radius: 999rpx;
  background: #b3bac7;
  transform: rotate(42deg);
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
