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
  loginForm.value.phone = getInputValue(event).trim()
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

  if (!loginForm.value.phone.trim()) {
    setNotice('请输入手机号或用户名')
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
      <text class="brand-name">军师情感</text>
      <view class="support-icon">
        <view class="support-icon__arc"></view>
        <view class="support-icon__left"></view>
        <view class="support-icon__right"></view>
      </view>
    </view>

    <view class="welcome-copy">
      <text class="welcome-title">Hi，我是</text>
      <text class="welcome-name">军师</text>
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
        <view class="auth-field">
          <view class="auth-field__icon auth-field__icon--phone"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">账号</text>
            <input
              class="auth-input"
              name="phone"
              autocomplete="username"
              type="text"
              placeholder="手机号 / 用户名"
              placeholder-class="auth-input__placeholder"
              :value="loginForm.phone"
              @input="handleLoginPhoneInput"
            ></input>
          </view>
        </view>
        <view class="auth-field">
          <view class="auth-field__icon auth-field__icon--lock"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">密码</text>
            <input
              class="auth-input"
              name="password"
              autocomplete="current-password"
              type="password"
              placeholder="请输入密码"
              placeholder-class="auth-input__placeholder"
              :value="loginForm.password"
              @input="handleLoginPasswordInput"
            ></input>
          </view>
        </view>
      </view>

      <view v-else class="auth-form">
        <view class="auth-field">
          <view class="auth-field__icon auth-field__icon--user"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">用户名</text>
            <input
              class="auth-input"
              name="username"
              autocomplete="username"
              type="text"
              placeholder="请输入用户名"
              placeholder-class="auth-input__placeholder"
              :value="registerForm.username"
              @input="handleRegisterUsernameInput"
            ></input>
          </view>
        </view>
        <view class="auth-field">
          <view class="auth-field__icon auth-field__icon--phone"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">手机号</text>
            <input
              class="auth-input"
              name="register-phone"
              autocomplete="tel"
              type="text"
              inputmode="numeric"
              maxlength="11"
              placeholder="请输入手机号"
              placeholder-class="auth-input__placeholder"
              :value="registerForm.phone"
              @input="handleRegisterPhoneInput"
            ></input>
          </view>
        </view>
        <view class="auth-field">
          <view class="auth-field__icon auth-field__icon--mail"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">邮箱</text>
            <input
              class="auth-input"
              name="email"
              autocomplete="email"
              type="text"
              placeholder="请输入邮箱"
              placeholder-class="auth-input__placeholder"
              :value="registerForm.email"
              @input="handleRegisterEmailInput"
            ></input>
          </view>
        </view>
        <view class="auth-field">
          <view class="auth-field__icon auth-field__icon--lock"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">密码</text>
            <input
              class="auth-input"
              name="new-password"
              autocomplete="new-password"
              type="password"
              placeholder="请输入密码"
              placeholder-class="auth-input__placeholder"
              :value="registerForm.password"
              @input="handleRegisterPasswordInput"
            ></input>
          </view>
        </view>
        <view class="auth-field auth-field--code">
          <view class="auth-field__icon auth-field__icon--code"></view>
          <view class="auth-field__body">
            <text class="auth-field__label">验证码</text>
            <view class="code-row">
              <input
                class="auth-input auth-input--code"
                name="verificationCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="邮箱验证码"
                placeholder-class="auth-input__placeholder"
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
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100dvh;
  padding: 50rpx 42rpx 42rpx;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7f9 52%, #eef1f5 100%);
}

.login-page::before {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 180rpx;
  height: 260rpx;
  border-radius: 60rpx;
  background:
    radial-gradient(circle at 34% 30%, rgba(10, 124, 255, 0.08), transparent 34%),
    radial-gradient(circle at 70% 46%, rgba(17, 24, 39, 0.05), transparent 30%);
  filter: blur(10rpx);
  content: '';
  pointer-events: none;
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
  border-right-color: var(--primary-hover);
  border-radius: 50%;
  transform: rotate(-22deg);
}

.brand-spark {
  position: absolute;
  border-radius: 999rpx;
  background: var(--error);
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
  margin-top: 88rpx;
  color: var(--text);
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
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.4;
}

.auth-panel {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  margin-top: 58rpx;
  padding: 30rpx;
  border: 2rpx solid var(--border);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18rpx 0 rgba(207, 213, 221, 0.42), 0 28rpx 56rpx rgba(17, 24, 39, 0.08);
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  padding: 8rpx;
  border-radius: 24rpx;
  border: 2rpx solid var(--border);
  background: var(--bg-soft);
}

.auth-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68rpx;
  border-radius: 20rpx;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 800;
}

