<script setup>
import { computed, ref, watch } from 'vue'
import HomeComposer from './HomeComposer.vue'
import HomeStatusBar from './HomeStatusBar.vue'
import KnowledgeLibraryScreen from './KnowledgeLibraryScreen.vue'
import { renderMarkdownNodes } from '../../common/markdown-render.mjs'

const props = defineProps({
  featureKey: {
    type: String,
    default: '',
  },
  activeChat: {
    type: Object,
    default: null,
  },
  activeImportantRecord: {
    type: Object,
    default: null,
  },
  personalProfile: {
    type: Object,
    default: null,
  },
  activeTargetProfile: {
    type: Object,
    default: null,
  },
  targetProfiles: {
    type: Array,
    default: () => [],
  },
  currentChatMessages: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['back', 'send', 'save-personal-profile', 'save-target-profile', 'select-target-profile', 'new-target-profile', 'save-important-record', 'edit-important-record', 'delete-important-record'])

const featureMap = {
  personal: {
    title: '个人信息',
    kicker: '定制军师画像',
    summary: '这些资料会帮助情感军师判断你的表达方式、关系需求和安全感来源，让建议更贴近你的真实处境。',
    tone: 'blue',
    stats: [
      { label: '画像完成度', value: '48%' },
      { label: '待补字段', value: '5' },
    ],
    actions: ['保存个人信息', '更新性格标签', '生成沟通画像'],
  },
  target: {
    title: '目标信息',
    kicker: 'TA 的关系画像',
    summary: '把对方的基础资料、互动节奏和你想达成的关系目标写清楚，军师才能判断该推进、试探、暂停还是复盘。',
    tone: 'purple',
    stats: [
      { label: '画像完成度', value: '35%' },
      { label: '待补字段', value: '8' },
    ],
    actions: ['保存目标信息', '补充互动线索', '生成关系策略'],
  },
  'important-records': {
    title: '重要记录',
    kicker: '关键关系节点',
    summary: '把冲突、误会、关系转折点等重要片段沉淀下来，形成你的专属关系时间线。',
    tone: 'rose',
    stats: [
      { label: '本周新增', value: '0' },
      { label: '待分析', value: '0' },
    ],
    actions: ['新增记录', '导入聊天截图', '生成阶段复盘'],
  },
  'important-record-create': {
    title: '新增记录',
    kicker: '保存一个关键瞬间',
    summary: '把这次事件的时间、过程和你的在意点记录下来，之后回看时就能更快抓住关系里反复出现的模式。',
    tone: 'rose',
    stats: [],
    actions: [],
  },
  'important-record-detail': {
    title: '记录详情',
    kicker: '查看这个关键节点',
    summary: '回顾这条记录的完整内容，判断这件事在关系中的真正意义，并随时继续修改。',
    tone: 'rose',
    stats: [],
    actions: [],
  },
  'important-record-edit': {
    title: '编辑记录',
    kicker: '更新你的判断',
    summary: '如果你对这次事件有了新的理解，可以直接修改并覆盖旧记录，保持重要节点始终准确。',
    tone: 'rose',
    stats: [],
    actions: [],
  },
  'chat-records': {
    title: '对话记录',
    kicker: '军师聊天历史',
    summary: '查看你与情感军师的咨询记录，回顾建议、行动计划和每次关系判断的依据。',
    tone: 'green',
    stats: [
      { label: '历史对话', value: '0' },
      { label: '行动计划', value: '0' },
    ],
    actions: ['查看最近咨询', '筛选关系主题', '整理行动清单'],
  },
  'chat-detail': {
    title: '对话',
    kicker: '与 AI 的聊天记录',
    summary: '继续这次对话，或回看你与 AI 已经聊过的内容。',
    tone: 'green',
    stats: [],
    actions: [],
  },
}

const fallbackFeature = {
  title: '功能页',
  kicker: '情感军师',
  summary: '这里会展示该模块的定制内容。',
  tone: 'blue',
  stats: [
    { label: '状态', value: '待完善' },
    { label: '进度', value: '0%' },
  ],
  actions: ['完善信息', '开始分析', '返回首页'],
}

const personalProfileFields = [
  {
    key: 'age',
    label: '年龄',
    value: '',
    placeholder: '例如 26',
    type: 'number',
    required: true,
  },
  {
    key: 'gender',
    label: '性别',
    value: '',
    placeholder: '男 / 女 / 不方便透露',
    type: 'text',
    required: true,
  },
  {
    key: 'mbti',
    label: 'MBTI人格',
    value: '',
    placeholder: '例如 INFP',
    type: 'text',
    required: true,
  },
]

const personalProfileNotes = [
  {
    key: 'relationshipStatus',
    label: '关系说明',
    placeholder: '说明你们当前的关系阶段，例如初识、朋友、同事、恋人、疏远后复联等。',
  },
  {
    key: 'personalitySummary',
    label: '对自己性格的简单评价',
    placeholder: '简单描述你的性格、沟通习惯、安全感来源，或你在关系里最容易卡住的地方。',
  },
]

const targetProfileFields = [
  {
    key: 'name',
    label: '对方称呼',
    value: '',
    placeholder: '例如 小林 / 前任 / 相亲对象',
    type: 'text',
  },
  {
    key: 'age',
    label: '对方年龄',
    value: '',
    placeholder: '例如 28',
    type: 'number',
  },
  {
    key: 'gender',
    label: '对方性别',
    value: '',
    placeholder: '男 / 女 / 不确定',
    type: 'text',
  },
  {
    key: 'mbti',
    label: 'MBTI人格',
    value: '',
    placeholder: '例如 INFJ',
    type: 'text',
  },
  {
    key: 'currentRelationship',
    label: '当前关系',
    value: '',
    placeholder: '相识 / 朋友 / 同事 / 恋人 / 已疏远',
    type: 'text',
  },
  {
    key: 'interactionFrequency',
    label: '互动频率',
    value: '',
    placeholder: '每天 / 偶尔 / 已冷淡',
    type: 'text',
  },
  {
    key: 'relationshipGoal',
    label: '关系目标',
    value: '',
    placeholder: '拉近关系 / 化解矛盾 / 重建连接',
    type: 'text',
  },
]

const targetProfileNotes = [
  {
    key: 'personalityTraits',
    label: '对方性格描述',
    placeholder: '描述 TA 的表达习惯、情绪模式、在相处中的靠近或回避倾向。',
  },
]

const createPersonalProfileForm = (profile = null) => ({
  age: profile?.age || '',
  gender: profile?.gender || '',
  mbti: profile?.mbti || '',
  relationshipStatus: profile?.relationshipStatus || '',
  personalitySummary: profile?.personalitySummary || '',
})

const createTargetProfileForm = (target = null) => ({
  id: target?.id || '',
  name: target?.name || '',
  age: target?.age || '',
  gender: target?.gender || '',
  mbti: target?.mbti || '',
  currentRelationship: target?.currentRelationship || '',
  interactionFrequency: target?.interactionFrequency || '',
  relationshipGoal: target?.relationshipGoal || '',
  personalityTraits: target?.personalityTraits || '',
})

const recordSatisfactionOptions = ['满意', '一般', '不满意', '还没解决']

const createRecordForm = (record = null) => ({
  id: record?.id || '',
  title: record?.title || '',
  recordTime: record?.recordTime || new Date().toISOString().slice(0, 10),
  eventDescription: record?.eventDescription || '',
  resolution: record?.resolution || '',
  concernPoint: record?.concernPoint || '',
  satisfaction: record?.satisfaction || recordSatisfactionOptions[0],
})

const personalProfileForm = ref(createPersonalProfileForm())
const targetProfileForm = ref(createTargetProfileForm())
const recordForm = ref(createRecordForm())

const feature = computed(() => featureMap[props.featureKey] || fallbackFeature)
const isImportantRecordDetail = computed(() => props.featureKey === 'important-record-detail')
const isImportantRecordEditor = computed(() => [
  'important-record-create',
  'important-record-edit',
].includes(props.featureKey))
const featureTitle = computed(() => {
  if (props.featureKey === 'chat-detail') {
    return props.activeChat?.title || feature.value.title
  }

  if (['important-record-detail', 'important-record-edit'].includes(props.featureKey)) {
    return props.activeImportantRecord?.title || feature.value.title
  }

  return feature.value.title
})
const chatDetailMessages = computed(() => (
  props.currentChatMessages.length > 0
    ? props.currentChatMessages
    : props.activeChat?.messages || []
))
const personalProfileSaveText = computed(() => (
  props.personalProfile?.id ? '修改资料' : '保存资料'
))
const targetProfileSaveText = computed(() => (
  props.activeTargetProfile?.id ? '修改目标信息' : '保存目标信息'
))
const usesGenericFeatureLayout = computed(() => ![
  'personal',
  'target',
  'important-record-create',
  'important-record-detail',
  'important-record-edit',
  'chat-detail',
].includes(props.featureKey))

const recordDetailFields = computed(() => ([
  {
    label: '事件描述',
    value: props.activeImportantRecord?.eventDescription || '暂无内容',
  },
  {
    label: '矛盾解决方式',
    value: props.activeImportantRecord?.resolution || '暂无内容',
  },
  {
    label: '你在意的点',
    value: props.activeImportantRecord?.concernPoint || '暂无内容',
  },
]))

watch(
  [() => props.featureKey, () => props.activeImportantRecord],
  ([featureKey, activeImportantRecord]) => {
    if (featureKey === 'important-record-edit') {
      recordForm.value = createRecordForm(activeImportantRecord)
      return
    }

    if (featureKey === 'important-record-create') {
      recordForm.value = createRecordForm()
    }
  },
  { immediate: true },
)

watch(
  () => props.personalProfile,
  (personalProfile) => {
    personalProfileForm.value = createPersonalProfileForm(personalProfile)
  },
  { immediate: true },
)

watch(
  () => props.activeTargetProfile,
  (activeTargetProfile) => {
    targetProfileForm.value = createTargetProfileForm(activeTargetProfile)
  },
  { immediate: true },
)

const handleRecordDateChange = (event) => {
  recordForm.value.recordTime = event?.detail?.value || recordForm.value.recordTime
}

const selectRecordSatisfaction = (option) => {
  recordForm.value.satisfaction = option
}

const submitImportantRecord = () => {
  emit('save-important-record', {
    ...recordForm.value,
  })
}

const submitPersonalProfile = () => {
  const age = Number(personalProfileForm.value.age || 0)

  if (!age) {
    uni.showToast({ title: '请填写年龄', icon: 'none' })
    return
  }

  if (!String(personalProfileForm.value.gender || '').trim()) {
    uni.showToast({ title: '请填写性别', icon: 'none' })
    return
  }

  if (!String(personalProfileForm.value.mbti || '').trim()) {
    uni.showToast({ title: '请填写MBTI人格', icon: 'none' })
    return
  }

  emit('save-personal-profile', {
    ...personalProfileForm.value,
    age,
  })
}

const submitTargetProfile = () => {
  const age = Number(targetProfileForm.value.age || 0)

  if (!age) {
    uni.showToast({ title: '请填写目标年龄', icon: 'none' })
    return
  }

  if (!String(targetProfileForm.value.gender || '').trim()) {
    uni.showToast({ title: '请填写目标性别', icon: 'none' })
    return
  }

  if (!String(targetProfileForm.value.mbti || '').trim()) {
    uni.showToast({ title: '请填写目标MBTI人格', icon: 'none' })
    return
  }

  emit('save-target-profile', {
    ...targetProfileForm.value,
    age,
  })
}

const getMessageRichTextNodes = (message) => renderMarkdownNodes(message.content || '正在分析...')
const sourceLabel = (source, index) => source.key || source.title || `来源 ${index + 1}`
const openReference = (source) => {
  if (typeof uni === 'undefined' || !uni.showModal) return
  uni.showModal({
    title: source.title || source.key || '引用来源',
    content: source.snippet || source.source || '暂无可展示的原文片段',
    showCancel: false,
  })
}
</script>

<template>
  <KnowledgeLibraryScreen v-if="featureKey === 'knowledge'" @back="emit('back')" />
  <view v-else class="feature-page" :class="`feature-page--${feature.tone}`">
    <HomeStatusBar />

    <view class="feature-top">
      <view class="back-button" hover-class="back-button--active" @tap="emit('back')">
        <view class="back-button__line back-button__line--top"></view>
        <view class="back-button__line back-button__line--bottom"></view>
      </view>
      <text class="feature-top__title">{{ featureTitle }}</text>
      <view class="feature-top__ghost"></view>
    </view>

    <view v-if="featureKey === 'personal'" class="personal-profile">
      <view class="profile-summary">
        <view class="profile-copy">
          <text class="profile-copy__title">先让军师认识你</text>
          <text class="profile-copy__body">{{ feature.summary }}</text>
        </view>
      </view>

      <view class="profile-section">
        <view class="profile-section__heading">
          <text class="profile-section__title">基础资料</text>
          <text class="profile-section__hint">用于建立初始判断</text>
        </view>

        <view class="profile-grid">
          <view v-for="field in personalProfileFields" :key="field.label" class="profile-field">
            <text class="profile-field__label">
              {{ field.label }}
              <text v-if="field.required" class="profile-field__required">*</text>
            </text>
            <input
              v-model="personalProfileForm[field.key]"
              class="profile-field__input"
              :type="field.type"
              :placeholder="field.placeholder"
              placeholder-class="profile-placeholder"
            />
          </view>
          <view class="profile-field profile-field--summary">
            <text class="profile-field__label">
              对个人的评价
              <text class="profile-field__optional">选填</text>
            </text>
            <textarea
              v-model="personalProfileForm.personalitySummary"
              class="profile-textarea profile-textarea--summary"
              maxlength="-1"
              placeholder="简单描述你的性格、沟通习惯、安全感来源，或你在关系里最容易卡住的地方。"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>
        </view>
      </view>
      <view class="profile-save" hover-class="profile-save--active" @tap="submitPersonalProfile">
        <text>{{ personalProfileSaveText }}</text>
      </view>
    </view>

    <view v-else-if="featureKey === 'target'" class="target-profile">
      <view class="target-summary">
        <view class="target-copy">
          <text class="target-copy__title">先定义你想靠近的 TA</text>
          <text class="target-copy__body">{{ feature.summary }}</text>
        </view>
      </view>

      <view class="target-profile-switcher">
        <view class="profile-section__heading">
          <text class="profile-section__title">目标对象</text>
          <text class="profile-section__hint">切换对象后记录会分别保存</text>
        </view>

        <view class="target-profile-list">
          <view
            v-for="target in targetProfiles"
            :key="target.id"
            class="target-profile-card"
            :class="{ 'target-profile-card--active': target.id === activeTargetProfile?.id }"
            hover-class="target-profile-card--tap"
            @tap="emit('select-target-profile', target.id)"
          >
            <text class="target-profile-card__name">{{ target.name || '未命名目标' }}</text>
            <text class="target-profile-card__meta">{{ target.mbti || 'MBTI未填' }}</text>
          </view>

          <view
            class="target-profile-card target-profile-card--new"
            hover-class="target-profile-card--tap"
            @tap="emit('new-target-profile')"
          >
            <text class="target-profile-card__name">新增目标对象</text>
            <text class="target-profile-card__meta">创建独立记录</text>
          </view>
        </view>
      </view>

      <view class="target-section">
        <view class="profile-section__heading">
          <text class="profile-section__title">对方基础信息</text>
          <text class="profile-section__hint">用于建立关系画像</text>
        </view>

        <view class="target-grid">
          <view
            v-for="field in targetProfileFields"
            :key="field.label"
            class="target-field"
            :class="{ 'target-field--half': ['interactionFrequency', 'relationshipGoal'].includes(field.key) }"
          >
            <text class="profile-field__label">{{ field.label }}</text>
            <input
              v-model="targetProfileForm[field.key]"
              class="profile-field__input"
              :type="field.type"
              :placeholder="field.placeholder"
              placeholder-class="profile-placeholder"
            />
          </view>
        </view>
      </view>

      <view class="target-section target-section--notes">
        <view class="profile-section__heading">
          <text class="profile-section__title">互动线索</text>
          <text class="profile-section__hint">判断推进方式</text>
        </view>

        <view class="target-note-list">
          <view v-for="note in targetProfileNotes" :key="note.label" class="target-note">
            <text class="profile-field__label">{{ note.label }}</text>
            <textarea
              v-model="targetProfileForm[note.key]"
              class="target-textarea"
              maxlength="-1"
              :placeholder="note.placeholder"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>
        </view>
      </view>

      <view class="target-save" hover-class="target-save--active" @tap="submitTargetProfile">
        <text>{{ targetProfileSaveText }}</text>
      </view>
    </view>

    <view v-else-if="isImportantRecordEditor" class="record-create">
      <view class="record-summary">
        <view class="record-summary__copy">
          <text class="record-summary__title">{{ featureKey === 'important-record-edit' ? '把新的理解补进去' : '先把这件事讲完整' }}</text>
          <text class="record-summary__body">{{ feature.summary }}</text>
        </view>
      </view>

      <view class="record-section">
        <view class="profile-section__heading">
          <text class="profile-section__title">记录信息</text>
          <text class="profile-section__hint">标题和时间会在侧边栏摘要中展示</text>
        </view>

        <view class="record-form">
          <view class="record-field">
            <text class="profile-field__label">标题</text>
            <input
              v-model="recordForm.title"
              class="profile-field__input"
              type="text"
              placeholder="例如 深夜争吵后的第一次和解"
              placeholder-class="profile-placeholder"
            />
          </view>

          <view class="record-field">
            <text class="profile-field__label">记录时间</text>
            <picker mode="date" :value="recordForm.recordTime" @change="handleRecordDateChange">
              <view class="record-date-picker">{{ recordForm.recordTime }}</view>
            </picker>
          </view>

          <view class="record-field record-field--emphasis">
            <text class="profile-field__label">事件描述</text>
            <textarea
              v-model="recordForm.eventDescription"
              class="record-textarea record-textarea--large"
              placeholder="写下这件事发生的背景、过程、对方说了什么、你做了什么，越具体越方便之后复盘。"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>

          <view class="record-field">
            <text class="profile-field__label">矛盾解决方式</text>
            <textarea
              v-model="recordForm.resolution"
              class="record-textarea"
              placeholder="例如当场沟通、冷处理、道歉、暂时搁置、朋友介入，或者目前还没有解决。"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>

          <view class="record-field">
            <text class="profile-field__label">你在这件事情上在意的点</text>
            <textarea
              v-model="recordForm.concernPoint"
              class="record-textarea"
              placeholder="例如被忽视、被误解、承诺没有兑现、边界被冒犯，或你真正希望对方看见的部分。"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>

          <view class="record-field record-field--satisfaction">
            <text class="profile-field__label">解决方式是否满意</text>
            <view class="record-satisfaction">
              <view
                v-for="option in recordSatisfactionOptions"
                :key="option"
                class="record-satisfaction__option"
                :class="{ 'record-satisfaction__option--selected': recordForm.satisfaction === option }"
                hover-class="record-satisfaction__option--active"
                @tap="selectRecordSatisfaction(option)"
              >
                <text>{{ option }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="record-save" hover-class="record-save--active" @tap="submitImportantRecord">
        <text>{{ featureKey === 'important-record-edit' ? '保存修改' : '保存记录' }}</text>
      </view>
    </view>

    <view v-else-if="isImportantRecordDetail" class="record-detail">
      <view v-if="activeImportantRecord" class="record-detail-card">
        <view class="record-detail-hero">
          <text class="record-detail-hero__kicker">{{ feature.kicker }}</text>
          <text class="record-detail-hero__title">{{ activeImportantRecord.title }}</text>
          <view class="record-detail-meta">
            <text class="record-detail-meta__item">记录时间 {{ activeImportantRecord.recordTime }}</text>
            <text class="record-detail-meta__item">最后更新 {{ activeImportantRecord.updatedAt }}</text>
          </view>
        </view>

        <view class="record-detail-section" v-for="field in recordDetailFields" :key="field.label">
          <text class="record-detail-section__label">{{ field.label }}</text>
          <text class="record-detail-section__value">{{ field.value }}</text>
        </view>

        <view class="record-detail-section">
          <text class="record-detail-section__label">满意度</text>
          <view class="record-detail-badge">
            <text>{{ activeImportantRecord.satisfaction }}</text>
          </view>
        </view>

        <view class="record-detail-actions">
          <view class="record-detail-action record-detail-action--edit" hover-class="record-detail-action--active" @tap="emit('edit-important-record', activeImportantRecord.id)">
            <text>编辑记录</text>
          </view>
          <view class="record-detail-action record-detail-action--delete" hover-class="record-detail-action--active" @tap="emit('delete-important-record', activeImportantRecord.id)">
            <text>删除记录</text>
          </view>
        </view>
      </view>

      <view v-else class="record-detail-empty">
        <text class="record-detail-empty__title">暂时找不到这条记录</text>
        <text class="record-detail-empty__body">可以先返回首页，再从侧边栏的重要记录列表重新进入。</text>
      </view>
    </view>

    <view v-else-if="featureKey === 'chat-detail'" class="chat-detail">
      <view v-if="chatDetailMessages.length" class="chat-history">
        <view
          v-for="message in chatDetailMessages"
          :key="message.id"
          class="chat-message"
          :class="{
            'chat-message--user': message.role === 'user',
            'chat-message--ai': message.role === 'ai',
            'chat-message--error': message.status === 'error',
          }"
        >
          <rich-text
            v-if="message.role === 'ai'"
            class="chat-message__content chat-message__content--rich"
            :nodes="getMessageRichTextNodes(message)"
          />
          <text v-else class="chat-message__content">{{ message.content || '正在分析...' }}</text>
          <view v-if="message.role === 'ai' && message.references?.length" class="chat-message__references">
            <text
              v-for="(source, sourceIndex) in message.references"
              :key="source.key || source.document_id || sourceIndex"
              @tap="openReference(source)"
            >{{ sourceLabel(source, sourceIndex) }}</text>
          </view>
        </view>
      </view>

      <HomeComposer @send="emit('send', $event)" />
    </view>

    <view v-else class="feature-hero">
      <view class="feature-mark">
        <view class="feature-mark__orb"></view>
        <view class="feature-mark__spark feature-mark__spark--one"></view>
        <view class="feature-mark__spark feature-mark__spark--two"></view>
      </view>
      <text class="feature-kicker">{{ feature.kicker }}</text>
      <text class="feature-title">{{ feature.title }}</text>
      <text class="feature-summary">{{ feature.summary }}</text>
    </view>

    <view v-if="usesGenericFeatureLayout" class="stats-row">
      <view v-for="stat in feature.stats" :key="stat.label" class="stat-tile">
        <text class="stat-value">{{ stat.value }}</text>
        <text class="stat-label">{{ stat.label }}</text>
      </view>
    </view>

    <view v-if="usesGenericFeatureLayout" class="action-section">
      <text class="section-title">下一步</text>
      <view class="action-list">
        <view v-for="action in feature.actions" :key="action" class="action-row" hover-class="action-row--active">
          <view class="action-dot"></view>
          <text class="action-text">{{ action }}</text>
          <text class="action-arrow">›</text>
        </view>
      </view>
    </view>

    <view v-if="usesGenericFeatureLayout" class="empty-note">
      <text>当前模块还没有真实数据，先保留入口与页面结构，后续接入你的定制算法后可直接填充分析结果。</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.feature-page {
  min-height: 100vh;
  padding: 38rpx 28rpx 48rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f6f7f9 48%, #eef1f5 100%);
}

.feature-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 26rpx;
}

