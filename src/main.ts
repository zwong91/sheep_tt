import { createApp } from 'vue'
import App from './App.vue'
// 导入 normalize
import 'normalize.css'
// 导入自定义的公共样式
import '@/assets/styles/common.less'
// 导入路由
import router from './router/index'
// 导入复用组件
import plugin from "./components/index";
// 导入 pinia
import { createPinia } from 'pinia'
let pinia = createPinia()

createApp(App).use(router)
    .use(router)
    .use(pinia)
    .use(plugin)
    .mount('#app')
