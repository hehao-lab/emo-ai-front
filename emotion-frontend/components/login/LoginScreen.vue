<script setup>
import { computed, ref } from 'vue'
import {
  loginUser,
  registerUser,
  sendRegisterEmailCode,
} from '../../common/user-api.mjs'

const emit = defineEmits(['success'])

const mode = ref('login')
const agreementChecked = ref(false)
const noticeText = ref('')
const isSubmitting = ref(false)
const isSendingCode = ref(false)

const loginForm = ref({
  phone: '',
  password: '',
})
const registerForm = ref({
  username: '',
  phone: '',
  email: '',
  password: '',
  verificationCode: '',
})

const isLoginMode = computed(() => mode.value === 'login')
const submitLabel = computed(() => {
  if (isSubmitting.value) {
    return isLoginMode.value ? '登录中...' : '注册中...'
  }

  return isLoginMode.value ? '登录' : '注册'
})

function getInputValue(event) {
  return event?.detail?.value ?? ''
}

function onlyDigits(value, maxLength = 11) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength)
}

function setNotice(message) {
  noticeText.value = message
}

function clearNotice() {
  noticeText.value = ''
}

function switchMode(nextMode) {
  mode.value = nextMode
  clearNotice()
}

function toggleAgreement() {
  agreementChecked.value = !agreementChecked.value

  if (agreementChecked.value) {
    clearNotice()
  }
}

function handleLoginPhoneInput(event) {
  loginForm.value.phone = onlyDigits(getInputValue(event))
}

function handleLoginPasswordInput(event) {
  loginForm.value.password = getInputValue(event)
}

function handleRegisterUsernameInput(event) {
  registerForm.value.username = getInputValue(event).trim()
}

function handleRegisterPhoneInput(event) {
  registerForm.value.phone = onlyDigits(getInputValue(event))
}

function handleRegisterEmailInput(event) {
  registerForm.value.email = getInputValue(event).trim()
}

function handleRegisterPasswordInput(event) {
  registerForm.value.password = getInputValue(event)
}

function handleRegisterCodeInput(event) {
  registerForm.value.verificationCode = onlyDigits(getInputValue(event), 6)
}

function validateAgreement() {
  if (agreementChecked.value) {
    return true
  }

  setNotice('请先阅读并同意服务协议与隐私政策')
  return false
}

