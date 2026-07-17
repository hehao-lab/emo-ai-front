const DEFAULT_TTS_OPTIONS = {
  lang: 'zh_CN',
  tts: true,
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

const normalizeAudioUrl = (payload) => (
  payload?.filename || payload?.tempFilePath || payload?.url || ''
)

export function createWechatSpeaker(options = {}) {
  const uniApi = resolveUniApi(options.uniApi)
  const wxApi = resolveWxApi(options.wxApi)
  let plugin = null
  let audioContext = null
  let playbackToken = 0

  const getPlugin = () => {
    if (plugin) return plugin
    if (!wxApi || typeof wxApi.getPlugin !== 'function') return null

    try {
      plugin = wxApi.getPlugin('WechatSI')
    } catch (error) {
      return null
    }

    return plugin && typeof plugin.textToSpeech === 'function' ? plugin : null
  }

  const stop = () => {
    playbackToken += 1
    if (!audioContext) return

    audioContext.stop?.()
    audioContext.destroy?.()
    audioContext = null
  }

  const createAudioContext = () => {
    if (!uniApi || typeof uniApi.createInnerAudioContext !== 'function') return null
    return uniApi.createInnerAudioContext()
  }

  return {
    isSupported() {
      return Boolean(getPlugin() && createAudioContext())
    },

    stop,

    async speak(text, nextOptions = {}) {
      const content = String(text || '').trim()

      if (!content) return { ok: false, reason: 'empty-text' }

      const speechPlugin = getPlugin()
      if (!speechPlugin) return { ok: false, reason: 'unsupported' }

      const nextAudioContext = createAudioContext()
      if (!nextAudioContext) return { ok: false, reason: 'unsupported' }

      stop()
      audioContext = nextAudioContext
      const currentPlaybackToken = playbackToken

      return new Promise((resolve) => {
        speechPlugin.textToSpeech({
          ...DEFAULT_TTS_OPTIONS,
          ...nextOptions,
          content,
          success: (payload) => {
            if (currentPlaybackToken !== playbackToken || audioContext !== nextAudioContext) {
              resolve({ ok: false, reason: 'stopped' })
              return
            }

            const audioUrl = normalizeAudioUrl(payload)

            if (!audioUrl) {
              stop()
              resolve({ ok: false, reason: 'empty-audio' })
              return
            }

            nextAudioContext.src = audioUrl
            nextAudioContext.play?.()
            resolve({ ok: true })
          },
          fail: (error) => {
            stop()
            resolve({ ok: false, reason: 'tts-failed', error })
          },
        })
      })
    },
  }
}
