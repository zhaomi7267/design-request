import http from 'http'
import https from 'https'
import axios, { AxiosRequestConfig, AxiosResponse, CancelTokenStatic } from 'axios'
// import { Message, MessageBox } from 'element-ui'
import qs from 'qs'
import { RequestConfig } from './interface'

// import { UserModule } from '@/store/modules/user'

class DesignRequest {
  private static _instance: DesignRequest
  private static _requestConfig: RequestConfig

  public axiosFulfill?: (response: any) => void
  public axiosRejected?: (error: any) => void

  // protected baseURL: any = process.env.VUE_APP_BASE_API
  protected service: any = axios
  protected pending: Array<{
    url: string
    cancel: Function
  }> = []
  protected CancelToken: CancelTokenStatic = axios.CancelToken
  protected axiosRequestConfig: AxiosRequestConfig = {}
  protected successCode: Array<Number> = [200, 201, 204]

  constructor() {
    this.requestConfig()
    this.service = axios.create(this.axiosRequestConfig)
    this.interceptorsRequest()
    this.interceptorsResponse()
  }

  public static getInstance(requestConfiguration?: RequestConfig): DesignRequest {
    // 如果 instance 是一个实例 直接返回，  如果不是 实例化后返回
    this._instance || (this._instance = new DesignRequest())
    if (requestConfiguration) this._requestConfig = requestConfiguration
    return this._instance
  }

  // 请求方式
  public async post(url: string, data: any = {}, config: object = {}) {
    try {
      const result = await this.service.post(url, qs.stringify(data), config)
      return result.data
    } catch (error) {
      console.error(error)
    }
  }

  public async delete(url: string, config: object = {}) {
    try {
      await this.service.delete(url, config)
    } catch (error) {
      console.error(error)
    }
  }

  public async put(url: string, data: any = {}, config: object = {}) {
    try {
      await this.service.put(url, qs.stringify(data), config)
    } catch (error) {
      console.error(error)
    }
  }

  public async get(url: string, parmas: any = {}, config: object = {}) {
    try {
      await this.service.get(url, parmas, config)
    } catch (error) {
      console.error(error)
    }
  }

  //自定义实例默认值
  protected requestConfig(): void {
    const requestConfiguration = DesignRequest._requestConfig
    // @ts-ignore
    // @ts-ignore
    this.axiosRequestConfig = {
      baseURL: requestConfiguration.baseUrl,
      headers: {
        timestamp: new Date().getTime(),
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      transformRequest: [obj => qs.stringify(obj)],
      transformResponse: [
        function (data: AxiosResponse) {
          return data
        }
      ],
      // @ts-ignore
      paramsSerializer(params: any): string {
        return qs.stringify(params, { arrayFormat: 'brackets' })
      },
      timeout: requestConfiguration.timeout || 30000,
      withCredentials: false,
      responseType: requestConfiguration.responseType || 'json',
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
      maxRedirects: requestConfiguration.maxRedirects || 5,
      maxContentLength: requestConfiguration.maxContentLength || 2000,
      validateStatus: function (status: number) {
        return status >= 200 && status < 500
      },
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true })
    }
  }

  //请求拦截器
  protected interceptorsRequest() {
    this.service.interceptors.request.use(
      (config: any) => {
        this.removePending(config)
        config.CancelToken = new this.CancelToken((c: any) => {
          this.pending.push({ url: `${config.url}/${JSON.stringify(config.data)}&request_type=${config.method}`, cancel: c })
        })
        if (DesignRequest._requestConfig.token) {
          config.headers['authorization'] = DesignRequest._requestConfig.token
        }
        this.requestLog(config)
        return config
      },
      (error: any) => {
        return Promise.reject(error)
      }
    )
  }

  //响应拦截器
  protected interceptorsResponse(): void {
    this.service.interceptors.response.use(
      (response: any) => {
        this.responseLog(response)
        this.removePending(response.config)
        if (this.successCode.indexOf(response.status) === -1) {
          this.axiosFulfill!(response)
          // Message({
          //   message: response.data.message || 'Error',
          //   type: 'error',
          //   duration: 5 * 1000
          // })
          // if (response.data.code === 401) {
          //   MessageBox.confirm('你已被登出，可以取消继续留在该页面，或者重新登录', '确定登出', {
          //     confirmButtonText: '重新登录',
          //     cancelButtonText: '取消',
          //     type: 'warning'
          //   }).then(() => {
          //     UserModule.ResetToken()
          //     location.reload()
          //   })
          // }
          return Promise.reject(new Error(response.message || 'Error'))
        } else {
          return response.data
        }
      },

      (error: any) => {
        this.axiosRejected!(error)
        // Message({
        //   message: error.message,
        //   type: 'error',
        //   duration: 5 * 1000
        // })
        // return Promise.reject(error)
      }
    )
  }

  //重复点击取消上一次请求
  protected removePending(config: any): void {
    for (let p in this.pending) {
      let item: any = p
      let list: any = this.pending[p]
      if (list.url === `${config.url}/${JSON.stringify(config.data)}&request_type=${config.method}`) {
        list.cancel()
        console.log('=====', this.pending)
        this.pending.splice(item, 1)
        console.log('+++++', this.pending)
      }
    }
  }

  protected requestLog(request: any): void {}

  //响应 logs
  protected responseLog(response: any): void {
    if (DesignRequest._requestConfig.NODE_ENV === 'development') {
      const randomColor = `rgba(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`
      console.log('%c┍------------------------------------------------------------------┑', `color:${randomColor};`)
      console.log('| 请求地址：', response.config.url)
      console.log('| 请求参数：', qs.parse(response.config.data))
      console.log('| 返回数据：', response.data)
      console.log('%c┕------------------------------------------------------------------┙', `color:${randomColor};`)
    }
  }
}

export default DesignRequest.getInstance()
