import { http } from '@/http/http'

export function getNeteaseLoginStatus() {
  return http.get<{ loggedIn: boolean, nickname: string | null, avatarUrl: string | null }>('/netease/login/status')
}

export function getNeteaseQRKey() {
  return http.get<{ key: string }>('/netease/login/qr/key')
}

export function getNeteaseQRCode(key: string) {
  return http.get<{ qrimg: string }>('/netease/login/qr/create', { key })
}

export function checkNeteaseQRStatus(key: string) {
  return http.get<{ code: number, message: string }>('/netease/login/qr/check', { key })
}

export function downloadSongAudio(songId: string) {
  return http.post(`/songs/${songId}/download-audio`)
}
