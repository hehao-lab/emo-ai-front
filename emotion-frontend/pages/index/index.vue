<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { onBackPress, onHide, onShow } from '@dcloudio/uni-app'
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
  createClientRequestId,
  createStableUserId,
  fetchConversationMessages,
  fetchConversationsWithMessages,
  streamChatMessage,
} from '../../common/chat-api.mjs'
import {
  createTimedUserMessage,
  formatClockTime,
} from '../../common/chat-time.mjs'
import { isRemoteChatId, normalizeChatId } from '../../common/chat-id.mjs'
import { createAppSpeaker } from '../../common/app-speaker.mjs'
import { createAppVoiceRecognitionController } from '../../common/app-voice-recognition.mjs'
import { renderMarkdownNodes } from '../../common/markdown-render.mjs'
import {
  createImportantRecord,
  deleteImportantRecord as removeImportantRecord,
  fetchCurrentUserProfile,
  fetchImportantRecords,
  fetchPersonalProfile,
  fetchTargetProfiles,
  savePersonalProfile,
  saveTargetProfile,
  updateImportantRecord,
} from '../../common/profile-api.mjs'

const userId = createStableUserId()
const introHeroTitleParts = ['你好！', '帮你理清人际关系的结']
const introStreamTimers = []
let liveClockTimer = null
let activeStreamController = null
const menuOpen = ref(false)
const currentScreen = ref('login')
const activeFeatureKey = ref('')
const chatRecords = ref([])
const importantRecords = ref([])
const currentUserProfile = ref(null)
const personalProfile = ref(null)
const targetProfiles = ref([])
const activeTargetProfileId = ref('')
const currentChatId = ref('')
const currentChatMessages = ref([])
const activeImportantRecordId = ref('')
const isLoadingConversations = ref(false)
const isSendingMessage = ref(false)
const chatErrorMessage = ref('')
const streamedHeroTitleParts = ref(['', ''])
const streamedMessageLines = ref([])
const liveTimelineText = ref(formatClockTime())
const shouldShowHomeChatBubble = ref(false)
const voiceRecognition = createAppVoiceRecognitionController()
const voiceEnabled = ref(false)
const voiceListening = ref(false)
const voiceSupported = ref(voiceRecognition.isSupported())
const voiceStatusText = ref('点按开启语音输入')
const appInForeground = ref(true)
const speaker = createAppSpeaker()
const speakerEnabled = ref(false)
const speakerSupported = ref(speaker.isSupported())

const activeChat = computed(() => (
  chatRecords.value.find((chat) => chat.id === currentChatId.value) || null
))
const activeImportantRecord = computed(() => (
  importantRecords.value.find((record) => record.id === activeImportantRecordId.value) || null
))
const activeTargetProfile = computed(() => (
  targetProfiles.value.find((target) => target.id === activeTargetProfileId.value) || null
))
const isChatting = computed(() => currentChatMessages.value.length > 0)
const displaySidebarProfile = computed(() => ({
  ...sidebarProfile,
  name: currentUserProfile.value?.displayName || sidebarProfile.name,
  avatarUrl: currentUserProfile.value?.avatarUrl || '',
}))

const getErrorMessage = (error) => (
  error instanceof Error ? error.message : String(error || '请求失败，请稍后重试')
)

const getMessageRichTextNodes = (message) => renderMarkdownNodes(message.content || '正在分析...')

const sourceLabel = (source, index) => source.label || source.key || source.title || `来源 ${index + 1}`
const sourceDetail = (source) => source.snippet || source.content || source.source || source.document_id || ''

const openReference = (source) => {
  const content = sourceDetail(source)
  if (typeof uni !== 'undefined' && uni.showModal) {
    uni.showModal({ title: source.title || source.label || '引用来源', content: content || '暂无可展示的原文片段', showCancel: false })
    return
  }
  showToast(content || '暂无可展示的原文片段')
}

const prepareHomeChatBubbleForFirstEntry = () => {
  shouldShowHomeChatBubble.value = true
}

const showToast = (message) => {
  if (typeof uni === 'undefined' || !uni.showToast) return

  uni.showToast({
    title: message,
    icon: 'none',
  })
}

