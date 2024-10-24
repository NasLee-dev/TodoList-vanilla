import { RouteInfo, RouteParams } from '../types/router'
import View from './view'

export class Router {
  private isStart: boolean
  private defaultRoute: RouteInfo | null
  private routeTable: Map<string, RouteInfo>
  private currentPage: View | null
  constructor() {
    this.isStart = false
    this.defaultRoute = null
    this.routeTable = new Map()
    this.currentPage = null

    window.addEventListener('popstate', this.handlePopState.bind(this))
    window.addEventListener('DOMContentLoaded', () => {
      this.isStart && this.route()
    })
  }

  public setDefaultPage(page: View, params: RegExp | null = null): void {
    this.defaultRoute = { path: '/', page, params }
    this.routeTable.set('/', { path: '/', page, params })
  }

  public addRoutePath(
    path: string,
    page: View,
    params: RegExp | null = null
  ): void {
    if (this.routeTable.has(path)) {
      throw new Error('이미 등록된 경로입니다.')
    }
    this.routeTable.set(path, { path, page, params })
    if (!this.isStart) {
      this.isStart = true
      this.route()
    }
  }

  public navigate(path: string): void {
    window.history.pushState(null, '', path)
    this.route()
  }

  private handlePopState = (): void => {
    this.route()
  }

  private extractRouteParams(path: string, regex: RegExp): RouteParams {
    const matches = path.match(regex)
    if (!matches) return {}

    const params: RouteParams = {}
    const paramNames = Array.from(regex.toString().matchAll(/:([^/]+)/g)).map(
      result => result[1]
    )

    //  matches[0]은 path 전체이므로 slice(1)로 제외하고 순회
    matches.slice(1).forEach((value, index) => {
      if (paramNames[index]) {
        params[paramNames[index]] = value
      }
    })
    return params
  }

  private async cleanupCurrentPage(): Promise<void> {
    if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
      await this.currentPage.cleanup()
    }
  }

  private async route(): Promise<void> {
    try {
      const routePath = window.location.pathname

      //  현재 페이지가 있을 경우 정리
      if (routePath === '/' && this.defaultRoute) {
        await this.cleanupCurrentPage()
        this.currentPage = this.defaultRoute.page
        await this.currentPage.render()
        return
      }

      //  등록된 경로 찾기
      for (const [path, routeInfo] of this.routeTable.entries()) {
        const { page, params } = routeInfo

        if (params) {
          const routeParams = this.extractRouteParams(routePath, params)
          if (Object.keys(routeParams).length > 0) {
            await this.cleanupCurrentPage()
            this.currentPage = page
            await page.render(routeParams)
            return
          }
        } else if (path === routePath) {
          await this.cleanupCurrentPage()
          this.currentPage = page
          await page.render()
          return
        }
      }
      if (this.defaultRoute) {
        await this.cleanupCurrentPage()
        this.currentPage = this.defaultRoute.page
        await this.defaultRoute.page.render()
      } else {
        throw new Error(`경로를 찾을 수 없습니다. ${routePath}`)
      }
    } catch (error) {
      console.error(error)
      // TODO: 에러 페이지 보여주기
    }
  }

  public static createPath(
    path: string,
    params: Record<string, string> = {}
  ): string {
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`:${key}`, encodeURIComponent(value)),
      path
    )
  }
}
