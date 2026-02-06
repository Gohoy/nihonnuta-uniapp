<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getNeteaseLyricById } from '@/api/songs'

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
const hasLyrics = computed(() => {
  return (lyric.value && lyric.value.length) || (translation.value && translation.value.length) || (romaLyric.value && romaLyric.value.length)
})
onMounted(() => {
  getNeteaseLyricById(songId.value).then((res) => {
    songLyricObj.value = res
    console.log(songLyricObj.value)
    lyric.value = parseLRC(songLyricObj.value.lrc.lyric)
    translation.value = parseLRC(songLyricObj.value.tlyric.lyric)
    romaLyric.value = parseLRC(songLyricObj.value.romalrc.lyric)
  })
})

function parseLRC(lrcText: string) {
  if (!lrcText)
    return []
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





const formatLine = (line: any) => line?.text || ''
</script>

<template>
  <view class="p-4">
    <template v-if="hasLyrics">
      <view class="mb-4">
        <view class="mb-2 text-lg font-bold">
          原文
        </view>
        <view v-for="line in lyric" :key="line.time" class="py-1 text-base">
          {{ formatLine(line) }}
        </view>
      </view>
      <view class="mb-4">
        <view class="mb-2 text-lg font-bold">
          翻译
        </view>
        <view v-for="line in translation" :key="line.time" class="py-1 text-base text-gray-500">
          {{ formatLine(line) }}
        </view>
      </view>
      <view class="mb-4">
        <view class="mb-2 text-lg font-bold">
          罗马音
        </view>
        <view v-for="line in romaLyric" :key="line.time" class="py-1 text-base text-gray-500">
          {{ formatLine(line) }}
        </view>
      </view>
    </template>
    <template v-else>
      <view class="text-center text-gray-500">
        歌词加载中...
      </view>
    </template>
  </view>
</template>
