<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useToast } from 'wot-design-uni'
import { getLyricById } from '@/api/songs'
import { http } from '@/http/http'

defineOptions({
  name: '',
  options: {
    virtualHost: true,
  },
})
definePage({
  style: {
    navigationBarTitleText: '新建歌曲',
  },
})
const keywords = ref('')
const searchResults = ref([])
function handleSearchNeteaseSongs() {
  console.log('搜索网易云歌曲')
  http.get('/songs/search', { keywords: keywords.value }).then((res: any) => {
    console.log('搜索结果', res)
    searchResults.value = res.songs
  })
}
const router = useRouter()
const toast = useToast()
function goSongConfig(id) {
  // 获取歌词，查看是否是日语歌
  getLyricById(id).then((res: any) => {
    console.log('搜索结果', res)

    if (res.romalrc.lyric === '') {
      toast.show('这首歌不是日语歌，请重新选择')
      return
    }

    router.push({ path: '/pages/createSong/songConfig', query: {
      songId: id,
    } })
  })
}
</script>

<template>
  <view class="">
    <view>
      <wd-card title="歌曲选择(可以在歌名后加上歌手名来精准筛选)">
        <view class="flex flex-row">
          <wd-search
            v-model="keywords" placeholder="请输入歌曲或歌手名称" hide-cancel class="flex-1"
            @search="handleSearchNeteaseSongs"
          />
        </view>
        <scroll-view scroll-y class="">
          <wd-cell-group>
            <wd-cell v-for="item in searchResults" :key="item.id" is-link class="mt-2" title-width="90%" @click="goSongConfig(item.id)">
              <template #title>
                {{ item.name }} - {{ item.artists.map(a => a.name).join(' / ') }}
              </template>
            </wd-cell>
          </wd-cell-group>
        </scroll-view>
      </wd-card>
    </view>
    <wd-toast />
  </view>
</template>
