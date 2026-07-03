# WeChat Mini Program Voice Input Design

## Goal

Add real voice input for the WeChat mini program build. The user taps the voice entry once to grant microphone access. After that, when the user enters or returns to the mini program foreground, the app starts listening automatically, converts speech to text, and sends the recognized text into the existing chat conversation.

## Platform Boundary

The implementation targets WeChat mini program. A mini program cannot keep arbitrary microphone recognition running after the app is hidden or suspended. "Background listening" therefore means foreground auto-listening while the mini program is open or returns to the foreground. The recorder stops on page/app hide and resumes on show if the user has enabled voice listening and microphone permission remains available.

## Recommended Approach

Use the WeChatSI speech recognition plugin through `wx.getPlugin('WechatSI').getRecordRecognitionManager()` in the mini program runtime.

This avoids adding a backend speech-to-text service for the first version, keeps audio processing inside the mini program ecosystem, and only sends recognized text through the existing chat API. Non-WeChat runtimes should degrade gracefully by showing an unsupported message instead of breaking the composer.

## Components

### Voice Recognition Adapter

Add `common/wechat-voice-recognition.mjs` as a small adapter around the WeChat plugin.

Responsibilities:

- Detect whether WeChatSI recognition is available.
- Request or verify `scope.record` microphone permission.
- Start and stop recognition with a single active session guard.
- Normalize recognition manager callbacks into simple events: `start`, `result`, `error`, `stop`.
- Expose storage keys for the user's voice-listening preference.
- Avoid importing browser-only or Node-only APIs so existing structure tests can run.

### Home Composer

`components/home/HomeComposer.vue` keeps the existing visual voice UI, but becomes controlled by the page through props/events.

Responsibilities:

- Let the first voice tap request permission and enable auto-listening.
- Show listening state, unavailable state, and simple status text.
- Emit `voice-enable-requested`, `voice-disable-requested`, and normal `send`.
- Avoid sending empty recognized text.

### Home Page

`pages/index/index.vue` owns the recognition lifecycle because it already owns chat sending.

Responsibilities:

- Load saved voice-listening preference on page/app show.
- Start recognition when the app is in the foreground, the user has enabled voice listening, no message is currently being sent, and the current screen is the home/chat screen.
- Stop recognition on hide, before unmount, when the user disables voice listening, or while a chat message is being sent.
- On final recognition result, call the existing `handleSendMessage(text)` flow.
- Restart listening after a completed result if auto-listening is still enabled and the app remains in the foreground.

## Data Flow

1. User taps the voice button in `HomeComposer`.
2. `HomeComposer` emits `voice-enable-requested`.
3. `pages/index/index.vue` calls the adapter to request `scope.record`.
4. If permission succeeds, the page stores the auto-listening preference and starts WeChatSI recognition.
5. WeChatSI returns recognized text through its result callback.
6. The page trims the recognized text and calls `handleSendMessage(text)`.
7. Existing chat logic creates the user message, streams the assistant response, and syncs the conversation record.
8. When sending finishes, foreground auto-listening resumes if still enabled.

## Error Handling

- Permission denied: keep voice listening disabled, show a toast asking the user to enable microphone permission in settings.
- Plugin unavailable: show a toast that WeChat mini program voice recognition is unavailable in this runtime.
- Empty result: ignore and restart listening if auto-listening remains enabled.
- Recognition error: update composer status, stop the current session, and allow the next foreground resume or user tap to retry.
- Sending in progress: do not start a new recognition session until the current chat request completes.

## Configuration

`manifest.json` must declare the WeChatSI plugin for the `mp-weixin` build. The app owner must also add the plugin in the WeChat mini program management console.

## Testing

Add focused structure and adapter tests that can run with the current Node test setup:

- Adapter exports availability, permission, lifecycle, and preference helpers.
- Composer exposes voice events and no longer keeps all voice behavior as visual-only local state.
- Index page imports the adapter, handles voice result by reusing `handleSendMessage`, and stops recognition on hide/unmount.
- Manifest includes the WeChatSI plugin declaration.

Manual WeChat DevTools verification remains required for real microphone authorization and speech recognition, because Node tests cannot exercise WeChat runtime APIs.
