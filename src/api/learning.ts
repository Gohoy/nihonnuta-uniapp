import { http } from '@/http/http'

/**
 * 记录学习
 */
export function recordLearning(userId: string | number, songId: string) {
  return http.post('/learning/record', { user_id: String(userId), song_id: songId })
}

/**
 * 获取最近学习
 */
export function getRecentLearned(userId: string | number, limit = 10) {
  return http.get('/learning/recent', { user_id: String(userId), limit })
}
