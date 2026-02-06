<template>
  <view class="bg-white">
    <view class="mt-2 text-center text-2xl">
      Nihonnuta
    </view>
    <wd-search hide-cancel disabled @click="openSearchPage" />

    <wd-cell title="我学过的歌" is-link class="mt-4 px-4" />
    <template v-if="learnedSongs.length > 0">
      <view v-for="song in learnedSongs" :key="song.song_id">
        <wd-card class="" @click="handleSongClick(song)">
          <view class="align-center flex justify-between">
            <view class="flex">
              <wd-img :width="50" :height="50" :src="song.cover_url || ''" />
              <view class="ml-4">
                <view class="font-bold">
                  {{ song.song_name }}
                </view>
                <view class="text-gray-500">
                  {{ song.singer }}
                </view>
              </view>
            </view>
            <wd-icon name="arrow-right" />
          </view>
        </wd-card>
      </view>
    </template>
    <template v-else>
      <view class="p-4 text-center text-gray-500">
        暂无学习记录
      </view>
    </template>

    <wd-cell title="热门歌曲" is-link class="mt-4 px-4" />
    <template v-if="popularLoading">
      <view class="p-4 text-center text-gray-500">
        加载中...
      </view>
    </template>
    <template v-else-if="popularError">
      <view class="p-4 text-center text-red-500">
        {{ popularError }}
      </view>
    </template>
    <template v-else-if="popularSongs.length > 0">
      <view v-for="song in popularSongs" :key="song.song_id">
        <wd-card class="" @click="handleSongClick(song)">
          <view class="align-center flex justify-between">
            <view class="flex">
              <wd-img :width="50" :height="50" :src="song.cover_url || ''" />
              <view class="ml-4">
                <view class="font-bold">
                  {{ song.song_name }}
                </view>
                <view class="text-gray-500">
                  {{ song.singer }}
                </view>
              </view>
            </view>
            <view class="w-25 flex flex-row items-center justify-between">
              <view class="flex flex-row">
                <view v-for="i in 5" :key="i">
                  <wd-icon :name="i <= Number(song.difficulty || 0) ? 'star-filled' : 'star'" />
                </view>
              </view>
              <wd-icon name="arrow-right" />
            </view>
          </view>
        </wd-card>
      </view>
    </template>
    <template v-else>
      <view class="p-4 text-center text-gray-500">
        暂无热门歌曲
      </view>
    </template>

    <wd-cell title="推荐歌曲" is-link class="mt-4 px-4" />
    <template v-if="loading">
      <view class="p-4 text-center text-gray-500">
        加载中...
      </view>
    </template>
    <template v-else-if="error">
      <view class="p-4 text-center text-red-500">
        {{ error }}
      </view>
    </template>
    <template v-else-if="songs.length > 0">
      <view v-for="song in songs" :key="song.song_id">
        <wd-card class="" @click="handleSongClick(song)">
          <view class="align-center flex justify-between">
            <view class="flex">
              <wd-img :width="50" :height="50" :src="song.cover_url || ''" />
              <view class="ml-4">
                <view class="font-bold">
                  {{ song.song_name }}
                </view>
                <view class="text-gray-500">
                  {{ song.singer }}
                </view>
              </view>
            </view>
            <view class="w-25 flex flex-row items-center justify-between">
              <view class="flex flex-row">
                <view v-for="i in 5" :key="i">
                  <wd-icon :name="i <= Number(song.difficulty || 0) ? 'star-filled' : 'star'" />
                </view>
              </view>
              <wd-icon name="arrow-right" />
            </view>
          </view>
        </wd-card>
      </view>
    </template>
    <template v-else>
      <view class="p-4 text-center text-gray-500">
        暂无推荐歌曲
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'vue-router'
import { getPopularSongs, getSongsPage } from '@/api/songs'
import { getRecentLearned } from '@/api/learning'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'Home',
})
definePage({
  // 使用 type: "home" 属性设置首页，其他页面不需要设置，默认为page
  type: 'home',
  style: {
    // 'custom' 表示开启自定义导航栏，默认 'default'
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
})
async function loadLearnedSongs() {
  const userId = userStore.userInfo?.userId
  if (userId && userId !== -1) {
    try {
      const res: any = await getRecentLearned(userId, 10)
      learnedSongs.value = res.songs || []
      return
    }
    catch {}
  }
  try {
    const cached = uni.getStorageSync('learnedSongs') || []
    learnedSongs.value = Array.isArray(cached) ? cached : []
  }
  catch {
    learnedSongs.value = []
  }
}

async function loadRecommendSongs() {
  loading.value = true
  error.value = ''
  try {
    const res: any = await getSongsPage(0, 10)
    songs.value = res.songs || []
  }
  catch (e: any) {
    error.value = e?.message || '加载失败'
  }
  finally {
    loading.value = false
  }
}

async function loadPopularSongs() {
  popularLoading.value = true
  popularError.value = ''
  try {
    const res: any = await getPopularSongs(10)
    popularSongs.value = res.songs || []
  }
  catch (e: any) {
    popularError.value = e?.message || '加载失败'
  }
  finally {
    popularLoading.value = false
  }
}

onLoad(async () => {
  console.log('测试 uni API 自动引入: onLoad')
  await loadLearnedSongs()
  await Promise.all([loadRecommendSongs(), loadPopularSongs()])
})

onShow(() => {
  loadLearnedSongs()
})
function handleSearch(value: string) {
  console.log('搜索', value)
}
function handleClear() {
  console.log('清空搜索内容')
}
function handleCancel() {
  console.log('取消搜索')
}
function handleChange(value: string) {
  console.log('搜索内容变化', value)
}
const keyword = ref('')
const songs = ref([])
const learnedSongs = ref([])
const popularSongs = ref([])
const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const popularLoading = ref(true)
const popularError = ref('')
function handleSongClick(song: any) {
  if (!song?.song_id) {
    return
  }
  router.push({
    path: '/pages/song/detail',
    query: {
      songId: String(song.song_id),
      source: 'local',
      songName: song.song_name || '',
      singer: song.singer || '',
      coverUrl: song.cover_url || '',
    },
  })
}
const router = useRouter()
function openSearchPage() {
  router.push({ path: '/pages/search/search' })
}
</script>
