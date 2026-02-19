<template>
  <view class="bg-gray-50 min-h-screen">
    <!-- 统计信息卡片 -->
    <view class="p-4">
      <wd-card title="我的单词本" class="mb-4">
        <view v-if="stats" class="grid grid-cols-4 gap-4">
          <view class="text-center">
            <view class="text-2xl font-bold text-gray-800">{{ stats.total_words || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">总单词</view>
          </view>
          <view class="text-center">
            <view class="text-2xl font-bold text-green-600">{{ stats.mastered_words || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">已掌握</view>
          </view>
          <view class="text-center">
            <view class="text-2xl font-bold text-blue-600">{{ stats.learning_words || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">学习中</view>
          </view>
          <view class="text-center">
            <view class="text-2xl font-bold text-gray-400">{{ stats.unmastered_words || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">未掌握</view>
          </view>
        </view>
        <view v-else class="py-4 text-center text-gray-400">
          加载中...
        </view>
      </wd-card>

      <!-- 复习入口 -->
      <view class="mt-3">
        <wd-button type="primary" block @click="goToReview">
          开始复习{{ dueCount > 0 ? ` (${dueCount} 个待复习)` : '' }}
        </wd-button>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="px-4 mb-4">
      <wd-segmented
        v-model="currentTab"
        :options="tabs"
        @change="switchTab"
      />
    </view>

    <!-- 单词列表 -->
    <view class="px-4">
      <wd-loading v-if="loading" />
      <wd-status-tip v-else-if="error" type="error" :tip="error" />
      <wd-status-tip v-else-if="words.length === 0" type="empty" tip="暂无单词" />
      <wd-cell-group v-else border>
        <wd-cell
          v-for="word in words"
          :key="word.word_book_id"
          :title="word.word"
          :label="word.kana"
          :value="word.meaning"
          is-link
          @click="openWordDetail(word)"
        >
          <template #icon>
            <wd-tag
              :type="getStatusType(word.master_status)"
              size="small"
              round
            >
              {{ getStatusText(word.master_status) }}
            </wd-tag>
          </template>
          <template #label>
            <view class="flex items-center gap-2 mt-1">
              <text class="text-xs text-gray-500">{{ word.kana }}</text>
              <text v-if="word.pos" class="text-xs text-gray-400">({{ word.pos }})</text>
            </view>
            <view v-if="word.song_name" class="text-xs text-gray-400 mt-1">
              来自: {{ word.song_name }} - {{ word.singer }}
            </view>
            <view v-if="word.example_sentence" class="text-xs text-gray-400 mt-1 italic">
              「{{ word.example_sentence }}」
            </view>
          </template>
        </wd-cell>
      </wd-cell-group>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading" class="py-4 text-center">
        <wd-button type="primary" plain @click="loadMore">
          加载更多
        </wd-button>
      </view>
    </view>

    <!-- 单词详情弹窗 -->
    <wd-popup
      v-model="showDetail"
      position="bottom"
      closable
      title="单词详情"
      safe-area-inset-bottom
    >
      <view v-if="currentWord" class="p-4">
        <view class="mb-4">
          <view class="text-2xl font-bold mb-2">{{ currentWord.word }}</view>
          <view class="text-lg text-gray-600 mb-2">{{ currentWord.kana }}</view>
          <view class="flex items-center gap-2 mb-2">
            <wd-tag
              :type="getStatusType(currentWord.master_status)"
              size="small"
            >
              {{ getStatusText(currentWord.master_status) }}
            </wd-tag>
            <wd-tag v-if="currentWord.pos" type="info" size="small">
              {{ currentWord.pos }}
            </wd-tag>
          </view>
          <view class="text-base text-gray-800 mb-2">
            <text class="font-semibold">释义：</text>{{ currentWord.meaning }}
          </view>
          <view v-if="currentWord.song_name" class="text-sm text-gray-500">
            来自: {{ currentWord.song_name }} - {{ currentWord.singer }}
          </view>
          <view v-if="currentWord.example_sentence" class="text-sm text-gray-500 mt-1 italic">
            例句: 「{{ currentWord.example_sentence }}」
          </view>
        </view>

        <!-- 笔记编辑 -->
        <view class="mb-4">
          <view class="text-sm font-semibold mb-2">我的笔记</view>
          <wd-textarea
            v-model="noteText"
            placeholder="添加笔记..."
            :maxlength="500"
            :show-word-limit="true"
          />
        </view>

        <!-- 操作按钮 -->
        <view class="flex gap-2 mb-4">
          <wd-button
            v-if="currentWord.master_status !== 'mastered'"
            type="success"
            size="small"
            block
            @click="updateStatus(currentWord, 'mastered')"
          >
            标记为已掌握
          </wd-button>
          <wd-button
            v-if="currentWord.master_status !== 'learning'"
            type="primary"
            size="small"
            block
            @click="updateStatus(currentWord, 'learning')"
          >
            标记为学习中
          </wd-button>
          <wd-button
            v-if="currentWord.master_status !== 'unmastered'"
            size="small"
            block
            @click="updateStatus(currentWord, 'unmastered')"
          >
            标记为未掌握
          </wd-button>
        </view>

        <view class="flex gap-2">
          <wd-button
            type="primary"
            size="small"
            block
            @click="saveNote"
          >
            保存笔记
          </wd-button>
          <wd-button
            type="danger"
            size="small"
            block
            @click="handleRemove(currentWord)"
          >
            删除单词
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <wd-toast />
  </view>
</template>

<script lang="ts" setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getWordbook, getWordbookStats, updateWordStatus, removeWord, updateWordNote } from '@/api/wordbook'
import { getDueWords } from '@/api/review'
import { useUserStore } from '@/store/user'
import { useToast } from 'wot-design-uni'
// 小程序不支持 vue-router

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
  note?: string
  song_name?: string
  singer?: string
  example_sentence?: string
}

const userStore = useUserStore()
const toast = useToast()
// router removed, using uni.navigateTo
const loading = ref(true)
const error = ref('')
const words = ref<Word[]>([])
const stats = ref<any>(null)
const dueCount = ref(0)
const currentTab = ref('all')
const offset = ref(0)
const limit = 20
const hasMore = ref(true)
const showDetail = ref(false)
const currentWord = ref<Word | null>(null)
const noteText = ref('')

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
    const res: any = await getWordbookStats()
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
    const res: any = await getWordbook({
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

function switchTab() {
  loadWords(true)
}

function openWordDetail(word: Word) {
  currentWord.value = word
  noteText.value = word.note || ''
  showDetail.value = true
}

async function updateStatus(word: Word, status: 'unmastered' | 'learning' | 'mastered') {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    toast.show('请先登录')
    return
  }
  
  try {
    await updateWordStatus({
      word_book_id: word.word_book_id,
      master_status: status,
    })
    word.master_status = status
    await loadStats()
    toast.show('更新成功')
  } catch (e: any) {
    toast.show(e?.message || '更新失败')
  }
}

async function saveNote() {
  if (!currentWord.value) return
  
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    toast.show('请先登录')
    return
  }
  
  try {
    await updateWordNote({
      word_book_id: currentWord.value.word_book_id,
      note: noteText.value,
    })
    currentWord.value.note = noteText.value
    toast.show('笔记保存成功')
  } catch (e: any) {
    toast.show(e?.message || '保存失败')
  }
}

async function handleRemove(word: Word) {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    toast.show('请先登录')
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除单词 "${word.word}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeWord(word.word_book_id)
          words.value = words.value.filter(w => w.word_book_id !== word.word_book_id)
          await loadStats()
          showDetail.value = false
          toast.show('删除成功')
        } catch (e: any) {
          toast.show(e?.message || '删除失败')
        }
      }
    },
  })
}

function loadMore() {
  loadWords(false)
}

async function loadDueCount() {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) return
  try {
    const res: any = await getDueWords(1)
    dueCount.value = res.total || 0
  } catch {}
}

function goToReview() {
  uni.navigateTo({ url: '/pages/review/index?type=word' })
}

onLoad(() => {
  loadStats()
  loadWords(true)
  loadDueCount()
})

onShow(() => {
  loadDueCount()
})
</script>
