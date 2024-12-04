<!-- <script setup lang="ts" name="HomeView">
import * as Tone from 'tone'
import { nextTick, ref } from 'vue'
import RecordRTC from 'recordrtc'
import { StereoAudioRecorder } from 'recordrtc'
import Recorder from 'recorder-core'
// 设置初始背景噪音级别和采样计数
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

    // 动画函数
    function animate() {
      requestAnimationFrame(animate) // 循环调用 animate 函数

      const waveform: any = analyser.getValue() // 获取音频的波形数据

      // 如果所有值都是0，等待音频输入
      if (waveform.every((value: number) => value === 0)) {
        return
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

let recorder: { startRecording: () => void; stopRecording: () => void }
let socket: WebSocket
let audioChunks: any[] = []
let isRecording = false // 初始设置为 false，录音开始时才为 true
const text = ref('正在拨号')
const Qtext = ref([['', '']])
const Atext = ref('')
const audioData = ref<string[]>([])

// 停止录音时合并并播放所有音频数据
const stopRecordingAndPlay = async () => {
  // 停止录制
  recorder.stopRecording()

  // 合并所有音频片段
  const combinedBlob = new Blob(audioChunks, { type: 'audio/wav' })

  // 创建一个 URL 来播放合并后的 Blob
  const audioUrl = URL.createObjectURL(combinedBlob)

  // 创建 Audio 元素并播放音频
  const audioElement = new Audio(audioUrl)
  audioElement
    .play()
    .then(() => {
      console.log('Audio is playing')
    })
    .catch(error => {
      console.error('Error playing audio:', error)
    })

  // 你可以在此处继续处理音频（例如转换为 Base64）
  const arrayBuffer = await combinedBlob.arrayBuffer()
  const base64data = arrayBufferToBase64(arrayBuffer) // 转换为 Base64 字符串

  // 构建要发送的数据
  const data_to_send = [Qtext.value, 'Azure-xiaoxiao', base64data]

  // 检查 WebSocket 状态并发送数据
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

  // 清空音频片段数组，准备下次录制
  audioChunks.length = 0
}

// 假设你需要在某个地方停止录音并播放
// 停止录音并播放音频

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
      timeSlice: 300, // 每500ms触发一次数据回调
      desiredSampRate: 16000, // 设置采样率为16kHz
      numberOfAudioChannels: 1, // 单声道
      ondataavailable: async (blob: any) => {
        audioChunks.push(blob)
        console.log('1:', 1)
        if (isRecording) {
          const blob = new Blob(audioChunks, { type: 'audio/wav' })
          // playRecording()
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
      startMic()
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
      startTranscription()
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
        // audioData.value.push(`https://108.136.246.72:5555/asset/${audio}`)
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
// 用于依次播放音频数据块
const playRecording = () => {
  if (audioChunks.length === 0) {
    console.error('No audio data to play!')
    return
  }

  // 创建一个播放队列，每次从队列中取出一个音频片段
  let currentIndex = 0

  // 播放音频的函数
  const playNextAudio = () => {
    if (currentIndex < audioChunks.length) {
      const blob = audioChunks[currentIndex] // 获取当前音频片段
      const audioUrl = URL.createObjectURL(blob) // 创建音频的 URL
      const audioElement = new Audio(audioUrl)

      // 播放当前音频片段
      audioElement
        .play()
        .then(() => {
          console.log('Audio is playing')
        })
        .catch(error => {
          console.error('Error playing audio:', error)
        })

      // 设置音频播放完后的回调，播放下一个音频片段
      audioElement.onended = () => {
        currentIndex++ // 更新索引
        playNextAudio() // 递归播放下一个音频片段
      }
    } else {
      console.log('All audio chunks have been played!')
    }
  }

  // 开始播放第一个音频片段
  playNextAudio()
}

startTranscription()

nextTick(() => {
  console.log('1:', 1)
  document.body.click()
})
</script> -->
<script setup lang="ts" name="HomeView">
//必须引入的核心
import Recorder from 'recorder-core'
declare var vad: any
import { StereoAudioRecorder } from 'recordrtc'
import RecordRTC from 'recordrtc'

//引入mp3格式支持文件；如果需要多个格式支持，把这些格式的编码引擎js文件放到后面统统引入进来即可
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'
//录制wav格式的用这一句就行
import 'recorder-core/src/engine/wav'

//可选的插件支持项，这个是波形可视化插件
import 'recorder-core/src/extensions/waveview'
import { ref } from 'vue'
//ts import 提示：npm包内已自带了.d.ts声明文件（不过是any类型）

let rec: any
let recBlob: any
let wave: any
const recwave = ref(null)

let recorder: { startRecording: () => void; stopRecording: () => void }
let socket: WebSocket
let audioChunks: any[] = []
// let isRecording = false // 初始设置为 false，录音开始时才为 true
const text = ref('正在拨号')
const Qtext = ref([['', '']])
const Atext = ref('')
const audioData = ref<string[]>([])
const number = ref(0)

const speechShow = ref(false)
const powerLevelShow = ref(false)
const powerLevelF = ref(0)
let timer: string | number | NodeJS.Timeout | undefined
// 打开录音
function recOpen() {
  //创建录音对象
  rec = Recorder({
    type: 'wav', //录音格式，可以换成wav等其他格式
    sampleRate: 6000, //录音的采样率，越大细节越丰富越细腻
    bitRate: 16, //录音的比特率，越大音质越好
    onProcess: (
      buffers: any,
      powerLevel: any,
      bufferDuration: any,
      bufferSampleRate: any,
      newBufferIdx: any,
      asyncEnd: any
    ) => {
      //录音实时回调，大约1秒调用12次本回调
      //可实时绘制波形，实时上传（发送）数据
      if (wave) {
        powerLevelF.value = powerLevel
        // console.log('powerLevel:', powerLevel)
        if (speechShow.value && powerLevel > 35) {
          powerLevelShow.value = true
        }
        wave.input(buffers[buffers.length - 1], powerLevel, bufferSampleRate)
      }
    }
  })
  if (!rec) {
    alert('当前浏览器不支持录音功能！')
    return
  }
  //打开录音，获得权限
  rec.open(
    () => {
      console.log('录音已打开')
      if (recwave.value) {
        //创建音频可视化图形绘制对象
        wave = Recorder.WaveView({ elem: recwave.value })
      }
    },
    (msg: any, isUserNotAllow: any) => {
      //用户拒绝了录音权限，或者浏览器不支持录音
      console.log((isUserNotAllow ? 'UserNotAllow，' : '') + '无法录音:' + msg)
    }
  )
}
// 开始录音
function recStart() {
  if (!rec) {
    console.error('未打开录音')
    return
  }
  rec.start()
  console.log('已开始录音')
}
// 结束录音
function recStop() {
  if (!rec) {
    console.error('未打开录音')
    return
  }
  rec.stop(
    (blob: any, duration: any) => {
      //blob就是我们要的录音文件对象，可以上传，或者本地播放
      recBlob = blob
      //简单利用URL生成本地文件地址，此地址只能本地使用，比如赋值给audio.src进行播放，赋值给a.href然后a.click()进行下载（a需提供download="xxx.mp3"属性）
      const localUrl = (window.URL || window.webkitURL).createObjectURL(blob)
      console.log('录音成功', blob, localUrl, '时长:' + duration + 'ms')
      upload(blob) //把blob文件上传到服务器
      rec.close() //关闭录音，释放录音资源，当然可以不释放，后面可以连续调用start
      rec = null
    },
    (err: any) => {
      console.error('结束录音出错：' + err)
      rec.close() //关闭录音，释放录音资源，当然可以不释放，后面可以连续调用start
      rec = null
    }
  )
}
// 上传录音
function upload(blob: any) {
  //使用FormData用multipart/form-data表单上传文件
  //或者将blob文件用FileReader转成base64纯文本编码，使用普通application/x-www-form-urlencoded表单上传
  // const form = new FormData();
  // form.append('upfile', blob, 'recorder.mp3'); // 和普通form表单并无二致，后端接收到upfile参数的文件，文件名为recorder.mp3
  // form.append('key', 'value'); // 其他参数
  // var xhr = new XMLHttpRequest();
  // xhr.open('POST', '/upload/xxxx');
  // xhr.onreadystatechange = () => {
  //   if (xhr.readyState == 4) {
  //     if (xhr.status == 200) {
  //       console.log('上传成功');
  //     } else {
  //       console.error('上传失败' + xhr.status);
  //     }
  //   }
  // };
  // xhr.send(form);
  // 也可以写自己的上传函数
  // uploadService(blob, 'zengjiaqi_test.wav');
}
// 本地播放录音
function recPlay() {
  //本地播放录音试听，可以直接用URL把blob转换成本地播放地址，用audio进行播放
  const localUrl = URL.createObjectURL(recBlob)
  const audio = document.createElement('audio')
  audio.controls = true
  document.body.appendChild(audio)
  audio.src = localUrl
  audio.play() //这样就能播放了
  //注意不用了时需要revokeObjectURL，否则霸占内存
  setTimeout(function () {
    URL.revokeObjectURL(audio.src)
  }, 5000)
}
// 启动人声检测
async function main() {
  const myvad = await vad.MicVAD.new({
    onSpeechStart: () => {
      speechShow.value = true
      if (timer) {
        clearTimeout(timer)
      }
      console.log('检测到人声')
    },
    onSpeechEnd: (audio: any) => {
      console.log('结束:')
      speechShow.value = false
      if (powerLevelShow.value) {
        timer = setTimeout(() => {
          console.log('powerLevelShow.value:', powerLevelShow.value)
          okBlob()
          powerLevelShow.value = false
        }, 1000)
      } else audioChunks = []
    }
  })

  myvad.start()
}
recOpen()

const startTranscription = async () => {
  try {
    // 获取音频流
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    // 创建 WebSocket 连接
    socket = new WebSocket('wss://gtp.aleopool.cc/transcribe')

    // 创建 MediaRecorder 实例
    // 配置 RecordRTC
    recorder = RecordRTC(stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      mimeType: 'audio/wav',
      timeSlice: 30, // 每500ms触发一次数据回调
      desiredSampRate: 16000, // 设置采样率为16kHz
      numberOfAudioChannels: 1, // 单声道
      ondataavailable: async (blob: any) => {
        // audioChunks.push(blob)

        const base64 = await blobToBase64(blob)
        // console.log('base64:', base64)
        audioChunks.push(base64)
        // number.value++
        if (speechShow.value) {
        }
      }
    })

    // WebSocket 连接成功时启动录音
    socket.onopen = () => {
      text.value = '已拨通'
      // isRecording = true
      recorder.startRecording()
      main()
      recStart()
    }

    // WebSocket 错误处理
    socket.onerror = error => {
      console.error('WebSocket error:', error)
      // alert(error)
      text.value = 'WebSocket 错误'
    }

    // WebSocket 连接关闭
    socket.onclose = () => {
      startTranscription()
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
        // isRecording = false
      }
      // 格式化输出
    }
  } catch (error: any) {
    console.error('Error accessing media devices:', error)
    alert('无法访问媒体设备: ' + error.message)
  }
}

// 将 Blob 转换为 Base64
function blobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader: any = new FileReader()
    reader.onloadend = () => resolve(reader!.result?.split(',')[1]) // 提取 Base64 数据部分
    reader.onerror = (error: any) => reject(error)
    reader.readAsDataURL(blob)
  })
}
// 将 ArrayBuffer 转换为 Base64 字符串
// function arrayBufferToBase64(buffer: any) {
//   const bytes = new Uint8Array(buffer)
//   let binary = ''
//   for (let i = 0; i < bytes.byteLength; i++) {
//     binary += String.fromCharCode(bytes[i])
//   }
//   return window.btoa(binary) // 使用 btoa 转换为 Base64 字符串
// }
const endedFn = (e: any) => {
  // console.log('e:', e)
  audioData.value = []
}
function base64ToBlob(base64: string, mimeType = '') {
  // 将 Base64 字符串解码为二进制字符串
  const byteCharacters = atob(base64)

  // 将二进制字符串转化为 Uint8Array
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)

  // 将 Uint8Array 转换为 Blob
  return new Blob([byteArray], { type: mimeType })
}

