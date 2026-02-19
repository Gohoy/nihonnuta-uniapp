import { http } from '@/http/http'

/** 获取待复习单词 */
export function getDueWords(limit = 20) {
  return http.get('/wordbook/review', { limit })
}

/** 提交单词复习结果 */
export function submitWordReview(payload: {
  word_book_id: number
  quality: number // 0=Again, 1=Hard, 2=Good, 3=Easy
}) {
  return http.post('/wordbook/review', payload)
}

/** 获取待复习语法 */
export function getDueGrammars(limit = 20) {
  return http.get('/grammarbook/review', { limit })
}

/** 提交语法复习结果 */
export function submitGrammarReview(payload: {
  grammar_book_id: number
  quality: number
}) {
  return http.post('/grammarbook/review', payload)
}
