<template>
  <view class="bg-white min-h-screen">
    <!-- 统计信息 -->
    <view class="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <view class="text-lg font-bold mb-3">我的语法本</view>
      <view v-if="stats" class="flex justify-around">
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.total_grammars || 0 }}</view>
          <view class="text-sm opacity-90">总语法</view>
        </view>
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.mastered_grammars || 0 }}</view>
          <view class="text-sm opacity-90">已掌握</view>
        </view>
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.learning_grammars || 0 }}</view>
          <view class="text-sm opacity-90">学习中</view>
        </view>
        <view class="text-center">
          <view class="text-2xl font-bold">{{ stats.unmastered_grammars || 0 }}</view>
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
        :class="currentTab === tab.value ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 语法列表 -->
    <template v-if="loading">
      <view class="p-4 text-center text-gray-500">加载中...</view>
    </template>
    <template v-else-if="error">
      <view class="p-4 text-center text-red-500">{{ error }}</view>
    </template>
    <template v-else-if="grammars.length === 0">
      <view class="p-4 text-center text-gray-500">暂无语法</view>
    </template>
    <template v-else>
      <view v-for="grammar in grammars" :key="grammar.grammar_book_id" class="p-4 border-b border-gray-100">
        <view class="flex items-start justify-between mb-2">
          <view class="flex-1">
            <view class="text-lg font-bold mb-1">{{ grammar.structure_desc }}</view>
            <view class="text-sm text-gray-500 mb-1">{{ grammar.grammar_type }}</view>
            <view class="text-xs text-gray-400">{{ grammar.grammar_relation }}</view>
          </view>
          <view class="ml-4">
            <wd-tag
              :type="getStatusType(grammar.master_status)"
              size="small"
            >
              {{ getStatusText(grammar.master_status) }}
            </wd-tag>
          </view>
        </view>
        
        <view v-if="grammar.grammar_desc" class="text-sm text-gray-600 mb-2">
          {{ grammar.grammar_desc }}
        </view>
        
        <view v-if="grammar.song_name" class="text-xs text-gray-400 mb-2">
          来自: {{ grammar.song_name }} - {{ grammar.singer }}
        </view>
        
        <view class="flex gap-2 mt-2">
          <wd-button
            v-if="grammar.master_status !== 'mastered'"
            size="small"
            type="success"
            @click="updateStatus(grammar, 'mastered')"
          >
            标记为已掌握
          </wd-button>
          <wd-button
            v-if="grammar.master_status !== 'learning'"
            size="small"
            type="primary"
            @click="updateStatus(grammar, 'learning')"
          >
            标记为学习中
          </wd-button>
          <wd-button
            v-if="grammar.master_status !== 'unmastered'"
            size="small"
            @click="updateStatus(grammar, 'unmastered')"
          >
            标记为未掌握
          </wd-button>
          <wd-button
            size="small"
            type="danger"
            @click="handleRemove(grammar)"
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
import { getGrammarBook, getGrammarBookStats, updateGrammarStatus, removeGrammar } from '@/api/grammarbook'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '语法本',
  },
})

interface Grammar {
  grammar_book_id: number
  structure_desc: string
  grammar_type: string
  grammar_relation: string
  grammar_desc: string
  master_status: 'unmastered' | 'learning' | 'mastered'
  song_name?: string
  singer?: string
}

const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const grammars = ref<Grammar[]>([])
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
    const res: any = await getGrammarBookStats(userId)
    stats.value = res
  } catch (e: any) {
    console.error('加载统计失败:', e)
  }
}

async function loadGrammars(reset = false) {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    error.value = '请先登录'
    loading.value = false
    return
  }
  
  if (reset) {
    offset.value = 0
    grammars.value = []
    hasMore.value = true
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const masterStatus = currentTab.value === 'all' ? undefined : currentTab.value
    const res: any = await getGrammarBook(userId, {
      master_status: masterStatus,
      limit,
      offset: offset.value,
    })
    
    if (reset) {
      grammars.value = res.grammars || []
    } else {
      grammars.value.push(...(res.grammars || []))
    }
    
    hasMore.value = (res.grammars || []).length === limit
    offset.value += limit
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  loadGrammars(true)
}

async function updateStatus(grammar: Grammar, status: 'unmastered' | 'learning' | 'mastered') {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  try {
    await updateGrammarStatus({
      user_id: userId,
      grammar_book_id: grammar.grammar_book_id,
      master_status: status,
    })
    grammar.master_status = status
    await loadStats()
    uni.showToast({ title: '更新成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' })
  }
}

async function handleRemove(grammar: Grammar) {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除语法 "${grammar.structure_desc}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeGrammar(grammar.grammar_book_id, userId)
          grammars.value = grammars.value.filter(g => g.grammar_book_id !== grammar.grammar_book_id)
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
  loadGrammars(false)
}

onLoad(() => {
  loadStats()
  loadGrammars(true)
})
</script>

