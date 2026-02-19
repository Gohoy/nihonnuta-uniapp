<script lang="ts" setup>
import { useTokenStore, useUserStore } from '@/store'
import { register as registerApi } from '@/api/login'

definePage({
  style: {
    navigationBarTitleText: '登录',
  },
})

const tokenStore = useTokenStore()
const loading = ref(false)
const loginForm = ref({ username: '', password: '' })
const isRegister = ref(false)

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await tokenStore.login(loginForm.value)
    uni.switchTab({ url: '/pages/index/index' })
  } catch {
    // tokenStore.login already shows toast
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!loginForm.value.username || !loginForm.value.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  if (loginForm.value.password.length < 6) {
    uni.showToast({ title: '密码长度不能少于6位', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await registerApi(loginForm.value)
    uni.showToast({ title: '注册成功', icon: 'success' })
    // Auto login after register
    await tokenStore.login(loginForm.value)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '注册失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// #ifdef MP-WEIXIN
async function handleWxLogin() {
  loading.value = true
  try {
    await tokenStore.wxLogin()
    uni.switchTab({ url: '/pages/index/index' })
  } catch {
    // tokenStore.wxLogin already shows toast
  } finally {
    loading.value = false
  }
}
// #endif
</script>

<template>
  <view class="min-h-screen bg-gray-50 flex flex-col items-center pt-24 px-8">
    <view class="text-center mb-12">
      <view class="text-3xl font-bold text-gray-800">Nihonnuta</view>
      <view class="text-sm text-gray-500 mt-2">日语歌曲学习助手</view>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="w-full max-w-sm">
      <view
        class="w-full bg-green-500 text-white text-center rounded-lg py-3 text-base"
        :class="loading ? 'opacity-50' : ''"
        @click="handleWxLogin"
      >
        {{ loading ? '登录中...' : '微信一键登录' }}
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifdef H5 -->
    <view class="w-full max-w-sm flex flex-col gap-4">
      <input
        v-model="loginForm.username"
        class="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-sm"
        placeholder="用户名"
        type="text"
      />
      <input
        v-model="loginForm.password"
        class="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white text-sm"
        placeholder="密码"
        :type="'password'"
        @confirm="isRegister ? handleRegister() : handleLogin()"
      />
      <view
        v-if="!isRegister"
        class="w-full bg-blue-500 text-white text-center rounded-lg py-3 text-base"
        :class="loading ? 'opacity-50' : ''"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '登录' }}
      </view>
      <view
        v-else
        class="w-full bg-green-500 text-white text-center rounded-lg py-3 text-base"
        :class="loading ? 'opacity-50' : ''"
        @click="handleRegister"
      >
        {{ loading ? '注册中...' : '注册' }}
      </view>
      <view class="text-center text-sm text-blue-500 mt-2" @click="isRegister = !isRegister">
        {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>
