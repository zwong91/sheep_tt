<script setup lang='ts' name="HomeView"></script>
<template>
  <div class="home_view">
    <div class="container">
      <h1>Home</h1>
      <div style="height: 500px;width: 800px;">
        <BBBOX>
          <div style="height: 100%;display: flex;justify-content: center;align-items: center;">
            通用组件 不需要导入直接使用 已经全局注册过了
          </div>
        </BBBOX>
      </div>
    </div>
  </div>
</template>
<style scoped lang='less'>
.home_view {
  background: black;
  min-height: calc(100vh - 80px - 100px);

  .container {
    padding: 60px 0 40px 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }
}
</style>