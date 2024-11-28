<script setup lang="ts" name="HomeView">
import * as Tone from 'tone'
import { ref } from 'vue'
import RecordRTC from 'recordrtc'
import { StereoAudioRecorder } from 'recordrtc'

// 创建音频输入
const mic = new Tone.UserMedia()
const radius = ref()
//获取页面宽度
const width = (document.documentElement.clientWidth / 8) * 2.8 //圆的大小
const amplitude = width / 6

// 启动麦克风
async function startMic() {
  try {
    await mic.open() // 打开麦克风
    console.log('Mic opened successfully')

    const analyser = new Tone.Analyser('waveform', 256) // 创建分析器
    mic.connect(analyser) // 连接麦克风到分析器

    function animate() {
      requestAnimationFrame(animate) // 循环调用 animate 函数

      const waveform: any = analyser.getValue() // 获取波形数据
      // console.log(waveform)

      // 如果所有值都是0，打印提示
      if (waveform.every((value: number) => value === 0)) {
        console.log('No data yet, waiting for audio input...')
      } else {
        const avg =
          waveform.reduce(
            (sum: number, value: number) => sum + Math.abs(value),
            0
          ) / waveform.length
        radius.value =
          width + (avg * 1118 * 5 > amplitude ? amplitude : avg * 1118 * 5) // 根据波形数据设置半径大小
      }

      // 根据 waveform 数据做出动画
      // 你可以用这些数据去绘制或者触发动画
    }

    animate()
  } catch (error) {
    console.error('Error opening mic:', error)
  }
}
startMic()

let recorder: { startRecording: () => void; stopRecording: () => void }
let socket
let audioChunks: any[] = []
let isRecording = false // 初始设置为 false，录音开始时才为 true

const startTranscription = async () => {
  try {
    // 获取音频流
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    // 配置 RecordRTC
    recorder = RecordRTC(stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      mimeType: 'audio/wav',
      timeSlice: 500, // 每500ms触发一次数据回调
      desiredSampRate: 16000, // 设置采样率为16kHz
      numberOfAudioChannels: 1, // 单声道
      ondataavailable: async (blob: any) => {
        // console.log('ondataavailable triggered')
        if (isRecording) {
          audioChunks.push(blob)
          // console.log('audioChunks:', audioChunks)
        }
      }
    })

    // 开始录音
    isRecording = true
    recorder.startRecording()
  } catch (error: any) {
    console.error('Error accessing media devices:', error)
    alert('无法访问媒体设备: ' + error.message)
  }
}
</script>
<template>
  <div class="home_view">
    <div class="centerR" :style="{ '--radius': `${radius}px` }"></div>
    <button @click="startTranscription">开始</button>
    {{ audioChunks.length }}
  </div>
</template>
<style scoped lang="less">
.home_view {
  background: black;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .centerR {
    transition: all 0.3s ease;
    width: var(--radius, 50px);
    height: var(--radius, 50px);
    border-radius: 50%;
    background: white;
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.216);
  }
}
</style>
