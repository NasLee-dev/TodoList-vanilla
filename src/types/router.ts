import View from '../lib/view'

export interface RouteInfo {
  path: string
  page: View
  params: RegExp | null
}

export interface RouteParams {
  [key: string]: string
}
