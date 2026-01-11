<template>
  <view class="bg-white">
    <view class="mt-2 text-center text-2xl">
      Nihonnuta
    </view>
    <wd-search hide-cancel disabled @click="openSearchPage" />

    <wd-cell title="推荐歌曲" is-link class="mt-4 px-4" />
    <view v-for="song in songs" :key="song.id">
      <wd-card class="" @click="handleSongClick">
        <view class="align-center flex justify-between">
          <view class="flex">
            <wd-img :width="50" :height="50" :src="song.coverUrl" />
            <view class="ml-4">
              <view class="font-bold">
                {{ song.title }}
              </view>
              <view class="text-gray-500">
                {{ song.artist }}
              </view>
            </view>
          </view>
          <view class="w-25 flex flex-row items-center justify-between">
            <view class="flex flex-row">
              <view v-for="i in 5" :key="i">
                <wd-icon :name="i <= song.difficulty ? 'star-filled' : 'star'" />
              </view>
            </view>
            <wd-icon name="arrow-right" />
          </view>
        </view>
      </wd-card>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

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
onLoad(() => {
  console.log('测试 uni API 自动引入: onLoad')
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
const songs = ref([
  { id: 1, title: 'Song 1', artist: 'Artist 1', coverUrl: 'https://imgessl.kugou.com/stdmusic/20210811/20210811162401966545.jpg', difficulty: 1 },
  { id: 2, title: 'Song 2', artist: 'Artist 2', coverUrl: 'https://imgessl.kugou.com/stdmusic/20210811/20210811162401966545.jpg', difficulty: 2 },
  { id: 3, title: 'Song 3', artist: 'Artist 3', coverUrl: 'https://imgessl.kugou.com/stdmusic/20210811/20210811162401966545.jpg', difficulty: 3 },
  { id: 1, title: 'Song 1', artist: 'Artist 1', coverUrl: 'https://imgessl.kugou.com/stdmusic/20210811/20210811162401966545.jpg', difficulty: 1 },
  { id: 3, title: 'Song 3', artist: 'Artist 3', coverUrl: 'https://imgessl.kugou.com/stdmusic/20210811/20210811162401966545.jpg', difficulty: 3 },
])
function handleSongClick() {
  console.log('点击歌曲')
}
const router = useRouter()
function openSearchPage() {
  router.push({ path: '/pages/search/search' })
}
</script>
