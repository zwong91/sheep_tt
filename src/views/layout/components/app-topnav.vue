<script lang="ts" setup name="AppTopnav"></script>
<template>
    <nav class="app-topnav">
        <div class="container">
            <h1>layout布局</h1>
            <h1><router-link to="/">首页</router-link></h1>
            <h1><router-link to="/test">Test</router-link></h1>
        </div>
    </nav>
</template>

<style scoped lang="less">
.app-topnav {
    background: #333;
    min-height: 80px;

    .container {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 30px;
    }
}
</style>
