import { ref } from 'vue'
import { getTTSUrl } from '@/api/tts'

const playingWord = ref('')

export function useTTS() {
  let audioCtx: any = null

  function ensureAudioCtx() {
    if (audioCtx) return audioCtx
    audioCtx = uni.createInnerAudioContext()
    // #ifdef H5
    // H5 平台需要设置 obeyMuteSwitch 为 false
    try { audioCtx.obeyMuteSwitch = false } catch {}
    // #endif
    audioCtx.onEnded(() => { playingWord.value = '' })
    audioCtx.onError((err: any) => {
      console.error('TTS audio error:', err)
      playingWord.value = ''
    })
    return audioCtx
  }

  async function playWord(word: string) {
    if (!word) return

    const ctx = ensureAudioCtx()

    // Toggle off if same word
    if (playingWord.value === word) {
      ctx.stop()
      playingWord.value = ''
      return
    }

    try {
      const res: any = await getTTSUrl(word)
      const url = res?.url
      if (!url) {
        console.error('TTS: no url in response', res)
        return
      }

      // Stop previous playback
      ctx.stop()

      // Set new source and play via onCanplay
      playingWord.value = word
      ctx.src = ''
      // Use setTimeout to ensure src change is picked up
      setTimeout(() => {
        ctx.src = url
        ctx.play()
      }, 50)
    } catch (e) {
      console.error('TTS playWord error:', e)
      playingWord.value = ''
    }
  }

  return { playWord, playingWord }
}
