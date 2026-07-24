import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

function read(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
}

function count(content, pattern) {
  return content.split(pattern).length - 1;
}

function readSourceTree(directory) {
  return fs.readdirSync(path.join(projectRoot, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(directory, entry.name);

      return entry.isDirectory() ? readSourceTree(relativePath) : [read(relativePath)];
    });
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
  assert.equal(loginScreen.includes('class="alternate-actions"'), false);
});

test('user api exposes unified request helpers and backend resource contracts', () => {
  const userApi = read('common/user-api.mjs');

  assert.equal(userApi.includes("const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'"), true);
  assert.equal(userApi.includes('Authorization: `Bearer ${accessToken}`'), true);
  assert.equal(userApi.includes("request('/v1/users/register/email-code'"), true);
  assert.equal(userApi.includes("request('/v1/users/register'"), true);
  assert.equal(userApi.includes("contentType: 'application/protojson'"), true);
  assert.equal(userApi.includes("request('/v1/users/login'"), true);
  assert.equal(userApi.includes("request('/v1/auth/logout'"), true);
  assert.equal(userApi.includes("request('/v1/diaries'"), true);
  assert.equal(userApi.includes("request('/v1/mood-tags'"), true);
  assert.equal(userApi.includes('`/v1/chat/sessions${buildQuery(params)}`'), true);
  assert.equal(userApi.includes('`/v1/emotion/reports/overview${buildQuery(params)}`'), true);
  assert.equal(userApi.includes("request('/v1/system/about'"), true);
  assert.equal(userApi.includes("request('/v1/system/configs/public'"), true);
  assert.equal(userApi.includes('/v1/system/versions/latest'), true);
  assert.equal(userApi.includes('/v1/system/version/latest'), false);
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
  assert.equal(settingsScreen.includes('fetchCurrentUserProfile'), true);
  assert.equal(settingsScreen.includes('updateCurrentUserProfile'), true);
  assert.equal(settingsScreen.includes('updateCurrentUserAvatar'), true);
  assert.equal(settingsScreen.includes('uploadCurrentUserAvatar'), true);
  assert.equal(settingsScreen.includes("fetchLatestSystemVersion({ platform: 'android' })"), true);
  assert.equal(settingsScreen.includes('const userProfile = ref(props.initialUserProfile)'), true);
  assert.equal(settingsScreen.includes('const userDisplayName = computed'), true);
  assert.equal(settingsScreen.includes('const userAvatarUrl = computed'), true);
  assert.equal(settingsScreen.includes('initialUserProfile'), true);
  assert.equal(settingsScreen.includes("emit('profile-updated', profile)"), true);
  assert.equal(settingsScreen.includes('loadCurrentUserProfile()'), true);
  assert.equal(settingsScreen.includes('loadCurrentAppVersion()'), true);
  assert.equal(settingsScreen.includes('@choose-avatar="handleChooseAvatar"'), true);
  assert.equal(settingsScreen.includes('@save-name="saveProfileName"'), true);
  assert.equal(settingsScreen.includes('v-model:draft-name="draftProfileName"'), true);
  assert.match(settingsScreen, /mood:\s*\{\s*key:\s*'mood'/);
  assert.match(settingsScreen, /history:\s*\{\s*key:\s*'history'/);
  assert.match(settingsScreen, /report:\s*\{\s*key:\s*'report'/);
  assert.match(settingsScreen, /privacy:\s*\{\s*key:\s*'privacy'/);
  assert.match(settingsScreen, /about:\s*\{\s*key:\s*'about'/);
  assert.equal(settingsScreen.includes("defineEmits(['back', 'logout', 'open-chat', 'profile-updated'])"), true);
  assert.equal(settingsScreen.includes('@open-chat="emit(\'open-chat\', $event)"'), true);
  assert.equal(settingsScreen.includes('settingsProfile'), false);
  assert.equal(settingsScreen.includes('reportTargets'), false);
  assert.equal(settingsScreen.includes('Emo AI Team'), false);
});

test('settings profile panel supports editing username and choosing avatar', () => {
  const profilePanel = read('components/settings/SettingsProfilePanel.vue');

  assert.equal(profilePanel.includes('avatarUrl'), true);
  assert.equal(profilePanel.includes("defineEmits(['edit-name', 'update:draftName', 'save-name', 'cancel-name', 'choose-avatar'])"), true);
  assert.equal(profilePanel.includes('class="avatar-image"'), true);
  assert.equal(profilePanel.includes('@tap="emit(\'choose-avatar\')"'), true);
  assert.equal(profilePanel.includes('v-if="isEditingName" class="name-editor"'), true);
  assert.equal(profilePanel.includes('@input="emit(\'update:draftName\', $event.detail.value)"'), true);
  assert.equal(profilePanel.includes('@tap="emit(\'save-name\')"'), true);
  assert.equal(profilePanel.includes('@tap="emit(\'cancel-name\')"'), true);
  assert.equal(profilePanel.includes('@tap="emit(\'edit-name\')"'), true);
});

test('settings detail opens backend-backed diary, history, report, security, and about data', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('fetchMoodTags'), false);
  assert.equal(detailScreen.includes('fetchDiaries'), true);
  assert.equal(detailScreen.includes('fetchDiary'), true);
  assert.equal(detailScreen.includes('createDiary'), true);
  assert.equal(detailScreen.includes('updateDiary'), true);
  assert.equal(detailScreen.includes('deleteDiary'), true);
  assert.equal(detailScreen.includes('fetchConversations'), true);
  assert.equal(detailScreen.includes('fetchRelationshipHealthReport'), true);
  assert.equal(detailScreen.includes('fetchLoginLogs'), true);
  assert.equal(detailScreen.includes('fetchSecurityTokens'), true);
  assert.equal(detailScreen.includes('fetchSecurityEvents'), true);
  assert.equal(detailScreen.includes('fetchPublicSystemConfigs'), true);
  assert.equal(detailScreen.includes('fetchSystemAbout'), true);
  assert.equal(detailScreen.includes('fetchLatestSystemVersion'), true);
  assert.equal(detailScreen.includes('fetchSystemAnnouncements'), true);
  assert.equal(detailScreen.includes('normalizeAboutInfo'), true);
  assert.equal(detailScreen.includes('aboutInfo.value = normalizeAboutInfo(info)'), true);
  assert.equal(detailScreen.includes("fetchLatestSystemVersion({ platform: 'android' })"), true);
  assert.equal(detailScreen.includes('privacyPolicy.value = normalizePrivacyPolicy(configs)'), true);
  assert.equal(detailScreen.includes('loginLogs.value = normalizeLoginLogs(logs)'), true);
  assert.equal(detailScreen.includes("watch(\n  () => props.detail.key"), true);
  assert.equal(detailScreen.includes("if (key === 'mood')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'history')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'report')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'privacy')"), true);
  assert.equal(detailScreen.includes("} else if (key === 'about')"), true);
});

test('about detail page renders backend about info with optional version data', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('const aboutInfo = ref'), true);
  assert.equal(detailScreen.includes('const latestVersion = ref(null)'), true);
  assert.equal(detailScreen.includes('const systemAnnouncements = ref([])'), true);
  assert.equal(detailScreen.includes('displayAboutInfo'), true);
  assert.equal(detailScreen.includes('displayVersion'), true);
  assert.equal(detailScreen.includes('aboutLinkItems'), true);
  assert.equal(detailScreen.includes('v-if="isAboutDetail" class="about-detail"'), true);
  assert.equal(detailScreen.includes('about-detail__hero'), true);
  assert.equal(detailScreen.includes('about-detail__meta'), true);
  assert.equal(detailScreen.includes('about-detail__links'), true);
  assert.equal(detailScreen.includes('systemAnnouncements.length'), true);
  assert.equal(detailScreen.includes('latestVersion?.changelog'), true);
  assert.equal(detailScreen.includes('v-else-if="!detailLoading" class="history-chat-empty"'), true);
  assert.equal(detailScreen.includes('class="detail-actions"'), false);
  assert.equal(detailScreen.includes('detail-action-row'), false);
});

test('emotion report page renders backend personal portrait and target relationship health', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('const relationshipReport = ref'), true);
  assert.equal(detailScreen.includes('personalPortrait'), true);
  assert.equal(detailScreen.includes('targetReports'), true);
  assert.equal(detailScreen.includes('personalSummaryParagraphs'), true);
  assert.equal(detailScreen.includes('splitReportParagraphs'), true);
  assert.equal(detailScreen.includes('report-body-block'), true);
  assert.equal(detailScreen.includes('report-personal-card'), true);
  assert.equal(detailScreen.includes('report-target-card'), true);
  assert.equal(detailScreen.includes('report-note-group__dot'), true);
  assert.equal(detailScreen.includes('关系健康度分析'), true);
  assert.equal(detailScreen.includes('v-for="targetReport in relationshipReport.targetReports"'), true);
});

