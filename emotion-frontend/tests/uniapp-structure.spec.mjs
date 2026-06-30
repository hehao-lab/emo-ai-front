import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/work3/emotion AI/emotion-frontend');

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

test('index starts at login and switches to home after login success', () => {
  const indexPage = read('pages/index/index.vue');
  const loginScreenPath = path.join(projectRoot, 'components/login/LoginScreen.vue');

  assert.equal(fs.existsSync(loginScreenPath), true);
  assert.equal(indexPage.includes('LoginScreen'), true);
  assert.equal(indexPage.includes("const currentScreen = ref('login')"), true);
  assert.equal(indexPage.includes('const handleLoginSuccess = async () => {'), true);
  assert.equal(indexPage.includes("currentScreen.value = 'home'"), true);
  assert.equal(indexPage.includes('await loadConversationList()'), true);
  assert.equal(indexPage.includes('@success="handleLoginSuccess"'), true);
});

test('pages.json points to index page and disables the native navigation bar', () => {
  const pages = JSON.parse(read('pages.json'));
  assert.equal(pages.pages[0].path, 'pages/index/index');
  assert.equal(pages.pages[0].style.navigationStyle, 'custom');
});

test('project is explicitly configured for Vue 3 uni-app', () => {
  const packageJson = JSON.parse(read('package.json'));
  const mainEntry = read('main.js');
  const manifest = JSON.parse(read('manifest.json'));

  assert.equal(mainEntry.includes('createSSRApp'), true);
  assert.equal(typeof packageJson.dependencies?.vue, 'string');
  assert.equal(packageJson.dependencies.vue.startsWith('^3.'), true);
  assert.equal(manifest.vueVersion, '3');
});

test('home page wires a side drawer overlay through the menu icon', () => {
  const indexPage = read('pages/index/index.vue');
  const header = read('components/home/HomeHeader.vue');
  const drawerPath = path.join(projectRoot, 'components/home/HomeSideDrawer.vue');

  assert.equal(fs.existsSync(drawerPath), true);
  assert.equal(indexPage.includes('HomeSideDrawer'), true);
  assert.equal(indexPage.includes('menuOpen'), true);
  assert.equal(indexPage.includes('@menu='), true);
  assert.equal(indexPage.includes(':show-hero="!isChatting"'), true);
  assert.equal(header.includes('showHero'), true);
  assert.equal(header.includes('v-if="showHero" class="hero-title"'), true);
  assert.equal(header.includes("defineEmits(['menu'])"), true);
  assert.equal(header.includes('@tap="emit(\'menu\')"'), true);
});

test('home header toggles the speaker icon between on and off states', () => {
  const header = read('components/home/HomeHeader.vue');

  assert.equal(header.includes("import { ref } from 'vue'"), true);
  assert.equal(header.includes('const isSpeakerOn = ref(false)'), true);
  assert.equal(header.includes('const toggleSpeaker = () => {'), true);
  assert.equal(header.includes('isSpeakerOn.value = !isSpeakerOn.value'), true);
  assert.equal(header.includes('@tap="toggleSpeaker"'), true);
  assert.equal(header.includes(':class="{ \'mute-icon--on\': isSpeakerOn }"'), true);
  assert.equal(header.includes(':aria-label="isSpeakerOn ? \'关闭扬声器\' : \'开启扬声器\'"'), true);
  assert.equal(header.includes('class="speaker-shape"'), true);
  assert.equal(header.includes('class="speaker-mouth"'), true);
  assert.equal(header.includes('v-if="isSpeakerOn"'), true);
  assert.equal(header.includes('class="speaker-wave-line speaker-wave-line--inner"'), true);
  assert.equal(header.includes('class="speaker-wave-line speaker-wave-line--outer"'), true);
  assert.equal(header.includes('v-else class="speaker-off-slash"'), true);
  assert.equal(header.includes('mute-icon__cone'), false);
});

