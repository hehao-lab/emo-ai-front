<script setup>
import { computed, ref, watch } from 'vue'
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
      reportTargets: [],
      reportSections: [],
      defaultTargetId: '',
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
const activeReportTargetId = ref('')

const isMoodDiary = computed(() => props.detail.key === 'mood')
const isHistoryConsultation = computed(() => props.detail.key === 'history')
const isReportDetail = computed(() => props.detail.key === 'report')
const isPrivacyDetail = computed(() => props.detail.key === 'privacy')
const hasSavedDiary = computed(() => Boolean(diaryEntries.value[selectedDiaryDate.value]))
const hasChatRecords = computed(() => props.chatRecords.length > 0)
const activeReportTarget = computed(() => (
  props.detail.reportTargets?.find((target) => target.id === activeReportTargetId.value)
  || props.detail.reportTargets?.[0]
  || null
))
const activeReportHeadline = computed(() => activeReportTarget.value?.headline || '')
const activeReportSummary = computed(() => activeReportTarget.value?.summary || '')
const reportCards = computed(() => (
  props.detail.reportSections?.map((section) => {
    if (section.title === '目标人物的关系分析') {
      return {
        ...section,
        body: activeReportTarget.value?.relationshipAnalysis || '',
      }
    }

    return section
  }) || []
))

watch(
  () => props.detail,
  (detail) => {
    if (detail?.key !== 'report') {
      activeReportTargetId.value = ''
      return
    }

    activeReportTargetId.value = detail.defaultTargetId || detail.reportTargets?.[0]?.id || ''
  },
  { immediate: true },
)

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

const selectReportTarget = (targetId) => {
  activeReportTargetId.value = targetId
}
</script>

<template>
  <view class="settings-detail-page">
    <view class="settings-detail-page__inner">
      <SettingsTopBar @back="emit('back')" />

      <view v-if="!isHistoryConsultation && !isReportDetail && !isPrivacyDetail" class="detail-hero">
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

      <view v-if="isReportDetail" class="report-detail">
        <view class="report-person-card">
          <view class="report-person-card__top">
            <view class="report-person-card__copy">
              <text class="report-person-card__eyebrow">当前分析对象</text>
              <text class="report-person-card__title">{{ activeReportTarget?.name }}</text>
              <text class="report-person-card__meta">{{ activeReportTarget?.relationshipLabel }}</text>
            </view>
            <view class="report-person-card__badge">
              <text class="report-person-card__badge-text">实时切换</text>
            </view>
          </view>

          <view class="report-target-switcher">
            <view
              v-for="target in detail.reportTargets"
              :key="target.id"
              class="report-target-chip"
              :class="{ 'report-target-chip--active': target.id === activeReportTargetId }"
              hover-class="report-target-chip--pressed"
              @tap="selectReportTarget(target.id)"
            >
              <text class="report-target-chip__name">{{ target.name }}</text>
              <text class="report-target-chip__meta">{{ target.relationshipLabel }}</text>
            </view>
          </view>
        </view>

        <view class="report-conclusion-card">
          <text class="report-conclusion-card__eyebrow">核心判断</text>
          <text class="report-conclusion-card__headline">{{ activeReportHeadline }}</text>
          <text class="report-conclusion-card__summary">{{ activeReportSummary }}</text>
        </view>

        <view class="report-section-list">
          <view v-for="section in reportCards" :key="section.title" class="report-section-card">
            <text class="report-section-card__title">{{ section.title }}</text>
            <text class="report-section-card__body">{{ section.body }}</text>
          </view>
        </view>
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

      <view v-if="isPrivacyDetail" class="privacy-detail">
        <view class="privacy-detail-card">
          <view class="privacy-detail-card__intro">
            <text class="privacy-detail-card__eyebrow">隐私与安全说明</text>
            <text class="privacy-detail-card__summary">{{ detail.summary }}</text>
          </view>

          <view class="privacy-detail-card__sections">
            <view v-for="section in detail.sections" :key="section.title" class="privacy-detail-card__section">
              <text class="privacy-detail-card__title">{{ section.title }}</text>
              <text class="privacy-detail-card__body">{{ section.body }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!isMoodDiary && !isHistoryConsultation && !isReportDetail && !isPrivacyDetail">
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
  background:
    radial-gradient(circle at 14% 8%, rgba(130, 213, 187, 0.24), transparent 26%),
    radial-gradient(circle at 84% 10%, rgba(248, 166, 178, 0.18), transparent 20%),
    linear-gradient(180deg, #f8f8f0 0%, #f7f3df 100%);
}

.settings-detail-page__inner {
  min-height: 100vh;
  padding: 66rpx 26rpx 48rpx;
}

.detail-hero,
.mood-diary-editor,
.history-chat-item,
.detail-section,
.detail-actions,
.report-person-card,
.report-conclusion-card,
.report-target-switcher,
.report-section-card {
  box-shadow: var(--shadow-soft);
}

.detail-hero {
  display: flex;
  flex-direction: column;
  margin-top: 56rpx;
  padding: 34rpx 30rpx 36rpx;
  border: 2rpx solid var(--border);
  border-radius: 32rpx;
  background: var(--panel-bg);
}

.detail-hero__kicker {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1;
}

.detail-hero__title,
.mood-calendar__title,
.mood-diary-fullscreen__title,
.report-section-card__title {
  color: var(--text);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.12;
}

.detail-hero__title {
  margin-top: 18rpx;
  font-size: 25px;
}

.detail-hero__summary,
.report-section-card__body {
  margin-top: 18rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.55;
}

.report-detail,
.privacy-detail,
.history-consultation {
  margin-top: 28rpx;
}

.report-detail {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.privacy-detail-card {
  padding: 30rpx;
  border: 2rpx solid rgba(196, 184, 158, 0.32);
  border-radius: 34rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.42), transparent 20%),
    rgba(255, 249, 238, 0.95);
  box-shadow: var(--shadow-soft);
}

