import { http } from '@/http/http'

/**
 * 获取歌曲列表（本地库）
 */
export function getSongsPage(offset = 0, limit = 10) {
  return http.get('/songs/page', { offset, limit })
}

/**
 * 获取热门歌曲
 */
export function getPopularSongs(limit = 10) {
  return http.get('/songs/popular', { limit })
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

/**
 * 获取本地歌曲处理后的歌词
 */
export function getProcessedSongById(id: string, userId?: string | number) {
  return http.get('/songs/processed', { id, user_id: userId })
}

/**
 * 获取处理后的歌词（带振假名、语法标注等）
 */
export function getProcessedNeteaseLyricById(id: string) {
  return http.get('/songs/netease/processed', { id })
}

/**
 * 获取网易云歌曲详情
 */
export function getNeteaseSongDetailById(id: string) {
  return http.get('/songs/netease/song', { id })
}

/**
 * 创建歌曲
 */
export function createSong(payload: any) {
  return http.post('/songs', payload)
}

/**
 * 播放计数
 */
export function playSong(id: string) {
  return http.post(`/songs/${id}/play`)
}

/**
 * 从网易云导入歌曲
 */
export function importSongFromNetease(neteaseSongId: string | number, options?: {
  difficulty?: number
  is_public?: boolean
  create_user?: string | number
  song_name_cn?: string
  force?: boolean
}) {
  return http.post('/songs/import/netease', {
    netease_song_id: neteaseSongId,
    ...options,
  })
}

/**
 * 获取歌曲详情
 */
export function getSongById(id: string) {
  return http.get(`/songs/${id}`)
}

/**
 * 获取歌曲音频新鲜预签名 URL
 */
export function getSongAudioUrl(id: string) {
  return http.get(`/songs/${id}/audio`)
}

/**
 * 获取歌曲生词（按 JLPT 等级筛选）
 */
export function getSongVocabulary(songId: string, level: string, userId?: string | number) {
  return http.get('/songs/vocabulary', { id: songId, level, user_id: userId })
}
