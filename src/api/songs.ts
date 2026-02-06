import { http } from '@/http/http'

/**
 * 获取歌曲列表（本地库）
 */
export function getSongsPage(offset = 0, limit = 10) {
  return http.get('/songs/page', { offset, limit })
}

/**
 * 搜索歌曲（本地库）
 */
export function searchLocalSongs(keywords: string, offset = 0, limit = 20) {
  return http.get('/songs/search', { keywords, offset, limit })
}

/**
 * 搜索网易云歌曲
 */
export function searchNeteaseSongs(keywords: string, offset = 0, limit = 20) {
  return http.get('/songs/netease/search', { keywords, offset, limit })
}

/**
 * 获取网易云歌词
 */
export function getNeteaseLyricById(id: string) {
  return http.get('/songs/netease/lyric', { id })
}
