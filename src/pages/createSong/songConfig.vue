<script lang="ts" setup>
import { computed } from 'vue'
import { useToast } from 'wot-design-uni'
import { createSong, getNeteaseLyricById, getNeteaseSongDetailById } from '@/api/songs'
import { useUserStore } from '@/store/user'

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
const toast = useToast()
const mode = ref('')
const songId = ref('')
const songLyricObj = ref<any>()
const lyric = ref<any[]>([])
const translation = ref<any[]>([])
const romaLyric = ref<any[]>([])
const songName = ref('')
const singer = ref('')
const difficulty = ref(3)
const isPublic = ref(true)
const audioFilePath = ref('')
const audioUrl = ref('')
const lyricText = ref('')
const loading = ref(false)
const uploading = ref(false)
const userStore = useUserStore()
const hasLyrics = computed(() => {
  return (lyric.value && lyric.value.length) || (translation.value && translation.value.length) || (romaLyric.value && romaLyric.value.length)
})
const showPreview = computed(() => mode.value !== 'manual')
onLoad(async (options) => {
  mode.value = (options?.mode as string) || 'netease'
  songId.value = (options?.songId as string) || ''
  if (mode.value === 'manual') {
    if (!songId.value) {
      songId.value = Date.now().toString()
    }
    return
  }
  if (!songId.value) {
    toast.show('缺少歌曲 ID')
    return
  }
  try {
    const [lyricRes, detailRes]: any = await Promise.all([
      getNeteaseLyricById(songId.value),
      getNeteaseSongDetailById(songId.value),
    ])
    songLyricObj.value = lyricRes
    lyric.value = parseLRC(songLyricObj.value?.lrc?.lyric || '')
    translation.value = parseLRC(songLyricObj.value?.tlyric?.lyric || '')
    romaLyric.value = parseLRC(songLyricObj.value?.romalrc?.lyric || '')
    lyricText.value = songLyricObj.value?.lrc?.lyric || ''

    const songDetail = detailRes?.songs?.[0]
    songName.value = songDetail?.name || ''
    singer.value = songDetail?.ar?.map((a: any) => a.name).join(' / ') || ''
  }
  catch (e: any) {
    toast.show(e?.message || '加载失败')
  }
})

function parseLRC(lrcText: string) {
  if (!lrcText)
    return []
  const lines = lrcText.split('\n')
  console.log(lines)
  const result = []

  // 匹配时间标签 [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

  for (const line of lines) {
    const times = []
    let match: boolean

    // 提取所有时间标签
    while ((match = (timeRegex.exec(line)) !== null)) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      times.push(minutes * 60 * 1000 + seconds * 1000 + ms)
    }

    // 提取歌词文本（去掉时间标签）
    const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim()

    // 为每个时间点创建条目
    //
    for (const time of times) {
      if (text) {
        result.push({ time, text })
      }
    }
  }

  // 按时间排序
  console.log(result)
  return result.sort((a, b) => a.time - b.time)
}





const formatLine = (line: any) => line?.text || ''

async function chooseAudio() {
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    type: 'file',
    success(res) {
      const file = res.tempFiles?.[0]
      audioFilePath.value = file?.path || ''
    },
  })
  // #endif
  // #ifdef MP-WEIXIN
  uni.chooseMedia({
    count: 1,
    mediaType: ['audio'],
    success(res) {
      const file = res.tempFiles?.[0]
      audioFilePath.value = file?.tempFilePath || ''
    },
  })
  // #endif
}

async function uploadAudio() {
  if (!audioFilePath.value) {
    toast.show('请先选择音频文件')
    return
  }
  uploading.value = true
  const url = `/songs/upload`
  uni.uploadFile({
    url,
    filePath: audioFilePath.value,
    name: 'file',
    formData: {
      songId: songId.value || Date.now().toString(),
      filename: audioFilePath.value.split('/').pop() || 'audio.mp3',
    },
    success(res) {
      try {
        const data = JSON.parse(res.data)
        audioUrl.value = data?.data?.url || ''
        toast.show('上传成功')
      }
      catch {
        toast.show('上传失败')
      }
    },
    fail() {
      toast.show('上传失败')
    },
    complete() {
      uploading.value = false
    },
  })
}

