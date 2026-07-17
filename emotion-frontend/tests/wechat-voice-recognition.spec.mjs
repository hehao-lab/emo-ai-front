import assert from 'node:assert/strict'
import test from 'node:test'

import {
  VOICE_AUTO_LISTENING_STORAGE_KEY,
  createVoiceRecognitionController,
} from '../common/wechat-voice-recognition.mjs'

function createFakeUni() {
  const storage = new Map()
  const authorizations = []

  return {
    authorizations,
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
    authorize(options) {
      authorizations.push(options.scope)
      options.success?.()
    },
  }
}

function createFakeWx() {
  const manager = {
    started: false,
    stopped: false,
    callbacks: {},
    onStart(callback) {
      this.callbacks.start = callback
    },
    onRecognize(callback) {
      this.callbacks.recognize = callback
    },
    onStop(callback) {
      this.callbacks.stop = callback
    },
    onError(callback) {
      this.callbacks.error = callback
    },
    start(options) {
      this.started = options
      this.callbacks.start?.()
    },
    stop() {
      this.stopped = true
      this.callbacks.stop?.({ result: 'final text' })
    },
  }

  return {
    manager,
    getPlugin(name) {
      assert.equal(name, 'WechatSI')
      return {
        getRecordRecognitionManager() {
          return manager
        },
      }
    },
  }
}

test('voice controller stores auto-listening preference with stable key', () => {
  const uniApi = createFakeUni()
  const controller = createVoiceRecognitionController({ uniApi, wxApi: createFakeWx() })

  assert.equal(VOICE_AUTO_LISTENING_STORAGE_KEY, 'emotion-ai:voice-auto-listening-enabled')
  assert.equal(controller.getAutoListeningEnabled(), false)

  controller.setAutoListeningEnabled(true)
  assert.equal(controller.getAutoListeningEnabled(), true)

  controller.setAutoListeningEnabled(false)
  assert.equal(controller.getAutoListeningEnabled(), false)
})

test('voice controller requests record permission through uni.authorize', async () => {
  const uniApi = createFakeUni()
  const controller = createVoiceRecognitionController({ uniApi, wxApi: createFakeWx() })

  const result = await controller.requestRecordPermission()

  assert.deepEqual(result, { ok: true })
  assert.deepEqual(uniApi.authorizations, ['scope.record'])
})

test('voice controller starts WeChatSI once and emits final stop result', async () => {
  const wxApi = createFakeWx()
  const controller = createVoiceRecognitionController({ uniApi: createFakeUni(), wxApi })
  const events = []

  const result = await controller.start({
    onStart: () => events.push(['start']),
    onResult: (text) => events.push(['result', text]),
    onStop: () => events.push(['stop']),
  })
  const duplicate = await controller.start()
  wxApi.manager.stop()

  assert.deepEqual(result, { ok: true })
  assert.deepEqual(duplicate, { ok: false, reason: 'already-listening' })
  assert.equal(controller.isListening(), false)
  assert.equal(wxApi.manager.started.lang, 'zh_CN')
  assert.deepEqual(events, [['start'], ['result', 'final text'], ['stop']])
})

test('voice controller reports unsupported runtime without throwing', async () => {
  const controller = createVoiceRecognitionController({ uniApi: createFakeUni(), wxApi: {} })

  assert.equal(controller.isSupported(), false)
  assert.deepEqual(await controller.start(), { ok: false, reason: 'unsupported' })
})