test('settings button opens an in-page settings screen for single-page runtime', () => {
  const pages = JSON.parse(read('pages.json'));
  const indexPage = read('pages/index/index.vue');
  const drawer = read('components/home/HomeSideDrawer.vue');
  const settingsScreenPath = path.join(projectRoot, 'components/settings/SettingsScreen.vue');
  const settingsPagePath = path.join(projectRoot, 'pages/settings/index.vue');

  assert.equal(fs.existsSync(settingsScreenPath), true);
  assert.equal(fs.existsSync(settingsPagePath), true);
  assert.equal(
    pages.pages.some((page) => page.path === 'pages/settings/index'),
    true,
  );
  assert.equal(indexPage.includes('SettingsScreen'), true);
  assert.equal(indexPage.includes("currentScreen.value = 'settings'"), true);
  assert.equal(indexPage.includes('uni.navigateTo'), false);
  assert.equal(drawer.includes("const emit = defineEmits(['close', 'settings', 'open-page', 'new-chat', 'open-chat'])"), true);
  assert.equal(drawer.includes('@tap="emit(\'settings\')"'), true);
});

test('settings screen open action does not reuse the drawer close action', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes('const openSettings = () => {'), true);
  assert.equal(indexPage.includes('closeMenu()'), false);
});

test('settings top bar back arrow is centered and not clipped', () => {
  const topBar = read('components/settings/SettingsTopBar.vue');

  assert.equal(topBar.includes('class="back-arrow"'), true);
  assert.match(topBar, /\.back-arrow\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*justify-content:\s*center;[\s\S]*overflow:\s*visible;/);
  assert.match(topBar, /\.back-arrow__line\s*\{[\s\S]*left:\s*50%;[\s\S]*top:\s*50%;[\s\S]*width:\s*18rpx;[\s\S]*transform-origin:\s*left center;/);
  assert.match(topBar, /\.back-arrow__line--1\s*\{[\s\S]*transform:\s*translateX\(-8rpx\) rotate\(-42deg\);/);
  assert.match(topBar, /\.back-arrow__line--2\s*\{[\s\S]*transform:\s*translateX\(-8rpx\) rotate\(42deg\);/);
});

test('side drawer renders the settings control with a gear icon structure', () => {
  const drawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(drawer.includes('class="settings-gear"'), true);
  assert.equal(drawer.includes('settings-gear__ring'), true);
  assert.equal(drawer.includes('settings-gear__hole'), true);
});

test('side drawer clickable modules emit single-page destinations', () => {
  const drawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(drawer.includes("defineEmits(['close', 'settings', 'open-page', 'new-chat', 'open-chat'])"), true);
  assert.equal(drawer.includes("@tap=\"emit('open-page', link.key)\""), true);
  assert.equal(drawer.includes("@tap=\"emit('open-page', 'important-records')\""), true);
  assert.equal(drawer.includes("@tap.stop=\"emit('open-page', 'important-record-create')\""), true);
  assert.equal(drawer.includes('hover-class="quick-card--active"'), true);
  assert.equal(drawer.includes('hover-class="record-area--active"'), true);
});

test('chat record module only opens existing chats or creates a new chat', () => {
  const drawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(drawer.includes("defineEmits(['close', 'settings', 'open-page', 'new-chat', 'open-chat'])"), true);
  assert.equal(drawer.includes('chatRecords'), true);
  assert.equal(drawer.includes('hasChatRecords'), true);
  assert.equal(drawer.includes("emit('open-chat', chat.id)"), true);
  assert.equal(drawer.includes("emit('new-chat')"), true);
  assert.equal(drawer.includes("emit('open-page', 'chat-records')"), false);
  assert.equal(drawer.includes('v-if="hasChatRecords"'), true);
  assert.equal(drawer.includes('v-else class="record-empty record-empty--chat"'), true);
  assert.equal(drawer.includes('class="chat-add-button"'), true);
});

test('single-page shell opens drawer destination pages without uni navigation api', () => {
  const indexPage = read('pages/index/index.vue');
  const featureScreenPath = path.join(projectRoot, 'components/home/HomeFeatureScreen.vue');

  assert.equal(fs.existsSync(featureScreenPath), true);
  assert.equal(indexPage.includes('HomeFeatureScreen'), true);
  assert.equal(indexPage.includes("const activeFeatureKey = ref('')"), true);
  assert.equal(indexPage.includes('const openFeaturePage = (featureKey) => {'), true);
  assert.equal(indexPage.includes('activeFeatureKey.value = featureKey'), true);
  assert.equal(indexPage.includes("currentScreen.value = 'feature'"), true);
  assert.equal(indexPage.includes("activeFeatureKey.value = ''"), true);
  assert.equal(indexPage.includes('@open-page="openFeaturePage"'), true);
  assert.equal(indexPage.includes('@back="backToHome"'), true);
  assert.equal(indexPage.includes('uni.navigateTo'), false);
  assert.equal(indexPage.includes('uni.reLaunch'), false);
  assert.equal(indexPage.includes('uni.redirectTo'), false);
});

test('single-page shell manages local chat records and opens chat detail screens', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes('const chatRecords = ref([])'), true);
  assert.equal(indexPage.includes("const currentChatId = ref('')"), true);
  assert.equal(indexPage.includes('const activeChat = computed'), true);
  assert.equal(indexPage.includes("const createChatRecord = (initialMessage = '') => {"), true);
  assert.equal(indexPage.includes('chatRecords.value.unshift'), true);
  assert.equal(indexPage.includes('const startNewChat = () => {'), true);
  assert.equal(indexPage.includes('currentChatMessages.value = []'), true);
  assert.equal(indexPage.includes('const openChatRecord = async (chatId) => {'), true);
  assert.equal(indexPage.includes('currentChatMessages.value = [...chat.messages]'), true);
  assert.equal(indexPage.includes('fetchConversationMessages(chat.id, { userId })'), true);
  assert.equal(indexPage.includes("activeFeatureKey.value = 'chat-detail'"), true);
  assert.equal(indexPage.includes(':chat-records="chatRecords"'), true);
  assert.equal(indexPage.includes(':active-chat="activeChat"'), true);
  assert.equal(indexPage.includes(':current-chat-messages="currentChatMessages"'), true);
  assert.equal(indexPage.includes('@new-chat="startNewChat"'), true);
  assert.equal(indexPage.includes('@open-chat="openChatRecord"'), true);
  assert.match(indexPage, /<HomeFeatureScreen[\s\S]*?@send="handleSendMessage"[\s\S]*?\/>/);
});

test('new chat returns home and first sent message clears the home intro content', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes('const currentChatMessages = ref([])'), true);
  assert.equal(indexPage.includes('const isChatting = computed(() => currentChatMessages.value.length > 0)'), true);
  assert.equal(indexPage.includes('const handleSendMessage = async (question) => {'), true);
  assert.equal(indexPage.includes('streamChatMessage({'), true);
  assert.equal(indexPage.includes('onDelta: (content) => {'), true);
  assert.equal(indexPage.includes('onDone: (payload) => {'), true);
  assert.equal(indexPage.includes("role: 'user'"), true);
  assert.equal(indexPage.includes("role: 'ai'"), true);
  assert.equal(indexPage.includes("currentScreen.value = 'home'"), true);
  assert.equal(indexPage.includes("activeFeatureKey.value = ''"), true);
  assert.equal(indexPage.includes('<view v-if="isChatting" class="home-chat-thread">'), true);
  assert.equal(indexPage.includes('<view v-else class="home-intro-content">'), true);
  assert.equal(indexPage.includes('v-for="message in currentChatMessages"'), true);
  assert.equal(indexPage.includes('@send="handleSendMessage"'), true);
  assert.equal(indexPage.includes(':show-hero="!isChatting"'), true);
});

