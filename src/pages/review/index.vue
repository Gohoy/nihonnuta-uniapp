<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { getDueWords, submitWordReview, getDueGrammars, submitGrammarReview } from '@/api/review'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '复习',
  },
})

const userStore = useUserStore()
const reviewType = ref<'word' | 'grammar'>('word')
const items = ref<any[]>([])
const currentIndex = ref(0)
const flipped = ref(false)
const loading = ref(true)
const finished = ref(false)
const results = ref<number[]>([]) // quality values for each card

const currentItem = computed(() => items.value[currentIndex.value] || null)
const progress = computed(() => `${currentIndex.value + 1} / ${items.value.length}`)

// Review result stats
const againCount = computed(() => results.value.filter(r => r === 0).length)
const hardCount = computed(() => results.value.filter(r => r === 1).length)
const goodCount = computed(() => results.value.filter(r => r === 2).length)
const easyCount = computed(() => results.value.filter(r => r === 3).length)

async function loadItems() {
  const userId = userStore.userInfo?.userId
  if (!userId || userId === -1) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    if (reviewType.value === 'word') {
      const res: any = await getDueWords(userId)
      items.value = res.words || []
    } else {
      const res: any = await getDueGrammars(userId)
      items.value = res.grammars || []
    }
    if (items.value.length === 0) {
      finished.value = true
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function flipCard() {
  flipped.value = !flipped.value
}

async function submitAnswer(quality: number) {
  const userId = userStore.userInfo?.userId
  if (!userId || !currentItem.value) return

  try {
    if (reviewType.value === 'word') {
      await submitWordReview({
        user_id: userId,
        word_book_id: currentItem.value.word_book_id,
        quality,
      })
    } else {
      await submitGrammarReview({
        user_id: userId,
        grammar_book_id: currentItem.value.grammar_book_id,
        quality,
      })
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' })
  }

  results.value.push(quality)
  flipped.value = false

  if (currentIndex.value < items.value.length - 1) {
    currentIndex.value++
  } else {
    finished.value = true
  }
}

function goBack() {
  uni.navigateBack()
}

onLoad((options) => {
  const type = options?.type as string
  if (type === 'grammar') reviewType.value = 'grammar'
  loadItems()
})
</script>

<template>
  <view class="review-page min-h-screen bg-gray-50 p-4">
    <!-- Loading -->
    <view v-if="loading" class="py-20 text-center text-gray-500">加载中...</view>

    <!-- Finished -->
    <view v-else-if="finished && results.length > 0" class="py-10">
      <view class="text-center mb-6">
        <view class="text-2xl font-bold text-gray-800 mb-2">复习完成</view>
        <view class="text-gray-500">本次复习 {{ results.length }} 个{{ reviewType === 'word' ? '单词' : '语法' }}</view>
      </view>
      <view class="bg-white rounded-lg p-4 mb-6">
        <view class="grid grid-cols-4 gap-3 text-center">
          <view>
            <view class="text-2xl font-bold text-red-500">{{ againCount }}</view>
            <view class="text-xs text-gray-500 mt-1">Again</view>
          </view>
          <view>
            <view class="text-2xl font-bold text-orange-500">{{ hardCount }}</view>
            <view class="text-xs text-gray-500 mt-1">Hard</view>
          </view>
          <view>
            <view class="text-2xl font-bold text-green-500">{{ goodCount }}</view>
            <view class="text-xs text-gray-500 mt-1">Good</view>
          </view>
          <view>
            <view class="text-2xl font-bold text-blue-500">{{ easyCount }}</view>
            <view class="text-xs text-gray-500 mt-1">Easy</view>
          </view>
        </view>
      </view>
      <wd-button type="primary" block @click="goBack">返回</wd-button>
    </view>

    <!-- Empty queue -->
    <view v-else-if="finished && results.length === 0" class="py-20 text-center">
      <view class="text-xl text-gray-600 mb-2">暂无待复习内容</view>
      <view class="text-gray-400 mb-6">所有{{ reviewType === 'word' ? '单词' : '语法' }}都已复习完毕</view>
      <wd-button type="primary" plain @click="goBack">返回</wd-button>
    </view>

    <!-- Review card -->
    <view v-else-if="currentItem" class="review-content">
      <!-- Progress -->
      <view class="text-center text-sm text-gray-500 mb-4">{{ progress }}</view>

      <!-- Card -->
      <view class="card-container mb-6" @click="flipCard">
        <!-- Front -->
        <view v-if="!flipped" class="card-face bg-white rounded-xl p-6 shadow-sm min-h-[280px] flex flex-col items-center justify-center">
          <template v-if="reviewType === 'word'">
            <view class="text-3xl font-bold text-gray-800 mb-3">{{ currentItem.word }}</view>
            <view class="text-lg text-gray-500 mb-2">{{ currentItem.kana }}</view>
            <view v-if="currentItem.pos" class="text-sm text-gray-400">({{ currentItem.pos }})</view>
          </template>
          <template v-else>
            <view class="text-xl font-bold text-gray-800 mb-3">{{ currentItem.structure_desc }}</view>
            <view class="text-base text-gray-500 mb-2">{{ currentItem.grammar_type }}</view>
            <view class="text-sm text-gray-400">{{ currentItem.grammar_relation }}</view>
          </template>
          <view class="mt-6 text-xs text-gray-300">点击翻转查看答案</view>
        </view>

        <!-- Back -->
        <view v-else class="card-face bg-white rounded-xl p-6 shadow-sm min-h-[280px] flex flex-col justify-center">
          <template v-if="reviewType === 'word'">
            <view class="text-2xl font-bold text-gray-800 mb-2 text-center">{{ currentItem.word }}</view>
            <view class="text-base text-gray-500 mb-4 text-center">{{ currentItem.kana }}</view>
            <view class="border-t border-gray-100 pt-4 mb-3">
              <view class="text-sm text-gray-500 mb-1">释义</view>
              <view class="text-base text-gray-800">{{ currentItem.meaning || '暂无释义' }}</view>
            </view>
            <view v-if="currentItem.song_name" class="mb-3">
              <view class="text-sm text-gray-500 mb-1">来源</view>
              <view class="text-sm text-gray-600">{{ currentItem.song_name }} - {{ currentItem.singer }}</view>
            </view>
            <view v-if="currentItem.note" class="mb-3">
              <view class="text-sm text-gray-500 mb-1">笔记</view>
              <view class="text-sm text-gray-600">{{ currentItem.note }}</view>
            </view>
          </template>
          <template v-else>
            <view class="text-lg font-bold text-gray-800 mb-2 text-center">{{ currentItem.structure_desc }}</view>
            <view class="border-t border-gray-100 pt-4 mb-3">
              <view class="text-sm text-gray-500 mb-1">语法说明</view>
              <view class="text-base text-gray-800">{{ currentItem.grammar_desc || '暂无说明' }}</view>
            </view>
            <view v-if="currentItem.song_name" class="mb-3">
              <view class="text-sm text-gray-500 mb-1">来源</view>
              <view class="text-sm text-gray-600">{{ currentItem.song_name }} - {{ currentItem.singer }}</view>
            </view>
            <view v-if="currentItem.note" class="mb-3">
              <view class="text-sm text-gray-500 mb-1">笔记</view>
              <view class="text-sm text-gray-600">{{ currentItem.note }}</view>
            </view>
          </template>
        </view>
      </view>

      <!-- Answer buttons (only show when flipped) -->
      <view v-if="flipped" class="grid grid-cols-4 gap-2">
        <view class="review-btn bg-red-500 text-white rounded-lg py-3 text-center" @click="submitAnswer(0)">
          <view class="text-sm font-semibold">Again</view>
        </view>
        <view class="review-btn bg-orange-500 text-white rounded-lg py-3 text-center" @click="submitAnswer(1)">
          <view class="text-sm font-semibold">Hard</view>
        </view>
        <view class="review-btn bg-green-500 text-white rounded-lg py-3 text-center" @click="submitAnswer(2)">
          <view class="text-sm font-semibold">Good</view>
        </view>
        <view class="review-btn bg-blue-500 text-white rounded-lg py-3 text-center" @click="submitAnswer(3)">
          <view class="text-sm font-semibold">Easy</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.card-container {
  perspective: 1000px;
}
.card-face {
  transition: transform 0.3s ease, opacity 0.2s ease;
}
.review-btn {
  transition: opacity 0.2s;
}
.review-btn:active {
  opacity: 0.7;
}
</style>
