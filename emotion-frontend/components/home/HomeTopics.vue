<script setup>
defineProps({
  topics: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <view class="topic-section">
    <view class="section-heading">
      <view class="section-mark"></view>
      <text class="section-title">热门话题</text>
    </view>

    <view class="topic-list">
      <view
        v-for="topic in topics"
        :key="topic.title"
        class="topic-card"
        :class="{ 'topic-card--featured': topic.featured }"
        hover-class="topic-card--active"
        @tap="emit('select', topic.title)"
      >
        <text class="topic-text" :class="{ 'topic-text--featured': topic.featured }">
          {{ topic.title }}
        </text>

        <text class="topic-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.topic-section {
  margin-top: 92rpx;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-mark {
  width: 6rpx;
  height: 42rpx;
  border-radius: 999rpx;
  background: var(--primary);
}

.section-title {
  color: var(--text);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 26rpx;
}

.topic-card {
  display: flex;
  align-items: center;
  min-height: 104rpx;
  padding: 0 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
}

.topic-card--featured {
  min-height: 132rpx;
  border-color: rgba(10, 124, 255, 0.24);
  background: #ffffff;
}

.topic-text {
  flex: 1;
  margin-left: 0;
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.35;
}

.topic-text--featured {
  color: var(--text);
  font-size: 17px;
  font-weight: 800;
}

.topic-arrow {
  color: var(--text-secondary);
  font-size: 38rpx;
  line-height: 1;
}
</style>