test('chat detail feature page renders user and ai message history', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes("import HomeComposer from './HomeComposer.vue'"), true);
  assert.equal(featureScreen.includes('activeChat'), true);
  assert.equal(featureScreen.includes('currentChatMessages'), true);
  assert.equal(featureScreen.includes('const featureTitle = computed'), true);
  assert.equal(featureScreen.includes("props.featureKey === 'chat-detail'"), true);
  assert.equal(featureScreen.includes('props.activeChat?.title || feature.value.title'), true);
  assert.equal(featureScreen.includes('const chatDetailMessages = computed'), true);
  assert.equal(featureScreen.includes("featureKey === 'chat-detail'"), true);
  assert.equal(featureScreen.includes('<text class="feature-top__title">{{ featureTitle }}</text>'), true);
  assert.equal(featureScreen.includes('class="chat-detail"'), true);
  assert.equal(featureScreen.includes('chat-detail__summary'), false);
  assert.equal(featureScreen.includes('v-for="message in chatDetailMessages"'), true);
  assert.equal(featureScreen.includes("message.role === 'user'"), true);
  assert.equal(featureScreen.includes("message.role === 'ai'"), true);
  assert.equal(featureScreen.includes('class="chat-message"'), true);
  assert.equal(featureScreen.includes('chat-message__role'), false);
  assert.equal(featureScreen.includes("message.role === 'user' ? '�? : 'AI'"), false);
  assert.equal(featureScreen.includes("'chat-message--user': message.role === 'user'"), true);
  assert.equal(featureScreen.includes("'chat-message--ai': message.role === 'ai'"), true);
  assert.equal(featureScreen.includes("const emit = defineEmits(['back', 'send'])"), true);
  assert.equal(featureScreen.includes('@send="emit(\'send\', $event)"'), true);
});

