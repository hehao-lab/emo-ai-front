import assert from 'node:assert/strict'
import test from 'node:test'

import { createAppSpeaker } from '../common/app-speaker.mjs'

function createFakeEngine() {
  return {
    spoken: [],
    stopped: 0,
    destroyed: 0,
    speak(text, options) {
      this.spoken.push({ text, options })
      return 0
    },
    stop() {
      this.stopped += 1
    },
    destroy() {
      this.destroyed += 1
    },
  }
}

test('app speaker queues text through its Android speech engine', async () => {
  const engine = createFakeEngine()
  const speaker = createAppSpeaker({ engineFactory: async () => engine })

  assert.equal(speaker.isSupported(), true)
  assert.deepEqual(await speaker.speak('hello', { rate: 0.9 }), { ok: true })
  assert.deepEqual(engine.spoken, [{ text: 'hello', options: { rate: 0.9 } }])
})

test('app speaker stops and destroys the active engine', async () => {
  const engine = createFakeEngine()
  const speaker = createAppSpeaker({ engineFactory: async () => engine })

  await speaker.speak('first')
  speaker.stop()
  speaker.destroy()

  assert.equal(engine.stopped, 2)
  assert.equal(engine.destroyed, 1)
})

test('app speaker ignores empty text and reports unsupported runtimes', async () => {
  const speaker = createAppSpeaker({ plusApi: {} })

  assert.equal(speaker.isSupported(), false)
  assert.deepEqual(await speaker.speak('  '), { ok: false, reason: 'empty-text' })
  assert.deepEqual(await speaker.speak('hello'), { ok: false, reason: 'unsupported' })
})

test('app speaker reports native queue failures', async () => {
  const speaker = createAppSpeaker({
    engineFactory: async () => ({ speak: () => -1 }),
  })

  assert.deepEqual(await speaker.speak('hello'), { ok: false, reason: 'tts-failed' })
})

test('app speaker ignores an initialization that completes after stop', async () => {
  const engine = createFakeEngine()
  let finishInitialization
  const speaker = createAppSpeaker({
    engineFactory: () => new Promise((resolve) => {
      finishInitialization = () => resolve(engine)
    }),
  })

  const resultPromise = speaker.speak('hello')
  await Promise.resolve()
  speaker.stop()
  finishInitialization()

  assert.deepEqual(await resultPromise, { ok: false, reason: 'stopped' })
  assert.deepEqual(engine.spoken, [])
})
