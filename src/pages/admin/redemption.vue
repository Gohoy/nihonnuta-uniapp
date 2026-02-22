<script lang="ts" setup>
import { generateCodes, listCodes, disableCode } from '@/api/admin'

definePage({
  style: {
    navigationBarTitleText: '兑换码管理',
  },
})

const codes = ref<any[]>([])
const loading = ref(false)
const statusFilter = ref('')
const offset = ref(0)
const limit = 50

// Generate form
const showGenerate = ref(false)
const genCount = ref(10)
const genDays = ref(30)
const genExpireDays = ref(0)
const generating = ref(false)

async function loadCodes(reset = false) {
  if (reset) offset.value = 0
  loading.value = true
  try {
    const res: any = await listCodes({
      status: statusFilter.value || undefined,
      offset: offset.value,
      limit,
    })
    codes.value = reset ? res.codes : [...codes.value, ...res.codes]
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
  if (generating.value) return
  generating.value = true
  try {
    const params: any = { count: genCount.value, duration_days: genDays.value }
    if (genExpireDays.value > 0) params.expire_days = genExpireDays.value
    await generateCodes(params)
    showGenerate.value = false
    uni.showToast({ title: '生成成功', icon: 'success' })
    loadCodes(true)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '生成失败', icon: 'none' })
  } finally {
    generating.value = false
  }
}

async function handleDisable(code: any) {
  try {
    await disableCode(code.code_id)
    code.status = 'disabled'
    uni.showToast({ title: '已禁用', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

function copyCode(code: string) {
  uni.setClipboardData({ data: code })
}

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

onMounted(() => loadCodes(true))
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view class="flex justify-between items-center mb-4">
      <view class="flex gap-2">
        <view
          v-for="s in ['', 'unused', 'used', 'disabled']"
          :key="s"
          class="px-3 py-1 rounded text-xs"
          :class="statusFilter === s ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'"
          @click="statusFilter = s; loadCodes(true)"
        >
          {{ s === '' ? '全部' : s === 'unused' ? '未使用' : s === 'used' ? '已使用' : '已禁用' }}
        </view>
      </view>
      <view
        class="px-3 py-1 bg-green-500 text-white rounded text-xs"
        @click="showGenerate = true"
      >
        生成
      </view>
    </view>

    <view
      v-for="code in codes"
      :key="code.code_id"
      class="bg-white rounded-lg px-4 py-3 mb-2"
    >
      <view class="flex items-center justify-between">
        <view class="flex-1 min-w-0">
          <view class="text-sm font-mono text-gray-800" @click="copyCode(code.code)">
            {{ code.code }}
          </view>
          <view class="text-xs text-gray-400 mt-0.5">
            {{ code.duration_days }}天
            · {{ code.status }}
            <text v-if="code.redeemed_by"> · 使用者: {{ code.redeemed_by }}</text>
            <text v-if="code.expire_time"> · 过期: {{ formatDate(code.expire_time) }}</text>
          </view>
        </view>
        <view
          v-if="code.status === 'unused'"
          class="px-2 py-1 bg-red-50 text-red-500 rounded text-xs ml-2"
          @click="handleDisable(code)"
        >
          禁用
        </view>
      </view>
    </view>

    <view v-if="loading" class="text-center py-3 text-sm text-gray-400">加载中...</view>
    <view v-if="!loading && codes.length === 0" class="text-center py-10 text-sm text-gray-400">
      暂无兑换码
    </view>

    <!-- Generate Popup -->
    <wd-popup v-model="showGenerate" position="bottom" custom-style="border-radius: 16px 16px 0 0; padding: 20px;">
      <view class="text-base font-medium mb-4">生成兑换码</view>
      <view class="mb-3">
        <view class="text-xs text-gray-500 mb-1">数量 (1-100)</view>
        <input v-model.number="genCount" type="number" class="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
      </view>
      <view class="mb-3">
        <view class="text-xs text-gray-500 mb-1">会员天数</view>
        <input v-model.number="genDays" type="number" class="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
      </view>
      <view class="mb-3">
        <view class="text-xs text-gray-500 mb-1">兑换码有效期（天，0=永不过期）</view>
        <input v-model.number="genExpireDays" type="number" class="border border-gray-200 rounded px-3 py-2 text-sm w-full" />
      </view>
      <view class="flex gap-3 mt-4">
        <view class="flex-1 text-center py-2 bg-gray-100 rounded text-sm" @click="showGenerate = false">取消</view>
        <view
          class="flex-1 text-center py-2 bg-green-500 text-white rounded text-sm"
          :class="generating ? 'opacity-50' : ''"
          @click="handleGenerate"
        >
          {{ generating ? '生成中...' : '确认生成' }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>
