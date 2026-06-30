<script setup>
import { computed, ref } from 'vue'
import HomeComposer from './HomeComposer.vue'
import HomeStatusBar from './HomeStatusBar.vue'

const props = defineProps({
  featureKey: {
    type: String,
    default: '',
  },
  activeChat: {
    type: Object,
    default: null,
  },
  currentChatMessages: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['back', 'send'])

const featureMap = {
  'personal': {
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
  'target': {
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
    kicker: '关键情感节点',
    summary: '把吵架、暧昧信号、冷淡转折、复合窗口等重要片段沉淀下来，形成你的专属情感时间线。',
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
    summary: '把事件、处理方式和你真正介意的点写清楚，后续复盘时才能看见关系里的重复模式。',
    tone: 'rose',
    stats: [
      { label: '填写项', value: '4' },
      { label: '记录类型', value: '事件' },
    ],
    actions: ['填写事件描述', '补充解决方式', '保存记录'],
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
    label: '年龄',
    value: '',
    placeholder: '例如 26',
    type: 'number',
  },
  {
    label: '性别',
    value: '',
    placeholder: '男 / 女 / 不方便透露',
    type: 'text',
  },
  {
    label: 'MBTI人格',
    value: '',
    placeholder: '例如 INFP',
    type: 'text',
  },
]

const personalProfileNotes = [
  {
    label: '关系说明',
    placeholder: '说明你们当前的关系阶段，例如暧昧期、恋爱中、分手后复联、婚姻冷淡期等。',
  },
  {
    label: '对自己性格的简单评价',
    placeholder: '简单描述你的性格、沟通习惯、安全感来源，或你在关系里最容易卡住的地方。',
  },
]

const targetProfileFields = [
  {
    label: '对方称呼',
    value: '',
    placeholder: '例如 小林 / 前任 / 相亲对象',
    type: 'text',
  },
  {
    label: '对方年龄',
    value: '',
    placeholder: '例如 28',
    type: 'number',
  },
  {
    label: '对方性别',
    value: '',
    placeholder: '男 / 女 / 不确定',
    type: 'text',
  },
  {
    label: '当前关系',
    value: '',
    placeholder: '暧昧期 / 恋爱中 / 分手后',
    type: 'text',
  },
  {
    label: '互动频率',
    value: '',
    placeholder: '每天 / 偶尔 / 已冷淡',
    type: 'text',
  },
  {
    label: '关系目标',
    value: '',
    placeholder: '推进关系 / 修复矛盾 / 复合',
    type: 'text',
  },
]

const targetProfileNotes = [
  {
    label: '对方性格与相处特点',
    placeholder: '描述 TA 的表达习惯、情绪模式、在亲密关系里的靠近或回避方式。',
  },
  {
    label: '最近一次关键互动',
    placeholder: '写下最近一次聊天、见面、争执、冷淡或暧昧信号，越具体越方便判断。',
  },
]

const recordCreateFields = [
  {
    label: '事件描述',
    placeholder: '写下这件事发生的背景、过程、对方说了什么、你做了什么，越具体越方便之后复盘。',
    emphasis: true,
  },
  {
    label: '矛盾解决方式',
    placeholder: '例如当场沟通、冷处理、道歉、暂时搁置、朋友介入，或者目前还没有解决。',
  },
  {
    label: '你在这件事情上在意的点',
    placeholder: '例如被忽视、被误解、承诺没有兑现、边界被冒犯，或你真正希望对方看见的部分。',
  },
]

const recordSatisfactionOptions = ['满意', '一般', '不满意', '还没解决']

const recordCreateEvents = ref([{ id: 'event-1', index: 1 }])

const feature = computed(() => featureMap[props.featureKey] || fallbackFeature)
const featureTitle = computed(() => (
  props.featureKey === 'chat-detail'
    ? props.activeChat?.title || feature.value.title
    : feature.value.title
))
const chatDetailMessages = computed(() => (
  props.currentChatMessages.length > 0
    ? props.currentChatMessages
    : props.activeChat?.messages || []
))
const usesGenericFeatureLayout = computed(() => !['personal', 'target', 'important-record-create', 'chat-detail'].includes(props.featureKey))

const addRecordCreateEvent = () => {
  const nextIndex = recordCreateEvents.value.length + 1

  recordCreateEvents.value.push({
    id: `event-${nextIndex}`,
    index: nextIndex,
  })
}
</script>

<template>
  <view class="feature-page" :class="`feature-page--${feature.tone}`">
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
        <view class="profile-score">
          <text class="profile-score__value">48%</text>
          <text class="profile-score__label">画像完成度</text>
        </view>
        <view class="profile-copy">
          <text class="profile-copy__kicker">{{ feature.kicker }}</text>
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
            <text class="profile-field__label">{{ field.label }}</text>
            <input
              class="profile-field__input"
              :type="field.type"
              :value="field.value"
              :placeholder="field.placeholder"
              placeholder-class="profile-placeholder"
            />
          </view>
        </view>
      </view>

      <view class="profile-section profile-section--notes">
        <view class="profile-section__heading">
          <text class="profile-section__title">关系与性格</text>
          <text class="profile-section__hint">越具体，分析越准</text>
        </view>

        <view class="profile-note-list">
          <view v-for="note in personalProfileNotes" :key="note.label" class="profile-note">
            <text class="profile-field__label">{{ note.label }}</text>
            <textarea
              class="profile-textarea"
              :placeholder="note.placeholder"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>
        </view>
      </view>

      <view class="profile-save" hover-class="profile-save--active">
        <text>保存资料</text>
      </view>
    </view>

    <view v-else-if="featureKey === 'target'" class="target-profile">
      <view class="target-summary">
        <view class="target-orbit">
          <view class="target-orbit__core"></view>
          <view class="target-orbit__ring target-orbit__ring--one"></view>
          <view class="target-orbit__ring target-orbit__ring--two"></view>
        </view>
        <view class="target-copy">
          <text class="target-copy__kicker">{{ feature.kicker }}</text>
          <text class="target-copy__title">先定义你想靠近的 TA</text>
          <text class="target-copy__body">{{ feature.summary }}</text>
        </view>
      </view>

      <view class="target-section">
        <view class="profile-section__heading">
          <text class="profile-section__title">对方基础信息</text>
          <text class="profile-section__hint">用于建立关系画像</text>
        </view>

        <view class="target-grid">
          <view v-for="field in targetProfileFields" :key="field.label" class="target-field">
            <text class="profile-field__label">{{ field.label }}</text>
            <input
              class="profile-field__input"
              :type="field.type"
              :value="field.value"
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
              class="target-textarea"
              :placeholder="note.placeholder"
              placeholder-class="profile-placeholder"
            ></textarea>
          </view>
        </view>
      </view>

      <view class="target-save" hover-class="target-save--active">
        <text>保存目标信息</text>
      </view>
    </view>

    <view v-else-if="featureKey === 'important-record-create'" class="record-create">
      <view class="record-summary">
        <view class="record-summary__marker">
          <view class="record-summary__line"></view>
          <text class="record-summary__number">01</text>
        </view>
        <view class="record-summary__copy">
          <text class="record-summary__kicker">{{ feature.kicker }}</text>
          <text class="record-summary__title">先把这件事讲完整</text>
          <text class="record-summary__body">{{ feature.summary }}</text>
        </view>
      </view>

      <view class="record-section">
        <view class="profile-section__heading">
          <text class="profile-section__title">事件信息</text>
          <text class="profile-section__hint">一件事一条记录</text>
        </view>

        <view class="record-form-list">
          <view v-for="event in recordCreateEvents" :key="event.id" class="record-event">
            <view class="record-event__heading">
              <text class="record-event__title">事件 {{ event.index }}</text>
              <text class="record-event__hint">填写这一件事</text>
            </view>

            <view
              v-for="field in recordCreateFields"
              :key="`${event.id}-${field.label}`"
              class="record-field"
              :class="{ 'record-field--emphasis': field.emphasis }"
            >
              <text class="profile-field__label">{{ field.label }}</text>
              <textarea
                class="record-textarea"
                :class="{ 'record-textarea--large': field.emphasis }"
                :placeholder="field.placeholder"
                placeholder-class="profile-placeholder"
              ></textarea>
            </view>

            <view class="record-field record-field--satisfaction">
              <text class="profile-field__label">解决方式是否满意</text>
              <view class="record-satisfaction">
                <view
                  v-for="option in recordSatisfactionOptions"
                  :key="`${event.id}-${option}`"
                  class="record-satisfaction__option"
                  hover-class="record-satisfaction__option--active"
                >
                  <text>{{ option }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="record-add-event" hover-class="record-add-event--active" @tap="addRecordCreateEvent">
            <view class="record-add-event__icon">
              <view class="record-add-event__line record-add-event__line--horizontal"></view>
              <view class="record-add-event__line record-add-event__line--vertical"></view>
            </view>
            <text>新增一件事</text>
          </view>
        </view>
      </view>

      <view class="record-save" hover-class="record-save--active">
        <text>保存记录</text>
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
          <text class="chat-message__content">{{ message.content || '正在分析...' }}</text>
        </view>
      </view>

      <view v-else class="chat-empty-state">
        <text class="chat-empty-state__title">还没有消息</text>
        <text class="chat-empty-state__body">从底部输入框开始新的对话，之后这里会保留你与 AI 的聊天记录。</text>
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
  background: linear-gradient(180deg, #f2ecf8 0%, #e9ebf9 36%, #dceafb 100%);
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
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.7);
  overflow: visible;
}

.back-button--active,
.action-row--active {
  opacity: 0.74;
  transform: scale(0.99);
}

.back-button__line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: #2f3342;
  transform-origin: left center;
}

.back-button__line--top {
  transform: translateX(-9rpx) rotate(-42deg);
}

.back-button__line--bottom {
  transform: translateX(-9rpx) rotate(42deg);
}

.feature-top__title {
  color: #1f2432;
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.feature-hero {
  position: relative;
  margin-top: 44rpx;
  padding: 40rpx 34rpx 42rpx;
  border-radius: 32rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 18rpx 38rpx rgba(129, 140, 176, 0.14);
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
  background: linear-gradient(135deg, #5f8cff 0%, #a34cf4 100%);
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

.feature-kicker {
  display: block;
  margin-top: 28rpx;
  color: #7c8497;
  font-size: 13px;
  line-height: 1;
}

.feature-title {
  display: block;
  margin-top: 16rpx;
  color: #232733;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.15;
}

.feature-summary {
  display: block;
  margin-top: 20rpx;
  color: #626b7f;
  font-size: 15px;
  line-height: 1.55;
}

.personal-profile {
  margin-top: 36rpx;
}

.profile-summary {
  display: flex;
  gap: 24rpx;
  align-items: stretch;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 18rpx 38rpx rgba(129, 140, 176, 0.14);
}

.profile-score {
  display: flex;
  flex: 0 0 154rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 154rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #4f93ff 0%, #6e5bf6 100%);
}

.profile-score__value {
  color: #ffffff;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.profile-score__label {
  margin-top: 14rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  line-height: 1;
}

.profile-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.profile-copy__kicker {
  color: #6d7890;
  font-size: 12px;
  line-height: 1;
}

.profile-copy__title {
  margin-top: 14rpx;
  color: #222839;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.16;
}

.profile-copy__body {
  margin-top: 16rpx;
  color: #667086;
  font-size: 13px;
  line-height: 1.48;
}

.profile-section {
  margin-top: 28rpx;
}

.profile-section__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.profile-section__title {
  color: #2e3140;
  font-size: 19px;
  font-weight: 900;
  line-height: 1;
}

.profile-section__hint {
  color: #9098aa;
  font-size: 12px;
  line-height: 1;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 20rpx;
}

.profile-field,
.profile-note {
  padding: 22rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.72);
}

.profile-field:nth-child(3) {
  grid-column: span 2;
}

.profile-field__label {
  display: block;
  color: #313748;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.profile-field__input {
  width: 100%;
  height: 58rpx;
  margin-top: 14rpx;
  color: #2e3444;
  font-size: 15px;
  line-height: 58rpx;
}

.profile-placeholder {
  color: #a5adbd;
}

.profile-section--notes {
  margin-top: 30rpx;
}

.profile-note-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.profile-textarea {
  width: 100%;
  min-height: 152rpx;
  margin-top: 18rpx;
  color: #2e3444;
  font-size: 14px;
  line-height: 1.5;
}

.profile-save {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: #5d6ef2;
  box-shadow: 0 18rpx 32rpx rgba(93, 110, 242, 0.22);
}

.profile-save--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.profile-save text {
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.target-profile {
  margin-top: 36rpx;
}

.target-summary {
  display: flex;
  gap: 24rpx;
  align-items: center;
  padding: 30rpx 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 18rpx 38rpx rgba(129, 140, 176, 0.14);
}

.target-orbit {
  position: relative;
  flex: 0 0 156rpx;
  height: 156rpx;
  border-radius: 34rpx;
  background: linear-gradient(135deg, rgba(160, 78, 255, 0.14), rgba(93, 110, 242, 0.18));
}

.target-orbit__core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #a04eff 0%, #6d5cf6 100%);
  transform: translate(-50%, -50%);
  box-shadow: 0 14rpx 24rpx rgba(125, 87, 236, 0.24);
}

.target-orbit__ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 3rpx solid rgba(124, 91, 237, 0.28);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-18deg);
}

.target-orbit__ring--one {
  width: 110rpx;
  height: 70rpx;
}

.target-orbit__ring--two {
  width: 74rpx;
  height: 118rpx;
  transform: translate(-50%, -50%) rotate(28deg);
}

.target-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.target-copy__kicker {
  color: #736c95;
  font-size: 12px;
  line-height: 1;
}

.target-copy__title {
  margin-top: 14rpx;
  color: #252238;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.16;
}

.target-copy__body {
  margin-top: 16rpx;
  color: #69647f;
  font-size: 13px;
  line-height: 1.48;
}

.target-section {
  margin-top: 28rpx;
}

.target-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 20rpx;
}

