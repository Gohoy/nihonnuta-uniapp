<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { useRoute } from 'vue-router'
import { getProcessedNeteaseLyricById, getProcessedSongById, playSong } from '@/api/songs'
import { recordLearning } from '@/api/learning'
import { addWordToBook } from '@/api/wordbook'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '歌词学习',
  },
})

interface Token {
  token_id: number
  text: string
  kana: string
  base_form: string
  pos: string
  pos_detail: string
  furigana: any[]
  furigana_html: string
  has_kanji: boolean
  tags?: string[]
  meaning?: string
}

interface LyricLine {
  time?: number
  time_str?: string
  original: string
  kana?: string
  furigana_html: string
  tokens: Token[]
  translate?: string
  roma?: string
  grammar?: any[]
}

const route = useRoute()
const songId = ref<string>((route.query.songId as string) || '')
const source = ref<string>((route.query.source as string) || 'local')
const songName = ref<string>((route.query.songName as string) || '')
const singer = ref<string>((route.query.singer as string) || '')
const coverUrl = ref<string>((route.query.coverUrl as string) || '')
const loading = ref(true)
const error = ref('')
const lyrics = ref<LyricLine[]>([])
const showTranslate = ref(true)
const showRoma = ref(false)
const showGrammar = ref(true)
const showFurigana = ref(true)
const selectedToken = ref<Token | null>(null)
const selectedLineIndex = ref<number>(-1)
const showWordDetail = ref(false)
const addingWord = ref(false)
const userStore = useUserStore()

async function loadLyrics() {
  if (!songId.value) {
    error.value = '缺少歌曲 ID'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const userId = userStore.userInfo?.userId
    const res: any = source.value === 'local'
      ? await getProcessedSongById(songId.value, userId)
      : await getProcessedNeteaseLyricById(songId.value)
    // res可能是lines数组，也可能是包含lines的对象
    lyrics.value = Array.isArray(res) ? res : (res?.lines || res?.data?.lines || [])
    if (source.value === 'local') {
      playSong(songId.value).catch(() => {})
    }
    if (userId && userId !== -1) {
      recordLearning(userId, songId.value).catch(() => {})
    }
    saveLearnedSong()
  }
  catch (e: any) {
    error.value = e?.message || '歌词加载失败'
  }
  finally {
    loading.value = false
  }
}

function handleRetry() {
  loadLyrics()
}

function saveLearnedSong() {
  if (!songId.value) return
  try {
    const cached = uni.getStorageSync('learnedSongs') || []
    const list = Array.isArray(cached) ? cached : []
    const filtered = list.filter((item: any) => String(item.song_id) !== String(songId.value))
    filtered.unshift({
      song_id: songId.value,
      song_name: songName.value,
      singer: singer.value,
      cover_url: coverUrl.value,
      source: source.value,
    })
    uni.setStorageSync('learnedSongs', filtered.slice(0, 20))
  }
  catch {}
}

function handleTokenClick(token: Token, lineIndex: number) {
  selectedToken.value = token
  selectedLineIndex.value = lineIndex
  showWordDetail.value = true
}

function closeWordDetail() {
  showWordDetail.value = false
  selectedToken.value = null
}

async function addToWordbook() {
  if (!selectedToken.value || !userStore.userInfo?.userId) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    })
    return
  }
  
  if (addingWord.value) return
  
  addingWord.value = true
  try {
    const line = lyrics.value[selectedLineIndex.value]
    await addWordToBook({
      user_id: userStore.userInfo.userId,
      song_id: songId.value,
      line_num: selectedLineIndex.value,
      token_id: selectedToken.value.token_id,
      word: selectedToken.value.text,
      kana: selectedToken.value.kana,
      pos: selectedToken.value.pos,
      meaning: '', // 可以从tags或其他地方获取
    })
    uni.showToast({
      title: '已添加到单词本',
      icon: 'success',
    })
    closeWordDetail()
  } catch (e: any) {
    uni.showToast({
      title: e?.message || '添加失败',
      icon: 'none',
    })
  } finally {
    addingWord.value = false
  }
}

// 渲染假名标注的HTML
function renderFuriganaHtml(line: LyricLine) {
  if (!line.tokens || line.tokens.length === 0) {
    return line.furigana_html || line.original
  }
  
  // 使用tokens构建可点击的HTML
  return line.tokens.map((token, idx) => {
    const furiganaHtml = token.furigana_html || token.text
    return `<span class="lyric-token" data-token-idx="${idx}" style="cursor: pointer; padding: 2px 1px; border-radius: 2px; transition: background 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background=''">${furiganaHtml}</span>`
  }).join('')
}