test('home page connects the chat backend main flow', () => {
  const indexPage = read('pages/index/index.vue');
  const apiClientPath = path.join(projectRoot, 'common/chat-api.mjs');
  const apiClient = read('common/chat-api.mjs');

  assert.equal(fs.existsSync(apiClientPath), true);
  assert.equal(indexPage.includes("from '../../common/chat-api.mjs'"), true);
  assert.equal(indexPage.includes('const userId = createStableUserId()'), true);
  assert.equal(indexPage.includes('const loadConversationList = async () => {'), true);
  assert.equal(indexPage.includes('fetchConversations({ userId })'), true);
  assert.equal(indexPage.includes('fetchConversationMessages(chat.id, { userId })'), true);
  assert.equal(indexPage.includes('streamChatMessage({'), true);
  assert.equal(indexPage.includes('replaceCurrentChatId(payload.conversation_id)'), true);
  assert.equal(indexPage.includes('await loadConversationList()'), true);
  assert.equal(indexPage.includes('chat-error-banner'), true);
  assert.equal(apiClient.includes("'/api/v1/conversations'"), true);
  assert.equal(apiClient.includes('`/api/v1/conversations/${conversationId}/messages`'), true);
  assert.equal(apiClient.includes("'/api/v1/chat/stream'"), true);
  assert.equal(apiClient.includes("'X-User-Id': userId"), true);
  assert.equal(apiClient.includes("Accept: 'text/event-stream'"), true);
});