.target-field,
.target-note {
  padding: 22rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.72);
}

.target-field:nth-child(1),
.target-field:nth-child(6) {
  grid-column: span 2;
}

.target-section--notes {
  margin-top: 30rpx;
}

.target-note-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.target-textarea {
  width: 100%;
  min-height: 150rpx;
  margin-top: 18rpx;
  color: #2e3444;
  font-size: 14px;
  line-height: 1.5;
}

.target-save {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: #7b57ed;
  box-shadow: 0 18rpx 32rpx rgba(123, 87, 237, 0.22);
}

.target-save--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.target-save text {
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.record-create {
  margin-top: 36rpx;
}

.record-summary {
  display: flex;
  gap: 24rpx;
  align-items: stretch;
  padding: 30rpx 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 18rpx 38rpx rgba(162, 93, 132, 0.13);
}

.record-summary__marker {
  position: relative;
  display: flex;
  flex: 0 0 116rpx;
  align-items: center;
  justify-content: center;
  min-height: 150rpx;
  border-radius: 30rpx;
  background: linear-gradient(180deg, rgba(255, 127, 154, 0.16) 0%, rgba(163, 76, 244, 0.14) 100%);
}

.record-summary__line {
  position: absolute;
  left: 50%;
  top: 28rpx;
  bottom: 28rpx;
  width: 4rpx;
  border-radius: 999rpx;
  background: rgba(163, 76, 244, 0.28);
  transform: translateX(-50%);
}

.record-summary__number {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70rpx;
  height: 70rpx;
  border-radius: 24rpx;
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #ff7f9a 0%, #a34cf4 100%);
}

.record-summary__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.record-summary__kicker {
  color: #8a667b;
  font-size: 12px;
  line-height: 1;
}

.record-summary__title {
  margin-top: 14rpx;
  color: #2b2432;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.16;
}

.record-summary__body {
  margin-top: 16rpx;
  color: #746575;
  font-size: 13px;
  line-height: 1.48;
}

.record-section {
  margin-top: 28rpx;
}

.record-form-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.record-event {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 22rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.52);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.44);
}

