# WeChat Voice Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build WeChat mini program voice input that asks for microphone permission on the first voice tap, auto-listens while the mini program is in the foreground, converts recognized speech to text, and sends that text through the existing chat flow.

**Architecture:** Add a focused WeChatSI recognition adapter in `common/`, keep `HomeComposer.vue` as a presentational/interaction component that emits voice requests, and let `pages/index/index.vue` own foreground lifecycle and message sending. Recognition results reuse the existing `handleSendMessage(question)` function so chat persistence and streaming behavior stay unchanged.

**Tech Stack:** uni-app, Vue 3 `<script setup>`, WeChat mini program runtime APIs, WeChatSI plugin, Node built-in test runner.

## Global Constraints

- Target platform is WeChat mini program.
- "Background listening" means foreground auto-listening while the mini program is open or returns to the foreground; stop on page/app hide.
- Use `wx.getPlugin('WechatSI').getRecordRecognitionManager()` when available.
- Request `scope.record` microphone authorization before enabling auto-listening.
- Do not add a backend speech-to-text service for this version.
- Non-WeChat runtimes must degrade gracefully with an unsupported message.
- Existing chat sending must continue through `handleSendMessage(text)`.
- Node tests cannot exercise real WeChat microphone APIs; add structure and adapter tests.

---

## File Structure

- Create `common/wechat-voice-recognition.mjs`: runtime-safe adapter for WeChatSI recognition, permission helpers, and preference persistence.
- Modify `manifest.json`: declare the WeChatSI plugin under `mp-weixin.plugins`.
- Modify `components/home/HomeComposer.vue`: expose voice props/events and show controlled voice state.
- Modify `pages/index/index.vue`: own voice lifecycle, start/stop recognition on show/hide, and send recognition results.
- Modify `tests/uniapp-structure.spec.mjs`: add structure tests for manifest, composer events, and index lifecycle wiring.
- Create `tests/wechat-voice-recognition.spec.mjs`: unit tests for the adapter with fake `uni` and `wx` runtimes.

---

### Task 1: WeChatSI Adapter And Manifest

**Files:**
- Create: `common/wechat-voice-recognition.mjs`
- Modify: `manifest.json`
- Create: `tests/wechat-voice-recognition.spec.mjs`
- Modify: `tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Produces:
  - `VOICE_AUTO_LISTENING_STORAGE_KEY: string`
  - `createVoiceRecognitionController(options?: { uniApi?: object, wxApi?: object, storageKey?: string }): object`
  - Controller methods: `isSupported(): boolean`, `getAutoListeningEnabled(): boolean`, `setAutoListeningEnabled(enabled: boolean): void`, `requestRecordPermission(): Promise<{ ok: boolean, reason?: string, error?: unknown }>`, `start(callbacks?: object): Promise<{ ok: boolean, reason?: string, error?: unknown }>`, `stop(): void`, `isListening(): boolean`
- Consumes: WeChat runtime globals `uni` and `wx`, injected as `uniApi` and `wxApi` in tests.

- [ ] **Step 1: Write the failing adapter test**

Add `tests/wechat-voice-recognition.spec.mjs`:

```js
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
      this.callbacks.stop?.({ result: '最终文本' })
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
  assert.deepEqual(events, [['start'], ['result', '最终文本'], ['stop']])
})

