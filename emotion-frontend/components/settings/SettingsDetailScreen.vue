<script setup>
import { computed, ref, watch } from 'vue'
import SettingsTopBar from './SettingsTopBar.vue'
import { fetchConversations } from '../../common/chat-api.mjs'
import {
  createDiary,
  deleteDiary,
  fetchDiaries,
  fetchDiary,
  fetchEmotionCalendarReport,
  fetchEmotionOverviewReport,
  fetchEmotionTrendReport,
  fetchLatestSystemVersion,
  fetchLoginLogs,
  fetchMoodTags,
  fetchSecurityEvents,
  fetchSecurityTokens,
  fetchSystemAbout,
  fetchSystemAnnouncements,
  updateDiary,
} from '../../common/user-api.mjs'

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
const isDiarySaving = ref(false)
const moodTags = ref([])
const historyRecords = ref([])
const detailLoading = ref(false)
const detailError = ref('')

const isMoodDiary = computed(() => props.detail.key === 'mood')
const isHistoryConsultation = computed(() => props.detail.key === 'history')
const currentDiary = computed(() => diaryEntries.value[selectedDiaryDate.value] || null)
const hasSavedDiary = computed(() => Boolean(currentDiary.value))
const displayChatRecords = computed(() => (
  historyRecords.value.length > 0 ? historyRecords.value : props.chatRecords
))
const hasChatRecords = computed(() => displayChatRecords.value.length > 0)

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

function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    month: `${start.getFullYear()}-${`${start.getMonth() + 1}`.padStart(2, '0')}`,
  }
}

function getItems(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  return payload?.items || payload?.diaries || payload?.sessions || payload?.data || []
}

function normalizeDiary(rawDiary = {}) {
  const occurredOn = rawDiary.occurredOn
    || rawDiary.occurred_on
    || rawDiary.date
    || selectedDiaryDate.value

  return {
    id: rawDiary.id || rawDiary.diaryId || rawDiary.diary_id,
    title: rawDiary.title || '今天的心情',
    content: rawDiary.content || '',
    mood: rawDiary.mood || 'calm',
    moodScore: rawDiary.moodScore || rawDiary.mood_score || 7,
    weather: rawDiary.weather || '',
    location: rawDiary.location || '',
    occurredOn,
    visibility: rawDiary.visibility || 'private',
    tagIds: rawDiary.tagIds || rawDiary.tag_ids || [],
    attachmentUrls: rawDiary.attachmentUrls || rawDiary.attachment_urls || [],
  }
}

function showToast(message) {
  if (typeof uni === 'undefined' || !uni.showToast) {
    return
  }

  uni.showToast({
    title: message,
    icon: 'none',
  })
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error || '请求失败')
}

function setDiaryEntry(entry) {
  diaryEntries.value = {
    ...diaryEntries.value,
    [entry.occurredOn]: entry,
  }
}

function syncDraftFromCurrentDiary() {
  draftDiaryText.value = currentDiary.value?.content || ''
  isDiaryEditing.value = !currentDiary.value
}

async function loadMoodDiaryData() {
  const range = getMonthRange(visibleCalendarDate.value)
  const [tagsPayload, diariesPayload] = await Promise.all([
    fetchMoodTags(),
    fetchDiaries({
      page: 1,
      pageSize: 100,
      startDate: range.startDate,
      endDate: range.endDate,
    }),
  ])

  moodTags.value = getItems(tagsPayload)
  const entries = {}

  getItems(diariesPayload).forEach((diary) => {
    const entry = normalizeDiary(diary)
    entries[entry.occurredOn] = entry
  })

  diaryEntries.value = entries
  syncDraftFromCurrentDiary()
}

async function loadHistoryConsultations() {
  historyRecords.value = await fetchConversations({
    page: 1,
    pageSize: 20,
    status: 'active',
  })
}

async function loadReportData() {
  const range = getMonthRange(visibleCalendarDate.value)

  await Promise.all([
    fetchEmotionOverviewReport({ range: 'week' }),
    fetchEmotionTrendReport({
      startDate: range.startDate,
      endDate: range.endDate,
    }),
    fetchEmotionCalendarReport({ month: range.month }),
  ])
}

async function loadSecurityData() {
  await Promise.all([
    fetchLoginLogs({ page: 1, pageSize: 10 }),
    fetchSecurityTokens(),
    fetchSecurityEvents({ page: 1, pageSize: 10 }),
  ])
}

async function loadAboutData() {
  await Promise.all([
    fetchSystemAbout(),
    fetchLatestSystemVersion({ platform: 'web' }),
    fetchSystemAnnouncements({ platform: 'web' }),
  ])
}

async function loadDetailData() {
  const key = props.detail.key

  if (!key) {
    return
  }

  detailLoading.value = true
  detailError.value = ''

  try {
    if (key === 'mood') {
      await loadMoodDiaryData()
    } else if (key === 'history') {
      await loadHistoryConsultations()
    } else if (key === 'report') {
      await loadReportData()
    } else if (key === 'privacy') {
      await loadSecurityData()
    } else if (key === 'about') {
      await loadAboutData()
    }
  } catch (error) {
    const message = getErrorMessage(error)
    detailError.value = message
    showToast(message)
  } finally {
    detailLoading.value = false
  }
}

