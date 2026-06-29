<template>
  <view class="composer">
    <view class="composer-top">
      <view class="add-button">+</view>
      <view class="composer-input">
        <text class="placeholder">输入问题或描述症状...</text>
      </view>
      <view class="send-button">↑</view>
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
  width: 40rpx;
  height: 40rpx;
  color: #8f99aa;
  font-size: 46rpx;
  line-height: 1;
}

.composer-input {
  flex: 1;
  height: 66rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.44);
  padding: 0 26rpx;
  display: flex;
  align-items: center;
}

.placeholder {
  color: #a2abb8;
  font-size: 15px;
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
