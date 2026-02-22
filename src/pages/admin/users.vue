<script lang="ts" setup>
import { getAdminUsers, updateUserRole } from '@/api/admin'

definePage({
  style: {
    navigationBarTitleText: '用户管理',
  },
})

const users = ref<any[]>([])
const total = ref(0)
const search = ref('')
const loading = ref(false)
const offset = ref(0)
const limit = 20

async function loadUsers(reset = false) {
  if (reset) offset.value = 0
  loading.value = true
  try {
    const res: any = await getAdminUsers({
      search: search.value || undefined,
      offset: offset.value,
      limit,
    })
    users.value = reset ? res.users : [...users.value, ...res.users]
    total.value = res.total
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(user: any) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    await updateUserRole(user.user_id, newRole)
    user.role = newRole
    uni.showToast({ title: '已更新', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' })
  }
}

function loadMore() {
  if (users.value.length >= total.value) return
  offset.value += limit
  loadUsers()
}

onMounted(() => loadUsers(true))
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view class="flex gap-2 mb-4">
      <input
        v-model="search"
        class="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm"
        placeholder="搜索用户名/昵称"
        @confirm="loadUsers(true)"
      />
      <view
        class="px-4 py-2 bg-blue-500 text-white rounded text-sm"
        @click="loadUsers(true)"
      >
        搜索
      </view>
    </view>

    <view class="text-xs text-gray-400 mb-2">共 {{ total }} 个用户</view>

    <view
      v-for="user in users"
      :key="user.user_id"
      class="bg-white rounded-lg px-4 py-3 mb-2 flex items-center justify-between"
    >
      <view>
        <view class="text-sm text-gray-800">
          {{ user.nickname || user.username }}
          <text class="text-xs text-gray-400 ml-1">{{ user.username }}</text>
        </view>
        <view class="text-xs text-gray-400 mt-1">
          {{ user.level || 'N5' }}
          · {{ user.membership_type === 'premium' ? '会员' : '免费' }}
          · {{ user.role || 'user' }}
        </view>
      </view>
      <view
        class="px-3 py-1 rounded text-xs"
        :class="user.role === 'admin'
          ? 'bg-red-50 text-red-500 border border-red-200'
          : 'bg-blue-50 text-blue-500 border border-blue-200'"
        @click="handleRoleChange(user)"
      >
        {{ user.role === 'admin' ? '取消管理员' : '设为管理员' }}
      </view>
    </view>

    <view
      v-if="users.length < total"
      class="text-center py-3 text-sm text-blue-500"
      @click="loadMore"
    >
      加载更多
    </view>
    <view v-if="loading" class="text-center py-3 text-sm text-gray-400">
      加载中...
    </view>
  </view>
</template>