async function handleSave() {
  if (!songName.value.trim()) {
    toast.show('请输入歌名')
    return
  }
  if (!singer.value.trim()) {
    toast.show('请输入歌手')
    return
  }
  if (!audioUrl.value) {
    toast.show('请先上传音频')
    return
  }
  loading.value = true
  try {
    const payload = {
      song_id: songId.value || Date.now().toString(),
      song_name: songName.value,
      singer: singer.value,
      difficulty: difficulty.value,
      audio_url: audioUrl.value,
      lyrics_text: lyricText.value,
      is_public: isPublic.value,
      status: 'published',
      create_user: userStore.userInfo?.userId || null,
    }
    await createSong(payload)
    toast.show('保存成功')
    uni.reLaunch({ url: '/pages/index/index' })
  }
  catch (e: any) {
    toast.show(e?.message || '保存失败')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="p-4">
    <view class="mb-4">
      <wd-card title="歌曲信息">
        <view class="mb-3">
          <text class="text-sm text-gray-500">歌名</text>
          <wd-input v-model="songName" placeholder="请输入歌名" />
        </view>
        <view class="mb-3">
          <text class="text-sm text-gray-500">歌手</text>
          <wd-input v-model="singer" placeholder="请输入歌手" />
        </view>
        <view class="mb-3">
          <text class="text-sm text-gray-500">难度 (1-5)</text>
          <wd-slider v-model="difficulty" :min="1" :max="5" />
        </view>
        <view class="mb-3 flex items-center justify-between">
          <text class="text-sm text-gray-500">公开给其他人</text>
          <wd-switch v-model="isPublic" size="20" />
        </view>
      </wd-card>
    </view>

    <view class="mb-4">
      <wd-card title="上传音频">
        <view class="text-gray-500">上传后可试听与学习</view>
        <view class="mt-3 flex items-center gap-3">
          <wd-button type="primary" size="small" @click="chooseAudio">选择音频</wd-button>
          <wd-button type="success" size="small" :loading="uploading" @click="uploadAudio">上传</wd-button>
        </view>
        <view v-if="audioUrl" class="mt-2 text-xs text-green-600">
          上传完成
        </view>
      </wd-card>
    </view>

    <view class="mb-4">
      <wd-card title="歌词配置">
        <view class="text-gray-500">
          若歌词不匹配，可在此编辑
        </view>
        <view class="mt-3">
          <wd-textarea v-model="lyricText" placeholder="粘贴 LRC 或纯文本歌词" :maxlength="-1" />
        </view>
      </wd-card>
    </view>

    <view class="mb-4">
      <wd-button block type="primary" :loading="loading" @click="handleSave">保存歌曲</wd-button>
    </view>

    <template v-if="showPreview && hasLyrics">
      <view class="mb-4">
        <view class="mb-2 text-lg font-bold">
          原文
        </view>
        <view v-for="line in lyric" :key="line.time" class="py-1 text-base">
          {{ formatLine(line) }}
        </view>
      </view>
      <view class="mb-4">
        <view class="mb-2 text-lg font-bold">
          翻译
        </view>
        <view v-for="line in translation" :key="line.time" class="py-1 text-base text-gray-500">
          {{ formatLine(line) }}
        </view>
      </view>
      <view class="mb-4">
        <view class="mb-2 text-lg font-bold">
          罗马音
        </view>
        <view v-for="line in romaLyric" :key="line.time" class="py-1 text-base text-gray-500">
          {{ formatLine(line) }}
        </view>
      </view>
    </template>
    <template v-else-if="showPreview">
      <view class="text-center text-gray-500">
        歌词加载中...
      </view>
    </template>
    <wd-toast />
  </view>
</template>
