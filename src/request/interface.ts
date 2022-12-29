export interface RequestConfig {
  token?: string
  baseUrl: string
  NODE_ENV: string
  timeout?: number
  responseType?: any
  maxRedirects?: number
  maxContentLength?: number
}
