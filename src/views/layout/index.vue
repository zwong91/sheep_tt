<script setup lang="ts">
// 导入组件
import AppTopNavVue from './components/app-topnav.vue'
import AppFooterVue from './components/app-footer.vue'
</script>
<script lang="ts">
export default {
  name: 'layout'
}
</script>
<template>
  <!-- 顶部通栏组件 -->
  <!-- <AppTopNavVue></AppTopNavVue> -->
  <!-- 二级路由出口 -->
  <router-view></router-view>
  <!-- 底部通栏组件 -->
  <!-- <AppFooterVue></AppFooterVue> -->
</template>
<style scoped lang="less"></style>