const canAutoListen = () => (
  appInForeground.value &&
  voiceEnabled.value &&
  voiceSupported.value &&
  !voiceListening.value &&
  !isSendingMessage.value &&
  currentScreen.value !== 'login' &&
  currentScreen.value !== 'settings'
)

const stopVoiceListening = () => {
  voiceRecognition.stop()
  voiceListening.value = false
}

const handleVoiceResult = async (text) => {
  const recognizedText = String(text || '').trim()

  voiceListening.value = false

  if (!recognizedText) {
    if (canAutoListen()) startVoiceListening()
    return
  }

  voiceStatusText.value = '已识别，正在发送'
  await handleSendMessage(recognizedText)

  if (canAutoListen()) startVoiceListening()
}

const startVoiceListening = async () => {
  if (!canAutoListen()) return

  const result = await voiceRecognition.start({
    onStart: () => {
      voiceListening.value = true
      voiceStatusText.value = '正在聆听'
    },
    onResult: handleVoiceResult,
    onStop: () => {
      voiceListening.value = false
      if (voiceEnabled.value) voiceStatusText.value = '等待你说话'
    },
    onError: () => {
      voiceListening.value = false
      voiceStatusText.value = '语音识别中断，点按重试'
    },
  })

  if (!result.ok && result.reason === 'unsupported') {
    voiceSupported.value = false
    voiceStatusText.value = '当前环境不支持语音识别'
  }
}

const enableVoiceInput = async () => {
  if (!voiceSupported.value) {
    voiceStatusText.value = '当前环境不支持语音识别'
    showToast('当前环境不支持微信语音识别')
    return
  }

  const permission = await voiceRecognition.requestRecordPermission()

  if (!permission.ok) {
    voiceEnabled.value = false
    voiceRecognition.setAutoListeningEnabled(false)
    voiceStatusText.value = '需要麦克风权限'
    showToast('请在设置中允许麦克风权限')
    return
  }

  voiceEnabled.value = true
  voiceRecognition.setAutoListeningEnabled(true)
  voiceStatusText.value = '等待你说话'
  await startVoiceListening()
}

const disableVoiceInput = () => {
  voiceEnabled.value = false
  voiceRecognition.setAutoListeningEnabled(false)
  voiceStatusText.value = '点按开启语音输入'
  stopVoiceListening()
}

const speakAssistantReply = async (content) => {
  if (!speakerEnabled.value) return

  if (!speakerSupported.value) {
    showToast('当前环境不支持语音播报')
    speakerEnabled.value = false
    return
  }

  const result = await speaker.speak(content)

  if (!result.ok && result.reason !== 'empty-text') {
    speakerEnabled.value = false
    showToast('语音播报失败，请稍后重试')
  }
}

const toggleSpeaker = () => {
  const nextEnabled = !speakerEnabled.value

  if (!nextEnabled) {
    speakerEnabled.value = false
    speaker.stop()
    return
  }

  speakerSupported.value = speaker.isSupported()

  if (!speakerSupported.value) {
    showToast('当前环境不支持语音播报')
    return
  }

  speakerEnabled.value = true
}

const clearIntroStreamTimers = () => {
  while (introStreamTimers.length > 0) {
    clearTimeout(introStreamTimers.pop())
  }
}

const updateLiveTimelineText = () => {
  liveTimelineText.value = formatClockTime()
}

const startLiveClock = () => {
  updateLiveTimelineText()

  if (liveClockTimer) {
    clearInterval(liveClockTimer)
  }

  liveClockTimer = setInterval(updateLiveTimelineText, 60 * 1000)
}

const stopLiveClock = () => {
  if (!liveClockTimer) return

  clearInterval(liveClockTimer)
  liveClockTimer = null
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
    const records = await fetchConversationsWithMessages({ userId })
    mergeConversationRecords(records)
  } catch (error) {
    const message = getErrorMessage(error)
    chatErrorMessage.value = message
    showToast(message)
  } finally {
    isLoadingConversations.value = false
  }
}