onLoad(() => {
  loadLyrics()
})
</script>

<template>
  <view class="p-4">
    <view class="mb-3 flex items-center justify-between">
      <view class="text-lg font-bold">歌词学习</view>
      <view class="flex items-center gap-2 flex-wrap">
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">假名</text>
          <wd-switch v-model="showFurigana" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">翻译</text>
          <wd-switch v-model="showTranslate" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">罗马音</text>
          <wd-switch v-model="showRoma" size="20" />
        </view>
        <view class="flex items-center">
          <text class="mr-1 text-xs text-gray-600">语法</text>
          <wd-switch v-model="showGrammar" size="20" />
        </view>
      </view>
    </view>

    <template v-if="loading">
      <view class="py-6 text-center text-gray-500">加载中...</view>
    </template>
    <template v-else-if="error">
      <view class="py-6 text-center text-red-500">{{ error }}</view>
      <view class="mt-2 text-center text-blue-500" @click="handleRetry">
        点击重试
      </view>
    </template>
    <template v-else-if="lyrics.length === 0">
      <view class="py-6 text-center text-gray-500">暂无歌词</view>
    </template>
    <template v-else>
      <view v-for="(line, index) in lyrics" :key="index" class="mb-4 p-3 rounded-lg bg-gray-50">
        <!-- 假名标注的歌词行 -->
        <view v-if="showFurigana && line.tokens && line.tokens.length > 0" class="mb-2">
          <view class="flex flex-wrap items-center gap-1 text-base leading-relaxed">
            <view
              v-for="(token, tokenIdx) in line.tokens"
              :key="tokenIdx"
              class="lyric-token inline-block px-1 py-0.5 rounded transition-colors"
              :class="token.has_kanji ? 'hover:bg-blue-100 cursor-pointer active:bg-blue-200' : ''"
              @click="token.has_kanji ? handleTokenClick(token, index) : null"
            >
              <rich-text
                :nodes="token.furigana_html || token.text"
                class="text-base"
              />
            </view>
          </view>
        </view>
        <view v-else class="mb-2 text-base">
          <rich-text :nodes="line.furigana_html || line.original || ''" />
        </view>
        
        <!-- 翻译 -->
        <view v-if="showTranslate && line.translate" class="text-sm text-gray-600 mt-1">
          {{ line.translate }}
        </view>
        
        <!-- 罗马音 -->
        <view v-if="showRoma && line.roma" class="text-sm text-gray-400 mt-1 italic">
          {{ line.roma }}
        </view>
        
        <!-- 语法标注 -->
        <view v-if="showGrammar && line.grammar && line.grammar.length" class="mt-2 flex flex-wrap gap-2">
          <view
            v-for="(g, gi) in line.grammar"
            :key="gi"
            class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
          >
            {{ g.name }} · {{ g.level }}
          </view>
        </view>
      </view>
    </template>

    <!-- 单词详情弹窗 -->
    <wd-popup v-model="showWordDetail" position="bottom" :close-on-click-overlay="true">
      <view v-if="selectedToken" class="p-4 bg-white rounded-t-lg">
        <view class="mb-4 flex items-center justify-between">
          <view class="text-lg font-bold">{{ selectedToken.text }}</view>
          <wd-icon name="close" @click="closeWordDetail" />
        </view>
        
        <view class="mb-3">
          <view class="text-sm text-gray-500 mb-1">假名</view>
          <view class="text-base">{{ selectedToken.kana }}</view>
        </view>
        
        <view class="mb-3" v-if="selectedToken.base_form !== selectedToken.text">
          <view class="text-sm text-gray-500 mb-1">基本形</view>
          <view class="text-base">{{ selectedToken.base_form }}</view>
        </view>
        
        <view class="mb-3">
          <view class="text-sm text-gray-500 mb-1">词性</view>
          <view class="text-base">{{ selectedToken.pos }} {{ selectedToken.pos_detail }}</view>
        </view>
        
        <view class="mb-3" v-if="selectedToken.tags && selectedToken.tags.length > 0">
          <view class="text-sm text-gray-500 mb-1">标签</view>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="tag in selectedToken.tags"
              :key="tag"
              class="rounded bg-green-100 px-2 py-1 text-xs text-green-700"
            >
              {{ tag }}
            </view>
          </view>
        </view>
        
        <view class="flex gap-2 mt-4">
          <wd-button
            type="primary"
            block
            :loading="addingWord"
            @click="addToWordbook"
          >
            添加到单词本
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
