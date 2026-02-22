<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { useTokenStore, useUserStore } from '@/store'
import { updateUserLevel } from '@/api/login'
import { redeemCode } from '@/api/redemption'
import { authDebugLog } from '@/http/http'

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const tokenStore = useTokenStore()
const userStore = useUserStore()
const isLoggedIn = ref(false)
const debugInfo = ref('')
const redeemInput = ref('')
const redeeming = ref(false)

function checkLogin() {
  const store = tokenStore.updateNowTime()
  const hasLogin = store.hasLogin
  const token = store.tokenInfo
  const expireTime = uni.getStorageSync('accessTokenExpireTime')
  const persistedToken = uni.getStorageSync('token')
  debugInfo.value = `hasLogin=${hasLogin}, token=${!!((token as any)?.token)}, expire=${expireTime}, persisted=${!!persistedToken}, now=${Date.now()}\nlog: ${authDebugLog.join(' | ')}`
  isLoggedIn.value = hasLogin
}

const isPremium = computed(() => userStore.userInfo.membershipType === 'premium')
const membershipExpireText = computed(() => {
  const t = userStore.userInfo.membershipExpireTime
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

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

async function handleRedeem() {
  const code = redeemInput.value.trim()
  if (!code) {
    uni.showToast({ title: '请输入兑换码', icon: 'none' })
    return
  }
  if (redeeming.value) return
  redeeming.value = true
  try {
    const res: any = await redeemCode(code)
    // Refresh user info to get updated membership
    await userStore.fetchUserInfo()
    redeemInput.value = ''
    uni.showToast({ title: '兑换成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '兑换失败', icon: 'none' })
  } finally {
    redeeming.value = false
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

      <!-- Membership Status -->
      <view class="mt-4 bg-white rounded-lg px-4 py-3">
        <view class="text-sm text-gray-500 mb-2">会员状态</view>
        <view class="flex items-center gap-2 mb-3">
          <view
            class="px-3 py-1 rounded-full text-sm"
            :class="isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-500'"
          >
            {{ isPremium ? '会员' : '免费用户' }}
          </view>
          <view v-if="isPremium" class="text-xs text-gray-400">
            到期: {{ membershipExpireText }}
          </view>
        </view>
        <view class="flex gap-2">
          <input
            v-model="redeemInput"
            class="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
            placeholder="输入兑换码"
            maxlength="32"
          />
          <view
            class="px-4 py-2 bg-blue-500 text-white rounded text-sm flex-shrink-0"
            :class="redeeming ? 'opacity-50' : ''"
            @click="handleRedeem"
          >
            {{ redeeming ? '...' : '兑换' }}
          </view>
        </view>
      </view>

      <!-- Admin Entry -->
      <view
        v-if="userStore.userInfo?.isAdmin"
        class="mt-4 bg-white rounded-lg px-4 py-3 flex items-center justify-between"
        @click="uni.navigateTo({ url: '/pages/admin/index' })"
      >
        <view class="text-sm text-gray-700">管理后台</view>
        <view class="text-gray-400 text-xs">→</view>
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
    <!-- Debug -->
    <view class="p-2 text-xs text-gray-300 break-all">{{ debugInfo }}</view>
  </view>
</template>
