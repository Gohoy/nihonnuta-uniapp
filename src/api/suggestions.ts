import { http } from '@/http/http'

export interface SuggestionEdit {
  field: 'original' | 'translate' | 'roma' | 'kana'
  token_text?: string
  old_value: string
  new_value: string
}

export function submitSuggestion(songId: string, payload: {
  line_index: number
  time_ms?: number
  edits: SuggestionEdit[]
  reason?: string
}) {
  return http.post(`/songs/${songId}/suggestions`, payload)
}

export function getSongSuggestions(songId: string, status = 'pending') {
  return http.get(`/songs/${songId}/suggestions`, { status })
}

export function reviewSuggestion(suggestionId: number, status: 'approved' | 'rejected') {
  return http.post(`/songs/suggestions/${suggestionId}/review`, { status })
}

export function getMySuggestions(offset = 0, limit = 20) {
  return http.get('/user/suggestions', { offset, limit })
}