.auth-tab--active {
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 6rpx 0 0 var(--primary-active);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.auth-field {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 96rpx;
  padding: 14rpx 18rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 -4rpx 0 rgba(227, 230, 235, 0.72);
}

.auth-field--code {
  align-items: stretch;
}

.auth-field__icon {
  position: relative;
  flex: 0 0 46rpx;
  width: 46rpx;
  height: 46rpx;
  border: 2rpx solid rgba(10, 124, 255, 0.28);
  border-radius: 14rpx;
  background: var(--primary-bg);
}

.auth-field__icon--user::before,
.auth-field__icon--phone::before,
.auth-field__icon--mail::before,
.auth-field__icon--lock::before,
.auth-field__icon--code::before,
.auth-field__icon--code::after {
  position: absolute;
  content: '';
}

.auth-field__icon--user::before {
  left: 14rpx;
  top: 9rpx;
  width: 14rpx;
  height: 14rpx;
  border: 3rpx solid var(--primary-active);
  border-radius: 50%;
}

.auth-field__icon--user::after {
  position: absolute;
  left: 10rpx;
  bottom: 8rpx;
  width: 24rpx;
  height: 14rpx;
  border: 3rpx solid var(--primary-active);
  border-bottom: 0;
  border-radius: 18rpx 18rpx 0 0;
  content: '';
}

.auth-field__icon--phone::before {
  left: 13rpx;
  top: 7rpx;
  width: 18rpx;
  height: 28rpx;
  border: 3rpx solid var(--primary-active);
  border-radius: 7rpx;
}

.auth-field__icon--mail::before {
  left: 9rpx;
  top: 12rpx;
  width: 25rpx;
  height: 19rpx;
  border: 3rpx solid var(--primary-active);
  border-radius: 5rpx;
}

.auth-field__icon--mail::after {
  position: absolute;
  left: 13rpx;
  top: 15rpx;
  width: 18rpx;
  height: 18rpx;
  border-left: 3rpx solid var(--primary-active);
  border-bottom: 3rpx solid var(--primary-active);
  content: '';
  transform: rotate(-45deg);
}

.auth-field__icon--lock::before {
  left: 12rpx;
  top: 18rpx;
  width: 20rpx;
  height: 17rpx;
  border: 3rpx solid var(--primary-active);
  border-radius: 5rpx;
}

.auth-field__icon--lock::after {
  position: absolute;
  left: 15rpx;
  top: 8rpx;
  width: 14rpx;
  height: 16rpx;
  border: 3rpx solid var(--primary-active);
  border-bottom: 0;
  border-radius: 14rpx 14rpx 0 0;
  content: '';
}

.auth-field__icon--code::before {
  left: 10rpx;
  top: 10rpx;
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid var(--primary-active);
  border-radius: 50%;
}

.auth-field__icon--code::after {
  left: 20rpx;
  top: 20rpx;
  width: 5rpx;
  height: 5rpx;
  border-radius: 50%;
  background: var(--primary-active);
  box-shadow: 10rpx 0 0 var(--primary-active), -10rpx 0 0 var(--primary-active);
}

.auth-field__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.auth-field__label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.auth-input {
  width: 100%;
  height: 42rpx;
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  line-height: 42rpx;
}

.auth-input__placeholder {
  color: var(--text-disabled);
  font-size: 15px;
  font-weight: 600;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.auth-input--code {
  flex: 1;
  min-width: 0;
}

.code-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 172rpx;
  height: 56rpx;
  padding: 0 18rpx;
  border: 2rpx solid var(--primary-active);
  border-radius: 999rpx;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  background: var(--primary);
  box-shadow: 0 6rpx 0 0 var(--primary-active);
  white-space: nowrap;
}

.code-button--disabled {
  border-color: var(--border);
  background: var(--text-disabled);
  box-shadow: 0 6rpx 0 0 var(--shadow-input);
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
  justify-content: center;
  margin-top: 24rpx;
  height: 96rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: var(--primary);
  box-shadow: 0 10rpx 0 0 var(--primary-active);
  transition: transform 160ms var(--ease), box-shadow 160ms var(--ease), opacity 160ms var(--ease);
}

.primary-login--active {
  transform: translateY(4rpx);
  box-shadow: 0 4rpx 0 0 var(--primary-active);
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
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
}

.primary-login__text {
  color: #ffffff;
  font-size: 19px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
}

.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  margin-top: 24rpx;
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
  font-size: 12px;
  line-height: 1.35;
}

.login-notice {
  display: block;
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border: 2rpx solid rgba(224, 90, 90, 0.2);
  border-radius: 18rpx;
  color: var(--error);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  background: rgba(255, 241, 238, 0.82);
}
</style>
