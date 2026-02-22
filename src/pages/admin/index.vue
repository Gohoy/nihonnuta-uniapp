<script lang="ts" setup>
import { useUserStore } from '@/store'

definePage({
  style: {
    navigationBarTitleText: '管理后台',
  },
})

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.isAdmin === true)

const menus = [
  { title: '用户管理', desc: '查看用户、修改角色', url: '/pages/admin/users', icon: '👤' },
  { title: '歌曲管理', desc: '编辑歌曲信息、上下线', url: '/pages/admin/songs', icon: '🎵' },
  { title: '歌词建议', desc: '审批用户提交的修改', url: '/pages/admin/suggestions', icon: '📝' },
  { title: '兑换码', desc: '生成、查看、禁用', url: '/pages/admin/redemption', icon: '🎫' },
]

function goTo(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="min-h-screen bg-gray-50 p-4">
    <view v-if="!isAdmin" class="text-center pt-20 text-gray-400 text-sm">
      无权限访问
    </view>
    <view v-else>
      <view
        v-for="item in menus"
        :key="item.url"
        class="bg-white rounded-lg px-4 py-4 mb-3 flex items-center"
        @click="goTo(item.url)"
      >
        <view class="text-2xl mr-3">{{ item.icon }}</view>
        <view class="flex-1">
          <view class="text-sm font-medium text-gray-800">{{ item.title }}</view>
          <view class="text-xs text-gray-400 mt-0.5">{{ item.desc }}</view>
        </view>
        <view class="text-gray-300">→</view>
      </view>
    </view>
  </view>
</template>