.privacy-detail-card__intro {
  display: flex;
  flex-direction: column;
}

.privacy-detail-card__eyebrow {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
}

.privacy-detail-card__summary {
  margin-top: 16rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.7;
}

.privacy-detail-card__sections {
  margin-top: 26rpx;
}

.privacy-detail-card__section + .privacy-detail-card__section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid rgba(196, 184, 158, 0.34);
}

.privacy-detail-card__title {
  display: block;
  color: var(--text);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.25;
}

.privacy-detail-card__body {
  display: block;
  margin-top: 14rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.72;
}

.report-person-card {
  padding: 30rpx 30rpx 28rpx;
  border: 2rpx solid rgba(214, 168, 118, 0.28);
  border-radius: 34rpx;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.54), transparent 32%),
    rgba(255, 250, 241, 0.94);
}

.report-person-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.report-person-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.report-person-card__eyebrow,
.report-conclusion-card__eyebrow {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
}

.report-person-card__title {
  margin-top: 14rpx;
  color: var(--text);
  font-size: 28px;
  font-weight: 900;
  line-height: 1.06;
}

.report-person-card__meta {
  margin-top: 12rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.2;
}

.report-person-card__badge {
  flex: 0 0 auto;
  padding: 14rpx 18rpx;
  border: 2rpx solid rgba(196, 127, 64, 0.2);
  border-radius: 999rpx;
  background: rgba(255, 244, 228, 0.92);
}

.report-person-card__badge-text {
  color: #9b6531;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.report-target-switcher {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.report-target-chip {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-height: 138rpx;
  padding: 22rpx 20rpx;
  border: 2rpx solid rgba(196, 127, 64, 0.16);
  border-radius: 24rpx;
  background: rgba(255, 247, 235, 0.82);
  transition: transform 220ms var(--ease), border-color 220ms var(--ease), background 220ms var(--ease);
}

.report-target-chip--pressed {
  transform: scale(0.98);
  opacity: 0.9;
}

.report-target-chip--active {
  transform: translateY(-2rpx);
  border-color: rgba(196, 127, 64, 0.52);
  background: linear-gradient(135deg, rgba(255, 243, 225, 0.98) 0%, rgba(255, 233, 204, 0.98) 100%);
}

.report-target-chip__name {
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
}

.report-target-chip__meta {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.25;
}

.report-conclusion-card {
  padding: 32rpx 30rpx;
  border: 2rpx solid rgba(196, 127, 64, 0.18);
  border-radius: 36rpx;
  background:
    radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.42), transparent 18%),
    linear-gradient(135deg, #fff2dc 0%, #fde3c7 100%);
}

.report-conclusion-card__headline {
  margin-top: 14rpx;
  color: #6f3f11;
  font-size: 29px;
  font-weight: 900;
  line-height: 1.18;
  text-wrap: balance;
}

.report-conclusion-card__summary {
  margin-top: 16rpx;
  color: rgba(99, 67, 36, 0.88);
  font-size: 14px;
  line-height: 1.6;
}

.report-section-list,
.history-chat-list,
.detail-section-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.report-section-card {
  display: flex;
  flex-direction: column;
  padding: 28rpx 30rpx;
  border: 2rpx solid rgba(196, 127, 64, 0.16);
  border-radius: 32rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.36), transparent 22%),
    rgba(255, 248, 236, 0.94);
}

.report-section-card__title {
  display: block;
  font-size: 22px;
}

.report-section-card__body {
  display: block;
  white-space: pre-wrap;
  line-height: 1.72;
}

@media (max-width: 720px) {
  .report-target-switcher {
    grid-template-columns: 1fr;
  }

  .report-person-card__title,
  .report-conclusion-card__headline {
    text-wrap: pretty;
  }
}