test('feature screen back button arrow is centered and not clipped', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('class="back-button"'), true);
  assert.match(featureScreen, /\.back-button\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;[\s\S]*justify-content:\s*center;[\s\S]*overflow:\s*visible;/);
  assert.match(featureScreen, /\.back-button__line\s*\{[\s\S]*left:\s*50%;[\s\S]*top:\s*50%;[\s\S]*width:\s*20rpx;[\s\S]*transform-origin:\s*left center;/);
  assert.match(featureScreen, /\.back-button__line--top\s*\{[\s\S]*transform:\s*translateX\(-9rpx\) rotate\(-42deg\);/);
  assert.match(featureScreen, /\.back-button__line--bottom\s*\{[\s\S]*transform:\s*translateX\(-9rpx\) rotate\(42deg\);/);
});

test('home topic cards do not render topic icon containers', () => {
  const topics = read('components/home/HomeTopics.vue');
  const topicIconClass = ['topic', 'icon'].join('-');
  const topicIconFeaturedClass = [topicIconClass, 'featured'].join('--');
  const topicIconTextClass = [topicIconClass, 'text'].join('-');

  assert.equal(topics.includes(`class="${topicIconClass}"`), false);
  assert.equal(topics.includes(topicIconFeaturedClass), false);
  assert.equal(topics.includes(topicIconTextClass), false);
});

test('home composer renders a chat input bar with voice input', () => {
  const composer = read('components/home/HomeComposer.vue');

  assert.equal(composer.includes("const emit = defineEmits(['send'])"), true);
  assert.equal(composer.includes("const textValue = ref('')"), true);
  assert.equal(composer.includes('const sendTextMessage = () => {'), true);
  assert.equal(composer.includes("emit('send', message)"), true);
  assert.equal(composer.includes("textValue.value = ''"), true);
  assert.equal(composer.includes('class="composer"'), true);
  assert.equal(composer.includes('class="add-button"'), true);
  assert.equal(composer.includes('@tap="toggleVoiceMode"'), true);
  assert.equal(composer.includes("const isVoiceMode = ref(false)"), true);
  assert.equal(composer.includes('composer-input--voice'), true);
  assert.equal(composer.includes('v-if="isVoiceMode"'), true);
  assert.equal(composer.includes('v-else'), true);
  assert.equal(composer.includes('@touchstart="startVoiceInput"'), true);
  assert.equal(composer.includes('@touchend="stopVoiceInput"'), true);
  assert.equal(composer.includes('@touchcancel="stopVoiceInput"'), true);
  assert.equal(composer.includes('class="voice-button"'), true);
  assert.equal(composer.includes("const isVoiceInputActive = ref(false)"), true);
  assert.equal(composer.includes('voice-button__mic'), true);
  assert.equal(composer.includes('voice-button__stem'), true);
  assert.equal(composer.includes('voice-wave'), true);
  assert.equal(composer.includes('voice-wave__bar'), true);
  assert.equal(composer.includes('v-model="textValue"'), true);
  assert.equal(composer.includes('@confirm="sendTextMessage"'), true);
  assert.equal(composer.includes('@tap="sendTextMessage"'), true);
  assert.equal(composer.includes('class="send-button"'), true);
});

test('feature screen renders all drawer destinations as standalone screens', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('featureMap'), true);
  assert.equal(featureScreen.includes("'personal'"), true);
  assert.equal(featureScreen.includes("'target'"), true);
  assert.equal(featureScreen.includes("'important-records'"), true);
  assert.equal(featureScreen.includes("'important-record-create'"), true);
  assert.equal(featureScreen.includes("'chat-records'"), true);
  assert.equal(featureScreen.includes('重要记录'), true);
  assert.equal(featureScreen.includes('新增记录'), true);
  assert.equal(featureScreen.includes('对话记录'), true);
});

test('personal info feature page renders a dedicated profile form layout', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('personalProfileFields'), true);
  assert.equal(featureScreen.includes('personalProfileNotes'), true);
  assert.equal(featureScreen.includes('personal-profile'), true);
  assert.equal(featureScreen.includes('profile-summary'), true);
  assert.equal(featureScreen.includes('profile-grid'), true);
  assert.equal(featureScreen.includes('profile-field'), true);
  assert.equal(featureScreen.includes('profile-note-list'), true);
  assert.equal(featureScreen.includes('profile-textarea'), true);
  assert.equal(featureScreen.includes('profile-save'), true);
});
test('target info feature page renders a dedicated relationship form layout', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('targetProfileFields'), true);
  assert.equal(featureScreen.includes('targetProfileNotes'), true);
  assert.equal(featureScreen.includes('target-profile'), true);
  assert.equal(featureScreen.includes('target-summary'), true);
  assert.equal(featureScreen.includes('target-grid'), true);
  assert.equal(featureScreen.includes('target-field'), true);
  assert.equal(featureScreen.includes('target-note-list'), true);
  assert.equal(featureScreen.includes('target-textarea'), true);
  assert.equal(featureScreen.includes('target-save'), true);
});
test('important record create page renders a dedicated event form layout', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('recordCreateFields'), true);
  assert.equal(featureScreen.includes('record-create'), true);
  assert.equal(featureScreen.includes('record-form-list'), true);
  assert.equal(featureScreen.includes('record-textarea'), true);
  assert.equal(featureScreen.includes('record-field--emphasis'), true);
  assert.equal(featureScreen.includes('record-field--satisfaction'), true);
  assert.equal(featureScreen.includes('record-save'), true);
});
test('important record create page supports recording multiple events', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('recordCreateEvents'), true);
  assert.equal(featureScreen.includes('const addRecordCreateEvent = () => {'), true);
  assert.equal(featureScreen.includes('recordCreateEvents.value.push'), true);
  assert.equal(featureScreen.includes('v-for="event in recordCreateEvents"'), true);
  assert.equal(featureScreen.includes('事件 {{ event.index }}'), true);
  assert.equal(featureScreen.includes('@tap="addRecordCreateEvent"'), true);
  assert.equal(featureScreen.includes('新增一件事'), true);
  assert.equal(featureScreen.includes('record-add-event'), true);
});

