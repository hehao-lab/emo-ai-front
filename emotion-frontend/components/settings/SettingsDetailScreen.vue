<script setup>
import { computed, ref } from 'vue'
import SettingsTopBar from './SettingsTopBar.vue'

const props = defineProps({
  detail: {
    type: Object,
    default: () => ({
      key: '',
      title: '详情',
      summary: '',
      sections: [],
      actions: [],
    }),
  },
  chatRecords: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['back', 'open-chat'])

const moodWeekdays = ['一', '二', '三', '四', '五', '六', '日']
const today = new Date()
const selectedDiaryDate = ref(formatDate(today))
const visibleCalendarDate = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const diaryEntries = ref({})
const draftDiaryText = ref('')
const isDiaryEditing = ref(true)
const isDiaryFullscreen = ref(false)

const isMoodDiary = computed(() => props.detail.key === 'mood')
const isHistoryConsultation = computed(() => props.detail.key === 'history')
const hasSavedDiary = computed(() => Boolean(diaryEntries.value[selectedDiaryDate.value]))
const hasChatRecords = computed(() => props.chatRecords.length > 0)

const moodCalendarDays = computed(() => {
  const year = visibleCalendarDate.value.getFullYear()
  const month = visibleCalendarDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const leadingBlankCount = (firstDay.getDay() + 6) % 7
  const days = []

  for (let index = 0; index < leadingBlankCount; index += 1) {
    days.push({
      key: `blank-${index}`,
      label: '',
      date: '',
      disabled: true,
    })
  }

  for (let dateNumber = 1; dateNumber <= lastDay.getDate(); dateNumber += 1) {
    const date = new Date(year, month, dateNumber)
    days.push({
      key: formatDate(date),
      label: String(dateNumber),
      date: formatDate(date),
      disabled: false,
    })
  }

  return days
})

const moodCalendarTitle = computed(() => {
  const year = visibleCalendarDate.value.getFullYear()
  const month = `${visibleCalendarDate.value.getMonth() + 1}`.padStart(2, '0')

  return `${year}.${month}`
})

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const loadDiaryEntry = () => {
  draftDiaryText.value = diaryEntries.value[selectedDiaryDate.value] || ''
  isDiaryEditing.value = !hasSavedDiary.value
}

const selectDiaryDate = (day) => {
  if (day.disabled) {
    return
  }

  selectedDiaryDate.value = day.date
  loadDiaryEntry()
}

const handleDiaryDateChange = (event) => {
  const dateValue = event.detail.value
  selectedDiaryDate.value = dateValue
  visibleCalendarDate.value = new Date(parseDate(dateValue).getFullYear(), parseDate(dateValue).getMonth(), 1)
  loadDiaryEntry()
}

const saveDiaryEntry = () => {
  diaryEntries.value = {
    ...diaryEntries.value,
    [selectedDiaryDate.value]: draftDiaryText.value,
  }
  isDiaryEditing.value = false
}

const editDiaryEntry = () => {
  if (!hasSavedDiary.value) {
    return
  }

  draftDiaryText.value = diaryEntries.value[selectedDiaryDate.value]
  isDiaryEditing.value = true
}

const deleteDiaryEntry = () => {
  if (!hasSavedDiary.value) {
    return
  }

  const nextEntries = { ...diaryEntries.value }
  delete nextEntries[selectedDiaryDate.value]
  diaryEntries.value = nextEntries
  draftDiaryText.value = ''
  isDiaryEditing.value = true
}

const openDiaryFullscreen = () => {
  isDiaryFullscreen.value = true
}

const closeDiaryFullscreen = () => {
  isDiaryFullscreen.value = false
}
</script>

<template>
  <view class="settings-detail-page">
    <view class="settings-detail-page__inner">
      <SettingsTopBar @back="emit('back')" />

      <view v-if="!isHistoryConsultation" class="detail-hero">
        <template v-if="isMoodDiary">
          <view class="mood-calendar__header">
            <view class="mood-calendar__heading">
              <text class="mood-calendar__title">{{ moodCalendarTitle }}</text>
              <text class="mood-calendar__selected">{{ selectedDiaryDate }}</text>
            </view>

            <picker mode="date" :value="selectedDiaryDate" class="mood-date-picker" @change="handleDiaryDateChange">
              <text class="mood-date-picker__text">选择日期</text>
            </picker>
          </view>

          <view class="mood-calendar">
            <text v-for="weekday in moodWeekdays" :key="weekday" class="mood-calendar__weekday">{{ weekday }}</text>
            <view
              v-for="day in moodCalendarDays"
              :key="day.key"
              class="mood-calendar__day"
              :class="{
                'mood-calendar__day--empty': day.disabled,
                'mood-calendar__day--selected': day.date === selectedDiaryDate,
                'mood-calendar__day--saved': diaryEntries[day.date],
              }"
              hover-class="mood-calendar__day--active"
              @tap="selectDiaryDate(day)"
            >
              <text>{{ day.label }}</text>
            </view>
          </view>
        </template>

        <template v-else>
          <text class="detail-hero__kicker">我的</text>
          <text class="detail-hero__title">{{ detail.title }}</text>
          <text class="detail-hero__summary">{{ detail.summary }}</text>
        </template>
      </view>

      <view v-if="isMoodDiary" class="mood-diary-editor">
        <view class="mood-diary-editor__top">
          <text class="mood-diary-editor__date">{{ selectedDiaryDate }}</text>
          <view class="mood-diary-expand" hover-class="mood-diary-expand--active" @tap="openDiaryFullscreen">
            <text class="mood-diary-expand__mark"></text>
          </view>
        </view>

        <textarea
          v-model="draftDiaryText"
          :disabled="!isDiaryEditing"
          class="mood-diary-editor__input"
          placeholder="写下今天的心情、发生的事情和你想对自己说的话"
          placeholder-class="mood-diary-editor__placeholder"
          maxlength="-1"
          auto-height
        />

        <view class="mood-diary-actions">
          <view class="mood-diary-action mood-diary-action--primary" hover-class="mood-diary-action--active" @tap="saveDiaryEntry">
            <text>保存</text>
          </view>
          <view
            class="mood-diary-action"
            :class="{ 'mood-diary-action--disabled': !hasSavedDiary }"
            hover-class="mood-diary-action--active"
            @tap="editDiaryEntry"
          >
            <text>修改</text>
          </view>
          <view
            class="mood-diary-action mood-diary-action--danger"
            :class="{ 'mood-diary-action--disabled': !hasSavedDiary }"
            hover-class="mood-diary-action--active"
            @tap="deleteDiaryEntry"
          >
            <text>删除</text>
          </view>
        </view>
      </view>

      <view v-if="isDiaryFullscreen" class="mood-diary-fullscreen">
        <view class="mood-diary-fullscreen__top">
          <view class="mood-diary-fullscreen__title-group">
            <text class="mood-diary-fullscreen__title">日记内容</text>
            <text class="mood-diary-fullscreen__date">{{ selectedDiaryDate }}</text>
          </view>
          <view class="mood-diary-fullscreen__close" hover-class="mood-diary-fullscreen__close--active" @tap="closeDiaryFullscreen">
            <text>关闭</text>
          </view>
        </view>

        <textarea
          class="mood-diary-fullscreen__input"
          v-model="draftDiaryText"
          :disabled="!isDiaryEditing"
          placeholder="写下今天的心情、发生的事情和你想对自己说的话"
          placeholder-class="mood-diary-editor__placeholder"
          maxlength="-1"
        />

        <view class="mood-diary-actions mood-diary-fullscreen__actions">
          <view class="mood-diary-action mood-diary-action--primary" hover-class="mood-diary-action--active" @tap="saveDiaryEntry">
            <text>保存</text>
          </view>
          <view
            class="mood-diary-action"
            :class="{ 'mood-diary-action--disabled': !hasSavedDiary }"
            hover-class="mood-diary-action--active"
            @tap="editDiaryEntry"
          >
            <text>修改</text>
          </view>
          <view
            class="mood-diary-action mood-diary-action--danger"
            :class="{ 'mood-diary-action--disabled': !hasSavedDiary }"
            hover-class="mood-diary-action--active"
            @tap="deleteDiaryEntry"
          >
            <text>删除</text>
          </view>
        </view>
      </view>

      <view v-if="isHistoryConsultation" class="history-consultation">
        <view v-if="hasChatRecords" class="history-chat-list">
          <view
            v-for="chat in chatRecords"
            :key="chat.id"
            class="history-chat-item"
            hover-class="history-chat-item--active"
            @tap="emit('open-chat', chat.id)"
          >
            <view class="history-chat-item__main">
              <text class="history-chat-item__title">{{ chat.title }}</text>
              <text class="history-chat-item__preview">{{ chat.preview }}</text>
            </view>
            <text class="history-chat-item__time">{{ chat.time }}</text>
          </view>
        </view>

        <view v-else class="history-chat-empty">
          <text class="history-chat-empty__title">暂无对话记录</text>
          <text class="history-chat-empty__body">开始一次咨询后，所有对话都会同步保存在这里。</text>
        </view>
      </view>

      <view v-if="!isMoodDiary && !isHistoryConsultation">
        <view class="detail-section-list">
          <view v-for="section in detail.sections" :key="section.title" class="detail-section">
            <text class="detail-section__title">{{ section.title }}</text>
            <text class="detail-section__body">{{ section.body }}</text>
          </view>
        </view>

        <view class="detail-actions">
          <view v-for="action in detail.actions" :key="action" class="detail-action-row" hover-class="detail-action-row--active">
            <text class="detail-action-row__text">{{ action }}</text>
            <text class="detail-action-row__arrow">›</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.settings-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f3ecf8 0%, #e8ebf9 34%, #dceafb 100%);
}

