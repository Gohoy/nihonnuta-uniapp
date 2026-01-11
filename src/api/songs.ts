import { http } from '@/http/http'

/**
 * 获取歌词（仅 LRC 格式）
 */
export function getLyricById(id: string) {
  return http.get('/songs/lyric', { id })
}
/**
 * 更新歌曲状态
 */
export function updateSongStatus(songId: string, status: 'draft' | 'reviewing' | 'published' | 'unpublished') {
  return http.post('/songs/status', { songId, status })
}

/**
 * 删除歌曲
 */
export function deleteSong(songId: string) {
  return http.delete('/songs', { songId })
}

/**
 * 搜索歌曲
 */
export function searchSongs(keyword: string, page = 1, pageSize = 20) {
  return http.get('/songs/search', { keyword, page, pageSize })
}