const upsertTargetProfile = (targetProfile) => {
  if (!targetProfile?.id) return

  const existingTarget = targetProfiles.value.find((target) => target.id === targetProfile.id)

  targetProfiles.value = existingTarget
    ? targetProfiles.value.map((target) => (
      target.id === targetProfile.id ? targetProfile : target
    ))
    : [targetProfile, ...targetProfiles.value]
}

const upsertImportantRecord = (importantRecord) => {
  if (!importantRecord?.id) return

  const existingRecord = importantRecords.value.find((record) => record.id === importantRecord.id)

  importantRecords.value = existingRecord
    ? importantRecords.value.map((record) => (
      record.id === importantRecord.id ? importantRecord : record
    ))
    : [importantRecord, ...importantRecords.value]
}

const loadImportantRecords = async (targetProfileId = activeTargetProfileId.value) => {
  if (!targetProfileId) {
    importantRecords.value = []
    activeImportantRecordId.value = ''
    return
  }

  importantRecords.value = await fetchImportantRecords({ targetId: targetProfileId })

  if (
    activeImportantRecordId.value
    && !importantRecords.value.some((record) => record.id === activeImportantRecordId.value)
  ) {
    activeImportantRecordId.value = ''
  }
}

const loadProfileData = async () => {
  try {
    const [nextPersonalProfile, nextTargetProfiles] = await Promise.all([
      fetchPersonalProfile(),
      fetchTargetProfiles(),
    ])

    personalProfile.value = nextPersonalProfile
    targetProfiles.value = nextTargetProfiles
    activeTargetProfileId.value = nextTargetProfiles[0]?.id || ''
    await loadImportantRecords(activeTargetProfileId.value)
  } catch (error) {
    showToast(getErrorMessage(error))
  }
}

const loadCurrentUserProfile = async () => {
  try {
    currentUserProfile.value = await fetchCurrentUserProfile()
  } catch (error) {
    currentUserProfile.value = null
  }
}

const handleProfileUpdated = (profile) => {
  if (!profile) return

  currentUserProfile.value = profile
}

const openMenu = () => {
  menuOpen.value = true
}

const closeMenu = () => {
  menuOpen.value = false
}

const resetHomeUiState = () => {
	activeStreamController?.abort()
	activeStreamController = null
	clearIntroStreamTimers()
  menuOpen.value = false
  activeFeatureKey.value = ''
  currentChatId.value = ''
  currentChatMessages.value = []
  activeImportantRecordId.value = ''
  chatErrorMessage.value = ''
  shouldShowHomeChatBubble.value = false
}

const handleLoginSuccess = async () => {
  resetHomeUiState()
  currentScreen.value = 'home'
  prepareHomeChatBubbleForFirstEntry()
  startLiveClock()
  startIntroTextStream()
  await Promise.all([
    loadCurrentUserProfile(),
    loadConversationList(),
    loadProfileData(),
  ])
  if (canAutoListen()) startVoiceListening()
}

const openSettings = () => {
  stopVoiceListening()
  speaker.stop()
  stopLiveClock()
  currentScreen.value = 'settings'
}

