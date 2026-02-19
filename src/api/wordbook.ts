import { http } from '@/http/http'

/** 添加单词到单词本 */
export function addWordToBook(payload: {
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

/** 获取单词本 */
export function getWordbook(options?: {
  master_status?: 'unmastered' | 'learning' | 'mastered'
  limit?: number
  offset?: number
}) {
  return http.get('/wordbook', options)
}

/** 更新单词掌握状态 */
export function updateWordStatus(payload: {
  word_book_id: number
  master_status: 'unmastered' | 'learning' | 'mastered'
}) {
  return http.put('/wordbook/status', payload)
}

/** 删除单词 */
export function removeWord(wordBookId: number) {
  return http.delete(`/wordbook/${wordBookId}`)
}

/** 更新单词笔记 */
export function updateWordNote(payload: {
  word_book_id: number
  note: string
}) {
  return http.put('/wordbook/note', payload)
}

/** 获取单词本统计 */
export function getWordbookStats() {
  return http.get('/wordbook/stats')
}