test('privacy detail page renders styled policy sections', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('privacy-detail-hero'), true);
  assert.equal(detailScreen.includes('privacy-detail-hero__title'), true);
  assert.equal(detailScreen.includes('privacy-detail-card__panel'), true);
  assert.equal(detailScreen.includes('v-for="section in privacyPolicy.sections"'), true);
  assert.equal(detailScreen.includes('privacy-detail-card__index'), false);
  assert.equal(detailScreen.includes('privacy-detail-card__content'), true);
  assert.equal(detailScreen.includes('.privacy-detail-card__body'), true);
});

test('backend exposes relationship health report route and usecase wiring', () => {
  const backendRoot = path.join(projectRoot, '..', 'emotion-backend', 'emo', 'emo-ai-service');
  const emotionBiz = fs.readFileSync(path.join(backendRoot, 'internal', 'biz', 'emotion.go'), 'utf8');
  const emotionService = fs.readFileSync(path.join(backendRoot, 'internal', 'service', 'emotion.go'), 'utf8');
  const httpServer = fs.readFileSync(path.join(backendRoot, 'internal', 'server', 'http.go'), 'utf8');
  const wireGen = fs.readFileSync(path.join(backendRoot, 'cmd', 'emo-ai-service', 'wire_gen.go'), 'utf8');

  assert.equal(emotionBiz.includes('type RelationshipHealthReport struct'), true);
  assert.equal(emotionBiz.includes('func (uc *EmotionUsecase) RelationshipHealthReport'), true);
  assert.equal(emotionBiz.includes('profile ProfileRepo'), true);
  assert.equal(emotionService.includes('func (s *EmotionService) RelationshipHealthReportHTTP'), true);
  assert.equal(emotionService.includes('json:"personal_portrait"'), true);
  assert.equal(emotionService.includes('json:"target_reports"'), true);
  assert.equal(httpServer.includes('srv.HandleFunc("/v1/emotion/reports/relationship-health", emotionSvc.RelationshipHealthReportHTTP)'), true);
  assert.equal(wireGen.includes('biz.NewEmotionUsecase(emotionRepo, profileRepo, emotionAnalyzer)'), true);
  assert.equal(wireGen.includes('service.NewEmotionService(emotionUsecase, tokenManager)'), true);
});

