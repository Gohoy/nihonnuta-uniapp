<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { getSongSuggestions, reviewSuggestion } from '@/api/suggestions'

definePage({
  style: {
    navigationBarTitleText: '修改建议',
  },
})

interface Suggestion {
  id: number
  song_id: string
  line_index: number
  field: string
  token_text: string
  old_value: string
  new_value: string
  reason: string
  status: string
  submitted_by_name: string
  created_at: string
}

const songId = ref('')
const suggestions = ref<Suggestion[]>([])
const loading = ref(true)

const fieldLabels: Record<string, string> = {
  original: '日文原文',
  translate: '中文翻译',
  roma: '罗马音',
  kana: '读音',
  audio: '音频',
}

async function loadSuggestions() {
  if (!songId.value) return
  loading.value = true
  try {
    const res: any = await getSongSuggestions(songId.value)
    suggestions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

async function handleReview(id: number, status: 'approved' | 'rejected') {
  try {
    await reviewSuggestion(id, status)
    uni.showToast({
      title: status === 'approved' ? '已通过' : '已拒绝',
      icon: 'success',
    })
    suggestions.value = suggestions.value.filter(s => s.id !== id)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

onLoad((options) => {
  songId.value = (options?.songId as string) || ''
  loadSuggestions()
})
</script>

<template>
  <view class="p-4">
    <template v-if="loading">
      <view class="py-6 text-center text-gray-500">加载中...</view>
    </template>
    <template v-else-if="suggestions.length === 0">
      <view class="py-6 text-center text-gray-500">暂无待审核的修改建议</view>
    </template>
    <template v-else>
      <view
        v-for="item in suggestions"
        :key="item.id"
        class="mb-4 p-3 rounded-lg bg-gray-50"
      >
        <view class="flex items-center justify-between mb-2">
          <text class="text-sm font-bold">{{ item.field === 'audio' ? '音频' : `第${item.line_index + 1}行 · ${fieldLabels[item.field] || item.field}` }}{{ item.token_text ? ` (${item.token_text})` : '' }}</text>
          <text class="text-xs text-gray-400">{{ item.submitted_by_name }}</text>
        </view>
        <template v-if="item.field === 'audio'">
          <view class="mb-1 text-sm text-gray-600">上传了新的音频文件</view>
        </template>
        <template v-else>
          <view class="mb-1">
            <text class="text-xs text-gray-400">原文: </text>
            <text class="text-sm text-gray-500 line-through">{{ item.old_value }}</text>
          </view>
          <view class="mb-1">
            <text class="text-xs text-gray-400">修改为: </text>
            <text class="text-sm text-green-600">{{ item.new_value }}</text>
          </view>
        </template>
        <view v-if="item.reason" class="mb-2">
          <text class="text-xs text-gray-400">原因: {{ item.reason }}</text>
        </view>
        <view class="flex gap-2 mt-2">
          <wd-button size="small" type="success" @click="handleReview(item.id, 'approved')">通过</wd-button>
          <wd-button size="small" type="error" @click="handleReview(item.id, 'rejected')">拒绝</wd-button>
        </view>
      </view>
    </template>
  </view>
</template>