const openFeaturePage = (featureKey) => {
  stopGenerating()
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

const selectTargetProfile = async (targetProfileId) => {
  if (!targetProfileId || targetProfileId === activeTargetProfileId.value) return

  activeTargetProfileId.value = targetProfileId
  activeImportantRecordId.value = ''
  await loadImportantRecords(targetProfileId)
}

const startNewTargetProfile = () => {
  activeTargetProfileId.value = ''
  importantRecords.value = []
  activeImportantRecordId.value = ''
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

const savePersonalProfileData = async (profileDraft) => {
  try {
    const savedProfile = await savePersonalProfile(profileDraft)
    personalProfile.value = {
      ...profileDraft,
      ...savedProfile,
      personalitySummary: savedProfile.personalitySummary || profileDraft.personalitySummary || '',
    }
    showToast('个人信息已保存')
  } catch (error) {
    showToast(getErrorMessage(error))
  }
}

const saveTargetProfileData = async (targetDraft) => {
  try {
    const targetProfile = await saveTargetProfile(targetDraft)

    upsertTargetProfile(targetProfile)
    activeTargetProfileId.value = targetProfile.id
    await loadImportantRecords(targetProfile.id)
    showToast('目标信息已保存')
  } catch (error) {
    showToast(getErrorMessage(error))
  }
}

const saveImportantRecord = async (recordDraft) => {
  const normalizedRecord = normalizeImportantRecordDraft(recordDraft)

  if (!normalizedRecord.title) {
    showToast('请填写标题')
    return
  }

  if (!normalizedRecord.eventDescription) {
    showToast('请填写事件描述')
    return
  }

  if (!activeTargetProfile.value?.id) {
    showToast('请先保存目标信息')
    return
  }

  const payload = {
    ...normalizedRecord,
    targetProfileId: activeTargetProfile.value.id,
  }
  const existingRecord = importantRecords.value.find((record) => record.id === normalizedRecord.id)

  try {
    const savedRecord = existingRecord
      ? await updateImportantRecord(existingRecord.id, payload)
      : await createImportantRecord(payload)

    upsertImportantRecord(savedRecord)
    activeImportantRecordId.value = savedRecord.id
    activeFeatureKey.value = 'important-record-detail'
    currentScreen.value = 'feature'
    showToast(existingRecord ? '记录已更新' : '记录已添加')
  } catch (error) {
    showToast(getErrorMessage(error))
  }
}

const deleteImportantRecord = async (recordId) => {
  const targetRecordId = recordId || activeImportantRecordId.value

  if (!targetRecordId) return

  try {
    await removeImportantRecord(targetRecordId)
    importantRecords.value = importantRecords.value.filter((record) => record.id !== targetRecordId)

    if (activeImportantRecordId.value === targetRecordId) {
      activeImportantRecordId.value = ''
    }

    activeFeatureKey.value = ''
    currentScreen.value = 'home'
    showToast('记录已删除')
  } catch (error) {
    showToast(getErrorMessage(error))
  }
}
const createChatRecord = (initialMessage = '') => {
  const nextIndex = chatRecords.value.length + 1
  const chat = {
    id: `local-chat-${Date.now()}-${nextIndex}`,
    title: initialMessage ? initialMessage.slice(0, 20) : `新对话 ${nextIndex}`,
    preview: initialMessage || '还没有消息，开始新的关系分析。',
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

const ensureChatRecord = (chatRecord) => {
  const chatId = normalizeChatId(chatRecord?.id)

  if (!chatId) {
    return null
  }

  const cachedChat = chatRecords.value.find((item) => item.id === chatId)

  if (cachedChat) {
    return cachedChat
  }

  const nextChat = {
    ...chatRecord,
    id: chatId,
    messages: [...(chatRecord.messages || [])],
  }

  chatRecords.value.unshift(nextChat)
  return nextChat
}

const openChatRecord = async (chatTarget) => {
  stopGenerating()
  const chatId = normalizeChatId(chatTarget)
  const chat = typeof chatTarget === 'object'
    ? ensureChatRecord(chatTarget)
    : chatRecords.value.find((item) => item.id === chatId)

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

const stopGenerating = () => {
  activeStreamController?.abort()
}

const retryMessage = async (message) => {
  const messageIndex = currentChatMessages.value.findIndex((item) => item.id === message.id)
  const userMessage = currentChatMessages.value.slice(0, messageIndex).reverse().find((item) => item.role === 'user')
  if (!userMessage) return

  if (message.retryMode === 'resume') {
    currentChatMessages.value = currentChatMessages.value.filter((item) => item.id !== message.id)
    await handleSendMessage(userMessage.content, {
      idempotencyKey: userMessage.requestId,
      existingUserMessage: userMessage,
    })
    return
  }

  await handleSendMessage(userMessage.content)
}

const handleSendMessage = async (question, retryOptions = {}) => {
  const trimmedQuestion = String(question || '').trim()

  if (!trimmedQuestion || isSendingMessage.value) return

  stopVoiceListening()
  completeIntroTextStream()

  const chat = activeChat.value || createChatRecord(trimmedQuestion)
  const conversationId = isRemoteChatId(chat.id) ? chat.id : null
  const timestamp = Date.now()
  const previousUserMessage = [...currentChatMessages.value].reverse().find((message) => message.role === 'user')
  const userMessage = retryOptions.existingUserMessage || createTimedUserMessage({
    chatId: chat.id,
    content: trimmedQuestion,
    sentAt: timestamp,
    previousUserMessage,
  })
  userMessage.requestId = retryOptions.idempotencyKey || userMessage.requestId || createClientRequestId()
  const aiMessage = {
    id: `${chat.id}-ai-${timestamp}`,
    role: 'ai',
    content: '',
    status: 'streaming',
  }

  chatErrorMessage.value = ''
  currentChatId.value = chat.id
  currentChatMessages.value = retryOptions.existingUserMessage
    ? [...currentChatMessages.value, aiMessage]
    : [...currentChatMessages.value, userMessage, aiMessage]
  syncCurrentChatRecord({
    preview: trimmedQuestion,
    time: '刚刚',
  })

  let streamCompleted = false
  let streamError = ''
  let finalAssistantContent = ''
  isSendingMessage.value = true
  activeStreamController = new AbortController()

  try {
    await streamChatMessage({
      conversationId,
      message: trimmedQuestion,
      idempotencyKey: userMessage.requestId,
      signal: activeStreamController.signal,
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
        finalAssistantContent = ''
        updateCurrentMessage(aiMessage.id, (message) => ({
          ...message,
          id: payload.assistant_message_id || payload.assistantMessageId || message.id,
          content: payload.content || message.content,
          status: 'done',
          references: payload.references || payload.citations || [],
          usage: payload.usage || null,
          model: payload.model_name || payload.modelName || '',
          provider: payload.provider || '',
          providerRequestId: payload.provider_request_id || payload.providerRequestId || '',
        }))
        const currentAiMessage = currentChatMessages.value.find((message) => (
          message.id === (payload.assistant_message_id || payload.assistantMessageId || aiMessage.id)
        ))
        finalAssistantContent = currentAiMessage?.content || payload.content || ''
        replaceCurrentChatId(nextConversationId)
      },
      onError: (payload) => {
        const message = payload?.detail || payload?.message || 'AI 服务异常'
        streamError = message
        updateCurrentMessage(aiMessage.id, (currentMessage) => ({
          ...currentMessage,
          content: message,
          status: 'error',
          retryable: Boolean(payload?.retryable),
          errorCode: payload?.code || '',
          retryMode: 'new-turn',
        }))
      },
    })

    if (streamError) {
      throw new Error(streamError)
    }

    if (streamCompleted) {
      await speakAssistantReply(finalAssistantContent)
      await loadConversationList()
    }
  } catch (error) {
    const message = getErrorMessage(error)
    const wasCancelled = error?.name === 'AbortError'
    chatErrorMessage.value = wasCancelled ? '' : message
    updateCurrentMessage(aiMessage.id, (currentMessage) => ({
      ...currentMessage,
      content: currentMessage.content || (wasCancelled ? '已停止生成' : message),
      status: wasCancelled ? 'cancelled' : 'error',
      retryMode: wasCancelled || streamError || error?.status >= 500 ? 'new-turn' : 'resume',
    }))
    if (!wasCancelled) showToast(message)
  } finally {
    activeStreamController = null
    isSendingMessage.value = false
    if (canAutoListen()) startVoiceListening()
  }
}

const backToHome = () => {
  stopGenerating()
  resetHomeUiState()
  completeIntroTextStream()
  currentScreen.value = 'home'
  startLiveClock()
  if (canAutoListen()) startVoiceListening()
}

const backToLogin = () => {
  stopGenerating()
  stopVoiceListening()
  speaker.stop()
  stopLiveClock()
  resetHomeUiState()
  resetIntroTextStream()
  currentScreen.value = 'login'
}

onShow(() => {
  appInForeground.value = true
  if (currentScreen.value === 'home') startLiveClock()
  voiceEnabled.value = voiceRecognition.getAutoListeningEnabled()
  voiceSupported.value = voiceRecognition.isSupported()
  if (voiceEnabled.value) startVoiceListening()
})

onHide(() => {
  appInForeground.value = false
  stopGenerating()
  stopLiveClock()
  stopVoiceListening()
  speaker.stop()
})

onBackPress(() => {
  if (menuOpen.value) {
    closeMenu()
    return true
  }

  if (currentScreen.value === 'feature' || currentScreen.value === 'settings') {
    backToHome()
    return true
  }

  if (currentScreen.value === 'home' && (currentChatId.value || isChatting.value)) {
    backToHome()
    return true
  }

  return false
})

onBeforeUnmount(() => {
  stopGenerating()
  clearIntroStreamTimers()
  stopLiveClock()
  stopVoiceListening()
  speaker.destroy()
})
</script>

<template>
  <view class="app-shell">
    <LoginScreen v-if="currentScreen === 'login'" @success="handleLoginSuccess" />

    <HomeFeatureScreen
      v-else-if="currentScreen === 'feature'"
      :feature-key="activeFeatureKey"
      :active-chat="activeChat"
      :active-important-record="activeImportantRecord"
      :personal-profile="personalProfile"
      :active-target-profile="activeTargetProfile"
      :target-profiles="targetProfiles"
      :current-chat-messages="currentChatMessages"
      @back="backToHome"
      @save-personal-profile="savePersonalProfileData"
      @save-target-profile="saveTargetProfileData"
      @select-target-profile="selectTargetProfile"
      @new-target-profile="startNewTargetProfile"
      @save-important-record="saveImportantRecord"
      @edit-important-record="openImportantRecordEdit"
      @delete-important-record="deleteImportantRecord"
      @send="handleSendMessage"
    />

    <SettingsScreen
      v-else-if="currentScreen === 'settings'"
      :initial-user-profile="currentUserProfile"
      @back="backToHome"
      @logout="backToLogin"
      @open-chat="openChatRecord"
      @profile-updated="handleProfileUpdated"
    />

    <view v-else class="page-shell">
      <view class="page" :class="{ 'page--menu-open': menuOpen }">
        <HomeStatusBar />
        <HomeHeader
          :show-hero="!isChatting"
          :hero-title-parts="streamedHeroTitleParts"
          :speaker-enabled="speakerEnabled"
          @menu="openMenu"
          @speaker-toggle="toggleSpeaker"
        />

        <view v-if="chatErrorMessage" class="chat-error-banner">
          <text>{{ chatErrorMessage }}</text>
        </view>

        <view v-if="isChatting" class="home-chat-thread">
          <view
            v-for="message in currentChatMessages"
            :key="message.id"
            class="home-chat-item"
          >
            <text v-if="message.showTime" class="timeline timeline--chat">{{ message.timeLabel }}</text>
            <view
              class="home-chat-message"
            :class="{
              'home-chat-message--user': message.role === 'user',
              'home-chat-message--ai': message.role === 'ai',
              'home-chat-message--error': message.status === 'error',
            }"
          >
            <rich-text
              v-if="message.role === 'ai'"
              class="home-chat-message__content home-chat-message__content--rich"
              :nodes="getMessageRichTextNodes(message)"
            />
            <text v-else class="home-chat-message__content">{{ message.content || '正在分析...' }}</text>
            <view v-if="message.role === 'ai' && message.references?.length" class="message-references">
              <view
                v-for="(source, sourceIndex) in message.references"
                :key="source.key || source.document_id || source.id || sourceIndex"
                class="message-reference"
                @tap="openReference(source)"
              >
                <text>{{ sourceLabel(source, sourceIndex) }}</text>
              </view>
            </view>
            <view v-if="message.role === 'ai' && (message.status === 'error' || message.status === 'cancelled')" class="message-actions">
              <text @tap="retryMessage(message)">{{ message.retryMode === 'resume' ? '继续接收' : '重新生成' }}</text>
            </view>
            </view>
          </view>
        </view>

        <view v-else class="home-intro-content">
          <view v-if="isLoadingConversations" class="chat-loading">
            <text>正在同步历史对话...</text>
          </view>

          <HomeTopics :topics="hotTopics" @select="handleSendMessage" />

          <text class="timeline">{{ liveTimelineText }}</text>

          <HomeChatCard
            v-if="shouldShowHomeChatBubble"
            :message-lines="streamedMessageLines"
          />
        </view>
        <HomeComposer
          :voice-listening="voiceListening"
          :voice-enabled="voiceEnabled"
          :voice-supported="voiceSupported"
          :voice-status-text="voiceStatusText"
          @send="handleSendMessage"
          @voice-enable-requested="enableVoiceInput"
          @voice-disable-requested="disableVoiceInput"
        />
        <view v-if="isSendingMessage" class="stop-generation" @tap="stopGenerating">
          <text>停止生成</text>
        </view>
      </view>

      <HomeSideDrawer
        :open="menuOpen"
        :profile="displaySidebarProfile"
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 247, 249, 0.98) 100%);
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

.home-chat-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
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
  background: linear-gradient(180deg, var(--primary-hover) 0%, var(--primary) 100%);
  box-shadow: 0 8rpx 0 0 var(--shadow-btn);
}

