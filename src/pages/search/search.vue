<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { searchLocalSongs, searchNeteaseSongs, importSongFromNetease } from '@/api/songs'
import { useUserStore } from '@/store/user'
import { useToast } from 'wot-design-uni'

definePage({
  style: {
    navigationBarTitleText: '搜索歌曲',
  },
})

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()
const keywords = ref('')
const autoFocus = ref(true)
const loading = ref(false)
const error = ref('')
const searchType = ref<'local' | 'netease'>('local')
const songs = ref([])
const neteaseSongs = ref([])
const importing = ref<Record<string, boolean>>({})

onLoad(() => {
  autoFocus.value = true
})

function handleSearchSongs() {
  if (!keywords.value.trim()) {
    toast.show('请输入搜索关键词')
    return
  }
  
  loading.value = true
  error.value = ''
  
  if (searchType.value === 'local') {
    searchLocalSongs(keywords.value).then((res: any) => {
      songs.value = res.songs || []
    }).catch((e: any) => {
      error.value = e?.message || '搜索失败'
    }).finally(() => {
      loading.value = false
    })
  } else {
    searchNeteaseSongs(keywords.value).then((res: any) => {
      neteaseSongs.value = res.songs || []
    }).catch((e: any) => {
      error.value = e?.message || '搜索失败'
    }).finally(() => {
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
    const res: any = await importSongFromNetease(neteaseSong.id, {
      create_user: userId,
      is_public: true,
    })
    
    if (res.imported) {
      toast.show('导入成功！')
      // 跳转到歌曲详情页
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
    } else {
      toast.show(res.message || '歌曲已存在')
      // 如果已存在，也跳转到详情页
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
    }
  } catch (e: any) {
    toast.show(e?.message || '导入失败')
  } finally {
    importing.value[songId] = false
  }
}

function goToCreateSong() {
  router.push('/pages/createSong/createSong')
}
</script>

<template>
  <view class="p-4">
    <!-- 搜索类型切换 -->
    <view class="mb-3 flex gap-2">
      <wd-button
        :type="searchType === 'local' ? 'primary' : 'default'"
        size="small"
        @click="searchType = 'local'"
      >
        本地歌曲
      </wd-button>
      <wd-button
        :type="searchType === 'netease' ? 'primary' : 'default'"
        size="small"
        @click="searchType = 'netease'"
      >
        网易云搜索
      </wd-button>
    </view>
    
    <!-- 搜索框 -->
    <wd-search
      v-model="keywords"
      :focus="autoFocus"
      :placeholder="searchType === 'local' ? '搜索本地歌曲、歌手' : '搜索网易云歌曲、歌手'"
      hide-cancel
      @search="handleSearchSongs"
    />
    
    <!-- 加载状态 -->
    <template v-if="loading">
      <view class="p-4 text-center text-gray-500">
        搜索中...
      </view>
    </template>
    
    <!-- 错误状态 -->
    <template v-else-if="error">
      <view class="p-4 text-center text-red-500">
        {{ error }}
      </view>
    </template>
    
    <!-- 本地歌曲搜索结果 -->
    <template v-else-if="searchType === 'local' && songs.length > 0">
      <view v-for="song in songs" :key="song.song_id" class="mt-2">
        <wd-card @click="handleSongClick(song)">
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
    
    <!-- 网易云搜索结果 -->
    <template v-else-if="searchType === 'netease' && neteaseSongs.length > 0">
      <view v-for="song in neteaseSongs" :key="song.id" class="mt-2">
        <wd-card>
          <view class="align-center flex justify-between">
            <view class="flex flex-1">
              <wd-img :width="50" :height="50" :src="song.album?.picUrl || song.al?.picUrl || ''" />
              <view class="ml-4 flex-1">
                <view class="font-bold">
                  {{ song.name }}
                </view>
                <view class="text-gray-500 text-sm">
                  {{ song.artists?.map((a: any) => a.name).join(' / ') || song.ar?.map((a: any) => a.name).join(' / ') }}
                </view>
                <view v-if="song.album" class="text-gray-400 text-xs mt-1">
                  {{ song.album.name || song.al?.name }}
                </view>
              </view>
            </view>
            <view class="ml-2">
              <wd-button
                type="primary"
                size="small"
                :loading="importing[String(song.id)]"
                @click.stop="handleImportFromNetease(song)"
              >
                一键导入
              </wd-button>
            </view>
          </view>
        </wd-card>
      </view>
    </template>
    
    <!-- 无搜索结果 -->
    <template v-else-if="keywords">
      <view class="p-4 text-center text-gray-500">
        <view>暂无搜索结果</view>
        <view v-if="searchType === 'netease'" class="mt-4 text-blue-500" @click="goToCreateSong">
          手动上传歌曲
        </view>
      </view>
    </template>
    
    <!-- 初始状态 -->
    <template v-else>
      <view class="p-4 text-center text-gray-500">
        <view v-if="searchType === 'local'">
          请输入关键词搜索本地歌曲
        </view>
        <view v-else>
          请输入关键词搜索网易云歌曲，然后点击"一键导入"添加到学习库
        </view>
      </view>
    </template>
    
    <wd-toast />
  </view>
</template>
