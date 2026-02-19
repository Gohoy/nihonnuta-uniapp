<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { useTokenStore, useUserStore } from '@/store'
import { updateUserLevel } from '@/api/login'

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()
const isLoggedIn = ref(false)

function checkLogin() {
  isLoggedIn.value = tokenStore.updateNowTime().hasLogin
}

onShow(() => {
  checkLogin()
})
checkLogin()

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

async function handleLogout() {
  await tokenStore.logout()
  checkLogin()
  uni.showToast({ title: '已退出登录', icon: 'success' })
}

async function handleLevelChange(level: string) {
  try {
    await updateUserLevel(level)
    userStore.setUserLevel(level)
    uni.showToast({ title: '等级已更新', icon: 'success' })
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}
</script>

<template>
  <view class="min-h-screen bg-gray-50">
    <!-- 已登录 -->
    <view v-if="isLoggedIn" class="p-6">
      <view class="bg-white rounded-lg p-6 flex flex-col items-center">
        <image
          :src="userStore.userInfo.avatar || '/static/images/default-avatar.png'"
          class="w-20 h-20 rounded-full"
          mode="aspectFill"
        />
        <view class="mt-3 text-lg font-bold text-gray-800">
          {{ userStore.userInfo.nickname || userStore.userInfo.username }}
        </view>
        <view class="mt-1 text-sm text-gray-400">
          {{ userStore.userInfo.username }}
        </view>
      </view>

      <!-- JLPT Level Setting -->
      <view class="mt-4 bg-white rounded-lg px-4 py-3">
        <view class="text-sm text-gray-500 mb-2">JLPT 等级</view>
        <view class="flex gap-2">
          <view
            v-for="lvl in ['N5', 'N4', 'N3', 'N2', 'N1']"
            :key="lvl"
            class="px-3 py-1.5 rounded text-sm"
            :class="userStore.userInfo.level === lvl
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600'"
            @click="handleLevelChange(lvl)"
          >
            {{ lvl }}
          </view>
        </view>
      </view>

      <view class="mt-6">
        <view
          class="bg-white rounded-lg px-4 py-3 text-center text-red-500 text-sm"
          @click="handleLogout"
        >
          退出登录
        </view>
      </view>
    </view>

    <!-- 未登录 -->
    <view v-else class="flex flex-col items-center pt-24 px-8">
      <view class="text-gray-400 text-sm mb-6">登录后可同步学习记录</view>
      <view
        class="bg-blue-500 text-white rounded-lg px-8 py-3 text-sm"
        @click="goLogin"
      >
        去登录
      </view>
    </view>

    <!-- 底部留白 -->
    <view class="h-24" />
  </view>
</template>