test('mood diary supports fullscreen writing and closes after save', () => {
  const detailScreen = read('components/settings/SettingsDetailScreen.vue');

  assert.equal(detailScreen.includes('<template>\n          <view class="mood-calendar__header">'), false);
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
  const sideDrawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(settingsScreen.includes(':chat-records="chatRecords"'), false);
  assert.equal(detailScreen.includes('props.chatRecords'), false);
  assert.equal(detailScreen.includes('const displayChatRecords = computed'), true);
  assert.equal(detailScreen.includes('v-for="chat in displayChatRecords"'), true);
  assert.equal(detailScreen.includes("@tap=\"emit('open-chat', chat)\""), true);
  assert.equal(sideDrawer.includes("@tap=\"emit('open-chat', chat)\""), true);
  assert.equal(indexPage.includes("from '../../common/chat-id.mjs'"), true);
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
  assert.equal(indexPage.includes('const currentUserProfile = ref(null)'), true);
  assert.equal(indexPage.includes('const displaySidebarProfile = computed'), true);
  assert.equal(indexPage.includes('const loadCurrentUserProfile = async () => {'), true);
  assert.equal(indexPage.includes('fetchCurrentUserProfile'), true);
  assert.equal(indexPage.includes('const handleProfileUpdated = (profile) => {'), true);
  assert.equal(indexPage.includes('loadCurrentUserProfile(),'), true);
  assert.equal(indexPage.includes(':initial-user-profile="currentUserProfile"'), true);
  assert.equal(indexPage.includes('@profile-updated="handleProfileUpdated"'), true);
  assert.equal(indexPage.includes(':profile="displaySidebarProfile"'), true);
  assert.equal(indexPage.includes(':profile="sidebarProfile"'), false);
  assert.equal(indexPage.includes('streamChatMessage({'), true);
  assert.equal(indexPage.includes('onDelta: (content) => {'), true);
  assert.equal(indexPage.includes('onDone: (payload) => {'), true);
  assert.equal(indexPage.includes('payload.conversation_id || payload.conversationId'), true);
  assert.equal(indexPage.includes('payload.assistant_message_id || payload.assistantMessageId'), true);
  assert.equal(indexPage.includes('@logout="backToLogin"'), true);
  assert.equal(indexPage.includes('@open-chat="openChatRecord"'), true);
});

