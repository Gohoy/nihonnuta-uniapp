<script lang="ts" setup>
import { watch, nextTick } from 'vue'
// 小程序不支持 vue-router，使用 uni API 替代
import { searchNeteaseSongs, importSongFromNetease } from '@/api/songs'
import { useUserStore } from '@/store/user'
// import { useToast } from 'wot-design-uni' // 暂时不使用，改用原生提示

definePage({
  style: {
    navigationBarTitleText: '搜索歌曲',
  },
})

// const toast = useToast() // 暂时不使用
const userStore = useUserStore()
const showToast = (message: string) => {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}
const keywords = ref('')
const loading = ref(false)
const error = ref('')
const songs = ref([])
const importing = ref<Record<string, boolean>>({})

// 使用 watch 监听 keywords 变化，确保始终是字符串
watch(keywords, (newVal) => {
  if (newVal === undefined || newVal === null) {
    keywords.value = ''
  } else {
    keywords.value = String(newVal)
  }
  // 清空之前的错误信息
  if (error.value) {
    error.value = ''
  }
}, { immediate: true })

function handleSearchSongs() {
  const searchKeywords = String(keywords.value || '').trim()
  if (!searchKeywords) {
    showToast('请输入搜索关键词')
    return
  }

  loading.value = true
  error.value = ''

  searchNeteaseSongs(searchKeywords).then((res: any) => {
    const result = res?.songs || res || []
    songs.value = Array.isArray(result) ? [...result] : []
    loading.value = false
  }).catch((e: any) => {
    console.error('Search error:', e)
    error.value = e?.message || '搜索失败，请稍后重试'
    songs.value = []
    loading.value = false
  })
}

function navigateToSongDetail(song: any) {
  uni.navigateTo({
    url: `/pages/song/detail?songId=${song.song_id}&source=local&songName=${encodeURIComponent(song.song_name || '')}&singer=${encodeURIComponent(song.singer || '')}&coverUrl=${encodeURIComponent(song.cover_url || '')}`,
  })
}

async function handleImportSong(song: any) {
  const songId = String(song.id)
  if (importing.value[songId]) {
    return
  }

  // Check login before importing
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    uni.showToast({ title: '请先登录后再导入歌曲', icon: 'none' })
    return
  }

  importing.value[songId] = true

  try {
    showToast('正在导入，请稍候...')

    const res: any = await importSongFromNetease(song.id, {
      create_user: userId,
      is_public: true,
    })

    if (res.imported) {
      showToast('导入成功！')
      setTimeout(() => {
        navigateToSongDetail(res.song)
      }, 800)
    } else {
      showToast(res.message || '歌曲已存在，正在跳转...')
      setTimeout(() => {
        navigateToSongDetail(res.song)
      }, 800)
    }
  } catch (e: any) {
    console.error('导入失败:', e)
    const errorMessage = e?.message || e?.response?.data?.message || '导入失败，请稍后重试'
    showToast(errorMessage)
  } finally {
    importing.value[songId] = false
  }
}

function goToCreateSong() {
  uni.navigateTo({ url: '/pages/createSong/createSong' })
}
</script>

<template>
  <view class="bg-gray-50 min-h-screen">
    <view class="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
      <!-- 搜索框 -->
      <view class="relative">
        <input
          v-model="keywords"
          type="text"
          placeholder="搜索歌曲、歌手"
          class="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm"
          @confirm="handleSearchSongs"
        />
        <view
          class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
          @click="handleSearchSongs"
        >
          搜索
        </view>
      </view>
    </view>

    <view class="p-4">

    <!-- 加载状态 -->
    <template v-if="loading">
      <view class="py-12 text-center">
        <view class="text-gray-400 text-sm">搜索中...</view>
      </view>
    </template>

    <!-- 错误状态 -->
    <template v-else-if="error">
      <view class="py-12 text-center">
        <view class="text-red-500 text-sm">{{ error }}</view>
      </view>
    </template>

    <!-- 搜索结果 -->
    <template v-else-if="songs.length > 0">
      <view v-for="song in songs" :key="song.id" class="mb-2">
        <view class="bg-white rounded-lg shadow-sm p-3">
          <view class="flex items-center justify-between">
            <view class="flex items-center flex-1 min-w-0 pr-2">
              <image
                :src="song.album?.picUrl || song.al?.picUrl || ''"
                class="w-14 h-14 rounded-lg flex-shrink-0 object-cover"
                mode="aspectFill"
              />
              <view class="ml-3 flex-1 min-w-0">
                <view class="font-semibold text-base text-gray-800 truncate">
                  {{ song.name }}
                </view>
                <view class="text-gray-500 text-sm mt-1 truncate">
                  {{ song.artists?.map((a: any) => a.name).join(' / ') || song.ar?.map((a: any) => a.name).join(' / ') }}
                </view>
                <view v-if="song.album || song.al" class="text-gray-400 text-xs mt-1 truncate">
                  {{ song.album?.name || song.al?.name }}
                </view>
              </view>
            </view>
            <view class="ml-2 flex-shrink-0">
              <view
                class="px-3 py-1.5 bg-blue-500 text-white text-sm rounded"
                :class="importing[String(song.id)] ? 'opacity-50' : ''"
                @click.stop="handleImportSong(song)"
              >
                <text v-if="!importing[String(song.id)]">一键导入</text>
                <text v-else>导入中...</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 无搜索结果 -->
    <template v-else-if="keywords && String(keywords).trim()">
      <view class="py-12 text-center">
        <view class="text-gray-400 text-sm mb-4">暂无搜索结果</view>
        <view
          class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded inline-block"
          @click="goToCreateSong"
        >
          手动上传歌曲
        </view>
      </view>
    </template>

    <!-- 初始状态 -->
    <template v-else>
      <view class="py-12 text-center">
        <view class="text-gray-400 text-sm">
          <view class="mb-2">请输入关键词搜索歌曲</view>
          <view class="text-xs mt-2">点击"一键导入"添加到学习库</view>
        </view>
      </view>
    </template>

    </view>

    <!-- 底部留白 -->
    <view class="h-24" />
  </view>
</template>
