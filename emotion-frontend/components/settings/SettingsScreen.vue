<script setup>
import { computed, ref } from 'vue'
import SettingsMenuCard from './SettingsMenuCard.vue'
import SettingsDetailScreen from './SettingsDetailScreen.vue'
import SettingsProfilePanel from './SettingsProfilePanel.vue'
import SettingsTopBar from './SettingsTopBar.vue'
import { settingsMenuItems, settingsProfile } from '../../common/settings-data'
import { logoutAuth } from '../../common/user-api.mjs'

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
    summary: '记录今天的情绪波动、触发点和想法，帮你更快看清关系里的模式。',
    sections: [
      { title: '今天的感受', body: '写下此刻最明显的情绪，越具体越能帮助后续分析。' },
      { title: '触发原因', body: '补充让你产生这种感受的具体事件。' },
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
    summary: '把你目前的关系状态、风险点和下一步建议汇总成更清晰的报告。',
    sections: [
      { title: '关系画像', body: '把你的关系阶段、互动频率和情绪变化浓缩成一页概览。' },
      { title: '建议动作', body: '把当前最值得做的事情拆成可执行的小步骤。' },
    ],
    actions: ['生成新报告', '查看历史报告', '更新分析数据'],
  },
  privacy: {
    key: 'privacy',
    title: '隐私与安全',
    summary: '管理你的数据保护、登录设备和安全事件。',
    sections: [
      { title: '账号安全', body: '修改登录方式、查看设备状态和安全提醒。' },
      { title: '数据管理', body: '查看数据保存与清理相关设置。' },
    ],
    actions: ['修改安全设置', '管理登录设备', '查看安全事件'],
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
        confirmLogout()
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
  background: linear-gradient(180deg, #f3ecf8 0%, #e8ebf9 34%, #dceafb 100%);
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
  color: #9aa1b1;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}
</style>
