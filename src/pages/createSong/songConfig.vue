<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { getLyricById } from '@/api/songs'

defineOptions({
  name: '',
  options: {
    virtualHost: true,
  },
})
definePage({
  style: {
    navigationBarTitleText: '歌曲配置',
  },
})
const route = useRoute()
const songId = ref(route.query.songId as string)
const songLyricObj = ref()
onMounted(() => {
  getLyricById(songId.value).then((res) => {
    songLyricObj.value = res
    console.log(songLyricObj.value)
  })
})
</script>

<template>
  <view class="">
    {{ songId || 0 }}
  </view>
</template>

<style lang="scss" scoped>
//
</style>
