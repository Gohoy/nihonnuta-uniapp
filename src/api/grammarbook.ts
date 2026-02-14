import { http } from '@/http/http'

/**
 * 添加语法到语法本
 */
export function addGrammarToBook(payload: {
  user_id: string | number
  song_id: string
  line_num: number
  grammar_id: number
  related_token_ids?: number[]
  grammar_type?: string
  grammar_relation?: string
  structure_desc?: string
  grammar_desc?: string
}) {
  return http.post('/grammarbook', payload)
}

/**
 * 获取语法本
 */
export function getGrammarBook(userId: string | number, options?: {
  master_status?: 'unmastered' | 'learning' | 'mastered'
  limit?: number
  offset?: number
}) {
  return http.get('/grammarbook', {
    user_id: userId,
    ...options,
  })
}

/**
 * 更新语法掌握状态
 */
export function updateGrammarStatus(payload: {
  user_id: string | number
  grammar_book_id: number
  master_status: 'unmastered' | 'learning' | 'mastered'
}) {
  return http.put('/grammarbook/status', payload)
}

/**
 * 删除语法
 */
export function removeGrammar(grammarBookId: number, userId: string | number) {
  return http.delete(`/grammarbook/${grammarBookId}`, { user_id: userId })
}

/**
 * 更新语法笔记
 */
export function updateGrammarNote(payload: {
  user_id: string | number
  grammar_book_id: number
  note: string
}) {
  return http.put('/grammarbook/note', payload)
}

/**
 * 获取语法本统计
 */
export function getGrammarBookStats(userId: string | number) {
  return http.get('/grammarbook/stats', { user_id: userId })
}