.settings-detail-page__inner {
  min-height: 100vh;
  padding: 66rpx 26rpx 48rpx;
}

.detail-hero {
  display: flex;
  flex-direction: column;
  margin-top: 56rpx;
  padding: 34rpx 30rpx 36rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 16rpx 34rpx rgba(147, 157, 190, 0.14);
}

.detail-hero__kicker {
  color: #8b94a7;
  font-size: 12px;
  line-height: 1;
}

.detail-hero__title {
  margin-top: 18rpx;
  color: #1f2432;
  font-size: 25px;
  font-weight: 800;
  line-height: 1.12;
}

.detail-hero__summary {
  margin-top: 18rpx;
  color: #657086;
  font-size: 14px;
  line-height: 1.55;
}

.mood-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.mood-calendar__heading {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.mood-calendar__title {
  color: #1f2432;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.mood-calendar__selected {
  color: #7b8597;
  font-size: 13px;
  line-height: 1;
}

.mood-date-picker {
  flex: 0 0 auto;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: #6f7ee8;
  box-shadow: 0 12rpx 24rpx rgba(111, 126, 232, 0.18);
}

.mood-date-picker__text {
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}

.mood-calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12rpx;
}

.mood-calendar__weekday {
  color: #8c95a7;
  font-size: 12px;
  font-weight: 700;
  line-height: 44rpx;
  text-align: center;
}

