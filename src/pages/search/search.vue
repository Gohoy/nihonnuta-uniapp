<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { searchLocalSongs } from '@/api/songs'

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
  searchLocalSongs(keywords.value).then((res: any) => {
    songs.value = res.songs || []
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
    <view v-for="song in songs" :key="song.song_id">
      <wd-card class="mt-2" @click="handleSongClick">
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