async function loadDiaryEntry() {
  if (!currentDiary.value?.id) {
    syncDraftFromCurrentDiary()
    return
  }

  try {
    const entry = normalizeDiary(await fetchDiary(currentDiary.value.id))
    setDiaryEntry(entry)
    draftDiaryText.value = entry.content
    isDiaryEditing.value = false
  } catch (error) {
    const message = getErrorMessage(error)
    detailError.value = message
    showToast(message)
  }
}

async function selectDiaryDate(day) {
  if (day.disabled) {
    return
  }

  selectedDiaryDate.value = day.date
  await loadDiaryEntry()
}

async function handleDiaryDateChange(event) {
  const dateValue = event.detail.value
  const nextDate = parseDate(dateValue)

  selectedDiaryDate.value = dateValue
  visibleCalendarDate.value = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1)
  await loadMoodDiaryData()
}

function createDiaryPayload() {
  return {
    title: currentDiary.value?.title || `${selectedDiaryDate.value} 心情日记`,
    content: draftDiaryText.value,
    mood: currentDiary.value?.mood || moodTags.value[0]?.name || 'calm',
    moodScore: currentDiary.value?.moodScore || 7,
    weather: currentDiary.value?.weather || '',
    location: currentDiary.value?.location || '',
    occurredOn: selectedDiaryDate.value,
    visibility: currentDiary.value?.visibility || 'private',
    tagIds: currentDiary.value?.tagIds || [],
    attachmentUrls: currentDiary.value?.attachmentUrls || [],
  }
}

async function saveDiaryEntry() {
  if (isDiarySaving.value) {
    return
  }

  isDiarySaving.value = true
  detailError.value = ''

  try {
    const payload = createDiaryPayload()
    const savedDiary = currentDiary.value?.id
      ? await updateDiary(currentDiary.value.id, payload)
      : await createDiary(payload)
    const entry = normalizeDiary({
      ...payload,
      ...(savedDiary || {}),
    })

    setDiaryEntry(entry)
    isDiaryEditing.value = false
    isDiaryFullscreen.value = false
  } catch (error) {
    const message = getErrorMessage(error)
    detailError.value = message
    showToast(message)
  } finally {
    isDiarySaving.value = false
  }
}

function editDiaryEntry() {
  if (!hasSavedDiary.value) {
    return
  }

  draftDiaryText.value = currentDiary.value.content
  isDiaryEditing.value = true
}

async function deleteDiaryEntry() {
  if (!hasSavedDiary.value) {
    return
  }

  try {
    if (currentDiary.value.id) {
      await deleteDiary(currentDiary.value.id)
    }

    const nextEntries = { ...diaryEntries.value }
    delete nextEntries[selectedDiaryDate.value]
    diaryEntries.value = nextEntries
    draftDiaryText.value = ''
    isDiaryEditing.value = true
  } catch (error) {
    const message = getErrorMessage(error)
    detailError.value = message
    showToast(message)
  }
}

function openDiaryFullscreen() {
  isDiaryFullscreen.value = true
}

function closeDiaryFullscreen() {
  isDiaryFullscreen.value = false
}

watch(
  () => props.detail.key,
  () => {
    loadDetailData()
  },
  { immediate: true },
)
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

      <view v-if="detailLoading" class="detail-status">
        <text>正在同步后端数据...</text>
      </view>
      <view v-if="detailError" class="detail-status detail-status--error">
        <text>{{ detailError }}</text>
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
            <text>{{ isDiarySaving ? '保存中...' : '保存' }}</text>
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
            <text>{{ isDiarySaving ? '保存中...' : '保存' }}</text>
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
            v-for="chat in displayChatRecords"
            :key="chat.id"
            class="history-chat-item"
            hover-class="history-chat-item--active"
            @tap="emit('open-chat', chat)"
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
.detail-section,
.detail-actions,
.history-chat-item,
.history-chat-empty,
.detail-status {
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16rpx 34rpx rgba(147, 157, 190, 0.12);
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
  color: #1f2432;
  font-size: 25px;
  font-weight: 800;
  line-height: 1.12;
}

.detail-hero__summary,
.report-section-card__body {
  margin-top: 18rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.55;
}

.detail-status {
  margin-top: 22rpx;
  padding: 18rpx 22rpx;
}

.detail-status text {
  color: #6f7a90;
  font-size: 13px;
  line-height: 1.4;
}

.detail-status--error text {
  color: #c85567;
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
  color: #252b3a;
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
  width: 100%;
  min-height: 410rpx;
  margin-top: 24rpx;
  color: #303544;
  font-size: 15px;
  line-height: 1.7;
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
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.72);
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
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
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
