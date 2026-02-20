import type { IDoubleTokenRes } from '@/api/types/login'
import type { CustomRequestOptions, IResponse } from '@/http/types'
import { nextTick } from 'vue'
import { useTokenStore } from '@/store/token'
import { isDoubleTokenMode } from '@/utils'
import { toLoginPage } from '@/utils/toLoginPage'
import { ResultEnum } from './tools/enum'

// Debug log for tracing auth issues
export const authDebugLog: string[] = []
export function addDebugLog(msg: string) {
  const ts = new Date().toLocaleTimeString()
  authDebugLog.push(`[${ts}] ${msg}`)
  if (authDebugLog.length > 20) authDebugLog.shift()
}

// 刷新 token 状态管理
let refreshing = false // 防止重复刷新 token 标识
let taskQueue: (() => void)[] = [] // 刷新 token 请求队列

export function http<T>(options: CustomRequestOptions) {
  // 1. 返回 Promise 对象
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: async (res) => {
        const rawData = res.data as any

        // 1. 先检查 HTTP 错误状态码，防止错误响应被当作成功处理
        if (res.statusCode >= 400) {
          const msg = rawData?.message || rawData?.msg || '请求错误'

          // 401 特殊处理：token 过期/无效
          if (res.statusCode === 401 || rawData?.code === 401) {
            const tokenStore = useTokenStore()
            addDebugLog(`401! url=${options.url}`)

            if (!isDoubleTokenMode) {
              tokenStore.logout()
              uni.showToast({ icon: 'none', title: '请先登录' })
              setTimeout(() => { toLoginPage() }, 1500)
              return reject(res)
            }

            /* -------- 无感刷新 token ----------- */
            const { refreshToken } = tokenStore.tokenInfo as IDoubleTokenRes || {}
            if (refreshToken) {
              taskQueue.push(() => { resolve(http<T>(options)) })
            }
            if (refreshToken && !refreshing) {
              refreshing = true
              try {
                await tokenStore.refreshToken()
                refreshing = false
                nextTick(() => {
                  uni.hideToast()
                  uni.showToast({ title: 'token 刷新成功', icon: 'none' })
                })
                taskQueue.forEach(task => task())
              }
              catch {
                refreshing = false
                nextTick(() => {
                  uni.hideToast()
                  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
                })
                await tokenStore.logout()
                setTimeout(() => { toLoginPage() }, 2000)
              }
              finally {
                taskQueue = []
              }
            }
            return reject(res)
          }

          // 其他 HTTP 错误（400、403、404、500 等）
          !options.hideErrorToast && uni.showToast({ icon: 'none', title: msg })
          return reject({ statusCode: res.statusCode, message: msg, data: rawData })
        }

        // 2. HTTP 2xx 成功响应
        // 情况 A：后端没有统一包装（没有 code/data/result 字段）
        if (rawData && typeof rawData === 'object' && !('data' in rawData) && !('result' in rawData)) {
          return resolve(rawData as T)
        }

        // 情况 B：后端统一包装 { code, data/result, msg }
        const responseData = rawData as IResponse<T>
        const { code } = responseData

        // 业务逻辑错误
        if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
          uni.showToast({
            icon: 'none',
            title: responseData.msg || responseData.message || '请求错误',
          })
        }
        if (responseData.result !== undefined) {
          return resolve(responseData.result)
        }
        if (responseData.data !== undefined) {
          return resolve(responseData.data)
        }
        return resolve(undefined as T)
      },
      // 响应失败
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpPost<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}
/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

// 支持与 axios 类似的API调用
http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

// 支持与 alovaJS 类似的API调用
http.Get = httpGet
http.Post = httpPost
http.Put = httpPut
http.Delete = httpDelete
