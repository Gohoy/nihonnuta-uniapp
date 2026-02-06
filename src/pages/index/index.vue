<template>
  <view class="bg-white">
    <view class="mt-2 text-center text-2xl">
      Nihonnuta
    </view>
    <wd-search hide-cancel disabled @click="openSearchPage" />

    <wd-cell title="推荐歌曲" is-link class="mt-4 px-4" />
    <template v-if="songs.length > 0">
      <view v-for="song in songs" :key="song.song_id">
        <wd-card class="" @click="handleSongClick">
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
import { useRouter } from 'vue-router'
import { getSongsPage } from '@/api/songs'

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
onLoad(async () => {
  console.log('测试 uni API 自动引入: onLoad')
  const res: any = await getSongsPage(0, 10)
  songs.value = res.songs || []
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
function handleSongClick() {
  console.log('点击歌曲')
}
const router = useRouter()
function openSearchPage() {
  router.push({ path: '/pages/search/search' })
}
</script>
