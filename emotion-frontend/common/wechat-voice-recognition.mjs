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

    let plugin = null

    try {
      plugin = wxApi.getPlugin('WechatSI')
    } catch (error) {
      return null
    }

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
