<script setup>
import { ref } from 'vue'
import HomeChatCard from '../../components/home/HomeChatCard.vue'
import HomeComposer from '../../components/home/HomeComposer.vue'
import HomeFeatureScreen from '../../components/home/HomeFeatureScreen.vue'
import HomeHeader from '../../components/home/HomeHeader.vue'
import HomeSideDrawer from '../../components/home/HomeSideDrawer.vue'
import HomeStatusBar from '../../components/home/HomeStatusBar.vue'
import HomeTopics from '../../components/home/HomeTopics.vue'
import LoginScreen from '../../components/login/LoginScreen.vue'
import SettingsScreen from '../../components/settings/SettingsScreen.vue'
import {
  hotTopics,
  messageLines,
  sidebarProfile,
  sidebarQuickLinks,
} from '../../common/home-data'

const menuOpen = ref(false)
const currentScreen = ref('login')
const activeFeatureKey = ref('')

const openMenu = () => {
  menuOpen.value = true
}

const closeMenu = () => {
  menuOpen.value = false
}

const resetHomeUiState = () => {
  menuOpen.value = false
  activeFeatureKey.value = ''
}

const handleLoginSuccess = () => {
  resetHomeUiState()
  currentScreen.value = 'home'
}

const openSettings = () => {
  currentScreen.value = 'settings'
}

const openFeaturePage = (featureKey) => {
  menuOpen.value = false
  activeFeatureKey.value = featureKey
  currentScreen.value = 'feature'
}

const backToHome = () => {
  resetHomeUiState()
  currentScreen.value = 'home'
}

const backToLogin = () => {
  resetHomeUiState()
  currentScreen.value = 'login'
}
</script>

<template>
  <view class="app-shell">
    <LoginScreen v-if="currentScreen === 'login'" @success="handleLoginSuccess" />

    <HomeFeatureScreen
      v-else-if="currentScreen === 'feature'"
      :feature-key="activeFeatureKey"
      @back="backToHome"
    />

    <SettingsScreen v-else-if="currentScreen === 'settings'" @back="backToHome" @logout="backToLogin" />

    <view v-else class="page-shell">
      <view class="page" :class="{ 'page--menu-open': menuOpen }">
        <HomeStatusBar />
        <HomeHeader @menu="openMenu" />
        <HomeTopics :topics="hotTopics" />

        <text class="timeline">12:22</text>

        <HomeChatCard :message-lines="messageLines" />
        <HomeComposer />
      </view>

      <HomeSideDrawer
        :open="menuOpen"
        :profile="sidebarProfile"
        :quick-links="sidebarQuickLinks"
        @close="closeMenu"
        @settings="openSettings"
        @open-page="openFeaturePage"
      />
    </view>
  </view>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
}

.page-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.page {
  min-height: 100vh;
  padding: 38rpx 22rpx 18rpx;
  background: linear-gradient(180deg, #f2ecf8 0%, #e9ebf9 34%, #dcebfa 100%);
  transition: filter 220ms ease;
}

.page--menu-open {
  filter: brightness(0.98) saturate(0.92);
}

.timeline {
  display: block;
  margin-top: 56rpx;
  color: #9ba3b5;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}
</style>