const okBlob = async () => {
  // console.log('audioChunks:', audioChunks)
  // playRecording()
  // console.log('audioChunks:', audioChunks)
  // const blob = new Blob(audioChunks, { type: 'audio/wav' })
  // const arrayBuffer = await blob.arrayBuffer()
  // const base64data = arrayBufferToBase64(arrayBuffer) // 转换为 Base64 字符串
  const base64data = mergeBase64Audio(audioChunks)
  // 将合并后的 Base64 数据转换为 Blob
  // const mergedBlob = base64ToBlob(base64data, 'audio/wav')

  audioChunks = []

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
  number.value = 0
}

startTranscription()

// 播放录制的音频
// const playRecording = () => {
//   // console.log('audioChunks.length:', audioChunks.length)
//   // console.log('number.value:', number.value)
//   if (audioChunks.length === 0) {
//     // console.error('No audio data to play!')
//     return
//   }

//   // 合并所有音频块成一个 Blob
//   const combinedBlob = new Blob(audioChunks, { type: 'audio/wav' })

//   // 创建一个 URL 来播放合并后的 Blob
//   const audioUrl = URL.createObjectURL(combinedBlob)

//   // 创建一个 audio 元素并播放音频
//   const audioElement = new Audio(audioUrl)
//   audioElement
//     .play()
//     .then(() => {
//       console.log('Audio is playing')
//     })
//     .catch(error => {
//       console.error('Error playing audio:', error)
//     })

