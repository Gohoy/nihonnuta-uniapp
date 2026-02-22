<script lang="ts" setup>
import { getAdminSuggestions, reviewAdminSuggestion } from '@/api/admin'

definePage({
  style: {
    navigationBarTitleText: '歌词建议',
  },
})

const suggestions = ref<any[]>([])
const total = ref(0)
const statusFilter = ref('pending')
const loading = ref(false)
const offset = ref(0)
const limit = 20

async function loadSuggestions(reset = false) {
  if (reset) offset.value = 0
  loading.value = true
  try {
    const res: any = await getAdminSuggestions({
      status: statusFilter.value,
      offset: offset.value,
      limit,
    })
    suggestions.value = reset ? res.suggestions : [...suggestions.value, ...res.suggestions]
    total.value = res.total
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleReview(item: any, status: 'approved' | 'rejected') {
  try {
    await reviewAdminSuggestion(item.suggestion_id, status)
    item.status = status
    uni.showToast({ title: status === 'approved' ? '已通过' : '已拒绝', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

function loadMore() {
  if (suggestions.value.length >= total.value) return
  offset.value += limit
  loadSuggestions()
}

onMounted(() => loadSuggestions(true))
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view class="flex gap-2 mb-4">
      <view
        v-for="s in ['pending', 'approved', 'rejected']"
        :key="s"
        class="px-3 py-1 rounded text-xs"
        :class="statusFilter === s ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'"
        @click="statusFilter = s; loadSuggestions(true)"
      >
        {{ s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝' }}
      </view>
    </view>

    <view class="text-xs text-gray-400 mb-2">共 {{ total }} 条</view>

    <view
      v-for="item in suggestions"
      :key="item.suggestion_id"
      class="bg-white rounded-lg px-4 py-3 mb-2"
    >
      <view class="text-xs text-gray-400 mb-1">
        {{ item.song_name }} - {{ item.singer }}
      </view>
      <view class="text-sm text-gray-700 mb-1">
        <text class="text-gray-400">{{ item.field }}:</text>
        <text class="line-through text-red-400 mx-1">{{ item.old_value }}</text>
        →
        <text class="text-green-600 ml-1">{{ item.new_value }}</text>
      </view>
      <view v-if="item.reason" class="text-xs text-gray-400 mb-2">
        原因: {{ item.reason }}
      </view>
      <view v-if="item.status === 'pending'" class="flex gap-2 mt-2">
        <view
          class="px-3 py-1 bg-green-50 text-green-600 rounded text-xs"
          @click="handleReview(item, 'approved')"
        >
          通过
        </view>
        <view
          class="px-3 py-1 bg-red-50 text-red-500 rounded text-xs"
          @click="handleReview(item, 'rejected')"
        >
          拒绝
        </view>
      </view>
      <view v-else class="text-xs mt-1" :class="item.status === 'approved' ? 'text-green-500' : 'text-red-400'">
        {{ item.status === 'approved' ? '已通过' : '已拒绝' }}
      </view>
    </view>

    <view v-if="suggestions.length < total" class="text-center py-3 text-sm text-blue-500" @click="loadMore">
      加载更多
    </view>
    <view v-if="loading" class="text-center py-3 text-sm text-gray-400">加载中...</view>
    <view v-if="!loading && suggestions.length === 0" class="text-center py-10 text-sm text-gray-400">
      暂无数据
    </view>
  </view>
</template>