.record-event__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.record-event__title {
  color: #2f2535;
  font-size: 17px;
  font-weight: 900;
  line-height: 1;
}

.record-event__hint {
  color: #9b879a;
  font-size: 12px;
  line-height: 1;
}

.record-field {
  padding: 22rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.72);
}

.record-field--emphasis {
  background: rgba(255, 255, 255, 0.82);
}

.record-textarea {
  width: 100%;
  min-height: 136rpx;
  margin-top: 18rpx;
  color: #2e3444;
  font-size: 14px;
  line-height: 1.5;
}

.record-textarea--large {
  min-height: 190rpx;
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
  border: 2rpx solid rgba(163, 76, 244, 0.14);
  border-radius: 22rpx;
  background: rgba(255, 247, 250, 0.72);
}

.record-satisfaction__option--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.record-satisfaction__option text {
  color: #5f4a61;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
}

.record-add-event {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  min-height: 82rpx;
  border: 2rpx dashed rgba(163, 76, 244, 0.3);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.5);
}

.record-add-event--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.record-add-event__icon {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: rgba(163, 76, 244, 0.12);
}

.record-add-event__line {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 999rpx;
  background: #a34cf4;
  transform: translate(-50%, -50%);
}

.record-add-event__line--horizontal {
  width: 16rpx;
  height: 3rpx;
}