.mood-calendar__day {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 999rpx;
  color: #3a4050;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  background: rgba(255, 255, 255, 0.56);
}

.mood-calendar__day--active {
  opacity: 0.72;
}

.mood-calendar__day--empty {
  pointer-events: none;
  background: transparent;
}

.mood-calendar__day--selected {
  color: #ffffff;
  background: #6f7ee8;
  box-shadow: 0 12rpx 24rpx rgba(111, 126, 232, 0.24);
}

.mood-calendar__day--saved {
  border: 2rpx solid rgba(111, 126, 232, 0.36);
}

.mood-diary-editor {
  display: flex;
  flex-direction: column;
  min-height: 520rpx;
  margin-top: 28rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 16rpx 34rpx rgba(147, 157, 190, 0.12);
}

.mood-diary-editor__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.mood-diary-editor__date {
  color: #252b3a;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.mood-diary-expand {
  position: relative;
  flex: 0 0 auto;
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  background: #eef1fb;
}

.mood-diary-expand--active {
  opacity: 0.76;
}

.mood-diary-expand__mark,
.mood-diary-expand::before,
.mood-diary-expand::after {
  position: absolute;
  width: 18rpx;
  height: 18rpx;
  content: '';
}

.mood-diary-expand__mark {
  left: 16rpx;
  top: 16rpx;
  border-left: 4rpx solid #6f7ee8;
  border-top: 4rpx solid #6f7ee8;
}

