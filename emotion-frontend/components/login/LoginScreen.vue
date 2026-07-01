<script setup>
import { ref } from 'vue'

const emit = defineEmits(['success'])

const agreementChecked = ref(false)
const noticeText = ref('')

const toggleAgreement = () => {
  agreementChecked.value = !agreementChecked.value
  if (agreementChecked.value) {
    noticeText.value = ''
  }
}

const handleLogin = () => {
  if (!agreementChecked.value) {
    noticeText.value = '请先阅读并同意服务协议与隐私政策'
    return
  }

  emit('success')
}
</script>

<template>
  <view class="login-page">
    <view class="login-top">
      <view class="brand-mark">
        <view class="brand-orbit"></view>
        <view class="brand-spark brand-spark--one"></view>
        <view class="brand-spark brand-spark--two"></view>
      </view>
      <text class="brand-name">星师情感</text>
      <view class="support-icon">
        <view class="support-icon__arc"></view>
        <view class="support-icon__left"></view>
        <view class="support-icon__right"></view>
      </view>
    </view>

    <view class="hero-area">
      <view class="bubble bubble--left-top">恋爱问题来问我</view>
      <view class="bubble bubble--right-top">关系报告给我看</view>
      <view class="bubble bubble--left-mid">分手复合我帮你</view>
      <view class="bubble bubble--right-mid">定制情感小目标</view>

      <view class="float-icon float-icon--heart">
        <text>♡</text>
      </view>
      <view class="float-icon float-icon--note">
        <text>✦</text>
      </view>
      <view class="float-icon float-icon--chat">
        <text>?</text>
      </view>

      <view class="assistant-figure">
        <view class="assistant-hair"></view>
        <view class="assistant-face"></view>
        <view class="assistant-ear assistant-ear--left"></view>
        <view class="assistant-ear assistant-ear--right"></view>
        <view class="assistant-eye assistant-eye--left"></view>
        <view class="assistant-eye assistant-eye--right"></view>
        <view class="assistant-glasses assistant-glasses--left"></view>
        <view class="assistant-glasses assistant-glasses--right"></view>
        <view class="assistant-glasses-bridge"></view>
        <view class="assistant-smile"></view>
        <view class="assistant-neck"></view>
        <view class="assistant-shirt"></view>
        <view class="assistant-coat"></view>
        <view class="assistant-arm"></view>
        <view class="assistant-hand"></view>
      </view>
    </view>

    <view class="welcome-copy">
      <text class="welcome-title">Hi，我是</text>
      <text class="welcome-name">星师</text>
      <text class="welcome-subtitle">感情的事，慢慢说给我听～</text>
    </view>

    <view class="login-actions">
      <view
        class="primary-login"
        :class="{ 'primary-login--disabled': !agreementChecked }"
        hover-class="primary-login--active"
        @tap="handleLogin"
      >
        <view class="primary-login__badge">
          <text>星</text>
        </view>
        <text class="primary-login__text">一键登录</text>
      </view>

      <view class="agreement-row" @tap="toggleAgreement">
        <view class="agreement-check" :class="{ 'agreement-check--checked': agreementChecked }">
          <text v-if="agreementChecked">✓</text>
        </view>
        <text class="agreement-text">阅读并同意《服务协议》《隐私政策》</text>
      </view>

      <text v-if="noticeText" class="login-notice">{{ noticeText }}</text>

      <view class="alternate-actions">
        <view class="alternate-button">
          <view class="phone-icon"></view>
          <text>手机号</text>
        </view>
        <view class="alternate-button">
          <view class="apple-icon"></view>
          <text>Apple ID</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  padding: 50rpx 54rpx 42rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 78% 10%, rgba(248, 166, 178, 0.24) 0, rgba(248, 166, 178, 0) 24%),
    radial-gradient(circle at 18% 24%, rgba(130, 213, 187, 0.28) 0, rgba(130, 213, 187, 0) 26%),
    linear-gradient(180deg, #f8f8f0 0%, #f8f3df 55%, #f6ebd7 100%);
}

.login-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 44rpx;
}

.brand-mark {
  position: relative;
  width: 52rpx;
  height: 48rpx;
}

.brand-orbit {
  position: absolute;
  left: 4rpx;
  top: 8rpx;
  width: 38rpx;
  height: 28rpx;
  border: 4rpx solid var(--primary-active);
  border-right-color: #82d5bb;
  border-radius: 50%;
  transform: rotate(-22deg);
}

.brand-spark {
  position: absolute;
  border-radius: 999rpx;
  background: #f8a6b2;
}