.back-button,
.feature-top__ghost {
  width: 58rpx;
  height: 58rpx;
}

.back-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.94);
  overflow: visible;
}

.back-button--active,
.action-row--active {
  opacity: 0.78;
  transform: scale(0.99);
}

.back-button__line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: var(--text);
  transform-origin: left center;
}

.back-button__line--top {
  transform: translateX(-9rpx) rotate(-42deg);
}

.back-button__line--bottom {
  transform: translateX(-9rpx) rotate(42deg);
}

.feature-top__title {
  color: var(--text);
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
}

.feature-hero,
.profile-summary,
.target-summary,
.record-summary,
.record-detail-card,
.stat-tile,
.empty-note {
  box-shadow: var(--shadow-soft);
}

.feature-hero {
  position: relative;
  margin-top: 44rpx;
  padding: 40rpx 34rpx 42rpx;
  border: 2rpx solid var(--border);
  border-radius: 32rpx;
  overflow: hidden;
  background: var(--panel-bg);
}

.feature-mark {
  position: relative;
  width: 84rpx;
  height: 84rpx;
}

.feature-mark__orb {
  position: absolute;
  inset: 10rpx;
  border-radius: 26rpx;
  transform: rotate(-12deg);
}

.feature-mark__spark {
  position: absolute;
  border-radius: 999rpx;
  background: #ffffff;
}

