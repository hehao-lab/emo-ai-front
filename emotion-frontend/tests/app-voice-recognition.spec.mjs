import assert from 'node:assert/strict'
import test from 'node:test'

import {
  VOICE_AUTO_LISTENING_STORAGE_KEY,
  createAppVoiceRecognitionController,
} from '../common/app-voice-recognition.mjs'

function createFakeUni() {
  const storage = new Map()

  return {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
  }
}

function createFakePlus({ permissionDenied = false } = {}) {
  const speech = {
    options: null,
    success: null,
    failure: null,
    stopped: false,
    startRecognize(options, success, failure) {
      this.options = options
      this.success = success
      this.failure = failure
    },
    stopRecognize() {
      this.stopped = true
    },
  }

  return {
    speech,
    android: {
      requestedPermissions: [],
      requestPermissions(permissions, success) {
        this.requestedPermissions.push(...permissions)
        success(permissionDenied
          ? { deniedAlways: permissions }
          : { granted: permissions })
      },
    },
  }
}

test('app voice controller stores auto-listening preference with a stable key', () => {
  const uniApi = createFakeUni()
  const controller = createAppVoiceRecognitionController({ uniApi, plusApi: createFakePlus() })

  assert.equal(VOICE_AUTO_LISTENING_STORAGE_KEY, 'emotion-ai:voice-auto-listening-enabled')
  assert.equal(controller.getAutoListeningEnabled(), false)

  controller.setAutoListeningEnabled(true)
  assert.equal(controller.getAutoListeningEnabled(), true)
})

test('app voice controller requests the Android microphone permission', async () => {
  const plusApi = createFakePlus()
  const controller = createAppVoiceRecognitionController({ uniApi: createFakeUni(), plusApi })

  assert.deepEqual(await controller.requestRecordPermission(), { ok: true })
  assert.deepEqual(plusApi.android.requestedPermissions, ['android.permission.RECORD_AUDIO'])
})

test('app voice controller reports a permanently denied microphone permission', async () => {
  const controller = createAppVoiceRecognitionController({
    uniApi: createFakeUni(),
    plusApi: createFakePlus({ permissionDenied: true }),
  })

  const result = await controller.requestRecordPermission()

  assert.equal(result.ok, false)
  assert.equal(result.reason, 'permission-denied')
})

test('app voice controller starts HTML5+ speech recognition and emits its result', async () => {
  const plusApi = createFakePlus()
  const controller = createAppVoiceRecognitionController({ uniApi: createFakeUni(), plusApi })
  const events = []

  assert.deepEqual(await controller.start({
    onStart: () => events.push(['start']),
    onResult: (text) => events.push(['result', text]),
    onStop: () => events.push(['stop']),
  }), { ok: true })
  assert.deepEqual(await controller.start(), { ok: false, reason: 'already-listening' })

  plusApi.speech.success(' final text ')

  assert.equal(controller.isListening(), false)
  assert.equal(plusApi.speech.options.lang, 'zh-cn')
  assert.equal(plusApi.speech.options.engine, 'baidu')
  assert.deepEqual(events, [['start'], ['result', 'final text'], ['stop']])
})

test('app voice controller stops recognition and handles unsupported runtimes', async () => {
  const plusApi = createFakePlus()
  const controller = createAppVoiceRecognitionController({ uniApi: createFakeUni(), plusApi })

  await controller.start()
  controller.stop()

  assert.equal(controller.isListening(), false)
  assert.equal(plusApi.speech.stopped, true)

  const unsupported = createAppVoiceRecognitionController({ uniApi: createFakeUni(), plusApi: {} })
  assert.equal(unsupported.isSupported(), false)
  assert.deepEqual(await unsupported.start(), { ok: false, reason: 'unsupported' })
})
