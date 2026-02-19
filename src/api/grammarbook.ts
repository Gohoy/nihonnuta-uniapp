import { http } from '@/http/http'

/** 添加语法到语法本 */
export function addGrammarToBook(payload: {
  song_id: string
  line_num: number
  grammar_id: number
  related_token_ids?: number[]
  grammar_type?: string
  grammar_relation?: string
  structure_desc?: string
  grammar_desc?: string
  example_sentence?: string
}) {
  return http.post('/grammarbook', payload)
}

/** 获取语法本 */
export function getGrammarBook(options?: {
  master_status?: 'unmastered' | 'learning' | 'mastered'
  limit?: number
  offset?: number
}) {
  return http.get('/grammarbook', options)
}

/** 更新语法掌握状态 */
export function updateGrammarStatus(payload: {
  grammar_book_id: number
  master_status: 'unmastered' | 'learning' | 'mastered'
}) {
  return http.put('/grammarbook/status', payload)
}

/** 删除语法 */
export function removeGrammar(grammarBookId: number) {
  return http.delete(`/grammarbook/${grammarBookId}`)
}

/** 更新语法笔记 */
export function updateGrammarNote(payload: {
  grammar_book_id: number
  note: string
}) {
  return http.put('/grammarbook/note', payload)
}

/** 获取语法本统计 */
export function getGrammarBookStats() {
  return http.get('/grammarbook/stats')
}