.mood-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.mood-calendar__heading,
.mood-diary-fullscreen__title-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.mood-calendar__selected,
.mood-diary-fullscreen__date {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1;
}

.mood-date-picker,
.mood-diary-action--primary {
  color: #fff9e3;
  background: var(--primary);
}

.mood-date-picker {
  flex: 0 0 auto;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  box-shadow: 0 8rpx 0 0 var(--primary-active);
}

.mood-date-picker__text {
  color: #fff9e3;
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
  color: var(--text-secondary);
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
  color: var(--text-body);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  background: rgba(255, 249, 227, 0.78);
}

.mood-calendar__day--active {
  opacity: 0.72;
}

.mood-calendar__day--empty {
  pointer-events: none;
  background: transparent;
}

.mood-calendar__day--selected {
  color: #fff9e3;
  background: var(--primary);
  box-shadow: 0 8rpx 0 0 var(--primary-active);
}

.mood-calendar__day--saved {
  border: 2rpx solid rgba(25, 200, 185, 0.42);
}

.mood-diary-editor {
  display: flex;
  flex-direction: column;
  min-height: 520rpx;
  margin-top: 28rpx;
  padding: 30rpx;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: rgba(255, 249, 227, 0.92);
}

.mood-diary-editor__top,
.mood-diary-fullscreen__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.mood-diary-editor__date {
  color: var(--text);
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.mood-diary-expand,
.mood-diary-fullscreen__close,
.mood-diary-action {
  background: rgba(255, 249, 227, 0.92);
  border: 2rpx solid var(--border);
}

.mood-diary-expand {
  position: relative;
  flex: 0 0 auto;
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
}

.mood-diary-expand--active,
.mood-diary-action--active,
.mood-diary-fullscreen__close--active,
.history-chat-item--active,
.detail-action-row--active {
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
  border-left: 4rpx solid var(--primary);
  border-top: 4rpx solid var(--primary);
}

.mood-diary-expand::before {
  right: 16rpx;
  top: 16rpx;
  border-right: 4rpx solid var(--primary);
  border-top: 4rpx solid var(--primary);
}

.mood-diary-expand::after {
  right: 16rpx;
  bottom: 16rpx;
  border-right: 4rpx solid var(--primary);
  border-bottom: 4rpx solid var(--primary);
}

.mood-diary-editor__input,
.mood-diary-fullscreen__input {
  width: 100%;
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.7;
}

.mood-diary-editor__input {
  min-height: 410rpx;
  margin-top: 24rpx;
}

.mood-diary-editor__placeholder {
  color: var(--text-disabled);
}

:deep(.uni-textarea-textarea) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(25, 200, 185, 0.48) rgba(224, 216, 199, 0.72);
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar {
  width: 8rpx;
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar-track {
  border-radius: 999rpx;
  background: rgba(224, 216, 199, 0.72);
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar-thumb {
  border-radius: 999rpx;
  background: rgba(25, 200, 185, 0.48);
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
  color: var(--text-body);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.mood-diary-action--danger {
  color: var(--error);
  background: #fff1ee;
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
  background: linear-gradient(180deg, #f8f8f0 0%, #f7f3df 100%);
}

.mood-diary-fullscreen__close {
  flex: 0 0 auto;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  color: var(--text-body);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.mood-diary-fullscreen__input {
  flex: 1;
  min-height: 0;
  margin-top: 30rpx;
  padding: 28rpx;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: #fffaf0;
  box-sizing: border-box;
}

.mood-diary-fullscreen__actions {
  flex: 0 0 auto;
}

.history-chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 104rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 26rpx;
  background: rgba(255, 249, 227, 0.9);
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
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-chat-item__preview {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-chat-item__time {
  flex: 0 0 auto;
  color: var(--text-muted);
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
  border: 2rpx dashed rgba(159, 146, 125, 0.4);
  border-radius: 30rpx;
  background: rgba(255, 249, 227, 0.72);
  text-align: center;
}

.history-chat-empty__title {
  color: var(--text);
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.history-chat-empty__body {
  margin-top: 18rpx;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.detail-section-list {
  margin-top: 28rpx;
}

.detail-section {
  padding: 26rpx 28rpx;
  border: 2rpx solid var(--border);
  border-radius: 26rpx;
  background: rgba(255, 249, 227, 0.9);
}

.detail-section__title {
  display: block;
  color: var(--text);
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.detail-section__body {
  display: block;
  margin-top: 16rpx;
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.52;
}

.detail-actions {
  margin-top: 28rpx;
  overflow: hidden;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: rgba(255, 249, 227, 0.94);
}

.detail-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 28rpx;
  border-bottom: 1px solid rgba(196, 184, 158, 0.46);
}

.detail-action-row:last-child {
  border-bottom: 0;
}

.detail-action-row__text {
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.2;
}

.detail-action-row__arrow {
  color: var(--text-secondary);
  font-size: 38rpx;
  line-height: 1;
}
</style>