test('settings page includes a logout option in the mine menu', () => {
  const settingsData = read('common/settings-data.js');
  const menuCard = read('components/settings/SettingsMenuCard.vue');

  assert.equal(settingsData.includes("key: 'logout'"), true);
  assert.equal(settingsData.includes("label: '\u9000\u51fa\u767b\u5f55'"), true);
  assert.equal(settingsData.includes('danger: true'), true);
  assert.equal(menuCard.includes("item.icon === 'logout'"), true);
  assert.equal(menuCard.includes("'menu-row--danger': item.danger"), true);
});

test('settings logout asks for confirmation and emits a logout event without page navigation', () => {
  const settingsScreen = read('components/settings/SettingsScreen.vue');
  const menuCard = read('components/settings/SettingsMenuCard.vue');

  assert.equal(menuCard.includes("defineEmits(['select'])"), true);
  assert.equal(menuCard.includes("@tap=\"emit('select', item)\""), true);
  assert.equal(settingsScreen.includes("defineEmits(['back', 'logout', 'open-chat'])"), true);
  assert.equal(settingsScreen.includes('@select="handleMenuSelect"'), true);
  assert.equal(settingsScreen.includes('const handleMenuSelect = (item) => {'), true);
  assert.equal(settingsScreen.includes("item.key !== 'logout'"), true);
  assert.equal(settingsScreen.includes('uni.showModal'), true);
  assert.equal(settingsScreen.includes("content: '\u662f\u5426\u9000\u51fa\u5f53\u524d\u767b\u5f55'"), true);
  assert.equal(settingsScreen.includes("confirmText: '\u662f'"), true);
  assert.equal(settingsScreen.includes("cancelText: '\u5426'"), true);
  assert.equal(settingsScreen.includes('if (confirm) {'), true);
  assert.equal(settingsScreen.includes("emit('logout')"), true);
  assert.equal(settingsScreen.includes('uni.reLaunch'), false);
  assert.equal(settingsScreen.includes('uni.navigateTo'), false);
  assert.equal(settingsScreen.includes('uni.redirectTo'), false);
});

test('settings menu non-logout items open in-page detail screens', () => {
  const settingsScreen = read('components/settings/SettingsScreen.vue');
  const detailScreenPath = path.join(projectRoot, 'components/settings/SettingsDetailScreen.vue');
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(fs.existsSync(detailScreenPath), true);
  assert.equal(settingsScreen.includes("import { computed, ref } from 'vue'"), true);
  assert.equal(settingsScreen.includes("import SettingsDetailScreen from './SettingsDetailScreen.vue'"), true);
  assert.equal(settingsScreen.includes("const activeDetailKey = ref('')"), true);
  assert.equal(settingsScreen.includes('const activeDetail = computed'), true);
  assert.equal(settingsScreen.includes("activeDetailKey.value = item.key"), true);
  assert.equal(settingsScreen.includes("activeDetailKey.value = ''"), true);
  assert.equal(settingsScreen.includes('<SettingsDetailScreen'), true);
  assert.equal(settingsScreen.includes(':detail="activeDetail"'), true);
  assert.equal(settingsScreen.includes('@back="closeDetail"'), true);
  assert.equal(detailScreen.includes("defineEmits(['back', 'open-chat'])"), true);
  assert.equal(detailScreen.includes('detail.sections'), true);
  assert.equal(detailScreen.includes('detail-actions'), true);
  assert.equal(settingsScreen.includes('心情日记'), true);
  assert.equal(settingsScreen.includes('历史咨询'), true);
  assert.equal(settingsScreen.includes('情感分析报告'), true);
  assert.equal(settingsScreen.includes('privacy:'), true);
  assert.equal(settingsScreen.includes('关于我们'), true);
});