.mood-diary-expand::before {
  right: 16rpx;
  top: 16rpx;
  border-right: 4rpx solid #6f7ee8;
  border-top: 4rpx solid #6f7ee8;
}

.mood-diary-expand::after {
  right: 16rpx;
  bottom: 16rpx;
  border-right: 4rpx solid #6f7ee8;
  border-bottom: 4rpx solid #6f7ee8;
}

.mood-diary-editor__input {
  width: 100%;
  min-height: 410rpx;
  margin-top: 24rpx;
  color: #303544;
  font-size: 15px;
  line-height: 1.7;
}

.mood-diary-editor__placeholder {
  color: #a1a8b7;
}

:deep(.uni-textarea-textarea) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(111, 126, 232, 0.48) rgba(224, 229, 246, 0.72);
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar {
  width: 8rpx;
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar-track {
  border-radius: 999rpx;
  background: rgba(224, 229, 246, 0.72);
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar-thumb {
  border-radius: 999rpx;
  background: rgba(111, 126, 232, 0.48);
}

.mood-diary-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 28rpx;
}

.mood-diary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 76rpx;
  border-radius: 22rpx;
  color: #4d566b;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  background: #eef1fb;
}

.mood-diary-action--primary {
  color: #ffffff;
  background: #6f7ee8;
}

.mood-diary-action--danger {
  color: #d35f73;
  background: #fff0f3;
}

.mood-diary-action--active {
  opacity: 0.76;
}

.mood-diary-action--disabled {
  opacity: 0.42;
}

.mood-diary-fullscreen {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  padding: 66rpx 28rpx 42rpx;
  background: #f8f9fe;
}

.mood-diary-fullscreen__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.mood-diary-fullscreen__title-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.mood-diary-fullscreen__title {
  color: #1f2432;
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.mood-diary-fullscreen__date {
  color: #7b8597;
  font-size: 13px;
  line-height: 1;
}

.mood-diary-fullscreen__close {
  flex: 0 0 auto;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  color: #4d566b;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  background: #eef1fb;
}

.mood-diary-fullscreen__close--active {
  opacity: 0.76;
}

.mood-diary-fullscreen__input {
  flex: 1;
  width: 100%;
  min-height: 0;
  margin-top: 30rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  color: #303544;
  font-size: 16px;
  line-height: 1.75;
  background: #ffffff;
  box-sizing: border-box;
}

.mood-diary-fullscreen__actions {
  flex: 0 0 auto;
}

.history-consultation {
  margin-top: 28rpx;
}

.history-chat-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 104rpx;
  padding: 20rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 12rpx 28rpx rgba(129, 140, 176, 0.1);
}

.history-chat-item--active {
  opacity: 0.78;
  transform: scale(0.99);
}

.history-chat-item__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 10rpx;
}

.history-chat-item__title {
  overflow: hidden;
  color: #303544;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-chat-item__preview {
  overflow: hidden;
  color: #858ea1;
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-chat-item__time {
  flex: 0 0 auto;
  color: #a1a8b8;
  font-size: 11px;
  line-height: 1;
}

.history-chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320rpx;
  padding: 42rpx 34rpx;
  border: 2rpx dashed rgba(111, 126, 232, 0.22);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.48);
  text-align: center;
}

.history-chat-empty__title {
  color: #2e3140;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.history-chat-empty__body {
  margin-top: 18rpx;
  color: #818b9d;
  font-size: 13px;
  line-height: 1.5;
}

.detail-section-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 28rpx;
}

.detail-section {
  padding: 26rpx 28rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.72);
}

.detail-section__title {
  display: block;
  color: #2c303c;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.detail-section__body {
  display: block;
  margin-top: 16rpx;
  color: #727b8e;
  font-size: 13px;
  line-height: 1.52;
}

.detail-actions {
  margin-top: 28rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
}

.detail-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 28rpx;
  border-bottom: 1px solid rgba(233, 236, 244, 0.95);
}

.detail-action-row:last-child {
  border-bottom: 0;
}

.detail-action-row--active {
  opacity: 0.78;
}

.detail-action-row__text {
  color: #303544;
  font-size: 15px;
  line-height: 1.2;
}

.detail-action-row__arrow {
  color: #c9ced8;
  font-size: 38rpx;
  line-height: 1;
}
</style>