.brand-spark--one {
  left: 0;
  top: 8rpx;
  width: 6rpx;
  height: 20rpx;
  transform: rotate(34deg);
}

.brand-spark--two {
  right: 4rpx;
  top: 2rpx;
  width: 6rpx;
  height: 16rpx;
  transform: rotate(-34deg);
}

.brand-name {
  flex: 1;
  margin-left: 10rpx;
  color: var(--text);
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.support-icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
}

.support-icon__arc {
  position: absolute;
  left: 9rpx;
  top: 8rpx;
  width: 30rpx;
  height: 28rpx;
  border: 6rpx solid var(--text);
  border-bottom-color: transparent;
  border-radius: 26rpx 26rpx 0 0;
}

.support-icon__left,
.support-icon__right {
  position: absolute;
  top: 24rpx;
  width: 9rpx;
  height: 20rpx;
  border-radius: 999rpx;
  background: var(--text);
}

.support-icon__left {
  left: 6rpx;
}

.support-icon__right {
  right: 6rpx;
}

.hero-area {
  position: relative;
  height: 640rpx;
  margin-top: 58rpx;
}

.bubble {
  position: absolute;
  z-index: 2;
  padding: 18rpx 26rpx;
  color: var(--text-body);
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
  border: 2rpx solid var(--border);
  border-radius: 999rpx;
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
}

.bubble::after {
  content: '';
  position: absolute;
  left: 48%;
  bottom: -10rpx;
  width: 24rpx;
  height: 18rpx;
  border-radius: 0 0 20rpx 20rpx;
  background: rgba(255, 249, 227, 0.92);
  transform: skewX(-24deg);
}

.bubble--left-top {
  left: 56rpx;
  top: 0;
}

.bubble--right-top {
  right: 20rpx;
  top: 54rpx;
}

.bubble--left-mid {
  left: 0;
  top: 170rpx;
}

.bubble--right-mid {
  right: 0;
  top: 214rpx;
}

.float-icon {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2rpx solid var(--border);
  background: rgba(255, 249, 227, 0.92);
  box-shadow: inset 0 0 22rpx rgba(255, 255, 255, 0.74), var(--shadow-soft);
}

.float-icon text {
  color: var(--primary);
  font-weight: 800;
  line-height: 1;
}

.float-icon--heart {
  left: 118rpx;
  bottom: 118rpx;
  width: 88rpx;
  height: 88rpx;
}

.float-icon--heart text {
  font-size: 48rpx;
}

.float-icon--note {
  left: 286rpx;
  bottom: 310rpx;
  width: 70rpx;
  height: 70rpx;
  background: #fde4e8;
}

.float-icon--note text {
  font-size: 34rpx;
}

.float-icon--chat {
  right: 112rpx;
  bottom: 154rpx;
  width: 84rpx;
  height: 84rpx;
}

.float-icon--chat text {
  font-size: 40rpx;
}

.assistant-figure {
  position: absolute;
  left: 50%;
  bottom: 48rpx;
  z-index: 3;
  width: 270rpx;
  height: 340rpx;
  transform: translateX(-50%);
}

.assistant-hair {
  position: absolute;
  left: 63rpx;
  top: 12rpx;
  z-index: 3;
  width: 138rpx;
  height: 92rpx;
  border-radius: 72rpx 72rpx 30rpx 38rpx;
  background: #6a5034;
  transform: rotate(-8deg);
}

.assistant-face {
  position: absolute;
  left: 74rpx;
  top: 58rpx;
  z-index: 4;
  width: 118rpx;
  height: 126rpx;
  border-radius: 56rpx 56rpx 62rpx 62rpx;
  background: #ffd0b7;
}

.assistant-ear {
  position: absolute;
  top: 104rpx;
  z-index: 3;
  width: 28rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #f1ac92;
}

.assistant-ear--left {
  left: 56rpx;
}

.assistant-ear--right {
  right: 56rpx;
}

.assistant-eye {
  position: absolute;
  top: 112rpx;
  z-index: 7;
  width: 16rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #5e4630;
}

.assistant-eye--left {
  left: 103rpx;
}

.assistant-eye--right {
  right: 103rpx;
}

.assistant-glasses {
  position: absolute;
  top: 101rpx;
  z-index: 6;
  width: 42rpx;
  height: 42rpx;
  border: 4rpx solid rgba(255, 249, 227, 0.92);
  border-radius: 50%;
}

.assistant-glasses--left {
  left: 90rpx;
}