test('mood diary detail renders a calendar and only a diary editor below it', () => {
  const settingsScreen = read('components/settings/SettingsScreen.vue');
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.match(settingsScreen, /mood:\s*\{\s*key:\s*'mood'/);
  assert.equal(detailScreen.includes('const isMoodDiary = computed'), true);
  assert.equal(detailScreen.includes('const selectedDiaryDate = ref'), true);
  assert.equal(detailScreen.includes('const moodCalendarDays = computed'), true);
  assert.equal(detailScreen.includes('const selectDiaryDate = (day) => {'), true);
  assert.equal(detailScreen.includes('class="mood-calendar"'), true);
  assert.equal(detailScreen.includes('v-for="weekday in moodWeekdays"'), true);
  assert.equal(detailScreen.includes('v-for="day in moodCalendarDays"'), true);
  assert.equal(detailScreen.includes('@tap="selectDiaryDate(day)"'), true);
  assert.equal(detailScreen.includes("'mood-calendar__day--selected': day.date === selectedDiaryDate"), true);
  assert.equal(detailScreen.includes('class="mood-diary-editor"'), true);
  assert.equal(detailScreen.includes('v-model="draftDiaryText"'), true);
  assert.equal(detailScreen.includes('v-if="isMoodDiary" class="mood-diary-editor"'), true);
  assert.match(detailScreen, /<view v-if="!isMoodDiary && !isHistoryConsultation">\s*<view class="detail-section-list">/);
  assert.equal(detailScreen.includes('detail-extra-content'), false);
});

test('history consultation detail renders the shared chat records', () => {
  const indexPage = read('pages/index/index.vue');
  const settingsScreen = read('components/settings/SettingsScreen.vue');
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.match(indexPage, /<SettingsScreen[\s\S]*?:chat-records="chatRecords"[\s\S]*?@open-chat="openChatRecord"[\s\S]*?\/>/);
  assert.equal(settingsScreen.includes('chatRecords: {'), true);
  assert.equal(settingsScreen.includes("defineEmits(['back', 'logout', 'open-chat'])"), true);
  assert.equal(settingsScreen.includes("key: 'history'"), true);
  assert.equal(settingsScreen.includes(':chat-records="chatRecords"'), true);
  assert.equal(settingsScreen.includes('@open-chat="emit(\'open-chat\', $event)"'), true);
  assert.equal(detailScreen.includes('chatRecords: {'), true);
  assert.equal(detailScreen.includes("defineEmits(['back', 'open-chat'])"), true);
  assert.equal(detailScreen.includes("const isHistoryConsultation = computed(() => props.detail.key === 'history')"), true);
  assert.equal(detailScreen.includes('const hasChatRecords = computed(() => props.chatRecords.length > 0)'), true);
  assert.equal(detailScreen.includes('class="history-chat-list"'), true);
  assert.equal(detailScreen.includes('v-for="chat in chatRecords"'), true);
  assert.equal(detailScreen.includes('@tap="emit(\'open-chat\', chat.id)"'), true);
  assert.equal(detailScreen.includes('class="history-chat-empty"'), true);
  assert.match(detailScreen, /<view v-if="!isHistoryConsultation" class="detail-hero">/);
  assert.equal(detailScreen.includes('<view v-if="!isMoodDiary && !isHistoryConsultation">'), true);
});

test('mood diary detail lets users choose dates and manage notes', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('const visibleCalendarDate = ref'), true);
  assert.equal(detailScreen.includes('const draftDiaryText = ref'), true);
  assert.equal(detailScreen.includes('const isDiaryEditing = ref'), true);
  assert.equal(detailScreen.includes('const hasSavedDiary = computed'), true);
  assert.equal(detailScreen.includes('const handleDiaryDateChange = (event) => {'), true);
  assert.equal(detailScreen.includes('const saveDiaryEntry = () => {'), true);
  assert.equal(detailScreen.includes('const editDiaryEntry = () => {'), true);
  assert.equal(detailScreen.includes('const deleteDiaryEntry = () => {'), true);
  assert.equal(detailScreen.includes('mode="date"'), true);
  assert.equal(detailScreen.includes('class="mood-date-picker"'), true);
  assert.equal(detailScreen.includes('@change="handleDiaryDateChange"'), true);
  assert.equal(detailScreen.includes(':disabled="!isDiaryEditing"'), true);
  assert.equal(detailScreen.includes('class="mood-diary-actions"'), true);
  assert.equal(detailScreen.includes('@tap="saveDiaryEntry"'), true);
  assert.equal(detailScreen.includes('@tap="editDiaryEntry"'), true);
  assert.equal(detailScreen.includes('@tap="deleteDiaryEntry"'), true);
  assert.equal(detailScreen.includes("'mood-diary-action--disabled': !hasSavedDiary"), true);
});