//   // 可选：清空音频数据
// }
// 函数：将 Base64 字符串转换为二进制数据
function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64) // 解码 Base64 字符串
  const len = binaryString.length
  const bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

// 函数：将二进制数据转换为 Base64 字符串
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const len = bytes.length

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary) // 将二进制数据转换回 Base64
}

// 合并多个 Base64 数据
function mergeBase64Audio(base64Array: string[]) {
  // 将每个 Base64 数据解码为二进制数据
  let mergedArray = new Uint8Array(0)

  base64Array.forEach(base64 => {
    const arrayBuffer = base64ToArrayBuffer(base64)
    const newUint8Array = new Uint8Array(
      mergedArray.byteLength + arrayBuffer.byteLength
    )

    // 将之前的数组和新的数组拼接起来
    newUint8Array.set(new Uint8Array(mergedArray), 0)
    newUint8Array.set(new Uint8Array(arrayBuffer), mergedArray.byteLength)

    mergedArray = newUint8Array
  })

  // 将合并后的二进制数据转换为 Base64 字符串
  return arrayBufferToBase64(mergedArray.buffer)
}
</script>
<template>
  <div class="home_view">
    <div>
      <!-- <div>
        <button @click="recOpen">打开录音,请求权限</button>
        | <button @click="recStart">开始录音</button>
        <button @click="recStop">结束录音</button>
        | <button @click="recPlay">本地试听</button>
      </div> -->
      <div style="padding-top: 5px">
        <!-- 波形绘制区域 -->

        <div style="height: 100px; width: 300px" ref="recwave"></div>
      </div>
    </div>
    <!-- <canvas id="canvas" width="400" height="400"></canvas> -->
    <!-- <div class="centerR" :style="{ '--radius': `${radius}px` }"></div> -->
    <audio v-if="audioData.length" @ended="endedFn" autoplay>
      <source :src="audioData[audioData.length - 1]" />
      Your browser does not support the audio element.
    </audio>
    <!-- <button @click="startTranscription">开始</button> -->
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
