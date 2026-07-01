<script setup>
import { computed, ref } from 'vue'
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
const menuOpen = ref(false)
const currentScreen = ref('login')
const activeFeatureKey = ref('')
const chatRecords = ref([])
const currentChatId = ref('')
const currentChatMessages = ref([])
const isLoadingConversations = ref(false)
const isSendingMessage = ref(false)
const chatErrorMessage = ref('')

const activeChat = computed(() => (
  chatRecords.value.find((chat) => chat.id === currentChatId.value) || null
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
  menuOpen.value = false
  activeFeatureKey.value = ''
  currentChatId.value = ''
  currentChatMessages.value = []
  chatErrorMessage.value = ''
}

const handleLoginSuccess = async () => {
  resetHomeUiState()
  currentScreen.value = 'home'
  await loadConversationList()
}

const openSettings = () => {
  currentScreen.value = 'settings'
}

const openFeaturePage = (featureKey) => {
  menuOpen.value = false
  activeFeatureKey.value = featureKey
  currentScreen.value = 'feature'
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
  activeFeatureKey.value = ''
  currentScreen.value = 'home'
}

const ensureChatRecord = (chatRecord) => {
  if (!chatRecord?.id) {
    return null
  }

  const cachedChat = chatRecords.value.find((item) => item.id === chatRecord.id)

  if (cachedChat) {
    return cachedChat
  }

  const nextChat = {
    ...chatRecord,
    messages: [...(chatRecord.messages || [])],
  }

  chatRecords.value.unshift(nextChat)
  return nextChat
}

const openChatRecord = async (chatTarget) => {
  const chat = typeof chatTarget === 'object'
    ? ensureChatRecord(chatTarget)
    : chatRecords.value.find((item) => item.id === chatTarget)

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
        const nextConversationId = payload.conversation_id || payload.conversationId
        streamCompleted = true
        updateCurrentMessage(aiMessage.id, (message) => ({
          ...message,
          id: payload.assistant_message_id || payload.assistantMessageId || message.id,
          content: payload.content || message.content,
          status: 'done',
        }))
        replaceCurrentChatId(nextConversationId)
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
  currentScreen.value = 'home'
}

const backToLogin = () => {
  resetHomeUiState()
  currentScreen.value = 'login'
}
</script>

<template>
  <view class="app-shell">
    <LoginScreen v-if="currentScreen === 'login'" @success="handleLoginSuccess" />

    <HomeFeatureScreen
      v-else-if="currentScreen === 'feature'"
      :feature-key="activeFeatureKey"
      :active-chat="activeChat"
      :current-chat-messages="currentChatMessages"
      @back="backToHome"
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
        <HomeHeader :show-hero="!isChatting" @menu="openMenu" />

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

          <HomeTopics :topics="hotTopics" />

          <text class="timeline">12:22</text>

          <HomeChatCard :message-lines="messageLines" />
        </view>
        <HomeComposer @send="handleSendMessage" />
      </view>

      <HomeSideDrawer
        :open="menuOpen"
        :profile="sidebarProfile"
        :quick-links="sidebarQuickLinks"
        :chat-records="chatRecords"
        @close="closeMenu"
        @settings="openSettings"
        @open-page="openFeaturePage"
        @new-chat="startNewChat"
        @open-chat="openChatRecord"
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
  background: linear-gradient(180deg, #f2ecf8 0%, #e9ebf9 34%, #dcebfa 100%);
  transition: filter 220ms ease;
}

.page--menu-open {
  filter: brightness(0.98) saturate(0.92);
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
  border-radius: 28rpx;
  box-shadow: 0 12rpx 26rpx rgba(116, 130, 164, 0.12);
}

.home-chat-message--user {
  align-self: flex-end;
  border-bottom-right-radius: 10rpx;
  background: #5d6ef2;
}

.home-chat-message--ai {
  align-self: flex-start;
  border-bottom-left-radius: 10rpx;
  background: rgba(255, 255, 255, 0.88);
}

.home-chat-message--error {
  background: rgba(255, 240, 243, 0.92);
}

.home-chat-message__content {
  color: #303544;
  font-size: 15px;
  line-height: 1.48;
}

.home-chat-message--user .home-chat-message__content {
  color: #ffffff;
}

.chat-error-banner,
.chat-loading {
  margin-top: 28rpx;
  padding: 18rpx 22rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.66);
}

.chat-error-banner text {
  color: #c85567;
  font-size: 13px;
  line-height: 1.4;
}

.chat-loading text {
  color: #7c8497;
  font-size: 13px;
  line-height: 1.4;
}

.timeline {
  display: block;
  margin-top: 56rpx;
  color: #9ba3b5;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}
</style>
