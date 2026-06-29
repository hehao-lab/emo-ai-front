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
  assert.equal(indexPage.includes('const handleLoginSuccess = () => {'), true);
  assert.equal(indexPage.includes("currentScreen.value = 'home'"), true);
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
  assert.equal(header.includes("defineEmits(['menu'])"), true);
  assert.equal(header.includes('@tap="emit(\'menu\')"'), true);
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
  assert.equal(drawer.includes("const emit = defineEmits(['close', 'settings', 'open-page'])"), true);
  assert.equal(drawer.includes('@tap="emit(\'settings\')"'), true);
});

test('settings screen open action does not reuse the drawer close action', () => {
  const indexPage = read('pages/index/index.vue');

  assert.equal(indexPage.includes('const openSettings = () => {'), true);
  assert.equal(indexPage.includes('closeMenu()'), false);
});

test('side drawer renders the settings control with a gear icon structure', () => {
  const drawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(drawer.includes('class="settings-gear"'), true);
  assert.equal(drawer.includes('settings-gear__ring'), true);
  assert.equal(drawer.includes('settings-gear__hole'), true);
});

test('side drawer clickable modules emit single-page destinations', () => {
  const drawer = read('components/home/HomeSideDrawer.vue');

  assert.equal(drawer.includes("defineEmits(['close', 'settings', 'open-page'])"), true);
  assert.equal(drawer.includes("@tap=\"emit('open-page', link.key)\""), true);
  assert.equal(drawer.includes("@tap=\"emit('open-page', 'important-records')\""), true);
  assert.equal(drawer.includes("@tap.stop=\"emit('open-page', 'important-record-create')\""), true);
  assert.equal(drawer.includes("@tap=\"emit('open-page', 'chat-records')\""), true);
  assert.equal(drawer.includes('hover-class="quick-card--active"'), true);
  assert.equal(drawer.includes('hover-class="record-area--active"'), true);
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
  assert.equal(featureScreen.includes('personal-profile'), true);
  assert.equal(featureScreen.includes('profile-grid'), true);
  assert.equal(featureScreen.includes('profile-field'), true);
  assert.equal(featureScreen.includes('profile-textarea'), true);
  assert.equal(featureScreen.includes('年龄'), true);
  assert.equal(featureScreen.includes('性别'), true);
  assert.equal(featureScreen.includes('MBTI人格'), true);
  assert.equal(featureScreen.includes('关系说明'), true);
  assert.equal(featureScreen.includes('对自己性格的简单评价'), true);
});

test('target info feature page renders a dedicated relationship form layout', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('targetProfileFields'), true);
  assert.equal(featureScreen.includes('targetProfileNotes'), true);
  assert.equal(featureScreen.includes('target-profile'), true);
  assert.equal(featureScreen.includes('target-grid'), true);
  assert.equal(featureScreen.includes('target-field'), true);
  assert.equal(featureScreen.includes('target-textarea'), true);
  assert.equal(featureScreen.includes('对方称呼'), true);
  assert.equal(featureScreen.includes('对方年龄'), true);
  assert.equal(featureScreen.includes('对方性别'), true);
  assert.equal(featureScreen.includes('当前关系'), true);
  assert.equal(featureScreen.includes('互动频率'), true);
  assert.equal(featureScreen.includes('关系目标'), true);
  assert.equal(featureScreen.includes('对方性格与相处特点'), true);
  assert.equal(featureScreen.includes('最近一次关键互动'), true);
});

test('important record create page renders a dedicated event form layout', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('recordCreateFields'), true);
  assert.equal(featureScreen.includes('record-create'), true);
  assert.equal(featureScreen.includes('record-form-list'), true);
  assert.equal(featureScreen.includes('record-textarea'), true);
  assert.equal(featureScreen.includes('事件描述'), true);
  assert.equal(featureScreen.includes('矛盾解决方式'), true);
  assert.equal(featureScreen.includes('你在这件事情上在意的点'), true);
  assert.equal(featureScreen.includes('解决方式是否满意'), true);
  assert.equal(featureScreen.includes('保存记录'), true);
});

test('important record create page supports recording multiple events', () => {
  const featureScreen = read('components/home/HomeFeatureScreen.vue');

  assert.equal(featureScreen.includes('recordCreateEvents'), true);
  assert.equal(featureScreen.includes('v-for="event in recordCreateEvents"'), true);
  assert.equal(featureScreen.includes('事件 {{ event.index }}'), true);
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
  assert.equal(settingsScreen.includes("defineEmits(['back', 'logout'])"), true);
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
    /const resetHomeUiState = \(\) => \{\s*menuOpen\.value = false\s*activeFeatureKey\.value = ''\s*\}/,
  );
  assert.match(
    indexPage,
    /const handleLoginSuccess = \(\) => \{\s*resetHomeUiState\(\)\s*currentScreen\.value = 'home'\s*\}/,
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
