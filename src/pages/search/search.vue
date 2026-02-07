<script lang="ts" setup>
import { watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { searchLocalSongs, searchNeteaseSongs, importSongFromNetease } from '@/api/songs'
import { useUserStore } from '@/store/user'
// import { useToast } from 'wot-design-uni' // 暂时不使用，改用原生提示

definePage({
  style: {
    navigationBarTitleText: '搜索歌曲',
  },
})

const router = useRouter()
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
const searchType = ref<'local' | 'netease'>('netease') // 默认使用网易云搜索
const songs = ref([])
const neteaseSongs = ref([])
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
  console.log('handleSearchSongs called', keywords.value)
  const searchKeywords = String(keywords.value || '').trim()
  console.log('searchKeywords:', searchKeywords)
  if (!searchKeywords) {
    showToast('请输入搜索关键词')
    return
  }
  
  console.log('Starting search, type:', searchType.value)
  loading.value = true
  error.value = ''
  
  if (searchType.value === 'local') {
    console.log('Searching local songs...')
    searchLocalSongs(searchKeywords).then((res: any) => {
      console.log('Local search result:', res)
      songs.value = res.songs || []
    }).catch((e: any) => {
      console.error('Local search error:', e)
      error.value = e?.message || '搜索失败'
    }).finally(() => {
      loading.value = false
    })
  } else {
    searchNeteaseSongs(searchKeywords).then((res: any) => {
      // 后端返回的数据结构: { keywords, songs, total }
      // HTTP 工具会自动提取 data 字段，所以 res 已经是 { keywords, songs, total }
      const songs = res?.songs || res || []
      // 使用展开运算符创建新数组，确保响应式更新
      const songsArray = Array.isArray(songs) ? [...songs] : []
      neteaseSongs.value = songsArray
      loading.value = false
    }).catch((e: any) => {
      console.error('Netease search error:', e)
      error.value = e?.message || '搜索失败，请稍后重试'
      neteaseSongs.value = []
      loading.value = false
    })
  }
}

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

async function handleImportFromNetease(neteaseSong: any) {
  const songId = String(neteaseSong.id)
  if (importing.value[songId]) {
    return
  }
  
  importing.value[songId] = true
  
  try {
    const userId = userStore.userInfo?.userId
    showToast('正在导入，请稍候...')
    
    const res: any = await importSongFromNetease(neteaseSong.id, {
      create_user: userId,
      is_public: true,
    })
    
    if (res.imported) {
      showToast('导入成功！')
      // 延迟跳转，确保用户看到成功提示
      setTimeout(() => {
        router.push({
          path: '/pages/song/detail',
          query: {
            songId: res.song.song_id,
            source: 'local',
            songName: res.song.song_name || '',
            singer: res.song.singer || '',
            coverUrl: res.song.cover_url || '',
          },
        })
      }, 800)
    } else {
      // 如果已存在，也跳转到详情页
      showToast(res.message || '歌曲已存在，正在跳转...')
      setTimeout(() => {
        router.push({
          path: '/pages/song/detail',
          query: {
            songId: res.song.song_id,
            source: 'local',
            songName: res.song.song_name || '',
            singer: res.song.singer || '',
            coverUrl: res.song.cover_url || '',
          },
        })
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
  router.push('/pages/createSong/createSong')
}

function handleNeteaseSongClick(song: any) {
  // 点击歌曲卡片时，可以显示详情或预览
  // 这里可以添加预览功能
  console.log('点击了网易云歌曲:', song)
}
</script>

<template>
  <view class="bg-gray-50 min-h-screen">
    <view class="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
      <!-- 搜索类型切换 -->
      <view class="mb-3 flex gap-2">
        <button
          :class="searchType === 'local' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'"
          class="flex-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 transition-opacity"
          @click="searchType = 'local'"
        >
          本地歌曲
        </button>
        <button
          :class="searchType === 'netease' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'"
          class="flex-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 transition-opacity"
          @click="searchType = 'netease'"
        >
          网易云搜索
        </button>
      </view>
      
      <!-- 搜索框 -->
      <view class="relative">
        <input
          v-model="keywords"
          type="text"
          :placeholder="searchType === 'local' ? '搜索本地歌曲、歌手' : '搜索网易云歌曲、歌手'"
          class="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white text-sm"
          @confirm="handleSearchSongs"
          @keydown.enter="handleSearchSongs"
        />
        <view
          class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-sm rounded cursor-pointer hover:bg-blue-600 select-none"
          @click="handleSearchSongs"
          @tap="handleSearchSongs"
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
    
    <!-- 本地歌曲搜索结果 -->
    <template v-else-if="searchType === 'local' && songs.length > 0">
      <view v-for="song in songs" :key="song.song_id" class="mb-2">
        <view class="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:bg-gray-50" @click="handleSongClick(song)">
          <view class="flex items-center justify-between">
            <view class="flex items-center flex-1 min-w-0">
              <image 
                :src="song.cover_url || ''" 
                class="w-14 h-14 rounded-lg flex-shrink-0 object-cover"
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
                <text 
                  v-for="i in 5" 
                  :key="i"
                  class="text-yellow-400 text-sm"
                >
                  {{ i <= Number(song.difficulty || 0) ? '★' : '☆' }}
                </text>
              </view>
              <text class="text-gray-400 ml-1">→</text>
            </view>
          </view>
        </view>
      </view>
    </template>
    
    <!-- 网易云搜索结果 -->
    <template v-else-if="searchType === 'netease' && neteaseSongs && neteaseSongs.length > 0">
      <view v-for="song in neteaseSongs" :key="song.id" class="mb-2">
        <view class="bg-white rounded-lg shadow-sm p-3">
          <view class="flex items-center justify-between">
            <view class="flex items-center flex-1 min-w-0 pr-2" @click.stop="handleNeteaseSongClick(song)">
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
              <button
                class="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="importing[String(song.id)]"
                @click.stop="handleImportFromNetease(song)"
              >
                <span v-if="!importing[String(song.id)]">一键导入</span>
                <span v-else>导入中...</span>
              </button>
            </view>
          </view>
        </view>
      </view>
    </template>
    
    <!-- 无搜索结果 -->
    <template v-else-if="keywords && String(keywords).trim()">
      <view class="py-12 text-center">
        <view class="text-gray-400 text-sm mb-4">暂无搜索结果</view>
        <view v-if="searchType === 'netease'">
          <button 
            class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            @click="goToCreateSong"
          >
            手动上传歌曲
          </button>
        </view>
      </view>
    </template>
    
    <!-- 初始状态 -->
    <template v-else>
      <view class="py-12 text-center">
        <view class="text-gray-400 text-sm">
          <view v-if="searchType === 'local'" class="mb-2">
            请输入关键词搜索本地歌曲
          </view>
          <view v-else class="mb-2">
            请输入关键词搜索网易云歌曲
          </view>
          <view v-if="searchType === 'netease'" class="text-xs mt-2">
            然后点击"一键导入"添加到学习库
          </view>
        </view>
      </view>
    </template>
    
    </view>
    
    <!-- 底部留白 -->
    <view class="h-24" />
  </view>
</template>
