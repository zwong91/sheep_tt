<script setup lang="ts" name="HomeView">
import * as Tone from 'tone'
import { ref } from 'vue'
import RecordRTC from 'recordrtc'
import { StereoAudioRecorder } from 'recordrtc'
import { setTimeout } from 'timers'

// 设置初始背景噪音级别和采样计数
let backgroundNoiseLevel = 0 // 用于存储背景噪音的基准能量
let noiseSamplingCount = 0
const noiseThreshold = 0.5 // 背景噪声的阈值因子
const isSpeaking = ref(false) // 记录是否有语音活动

// 创建音频输入
const mic = new Tone.UserMedia()
const width = (document.documentElement.clientWidth / 8) * 1.6 // 圆的大小
const radius = ref(width / 1.5) // 初始圆的半径
const amplitude = width / 3.5 // 震动幅度

const maxRadius = width + amplitude // 设置最大半径
const transitionSpeed = 0.1 // 设置过渡速度

// 启动麦克风并开始音频分析
async function startMic() {
  try {
    await mic.open() // 打开麦克风
    console.log('Mic opened successfully')

    const analyser = new Tone.Analyser('waveform', 256) // 创建分析器
    mic.connect(analyser) // 连接麦克风到分析器

    // 采样背景噪音
    function sampleBackgroundNoise(waveform: number[]) {
      const energy = waveform.reduce(
        (sum, value) => sum + Math.abs(value) ** 2,
        0
      ) // 计算波形的能量
      backgroundNoiseLevel =
        (backgroundNoiseLevel * noiseSamplingCount + energy) /
        (noiseSamplingCount + 1) // 更新背景噪音的基准能量
      noiseSamplingCount += 1
    }

    // 动态调整阈值
    function adjustThreshold(waveform: number[], baseThreshold: number = 0.5) {
      const energy = waveform.reduce(
        (sum, value) => sum + Math.abs(value) ** 2,
        0
      ) // 计算当前音频的能量
      const threshold = Math.max(
        baseThreshold,
        backgroundNoiseLevel * noiseThreshold
      ) // 根据背景噪音调整阈值
      return energy > threshold // 如果当前音频的能量超过阈值，则认为有语音活动
    }

    // 动画函数
    function animate() {
      requestAnimationFrame(animate) // 循环调用 animate 函数

      const waveform: any = analyser.getValue() // 获取音频的波形数据

      // 如果所有值都是0，等待音频输入
      if (waveform.every((value: number) => value === 0)) {
        return
      }

      // 采样背景噪音并动态调整阈值
      sampleBackgroundNoise(waveform)

      // 判断是否为语音活动
      const isSpeechDetected = adjustThreshold(waveform)

      if (isSpeechDetected) {
        if (!isSpeaking.value) {
          isSpeaking.value = true
          console.log('Speech detected')
        }
      } else {
        if (isSpeaking.value) {
          isSpeaking.value = false
          console.log('Speech ended')
        }
      }

      // 计算波形数据的平均值，用于控制圆的缩放效果
      const avg =
        waveform.reduce(
          (sum: number, value: number) => sum + Math.abs(value),
          0
        ) / waveform.length
      const targetRadius = Math.min(width + avg * 1118, maxRadius) // 根据波形数据调整圆的半径

      // 平滑过渡：逐渐将当前 radius 值过渡到 targetRadius
      radius.value += (targetRadius - radius.value) * transitionSpeed

      // 设置画布
      const canvas = document.querySelector('#canvas') as HTMLCanvasElement
      const ctx = canvas.getContext('2d')!

      // 初始化圆形的基本参数
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      if (ctx) {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 设置圆的颜色和样式
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'

        // 绘制圆
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius.value, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
    animate()
  } catch (error) {
    console.error('Error opening mic:', error)
  }
}
startMic()

let recorder: { startRecording: () => void; stopRecording: () => void }
let socket: WebSocket
let audioChunks: any[] = []
let isRecording = false // 初始设置为 false，录音开始时才为 true
const text = ref('正在拨号')
const Qtext = ref([['', '']])
const Atext = ref('')
const audioData = ref<string[]>([])

const startTranscription = async () => {
  try {
    // 获取音频流
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    // 创建 WebSocket 连接
    socket = new WebSocket('wss://gtp.aleopool.cc/transcribe')

    // 配置 RecordRTC
    recorder = RecordRTC(stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      mimeType: 'audio/wav',
      timeSlice: 1500, // 每500ms触发一次数据回调
      desiredSampRate: 16000, // 设置采样率为16kHz
      numberOfAudioChannels: 1, // 单声道
      ondataavailable: async (blob: any) => {
        if (isRecording) {
          // audioChunks.push(blob)
          // const blob = new Blob(audioChunks, { type: 'audio/wav' })
          const arrayBuffer = await blob.arrayBuffer()
          const base64data = arrayBufferToBase64(arrayBuffer) // 转换为 Base64 字符串
          const data_to_send = [Qtext.value, 'Azure-xiaoxiao', base64data]

          // 检查 WebSocket 状态，如果连接还未建立，缓存数据直到连接成功
          if (socket.readyState === WebSocket.OPEN) {
            // WebSocket 已连接，发送数据
            socket.send(JSON.stringify(data_to_send))
          } else {
            // 连接还未建立，缓存数据
            socket.onopen = () => {
              text.value = 'WebSocket 已连接'
              socket.send(JSON.stringify(data_to_send)) // 连接成功后发送数据
            }
          }
        }
      }
    })

    // WebSocket 连接成功时启动录音
    socket.onopen = () => {
      text.value = '已拨通'
      isRecording = true
      recorder.startRecording()
    }

    // WebSocket 错误处理
    socket.onerror = error => {
      console.error('WebSocket error:', error)
      // alert(error)
      text.value = 'WebSocket 错误'
    }

    // WebSocket 连接关闭
    socket.onclose = () => {
      text.value = '已挂断'
    }

    // 绑定 WebSocket 消息事件
    socket.onmessage = message => {
      const received = message.data

      // 解析接收到的 JSON 数据
      const jsonData = JSON.parse(received)
      Qtext.value = jsonData['history']
      const audio = jsonData['audio']
      Atext.value = jsonData['text']

      if (audio != undefined) {
        audioData.value.push(`https://108.136.246.72:5555/asset/${audio}`)
        isRecording = false
      }
      // 格式化输出
    }
  } catch (error: any) {
    console.error('Error accessing media devices:', error)
    alert('无法访问媒体设备: ' + error.message)
  }
}

// 将 ArrayBuffer 转换为 Base64 字符串
function arrayBufferToBase64(buffer: any) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary) // 使用 btoa 转换为 Base64 字符串
}
const endedFn = (e: any) => {
  // console.log('e:', e)
  audioData.value = []
  isRecording = true
}

// startTranscription()
</script>
<template>
  <div class="home_view">
    <div id="status">
      {{ text }}
      <!-- <span style="color: red">{{
        isSpeaking ? '正在讲话' : '没有语音活动'
      }}</span> -->
    </div>
    <canvas id="canvas" width="400" height="400"></canvas>
    <!-- <div class="centerR" :style="{ '--radius': `${radius}px` }"></div> -->
    <audio v-if="audioData.length" @ended="endedFn" autoplay>
      <source :src="audioData[audioData.length - 1]" />
      Your browser does not support the audio element.
    </audio>
    <button @click="startTranscription">开始</button>
    <!-- {{ audioChunks.length }} -->
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
