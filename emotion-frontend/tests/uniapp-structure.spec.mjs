import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

function read(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
}

test('uni-app root files exist', () => {
  assert.equal(fs.existsSync(path.join(projectRoot, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'pages.json')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'manifest.json')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'main.js')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'App.vue')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'pages/index/index.vue')), true);
});

test('project is configured for Vue 3 uni-app and single page shell', () => {
  const packageJson = JSON.parse(read('package.json'));
  const mainEntry = read('main.js');
  const pages = JSON.parse(read('pages.json'));
  const indexPage = read('pages/index/index.vue');

  assert.equal(mainEntry.includes('createSSRApp'), true);
  assert.equal(packageJson.dependencies.vue.startsWith('^3.'), true);
  assert.equal(pages.pages[0].path, 'pages/index/index');
  assert.equal(pages.pages[0].style.navigationStyle, 'custom');
  assert.equal(indexPage.includes("const currentScreen = ref('login')"), true);
  assert.equal(indexPage.includes('@success="handleLoginSuccess"'), true);
});

test('login screen uses real login and register backend flows', () => {
  const loginScreen = read('components/login/LoginScreen.vue');

  assert.equal(loginScreen.includes("import { computed, ref } from 'vue'"), true);
  assert.equal(loginScreen.includes('loginUser'), true);
  assert.equal(loginScreen.includes('registerUser'), true);
  assert.equal(loginScreen.includes('sendRegisterEmailCode'), true);
  assert.equal(loginScreen.includes("phone: loginForm.value.phone"), true);
  assert.equal(loginScreen.includes("password: loginForm.value.password"), true);
  assert.equal(loginScreen.includes('verificationCode: registerForm.value.verificationCode'), true);
  assert.equal(loginScreen.includes('type="text"'), true);
  assert.equal(loginScreen.includes('inputmode="numeric"'), true);
  assert.equal(loginScreen.includes('type="number"'), false);
  assert.equal(loginScreen.includes('@input="handleLoginPhoneInput"'), true);
  assert.equal(loginScreen.includes('@input="handleRegisterCodeInput"'), true);
  assert.equal(loginScreen.includes('autocomplete="tel"'), true);
});

test('user api exposes unified request helpers and backend resource contracts', () => {
  const userApi = read('common/user-api.mjs');

  assert.equal(userApi.includes("const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'"), true);
  assert.equal(userApi.includes('Authorization: `Bearer ${accessToken}`'), true);
  assert.equal(userApi.includes("request('/v1/users/register/email-code'"), true);
  assert.equal(userApi.includes("request('/v1/users/register'"), true);
  assert.equal(userApi.includes("request('/v1/users/login'"), true);
  assert.equal(userApi.includes("request('/v1/auth/logout'"), true);
  assert.equal(userApi.includes("request('/v1/diaries'"), true);
  assert.equal(userApi.includes("request('/v1/mood-tags'"), true);
  assert.equal(userApi.includes('`/v1/chat/sessions${buildQuery(params)}`'), true);
  assert.equal(userApi.includes('`/v1/emotion/reports/overview${buildQuery(params)}`'), true);
  assert.equal(userApi.includes("request('/v1/system/about'"), true);
});

test('chat api keeps history on /v1/chat/sessions and sending on /api/v1/chat/stream', () => {
  const chatApi = read('common/chat-api.mjs');

  assert.equal(chatApi.includes("from './user-api.mjs'"), true);
  assert.equal(chatApi.includes('`/v1/chat/sessions${buildQuery({ page, pageSize, status })}`'), true);
  assert.equal(chatApi.includes('`/v1/chat/sessions/${sessionId}/messages${buildQuery({ page, pageSize })}`'), true);
  assert.equal(chatApi.includes("requestJson('/api/v1/chat'"), true);
  assert.equal(chatApi.includes("createApiUrl('/api/v1/chat/stream', baseUrl)"), true);
  assert.equal(chatApi.includes("Accept: 'text/event-stream'"), true);
  assert.equal(chatApi.includes('Authorization: `Bearer ${token}`'), true);
  assert.equal(chatApi.includes("'X-User-Id': userId"), false);
});