test('voice controller reports unsupported runtime without throwing', async () => {
  const controller = createVoiceRecognitionController({ uniApi: createFakeUni(), wxApi: {} })

  assert.equal(controller.isSupported(), false)
  assert.deepEqual(await controller.start(), { ok: false, reason: 'unsupported' })
})
```

- [ ] **Step 2: Write the failing structure test**

Append assertions to `tests/uniapp-structure.spec.mjs` in a new `test('wechat voice input structure is wired', ...)` block:

```js
test('wechat voice input structure is wired', () => {
  const manifest = JSON.parse(read('manifest.json'))
  const voiceApi = read('common/wechat-voice-recognition.mjs')

  assert.equal(manifest['mp-weixin'].plugins.WechatSI.version, '0.3.5')
  assert.equal(manifest['mp-weixin'].plugins.WechatSI.provider, 'wx069ba97219f66d99')
  assert.equal(count(voiceApi, 'createVoiceRecognitionController'), 1)
  assert.equal(count(voiceApi, 'VOICE_AUTO_LISTENING_STORAGE_KEY'), 2)
  assert.equal(voiceApi.includes("wxApi.getPlugin('WechatSI')"), true)
  assert.equal(voiceApi.includes("scope: 'scope.record'"), true)
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm run check:uniapp
```

Expected: FAIL because `common/wechat-voice-recognition.mjs` does not exist and `manifest.json` does not yet declare `mp-weixin.plugins.WechatSI`.

- [ ] **Step 4: Implement the adapter**

Create `common/wechat-voice-recognition.mjs`:

```js
export const VOICE_AUTO_LISTENING_STORAGE_KEY = 'emotion-ai:voice-auto-listening-enabled'

const DEFAULT_RECOGNITION_OPTIONS = {
  duration: 60000,
  lang: 'zh_CN',
}

const resolveUniApi = (uniApi) => {
  if (uniApi) return uniApi
  if (typeof uni !== 'undefined') return uni
  return null
}

const resolveWxApi = (wxApi) => {
  if (wxApi) return wxApi
  if (typeof wx !== 'undefined') return wx
  return null
}

const normalizeResultText = (payload) => {
  if (!payload) return ''
  if (typeof payload === 'string') return payload.trim()
  return String(payload.result || payload.text || '').trim()
}

const createPermissionResult = (ok, reason, error) => {
  if (ok) return { ok: true }
  return error === undefined ? { ok: false, reason } : { ok: false, reason, error }
}

export function createVoiceRecognitionController(options = {}) {
  const uniApi = resolveUniApi(options.uniApi)
  const wxApi = resolveWxApi(options.wxApi)
  const storageKey = options.storageKey || VOICE_AUTO_LISTENING_STORAGE_KEY
  let manager = null
  let listening = false
  let callbacks = {}

  const getManager = () => {
    if (manager) return manager
    if (!wxApi || typeof wxApi.getPlugin !== 'function') return null

    const plugin = wxApi.getPlugin('WechatSI')
    if (!plugin || typeof plugin.getRecordRecognitionManager !== 'function') return null

    manager = plugin.getRecordRecognitionManager()
    if (!manager) return null

    manager.onStart?.(() => {
      listening = true
      callbacks.onStart?.()
    })
    manager.onRecognize?.((payload) => {
      const text = normalizeResultText(payload)
      if (text) callbacks.onRecognize?.(text, payload)
    })
    manager.onStop?.((payload) => {
      const text = normalizeResultText(payload)
      listening = false
      if (text) callbacks.onResult?.(text, payload)
      callbacks.onStop?.(payload)
    })
    manager.onError?.((error) => {
      listening = false
      callbacks.onError?.(error)
    })

    return manager
  }

  return {
    isSupported() {
      return Boolean(getManager())
    },

    getAutoListeningEnabled() {
      if (!uniApi || typeof uniApi.getStorageSync !== 'function') return false
      return uniApi.getStorageSync(storageKey) === true
    },

    setAutoListeningEnabled(enabled) {
      if (!uniApi || typeof uniApi.setStorageSync !== 'function') return
      uniApi.setStorageSync(storageKey, Boolean(enabled))
    },

    requestRecordPermission() {
      if (!uniApi || typeof uniApi.authorize !== 'function') {
        return Promise.resolve(createPermissionResult(false, 'permission-api-unavailable'))
      }

      return new Promise((resolve) => {
        uniApi.authorize({
          scope: 'scope.record',
          success: () => resolve(createPermissionResult(true)),
          fail: (error) => resolve(createPermissionResult(false, 'permission-denied', error)),
        })
      })
    },

    async start(nextCallbacks = {}) {
      const recognitionManager = getManager()

      if (!recognitionManager) return { ok: false, reason: 'unsupported' }
      if (listening) return { ok: false, reason: 'already-listening' }

      callbacks = nextCallbacks
      listening = true
      recognitionManager.start({
        ...DEFAULT_RECOGNITION_OPTIONS,
        ...nextCallbacks.options,
      })

      return { ok: true }
    },

    stop() {
      if (!manager || !listening) return
      manager.stop()
    },

    isListening() {
      return listening
    },
  }
}
```

- [ ] **Step 5: Update manifest plugin declaration**

Modify `manifest.json` so `mp-weixin` includes:

```json
"mp-weixin": {
  "appid": "",
  "plugins": {
    "WechatSI": {
      "version": "0.3.5",
      "provider": "wx069ba97219f66d99"
    }
  }
}
```

- [ ] **Step 6: Run tests to verify adapter passes**

Run:

```bash
npm run check:uniapp
```

Expected: PASS for the new adapter and structure tests, unless pre-existing unrelated tests fail. If any existing test fails, record the failure before changing unrelated code.

- [ ] **Step 7: Commit**

```bash
git add common/wechat-voice-recognition.mjs manifest.json tests/wechat-voice-recognition.spec.mjs tests/uniapp-structure.spec.mjs
git commit -m "feat: add wechat voice recognition adapter"
```

---

### Task 2: Controlled Voice Composer

**Files:**
- Modify: `components/home/HomeComposer.vue`
- Modify: `tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes page props:
  - `voiceListening: boolean`
  - `voiceEnabled: boolean`
  - `voiceSupported: boolean`
  - `voiceStatusText: string`
- Produces component events:
  - `send(message: string)`
  - `voice-enable-requested`
  - `voice-disable-requested`

- [ ] **Step 1: Write the failing structure test**

Append assertions to the voice structure test in `tests/uniapp-structure.spec.mjs`:

```js
  const composer = read('components/home/HomeComposer.vue')

  assert.equal(composer.includes("defineProps({"), true)
  assert.equal(composer.includes("voiceListening: {"), true)
  assert.equal(composer.includes("voiceEnabled: {"), true)
  assert.equal(composer.includes("voiceSupported: {"), true)
  assert.equal(composer.includes("voiceStatusText: {"), true)
  assert.equal(composer.includes("defineEmits(['send', 'voice-enable-requested', 'voice-disable-requested'])"), true)
  assert.equal(composer.includes("emit('voice-enable-requested')"), true)
  assert.equal(composer.includes("emit('voice-disable-requested')"), true)
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run check:uniapp
```

Expected: FAIL because `HomeComposer.vue` still keeps local-only voice state and only declares `send`.

- [ ] **Step 3: Implement controlled voice props and events**

In `components/home/HomeComposer.vue`, replace the script block with:

```vue
<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  voiceListening: {
    type: Boolean,
    default: false,
  },
  voiceEnabled: {
    type: Boolean,
    default: false,
  },
  voiceSupported: {
    type: Boolean,
    default: true,
  },
  voiceStatusText: {
    type: String,
    default: '点按开启语音输入',
  },
})

const emit = defineEmits(['send', 'voice-enable-requested', 'voice-disable-requested'])
const isVoiceMode = ref(false)
const textValue = ref('')
const voiceWaveBars = [18, 28, 42, 24, 34, 50, 30, 40, 22]

const isVoiceInputActive = computed(() => props.voiceListening)

const toggleVoiceMode = () => {
  isVoiceMode.value = !isVoiceMode.value

  if (isVoiceMode.value) {
    emit('voice-enable-requested')
    return
  }

  emit('voice-disable-requested')
}

const startVoiceInput = () => {
  if (!isVoiceMode.value || props.voiceEnabled || !props.voiceSupported) return
  emit('voice-enable-requested')
}

const stopVoiceInput = () => {}

const sendTextMessage = () => {
  const message = textValue.value.trim()

  if (!message) return

  emit('send', message)
  textValue.value = ''
}
</script>
```

In the voice input template, add status text inside `<view v-if="isVoiceMode" class="voice-input">` after the wave:

```vue
<text class="voice-status">{{ voiceStatusText }}</text>
```

Add CSS:

```scss
.voice-status {
  flex: 0 0 auto;
  max-width: 220rpx;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 4: Run tests to verify composer passes**

Run:

```bash
npm run check:uniapp
```

Expected: PASS for composer structure tests, unless pre-existing unrelated tests fail.

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeComposer.vue tests/uniapp-structure.spec.mjs
git commit -m "feat: expose controlled voice composer state"
```

---

### Task 3: Page Voice Lifecycle And Sending

**Files:**
- Modify: `pages/index/index.vue`
- Modify: `tests/uniapp-structure.spec.mjs`

**Interfaces:**
- Consumes from Task 1:
  - `createVoiceRecognitionController()`
- Consumes from Task 2:
  - `HomeComposer` voice props and events
- Produces:
  - `enableVoiceInput(): Promise<void>`
  - `disableVoiceInput(): void`
  - `startVoiceListening(): Promise<void>`
  - `stopVoiceListening(): void`
  - `handleVoiceResult(text: string): Promise<void>`

- [ ] **Step 1: Write the failing structure test**

Append assertions to the voice structure test in `tests/uniapp-structure.spec.mjs`:

```js
  const indexPage = read('pages/index/index.vue')

  assert.equal(indexPage.includes("import { onBeforeUnmount, ref } from 'vue'"), false)
  assert.equal(indexPage.includes("createVoiceRecognitionController"), true)
  assert.equal(indexPage.includes("const voiceRecognition = createVoiceRecognitionController()"), true)
  assert.equal(indexPage.includes("const enableVoiceInput = async () =>"), true)
  assert.equal(indexPage.includes("const disableVoiceInput = () =>"), true)
  assert.equal(indexPage.includes("const startVoiceListening = async () =>"), true)
  assert.equal(indexPage.includes("const stopVoiceListening = () =>"), true)
  assert.equal(indexPage.includes("const handleVoiceResult = async (text) =>"), true)
  assert.equal(indexPage.includes("await handleSendMessage(recognizedText)"), true)
  assert.equal(indexPage.includes("onShow(() => {"), true)
  assert.equal(indexPage.includes("onHide(() => {"), true)
  assert.equal(indexPage.includes("@voice-enable-requested=\"enableVoiceInput\""), true)
  assert.equal(indexPage.includes("@voice-disable-requested=\"disableVoiceInput\""), true)
  assert.equal(indexPage.includes(":voice-listening=\"voiceListening\""), true)
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run check:uniapp
```

Expected: FAIL because `pages/index/index.vue` has no voice lifecycle wiring.

- [ ] **Step 3: Import lifecycle hooks and adapter**

Change the top imports in `pages/index/index.vue` from:

```js
import { computed, onBeforeUnmount, ref } from 'vue'
```

to:

```js
import { computed, onBeforeUnmount, ref } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
```

Add after existing `chat-api.mjs` import:

```js
import { createVoiceRecognitionController } from '../../common/wechat-voice-recognition.mjs'
```

If the project does not have `@dcloudio/uni-app` available in Node tests, use direct uni-app page lifecycle functions in a normal `<script>` block instead. Keep the final code containing `onShow(() => {` and `onHide(() => {` so the structure test verifies lifecycle wiring.

- [ ] **Step 4: Add voice state and helpers**

After the existing high-level refs near `isSendingMessage`, add:

```js
const voiceRecognition = createVoiceRecognitionController()
const voiceEnabled = ref(false)
const voiceListening = ref(false)
const voiceSupported = ref(voiceRecognition.isSupported())
const voiceStatusText = ref('点按开启语音输入')
const appInForeground = ref(true)

const canAutoListen = () =>
  appInForeground.value &&
  voiceEnabled.value &&
  voiceSupported.value &&
  !voiceListening.value &&
  !isSendingMessage.value &&
  currentScreen.value !== 'login' &&
  currentScreen.value !== 'settings'

const stopVoiceListening = () => {
  voiceRecognition.stop()
  voiceListening.value = false
}

const handleVoiceResult = async (text) => {
  const recognizedText = text.trim()

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
```

- [ ] **Step 5: Wire lifecycle hooks**

Before `onBeforeUnmount`, add:

```js
onShow(() => {
  appInForeground.value = true
  voiceEnabled.value = voiceRecognition.getAutoListeningEnabled()
  voiceSupported.value = voiceRecognition.isSupported()
  if (voiceEnabled.value) startVoiceListening()
})

onHide(() => {
  appInForeground.value = false
  stopVoiceListening()
})
```

Inside the existing `onBeforeUnmount` callback, add:

```js
  stopVoiceListening()
```

- [ ] **Step 6: Pause voice while sending**

At the start of `handleSendMessage`, after the empty/sending guard and before `completeIntroTextStream()`, add:

```js
  stopVoiceListening()
```

In the `finally` block of `handleSendMessage`, after `isSendingMessage.value = false`, add:

```js
    if (canAutoListen()) startVoiceListening()
```

- [ ] **Step 7: Bind `HomeComposer` props and events**

Replace:

```vue
<HomeComposer @send="handleSendMessage" />
```

with:

```vue
<HomeComposer
  :voice-listening="voiceListening"
  :voice-enabled="voiceEnabled"
  :voice-supported="voiceSupported"
  :voice-status-text="voiceStatusText"
  @send="handleSendMessage"
  @voice-enable-requested="enableVoiceInput"
  @voice-disable-requested="disableVoiceInput"
/>
```

Apply the same bindings to the `HomeFeatureScreen` `@send` composer only if that component internally renders `HomeComposer`. If it does not render the composer, leave it unchanged.

- [ ] **Step 8: Run tests to verify page wiring passes**

Run:

```bash
npm run check:uniapp
```

Expected: PASS for all Node structure and API tests, unless pre-existing unrelated tests fail.

- [ ] **Step 9: Commit**

```bash
git add pages/index/index.vue tests/uniapp-structure.spec.mjs
git commit -m "feat: wire voice recognition into chat"
```

---

## Final Verification

- [ ] Run `npm run check:uniapp` from `emotion-frontend`.
- [ ] Confirm `manifest.json` contains WeChatSI plugin declaration.
- [ ] In WeChat DevTools, add/enable the WeChatSI plugin in project settings or mini program console.
- [ ] Launch the mini program, tap the voice button, grant microphone permission, speak a short sentence, and confirm the recognized text appears as a user chat message.
- [ ] Hide and show the mini program; confirm listening stops on hide and resumes on show if voice is still enabled.
- [ ] Deny microphone permission in settings; confirm the UI shows a permission message and the app does not crash.

---

## Self-Review

- Spec coverage: Task 1 covers WeChatSI, permission, preference, graceful unsupported runtime, and manifest. Task 2 covers controlled composer UI/events. Task 3 covers foreground lifecycle, stop-on-hide, result-to-chat sending, and send-in-progress guards. Final verification covers manual WeChat DevTools behavior.
- Wording scan: No unresolved marker wording remains.
- Type consistency: Adapter names and page methods match across tasks.
