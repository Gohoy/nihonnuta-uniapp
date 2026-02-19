import { http } from '@/http/http'

/** 记录学习 */
export function recordLearning(songId: string) {
  return http.post('/learning/record', { song_id: songId })
}

/** 获取最近学习 */
export function getRecentLearned(limit = 10) {
  return http.get('/learning/recent', { limit })
}
