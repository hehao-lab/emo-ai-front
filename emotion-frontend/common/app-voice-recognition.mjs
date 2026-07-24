export const VOICE_AUTO_LISTENING_STORAGE_KEY = 'emotion-ai:voice-auto-listening-enabled'

const RECORD_AUDIO_PERMISSION = 'android.permission.RECORD_AUDIO'

const DEFAULT_RECOGNITION_OPTIONS = {
  continue: false,
  engine: 'baidu',
  lang: 'zh-cn',
  punctuation: true,
  userInterface: false,
}

const resolveUniApi = (uniApi) => {
  if (uniApi) return uniApi
  if (typeof uni !== 'undefined') return uni
  return null
}

const resolvePlusApi = (plusApi) => {
  if (plusApi) return plusApi
  if (typeof plus !== 'undefined') return plus
  return null
}

const normalizeResultText = (payload) => {
  if (!payload) return ''
  if (typeof payload === 'string') return payload.trim()
  return String(payload.result || payload.text || '').trim()
}

const permissionResult = (ok, reason, error) => {
  if (ok) return { ok: true }
  return error === undefined ? { ok: false, reason } : { ok: false, reason, error }
}

export function createAppVoiceRecognitionController(options = {}) {
  const uniApi = resolveUniApi(options.uniApi)
  const plusApi = resolvePlusApi(options.plusApi)
  const storageKey = options.storageKey || VOICE_AUTO_LISTENING_STORAGE_KEY
  let listening = false

  const getSpeechApi = () => {
    const speech = plusApi?.speech
    return typeof speech?.startRecognize === 'function' ? speech : null
  }

  const requestAndroidPermission = () => {
    const android = plusApi?.android
    if (typeof android?.requestPermissions !== 'function') return null

    return new Promise((resolve) => {
      android.requestPermissions(
        [RECORD_AUDIO_PERMISSION],
        (result = {}) => {
          const denied = [
            ...(result.deniedPresent || []),
            ...(result.deniedAlways || []),
          ]
          resolve(denied.length === 0
            ? permissionResult(true)
            : permissionResult(false, 'permission-denied', result))
        },
        (error) => resolve(permissionResult(false, 'permission-request-failed', error)),
      )
    })
  }

  return {
    isSupported() {
      return Boolean(getSpeechApi())
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
      const androidPermission = requestAndroidPermission()
      if (androidPermission) return androidPermission
      return Promise.resolve(permissionResult(false, 'permission-api-unavailable'))
    },

    async start(callbacks = {}) {
      const speech = getSpeechApi()

      if (!speech) return { ok: false, reason: 'unsupported' }
      if (listening) return { ok: false, reason: 'already-listening' }

      listening = true

      try {
        speech.startRecognize(
          {
            ...DEFAULT_RECOGNITION_OPTIONS,
            ...callbacks.options,
          },
          (payload) => {
            const text = normalizeResultText(payload)
            listening = false
            if (text) callbacks.onResult?.(text, payload)
            callbacks.onStop?.(payload)
          },
          (error) => {
            listening = false
            callbacks.onError?.(error)
          },
        )
        callbacks.onStart?.()
        return { ok: true }
      } catch (error) {
        listening = false
        callbacks.onError?.(error)
        return { ok: false, reason: 'recognition-start-failed', error }
      }
    },

    stop() {
      if (!listening) return
      listening = false
      getSpeechApi()?.stopRecognize?.()
    },

    isListening() {
      return listening
    },
  }
}