test('uni-app source uses the new brand name and broad relationship positioning', () => {
  const homeData = read('common/home-data.js');
  const indexPage = read('pages/index/index.vue');
  const oldBrandName = ['星', '师'].join('');
  const appSource = ['common', 'components', 'pages'].flatMap(readSourceTree).join('\n');

  assert.equal(appSource.includes(oldBrandName), false);
  assert.equal(homeData.includes('嗨，我是军师'), true);
  assert.equal(homeData.includes('亲情、友情、职场、社交还是亲密关系'), true);
  assert.equal(indexPage.includes('帮你理清人际关系的结'), true);
  assert.equal(indexPage.includes('开始新的关系分析'), true);
});

test('home intro chat bubble stays below the live timeline on entry', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes('const shouldShowHomeChatBubble = ref(false)'), true);
  assert.equal(indexPage.includes('shouldShowHomeChatBubble.value = true'), true);
  assert.equal(indexPage.includes('emotion-ai:home-chat-bubble-seen'), false);
  assert.match(indexPage, /<text class="timeline">\{\{ liveTimelineText \}\}<\/text>[\s\S]*?<HomeChatCard[\s\S]*?v-if="shouldShowHomeChatBubble"[\s\S]*?:message-lines="streamedMessageLines"/);
});

test('home timeline uses live time and chat message time separators', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes("from '../../common/chat-time.mjs'"), true);
  assert.equal(indexPage.includes('const liveTimelineText = ref(formatClockTime())'), true);
  assert.equal(indexPage.includes('const startLiveClock = () => {'), true);
  assert.equal(indexPage.includes('setInterval(updateLiveTimelineText, 60 * 1000)'), true);
  assert.equal(indexPage.includes('stopLiveClock()'), true);
  assert.equal(indexPage.includes('createTimedUserMessage({'), true);
  assert.equal(indexPage.includes('previousUserMessage'), true);
  assert.equal(indexPage.includes('v-if="message.showTime" class="timeline timeline--chat"'), true);
  assert.equal(indexPage.includes('{{ liveTimelineText }}'), true);
  assert.equal(indexPage.includes('<text class="timeline">12:22</text>'), false);
});

test('home profile pages persist personal, target, and important record data through backend api', () => {
  const indexPage = read('pages/index/index.vue');
  const featureScreen = read('components/home/HomeFeatureScreen.vue');
  const profileApi = read('common/profile-api.mjs');

  assert.equal(profileApi.includes("request('/v1/profiles/personal'"), true);
  assert.equal(profileApi.includes("request('/v1/profiles/targets'"), true);
  assert.equal(profileApi.includes("request('/v1/profiles/important-records'"), true);
  assert.equal(indexPage.includes('fetchPersonalProfile'), true);
  assert.equal(indexPage.includes('fetchTargetProfiles'), true);
  assert.equal(indexPage.includes('fetchImportantRecords'), true);
  assert.equal(indexPage.includes('savePersonalProfile'), true);
  assert.equal(indexPage.includes('saveTargetProfile'), true);
  assert.equal(indexPage.includes('createImportantRecord'), true);
  assert.equal(indexPage.includes('updateImportantRecord'), true);
  assert.equal(indexPage.includes('@save-personal-profile="savePersonalProfileData"'), true);
  assert.equal(indexPage.includes('@save-target-profile="saveTargetProfileData"'), true);
  assert.equal(indexPage.includes(':target-profiles="targetProfiles"'), true);
  assert.equal(indexPage.includes('@select-target-profile="selectTargetProfile"'), true);
  assert.equal(indexPage.includes('@new-target-profile="startNewTargetProfile"'), true);
  assert.equal(featureScreen.includes("defineEmits(['back', 'send', 'save-personal-profile', 'save-target-profile', 'select-target-profile', 'new-target-profile', 'save-important-record', 'edit-important-record', 'delete-important-record'])"), true);
  assert.equal(featureScreen.includes('@tap="submitPersonalProfile"'), true);
  assert.equal(featureScreen.includes('personalProfileSaveText'), true);
  assert.equal(featureScreen.includes('@tap="submitTargetProfile"'), true);
});

