<script lang="ts" setup name="BBBOX">
//接受参数
const props = defineProps({
    radius: {
        type: String,
        default: '20'
    },
    topColor: {
        type: String,
        default: 'greenyellow'
    },
    bottomColor: {
        type: String,
        default: 'palevioletred'
    },
    lineW: {
        type: String,
        default: '2'
    },
    bgc: {
        type: String,
        default: 'transparent'
    },
    blur: {
        type: String,
        default: '0'
    }
})
</script>
<script lang="ts">
export default { name: "BBBOX" }
</script>

<template>
    <div class="bb-box"
        :style="{ '--radius': radius + 'px', '--lineW': lineW + 'px', '--tc': topColor, '--bc': bottomColor, '--bodyradius': +radius - +lineW + 'px', '--bgc': bgc, '--blur': blur + 'px' }">
        <i class="left"></i>
        <i class="right"></i>
        <div class="body">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped lang='less'>
.bb-box {
    position: relative;
    overflow: hidden;
    height: 100%;
    width: 100%;
    border-radius: var(--radius);

    &::before,
    &::after {
        content: "";
        position: absolute;
        left: 0;
        width: 100%;
        height: 50%;
        box-sizing: border-box;
    }

    &::before {
        top: 0;
        border-radius: var(--radius) var(--radius) 0 0;
        border: var(--lineW) solid var(--tc);
        border-bottom: none;
    }

    &::after {
        bottom: 0;
        border-radius: 0 0 var(--radius) var(--radius);
        border: var(--lineW) solid var(--bc);
        border-top: none;
    }

    .left,
    .right {
        z-index: 1;
        top: 50%;
        transform: translateY(-50%);
        position: absolute;
        width: var(--lineW);
        height: 100%;
        background: linear-gradient(to bottom, var(--tc), var(--bc));
    }

    .left {
        left: 0;
    }

    .right {
        right: 0;
    }

    .body {
        position: absolute;
        top: var(--lineW);
        bottom: var(--lineW);
        left: var(--lineW);
        right: var(--lineW);
        border-radius: var(--bodyradius);
        background: var(--bgc);
        backdrop-filter: blur(var(--blur));
    }
}
</style>