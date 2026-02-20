import { http } from '@/http/http'

export function getTTSUrl(word: string) {
  return http.get<{ url: string }>('/tts', { word })
}