test('target profile page uses target mbti and revised personality fields', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes("key: 'mbti'"), true);
  assert.equal(featureScreen.includes("target?.mbti || ''"), true);
  assert.equal(featureScreen.includes('MBTI人格'), true);
  assert.equal(featureScreen.includes('targetProfileSaveText'), true);
  assert.equal(featureScreen.includes("props.activeTargetProfile?.id ? '修改目标信息' : '保存目标信息'"), true);
  assert.equal(featureScreen.includes("uni.showToast({ title: '请填写目标年龄', icon: 'none' })"), true);
  assert.equal(featureScreen.includes("uni.showToast({ title: '请填写目标性别', icon: 'none' })"), true);
  assert.equal(featureScreen.includes("uni.showToast({ title: '请填写目标MBTI人格', icon: 'none' })"), true);
  assert.equal(featureScreen.includes('对方性格描述'), true);
  assert.equal(featureScreen.includes('最近一次关键互动'), false);
  assert.equal(featureScreen.includes("key: 'recentInteraction'"), false);
  assert.equal(featureScreen.includes('target-orbit'), false);
  assert.equal(featureScreen.includes('target-copy__kicker'), false);
  assert.equal(featureScreen.includes("['interactionFrequency', 'relationshipGoal'].includes(field.key)"), true);
  assert.equal(featureScreen.includes('target-field--half'), true);
  assert.equal(featureScreen.includes('maxlength="-1"'), true);
});

test('target profile page supports multiple target objects and per-target records', () => {
  const indexPage = read('pages/index/index.vue');
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('targetProfiles'), true);
  assert.equal(featureScreen.includes('target-profile-switcher'), true);
  assert.equal(featureScreen.includes('target-profile-card'), true);
  assert.equal(featureScreen.includes("emit('select-target-profile', target.id)"), true);
  assert.equal(featureScreen.includes("emit('new-target-profile')"), true);
  assert.equal(featureScreen.includes('新增目标对象'), true);
  assert.equal(indexPage.includes('const selectTargetProfile = async (targetProfileId) => {'), true);
  assert.equal(indexPage.includes('await loadImportantRecords(targetProfileId)'), true);
  assert.equal(indexPage.includes('const startNewTargetProfile = () => {'), true);
  assert.equal(indexPage.includes('targetProfileId: activeTargetProfile.value.id'), true);
});

test('important record editor removes summary marker and kicker modules', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('record-summary__marker'), false);
  assert.equal(featureScreen.includes('record-summary__kicker'), false);
});

test('home chat views render assistant markdown through rich text nodes', () => {
  const indexPage = read('pages/index/index.vue');
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(indexPage.includes("from '../../common/markdown-render.mjs'"), true);
  assert.equal(indexPage.includes('renderMarkdownNodes(message.content'), true);
  assert.equal(indexPage.includes('<rich-text'), true);
  assert.equal(indexPage.includes('message.role === \'ai\''), true);
  assert.equal(featureScreen.includes("from '../../common/markdown-render.mjs'"), true);
  assert.equal(featureScreen.includes('renderMarkdownNodes(message.content'), true);
  assert.equal(featureScreen.includes('<rich-text'), true);
  assert.equal(featureScreen.includes('message.role === \'ai\''), true);
});

