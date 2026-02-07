<template>
  <view class="bg-white min-h-screen">
    <!-- 统计信息 -->
    <view class="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <view class="text-lg font-bold mb-3">我的单词本</view>
      <view v-if="stats" class="flex justify-around">
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.total_words || 0 }}</view>
          <view class="text-sm opacity-90">总单词</view>
        </view>
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.mastered_words || 0 }}</view>
          <view class="text-sm opacity-90">已掌握</view>
        </view>
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.learning_words || 0 }}</view>
          <view class="text-sm opacity-90">学习中</view>
        </view>
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.unmastered_words || 0 }}</view>
          <view class="text-sm opacity-90">未掌握</view>
        </view>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="flex gap-2 p-4 overflow-x-auto">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
        :class="currentTab === tab.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 单词列表 -->
    <template v-if="loading">
      <view class="p-4 text-center text-gray-500">加载中...</view>
    </template>
    <template v-else-if="error">
      <view class="p-4 text-center text-red-500">{{ error }}</view>
    </template>
    <template v-else-if="words.length === 0">
      <view class="p-4 text-center text-gray-500">暂无单词</view>
    </template>
    <template v-else>
      <view v-for="word in words" :key="word.word_book_id" class="p-4 border-b border-gray-100">
        <view class="flex items-start justify-between mb-2">
          <view class="flex-1">
            <view class="text-lg font-bold mb-1">{{ word.word }}</view>
            <view class="text-sm text-gray-500 mb-1">{{ word.kana }}</view>
            <view class="text-xs text-gray-400">{{ word.pos }}</view>
          </view>
          <view class="ml-4">
            <wd-tag
              :type="getStatusType(word.master_status)"
              size="small"
            >
              {{ getStatusText(word.master_status) }}
            </wd-tag>
          </view>
        </view>
        
        <view v-if="word.meaning" class="text-sm text-gray-600 mb-2">
          {{ word.meaning }}
        </view>
        
        <view v-if="word.song_name" class="text-xs text-gray-400 mb-2">
          来自: {{ word.song_name }} - {{ word.singer }}
        </view>
        
        <view class="flex gap-2 mt-2">
          <wd-button
            v-if="word.master_status !== 'mastered'"
            size="small"
            type="success"
            @click="updateStatus(word, 'mastered')"
          >
            标记为已掌握
          </wd-button>
          <wd-button
            v-if="word.master_status !== 'learning'"
            size="small"
            type="primary"
            @click="updateStatus(word, 'learning')"
          >
            标记为学习中
          </wd-button>
          <wd-button
            v-if="word.master_status !== 'unmastered'"
            size="small"
            @click="updateStatus(word, 'unmastered')"
          >
            标记为未掌握
          </wd-button>
          <wd-button
            size="small"
            type="danger"
            @click="handleRemove(word)"
          >
            删除
          </wd-button>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore" class="p-4 text-center">
        <wd-button
          type="primary"
          plain
          @click="loadMore"
        >
          加载更多
        </wd-button>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { getWordbook, getWordbookStats, updateWordStatus, removeWord } from '@/api/wordbook'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '单词本',
  },
})

interface Word {
  word_book_id: number
  word: string
  kana: string
  pos: string
  meaning: string
  master_status: 'unmastered' | 'learning' | 'mastered'
  song_name?: string
  singer?: string
}

const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const words = ref<Word[]>([])
const stats = ref<any>(null)
const currentTab = ref<string>('all')
const offset = ref(0)
const limit = 20
const hasMore = ref(true)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '未掌握', value: 'unmastered' },
  { label: '学习中', value: 'learning' },
  { label: '已掌握', value: 'mastered' },
]

function getStatusType(status: string) {
  const map: Record<string, string> = {
    mastered: 'success',
    learning: 'primary',
    unmastered: 'info',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    mastered: '已掌握',
    learning: '学习中',
    unmastered: '未掌握',
  }
  return map[status] || '未知'
}

async function loadStats() {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) return
  
  try {
    const res: any = await getWordbookStats(userId)
    stats.value = res
  } catch (e: any) {
    console.error('加载统计失败:', e)
  }
}

async function loadWords(reset = false) {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    error.value = '请先登录'
    loading.value = false
    return
  }
  
  if (reset) {
    offset.value = 0
    words.value = []
    hasMore.value = true
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const masterStatus = currentTab.value === 'all' ? undefined : currentTab.value
    const res: any = await getWordbook(userId, {
      master_status: masterStatus,
      limit,
      offset: offset.value,
    })
    
    if (reset) {
      words.value = res.words || []
    } else {
      words.value.push(...(res.words || []))
    }
    
    hasMore.value = (res.words || []).length === limit
    offset.value += limit
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  loadWords(true)
}

async function updateStatus(word: Word, status: 'unmastered' | 'learning' | 'mastered') {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  try {
    await updateWordStatus({
      user_id: userId,
      word_book_id: word.word_book_id,
      master_status: status,
    })
    word.master_status = status
    await loadStats()
    uni.showToast({ title: '更新成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' })
  }
}

async function handleRemove(word: Word) {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除单词 "${word.word}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeWord(word.word_book_id, userId)
          words.value = words.value.filter(w => w.word_book_id !== word.word_book_id)
          await loadStats()
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (e: any) {
          uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
        }
      }
    },
  })
}

function loadMore() {
  loadWords(false)
}

onLoad(() => {
  loadStats()
  loadWords(true)
})
</script>

