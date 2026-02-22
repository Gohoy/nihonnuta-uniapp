import { ref } from 'vue'
import { getTTSUrl } from '@/api/tts'

const playingWord = ref('')
const loadingWord = ref('')

// H5 platform: use native Audio API (more reliable, avoids uni-app wrapper issues)
function playWithHtmlAudio(url: string, onEnded: () => void, onError: () => void): any {
  const audio = new Audio(url)
  audio.onended = onEnded
  audio.onerror = onError
  audio.play().catch(onError)
  return {
    stop() { audio.pause(); audio.currentTime = 0 },
    destroy() { audio.src = '' },
  }
}

export function useTTS() {
  let audioCtx: any = null

  function destroyCtx() {
    if (audioCtx) {
      try {
        audioCtx.stop()
        audioCtx.destroy()
      } catch {}
      audioCtx = null
    }
  }

  async function playWord(word: string, kana?: string) {
    if (!word) return

    // Toggle off if same word
    if (playingWord.value === word) {
      destroyCtx()
      playingWord.value = ''
      return
    }

    try {
      loadingWord.value = word
      // Use kana for TTS to avoid kanji multi-reading issues
      const ttsText = kana || word
      const res: any = await getTTSUrl(ttsText)
      const url = res?.url
      if (!url) { loadingWord.value = ''; return }

      destroyCtx()
      loadingWord.value = ''
      playingWord.value = word

      const onEnded = () => { playingWord.value = '' }
      const onError = () => { playingWord.value = '' }

      // #ifdef H5
      audioCtx = playWithHtmlAudio(url, onEnded, onError)
      // #endif

      // #ifndef H5
      audioCtx = uni.createInnerAudioContext()
      audioCtx.autoplay = true
      audioCtx.onEnded(onEnded)
      audioCtx.onError(onError)
      audioCtx.src = url
      // #endif
    } catch {
      loadingWord.value = ''
      playingWord.value = ''
    }
  }

  return { playWord, playingWord, loadingWord }
}