function validatePhone(phone) {
  return /^1\d{10}$/.test(phone)
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleSendEmailCode() {
  if (isSendingCode.value) {
    return
  }

  if (!validateEmail(registerForm.value.email)) {
    setNotice('请输入正确的邮箱，用来接收验证码')
    return
  }

  isSendingCode.value = true
  clearNotice()

  try {
    await sendRegisterEmailCode(registerForm.value.email)
    setNotice('验证码已发送，请到后端控制台日志里查看')
  } catch (error) {
    setNotice(error instanceof Error ? error.message : '验证码发送失败')
  } finally {
    isSendingCode.value = false
  }
}

async function handleLogin() {
  if (isSubmitting.value || !validateAgreement()) {
    return
  }

  if (!validatePhone(loginForm.value.phone)) {
    setNotice('请输入 1 开头的 11 位手机号')
    return
  }

  if (!loginForm.value.password) {
    setNotice('请输入密码')
    return
  }

  isSubmitting.value = true
  clearNotice()

  try {
    await loginUser({
      phone: loginForm.value.phone,
      password: loginForm.value.password,
    })
    emit('success')
  } catch (error) {
    setNotice(error instanceof Error ? error.message : '登录失败')
  } finally {
    isSubmitting.value = false
  }
}

async function handleRegister() {
  if (isSubmitting.value || !validateAgreement()) {
    return
  }

  if (!registerForm.value.username) {
    setNotice('请输入用户名')
    return
  }

  if (!validatePhone(registerForm.value.phone)) {
    setNotice('请输入 1 开头的 11 位手机号')
    return
  }

  if (!validateEmail(registerForm.value.email)) {
    setNotice('请输入正确的邮箱')
    return
  }

  if (!registerForm.value.password) {
    setNotice('请输入密码')
    return
  }

  if (!registerForm.value.verificationCode) {
    setNotice('请输入邮箱验证码')
    return
  }

  isSubmitting.value = true
  clearNotice()

  try {
    await registerUser({
      username: registerForm.value.username,
      password: registerForm.value.password,
      phone: registerForm.value.phone,
      email: registerForm.value.email,
      verificationCode: registerForm.value.verificationCode,
    })
    loginForm.value.phone = registerForm.value.phone
    loginForm.value.password = registerForm.value.password
    switchMode('login')
    setNotice('注册成功，请登录')
  } catch (error) {
    setNotice(error instanceof Error ? error.message : '注册失败')
  } finally {
    isSubmitting.value = false
  }
}

function handleSubmit() {
  if (isLoginMode.value) {
    handleLogin()
    return
  }

  handleRegister()
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

    <view class="welcome-copy">
      <text class="welcome-title">Hi，我是</text>
      <text class="welcome-name">星师</text>
      <text class="welcome-subtitle">感情的事，慢慢说给我听。</text>
    </view>

    <view class="auth-panel">
      <view class="auth-tabs">
        <view
          class="auth-tab"
          :class="{ 'auth-tab--active': isLoginMode }"
          @tap="switchMode('login')"
        >
          <text>登录</text>
        </view>
        <view
          class="auth-tab"
          :class="{ 'auth-tab--active': !isLoginMode }"
          @tap="switchMode('register')"
        >
          <text>注册</text>
        </view>
      </view>

      <view v-if="isLoginMode" class="auth-form">
        <input
          class="auth-input"
          name="phone"
          autocomplete="tel"
          type="text"
          inputmode="numeric"
          maxlength="11"
          placeholder="请输入手机号"
          :value="loginForm.phone"
          @input="handleLoginPhoneInput"
        ></input>
        <input
          class="auth-input"
          name="password"
          autocomplete="current-password"
          type="password"
          placeholder="请输入密码"
          :value="loginForm.password"
          @input="handleLoginPasswordInput"
        ></input>
      </view>

      <view v-else class="auth-form">
        <input
          class="auth-input"
          name="username"
          autocomplete="username"
          type="text"
          placeholder="请输入用户名"
          :value="registerForm.username"
          @input="handleRegisterUsernameInput"
        ></input>
        <input
          class="auth-input"
          name="register-phone"
          autocomplete="tel"
          type="text"
          inputmode="numeric"
          maxlength="11"
          placeholder="请输入手机号"
          :value="registerForm.phone"
          @input="handleRegisterPhoneInput"
        ></input>
        <input
          class="auth-input"
          name="email"
          autocomplete="email"
          type="text"
          placeholder="请输入邮箱"
          :value="registerForm.email"
          @input="handleRegisterEmailInput"
        ></input>
        <input
          class="auth-input"
          name="new-password"
          autocomplete="new-password"
          type="password"
          placeholder="请输入密码"
          :value="registerForm.password"
          @input="handleRegisterPasswordInput"
        ></input>
        <view class="code-row">
          <input
            class="auth-input auth-input--code"
            name="verificationCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="邮箱验证码"
            :value="registerForm.verificationCode"
            @input="handleRegisterCodeInput"
          ></input>
          <view
            class="code-button"
            :class="{ 'code-button--disabled': isSendingCode }"
            @tap="handleSendEmailCode"
          >
            <text>{{ isSendingCode ? '发送中...' : '获取验证码' }}</text>
          </view>
        </view>
      </view>

      <view
        class="primary-login"
        :class="{ 'primary-login--disabled': isSubmitting }"
        hover-class="primary-login--active"
        @tap="handleSubmit"
      >
        <text class="primary-login__text">{{ submitLabel }}</text>
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
  padding: 50rpx 42rpx 42rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 78% 10%, rgba(255, 232, 228, 0.9) 0, rgba(255, 232, 228, 0) 30%),
    radial-gradient(circle at 18% 24%, rgba(226, 219, 255, 0.95) 0, rgba(226, 219, 255, 0) 34%),
    linear-gradient(180deg, #f7f0fb 0%, #f6f6ff 48%, #fff4f2 100%);
}

.login-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 44rpx;
  pointer-events: none;
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

.welcome-copy {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 92rpx;
  color: #10122a;
  font-weight: 800;
  text-align: center;
  pointer-events: none;
}

.welcome-title,
.welcome-name {
  font-size: 31px;
  line-height: 1.15;
}

.welcome-name {
  margin-left: 16rpx;
  color: var(--primary-active);
}

.welcome-subtitle {
  width: 100%;
  margin-top: 18rpx;
  color: #596074;
  font-size: 16px;
  line-height: 1.4;
}

.auth-panel {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  margin-top: 70rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20rpx 44rpx rgba(116, 130, 164, 0.14);
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  padding: 8rpx;
  border-radius: 24rpx;
  background: #eef1fb;
}

.auth-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68rpx;
  border-radius: 20rpx;
  color: #7b8496;
  font-size: 15px;
  font-weight: 800;
}

.auth-tab--active {
  color: #ffffff;
  background: #6657f5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 26rpx;
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
  background: #766ff0;
}

.primary-login__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
}

.primary-login__text {
  flex: 1;
  color: #ffffff;
  font-size: 19px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  transform: translateX(-24rpx);
}

.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-top: 26rpx;
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
  color: #e45b67;
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
  border-radius: 999rpx;
  color: #17192a;
  font-size: 17px;
  font-weight: 600;
  background: rgba(242, 241, 255, 0.8);
}

.phone-icon {
  width: 22rpx;
  height: 34rpx;
  border: 4rpx solid #17192a;
  border-radius: 6rpx;
}

.apple-icon {
  width: 26rpx;
  height: 30rpx;
  border-radius: 50% 50% 42% 42%;
  background: #17192a;
}
</style>