.feature-mark__spark--one {
  left: 24rpx;
  top: 28rpx;
  width: 28rpx;
  height: 6rpx;
}

.feature-mark__spark--two {
  left: 35rpx;
  top: 17rpx;
  width: 6rpx;
  height: 28rpx;
}

.feature-kicker,
.record-detail-hero__kicker {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1;
}

.feature-kicker {
  margin-top: 28rpx;
  font-size: 13px;
}

.feature-title,
.profile-copy__title,
.target-copy__title,
.record-summary__title,
.record-detail-hero__title {
  color: var(--text);
  font-weight: 900;
  line-height: 1.16;
}

.feature-title {
  display: block;
  margin-top: 16rpx;
  font-size: 30px;
  line-height: 1.15;
}

.feature-summary,
.profile-copy__body,
.target-copy__body,
.record-summary__body {
  display: block;
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.5;
}

.feature-summary {
  margin-top: 20rpx;
  font-size: 15px;
  line-height: 1.55;
}

.personal-profile,
.target-profile,
.record-create,
.record-detail {
  margin-top: 36rpx;
}

.profile-summary,
.target-summary,
.record-summary {
  display: flex;
  gap: 24rpx;
  align-items: stretch;
  padding: 28rpx;
  border-radius: 32rpx;
}

