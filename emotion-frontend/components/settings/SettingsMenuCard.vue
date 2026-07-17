<script setup>
const emit = defineEmits(['select'])

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <view class="menu-card">
    <view
      v-for="(item, index) in items"
      :key="item.key"
      class="menu-row"
      :class="{
        'menu-row--last': index === items.length - 1,
        'menu-row--danger': item.danger,
      }"
      @tap="emit('select', item)"
    >
      <view class="menu-row__left">
        <view class="menu-icon">
          <template v-if="item.icon === 'smile'">
            <view class="icon-smile">
              <view class="icon-smile__eye icon-smile__eye--left"></view>
              <view class="icon-smile__eye icon-smile__eye--right"></view>
              <view class="icon-smile__mouth"></view>
            </view>
          </template>

          <template v-else-if="item.icon === 'message'">
            <view class="icon-message icon-message--back"></view>
            <view class="icon-message icon-message--front"></view>
          </template>

          <template v-else-if="item.icon === 'chart'">
            <view class="icon-chart">
              <view class="icon-chart__axis icon-chart__axis--y"></view>
              <view class="icon-chart__axis icon-chart__axis--x"></view>
              <view class="icon-chart__line"></view>
              <view class="icon-chart__point icon-chart__point--1"></view>
              <view class="icon-chart__point icon-chart__point--2"></view>
              <view class="icon-chart__point icon-chart__point--3"></view>
            </view>
          </template>

          <template v-else-if="item.icon === 'shield'">
            <view class="icon-shield"></view>
          </template>

          <template v-else-if="item.icon === 'logout'">
            <view class="icon-logout">
              <view class="icon-logout__door"></view>
              <view class="icon-logout__arrow"></view>
            </view>
          </template>

          <template v-else>
            <view class="icon-file">
              <view class="icon-file__line icon-file__line--1"></view>
              <view class="icon-file__line icon-file__line--2"></view>
            </view>
          </template>
        </view>

        <text class="menu-label">{{ item.label }}</text>
      </view>

      <text class="menu-arrow">›</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.menu-card {
  margin-top: 56rpx;
  border: 2rpx solid var(--border);
  background: rgba(255, 255, 255, 0.96);
  border-radius: 32rpx;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  padding: 0 26rpx 0 30rpx;
  border-bottom: 1px solid var(--border);
}

.menu-row--last {
  border-bottom: 0;
}

.menu-row--danger .menu-label,
.menu-row--danger .menu-arrow {
  color: var(--error);
}

.menu-row--danger .icon-logout__door {
  border-color: var(--error);
}

.menu-row--danger .icon-logout__arrow,
.menu-row--danger .icon-logout__arrow::before,
.menu-row--danger .icon-logout__arrow::after {
  background: var(--error);
}

.menu-row__left {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.menu-icon {
  position: relative;
  width: 32rpx;
  height: 32rpx;
}

.menu-label {
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.menu-arrow {
  color: var(--text-secondary);
  font-size: 38rpx;
  line-height: 1;
}

.icon-smile {
  position: absolute;
  inset: 0;
  border: 3rpx solid var(--text);
  border-radius: 50%;
}

.icon-smile__eye,
.icon-chart__axis,
.icon-chart__line,
.icon-chart__point,
.icon-file__line {
  background: var(--text);
}

.icon-smile__eye {
  position: absolute;
  top: 8rpx;
  width: 4rpx;
  height: 4rpx;
  border-radius: 50%;
}

.icon-smile__eye--left {
  left: 8rpx;
}

.icon-smile__eye--right {
  right: 8rpx;
}

.icon-smile__mouth {
  position: absolute;
  left: 8rpx;
  top: 16rpx;
  width: 12rpx;
  height: 6rpx;
  border-bottom: 3rpx solid var(--text);
  border-radius: 0 0 12rpx 12rpx;
}

.icon-message {
  position: absolute;
  width: 18rpx;
  height: 14rpx;
  border: 3rpx solid var(--text);
  border-radius: 10rpx;
  background: transparent;
}

.icon-message::after {
  content: '';
  position: absolute;
  bottom: -6rpx;
  left: 2rpx;
  width: 8rpx;
  height: 8rpx;
  border-left: 3rpx solid var(--text);
  border-bottom: 3rpx solid var(--text);
  transform: skewX(-25deg) rotate(-12deg);
}

.icon-message--back {
  left: 10rpx;
  top: 6rpx;
}

.icon-message--front {
  left: 0;
  top: 0;
  background: #ffffff;
}

.icon-chart {
  position: absolute;
  inset: 0;
}

.icon-chart__axis--y {
  left: 3rpx;
  top: 3rpx;
  width: 3rpx;
  height: 24rpx;
}

.icon-chart__axis--x {
  left: 3rpx;
  bottom: 3rpx;
  width: 24rpx;
  height: 3rpx;
}

.icon-chart__line {
  position: absolute;
  left: 8rpx;
  top: 16rpx;
  width: 16rpx;
  height: 3rpx;
  transform: rotate(-32deg);
}

.icon-chart__point {
  position: absolute;
  width: 5rpx;
  height: 5rpx;
  border-radius: 50%;
}

.icon-chart__point--1 {
  left: 9rpx;
  top: 17rpx;
}

.icon-chart__point--2 {
  left: 16rpx;
  top: 12rpx;
}

.icon-chart__point--3 {
  left: 23rpx;
  top: 8rpx;
}

.icon-shield {
  position: absolute;
  left: 5rpx;
  top: 1rpx;
  width: 22rpx;
  height: 28rpx;
  background: var(--text);
  clip-path: polygon(50% 0%, 92% 12%, 88% 62%, 50% 100%, 12% 62%, 8% 12%);
}

.icon-logout {
  position: absolute;
  inset: 0;
}

.icon-logout__door {
  position: absolute;
  left: 3rpx;
  top: 5rpx;
  width: 14rpx;
  height: 22rpx;
  border: 3rpx solid var(--text);
  border-right: 0;
  border-radius: 5rpx 0 0 5rpx;
}

.icon-logout__arrow {
  position: absolute;
  left: 13rpx;
  top: 14rpx;
  width: 15rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: var(--text);
}

.icon-logout__arrow::before,
.icon-logout__arrow::after {
  content: '';
  position: absolute;
  right: 0;
  width: 9rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: inherit;
  transform-origin: right center;
}

.icon-logout__arrow::before {
  transform: rotate(45deg);
}

.icon-logout__arrow::after {
  transform: rotate(-45deg);
}

.icon-file {
  position: absolute;
  left: 6rpx;
  top: 2rpx;
  width: 20rpx;
  height: 26rpx;
  border: 3rpx solid var(--text);
  border-radius: 6rpx;
}

.icon-file__line {
  position: absolute;
  left: 4rpx;
  right: 4rpx;
  height: 3rpx;
  border-radius: 999rpx;
}

.icon-file__line--1 {
  top: 8rpx;
}

.icon-file__line--2 {
  top: 15rpx;
}
</style>
