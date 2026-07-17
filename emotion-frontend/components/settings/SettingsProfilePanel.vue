<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
  draftName: {
    type: String,
    default: '',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  isEditingName: {
    type: Boolean,
    default: false,
  },
  isSavingName: {
    type: Boolean,
    default: false,
  },
  isSavingAvatar: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit-name', 'update:draftName', 'save-name', 'cancel-name', 'choose-avatar'])
</script>

<template>
  <view class="profile-panel">
    <view class="avatar-wrap" hover-class="avatar-wrap--active" @tap="emit('choose-avatar')">
      <view class="avatar-photo">
        <image
          v-if="avatarUrl"
          class="avatar-image"
          :src="avatarUrl"
          mode="aspectFill"
        />
        <template v-else>
          <view class="avatar-bg"></view>
          <view class="avatar-neck"></view>
          <view class="avatar-jacket"></view>
          <view class="avatar-face"></view>
          <view class="avatar-hair"></view>
          <view class="avatar-eye avatar-eye--left"></view>
          <view class="avatar-eye avatar-eye--right"></view>
          <view class="avatar-nose"></view>
          <view class="avatar-mouth"></view>
        </template>
      </view>
      <view class="avatar-add">
        <text class="avatar-add__plus">{{ isSavingAvatar ? '...' : '+' }}</text>
      </view>
    </view>

    <view v-if="isEditingName" class="name-editor">
      <input
        class="name-editor__input"
        :value="draftName"
        maxlength="24"
        placeholder="输入用户名"
        placeholder-class="name-editor__placeholder"
        @input="emit('update:draftName', $event.detail.value)"
      />
      <view class="name-editor__actions">
        <view
          class="name-editor__button name-editor__button--ghost"
          hover-class="name-editor__button--active"
          @tap="emit('cancel-name')"
        >
          <text>取消</text>
        </view>
        <view
          class="name-editor__button name-editor__button--primary"
          :class="{ 'name-editor__button--disabled': isSavingName }"
          hover-class="name-editor__button--active"
          @tap="emit('save-name')"
        >
          <text>{{ isSavingName ? '保存中' : '保存' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="name-row" hover-class="name-row--active" @tap="emit('edit-name')">
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

.avatar-wrap--active,
.name-row--active,
.name-editor__button--active {
  opacity: 0.76;
}

.avatar-photo {
  position: relative;
  width: 136rpx;
  height: 136rpx;
  overflow: hidden;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: linear-gradient(180deg, #ffffff 0%, #eef1f5 100%);
  box-shadow: var(--shadow-soft);
}

.avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.avatar-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 68% 30%, rgba(255, 255, 255, 0.9) 0, rgba(255, 255, 255, 0.28) 20%, transparent 48%),
    linear-gradient(135deg, #e8f2ff 0%, #f5f6f8 52%, #ffffff 100%);
}

.avatar-neck {
  position: absolute;
  left: 56rpx;
  top: 76rpx;
  width: 28rpx;
  height: 22rpx;
  border-radius: 12rpx;
  background: #d9dde5;
}

.avatar-jacket {
  position: absolute;
  left: 26rpx;
  bottom: -2rpx;
  width: 92rpx;
  height: 62rpx;
  border-radius: 34rpx 34rpx 10rpx 10rpx;
  background:
    linear-gradient(90deg, #20242b 0%, #2d3035 28%, #ffffff 29%, #ffffff 36%, #4a5568 37%, #20242b 100%);
}

.avatar-face {
  position: absolute;
  left: 42rpx;
  top: 24rpx;
  width: 52rpx;
  height: 68rpx;
  border-radius: 28rpx 28rpx 26rpx 26rpx;
  background: #d9dde5;
}

.avatar-hair {
  position: absolute;
  left: 34rpx;
  top: 14rpx;
  width: 66rpx;
  height: 44rpx;
  border-radius: 30rpx 30rpx 18rpx 18rpx;
  background: #20242b;
}

.avatar-eye {
  position: absolute;
  top: 54rpx;
  width: 7rpx;
  height: 7rpx;
  border-radius: 50%;
  background: #111111;
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
  background: rgba(111, 118, 128, 0.72);
}

.avatar-mouth {
  position: absolute;
  left: 56rpx;
  top: 74rpx;
  width: 24rpx;
  height: 10rpx;
  border-bottom: 3rpx solid #6f7680;
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
  background: var(--primary);
  box-shadow: 0 8rpx 0 0 var(--primary-active);
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
  max-width: 100%;
}

.name-text {
  max-width: 520rpx;
  overflow: hidden;
  color: var(--text);
  font-size: 25px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name-editor {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 18rpx;
  width: 100%;
  margin-top: 32rpx;
}

.name-editor__input {
  height: 80rpx;
  padding: 0 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  color: var(--text);
  font-size: 18px;
  font-weight: 800;
  line-height: 80rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.94);
  box-sizing: border-box;
}

.name-editor__placeholder {
  color: var(--text-disabled);
  font-weight: 700;
}

.name-editor__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.name-editor__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70rpx;
  border: 2rpx solid var(--border);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.92);
}

.name-editor__button text {
  color: var(--text-body);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.name-editor__button--primary {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: 0 8rpx 0 0 var(--primary-active);
}

.name-editor__button--primary text {
  color: #ffffff;
}

.name-editor__button--disabled {
  opacity: 0.5;
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
  background: var(--primary);
  transform: rotate(-42deg);
}

.edit-icon__tip {
  position: absolute;
  right: 1rpx;
  top: 4rpx;
  width: 0;
  height: 0;
  border-left: 8rpx solid var(--primary-hover);
  border-top: 5rpx solid transparent;
  border-bottom: 5rpx solid transparent;
  transform: rotate(-42deg);
}
</style>
