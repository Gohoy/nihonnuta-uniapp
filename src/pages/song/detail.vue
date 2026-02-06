<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { useRoute } from 'vue-router'
import { getProcessedNeteaseLyricById, getProcessedSongById, playSong } from '@/api/songs'
import { recordLearning } from '@/api/learning'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '歌词学习',
  },
})

const route = useRoute()
const songId = ref<string>((route.query.songId as string) || '')
const source = ref<string>((route.query.source as string) || 'local')
const songName = ref<string>((route.query.songName as string) || '')
const singer = ref<string>((route.query.singer as string) || '')
const coverUrl = ref<string>((route.query.coverUrl as string) || '')
const loading = ref(true)
const error = ref('')
const lyrics = ref<any[]>([])
const showTranslate = ref(true)
const showRoma = ref(false)
const showGrammar = ref(true)
const userStore = useUserStore()

async function loadLyrics() {
  if (!songId.value) {
    error.value = '缺少歌曲 ID'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const userId = userStore.userInfo?.userId
    const res: any = source.value === 'local'
      ? await getProcessedSongById(songId.value, userId)
      : await getProcessedNeteaseLyricById(songId.value)
    lyrics.value = res?.lines || []
    if (source.value === 'local') {
      playSong(songId.value).catch(() => {})
    }
    if (userId && userId !== -1) {
      recordLearning(userId, songId.value).catch(() => {})
    }
    saveLearnedSong()
  }
  catch (e: any) {
    error.value = e?.message || '歌词加载失败'
  }
  finally {
    loading.value = false
  }
}

function handleRetry() {
  loadLyrics()
}

function saveLearnedSong() {
  if (!songId.value) return
  try {
    const cached = uni.getStorageSync('learnedSongs') || []
    const list = Array.isArray(cached) ? cached : []
    const filtered = list.filter((item: any) => String(item.song_id) !== String(songId.value))
    filtered.unshift({
      song_id: songId.value,
      song_name: songName.value,
      singer: singer.value,
      cover_url: coverUrl.value,
      source: source.value,
    })
    uni.setStorageSync('learnedSongs', filtered.slice(0, 20))
  }
  catch {}
}

onLoad(() => {
  loadLyrics()
})
</script>

<template>
  <view class="p-4">
    <view class="mb-3 flex items-center justify-between">
      <view class="text-lg font-bold">歌词学习</view>
      <view class="flex items-center gap-3">
        <view class="flex items-center">
          <text class="mr-2 text-sm text-gray-600">翻译</text>
          <wd-switch v-model="showTranslate" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-2 text-sm text-gray-600">罗马音</text>
          <wd-switch v-model="showRoma" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-2 text-sm text-gray-600">语法</text>
          <wd-switch v-model="showGrammar" size="20" />
        </view>
      </view>
    </view>

    <template v-if="loading">
      <view class="py-6 text-center text-gray-500">加载中...</view>
    </template>
    <template v-else-if="error">
      <view class="py-6 text-center text-red-500">{{ error }}</view>
      <view class="mt-2 text-center text-blue-500" @click="handleRetry">
        点击重试
      </view>
    </template>
    <template v-else-if="lyrics.length === 0">
      <view class="py-6 text-center text-gray-500">暂无歌词</view>
    </template>
    <template v-else>
      <view v-for="(line, index) in lyrics" :key="index" class="mb-3">
        <rich-text :nodes="line.furigana_html || line.original || ''" class="text-base" />
        <view v-if="showTranslate && line.translate" class="text-sm text-gray-500">
          {{ line.translate }}
        </view>
        <view v-if="showRoma && line.roma" class="text-sm text-gray-400">
          {{ line.roma }}
        </view>
        <view v-if="showGrammar && line.grammar && line.grammar.length" class="mt-2 flex flex-wrap gap-2">
          <view v-for="(g, gi) in line.grammar" :key="gi" class="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
            {{ g.name }} · {{ g.level }}
          </view>
        </view>
      </view>
    </template>
  </view>
</template>