.record-add-event__line--vertical {
  width: 3rpx;
  height: 16rpx;
}

.record-add-event text {
  color: #67426c;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
}

.record-save {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 34rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff7f9a 0%, #a34cf4 100%);
  box-shadow: 0 18rpx 32rpx rgba(163, 76, 244, 0.2);
}

.record-save--active {
  opacity: 0.82;
  transform: translateY(2rpx);
}

.record-save text {
  color: #ffffff;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
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
  border-radius: 26rpx;
  box-shadow: 0 12rpx 24rpx rgba(97, 117, 146, 0.1);
}

.chat-message--user {
  align-self: flex-end;
  border-bottom-right-radius: 10rpx;
  background: #5d6ef2;
}

.chat-message--ai {
  align-self: flex-start;
  border-bottom-left-radius: 10rpx;
  background: rgba(255, 255, 255, 0.78);
}

.chat-message--error {
  background: rgba(255, 240, 243, 0.9);
}

.chat-message--user .chat-message__content {
  color: #ffffff;
}

.chat-message__content {
  color: #303544;
  font-size: 14px;
  line-height: 1.45;
}

.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360rpx;
  padding: 42rpx 34rpx;
  border: 2rpx dashed rgba(86, 122, 154, 0.22);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.42);
  text-align: center;
}

