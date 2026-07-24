<script setup>
import { computed, ref, watch } from 'vue'
import SettingsTopBar from './SettingsTopBar.vue'
import { fetchConversations } from '../../common/chat-api.mjs'
import {
  createDiary,
  deleteDiary,
  fetchDiaries,
  fetchDiary,
  fetchRelationshipHealthReport,
  fetchLatestSystemVersion,
  fetchLoginLogs,
  normalizeDiaryOccurredOn,
  fetchPublicSystemConfigs,
  fetchSecurityEvents,
  fetchSecurityTokens,
  fetchSystemAbout,
  fetchSystemAnnouncements,
  updateDiary,
} from '../../common/user-api.mjs'

const props = defineProps({
  detail: {
    type: Object,
    default: () => ({ key: '', title: '' }),
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
const historyRecords = ref([])
const relationshipReport = ref({
  personalPortrait: {
    title: '',
    summary: '',
    traits: [],
    relationshipPattern: '',
    riskNotes: [],
    suggestions: [],
  },
  targetReports: [],
})
const aboutInfo = ref({
  appName: '',
  company: '',
  description: '',
  privacyUrl: '',
  termsUrl: '',
  contactEmail: '',
  website: '',
})
const latestVersion = ref(null)
const systemAnnouncements = ref([])
const privacyPolicy = ref({ summary: '', sections: [] })
const loginLogs = ref([])
const securityTokens = ref([])
const securityEvents = ref([])
const detailLoading = ref(false)
const detailError = ref('')

const isMoodDiary = computed(() => props.detail.key === 'mood')
const isHistoryConsultation = computed(() => props.detail.key === 'history')
const isReportDetail = computed(() => props.detail.key === 'report')
const isPrivacyDetail = computed(() => props.detail.key === 'privacy')
const isAboutDetail = computed(() => props.detail.key === 'about')
const currentDiary = computed(() => diaryEntries.value[selectedDiaryDate.value] || null)
const hasSavedDiary = computed(() => Boolean(currentDiary.value))
const displayChatRecords = computed(() => historyRecords.value)
const hasChatRecords = computed(() => displayChatRecords.value.length > 0)
const hasPersonalPortrait = computed(() => Boolean(relationshipReport.value.personalPortrait?.summary))
const hasTargetRelationshipReports = computed(() => relationshipReport.value.targetReports.length > 0)
const personalSummaryParagraphs = computed(() => splitReportParagraphs(
  relationshipReport.value.personalPortrait?.summary,
))
const displayAboutInfo = computed(() => ({
  appName: aboutInfo.value.appName,
  company: aboutInfo.value.company,
  description: aboutInfo.value.description,
  privacyUrl: aboutInfo.value.privacyUrl,
  termsUrl: aboutInfo.value.termsUrl,
  contactEmail: aboutInfo.value.contactEmail,
  website: aboutInfo.value.website,
}))
const displayVersion = computed(() => (
  latestVersion.value?.version || ''
))
const hasAboutInfo = computed(() => Object.values(displayAboutInfo.value).some(Boolean))
const hasPrivacyPolicy = computed(() => privacyPolicy.value.sections.length > 0)
const hasSecurityRecords = computed(() => (
  loginLogs.value.length > 0 || securityTokens.value.length > 0 || securityEvents.value.length > 0
))
const aboutLinkItems = computed(() => [
  { label: '官网', value: displayAboutInfo.value.website },
  { label: '隐私政策', value: displayAboutInfo.value.privacyUrl },
  { label: '用户协议', value: displayAboutInfo.value.termsUrl },
  { label: '联系邮箱', value: displayAboutInfo.value.contactEmail },
].filter((item) => item.value))

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

function getHealthLevelText(level) {
  const labels = {
    excellent: '高健康',
    stable: '稳定',
    watch: '需观察',
    risk: '高风险',
  }

  return labels[level] || level || '待分析'
}

function getReportList(items, fallback) {
  return items?.length ? items : [fallback]
}

function formatTimestamp(value) {
  const timestamp = Number(value || 0)
  if (!timestamp) return ''

  const date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN', { hour12: false })
}

function splitReportParagraphs(value) {
  const text = String(value || '').trim()

  if (!text) return []

  const explicitParagraphs = text.split(/\n+/).map((item) => item.trim()).filter(Boolean)
  if (explicitParagraphs.length > 1) {
    return explicitParagraphs
  }

  return (text.match(/[^。！？!?]+[。！？!?]?/g) || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((paragraphs, sentence, index) => {
      const groupIndex = Math.floor(index / 2)
      paragraphs[groupIndex] = `${paragraphs[groupIndex] || ''}${sentence}`
      return paragraphs
    }, [])
}

function normalizeDiary(rawDiary = {}) {
  const occurredOn = normalizeDiaryOccurredOn(
    rawDiary.occurredOn || rawDiary.occurred_on || rawDiary.date,
  ) || selectedDiaryDate.value

  return {
    id: rawDiary.id || rawDiary.diaryId || rawDiary.diary_id,
    title: rawDiary.title || '',
    content: rawDiary.content || '',
    mood: rawDiary.mood || '',
    moodScore: Number(rawDiary.moodScore ?? rawDiary.mood_score ?? 0),
    weather: rawDiary.weather || '',
    location: rawDiary.location || '',
    occurredOn,
    visibility: rawDiary.visibility || 'private',
    tagIds: rawDiary.tagIds || rawDiary.tag_ids || [],
    attachmentUrls: rawDiary.attachmentUrls || rawDiary.attachment_urls || [],
  }
}

function normalizeAboutInfo(payload = {}) {
  return {
    appName: payload.appName || payload.app_name || '',
    company: payload.company || '',
    description: payload.description || '',
    privacyUrl: payload.privacyUrl || payload.privacy_url || '',
    termsUrl: payload.termsUrl || payload.terms_url || '',
    contactEmail: payload.contactEmail || payload.contact_email || '',
    website: payload.website || '',
  }
}

function normalizeLatestVersion(payload = {}) {
  const version = payload.version || ''

  if (!version) return null

  return {
    version,
    buildNo: payload.buildNo || payload.build_no || '',
    changelog: payload.changelog || '',
    forceUpdate: Boolean(payload.forceUpdate || payload.force_update),
  }
}

function normalizeAnnouncements(payload = {}) {
  return getItems(payload).map((item) => ({
    id: item.id,
    title: item.title || '',
    content: item.content || '',
  })).filter((item) => item.title || item.content)
}

function parseConfigValue(value) {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizePrivacyPolicy(payload = {}) {
  const configs = Array.isArray(payload?.configs) ? payload.configs : []
  const values = new Map(configs.map((item) => [
    item.key,
    parseConfigValue(item.valueJson ?? item.value_json),
  ]))
  const policy = values.get('privacy.policy') || {}
  const sections = policy.sections || values.get('privacy.sections') || []

  return {
    summary: String(policy.summary || values.get('privacy.summary') || ''),
    sections: Array.isArray(sections)
      ? sections
        .map((section) => ({
          title: String(section?.title || ''),
          body: String(section?.body || ''),
        }))
        .filter((section) => section.title || section.body)
      : [],
  }
}

function normalizeLoginLogs(payload = {}) {
  const items = Array.isArray(payload?.logs) ? payload.logs : []
  return items.map((item) => ({
    id: item.id,
    username: item.username || '',
    success: Boolean(item.success),
    failReason: item.failReason || item.fail_reason || '',
    ip: item.ip || '',
    location: item.location || '',
    createdAt: formatTimestamp(item.createdAt ?? item.created_at),
  }))
}

function normalizeSecurityTokens(payload = {}) {
  const items = Array.isArray(payload?.tokens) ? payload.tokens : []
  return items.map((item) => ({
    id: item.tokenId || item.token_id || '',
    deviceName: item.deviceName || item.device_name || '',
    ip: item.ip || '',
    revokedAt: formatTimestamp(item.revokedAt ?? item.revoked_at),
    createdAt: formatTimestamp(item.createdAt ?? item.created_at),
  }))
}

function normalizeSecurityEvents(payload = {}) {
  const items = Array.isArray(payload?.events) ? payload.events : []
  return items.map((item) => ({
    id: item.id,
    eventType: item.eventType || item.event_type || '',
    riskLevel: item.riskLevel || item.risk_level || '',
    ip: item.ip || '',
    createdAt: formatTimestamp(item.createdAt ?? item.created_at),
  }))
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
  const diariesPayload = await fetchDiaries({
    page: 1,
    pageSize: 100,
    startDate: range.startDate,
    endDate: range.endDate,
  })
  const entries = {}

  getItems(diariesPayload).forEach((diary) => {
    const entry = normalizeDiary(diary)
    if (!entries[entry.occurredOn]) {
      entries[entry.occurredOn] = entry
    }
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
  relationshipReport.value = await fetchRelationshipHealthReport()
}

async function loadSecurityData() {
  const [configs, logs, tokens, events] = await Promise.all([
    fetchPublicSystemConfigs(),
    fetchLoginLogs({ page: 1, pageSize: 10 }),
    fetchSecurityTokens(),
    fetchSecurityEvents({ page: 1, pageSize: 10 }),
  ])

  privacyPolicy.value = normalizePrivacyPolicy(configs)
  loginLogs.value = normalizeLoginLogs(logs)
  securityTokens.value = normalizeSecurityTokens(tokens)
  securityEvents.value = normalizeSecurityEvents(events)
}

async function loadAboutData() {
  const [info, version, announcements] = await Promise.all([
    fetchSystemAbout(),
    fetchLatestSystemVersion({ platform: 'android' }),
    fetchSystemAnnouncements({ platform: 'android' }),
  ])
  aboutInfo.value = normalizeAboutInfo(info)
  latestVersion.value = normalizeLatestVersion(version || {})
  systemAnnouncements.value = normalizeAnnouncements(announcements || {})
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
    mood: currentDiary.value?.mood || '',
    moodScore: currentDiary.value?.moodScore ?? 0,
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

      <view v-if="isMoodDiary" class="detail-hero">
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
        <view class="privacy-detail-hero">
          <text class="privacy-detail-hero__eyebrow">隐私与安全</text>
          <text class="privacy-detail-hero__title">隐私与安全说明</text>
          <text v-if="privacyPolicy.summary" class="privacy-detail-hero__summary">{{ privacyPolicy.summary }}</text>
        </view>

        <view v-if="hasPrivacyPolicy" class="privacy-detail-card__panel">
          <view class="privacy-detail-card__sections">
            <view
              v-for="section in privacyPolicy.sections"
              :key="section.title"
              class="privacy-detail-card__section"
            >
              <view class="privacy-detail-card__content">
                <text class="privacy-detail-card__title">{{ section.title }}</text>
                <text class="privacy-detail-card__body">{{ section.body }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else-if="!detailLoading" class="history-chat-empty">
          <text class="history-chat-empty__title">暂无隐私政策内容</text>
          <text class="history-chat-empty__body">相关内容发布后会显示在这里。</text>
        </view>

        <view class="security-records">
          <text class="security-records__heading">账号安全记录</text>

          <view v-if="loginLogs.length" class="security-records__group">
            <text class="security-records__title">最近登录</text>
            <view v-for="item in loginLogs" :key="item.id" class="security-records__row">
              <view class="security-records__main">
                <text class="security-records__name">{{ item.username || item.ip }}</text>
                <text class="security-records__meta">{{ [item.location, item.ip, item.createdAt].filter(Boolean).join(' · ') }}</text>
              </view>
              <text :class="['security-records__status', { 'security-records__status--danger': !item.success }]">
                {{ item.success ? '成功' : (item.failReason || '失败') }}
              </text>
            </view>
          </view>

          <view v-if="securityTokens.length" class="security-records__group">
            <text class="security-records__title">登录设备</text>
            <view v-for="item in securityTokens" :key="item.id" class="security-records__row">
              <view class="security-records__main">
                <text class="security-records__name">{{ item.deviceName || item.id }}</text>
                <text class="security-records__meta">{{ [item.ip, item.createdAt].filter(Boolean).join(' · ') }}</text>
              </view>
              <text class="security-records__status">{{ item.revokedAt ? '已退出' : '有效' }}</text>
            </view>
          </view>

          <view v-if="securityEvents.length" class="security-records__group">
            <text class="security-records__title">安全事件</text>
            <view v-for="item in securityEvents" :key="item.id" class="security-records__row">
              <view class="security-records__main">
                <text class="security-records__name">{{ item.eventType }}</text>
                <text class="security-records__meta">{{ [item.ip, item.createdAt].filter(Boolean).join(' · ') }}</text>
              </view>
              <text class="security-records__status">{{ item.riskLevel }}</text>
            </view>
          </view>

          <view v-if="!hasSecurityRecords && !detailLoading" class="history-chat-empty">
            <text class="history-chat-empty__title">暂无安全记录</text>
            <text class="history-chat-empty__body">登录设备和安全事件会在产生后显示于此。</text>
          </view>
        </view>
      </view>

      <view v-if="isReportDetail" class="report-detail">
        <view class="report-detail__hero">
          <view class="report-detail__hero-copy">
            <text class="report-detail__eyebrow">AI 报告</text>
            <text class="report-detail__title">情感分析报告</text>
            <text v-if="relationshipReport.personalPortrait.summary" class="report-detail__summary">
              {{ relationshipReport.personalPortrait.summary }}
            </text>
          </view>
        </view>

        <view v-if="hasPersonalPortrait" class="report-personal-card">
          <view class="report-card__header">
            <text class="report-card__eyebrow">个人画像</text>
            <text class="report-card__title">{{ relationshipReport.personalPortrait.title || '个人画像' }}</text>
          </view>

          <view class="report-body-block">
            <text
              v-for="paragraph in personalSummaryParagraphs"
              :key="paragraph"
              class="report-card__body"
            >{{ paragraph }}</text>
          </view>

          <view class="report-chip-list">
            <text v-for="trait in relationshipReport.personalPortrait.traits" :key="trait" class="report-chip">{{ trait }}</text>
          </view>

          <view class="report-note-group">
            <text class="report-note-group__title">关系模式</text>
            <text class="report-note-group__body">{{ relationshipReport.personalPortrait.relationshipPattern }}</text>
          </view>

          <view class="report-note-grid">
            <view class="report-note-group">
              <text class="report-note-group__title">风险提醒</text>
              <view
                v-for="note in getReportList(relationshipReport.personalPortrait.riskNotes, '暂无明显风险提醒')"
                :key="note"
                class="report-note-group__item"
              >
                <text class="report-note-group__dot"></text>
                <text class="report-note-group__text">{{ note }}</text>
              </view>
            </view>
            <view class="report-note-group">
              <text class="report-note-group__title">行动建议</text>
              <view
                v-for="suggestion in getReportList(relationshipReport.personalPortrait.suggestions, '继续补充资料后生成建议')"
                :key="suggestion"
                class="report-note-group__item"
              >
                <text class="report-note-group__dot"></text>
                <text class="report-note-group__text">{{ suggestion }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="report-empty-card">
          <text class="report-empty-card__title">个人画像待生成</text>
          <text class="report-empty-card__body">补全个人资料后，后端会生成唯一的个人画像报告。</text>
        </view>

        <view class="report-target-section">
          <text class="report-target-section__title">关系健康度分析</text>

          <view v-if="hasTargetRelationshipReports" class="report-target-list">
            <view
              v-for="targetReport in relationshipReport.targetReports"
              :key="targetReport.targetId"
              class="report-target-card"
            >
              <view class="report-target-card__top">
                <view class="report-target-card__identity">
                  <text class="report-target-card__name">{{ targetReport.targetName || '未命名目标' }}</text>
                  <text class="report-target-card__label">{{ targetReport.relationshipLabel || '关系对象' }}</text>
                </view>
                <view class="report-target-card__score">
                  <text class="report-target-card__score-number">{{ targetReport.healthScore }}</text>
                  <text class="report-target-card__score-label">{{ getHealthLevelText(targetReport.healthLevel) }}</text>
                </view>
              </view>

              <text class="report-card__body">{{ targetReport.summary }}</text>

              <view class="report-note-grid">
                <view class="report-note-group">
                  <text class="report-note-group__title">判断依据</text>
                  <view
                    v-for="item in getReportList(targetReport.evidence, '暂无足够依据')"
                    :key="item"
                    class="report-note-group__item"
                  >
                    <text class="report-note-group__dot"></text>
                    <text class="report-note-group__text">{{ item }}</text>
                  </view>
                </view>
                <view class="report-note-group">
                  <text class="report-note-group__title">风险与建议</text>
                  <view
                    v-for="item in getReportList([...targetReport.riskNotes, ...targetReport.suggestions], '继续记录互动后生成建议')"
                    :key="item"
                    class="report-note-group__item"
                  >
                    <text class="report-note-group__dot"></text>
                    <text class="report-note-group__text">{{ item }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view v-else class="report-empty-card">
            <text class="report-empty-card__title">暂无目标关系报告</text>
            <text class="report-empty-card__body">添加目标对象并记录关键互动后，后端会生成每个目标的关系健康度分析。</text>
          </view>
        </view>
      </view>

      <view v-if="isAboutDetail" class="about-detail">
        <view v-if="hasAboutInfo" class="about-detail__hero">
          <text class="about-detail__eyebrow">关于我们</text>
          <text class="about-detail__title">{{ displayAboutInfo.appName }}</text>
          <text class="about-detail__summary">{{ displayAboutInfo.description }}</text>
        </view>

        <view v-else-if="!detailLoading" class="history-chat-empty">
          <text class="history-chat-empty__title">暂无产品信息</text>
          <text class="history-chat-empty__body">相关内容发布后会显示在这里。</text>
        </view>

        <view v-if="hasAboutInfo || displayVersion" class="about-detail__meta">
          <view class="about-detail__meta-item">
            <text class="about-detail__meta-label">团队</text>
            <text class="about-detail__meta-value">{{ displayAboutInfo.company }}</text>
          </view>
          <view class="about-detail__meta-item">
            <text class="about-detail__meta-label">版本</text>
            <text class="about-detail__meta-value">{{ displayVersion }}</text>
          </view>
        </view>

        <view v-if="aboutLinkItems.length" class="about-detail__links">
          <view v-for="item in aboutLinkItems" :key="item.label" class="about-detail__link-row">
            <text class="about-detail__link-label">{{ item.label }}</text>
            <text class="about-detail__link-value">{{ item.value }}</text>
          </view>
        </view>

        <view v-if="systemAnnouncements.length" class="about-detail__announcements">
          <text class="about-detail__section-title">系统公告</text>
          <view
            v-for="announcement in systemAnnouncements"
            :key="announcement.id"
            class="about-detail__announcement"
          >
            <text class="about-detail__announcement-title">{{ announcement.title }}</text>
            <text class="about-detail__announcement-body">{{ announcement.content }}</text>
          </view>
        </view>

        <view v-if="latestVersion?.changelog" class="about-detail__version-note">
          <text class="about-detail__section-title">更新说明</text>
          <text class="about-detail__version-body">{{ latestVersion.changelog }}</text>
        </view>
      </view>

    </view>
  </view>
</template>

<style scoped lang="scss">
.settings-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7f9 48%, #eef1f5 100%);
}

.settings-detail-page__inner {
  min-height: 100vh;
  padding: 66rpx 26rpx 48rpx;
}

.detail-hero,
.mood-diary-editor,
.detail-section,
.history-chat-item,
.history-chat-empty,
.detail-status,
.report-detail__hero,
.report-personal-card,
.report-target-card,
.report-empty-card {
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
  color: var(--error);
}

.privacy-detail {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 24rpx;
}

.privacy-detail-hero,
.privacy-detail-card__panel {
  border: 2rpx solid rgba(220, 226, 236, 0.96);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16rpx 34rpx rgba(147, 157, 190, 0.12);
}

.privacy-detail-hero {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f6fbff 100%);
}

.privacy-detail-hero__eyebrow {
  display: block;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.privacy-detail-hero__title {
  display: block;
  color: #1f2432;
  font-size: 23px;
  font-weight: 900;
  line-height: 1.24;
}

.privacy-detail-hero__summary {
  display: block;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.72;
}

.privacy-detail-card__panel {
  padding: 28rpx;
}

.privacy-detail-card__sections {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.privacy-detail-card__section {
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid rgba(226, 232, 242, 0.8);
}

.privacy-detail-card__section:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.privacy-detail-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.privacy-detail-card__title {
  display: block;
  color: #1f2432;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.32;
}

.privacy-detail-card__body {
  display: block;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.74;
}

.security-records {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.security-records__heading {
  color: var(--text);
  font-size: 20px;
  font-weight: 800;
}

.security-records__group {
  overflow: hidden;
  border: 1rpx solid var(--border);
  border-radius: 8rpx;
  background: var(--bg-content);
}

.security-records__title {
  display: block;
  padding: 18rpx 22rpx;
  border-bottom: 1rpx solid var(--border);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.security-records__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 92rpx;
  padding: 16rpx 22rpx;
  border-bottom: 1rpx solid var(--border);
}

.security-records__row:last-child {
  border-bottom: 0;
}

.security-records__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.security-records__name,
.security-records__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.security-records__name {
  color: var(--text-body);
  font-size: 14px;
  font-weight: 700;
}

.security-records__meta {
  color: var(--text-secondary);
  font-size: 12px;
}

.security-records__status {
  flex: 0 0 auto;
  color: var(--success);
  font-size: 12px;
  font-weight: 700;
}

.security-records__status--danger {
  color: var(--error);
}

.about-detail {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 24rpx;
}

.about-detail__hero,
.about-detail__meta,
.about-detail__links,
.about-detail__announcements,
.about-detail__version-note {
  border: 2rpx solid rgba(220, 226, 236, 0.96);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16rpx 34rpx rgba(147, 157, 190, 0.12);
}

.about-detail__hero {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 32rpx 30rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
}

.about-detail__eyebrow,
.about-detail__meta-label,
.about-detail__link-label {
  display: block;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.about-detail__title {
  display: block;
  color: #1f2432;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.22;
}

.about-detail__summary,
.about-detail__version-body,
.about-detail__announcement-body {
  display: block;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.72;
}

.about-detail__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  padding: 24rpx;
}

.about-detail__meta-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 0;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f8fafc;
}

.about-detail__meta-value {
  display: block;
  color: #1f2432;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.about-detail__links,
.about-detail__announcements,
.about-detail__version-note {
  display: flex;
  flex-direction: column;
  padding: 28rpx;
}

.about-detail__link-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 20rpx 0;
  border-bottom: 2rpx solid rgba(226, 232, 242, 0.8);
}

.about-detail__link-row:first-child {
  padding-top: 0;
}

.about-detail__link-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.about-detail__link-value {
  flex: 1;
  min-width: 0;
  display: block;
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.46;
  text-align: right;
  overflow-wrap: anywhere;
}

.about-detail__link-label {
  flex: 0 0 auto;
  max-width: 180rpx;
}

.about-detail__section-title {
  display: block;
  margin-bottom: 18rpx;
  color: #1f2432;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.24;
}

.about-detail__announcement {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx 0;
  border-bottom: 2rpx solid rgba(226, 232, 242, 0.8);
}

.about-detail__announcement:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.about-detail__announcement-title {
  display: block;
  color: #1f2432;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.3;
}

.report-detail {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 24rpx;
}

.report-detail__hero,
.report-personal-card,
.report-target-card,
.report-empty-card {
  padding: 30rpx;
  border: 2rpx solid rgba(220, 226, 236, 0.96);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
}

.report-detail__hero {
  background: linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%);
}

.report-detail__hero-copy {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.report-detail__eyebrow,
.report-card__eyebrow {
  display: block;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.report-detail__title,
.report-card__title,
.report-target-section__title {
  display: block;
  margin-top: 0;
  color: #1f2432;
  font-size: 23px;
  font-weight: 900;
  line-height: 1.24;
}

.report-detail__summary,
.report-card__body,
.report-note-group__body,
.report-empty-card__body {
  display: block;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.72;
}

.report-card__header,
.report-target-card__identity,
.report-note-group {
  display: flex;
  flex-direction: column;
}

.report-card__header {
  gap: 12rpx;
}

.report-body-block {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 22rpx;
}

.report-personal-card .report-card__body {
  color: #273142;
  font-size: 15px;
  line-height: 1.78;
}

.report-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 24rpx;
}

.report-chip {
  max-width: 100%;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  color: #1f5f9f;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  background: #edf6ff;
}

.report-note-grid,
.report-target-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.report-note-group {
  gap: 14rpx;
  padding: 22rpx;
  border: 2rpx solid rgba(226, 232, 242, 0.88);
  border-radius: 20rpx;
  background: #f8fafc;
}

.report-personal-card > .report-note-group {
  margin-top: 24rpx;
}

.report-note-group__title {
  display: block;
  color: #252b3a;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
}

.report-note-group__body {
  margin-top: 0;
}

.report-note-group__item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.report-note-group__dot {
  flex: 0 0 auto;
  width: 8rpx;
  height: 8rpx;
  margin-top: 14rpx;
  border-radius: 999rpx;
  background: var(--primary);
}

.report-note-group__text {
  flex: 1;
  min-width: 0;
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.62;
}

.report-target-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 2rpx;
}

.report-target-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.report-target-card__name {
  display: block;
  color: #1f2432;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.18;
}

.report-target-card__label {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.report-target-card__score {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #eaf4ff;
}

.report-target-card__score-number {
  display: block;
  color: var(--primary);
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.report-target-card__score-label {
  display: block;
  margin-top: 8rpx;
  color: #315b88;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.report-empty-card__title {
  display: block;
  color: #1f2432;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
}

.report-empty-card__body {
  margin-top: 12rpx;
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
  color: #ffffff;
  background: var(--primary);
}

.mood-date-picker {
  flex: 0 0 auto;
  padding: 16rpx 22rpx;
  border-radius: 999rpx;
  box-shadow: 0 8rpx 0 0 var(--primary-active);
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
  background: rgba(255, 255, 255, 0.82);
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
  background: var(--primary);
  box-shadow: 0 8rpx 0 0 var(--primary-active);
}

.mood-calendar__day--saved {
  border: 2rpx solid rgba(10, 124, 255, 0.36);
}

.mood-diary-editor {
  display: flex;
  flex-direction: column;
  min-height: 520rpx;
  margin-top: 28rpx;
  padding: 30rpx;
  border: 2rpx solid var(--border);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.94);
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
  background: rgba(255, 255, 255, 0.92);
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
  scrollbar-color: rgba(10, 124, 255, 0.42) rgba(227, 230, 235, 0.72);
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar {
  width: 8rpx;
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar-track {
  border-radius: 999rpx;
  background: rgba(227, 230, 235, 0.72);
}

:deep(.uni-textarea-textarea)::-webkit-scrollbar-thumb {
  border-radius: 999rpx;
  background: rgba(10, 124, 255, 0.42);
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
  background: linear-gradient(180deg, #ffffff 0%, #f6f7f9 100%);
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
  border: 2rpx dashed var(--border-strong);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.78);
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

</style>
