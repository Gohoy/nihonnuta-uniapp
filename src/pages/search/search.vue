<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { http } from '@/http/http'

definePage({
  style: {
    navigationBarTitleText: '',
  },
})
const keywords = ref('')
const autoFocus = ref(true)
onLoad(() => {
  autoFocus.value = true
})
const songs = ref([])
function handleSearchSongs() {
  http.get('/base/songs/search', { keywords: keywords.value }).then((res: any) => {
    songs.value = res
    console.log('搜索结果', res)
  })
}
function handleSongClick() {
  console.log('点击歌曲')
}
const router = useRouter()
function goToCreateSong() {
  router.push('/pages/createSong/createSong')
}
</script>

<template>
  <view class="">
    <wd-search
      v-model="keywords" :focus="autoFocus" placeholder="搜索歌曲、歌手" hide-cancel
      @search="handleSearchSongs"
    />
  </view>
  <template v-if="songs.length > 0">
    <view v-for="song in songs" :key="song.id">
      11
    </view>
  </template>
  <template v-else-if="keywords">
    <view class="p-4 text-center text-gray-500">
      暂无搜索结果
      <view class="mt-4 text-blue-500" @click="goToCreateSong">
        去新建歌曲
      </view>
    </view>
  </template>
  <template v-else>
    <view class="p-4 text-center text-gray-500">
      请输入搜索关键词
    </view>
  </template>
</template>
