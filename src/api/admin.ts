import { http } from '@/http/http'

// Users
export function getAdminUsers(params?: { search?: string; offset?: number; limit?: number }) {
  return http.get<{ users: any[]; total: number }>('/admin/users', params)
}

export function updateUserRole(userId: string, role: string) {
  return http.put(`/admin/users/${userId}/role`, { role })
}

// Songs
export function getAdminSongs(params?: { search?: string; status?: string; offset?: number; limit?: number }) {
  return http.get<{ songs: any[]; total: number }>('/admin/songs', params)
}

export function updateAdminSong(songId: string, data: Record<string, any>) {
  return http.put(`/admin/songs/${songId}`, data)
}

export function deleteAdminSong(songId: string) {
  return http.delete(`/admin/songs/${songId}`)
}

// Suggestions
export function getAdminSuggestions(params?: { status?: string; offset?: number; limit?: number }) {
  return http.get<{ suggestions: any[]; total: number }>('/admin/suggestions', params)
}

export function reviewAdminSuggestion(id: number, status: 'approved' | 'rejected') {
  return http.post(`/admin/suggestions/${id}/review`, { status })
}

// Redemption (reuse existing routes)
export function generateCodes(params: { count: number; duration_days: number; expire_days?: number }) {
  return http.post('/redemption/generate', params)
}

export function listCodes(params?: { batch_id?: string; status?: string; limit?: number; offset?: number }) {
  return http.get<{ codes: any[] }>('/redemption/codes', params)
}

export function disableCode(codeId: number) {
  return http.put(`/redemption/codes/${codeId}/disable`)
}
