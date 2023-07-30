// 统一管理所有的 pinia store
import useHomeStore from './modules/home'
export default function useStore () {
  return {
    home: useHomeStore()
  }
}