.profile-summary {
  border: 2rpx solid var(--border);
  background: var(--panel-bg);
}

.profile-copy,
.target-copy,
.record-summary__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.profile-copy__title,
.target-copy__title,
.record-summary__title {
  margin-top: 14rpx;
  font-size: 22px;
}

.profile-copy__body,
.target-copy__body,
.record-summary__body {
  margin-top: 16rpx;
}

.profile-section,
.target-section,
.record-section {
  margin-top: 28rpx;
}

.profile-section__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.profile-section__title,
.section-title {
  color: var(--text);
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.profile-section__title {
  font-size: 19px;
}

.profile-section__hint,
.stat-label {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1;
}

.profile-grid,
.target-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 20rpx;
}

.profile-field,
.target-field,
.target-note,
.record-field,
.record-detail-section,
.stat-tile,
.action-row {
  border: 2rpx solid var(--border);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.94);
}

.profile-field,
.target-field,
.target-note,
.record-field,
.record-detail-section {
  padding: 22rpx 24rpx;
}

.profile-field:nth-child(3),
.target-field:nth-child(1) {
  grid-column: span 2;
}

.target-field--half {
  grid-column: span 1;
}

.profile-field--summary {
  grid-column: span 2;
}

.profile-field__label {
  display: block;
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.profile-field__required,
.profile-field__optional {
  margin-left: 6rpx;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.profile-field__required {
  color: var(--error);
}

.profile-field__optional {
  color: var(--text-secondary);
}

.profile-field__input,
.profile-textarea,
.target-textarea,
.record-textarea {
  width: 100%;
  margin-top: 18rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.5;
}

.profile-field__input {
  height: 58rpx;
  margin-top: 14rpx;
  font-size: 15px;
  line-height: 58rpx;
}

.profile-placeholder {
  color: var(--text-disabled);
}

.profile-section--notes,
.target-section--notes {
  margin-top: 30rpx;
}

.target-note-list,
.record-form,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.profile-textarea {
  min-height: 152rpx;
}

.profile-textarea--summary {
  min-height: 260rpx;
}

.target-summary {
  align-items: center;
  padding: 30rpx 28rpx;
  border: 2rpx solid rgba(10, 124, 255, 0.18);
  background: #ffffff;
}

.target-profile-switcher {
  margin-top: 28rpx;
}

.target-profile-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.target-profile-card {
  min-width: 0;
  padding: 20rpx 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.94);
}

.target-profile-card--active {
  border-color: rgba(10, 124, 255, 0.5);
  background: var(--primary-bg);
}

.target-profile-card--new {
  border-style: dashed;
}

.target-profile-card--tap {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.target-profile-card__name,
.target-profile-card__meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-profile-card__name {
  color: var(--text);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
}

.target-profile-card__meta {
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1;
}

.target-textarea {
  min-height: 150rpx;
}

.record-summary {
  border: 2rpx solid rgba(10, 124, 255, 0.18);
  background: #ffffff;
}

.record-field--emphasis {
  background: var(--primary-bg);
}

.record-textarea {
  min-height: 136rpx;
}

.record-textarea--large {
  min-height: 190rpx;
}

.record-date-picker {
  display: flex;
  align-items: center;
  min-height: 64rpx;
  margin-top: 16rpx;
  padding: 0 20rpx;
  border-radius: 22rpx;
  border: 2rpx solid var(--border);
  color: var(--text-body);
  font-size: 14px;
  line-height: 1;
  background: #ffffff;
}

.record-field--satisfaction {
  padding-bottom: 24rpx;
}

.record-satisfaction {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 18rpx;
}

.record-satisfaction__option {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70rpx;
  border: 2rpx solid var(--border);
  border-radius: 22rpx;
  background: #ffffff;
}

.record-satisfaction__option--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.record-satisfaction__option--selected {
  border-color: rgba(10, 124, 255, 0.5);
  background: var(--primary-bg);
}

.record-satisfaction__option text {
  color: var(--text-body);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.record-detail-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 28rpx;
  border: 2rpx solid var(--border);
  border-radius: 32rpx;
  background: #ffffff;
}

.record-detail-hero {
  padding: 6rpx 4rpx 10rpx;
}

.record-detail-hero__title {
  display: block;
  margin-top: 14rpx;
  font-size: 24px;
}

.record-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.record-detail-meta__item {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: var(--bg-soft);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1;
}

.record-detail-section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.record-detail-section__label {
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.record-detail-section__value {
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.record-detail-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 124rpx;
  min-height: 56rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary) 100%);
}

.record-detail-badge text {
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}

.record-detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.record-detail-action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 84rpx;
  border-radius: 999rpx;
}

