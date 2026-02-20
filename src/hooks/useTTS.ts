import { ref } from 'vue'
import { getTTSUrl } from '@/api/tts'

const playingWord = ref('')

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

  async function playWord(word: string) {
    if (!word) return

    // Toggle off if same word
    if (playingWord.value === word) {
      destroyCtx()
      playingWord.value = ''
      return
    }

    try {
      const res: any = await getTTSUrl(word)
      const url = res?.url
      if (!url) return

      // Destroy previous context and create fresh one each time
      destroyCtx()
      playingWord.value = word

      audioCtx = uni.createInnerAudioContext()
      audioCtx.src = url
      audioCtx.onCanplay(() => {
        audioCtx?.play()
      })
      audioCtx.onEnded(() => {
        playingWord.value = ''
      })
      audioCtx.onError(() => {
        playingWord.value = ''
      })
      // Also try play directly (works on some platforms without waiting for canplay)
      audioCtx.play()
    } catch {
      playingWord.value = ''
    }
  }

  return { playWord, playingWord }
}
