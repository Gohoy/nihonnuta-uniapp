<template>
  <view class="bg-gray-50 min-h-screen">
    <!-- 统计信息卡片 -->
    <view class="p-4">
      <wd-card title="我的语法本" class="mb-4">
        <view v-if="stats" class="grid grid-cols-4 gap-4">
          <view class="text-center">
            <view class="text-2xl font-bold text-gray-800">{{ stats.total_grammars || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">总语法</view>
          </view>
          <view class="text-center">
            <view class="text-2xl font-bold text-green-600">{{ stats.mastered_grammars || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">已掌握</view>
          </view>
          <view class="text-center">
            <view class="text-2xl font-bold text-blue-600">{{ stats.learning_grammars || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">学习中</view>
          </view>
          <view class="text-center">
            <view class="text-2xl font-bold text-gray-400">{{ stats.unmastered_grammars || 0 }}</view>
            <view class="text-xs text-gray-500 mt-1">未掌握</view>
          </view>
        </view>
        <view v-else class="py-4 text-center text-gray-400">
          加载中...
        </view>
      </wd-card>
    </view>

    <!-- 筛选标签 -->
    <view class="px-4 mb-4">
      <wd-segmented
        v-model="currentTab"
        :options="tabs"
        @change="switchTab"
      />
    </view>

    <!-- 语法列表 -->
    <view class="px-4">
      <wd-loading v-if="loading" />
      <wd-status-tip v-else-if="error" type="error" :tip="error" />
      <wd-status-tip v-else-if="grammars.length === 0" type="empty" tip="暂无语法" />
      <wd-cell-group v-else border>
        <wd-cell
          v-for="grammar in grammars"
          :key="grammar.grammar_book_id"
          :title="grammar.structure_desc || '语法结构'"
          :label="grammar.grammar_type"
          :value="grammar.grammar_desc"
          is-link
          @click="openGrammarDetail(grammar)"
        >
          <template #icon>
            <wd-tag
              :type="getStatusType(grammar.master_status)"
              size="small"
              round
            >
              {{ getStatusText(grammar.master_status) }}
            </wd-tag>
          </template>
          <template #label>
            <view class="flex items-center gap-2 mt-1">
              <text v-if="grammar.grammar_type" class="text-xs text-gray-500">{{ grammar.grammar_type }}</text>
              <text v-if="grammar.grammar_relation" class="text-xs text-gray-400">({{ grammar.grammar_relation }})</text>
            </view>
            <view v-if="grammar.song_name" class="text-xs text-gray-400 mt-1">
              来自: {{ grammar.song_name }} - {{ grammar.singer }}
            </view>
            <view v-if="grammar.example_sentence" class="text-xs text-gray-400 mt-1 italic">
              「{{ grammar.example_sentence }}」
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

    <!-- 语法详情弹窗 -->
    <wd-popup
      v-model="showDetail"
      position="bottom"
      closable
      title="语法详情"
      safe-area-inset-bottom
    >
      <view v-if="currentGrammar" class="p-4">
        <view class="mb-4">
          <view class="text-xl font-bold mb-2">{{ currentGrammar.structure_desc || '语法结构' }}</view>
          <view class="flex items-center gap-2 mb-2">
            <wd-tag
              :type="getStatusType(currentGrammar.master_status)"
              size="small"
            >
              {{ getStatusText(currentGrammar.master_status) }}
            </wd-tag>
            <wd-tag v-if="currentGrammar.grammar_type" type="info" size="small">
              {{ currentGrammar.grammar_type }}
            </wd-tag>
            <wd-tag v-if="currentGrammar.grammar_relation" type="warning" size="small">
              {{ currentGrammar.grammar_relation }}
            </wd-tag>
          </view>
          <view v-if="currentGrammar.grammar_desc" class="text-base text-gray-800 mb-2">
            <text class="font-semibold">说明：</text>{{ currentGrammar.grammar_desc }}
          </view>
          <view v-if="currentGrammar.song_name" class="text-sm text-gray-500 mb-2">
            来自: {{ currentGrammar.song_name }} - {{ currentGrammar.singer }}
          </view>
          <view v-if="currentGrammar.example_sentence" class="text-sm text-gray-500 mb-2 italic">
            例句: 「{{ currentGrammar.example_sentence }}」
          </view>
          <view v-if="currentGrammar.related_token_ids && currentGrammar.related_token_ids.length > 0" class="text-sm text-gray-500">
            相关词: {{ currentGrammar.related_token_ids.join(', ') }}
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
            v-if="currentGrammar.master_status !== 'mastered'"
            type="success"
            size="small"
            block
            @click="updateStatus(currentGrammar, 'mastered')"
          >
            标记为已掌握
          </wd-button>
          <wd-button
            v-if="currentGrammar.master_status !== 'learning'"
            type="primary"
            size="small"
            block
            @click="updateStatus(currentGrammar, 'learning')"
          >
            标记为学习中
          </wd-button>
          <wd-button
            v-if="currentGrammar.master_status !== 'unmastered'"
            size="small"
            block
            @click="updateStatus(currentGrammar, 'unmastered')"
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
            @click="handleRemove(currentGrammar)"
          >
            删除语法
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <wd-toast />
  </view>
</template>

<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { getGrammarBook, getGrammarBookStats, updateGrammarStatus, removeGrammar, updateGrammarNote } from '@/api/grammarbook'
import { useUserStore } from '@/store/user'
import { useToast } from 'wot-design-uni'

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
  note?: string
  related_token_ids?: number[]
  song_name?: string
  singer?: string
  example_sentence?: string
}

const userStore = useUserStore()
const toast = useToast()
const loading = ref(true)
const error = ref('')
const grammars = ref<Grammar[]>([])
const stats = ref<any>(null)
const currentTab = ref('all')
const offset = ref(0)
const limit = 20
const hasMore = ref(true)
const showDetail = ref(false)
const currentGrammar = ref<Grammar | null>(null)
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

function switchTab() {
  loadGrammars(true)
}

function openGrammarDetail(grammar: Grammar) {
  currentGrammar.value = grammar
  noteText.value = grammar.note || ''
  showDetail.value = true
}

async function updateStatus(grammar: Grammar, status: 'unmastered' | 'learning' | 'mastered') {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    toast.show('请先登录')
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
    toast.show('更新成功')
  } catch (e: any) {
    toast.show(e?.message || '更新失败')
  }
}

async function saveNote() {
  if (!currentGrammar.value) return
  
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    toast.show('请先登录')
    return
  }
  
  try {
    await updateGrammarNote({
      user_id: userId,
      grammar_book_id: currentGrammar.value.grammar_book_id,
      note: noteText.value,
    })
    currentGrammar.value.note = noteText.value
    toast.show('笔记保存成功')
  } catch (e: any) {
    toast.show(e?.message || '保存失败')
  }
}

async function handleRemove(grammar: Grammar) {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    toast.show('请先登录')
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
  loadGrammars(false)
}

onLoad(() => {
  loadStats()
  loadGrammars(true)
})
</script>
