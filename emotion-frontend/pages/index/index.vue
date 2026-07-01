<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import HomeChatCard from '../../components/home/HomeChatCard.vue'
import HomeComposer from '../../components/home/HomeComposer.vue'
import HomeFeatureScreen from '../../components/home/HomeFeatureScreen.vue'
import HomeHeader from '../../components/home/HomeHeader.vue'
import HomeSideDrawer from '../../components/home/HomeSideDrawer.vue'
import HomeStatusBar from '../../components/home/HomeStatusBar.vue'
import HomeTopics from '../../components/home/HomeTopics.vue'
import LoginScreen from '../../components/login/LoginScreen.vue'
import SettingsScreen from '../../components/settings/SettingsScreen.vue'
import {
  hotTopics,
  messageLines,
  sidebarProfile,
  sidebarQuickLinks,
} from '../../common/home-data'
import {
  createStableUserId,
  fetchConversationMessages,
  fetchConversations,
  streamChatMessage,
} from '../../common/chat-api.mjs'

const userId = createStableUserId()
const introHeroTitleParts = ['你好！', '帮你吃爱情的苦']
const introStreamTimers = []
const menuOpen = ref(false)
const currentScreen = ref('login')
const activeFeatureKey = ref('')
const chatRecords = ref([])
const importantRecords = ref([])
const currentChatId = ref('')
const currentChatMessages = ref([])
const activeImportantRecordId = ref('')
const isLoadingConversations = ref(false)
const isSendingMessage = ref(false)
const chatErrorMessage = ref('')
const streamedHeroTitleParts = ref(['', ''])
const streamedMessageLines = ref([])

const activeChat = computed(() => (
  chatRecords.value.find((chat) => chat.id === currentChatId.value) || null
))
const activeImportantRecord = computed(() => (
  importantRecords.value.find((record) => record.id === activeImportantRecordId.value) || null
))
const isChatting = computed(() => currentChatMessages.value.length > 0)
const isRemoteChatId = (chatId) => Boolean(chatId) && !chatId.startsWith('local-chat-')

const getErrorMessage = (error) => (
  error instanceof Error ? error.message : String(error || '请求失败，请稍后重试')
)

const showToast = (message) => {
  if (typeof uni === 'undefined' || !uni.showToast) return

  uni.showToast({
    title: message,
    icon: 'none',
  })
}

const clearIntroStreamTimers = () => {
  while (introStreamTimers.length > 0) {
    clearTimeout(introStreamTimers.pop())
  }
}

const resetIntroTextStream = () => {
  clearIntroStreamTimers()
  streamedHeroTitleParts.value = ['', '']
  streamedMessageLines.value = []
}

const completeIntroTextStream = () => {
  clearIntroStreamTimers()
  streamedHeroTitleParts.value = [...introHeroTitleParts]
  streamedMessageLines.value = [...messageLines]
}

const startIntroTextStream = () => {
  resetIntroTextStream()

  let nextDelay = 120

  introHeroTitleParts.forEach((textPart, partIndex) => {
    const characters = Array.from(textPart)

    characters.forEach((_, characterIndex) => {
      const visibleText = characters.slice(0, characterIndex + 1).join('')

      introStreamTimers.push(setTimeout(() => {
        streamedHeroTitleParts.value = streamedHeroTitleParts.value.map((currentText, index) => (
          index === partIndex ? visibleText : currentText
        ))
      }, nextDelay))

      nextDelay += 58
    })

    nextDelay += 90
  })

  nextDelay += 180

  messageLines.forEach((line, lineIndex) => {
    const characters = Array.from(line)

    characters.forEach((_, characterIndex) => {
      const visibleLine = characters.slice(0, characterIndex + 1).join('')

      introStreamTimers.push(setTimeout(() => {
        const nextLines = streamedMessageLines.value.slice(0, lineIndex + 1)
        nextLines[lineIndex] = visibleLine
        streamedMessageLines.value = nextLines
      }, nextDelay))

      nextDelay += 22
    })

    nextDelay += 120
  })
}

const formatImportantRecordDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const formatImportantRecordTimestamp = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${formatImportantRecordDate(date)} ${hours}:${minutes}`
}

const createEmptyImportantRecordDraft = () => ({
  id: '',
  title: '',
  recordTime: formatImportantRecordDate(),
  eventDescription: '',
  resolution: '',
  concernPoint: '',
  satisfaction: '满意',
})

const normalizeImportantRecordDraft = (recordDraft = createEmptyImportantRecordDraft()) => ({
  id: recordDraft.id || '',
  title: (recordDraft.title || '').trim(),
  recordTime: recordDraft.recordTime || formatImportantRecordDate(),
  eventDescription: (recordDraft.eventDescription || '').trim(),
  resolution: (recordDraft.resolution || '').trim(),
  concernPoint: (recordDraft.concernPoint || '').trim(),
  satisfaction: recordDraft.satisfaction || '满意',
})

const getChatPreview = (messages, fallback = '暂无消息') => {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  const latestMessage = messages[messages.length - 1]

  return latestUserMessage?.content || latestMessage?.content || fallback
}

const refreshChatRecord = (chatId, messages, patch = {}) => {
  chatRecords.value = chatRecords.value.map((chat) => {
    if (chat.id !== chatId) {
      return chat
    }

    return {
      ...chat,
      ...patch,
      messages: [...messages],
      preview: patch.preview || getChatPreview(messages, chat.preview),
      time: patch.time || '刚刚',
    }
  })
}

const syncCurrentChatRecord = (patch = {}) => {
  if (!currentChatId.value) return

  refreshChatRecord(currentChatId.value, currentChatMessages.value, patch)
}

const replaceCurrentChatId = (nextChatId) => {
  const previousChatId = currentChatId.value

  if (!nextChatId || previousChatId === nextChatId) return

  currentChatId.value = nextChatId
  chatRecords.value = chatRecords.value.map((chat) => (
    chat.id === previousChatId
      ? { ...chat, id: nextChatId, messages: [...currentChatMessages.value] }
      : chat
  ))
}

const updateCurrentMessage = (messageId, updater) => {
  currentChatMessages.value = currentChatMessages.value.map((message) => (
    message.id === messageId ? updater(message) : message
  ))
  syncCurrentChatRecord()
}

const mergeConversationRecords = (records) => {
  const cachedRecords = new Map(chatRecords.value.map((chat) => [chat.id, chat]))
  const mergedRecords = records.map((chat) => {
    const cachedChat = cachedRecords.get(chat.id)
    const cachedMessages = chat.id === currentChatId.value && currentChatMessages.value.length > 0
      ? currentChatMessages.value
      : cachedChat?.messages || []

    return {
      ...chat,
      messages: [...cachedMessages],
      preview: cachedMessages.length > 0 ? getChatPreview(cachedMessages, chat.preview) : chat.preview,
    }
  })

  if (currentChatId.value && !mergedRecords.some((chat) => chat.id === currentChatId.value)) {
    const activeCachedChat = cachedRecords.get(currentChatId.value)

    if (activeCachedChat) {
      mergedRecords.unshift({
        ...activeCachedChat,
        messages: [...currentChatMessages.value],
        preview: getChatPreview(currentChatMessages.value, activeCachedChat.preview),
      })
    }
  }

  chatRecords.value = mergedRecords
}

const loadConversationList = async () => {
  isLoadingConversations.value = true

  try {
    const records = await fetchConversations({ userId })
    mergeConversationRecords(records)
  } catch (error) {
    const message = getErrorMessage(error)
    chatErrorMessage.value = message
    showToast(message)
  } finally {
    isLoadingConversations.value = false
  }
}

const openMenu = () => {
  menuOpen.value = true
}

const closeMenu = () => {
  menuOpen.value = false
}

const resetHomeUiState = () => {
  clearIntroStreamTimers()
  menuOpen.value = false
  activeFeatureKey.value = ''
  currentChatId.value = ''
  currentChatMessages.value = []
  activeImportantRecordId.value = ''
  chatErrorMessage.value = ''
}

const handleLoginSuccess = async () => {
  resetHomeUiState()
  currentScreen.value = 'home'
  startIntroTextStream()
  await loadConversationList()
}

const openSettings = () => {
  currentScreen.value = 'settings'
}

const openFeaturePage = (featureKey) => {
  if (featureKey === 'important-record-create') {
    openImportantRecordCreate()
    return
  }

  menuOpen.value = false
  activeFeatureKey.value = featureKey
  currentScreen.value = 'feature'
}

const openImportantRecordCreate = () => {
  menuOpen.value = false
  activeImportantRecordId.value = ''
  activeFeatureKey.value = 'important-record-create'
  currentScreen.value = 'feature'
}

const openImportantRecordDetail = (recordId) => {
  const record = importantRecords.value.find((item) => item.id === recordId)

  if (!record) return

  menuOpen.value = false
  activeImportantRecordId.value = record.id
  activeFeatureKey.value = 'important-record-detail'
  currentScreen.value = 'feature'
}

const openImportantRecordEdit = (recordId = activeImportantRecordId.value) => {
  const record = importantRecords.value.find((item) => item.id === recordId)

  if (!record) return

  menuOpen.value = false
  activeImportantRecordId.value = record.id
  activeFeatureKey.value = 'important-record-edit'
  currentScreen.value = 'feature'
}

const saveImportantRecord = (recordDraft) => {
  const normalizedRecord = normalizeImportantRecordDraft(recordDraft)

  if (!normalizedRecord.title) {
    showToast('请填写标题')
    return
  }

  if (!normalizedRecord.eventDescription) {
    showToast('请填写事件描述')
    return
  }

  const nowLabel = formatImportantRecordTimestamp()
  const existingRecord = importantRecords.value.find((record) => record.id === normalizedRecord.id)
  const nextRecord = {
    ...normalizedRecord,
    id: existingRecord?.id || `important-record-${Date.now()}`,
    createdAt: existingRecord?.createdAt || nowLabel,
    updatedAt: nowLabel,
  }

  if (existingRecord) {
    importantRecords.value = importantRecords.value.map((record) => (
      record.id === nextRecord.id ? nextRecord : record
    ))
  } else {
    importantRecords.value = [nextRecord, ...importantRecords.value]
  }

  activeImportantRecordId.value = nextRecord.id
  activeFeatureKey.value = 'important-record-detail'
  currentScreen.value = 'feature'
  showToast(existingRecord ? '记录已更新' : '记录已添加')
}

const deleteImportantRecord = (recordId) => {
  const targetRecordId = recordId || activeImportantRecordId.value

  if (!targetRecordId) return

  importantRecords.value = importantRecords.value.filter((record) => record.id !== targetRecordId)

  if (activeImportantRecordId.value === targetRecordId) {
    activeImportantRecordId.value = ''
  }

  activeFeatureKey.value = ''
  currentScreen.value = 'home'
  showToast('记录已删除')
}

const createChatRecord = (initialMessage = '') => {
  const nextIndex = chatRecords.value.length + 1
  const chat = {
    id: `local-chat-${Date.now()}-${nextIndex}`,
    title: initialMessage ? initialMessage.slice(0, 20) : `新对话 ${nextIndex}`,
    preview: initialMessage || '还没有消息，开始新的情感分析。',
    time: '刚刚',
    updatedAt: '',
    messages: [],
  }

  chatRecords.value.unshift(chat)
  return chat
}

const startNewChat = () => {
  menuOpen.value = false
  currentChatId.value = ''
  currentChatMessages.value = []
  chatErrorMessage.value = ''
  activeFeatureKey.value = 'chat-detail'
  currentScreen.value = 'feature'
}

const openChatRecord = async (chatId) => {
  const chat = chatRecords.value.find((item) => item.id === chatId)

  if (!chat) return

  menuOpen.value = false
  currentChatId.value = chat.id
  currentChatMessages.value = [...chat.messages]
  chatErrorMessage.value = ''
  activeFeatureKey.value = 'chat-detail'
  currentScreen.value = 'feature'

  if (!isRemoteChatId(chat.id)) {
    return
  }

  try {
    const messages = await fetchConversationMessages(chat.id, { userId })

    if (currentChatId.value !== chat.id) return

    currentChatMessages.value = messages
    refreshChatRecord(chat.id, messages)
  } catch (error) {
    const message = getErrorMessage(error)
    chatErrorMessage.value = message
    showToast(message)
  }
}

const handleSendMessage = async (question) => {
  const trimmedQuestion = question.trim()

  if (!trimmedQuestion || isSendingMessage.value) return

  completeIntroTextStream()

  const chat = activeChat.value || createChatRecord(trimmedQuestion)
  const conversationId = isRemoteChatId(chat.id) ? chat.id : null
  const timestamp = Date.now()
  const userMessage = {
    id: `${chat.id}-user-${timestamp}`,
    role: 'user',
    content: trimmedQuestion,
  }
  const aiMessage = {
    id: `${chat.id}-ai-${timestamp}`,
    role: 'ai',
    content: '',
    status: 'streaming',
  }

  chatErrorMessage.value = ''
  currentChatId.value = chat.id
  currentChatMessages.value = [...currentChatMessages.value, userMessage, aiMessage]
  syncCurrentChatRecord({
    preview: trimmedQuestion,
    time: '刚刚',
  })

  let streamCompleted = false
  let streamError = ''
  isSendingMessage.value = true

  try {
    await streamChatMessage({
      conversationId,
      message: trimmedQuestion,
      userId,
      onDelta: (content) => {
        updateCurrentMessage(aiMessage.id, (message) => ({
          ...message,
          content: `${message.content}${content}`,
          status: 'streaming',
        }))
      },
      onDone: (payload) => {
        streamCompleted = true
        updateCurrentMessage(aiMessage.id, (message) => ({
          ...message,
          id: payload.assistant_message_id || message.id,
          content: payload.content || message.content,
          status: 'done',
        }))
        replaceCurrentChatId(payload.conversation_id)
      },
      onError: (message) => {
        streamError = message
        updateCurrentMessage(aiMessage.id, (currentMessage) => ({
          ...currentMessage,
          content: message,
          status: 'error',
        }))
      },
    })

    if (streamError) {
      throw new Error(streamError)
    }

    if (streamCompleted) {
      await loadConversationList()
    }
  } catch (error) {
    const message = getErrorMessage(error)
    chatErrorMessage.value = message
    updateCurrentMessage(aiMessage.id, (currentMessage) => ({
      ...currentMessage,
      content: currentMessage.content || message,
      status: 'error',
    }))
    showToast(message)
  } finally {
    isSendingMessage.value = false
  }
}

const backToHome = () => {
  resetHomeUiState()
  completeIntroTextStream()
  currentScreen.value = 'home'
}

const backToLogin = () => {
  resetHomeUiState()
  resetIntroTextStream()
  currentScreen.value = 'login'
}

onBeforeUnmount(clearIntroStreamTimers)
</script>

<template>
  <view class="app-shell">
    <LoginScreen v-if="currentScreen === 'login'" @success="handleLoginSuccess" />

    <HomeFeatureScreen
      v-else-if="currentScreen === 'feature'"
      :feature-key="activeFeatureKey"
      :active-chat="activeChat"
      :active-important-record="activeImportantRecord"
      :current-chat-messages="currentChatMessages"
      @back="backToHome"
      @save-important-record="saveImportantRecord"
      @edit-important-record="openImportantRecordEdit"
      @delete-important-record="deleteImportantRecord"
      @send="handleSendMessage"
    />

    <SettingsScreen
      v-else-if="currentScreen === 'settings'"
      :chat-records="chatRecords"
      @back="backToHome"
      @logout="backToLogin"
      @open-chat="openChatRecord"
    />

    <view v-else class="page-shell">
      <view class="page" :class="{ 'page--menu-open': menuOpen }">
        <HomeStatusBar />
        <HomeHeader
          :show-hero="!isChatting"
          :hero-title-parts="streamedHeroTitleParts"
          @menu="openMenu"
        />

        <view v-if="chatErrorMessage" class="chat-error-banner">
          <text>{{ chatErrorMessage }}</text>
        </view>

        <view v-if="isChatting" class="home-chat-thread">
          <view
            v-for="message in currentChatMessages"
            :key="message.id"
            class="home-chat-message"
            :class="{
              'home-chat-message--user': message.role === 'user',
              'home-chat-message--ai': message.role === 'ai',
              'home-chat-message--error': message.status === 'error',
            }"
          >
            <text class="home-chat-message__content">{{ message.content || '正在分析...' }}</text>
          </view>
        </view>

        <view v-else class="home-intro-content">
          <view v-if="isLoadingConversations" class="chat-loading">
            <text>正在同步历史对话...</text>
          </view>

          <HomeTopics :topics="hotTopics" @select="handleSendMessage" />

          <text class="timeline">12:22</text>

          <HomeChatCard :message-lines="streamedMessageLines" />
        </view>
        <HomeComposer @send="handleSendMessage" />
      </view>

      <HomeSideDrawer
        :open="menuOpen"
        :profile="sidebarProfile"
        :quick-links="sidebarQuickLinks"
        :chat-records="chatRecords"
        :important-records="importantRecords"
        @close="closeMenu"
        @settings="openSettings"
        @open-page="openFeaturePage"
        @new-chat="startNewChat"
        @open-chat="openChatRecord"
        @open-important-record="openImportantRecordDetail"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
}

.page-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.page {
  min-height: 100vh;
  padding: 38rpx 22rpx 18rpx;
  background:
    radial-gradient(circle at 50% -10%, rgba(255, 255, 255, 0.58), transparent 42%),
    radial-gradient(circle at 12% 18%, rgba(130, 213, 187, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(248, 248, 240, 0.94) 0%, rgba(247, 243, 223, 0.98) 100%);
  transition: filter 220ms var(--ease);
}

.page--menu-open {
  filter: brightness(0.97) saturate(0.9);
}

.home-intro-content {
  display: block;
}

.home-chat-thread {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 64rpx 0 150rpx;
}

.home-chat-message {
  max-width: 82%;
  padding: 20rpx 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 30rpx;
  box-shadow: var(--shadow-soft);
  background: var(--panel-bg);
}

.home-chat-message--user {
  align-self: flex-end;
  border-bottom-right-radius: 10rpx;
  border-color: var(--primary-active);
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.22) 1.5px, transparent 1.5px) 0 0 / 28rpx 28rpx,
    radial-gradient(circle, rgba(255, 255, 255, 0.18) 1px, transparent 1px) 7rpx 7rpx / 14rpx 14rpx,
    linear-gradient(180deg, #30d7c8 0%, var(--primary) 100%);
  box-shadow: 0 8rpx 0 0 var(--shadow-btn);
}

.home-chat-message--ai {
  align-self: flex-start;
  border-bottom-left-radius: 10rpx;
  background: var(--panel-bg);
}

.home-chat-message--error {
  border-color: #e7a2a2;
  background:
    radial-gradient(circle, rgba(224, 90, 90, 0.08) 1.5px, transparent 1.5px) 0 0 / 28rpx 28rpx,
    #fcecea;
}

.home-chat-message__content {
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.48;
}

.home-chat-message--user .home-chat-message__content {
  color: #fff9e3;
}

.chat-error-banner,
.chat-loading {
  margin-top: 28rpx;
  padding: 18rpx 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: var(--panel-bg);
}

.chat-error-banner text {
  color: var(--error);
  font-size: 13px;
  line-height: 1.4;
}

.chat-loading text {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.timeline {
  display: block;
  margin-top: 56rpx;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1;
  text-align: center;
}
</style>
