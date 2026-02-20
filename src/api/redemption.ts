import { http } from '@/http/http'

export function redeemCode(code: string) {
  return http.post<{ membershipType: string; expireTime: string }>('/redemption/redeem', { code })
}
