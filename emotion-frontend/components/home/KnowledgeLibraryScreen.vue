<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  createKnowledgeDocument,
  fetchKnowledgeFiles,
  pollKnowledgeJob,
  uploadKnowledgeObject,
} from '../../common/chat-api.mjs'
import HomeStatusBar from './HomeStatusBar.vue'

const emit = defineEmits(['back'])

const stages = ['queued', 'parsing', 'chunking', 'embedding', 'indexing', 'ready']
const stageLabels = {
  queued: '排队',
  parsing: '解析',
  chunking: '分段',
  embedding: '向量化',
  indexing: '建索引',
  ready: '可用',
  failed: '失败',
}

const storedFiles = ref([])
const selectedFile = ref(null)
const activeJob = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const listError = ref('')
const actionError = ref('')
let activeController = null

const activeStageIndex = computed(() => stages.indexOf(activeJob.value?.status || 'queued'))
const selectedTitle = computed(() => String(selectedFile.value?.name || '').replace(/\.[^.]+$/, ''))

const errorMessage = (error) => error instanceof Error ? error.message : String(error || '请求失败')

const loadStoredFiles = async () => {
  isLoading.value = true
  listError.value = ''
  try {
    const payload = await fetchKnowledgeFiles()
    storedFiles.value = payload?.items || []
  } catch (error) {
    listError.value = errorMessage(error)
  } finally {
    isLoading.value = false
  }
}