test('mood diary editor removes text length limit and supports fullscreen writing', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('const isDiaryFullscreen = ref(false)'), true);
  assert.equal(detailScreen.includes('const openDiaryFullscreen = () => {'), true);
  assert.equal(detailScreen.includes('const closeDiaryFullscreen = () => {'), true);
  assert.equal(detailScreen.includes('maxlength="-1"'), true);
  assert.equal(detailScreen.includes('class="mood-diary-editor__top"'), true);
  assert.equal(detailScreen.includes('class="mood-diary-expand"'), true);
  assert.equal(detailScreen.includes('@tap="openDiaryFullscreen"'), true);
  assert.equal(detailScreen.includes('v-if="isDiaryFullscreen" class="mood-diary-fullscreen"'), true);
  assert.equal(detailScreen.includes('class="mood-diary-fullscreen__input"'), true);
  assert.equal(detailScreen.includes('@tap="closeDiaryFullscreen"'), true);
  assert.match(detailScreen, /class="mood-diary-fullscreen__input"[\s\S]*?v-model="draftDiaryText"[\s\S]*?maxlength="-1"/);
});

test('settings detail textarea internals have visible scrolling', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes(':deep(.uni-textarea-textarea)'), true);
  assert.match(detailScreen, /:deep\(\.uni-textarea-textarea\)\s*\{[\s\S]*overflow-y:\s*auto;[\s\S]*scrollbar-width:\s*thin;/);
  assert.equal(detailScreen.includes(':deep(.uni-textarea-textarea)::-webkit-scrollbar'), true);
  assert.equal(detailScreen.includes(':deep(.uni-textarea-textarea)::-webkit-scrollbar-thumb'), true);
});

test('single-page shell resets to the login screen after settings logout', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes('const backToLogin = () => {'), true);
  assert.equal(indexPage.includes("currentScreen.value = 'login'"), true);
  assert.equal(indexPage.includes('@logout="backToLogin"'), true);
});

test('login cycle clears transient home UI state before showing home again', () => {
  const indexPage = read('pages/index/index.vue');

  assert.match(
    indexPage,
    /const resetHomeUiState = \(\) => \{\s*menuOpen\.value = false\s*activeFeatureKey\.value = ''\s*currentChatId\.value = ''\s*currentChatMessages\.value = \[\]\s*chatErrorMessage\.value = ''\s*\}/,
  );
  assert.match(
    indexPage,
    /const handleLoginSuccess = async \(\) => \{\s*resetHomeUiState\(\)\s*currentScreen\.value = 'home'\s*await loadConversationList\(\)\s*\}/,
  );
  assert.match(
    indexPage,
    /const backToLogin = \(\) => \{\s*resetHomeUiState\(\)\s*currentScreen\.value = 'login'\s*\}/,
  );
});

test('login screen includes agreement confirmation and one-tap login action', () => {
  const loginScreen = read('components/login/LoginScreen.vue');

  assert.equal(loginScreen.includes("defineEmits(['success'])"), true);
  assert.equal(loginScreen.includes('agreementChecked'), true);
  assert.equal(loginScreen.includes('\u4e00\u952e\u767b\u5f55'), true);
  assert.equal(loginScreen.includes('\u670d\u52a1\u534f\u8bae'), true);
  assert.equal(loginScreen.includes('\u9690\u79c1\u653f\u7b56'), true);
});

test('login screen does not render the standalone login status module', () => {
  const loginScreen = read('components/login/LoginScreen.vue');

  assert.equal(loginScreen.includes('class="login-status"'), false);
  assert.equal(loginScreen.includes('.login-status'), false);
});

