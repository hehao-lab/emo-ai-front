<script setup>
import { computed, ref } from 'vue'
import SettingsMenuCard from './SettingsMenuCard.vue'
import SettingsDetailScreen from './SettingsDetailScreen.vue'
import SettingsProfilePanel from './SettingsProfilePanel.vue'
import SettingsTopBar from './SettingsTopBar.vue'
import { settingsMenuItems, settingsProfile } from '../../common/settings-data'

defineProps({
  chatRecords: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['back', 'logout', 'open-chat'])
const activeDetailKey = ref('')

const detailMap = {
  mood: {
    key: 'mood',
    title: '心情日记',
    summary: '记录你今天的情绪波动、触发点和想法，帮助你更快看清关系里的模式。',
    sections: [
      { title: '今天的感受', body: '写下你此刻最明显的情绪，是开心、委屈、焦虑，还是一团乱。' },
      { title: '触发原因', body: '补充让你有这种感受的具体事件，越具体越能帮助后续分析。' },
    ],
    actions: ['新增一条日记', '查看历史记录', '导出情绪时间线'],
  },
  history: {
    key: 'history',
    title: '历史咨询',
    summary: '回看你和情感军师过去聊过的问题、建议和后续行动。',
    sections: [
      { title: '最近咨询', body: '整理最近一次对话的核心问题和你采取过的动作。' },
      { title: '持续跟进', body: '继续追踪同一件事的变化，形成连续的判断依据。' },
    ],
    actions: ['查看最近咨询', '筛选主题', '整理行动清单'],
  },
  report: {
    key: 'report',
    title: '情感分析报告',
    summary: '把与你和目标人物相关的核心判断浓缩成两段关键信息，帮助你快速把握关系现状。',
    defaultTargetId: 'target-lin',
    reportTargets: [
      {
        id: 'target-lin',
        name: '小林',
        relationshipLabel: '暧昧对象',
        headline: '当前更适合低压沟通，不适合追问结果',
        summary: '先稳定互动节奏，再观察回应质量，会比直接要答案更有效。',
        relationshipAnalysis: '小林在关系中更偏向先观察后表达，对情绪压力比较敏感，因此会优先维持自己的节奏感。他对你并不是没有回应，而是更需要在低压力、不被紧逼的互动下，才更容易稳定释放好感和真实想法。',
      },
      {
        id: 'target-zhou',
        name: '阿周',
        relationshipLabel: '前任',
        headline: '先恢复稳定互动，再讨论关系定义',
        summary: '边界清晰和节奏可预期，比情绪推动更能让关系重新靠近。',
        relationshipAnalysis: '阿周在这段关系中更在意边界能否清晰，如果互动里带有追问或立刻要结果的压力，他会先退后以保持安全感。你们的关键不在于谁先表态，而在于能否先恢复稳定、可预期的沟通节奏，让对方看到你的情绪和行动都更平稳。',
      },
      {
        id: 'target-xu',
        name: '小许',
        relationshipLabel: '相亲对象',
        headline: '先看持续回应，再决定是否加速推进',
        summary: '让互动自然累积，比过早定义关系更容易看清对方投入度。',
        relationshipAnalysis: '小许更关注相处过程中的舒适度和信息是否对等，如果你能给到清晰、具体、不繁琐的反馈，他对关系的投入会提升得更快。目前比起立刻定义关系，更适合先通过稳定频率的互动来确认他是否持续感到安心和被理解。',
      },
    ],
    reportSections: [
      {
        title: '我的性格分析',
        body: '你在关系里更偏向敏感细腻和高投入型，会更在意回应速度、情绪确认和对方是否真正理解你的需求。\n\n你擅长觉察细节，也容易因为对方态度变化而反复思考，因此在亲密关系里既有共情力，也更容易在不确定时感到消耗。',
      },
      {
        title: '目标人物的关系分析',
        body: '',
      },
    ],
  },
  privacy: {
    key: 'privacy',
    title: '隐私与安全',
    summary: '管理你的数据保护、存储方式和使用偏好。',
    sections: [
      { title: '账号安全', body: '修改登录方式、设备状态和安全提醒。' },
      { title: '数据管理', body: '查看数据保存与清理相关设置。' },
    ],
    actions: ['修改安全设置', '管理数据保存', '查看隐私说明'],
  },
  about: {
    key: 'about',
    title: '关于我们',
    summary: '了解这个产品的定位、版本与联系信息。',
    sections: [
      { title: '产品说明', body: '这里是帮助你理解产品能力与用途的入口。' },
      { title: '版本信息', body: `当前版本：${settingsProfile.version}` },
    ],
    actions: ['查看更新日志', '联系支持', '了解更多'],
  },
}

const activeDetail = computed(() => detailMap[activeDetailKey.value] || null)

const closeDetail = () => {
  activeDetailKey.value = ''
}

const handleMenuSelect = (item) => {
  if (item.key !== 'logout') {
    activeDetailKey.value = item.key
    return
  }

  uni.showModal({
    content: '是否退出当前登录',
    confirmText: '是',
    cancelText: '否',
    success: ({ confirm }) => {
      if (confirm) {
        emit('logout')
      }
    },
  })
}
</script>

<template>
  <SettingsDetailScreen
    v-if="activeDetail"
    :detail="activeDetail"
    :chat-records="chatRecords"
    @back="closeDetail"
    @open-chat="emit('open-chat', $event)"
  />

  <view v-else class="settings-page">
    <view class="settings-page__inner">
      <SettingsTopBar @back="emit('back')" />

      <SettingsProfilePanel :name="settingsProfile.name" />

      <SettingsMenuCard :items="settingsMenuItems" @select="handleMenuSelect" />

      <text class="settings-page__version">{{ settingsProfile.version }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 14% 8%, rgba(130, 213, 187, 0.24), transparent 26%),
    radial-gradient(circle at 84% 10%, rgba(248, 166, 178, 0.18), transparent 20%),
    linear-gradient(180deg, #f8f8f0 0%, #f7f3df 100%);
}

.settings-page__inner {
  position: relative;
  min-height: 100vh;
  padding: 66rpx 26rpx 40rpx;
}

.settings-page__version {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 40rpx;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}
</style>