const formatFileSize = (sizeBytes) => {
  const size = Number(sizeBytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const formatLastModified = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-CN')
}

const formatFileMeta = (file) => [
  formatFileSize(file?.sizeBytes),
  formatLastModified(file?.lastModified),
].filter(Boolean).join(' · ')

const normalizePickedFile = (result) => {
  const file = result?.tempFiles?.[0]
  if (file) {
    return {
      name: file.name || String(file.path || '').split(/[\\/]/).pop(),
      path: file.path || file.tempFilePath,
      size: file.size || 0,
    }
  }
  const path = result?.tempFilePaths?.[0]
  return path ? { name: String(path).split(/[\\/]/).pop(), path, size: 0 } : null
}

const chooseFile = () => {
  if (typeof uni === 'undefined') return
  const picker = uni.chooseMessageFile || uni.chooseFile
  if (!picker) {
    actionError.value = '当前运行环境不支持选择文件'
    return
  }
  picker.call(uni, {
    count: 1,
    type: 'file',
    extension: ['txt', 'md', 'markdown', 'pdf', 'docx'],
    success: (result) => {
      selectedFile.value = normalizePickedFile(result)
      actionError.value = ''
    },
    fail: (error) => {
      if (!String(error?.errMsg || '').includes('cancel')) actionError.value = '文件选择失败'
    },
  })
}

const updateJob = (job) => {
  activeJob.value = {
    ...(activeJob.value || {}),
    ...job,
    documentId: job.documentId || job.document_id || activeJob.value?.documentId,
    errorDetail: job.errorDetail || job.error_detail || '',
  }
}

const submitDocument = async () => {
  if (!selectedFile.value || isSubmitting.value) return
  activeController?.abort()
  activeController = new AbortController()
  isSubmitting.value = true
  actionError.value = ''
  activeJob.value = { status: 'queued', progress: 0, title: selectedTitle.value, uploading: true }

  try {
    const stored = await uploadKnowledgeObject({
      filePath: selectedFile.value.path,
      signal: activeController.signal,
    })
    await loadStoredFiles()
    const accepted = await createKnowledgeDocument({
      title: selectedTitle.value || selectedFile.value.name,
      source: stored.source || selectedFile.value.name,
      objectReference: stored.objectReference,
    }, { signal: activeController.signal })
    activeJob.value = {
      ...accepted,
      documentId: accepted.id,
      jobId: accepted.jobId || accepted.job_id,
      title: selectedTitle.value,
      progress: 0,
      uploading: false,
    }
    await pollKnowledgeJob(activeJob.value.jobId, {
      signal: activeController.signal,
      onProgress: updateJob,
    })
    selectedFile.value = null
  } catch (error) {
    if (error?.name !== 'AbortError') {
      actionError.value = errorMessage(error)
      activeJob.value = {
        ...(activeJob.value || {}),
        status: 'failed',
        errorDetail: errorMessage(error),
        uploading: false,
      }
    }
  } finally {
    activeController = null
    isSubmitting.value = false
  }
}

const goBack = () => {
  activeController?.abort()
  emit('back')
}

onMounted(loadStoredFiles)
onBeforeUnmount(() => activeController?.abort())
</script>

<template>
  <view class="knowledge-page">
    <HomeStatusBar />

    <view class="knowledge-topbar">
      <view class="knowledge-back" hover-class="knowledge-back--active" @tap="goBack">
        <text>‹</text>
      </view>
      <text class="knowledge-title">知识库</text>
      <view class="knowledge-topbar__spacer"></view>
    </view>

    <view class="knowledge-upload">
      <view class="knowledge-upload__heading">
        <text class="knowledge-section-title">添加文档</text>
        <text class="knowledge-count">{{ storedFiles.length }} 份</text>
      </view>
      <view class="knowledge-picker" hover-class="knowledge-picker--active" @tap="chooseFile">
        <view class="knowledge-picker__mark"><text>+</text></view>
        <view class="knowledge-picker__copy">
          <text class="knowledge-picker__name">{{ selectedFile?.name || '选择文件' }}</text>
          <text v-if="selectedFile?.size" class="knowledge-picker__meta">{{ (selectedFile.size / 1024 / 1024).toFixed(1) }} MB</text>
          <text v-else class="knowledge-picker__meta">TXT · Markdown · PDF · DOCX</text>
        </view>
      </view>
      <view
        class="knowledge-submit"
        :class="{ 'knowledge-submit--disabled': !selectedFile || isSubmitting }"
        hover-class="knowledge-submit--active"
        @tap="submitDocument"
      >
        <text>{{ isSubmitting ? '处理中' : '开始索引' }}</text>
      </view>
      <text v-if="actionError && !activeJob" class="knowledge-upload-error">{{ actionError }}</text>
    </view>

    <view v-if="activeJob" class="knowledge-pipeline">
      <view class="knowledge-pipeline__heading">
        <view>
          <text class="knowledge-section-title">{{ activeJob.title || '当前任务' }}</text>
          <text class="knowledge-pipeline__status">{{ activeJob.uploading ? '上传中' : (stageLabels[activeJob.status] || activeJob.status) }}</text>
        </view>
        <text class="knowledge-progress-value">{{ activeJob.progress || 0 }}%</text>
      </view>
      <progress
        class="knowledge-progress"
        :percent="activeJob.uploading ? 0 : (activeJob.progress || 0)"
        stroke-width="4"
        activeColor="#0a7cff"
        backgroundColor="#e4e7eb"
      />
      <view class="knowledge-stages">
        <view
          v-for="(stage, index) in stages"
          :key="stage"
          class="knowledge-stage"
          :class="{
            'knowledge-stage--done': index < activeStageIndex,
            'knowledge-stage--active': index === activeStageIndex && activeJob.status !== 'failed',
            'knowledge-stage--failed': activeJob.status === 'failed' && index === Math.max(activeStageIndex, 0),
          }"
        >
          <view class="knowledge-stage__dot"></view>
          <text>{{ stageLabels[stage] }}</text>
        </view>
      </view>
      <text v-if="activeJob.errorDetail" class="knowledge-job-error">{{ activeJob.errorDetail }}</text>
    </view>

    <view class="knowledge-library">
      <text class="knowledge-section-title">已有文档</text>
      <text v-if="listError" class="knowledge-error">{{ listError }}</text>
      <text v-else-if="isLoading" class="knowledge-empty">正在同步...</text>
      <text v-else-if="!storedFiles.length" class="knowledge-empty">暂无文档</text>
      <view v-else class="knowledge-list">
        <view v-for="file in storedFiles" :key="file.objectKey" class="knowledge-item">
          <view class="knowledge-item__main">
            <text class="knowledge-item__title">{{ file.name }}</text>
            <text class="knowledge-item__meta">{{ formatFileMeta(file) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.knowledge-page {
  min-height: 100vh;
  padding: 38rpx 28rpx 56rpx;
  box-sizing: border-box;
  background: #f6f7f9;
}

.knowledge-topbar,
.knowledge-upload__heading,
.knowledge-pipeline__heading,
.knowledge-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.knowledge-topbar { margin-top: 26rpx; }
.knowledge-back,
.knowledge-topbar__spacer { width: 58rpx; height: 58rpx; }
.knowledge-back {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border);
  border-radius: 18rpx;
  background: #ffffff;
}
.knowledge-back text { color: var(--text); font-size: 34px; line-height: 1; transform: translateY(-2rpx); }
.knowledge-back--active,
.knowledge-picker--active,
.knowledge-submit--active { opacity: 0.78; transform: translateY(2rpx); }
.knowledge-title { color: var(--text); font-size: 22px; font-weight: 900; line-height: 1; }

.knowledge-upload,
.knowledge-pipeline,
.knowledge-library { margin-top: 42rpx; }
.knowledge-section-title { color: var(--text); font-size: 18px; font-weight: 900; line-height: 1.2; }
.knowledge-count,
.knowledge-picker__meta,
.knowledge-item__meta,
.knowledge-pipeline__status { color: var(--text-secondary); font-size: 12px; line-height: 1.35; }
.knowledge-picker {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 108rpx;
  margin-top: 22rpx;
  padding: 18rpx 22rpx;
  border: 2rpx dashed var(--border-strong);
  border-radius: 24rpx;
  background: #ffffff;
}
.knowledge-picker__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  background: var(--primary-bg);
}
.knowledge-picker__mark text { color: var(--primary); font-size: 26px; font-weight: 800; }
.knowledge-picker__copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 8rpx; }
.knowledge-picker__name { overflow: hidden; color: var(--text); font-size: 15px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.knowledge-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 82rpx;
  margin-top: 20rpx;
  border-radius: 22rpx;
  background: var(--primary);
  box-shadow: 0 8rpx 0 var(--primary-active);
}
.knowledge-submit text { color: #ffffff; font-size: 16px; font-weight: 800; }
.knowledge-submit--disabled { opacity: 0.42; box-shadow: none; }

.knowledge-pipeline { padding: 26rpx 24rpx; border: 2rpx solid var(--border); border-radius: 24rpx; background: #ffffff; }
.knowledge-pipeline__heading > view { display: flex; min-width: 0; flex-direction: column; gap: 10rpx; }
.knowledge-progress-value { color: var(--primary); font-size: 18px; font-weight: 900; }
.knowledge-progress { display: block; width: 100%; margin-top: 22rpx; }
.knowledge-stages { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18rpx 12rpx; margin-top: 24rpx; }
.knowledge-stage { display: flex; align-items: center; gap: 8rpx; color: var(--text-muted); font-size: 12px; }
.knowledge-stage__dot { width: 12rpx; height: 12rpx; flex: 0 0 auto; border-radius: 50%; background: #d4d8de; }
.knowledge-stage--done,
.knowledge-stage--active { color: var(--text-body); font-weight: 800; }
.knowledge-stage--done .knowledge-stage__dot,
.knowledge-stage--active .knowledge-stage__dot { background: var(--primary); }
.knowledge-stage--active .knowledge-stage__dot { box-shadow: 0 0 0 7rpx rgba(10, 124, 255, 0.12); }
.knowledge-stage--failed { color: var(--error); }
.knowledge-stage--failed .knowledge-stage__dot { background: var(--error); }
.knowledge-job-error,
.knowledge-upload-error,
.knowledge-error { color: var(--error); font-size: 12px; line-height: 1.5; }
.knowledge-job-error { display: block; margin-top: 20rpx; }
.knowledge-upload-error { display: block; margin-top: 18rpx; }

.knowledge-empty,
.knowledge-error { display: block; margin-top: 24rpx; }
.knowledge-empty { color: var(--text-secondary); font-size: 13px; }
.knowledge-list { display: flex; flex-direction: column; gap: 14rpx; margin-top: 22rpx; }
.knowledge-item { align-items: flex-start; gap: 20rpx; padding: 22rpx 24rpx; border: 2rpx solid var(--border); border-radius: 24rpx; background: #ffffff; }
.knowledge-item__main { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 9rpx; }
.knowledge-item__title { overflow: hidden; color: var(--text); font-size: 15px; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
</style>
