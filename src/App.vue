<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { navigateToInterceptor } from '@/router/interceptor'
import { useTokenStore } from '@/store/token'

onLaunch(async (options) => {
  console.log('App.vue onLaunch', options)
  const tokenStore = useTokenStore()
  // 如果没有有效 token，自动静默登录
  if (!tokenStore.updateNowTime().hasLogin) {
    try {
      await tokenStore.wxLogin()
      console.log('静默登录成功')
    }
    catch (e) {
      console.error('静默登录失败:', e)
    }
  }
})
onShow((options) => {
  console.log('App.vue onShow', options)
  // 处理直接进入页面路由的情况：如h5直接输入路由、微信小程序分享后进入等
  // https://github.com/unibest-tech/unibest/issues/192
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
</style>