test('Android app voice input structure is wired', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const voiceApi = read('common/app-voice-recognition.mjs');
  const composer = read('components/home/HomeComposer.vue');
  const indexPage = read('pages/index/index.vue');

  assert.deepEqual(manifest['app-plus'].modules.Speech, {});
  assert.equal(manifest['app-plus'].distribute.android.minSdkVersion, 23);
  assert.equal(
    manifest['app-plus'].distribute.android.permissions.includes(
      '<uses-permission android:name="android.permission.RECORD_AUDIO"/>',
    ),
    true,
  );
  assert.equal(count(voiceApi, 'createAppVoiceRecognitionController'), 1);
  assert.equal(count(voiceApi, 'VOICE_AUTO_LISTENING_STORAGE_KEY'), 2);
  assert.equal(voiceApi.includes('plusApi?.speech'), true);
  assert.equal(voiceApi.includes("'android.permission.RECORD_AUDIO'"), true);
  assert.equal(composer.includes('defineProps({'), true);
  assert.equal(composer.includes('voiceListening: {'), true);
  assert.equal(composer.includes('voiceEnabled: {'), true);
  assert.equal(composer.includes('voiceSupported: {'), true);
  assert.equal(composer.includes('voiceStatusText: {'), true);
  assert.equal(
    composer.includes("defineEmits(['send', 'voice-enable-requested', 'voice-disable-requested'])"),
    true,
  );
  assert.equal(composer.includes("emit('voice-enable-requested')"), true);
  assert.equal(composer.includes("emit('voice-disable-requested')"), true);
  assert.equal(indexPage.includes("import { onBackPress, onHide, onShow } from '@dcloudio/uni-app'"), true);
  assert.equal(indexPage.includes('createAppVoiceRecognitionController'), true);
  assert.equal(indexPage.includes('const voiceRecognition = createAppVoiceRecognitionController()'), true);
  assert.equal(indexPage.includes('const enableVoiceInput = async () =>'), true);
  assert.equal(indexPage.includes('const disableVoiceInput = () =>'), true);
  assert.equal(indexPage.includes('const startVoiceListening = async () =>'), true);
  assert.equal(indexPage.includes('const stopVoiceListening = () =>'), true);
  assert.equal(indexPage.includes('const handleVoiceResult = async (text) =>'), true);
  assert.equal(indexPage.includes('await handleSendMessage(recognizedText)'), true);
  assert.equal(indexPage.includes('onShow(() => {'), true);
  assert.equal(indexPage.includes('onHide(() => {'), true);
  assert.equal(indexPage.includes('@voice-enable-requested="enableVoiceInput"'), true);
  assert.equal(indexPage.includes('@voice-disable-requested="disableVoiceInput"'), true);
  assert.equal(indexPage.includes(':voice-listening="voiceListening"'), true);
});

test('Android home speaker text-to-speech structure is wired', () => {
  const header = read('components/home/HomeHeader.vue');
  const indexPage = read('pages/index/index.vue');
  const speakerApi = read('common/app-speaker.mjs');

  assert.equal(speakerApi.includes('createAppSpeaker'), true);
  assert.equal(speakerApi.includes("android.speech.tts.TextToSpeech"), true);
  assert.equal(speakerApi.includes('runtimeMainActivity'), true);
  assert.equal(header.includes('speakerEnabled: {'), true);
  assert.equal(header.includes("defineEmits(['menu', 'speaker-toggle'])"), true);
  assert.equal(header.includes('const isSpeakerOn = computed(() => props.speakerEnabled)'), true);
  assert.equal(header.includes("emit('speaker-toggle')"), true);
  assert.equal(indexPage.includes("import { createAppSpeaker } from '../../common/app-speaker.mjs'"), true);
  assert.equal(indexPage.includes('const speaker = createAppSpeaker()'), true);
  assert.equal(indexPage.includes('const speakerEnabled = ref(false)'), true);
  assert.equal(indexPage.includes('const toggleSpeaker = () =>'), true);
  assert.equal(indexPage.includes('const speakAssistantReply = async (content) =>'), true);
  assert.equal(indexPage.includes('await speakAssistantReply(finalAssistantContent)'), true);
  assert.equal(indexPage.includes(':speaker-enabled="speakerEnabled"'), true);
  assert.equal(indexPage.includes('@speaker-toggle="toggleSpeaker"'), true);
  assert.equal(indexPage.includes('speaker.destroy()'), true);
  assert.equal(indexPage.includes('onBackPress(() => {'), true);
});

test('Android shell uses system status and navigation safe areas', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const statusBar = read('components/home/HomeStatusBar.vue');
  const composer = read('components/home/HomeComposer.vue');

  assert.equal(manifest.name, 'Emotion AI');
  assert.equal(manifest['app-plus'].statusbar.immersed, true);
  assert.deepEqual(manifest['app-plus'].screenOrientation, ['portrait-primary']);
  assert.equal(statusBar.includes('var(--status-bar-height, 24px)'), true);
  assert.equal(statusBar.includes('14:49'), false);
  assert.equal(statusBar.includes('60%'), false);
  assert.equal(composer.includes('env(safe-area-inset-bottom)'), true);
  assert.equal(composer.includes('home-indicator'), false);
});

test('home side drawer renders synced profile avatar and name', () => {
  const sideDrawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(sideDrawer.includes('profile.avatarUrl'), true);
  assert.equal(sideDrawer.includes('class="avatar-image"'), true);
  assert.equal(sideDrawer.includes(':src="profile.avatarUrl"'), true);
  assert.equal(sideDrawer.includes('{{ profile.name }}'), true);
});
