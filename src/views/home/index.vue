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
import { onMounted, onUnmounted, ref } from 'vue'
//ts import 提示：npm包内已自带了.d.ts声明文件（不过是any类型）

let showroot = ref(false)
let showroot1 = ref(false)
let showrootmkf = ref(true)

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

const speechShow = ref(true)
const powerLevelShow = ref(false)
let timer: string | number | NodeJS.Timeout | undefined
const width = document.body.clientWidth / 8
const powerLevelF = ref(width * 2.5)
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
      if (showroot.value && showrootmkf.value) {
        powerLevelF.value = width * 3 + powerLevel / 4
      }
      if (wave) {
        console.log('powerLevelF:', powerLevel)
        // console.log('powerLevel:', powerLevel)
        // if (speechShow.value && powerLevel > 35) {
        //   powerLevelShow.value = true
        // }
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
        // wave = Recorder.WaveView({ elem: recwave.value })
      }
      recStart()
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
      // rec = null
    },
    (err: any) => {
      console.error('结束录音出错：' + err)
      rec.close() //关闭录音，释放录音资源，当然可以不释放，后面可以连续调用start
      // rec = null
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
// async function main() {
//   const myvad = await vad.MicVAD.new({
//     onSpeechStart: () => {
//       speechShow.value = true
//       if (timer) {
//         clearTimeout(timer)
//       }
//       console.log('检测到人声')
//     },
//     onSpeechEnd: (audio: any) => {
//       console.log('结束:')
//       speechShow.value = false
//       if (powerLevelShow.value && showroot.value) {
//         timer = setTimeout(() => {
//           console.log('powerLevelShow.value:', powerLevelShow.value)
//           okBlob()
//           powerLevelShow.value = false
//         }, 500)
//       } else audioChunks = []
//     }
//   })

//   myvad.start()
// }
recOpen()

const startTranscription = async () => {
  showroot1.value = false
  try {
    // 获取音频流
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    // 创建 WebSocket 连接
    socket = new WebSocket('wss://gtp.aleopool.cc/stream-vc')

    // 创建 MediaRecorder 实例
    // 配置 RecordRTC
    recorder = RecordRTC(stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      mimeType: 'audio/wav',
      timeSlice: 1000, // 每500ms触发一次数据回调
      desiredSampRate: 16000, // 设置采样率为16kHz
      numberOfAudioChannels: 1, // 单声道
      ondataavailable: async (blob: any) => {
        // audioChunks.push(blob)

        // const base64 = await blobToBase64(blob)
        // console.log('base64:', base64)
        // audioChunks.push(base64)
        // number.value++
        if (speechShow.value && showroot1.value && showrootmkf.value) {
          // const base64data = mergeBase64Audio(audioChunks)
          // 将合并后的 Base64 数据转换为 Blob
          // const mergedBlob = base64ToBlob(base64data, 'audio/wav')

          // audioChunks = []
          const base64data = await blobToBase64(blob)

          const data_to_send = [Qtext.value, 'Azure-xiaoxiao', base64data]
          // 检查 WebSocket 状态，如果连接还未建立，缓存数据直到连接成功
          if (socket.readyState === WebSocket.OPEN && showroot.value) {
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
    socket.onopen = async () => {
      text.value = '已拨通'
      // isRecording = true
      await recorder.startRecording()
      showroot.value = true
      showroot1.value = true
      // main()
    }

    // WebSocket 错误处理
    socket.onerror = error => {
      console.error('WebSocket error:', error)
      // alert(error)
      text.value = 'WebSocket 错误'
    }

    // WebSocket 连接关闭
    socket.onclose = () => {
      // startTranscription()
      showroot1.value = false
      text.value = '已挂断'
    }

    // 绑定 WebSocket 消息事件
    socket.onmessage = message => {
      const received = message.data

      // 解析接收到的 JSON 数据
      const jsonData = JSON.parse(received)
      Qtext.value = jsonData['history']
      const audio = jsonData['audio']
      const stream = jsonData['stream']
      Atext.value = jsonData['text']

      playAudioFromBase64(stream)

      // if (audio != undefined) {
      //   // 将音频 URL 添加到 audioData 中
      //   audioData.value.push(`https://108.136.246.72:5555/asset/${audio}`)

      //   showroot1.value = false

      //   // 获取 ID 为 audiolkjsdlfkjdklf 的元素
      //   const audioDom: any = document.getElementById('audiolkjsdlfkjdklf')

      //   if (audioDom) {
      //     // recorder.stopRecording()
      //     // recStop()
      //     // 创建一个新的 Audio 元素并设置其 src 属性
      //     audioDom.src = `https://108.136.246.72:5555/asset/${audio}`

      //     // 监听 audio 元素的 onloadeddata 事件，确保音频数据加载完成
      //     audioDom.onloadeddata = () => {
      //       console.log('Audio loaded successfully')
      //       audioDom.play() // 播放音频
      //     }

      //     // 或者使用 oncanplaythrough 事件，确保音频可以播放
      //     audioDom.oncanplaythrough = () => {
      //       console.log('Audio is ready to play')
      //       audioDom.play() // 播放音频
      //     }
      //   }
      // }
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
const endedFn = (e: any) => {
  // console.log('e:', e)
  audioData.value = []
  showroot1.value = true

  // recorder.startRecording()
  // recOpen()
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

const isWakeLockActive = ref(false)
let wakeLock: any // 声明 wakeLock 变量
// const preventSleep = async () => {
//   try {
//     // 检查浏览器是否支持 WakeLock API
//     if ('wakeLock' in navigator) {
//       wakeLock = await (navigator as any).wakeLock.request('screen')
//       isWakeLockActive.value = true // 设置为激活状态
//       console.log('Wake Lock acquired')
//     } else {
//       console.warn('Wake Lock API is not supported on this device.')
//     }
//   } catch (err) {
//     console.error('Failed to acquire wake lock:', err)
//   }
// }

const releaseSleepLock = async () => {
  if (wakeLock) {
    await wakeLock.release()
    wakeLock = null
    isWakeLockActive.value = false // 设置为释放状态
    console.log('Wake Lock released')
  }
}

function playAudioFromBase64(base64Data: string): void {
  if ((showroot1.value = false)) {
    return
  }
  // 1. 将 Base64 字符串解码为二进制数据
  const binaryData = atob(base64Data)

  // 2. 创建一个新的 Uint8Array，存储二进制数据
  const byteArray = new Uint8Array(binaryData.length)
  for (let i = 0; i < binaryData.length; i++) {
    byteArray[i] = binaryData.charCodeAt(i)
  }

  // 3. 创建一个 Blob 对象
  const blob = new Blob([byteArray], { type: 'audio/mp3' }) // 假设是 MP3 格式，调整为正确的格式

  // 4. 创建一个音频 URL
  const audioUrl = URL.createObjectURL(blob)

  // 5. 使用 HTML5 Audio API 播放音频
  const audio = new Audio(audioUrl)

  audio.addEventListener('canplaythrough', () => {
    console.log('音频可以开始播放')
  })

  // 添加播放结束的监听器
  audio.addEventListener('ended', () => {
    console.log('音频播放结束')
    setTimeout(() => {
      showroot1.value = true // 假设这是你希望在播放结束后更新的状态
    }, 1000)
  })
  audio
    .play()
    .then(() => {
      showroot1.value = false
      console.log('音频播放开始')
    })
    .catch(error => {
      setTimeout(() => {
        showroot1.value = true // 假设这是你希望在播放结束后更新的状态
      }, 1000)
      console.error('播放音频时发生错误:', error)
    })
}

let inactivityTimeout: string | number | NodeJS.Timeout | undefined

function preventSleep() {
  clearTimeout(inactivityTimeout)
  // 模拟一个触摸事件，保持活跃
  document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }))
  inactivityTimeout = setTimeout(() => {
    console.log('Inactivity detected, stopping the simulation.')
  }, 10000) // 设置一个超时时间（例如10秒无活动后停止）
}

onMounted(() => {
  setInterval(() => {
    document.body.hidden = true // 触发浏览器的隐藏检查
    document.body.hidden = false
  }, 10000) // 每10秒触发一次
  // document.addEventListener('touchstart', preventSleep)
  preventSleep() // 启动定时器
})
onUnmounted(() => {
  releaseSleepLock()
})
const cloelrj = () => {
  showroot.value = false
  const audioDom: any = document.getElementById('audiolkjsdlfkjdklf')
  audioDom.src = ''
  recorder.stopRecording()
  recStop()
  socket.close()
}
const startsdfdsf = () => {
  if (showroot.value) {
    return
  }
  recOpen()
  startTranscription()
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

        <!-- <div style="height: 100px; width: 300px" ref="recwave"></div> -->
      </div>
    </div>
    <!-- <canvas id="canvas" width="400" height="400"></canvas> -->
    <div class="dsfsdfsdfdsf">
      <div
        @click="startsdfdsf"
        :class="['centerR', { dsfsdfdseeeee: !showroot }]"
        :style="{
          '--radius': `${powerLevelF}px`,
          background: showroot ? 'white' : ''
        }"
      ></div>
      {{
        !showroot1
          ? 'Loading...'
          : showroot
          ? '已连接'
          : `未连接,如想连接请点击重试`
      }}
    </div>
    <audio id="audiolkjsdlfkjdklf" @ended="endedFn" autoplay>
      <source />
      Your browser does not support the audio element.
    </audio>
    <!-- <button @click="startTranscription">开始</button> -->
    <div class="bomlkdjsflds">
      <div
        :class="[{ sdfkjsdlf: !showrootmkf }, 'fkdjf']"
        @click="showrootmkf = !showrootmkf"
      >
        <svg
          t="1733303316293"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11870"
          width="200"
          height="200"
        >
          <path
            d="M511.336 628.299c99.736 0 180.88-80.247 180.88-178.88V243.662c0-98.638-81.144-178.885-180.88-178.885s-180.88 80.247-180.88 178.885v205.757c0 98.633 81.144 178.88 180.88 178.88z"
            fill="rgba(255, 255, 255, 0.439)"
            p-id="11871"
          ></path>
          <path
            d="M802.203 447.895c0-14.689-12.043-26.599-26.896-26.599s-26.896 11.91-26.896 26.599c0 129.28-106.35 234.455-237.075 234.455s-237.08-105.175-237.08-234.455c0-14.689-12.043-26.599-26.896-26.599s-26.896 11.91-26.896 26.599c0 149.639 116.156 272.904 263.976 286.376v172.754H357.352c-14.853 0-26.896 11.909-26.896 26.599 0 14.689 12.043 26.599 26.896 26.599h307.967c14.853 0 26.896-11.91 26.896-26.599s-12.043-26.599-26.896-26.599H538.232V734.271c147.816-13.473 263.971-136.738 263.971-286.376z"
            fill="rgba(255, 255, 255, 0.439)"
            p-id="11872"
          ></path>
        </svg>
      </div>
      <div class="fkdjf" @click="cloelrj">
        <svg
          t="1733305018912"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="12855"
          width="200"
          height="200"
        >
          <path
            d="M576 512l277.333333 277.333333-64 64-277.333333-277.333333L234.666667 853.333333 170.666667 789.333333l277.333333-277.333333L170.666667 234.666667 234.666667 170.666667l277.333333 277.333333L789.333333 170.666667 853.333333 234.666667 576 512z"
            fill="rgba(255, 255, 255, 0.439)"
            p-id="12856"
          ></path>
        </svg>
      </div>
    </div>
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
.bomlkdjsflds {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20vw;
  .fkdjf {
    background: #cccccc2e;

    border: 2px solid transparent;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
      width: 30px;
      height: 30px;
    }
  }
  .sdfkjsdlf {
    border: 2px solid rgba(255, 255, 255, 0);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
      width: 30px;
      height: 30px;
    }
    position: relative;
    &::before {
      content: '';
      display: block;
      position: absolute;
      border-top: 2px solid rgba(255, 255, 255, 0.439);
      transform: rotate(45deg);
      top: 50%;
      width: 80%;
    }
  }
}
.dsfsdfsdfdsf {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: #ffffff69;
}
.dsfsdfdseeeee {
  background: #ffffff00 !important;
  border: 1vw solid white;
}
</style>
