import { RouteParams } from '../types/router'
import { ViewEvents, ViewOptions } from '../types/view'

export default abstract class View {
  protected template: string
  protected renderTemplate: string
  protected container: HTMLElement
  protected htmlList: string[]
  protected events: ViewEvents
  protected isRendered: boolean
  protected templateCache: Map<string, string>

  constructor(options: ViewOptions) {
    const { containerId, template, events = {} } = options

    const containerElement = document.getElementById(containerId)
    if (!containerElement) {
      throw new Error('최상위 컨테이너가 없어 UI를 진행하지 못합니다.')
    }

    this.container = containerElement
    this.template = template
    this.renderTemplate = template
    this.htmlList = []
    this.events = events
    this.isRendered = false
    this.templateCache = new Map()
  }

  protected async updateView(): Promise<void> {
    try {
      await this.events.onBeforeRender?.() //  렌더링 전 이벤트 발생
      const newContent = this.renderTemplate //  렌더링할 새로운 컨텐츠
      const diff = this.shouldUpdateDOM(this.container.innerHTML, newContent) //  업데이트 여부 확인

      if (diff) {
        this.container.innerHTML = newContent //  업데이트
      }
      this.renderTemplate = this.template //  템플릿 초기화
      this.isRendered = true //  렌더링 완료

      await this.events.onAfterRender?.() //  렌더링 후 이벤트 발생
    } catch (error) {
      console.error('뷰 업데이트 중 에러 발생:', error)
      throw error
    }
  }

  protected addHtml(htmlString: string): void {
    if (typeof htmlString !== 'string') {
      throw new Error('html 문자열만 추가할 수 있습니다.')
    }

    this.htmlList.push(htmlString)
  }

  protected getHtml(): string {
    try {
      const snapshot = this.htmlList.join('')
      this.clearHtmlList()
      return this.sanitizeHtml(snapshot)
    } catch (error) {
      console.error('html 추출 중 에러 발생:', error)
      return ''
    }
  }

  public async cleanup(): Promise<void> {
    try {
      await this.events.onBeforeCleanup?.()
      this.container.innerHTML = ''
      this.clearHtmlList()
      this.renderTemplate = this.template
      this.isRendered = false
      this.templateCache.clear()
    } catch (error) {
      console.error('뷰 정리 중 에러 발생:', error)
      throw error
    }
  }

  protected setTemplateData(key: string, value: string): void {
    if (!key || typeof value === 'undefined') {
      throw new Error('키와 값 모두 필수입니다.')
    }

    const placeholder = `{{__${key}__}}` //  템플릿에 삽입할 키
    const sanitizeHtml = this.sanitizeHtml(value) //  HTML 문자열을 이스케이프 처리

    const cacheKey = `${key}: ${value}` //  캐시 키
    if (this.templateCache.has(cacheKey)) {
      //  캐시에 키가 존재하면 캐시에서 가져옴
      this.renderTemplate = this.templateCache.get(cacheKey)!
      return
    }
    this.renderTemplate = this.renderTemplate.replace(
      new RegExp(placeholder, 'g'),
      sanitizeHtml
    ) //  템플릿에 데이터 삽입
    //  캐시에 저장
    this.templateCache.set(cacheKey, this.renderTemplate)
  }

  //  여러 개의 데이터를 한 번에 템플릿에 삽입
  protected setMultipleTemplateData(data: Record<string, string>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.setTemplateData(key, value)
    })
  }

  private clearHtmlList(): void {
    this.htmlList = []
  }

  protected sanitizeHtml(html: string): string {
    const div = document.createElement('div')
    div.textContent = html
    return div.innerHTML
  }

  private shouldUpdateDOM(oldHTML: string, newHTML: string): boolean {
    return oldHTML !== newHTML
  }

  protected createEventHandler<T extends Event>(
    handler: (event: T) => void
  ): (event: T) => void {
    return (event: T) => {
      try {
        handler(event)
      } catch (error) {
        console.error('이벤트 핸들러에서 에러 발생:', error)
      }
    }
  }

  protected appendToContainer(element: HTMLElement): void {
    this.container.appendChild(element)
  }

  protected querySelector<T extends HTMLElement = HTMLElement>(
    selector: string
  ): T | null {
    return this.container.querySelector<T>(selector)
  }

  protected querySelectorAll<T extends HTMLElement = HTMLElement>(
    selector: string
  ): NodeListOf<T> {
    return this.container.querySelectorAll<T>(selector)
  }

  abstract render(params?: RouteParams): Promise<void>
}
