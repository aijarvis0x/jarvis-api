import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

class HttpClient {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // Request Interceptor
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error("[Request Error]", error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`[Response] ${response.status}: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error("[Response Error]", error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  public async get<T = any>(
    url: string,
    params?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params });
  }

  /**
   * POST request
   */
  public async post<T = any>(
    url: string,
    data?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data);
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    url: string,
    data?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data);
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }
}

export default HttpClient;
