<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <view class="profile-panel">
    <view class="avatar-wrap">
      <view class="avatar-photo">
        <view class="avatar-bg"></view>
        <view class="avatar-neck"></view>
        <view class="avatar-jacket"></view>
        <view class="avatar-face"></view>
        <view class="avatar-hair"></view>
        <view class="avatar-eye avatar-eye--left"></view>
        <view class="avatar-eye avatar-eye--right"></view>
        <view class="avatar-nose"></view>
        <view class="avatar-mouth"></view>
      </view>
      <view class="avatar-add">
        <text class="avatar-add__plus">+</text>
      </view>
    </view>

    <view class="name-row">
      <text class="name-text">{{ name }}</text>
      <view class="edit-icon">
        <view class="edit-icon__shaft"></view>
        <view class="edit-icon__tip"></view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.profile-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 70rpx;
}

.avatar-wrap {
  position: relative;
  width: 136rpx;
  height: 136rpx;
}

.avatar-photo {
  position: relative;
  width: 136rpx;
  height: 136rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: linear-gradient(180deg, #b5c3d3 0%, #6f8298 100%);
}

.avatar-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 68% 30%, rgba(241, 248, 255, 0.9) 0, rgba(241, 248, 255, 0.28) 20%, transparent 48%),
    linear-gradient(135deg, #88a0b8 0%, #a9b9ca 32%, #7c8fa4 100%);
}

.avatar-neck {
  position: absolute;
  left: 56rpx;
  top: 76rpx;
  width: 28rpx;
  height: 22rpx;
  border-radius: 12rpx;
  background: #d6a987;
}

.avatar-jacket {
  position: absolute;
  left: 26rpx;
  bottom: -2rpx;
  width: 92rpx;
  height: 62rpx;
  border-radius: 34rpx 34rpx 10rpx 10rpx;
  background:
    linear-gradient(90deg, #637384 0%, #47586b 28%, #dce5ee 29%, #dce5ee 36%, #54697f 37%, #4a586c 100%);
}

.avatar-face {
  position: absolute;
  left: 42rpx;
  top: 24rpx;
  width: 52rpx;
  height: 68rpx;
  border-radius: 28rpx 28rpx 26rpx 26rpx;
  background: #d7a784;
}

.avatar-hair {
  position: absolute;
  left: 34rpx;
  top: 14rpx;
  width: 66rpx;
  height: 44rpx;
  border-radius: 30rpx 30rpx 18rpx 18rpx;
  background: #2d1d18;
}

.avatar-eye {
  position: absolute;
  top: 54rpx;
  width: 7rpx;
  height: 7rpx;
  border-radius: 50%;
  background: #2d241f;
}

.avatar-eye--left {
  left: 56rpx;
}

.avatar-eye--right {
  right: 56rpx;
}

.avatar-nose {
  position: absolute;
  left: 66rpx;
  top: 58rpx;
  width: 4rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(168, 118, 88, 0.72);
}

.avatar-mouth {
  position: absolute;
  left: 56rpx;
  top: 74rpx;
  width: 24rpx;
  height: 10rpx;
  border-bottom: 3rpx solid #915c4e;
  border-radius: 0 0 20rpx 20rpx;
}

.avatar-add {
  position: absolute;
  right: -4rpx;
  bottom: -6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border: 5rpx solid #ffffff;
  border-radius: 50%;
  background: #a54cf4;
  box-shadow: 0 10rpx 18rpx rgba(165, 76, 244, 0.24);
}

.avatar-add__plus {
  color: #ffffff;
  font-size: 26rpx;
  line-height: 1;
  transform: translateY(-1rpx);
}

.name-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 36rpx;
}

.name-text {
  color: #232733;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.2;
}

.edit-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
}

.edit-icon__shaft {
  position: absolute;
  left: 3rpx;
  top: 9rpx;
  width: 18rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: #a54cf4;
  transform: rotate(-42deg);
}

.edit-icon__tip {
  position: absolute;
  right: 1rpx;
  top: 4rpx;
  width: 0;
  height: 0;
  border-left: 8rpx solid #c17cff;
  border-top: 5rpx solid transparent;
  border-bottom: 5rpx solid transparent;
  transform: rotate(-42deg);
}
</style>
