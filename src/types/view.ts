export interface ViewEvents {
  onBeforeRender?: () => Promise<void> | void
  onAfterRender?: () => Promise<void> | void
  onBeforeCleanup?: () => Promise<void> | void
}

export interface ViewOptions {
  containerId: string
  template: string
  events?: ViewEvents
}