.chat-empty-state__title {
  color: #2e3140;
  font-size: 19px;
  font-weight: 900;
  line-height: 1;
}

.chat-empty-state__body {
  margin-top: 18rpx;
  color: #818b9d;
  font-size: 13px;
  line-height: 1.5;
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
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.62);
}

.stat-value {
  color: #252a38;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.stat-label {
  margin-top: 14rpx;
  color: #8a92a5;
  font-size: 12px;
  line-height: 1;
}

.action-section {
  margin-top: 34rpx;
}

.section-title {
  color: #2e3140;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 20rpx;
}

.action-row {
  display: flex;
  align-items: center;
  min-height: 86rpx;
  padding: 0 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.7);
}

.action-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #a34cf4;
}

.action-text {
  flex: 1;
  margin-left: 18rpx;
  color: #303544;
  font-size: 15px;
  line-height: 1.2;
}

.action-arrow {
  color: #c7ccd8;
  font-size: 36rpx;
  line-height: 1;
}

.empty-note {
  margin-top: 28rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.42);
}

.empty-note text {
  color: #8b93a5;
  font-size: 13px;
  line-height: 1.45;
}

.feature-page--blue .feature-mark__orb,
.feature-page--blue .action-dot {
  background: linear-gradient(135deg, #4f93ff 0%, #5d6ef2 100%);
}

.feature-page--purple .feature-mark__orb,
.feature-page--purple .action-dot {
  background: linear-gradient(135deg, #a04eff 0%, #6d5cf6 100%);
}

.feature-page--rose .feature-mark__orb,
.feature-page--rose .action-dot {
  background: linear-gradient(135deg, #ff7f9a 0%, #a34cf4 100%);
}

.feature-page--green .feature-mark__orb,
.feature-page--green .action-dot {
  background: linear-gradient(135deg, #37c6aa 0%, #4f93ff 100%);
}
</style>
