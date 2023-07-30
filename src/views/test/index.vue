<script setup lang='ts' name="TestView"></script>
<template>
  <div class="test_view">
    <div class="container">
      <h1>Test</h1>
    </div>
  </div>
</template>
<style scoped lang='less'>
.test_view {
  background: black;
  min-height: calc(100vh - 80px - 100px);

  .container {
    padding: 60px 0 40px 25px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>