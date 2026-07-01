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
    summary: '记录你今天的情绪波动、触发点和想法，帮你更快看清关系里的模式。',
    sections: [
      { title: '今天的感受', body: '写下你此刻最明显的情绪，是开心、委屈、焦虑，还是一团乱。' },
      { title: '触发原因', body: '补充让你有这种感受的具体事件，越具体越能帮到后续分析。' },
    ],
    actions: ['新增一条日记', '查看历史记录', '导出情绪时间线'],
  },
  history: {
    key: 'history',
    title: '历史咨询',
    summary: '回看你和情感军师过去聊过的问题、建议和后续行动。',
    sections: [
      { title: '最近咨询', body: '整理最近一次对话的核心问题和你采取过的动作。' },
      { title: '持续跟进', body: '继续追踪同一件事的变化，形成连续判断。' },
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
    summary: '管理你的数据保护、登录设备和安全事件。',
    summary: '我们按照合法、正当、必要、诚信的原则处理你的个人信息，并以公开透明、最小必要的方式说明数据使用与保护策略。',
    sections: [
      { title: '账号安全', body: '修改登录方式、查看设备状态和安全提醒。' },
      { title: '数据管理', body: '查看数据保存与清理相关设置。' },
      {
        title: '我们收集与使用的信息',
        body: '为了实现登录识别、咨询记录保存、情绪记录管理、重要事件整理以及情感分析等基本功能，我们可能会收集账号标识信息、对话内容、日记内容、重要记录以及为维护服务正常运行所必需的基础设备信息。我们只会在与功能和服务相关的范围内使用这些信息，不会为无关目的超范围收集。',
      },
      {
        title: '权限申请与敏感信息说明',
        body: '我们仅在具体业务场景下按需申请系统权限，并在你授权后在必要范围内使用。如果某项权限或信息属于敏感个人信息或可能对你的权益产生较大影响，我们将在启用前另行告知目的、必要性和影响，并得到你的同意。不同意非必要权限，不会影响基本功能的使用。',
      },
      {
        title: '存储期限与安全保护',
        body: '我们遵循最小必要原则确定信息存储期限，在达到服务目的或法律法规要求后，会对相关信息进行删除或匿名化处理。同时，我们会通过访问控制、最小授权、传输保护、日志稽核等措施尽力防止未经授权的访问、泄露、篡改或丢失。',
      },
      {
        title: '对外共享、转让与公开说明',
        body: '未经你同意，我们不会向无关的第三方提供你的个人信息。如因业务需要接入第三方服务或软件工具，我们会在隐私政策或其他合适的告知方式中说明其处理目的、数据类型及使用边界。只有在法律法规要求、保护你或公共人身财产安全等法定情形下，我们才会依法进行转让、共享或公开。',
      },
      {
        title: '你依法享有的权利',
        body: '你有权查看、更正、补充、删除你的个人信息，也有权撤回授权、反对或限制特定处理，并可以申请注销账号。如你对个人信息处理事项存在疑问，可通过隐私政策、反馈渠道或客服方式向我们进行询问、投诉或举报。',
      },
      {
        title: '未成年人保护与联系我们',
        body: '如果涉及未成年人个人信息，我们将依法在监护人同意或法律允许的范围内进行处理，并采取更严格的保护措施。如你希望查看完整隐私政策、申请删除数据、注销账号或反馈隐私与安全问题，可通过页面指引或客服支持渠道联系我们处理。',
      },
    ],
    actions: ['查看隐私政策', '管理授权与权限', '申请删除数据或注销账号'],
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

function closeDetail() {
  activeDetailKey.value = ''
}

async function confirmLogout() {
  await logoutAuth().catch(() => {})
  emit('logout')
}

function handleMenuSelect(item) {
  if (item.key !== 'logout') {
    activeDetailKey.value = item.key
    return
  }

  if (typeof uni === 'undefined' || !uni.showModal) {
    confirmLogout()
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