test('settings screen includes detail keys and calls backend logout', () => {
  const settingsScreen = read('components/settings/SettingsScreen.vue');

  assert.equal(settingsScreen.includes('logoutAuth'), true);
  assert.match(settingsScreen, /mood:\s*\{\s*key:\s*'mood'/);
  assert.match(settingsScreen, /history:\s*\{\s*key:\s*'history'/);
  assert.match(settingsScreen, /report:\s*\{\s*key:\s*'report'/);
  assert.match(settingsScreen, /privacy:\s*\{\s*key:\s*'privacy'/);
  assert.match(settingsScreen, /about:\s*\{\s*key:\s*'about'/);
  assert.equal(settingsScreen.includes("defineEmits(['back', 'logout', 'open-chat'])"), true);
  assert.equal(settingsScreen.includes('@open-chat="emit(\'open-chat\', $event)"'), true);
});

test('settings detail opens backend-backed diary, history, report, security, and about data', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('fetchMoodTags'), true);
  assert.equal(detailScreen.includes('fetchDiaries'), true);
  assert.equal(detailScreen.includes('fetchDiary'), true);
  assert.equal(detailScreen.includes('createDiary'), true);
  assert.equal(detailScreen.includes('updateDiary'), true);
  assert.equal(detailScreen.includes('deleteDiary'), true);
  assert.equal(detailScreen.includes('fetchConversations'), true);
  assert.equal(detailScreen.includes('fetchEmotionOverviewReport'), true);
  assert.equal(detailScreen.includes('fetchLoginLogs'), true);
  assert.equal(detailScreen.includes('fetchSecurityTokens'), true);
  assert.equal(detailScreen.includes('fetchSystemAbout'), true);
  assert.equal(detailScreen.includes("watch(\n  () => props.detail.key"), true);
  assert.equal(detailScreen.includes("if (key === 'mood')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'history')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'report')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'privacy')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'about')"), true);
});

test('mood diary supports fullscreen writing and closes after save', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('const isDiaryFullscreen = ref(false)'), true);
  assert.equal(detailScreen.includes('const isDiarySaving = ref(false)'), true);
  assert.equal(detailScreen.includes('maxlength="-1"'), true);
  assert.equal(detailScreen.includes('v-if="isDiaryFullscreen" class="mood-diary-fullscreen"'), true);
  assert.equal(detailScreen.includes('class="mood-diary-fullscreen__input"'), true);
  assert.equal(detailScreen.includes("isDiaryFullscreen.value = false"), true);
  assert.equal(detailScreen.includes(':deep(.uni-textarea-textarea)'), true);
});

test('history consultation passes the whole backend chat record back to home', () => {
  const indexPage = read('pages/index/index.vue');
  const settingsScreen = read('components/settings/SettingsScreen.vue');
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(settingsScreen.includes(':chat-records="chatRecords"'), true);
  assert.equal(detailScreen.includes('const displayChatRecords = computed'), true);
  assert.equal(detailScreen.includes('v-for="chat in displayChatRecords"'), true);
  assert.equal(detailScreen.includes("@tap=\"emit('open-chat', chat)\""), true);
  assert.equal(indexPage.includes('const ensureChatRecord = (chatRecord) => {'), true);
  assert.equal(indexPage.includes('const openChatRecord = async (chatTarget) => {'), true);
  assert.equal(indexPage.includes("typeof chatTarget === 'object'"), true);
  assert.equal(indexPage.includes('fetchConversationMessages(chat.id, { userId })'), true);
});

test('home page connects login, settings, history, and streaming chat flow', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes("from '../../common/chat-api.mjs'"), true);
  assert.equal(indexPage.includes('const handleLoginSuccess = async () => {'), true);
  assert.equal(indexPage.includes('await loadConversationList()'), true);
  assert.equal(indexPage.includes('streamChatMessage({'), true);
  assert.equal(indexPage.includes('onDelta: (content) => {'), true);
  assert.equal(indexPage.includes('onDone: (payload) => {'), true);
  assert.equal(indexPage.includes('payload.conversation_id || payload.conversationId'), true);
  assert.equal(indexPage.includes('payload.assistant_message_id || payload.assistantMessageId'), true);
  assert.equal(indexPage.includes('@logout="backToLogin"'), true);
  assert.equal(indexPage.includes('@open-chat="openChatRecord"'), true);
});