.assistant-glasses--right {
  right: 90rpx;
}

.assistant-glasses-bridge {
  position: absolute;
  left: 128rpx;
  top: 120rpx;
  z-index: 6;
  width: 18rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: rgba(255, 249, 227, 0.92);
}

.assistant-smile {
  position: absolute;
  left: 119rpx;
  top: 150rpx;
  z-index: 7;
  width: 32rpx;
  height: 14rpx;
  border-bottom: 4rpx solid #c56d60;
  border-radius: 0 0 24rpx 24rpx;
}

.assistant-neck {
  position: absolute;
  left: 119rpx;
  top: 174rpx;
  z-index: 2;
  width: 34rpx;
  height: 36rpx;
  border-radius: 14rpx;
  background: #eeb091;
}

.assistant-shirt {
  position: absolute;
  left: 92rpx;
  top: 204rpx;
  z-index: 2;
  width: 86rpx;
  height: 110rpx;
  border-radius: 20rpx;
  background: linear-gradient(180deg, #82d5bb 0%, #40a880 100%);
}

.assistant-coat {
  position: absolute;
  left: 54rpx;
  top: 198rpx;
  z-index: 3;
  width: 164rpx;
  height: 136rpx;
  border-radius: 52rpx 52rpx 18rpx 18rpx;
  background:
    linear-gradient(112deg, #ffffff 0%, #ffffff 42%, transparent 43%),
    linear-gradient(248deg, #ffffff 0%, #ffffff 42%, transparent 43%);
  box-shadow: 0 24rpx 34rpx rgba(121, 79, 39, 0.1);
}

.assistant-arm {
  position: absolute;
  right: 20rpx;
  top: 166rpx;
  z-index: 4;
  width: 38rpx;
  height: 104rpx;
  border-radius: 999rpx;
  background: #ffffff;
  transform: rotate(-28deg);
}

.assistant-hand {
  position: absolute;
  right: 8rpx;
  top: 132rpx;
  z-index: 5;
  width: 48rpx;
  height: 58rpx;
  border-radius: 28rpx 28rpx 18rpx 18rpx;
  background: #ffd0b7;
  transform: rotate(-10deg);
}

.welcome-copy {
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rpx;
  color: var(--text);
  font-weight: 800;
  text-align: center;
}

.welcome-title,
.welcome-name {
  font-size: 32px;
  line-height: 1.15;
}

.welcome-name {
  margin-left: 16rpx;
  color: var(--primary-active);
}

.welcome-subtitle {
  width: 100%;
  margin-top: 18rpx;
  font-size: 26px;
  color: var(--text-body);
  line-height: 1.26;
}

.login-actions {
  position: absolute;
  left: 54rpx;
  right: 54rpx;
  bottom: 44rpx;
}

.primary-login {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: #ffcc00;
  box-shadow: 0 10rpx 0 0 var(--focus-yellow-d);
}

.primary-login--active {
  transform: translateY(4rpx);
  box-shadow: 0 4rpx 0 0 var(--focus-yellow-d);
}

.primary-login--disabled {
  opacity: 0.7;
}

.primary-login__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
  color: var(--text);
  font-size: 32rpx;
  font-weight: 800;
}

.primary-login__text {
  flex: 1;
  color: var(--text);
  font-size: 19px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  transform: translateX(-24rpx);
}

.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-top: 28rpx;
}

.agreement-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  border: 3rpx solid var(--border);
  border-radius: 8rpx;
  color: #ffffff;
  font-size: 20rpx;
  line-height: 1;
  background: var(--bg-content);
}

.agreement-check--checked {
  border-color: var(--primary-active);
  background: var(--primary);
}

.agreement-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1;
}

.login-notice {
  display: block;
  margin-top: 16rpx;
  color: var(--error);
  font-size: 12px;
  line-height: 1;
  text-align: center;
}

.alternate-actions {
  display: flex;
  gap: 28rpx;
  margin-top: 94rpx;
}

.alternate-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  height: 78rpx;
  border: 2rpx solid var(--border);
  border-radius: 999rpx;
  color: var(--text);
  font-size: 17px;
  font-weight: 600;
  background: rgba(255, 249, 227, 0.86);
  box-shadow: var(--shadow-soft);
}

.phone-icon {
  width: 22rpx;
  height: 34rpx;
  border: 4rpx solid var(--text);
  border-radius: 6rpx;
}

.apple-icon {
  width: 26rpx;
  height: 30rpx;
  border-radius: 50% 50% 42% 42%;
  background: var(--text);
}
</style>
