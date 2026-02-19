import { http } from '@/http/http'

/**
 * 添加单词到单词本
 */
export function addWordToBook(payload: {
  user_id: string | number
  song_id: string
  line_num: number
  token_id: number
  word: string
  kana?: string
  pos?: string
  meaning?: string
  example_sentence?: string
}) {
  return http.post('/wordbook', payload)
}

/**
 * 获取单词本
 */
export function getWordbook(userId: string | number, options?: {
  master_status?: 'unmastered' | 'learning' | 'mastered'
  limit?: number
  offset?: number
}) {
  return http.get('/wordbook', {
    user_id: userId,
    ...options,
  })
}

/**
 * 更新单词掌握状态
 */
export function updateWordStatus(payload: {
  user_id: string | number
  word_book_id: number
  master_status: 'unmastered' | 'learning' | 'mastered'
}) {
  return http.put('/wordbook/status', payload)
}

/**
 * 删除单词
 */
export function removeWord(wordBookId: number, userId: string | number) {
  return http.delete(`/wordbook/${wordBookId}`, { user_id: userId })
}

/**
 * 更新单词笔记
 */
export function updateWordNote(payload: {
  user_id: string | number
  word_book_id: number
  note: string
}) {
  return http.put('/wordbook/note', payload)
}

/**
 * 获取单词本统计
 */
export function getWordbookStats(userId: string | number) {
  return http.get('/wordbook/stats', { user_id: userId })
}

