<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { getLyricById } from '@/api/songs'

defineOptions({
  name: '',
  options: {
    virtualHost: true,
  },
})
definePage({
  style: {
    navigationBarTitleText: '歌曲配置',
  },
})
const route = useRoute()
const songId = ref(route.query.songId as string)
const songLyricObj = ref()
const lyric = ref()
const translation = ref()
const romaLyric = ref()
onMounted(() => {
  getLyricById(songId.value).then((res) => {
    songLyricObj.value = res
    console.log(songLyricObj.value)
    lyric.value = parseLRC(songLyricObj.value.lrc.lyric)
    translation.value = parseLRC(songLyricObj.value.tlyric.lyric)
    romaLyric.value = parseLRC(songLyricObj.value.romalrc.lyric)
  })
})

function parseLRC(lrcText: string) {
  const lines = lrcText.split('\n')
  console.log(lines)
  const result = []

  // 匹配时间标签 [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const times = []
    let match: boolean

    // 提取所有时间标签
    while ((match = (timeRegex.exec(line)) !== null)) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      times.push(minutes * 60 * 1000 + seconds * 1000 + ms)
    }

    // 提取歌词文本（去掉时间标签）
    const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim()

    // 为每个时间点创建条目
    //
    for (const time of times) {
      if (text) {
        result.push({ time, text })
      }
    }
  }

  // 按时间排序
  console.log(result)
  return result.sort((a, b) => a.time - b.time)
}





</script>

<template>
  <view class="">
    {{ lyric || 0 }}
    {{ translation }}
    {{ romaLyric }}

  </view>

</template>
