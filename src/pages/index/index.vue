<template>
  <view class="bg-gray-50 min-h-screen">
    <!-- 顶部标题区域 -->
    <view class="bg-white pt-6 pb-4 text-center border-b border-gray-100">
      <view class="text-3xl font-bold text-gray-800">Nihonnuta</view>
      <view class="text-sm text-gray-500 mt-1">通过日语歌曲学习日语</view>
    </view>
    
    <!-- 添加歌曲入口 -->
    <view class="mt-4 px-4">
      <wd-card class="shadow-sm">
        <view class="flex items-center justify-between py-3">
          <view class="flex-1 pr-3 min-w-0">
            <view class="text-lg font-bold mb-1.5 text-gray-800">添加新歌曲</view>
            <view class="text-sm text-gray-500 leading-relaxed">搜索并一键导入日语歌曲</view>
          </view>
          <wd-button type="primary" size="small" @click="openSearchPage" class="flex-shrink-0">
            去搜索
          </wd-button>
        </view>
      </wd-card>
    </view>
    
    <!-- 搜索框 -->
    <view class="mt-3 px-4">
      <wd-search 
        hide-cancel 
        disabled 
        placeholder="搜索歌曲、歌手" 
        @click="openSearchPage"
        class="cursor-pointer"
      />
    </view>

    <!-- 快捷入口 -->
    <view class="mt-4 px-4">
      <view class="bg-white rounded-lg overflow-hidden">
        <wd-cell title="单词本" is-link @click="goToWordbook" />
        <view class="h-px bg-gray-100" />
        <wd-cell title="语法本" is-link @click="goToGrammarBook" />
        <view class="h-px bg-gray-100" />
        <wd-cell title="复习" is-link @click="goToReview" />
      </view>
    </view>
    
    <!-- 我学过的歌 -->
    <view class="mt-4 px-4">
      <view class="text-base font-semibold text-gray-800 mb-2">我学过的歌</view>
    </view>
    <template v-if="learnedSongs.length > 0">
      <view v-for="song in learnedSongs" :key="song.song_id" class="px-4 mb-2">
        <wd-card class="shadow-sm" @click="handleSongClick(song)">
          <view class="flex items-center justify-between py-3">
            <view class="flex items-center flex-1 min-w-0">
              <wd-img 
                :width="56" 
                :height="56" 
                :src="song.cover_url || ''" 
                class="rounded-lg flex-shrink-0"
                mode="aspectFill"
              />
              <view class="ml-3 flex-1 min-w-0">
                <view class="font-semibold text-base text-gray-800 truncate">
                  {{ song.song_name }}
                </view>
                <view class="text-gray-500 text-sm mt-1 truncate">
                  {{ song.singer }}
                </view>
              </view>
            </view>
            <wd-icon name="arrow-right" class="ml-2 text-gray-400 flex-shrink-0" />
          </view>
        </wd-card>
      </view>
    </template>
    <template v-else>
      <view class="px-4 py-8 text-center">
        <view class="text-gray-400 text-sm">暂无学习记录</view>
        <view class="text-blue-500 text-sm mt-2" @click="openSearchPage">去添加歌曲</view>
      </view>
    </template>

    <!-- 热门歌曲 -->
    <view class="mt-6 px-4">
      <view class="text-base font-semibold text-gray-800 mb-2">热门歌曲</view>
    </view>
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
      <view v-for="song in popularSongs" :key="song.song_id" class="px-4 mb-2">
        <wd-card class="shadow-sm" @click="handleSongClick(song)">
          <view class="flex items-center justify-between py-3">
            <view class="flex items-center flex-1 min-w-0">
              <wd-img 
                :width="56" 
                :height="56" 
                :src="song.cover_url || ''" 
                class="rounded-lg flex-shrink-0"
                mode="aspectFill"
              />
              <view class="ml-3 flex-1 min-w-0">
                <view class="font-semibold text-base text-gray-800 truncate">
                  {{ song.song_name }}
                </view>
                <view class="text-gray-500 text-sm mt-1 truncate">
                  {{ song.singer }}
                </view>
              </view>
            </view>
            <view class="flex items-center gap-2 ml-2 flex-shrink-0">
              <view class="flex items-center">
                <wd-icon 
                  v-for="i in 5" 
                  :key="i"
                  :name="i <= Number(song.difficulty || 0) ? 'star-filled' : 'star'" 
                  class="text-yellow-400"
                  size="14"
                />
              </view>
              <wd-icon name="arrow-right" class="text-gray-400" />
            </view>
          </view>
        </wd-card>
      </view>
    </template>
    <template v-else>
      <view class="px-4 py-8 text-center">
        <view class="text-gray-400 text-sm">暂无热门歌曲</view>
      </view>
    </template>

    <!-- 推荐歌曲 -->
    <view class="mt-6 px-4">
      <view class="text-base font-semibold text-gray-800 mb-2">推荐歌曲</view>
    </view>
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
      <view v-for="song in songs" :key="song.song_id" class="px-4 mb-2">
        <wd-card class="shadow-sm" @click="handleSongClick(song)">
          <view class="flex items-center justify-between py-3">
            <view class="flex items-center flex-1 min-w-0">
              <wd-img 
                :width="56" 
                :height="56" 
                :src="song.cover_url || ''" 
                class="rounded-lg flex-shrink-0"
                mode="aspectFill"
              />
              <view class="ml-3 flex-1 min-w-0">
                <view class="font-semibold text-base text-gray-800 truncate">
                  {{ song.song_name }}
                </view>
                <view class="text-gray-500 text-sm mt-1 truncate">
                  {{ song.singer }}
                </view>
              </view>
            </view>
            <view class="flex items-center gap-2 ml-2 flex-shrink-0">
              <view class="flex items-center">
                <wd-icon 
                  v-for="i in 5" 
                  :key="i"
                  :name="i <= Number(song.difficulty || 0) ? 'star-filled' : 'star'" 
                  class="text-yellow-400"
                  size="14"
                />
              </view>
              <wd-icon name="arrow-right" class="text-gray-400" />
            </view>
          </view>
        </wd-card>
      </view>
    </template>
    <template v-else>
      <view class="px-4 py-8 text-center">
        <view class="text-gray-400 text-sm">暂无推荐歌曲</view>
      </view>
    </template>
    
    <!-- 底部留白 -->
    <view class="h-24" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
// 小程序不支持 vue-router，使用 uni.navigateTo 替代
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
  // 刷新推荐歌曲和热门歌曲，以便显示新导入的歌曲
  loadRecommendSongs()
  loadPopularSongs()
})

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
  uni.navigateTo({
    url: `/pages/song/detail?songId=${song.song_id}&source=local&songName=${encodeURIComponent(song.song_name || '')}&singer=${encodeURIComponent(song.singer || '')}&coverUrl=${encodeURIComponent(song.cover_url || '')}`,
  })
}

function openSearchPage() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function goToWordbook() {
  uni.navigateTo({ url: '/pages/wordbook/index' })
}

function goToGrammarBook() {
  uni.navigateTo({ url: '/pages/grammarbook/index' })
}

function goToReview() {
  uni.navigateTo({ url: '/pages/review/index?type=word' })
}
</script>
