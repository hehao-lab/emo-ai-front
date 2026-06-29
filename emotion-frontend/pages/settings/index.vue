<script setup>
import SettingsScreen from '../../components/settings/SettingsScreen.vue'

const goBack = () => {
  uni.navigateBack({
    delta: 1,
  })
}
</script>

<template>
  <SettingsScreen @back="goBack" />
</template>
