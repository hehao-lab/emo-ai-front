import assert from 'node:assert/strict'
import test from 'node:test'

import { createWechatSpeaker } from '../common/wechat-speaker.mjs'

function createFakeUni() {
  const audio = {
    src: '',
    stopped: false,
    destroyed: false,
    played: false,
    stop() {
      this.stopped = true
    },
    destroy() {
      this.destroyed = true
    },
    play() {
      this.played = true
    },
  }

  return {
    audio,
    createInnerAudioContext() {
      return audio
    },
  }
}

function createFakeWx({ fail = false } = {}) {
  return {
    requests: [],
    getPlugin(name) {
      assert.equal(name, 'WechatSI')
      return {
        textToSpeech: (options) => {
          this.requests.push(options)
          if (fail) {
            options.fail?.({ errMsg: 'tts failed' })
            return
          }
          options.success?.({ filename: 'https://example.test/tts.mp3' })
        },
      }
    },
  }
}

test('wechat speaker reports support only when plugin and audio are available', () => {
  assert.equal(createWechatSpeaker({ uniApi: createFakeUni(), wxApi: createFakeWx() }).isSupported(), true)
  assert.equal(createWechatSpeaker({ uniApi: {}, wxApi: createFakeWx() }).isSupported(), false)
  assert.equal(createWechatSpeaker({ uniApi: createFakeUni(), wxApi: {} }).isSupported(), false)
})

test('wechat speaker converts text to speech and plays returned audio', async () => {
  const uniApi = createFakeUni()
  const wxApi = createFakeWx()
  const speaker = createWechatSpeaker({ uniApi, wxApi })

  const result = await speaker.speak('你好')

  assert.deepEqual(result, { ok: true })
  assert.equal(wxApi.requests[0].content, '你好')
  assert.equal(wxApi.requests[0].lang, 'zh_CN')
  assert.equal(uniApi.audio.src, 'https://example.test/tts.mp3')
  assert.equal(uniApi.audio.played, true)
})

test('wechat speaker stops previous audio before starting a new playback', async () => {
  const uniApi = createFakeUni()
  const speaker = createWechatSpeaker({ uniApi, wxApi: createFakeWx() })

  await speaker.speak('first')
  await speaker.speak('second')

  assert.equal(uniApi.audio.stopped, true)
  assert.equal(uniApi.audio.destroyed, true)
})

test('wechat speaker ignores empty text and reports tts failures', async () => {
  const speaker = createWechatSpeaker({ uniApi: createFakeUni(), wxApi: createFakeWx({ fail: true }) })

  assert.deepEqual(await speaker.speak('  '), { ok: false, reason: 'empty-text' })

  const result = await speaker.speak('hello')

  assert.equal(result.ok, false)
  assert.equal(result.reason, 'tts-failed')
})

test('wechat speaker ignores late tts success after playback is stopped', async () => {
  const uniApi = createFakeUni()
  let pendingOptions = null
  const wxApi = {
    getPlugin() {
      return {
        textToSpeech(options) {
          pendingOptions = options
        },
      }
    },
  }
  const speaker = createWechatSpeaker({ uniApi, wxApi })

  const resultPromise = speaker.speak('hello')
  speaker.stop()
  pendingOptions.success({ filename: 'https://example.test/late.mp3' })

  assert.deepEqual(await resultPromise, { ok: false, reason: 'stopped' })
  assert.equal(uniApi.audio.played, false)
  assert.equal(uniApi.audio.destroyed, true)
})