.record-detail-action--edit {
  background: var(--primary);
  box-shadow: 0 10rpx 0 0 var(--primary-active);
}

.record-detail-action--delete {
  background: #fff2f3;
  box-shadow: 0 10rpx 0 0 rgba(255, 45, 56, 0.18);
}

.record-detail-action--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.record-detail-action text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.record-detail-action--delete text {
  color: var(--error);
}

.record-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360rpx;
  padding: 42rpx 34rpx;
  border: 2rpx dashed var(--border-strong);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.78);
  text-align: center;
}

.record-detail-empty__title {
  color: var(--text);
  font-size: 19px;
  font-weight: 900;
  line-height: 1;
}

.record-detail-empty__body {
  margin-top: 18rpx;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.chat-detail {
  margin-top: 42rpx;
  padding-bottom: 150rpx;
}

.chat-history {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.chat-message {
  display: flex;
  max-width: 86%;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx 22rpx;
  border: 2rpx solid var(--border);
  border-radius: 26rpx;
  box-shadow: var(--shadow-soft);
}

.chat-message--user {
  align-self: flex-end;
  border-bottom-right-radius: 10rpx;
  border-color: var(--primary-active);
  background: linear-gradient(180deg, var(--primary-hover) 0%, var(--primary) 100%);
  box-shadow: 0 8rpx 0 0 var(--shadow-btn);
}

.chat-message--ai {
  align-self: flex-start;
  border-bottom-left-radius: 10rpx;
  background: var(--panel-bg);
}

.chat-message--error {
  background: #fff2f3;
}

.chat-message--user .chat-message__content {
  color: #ffffff;
}

.chat-message__content,
.action-text {
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.45;
}

.chat-message__content--rich {
  display: block;
  width: 100%;
}

.chat-message__references {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.chat-message__references text {
  max-width: 100%;
  padding: 6rpx 10rpx;
  border: 1rpx solid rgba(10, 124, 255, 0.24);
  border-radius: 6rpx;
  background: rgba(10, 124, 255, 0.05);
  color: var(--primary-active);
  font-size: 12px;
  line-height: 1.35;
}

.chat-message__content--rich :deep(.markdown-heading) {
  display: block;
  margin: 0 0 12rpx;
  color: var(--text);
  font-size: 16px;
  font-weight: 900;
  line-height: 1.32;
}

.chat-message__content--rich :deep(.markdown-paragraph) {
  display: block;
  margin: 0 0 12rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.56;
}

.chat-message__content--rich :deep(.markdown-list) {
  display: block;
  margin: 4rpx 0 12rpx;
  padding-left: 30rpx;
  color: var(--text-body);
  font-size: 14px;
  line-height: 1.54;
}

.chat-message__content--rich :deep(.markdown-list-item) {
  display: list-item;
  margin-top: 8rpx;
}

.chat-message__content--rich :deep(.markdown-strong) {
  font-weight: 900;
}

.chat-message__content--rich :deep(.markdown-emphasis) {
  font-style: italic;
}

.chat-message__content--rich :deep(.markdown-code) {
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  background: rgba(17, 24, 39, 0.06);
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}

.chat-message__content--rich :deep(.markdown-paragraph:last-child),
.chat-message__content--rich :deep(.markdown-heading:last-child),
.chat-message__content--rich :deep(.markdown-list:last-child) {
  margin-bottom: 0;
}

.stats-row {
  display: flex;
  gap: 18rpx;
  margin-top: 22rpx;
}

.stat-tile {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-height: 126rpx;
  padding: 0 24rpx;
}

.stat-value {
  color: var(--text);
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.action-section {
  margin-top: 34rpx;
}

.action-row {
  display: flex;
  align-items: center;
  min-height: 86rpx;
  padding: 0 24rpx;
}

.action-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.action-text {
  flex: 1;
  margin-left: 18rpx;
  font-size: 15px;
  line-height: 1.2;
}

.action-arrow {
  color: var(--text-secondary);
  font-size: 36rpx;
  line-height: 1;
}

.empty-note {
  margin-top: 28rpx;
  padding: 22rpx 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
}

.empty-note text {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.45;
}

.profile-save,
.record-save {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: var(--primary);
  box-shadow: 0 10rpx 0 0 var(--primary-active);
}

.profile-save--active,
.target-save--active,
.record-save--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.profile-save text,
.record-save text {
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.target-save {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: var(--primary);
  box-shadow: 0 10rpx 0 0 var(--primary-active);
}

.target-save text {
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.feature-page--blue .feature-mark__orb,
.feature-page--blue .action-dot {
  background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary) 100%);
}

.feature-page--purple .feature-mark__orb,
.feature-page--purple .action-dot {
  background: linear-gradient(135deg, #ff6b75 0%, var(--error) 100%);
}

.feature-page--rose .feature-mark__orb,
.feature-page--rose .action-dot {
  background: linear-gradient(135deg, #ff6b75 0%, var(--error) 100%);
}

.feature-page--green .feature-mark__orb,
.feature-page--green .action-dot {
  background: linear-gradient(135deg, #6aa8ff 0%, var(--primary) 100%);
}
</style>
