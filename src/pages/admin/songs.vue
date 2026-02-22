<script lang="ts" setup>
import { getAdminSongs, updateAdminSong, deleteAdminSong } from '@/api/admin'

definePage({
  style: {
    navigationBarTitleText: '歌曲管理',
  },
})

const songs = ref<any[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref('')
const loading = ref(false)
const offset = ref(0)
const limit = 20

// Edit popup
const editVisible = ref(false)
const editSong = ref<any>(null)
const editForm = ref({ song_name: '', singer: '', difficulty: '', is_public: true })

async function loadSongs(reset = false) {
  if (reset) offset.value = 0
  loading.value = true
  try {
    const res: any = await getAdminSongs({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      offset: offset.value,
      limit,
    })
    songs.value = reset ? res.songs : [...songs.value, ...res.songs]
    total.value = res.total
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function openEdit(song: any) {
  editSong.value = song
  editForm.value = {
    song_name: song.song_name,
    singer: song.singer,
    difficulty: song.difficulty,
    is_public: song.is_public,
  }
  editVisible.value = true
}

async function saveEdit() {
  if (!editSong.value) return
  try {
    await updateAdminSong(editSong.value.song_id, editForm.value)
    Object.assign(editSong.value, editForm.value)
    editVisible.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' })
  }
}

async function handleDelete(song: any) {
  try {
    await deleteAdminSong(song.song_id)
    song.status = 'offline'
    uni.showToast({ title: '已下线', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

function loadMore() {
  if (songs.value.length >= total.value) return
  offset.value += limit
  loadSongs()
}

onMounted(() => loadSongs(true))
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view class="flex gap-2 mb-3">
      <input
        v-model="search"
        class="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm"
        placeholder="搜索歌名/歌手"
        @confirm="loadSongs(true)"
      />
      <view class="px-4 py-2 bg-blue-500 text-white rounded text-sm" @click="loadSongs(true)">
        搜索
      </view>
    </view>

    <view class="flex gap-2 mb-4">
      <view
        v-for="s in ['', 'published', 'offline']"
        :key="s"
        class="px-3 py-1 rounded text-xs"
        :class="statusFilter === s ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'"
        @click="statusFilter = s; loadSongs(true)"
      >
        {{ s === '' ? '全部' : s === 'published' ? '已发布' : '已下线' }}
      </view>
    </view>

    <view class="text-xs text-gray-400 mb-2">共 {{ total }} 首</view>

    <view
      v-for="song in songs"
      :key="song.song_id"
      class="bg-white rounded-lg px-4 py-3 mb-2"
    >
      <view class="flex items-center justify-between">
        <view class="flex-1 min-w-0">
          <view class="text-sm text-gray-800 truncate">{{ song.song_name }}</view>
          <view class="text-xs text-gray-400 mt-0.5">
            {{ song.singer }} · 难度{{ song.difficulty }}
            · {{ song.status }}
            · 播放{{ song.play_count || 0 }}
          </view>
        </view>
        <view class="flex gap-2 ml-2 flex-shrink-0">
          <view class="px-2 py-1 bg-blue-50 text-blue-500 rounded text-xs" @click="openEdit(song)">
            编辑
          </view>
          <view
            v-if="song.status !== 'offline'"
            class="px-2 py-1 bg-red-50 text-red-500 rounded text-xs"
            @click="handleDelete(song)"
          >
            下线
          </view>
        </view>
      </view>
    </view>

    <view v-if="songs.length < total" class="text-center py-3 text-sm text-blue-500" @click="loadMore">
      加载更多
    </view>
    <view v-if="loading" class="text-center py-3 text-sm text-gray-400">加载中...</view>

    <!-- Edit Popup -->
    <wd-popup v-model="editVisible" position="bottom" custom-style="border-radius: 16px 16px 0 0; padding: 20px;">
      <view class="text-base font-medium mb-4">编辑歌曲</view>
      <view class="mb-3">
        <view class="text-xs text-gray-500 mb-1">歌名</view>
        <input v-model="editForm.song_name" class="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
      </view>
      <view class="mb-3">
        <view class="text-xs text-gray-500 mb-1">歌手</view>
        <input v-model="editForm.singer" class="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
      </view>
      <view class="mb-3">
        <view class="text-xs text-gray-500 mb-1">难度</view>
        <input v-model="editForm.difficulty" class="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
      </view>
      <view class="flex gap-3 mt-4">
        <view class="flex-1 text-center py-2 bg-gray-100 rounded text-sm" @click="editVisible = false">取消</view>
        <view class="flex-1 text-center py-2 bg-blue-500 text-white rounded text-sm" @click="saveEdit">保存</view>
      </view>
    </wd-popup>
  </view>
</template>
