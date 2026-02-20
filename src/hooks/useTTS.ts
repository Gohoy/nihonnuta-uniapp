import { ref } from 'vue'
import { getTTSUrl } from '@/api/tts'

let audioCtx: any = null
const playingWord = ref('')

export function useTTS() {
  async function playWord(word: string) {
    if (!word) return

    // Toggle off if same word
    if (playingWord.value === word && audioCtx) {
      audioCtx.stop()
      playingWord.value = ''
      return
    }

    try {
      const res: any = await getTTSUrl(word)
      if (!audioCtx) {
        audioCtx = uni.createInnerAudioContext()
        audioCtx.onEnded(() => { playingWord.value = '' })
        audioCtx.onError(() => { playingWord.value = '' })
      }
      audioCtx.stop()
      audioCtx.src = res.url
      audioCtx.play()
      playingWord.value = word
    } catch {
      playingWord.value = ''
    }
  }

  return { playWord, playingWord }
}
