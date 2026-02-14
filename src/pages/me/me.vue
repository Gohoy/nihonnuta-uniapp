<script lang="ts" setup>
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { computed } from 'vue'

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()

const isLoggedIn = computed(() => tokenStore.updateNowTime().hasLogin)
const userInfo = computed(() => userStore.userInfo)

async function handleLogin() {
  try {
    await tokenStore.wxLogin()
  }
  catch (e) {
    console.error('登录失败:', e)
  }
}

async function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await tokenStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'none' })
      }
    },
  })
}
</script>

<template>
  <view class="me-page p-4">
    <!-- 用户信息区域 -->
    <view class="user-card bg-white rounded-xl p-4 flex items-center" @click="!isLoggedIn && handleLogin()">
      <image
        class="avatar w-16 h-16 rounded-full mr-4"
        :src="userInfo.avatar || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="flex-1">
        <text v-if="isLoggedIn" class="text-lg font-bold block">{{ userInfo.nickname || userInfo.username }}</text>
        <text v-else class="text-lg text-gray-400 block">点击登录</text>
        <text v-if="isLoggedIn" class="text-sm text-gray-500 mt-1 block">等级: {{ userInfo.level || 'N5' }}</text>
      </view>
    </view>

    <!-- 学习统计 -->
    <view v-if="isLoggedIn" class="stats-card bg-white rounded-xl p-4 mt-4 flex justify-around">
      <view class="text-center">
        <text class="text-xl font-bold block">{{ userInfo.totalLearnWords || 0 }}</text>
        <text class="text-xs text-gray-500 mt-1 block">学习词数</text>
      </view>
      <view class="text-center">
        <text class="text-xl font-bold block">{{ userInfo.totalLearnTime || 0 }}</text>
        <text class="text-xs text-gray-500 mt-1 block">学习时长(分)</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="isLoggedIn" class="mt-8">
      <button class="w-full bg-red-50 text-red-500 rounded-xl py-3" @click="handleLogout">
        退出登录
      </button>
    </view>
  </view>
</template>
