<script lang="ts" setup name="AppFooter"></script>
<template>
  <footer class="app_footer">
    <div class="container">
      <h1>页脚</h1>
    </div>
  </footer>
</template>

<style scoped lang="less">
.app_footer {
  overflow: hidden;
  background-color: green;
  min-height: 100px;

  .container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
