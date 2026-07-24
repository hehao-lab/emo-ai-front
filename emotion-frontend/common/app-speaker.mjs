const DEFAULT_SPEECH_OPTIONS = {
  pitch: 1,
  rate: 1,
}

const resolvePlusApi = (plusApi) => {
  if (plusApi) return plusApi
  if (typeof plus !== 'undefined') return plus
  return null
}

const createAndroidEngineFactory = (plusApi) => {
  const android = plusApi?.android
  if (
    typeof android?.importClass !== 'function' ||
    typeof android?.implements !== 'function' ||
    typeof android?.runtimeMainActivity !== 'function'
  ) {
    return null
  }

  return () => new Promise((resolve, reject) => {
    let engine = null

    try {
      const TextToSpeech = android.importClass('android.speech.tts.TextToSpeech')
      const Locale = android.importClass('java.util.Locale')
      const activity = android.runtimeMainActivity()
      const listener = android.implements(
        'android.speech.tts.TextToSpeech$OnInitListener',
        {
          onInit(status) {
            if (Number(status) !== 0 || !engine) {
              reject(new Error(`Android TextToSpeech initialization failed (${status})`))
              return
            }

            const locale = Locale.CHINA || new Locale('zh', 'CN')
            const languageStatus = Number(engine.setLanguage(locale))
            if (languageStatus < -1) {
              engine.shutdown?.()
              reject(new Error('Chinese TextToSpeech language data is unavailable'))
              return
            }

            resolve({
              speak(text, speechOptions = {}) {
                const settings = { ...DEFAULT_SPEECH_OPTIONS, ...speechOptions }
                engine.setPitch?.(Number(settings.pitch) || DEFAULT_SPEECH_OPTIONS.pitch)
                engine.setSpeechRate?.(Number(settings.rate) || DEFAULT_SPEECH_OPTIONS.rate)
                const queueFlush = Number.isFinite(Number(TextToSpeech.QUEUE_FLUSH))
                  ? Number(TextToSpeech.QUEUE_FLUSH)
                  : 0
                return engine.speak(text, queueFlush, null, `emotion-ai-${Date.now()}`)
              },
              stop() {
                engine.stop?.()
              },
              destroy() {
                engine.stop?.()
                engine.shutdown?.()
              },
            })
          },
        },
      )

      engine = new TextToSpeech(activity, listener)
    } catch (error) {
      reject(error)
    }
  })
}

export function createAppSpeaker(options = {}) {
  const plusApi = resolvePlusApi(options.plusApi)
  const engineFactory = options.engineFactory || createAndroidEngineFactory(plusApi)
  let enginePromise = null
  let engine = null
  let playbackToken = 0

  const getEngine = async () => {
    if (engine) return engine
    if (!engineFactory) return null

    if (!enginePromise) {
      enginePromise = Promise.resolve()
        .then(() => engineFactory())
        .then((nextEngine) => {
          engine = nextEngine
          return nextEngine
        })
        .catch((error) => {
          enginePromise = null
          throw error
        })
    }

    return enginePromise
  }

  const stop = () => {
    playbackToken += 1
    engine?.stop?.()
  }

  return {
    isSupported() {
      return Boolean(engineFactory)
    },

    stop,

    destroy() {
      stop()
      engine?.destroy?.()
      engine = null
      enginePromise = null
    },

    async speak(text, speechOptions = {}) {
      const content = String(text || '').trim()
      if (!content) return { ok: false, reason: 'empty-text' }
      if (!engineFactory) return { ok: false, reason: 'unsupported' }

      stop()
      const currentPlaybackToken = playbackToken

      try {
        const nextEngine = await getEngine()
        if (currentPlaybackToken !== playbackToken) return { ok: false, reason: 'stopped' }
        if (!nextEngine) return { ok: false, reason: 'unsupported' }

        const status = await nextEngine.speak(content, speechOptions)
        if (Number(status) < 0) return { ok: false, reason: 'tts-failed' }
        return { ok: true }
      } catch (error) {
        return { ok: false, reason: 'tts-failed', error }
      }
    },
  }
}