.home-chat-message--ai {
  align-self: flex-start;
  border-bottom-left-radius: 10rpx;
  background: var(--panel-bg);
}

.home-chat-message--error {
  border-color: rgba(255, 45, 56, 0.2);
  background: #fff2f3;
}

.message-references {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.message-reference,
.message-actions text {
  color: var(--primary-active);
  font-size: 12px;
  line-height: 1.35;
}

.message-reference {
  max-width: 100%;
  padding: 6rpx 10rpx;
  border: 1rpx solid rgba(10, 124, 255, 0.24);
  border-radius: 6rpx;
  background: rgba(10, 124, 255, 0.05);
}

.message-actions {
  margin-top: 12rpx;
}

.stop-generation {
  position: fixed;
  right: 26rpx;
  bottom: 104rpx;
  z-index: 3;
  padding: 12rpx 18rpx;
  border: 1rpx solid rgba(255, 91, 91, 0.35);
  border-radius: 6rpx;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.stop-generation text {
  color: var(--error);
  font-size: 13px;
  font-weight: 700;
}

.home-chat-message__content {
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.48;
}

.home-chat-message__content--rich {
  display: block;
  width: 100%;
}

.home-chat-message__content--rich :deep(.markdown-heading) {
  display: block;
  margin: 0 0 12rpx;
  color: var(--text);
  font-size: 16px;
  font-weight: 900;
  line-height: 1.32;
}

.home-chat-message__content--rich :deep(.markdown-paragraph) {
  display: block;
  margin: 0 0 12rpx;
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.56;
}

.home-chat-message__content--rich :deep(.markdown-list) {
  display: block;
  margin: 4rpx 0 12rpx;
  padding-left: 30rpx;
  color: var(--text-body);
  font-size: 15px;
  line-height: 1.54;
}

.home-chat-message__content--rich :deep(.markdown-list-item) {
  display: list-item;
  margin-top: 8rpx;
}

.home-chat-message__content--rich :deep(.markdown-strong) {
  font-weight: 900;
}

.home-chat-message__content--rich :deep(.markdown-emphasis) {
  font-style: italic;
}

.home-chat-message__content--rich :deep(.markdown-code) {
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  background: rgba(17, 24, 39, 0.06);
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}

.home-chat-message__content--rich :deep(.markdown-citation) {
  display: inline-block;
  margin: 0 4rpx;
  padding: 0 6rpx;
  border-radius: 4rpx;
  background: rgba(10, 124, 255, 0.1);
  color: var(--primary-active);
  font-size: 12px;
  font-weight: 800;
}

.home-chat-message__content--rich :deep(.markdown-paragraph:last-child),
.home-chat-message__content--rich :deep(.markdown-heading:last-child),
.home-chat-message__content--rich :deep(.markdown-list:last-child) {
  margin-bottom: 0;
}

.home-chat-message--user .home-chat-message__content {
  color: #ffffff;
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

.timeline--chat {
  margin-top: 0;
}
</style>
