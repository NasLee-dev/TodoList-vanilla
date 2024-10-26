import {
  StateKey,
  StateProps,
  StateSelector,
  Subscriber,
  Unsubscribe
} from '../types/state'

export default class StateManager {
  private state: StateProps
  private subscribers: Map<string, Subscriber>
  private selectors: Map<string, StateSelector<any>>
  private static instance: StateManager
  private prevState: StateProps

  private constructor() {
    this.state = {
      todoItems: [],
      selectedItem: null
    }
    this.subscribers = new Map()
    this.selectors = new Map()
    this.prevState = { ...this.state }
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager()
    }
    return StateManager.instance
  }

  public getState(): Readonly<StateProps> {
    return Object.freeze({ ...this.state })
  }

  public select<T>(selector: StateSelector<T>): T {
    return selector(this.state)
  }

  public setState(newState: Partial<StateProps>): void {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...newState }

    this.notifySubscribers(prevState)
  }

  public setStateKey<K extends keyof StateProps>(
    key: K,
    value: StateProps[K]
  ): void {
    const prevState = { ...this.state }
    this.state = {
      ...this.state,
      [key]: value
    }

    this.notifyKeySubscribers(key, prevState[key])
  }

  private notifySubscribers(prevState: StateProps): void {
    const changedKeys = Object.keys(this.state).filter(
      key =>
        this.state[key as keyof StateProps] !==
        prevState[key as keyof StateProps]
    )

    const notifiedSubscribers = new Set<Subscriber>()
    changedKeys.forEach(key => {
      this.subscribers.forEach((subscriber, id) => {
        if (!notifiedSubscribers.has(subscriber)) {
          const selector = this.selectors.get(id)
          if (selector) {
            const prevValue = selector(prevState)
            const newValue = selector(this.state)
            if (!this.isEqual(prevValue, newValue)) {
              subscriber()
              notifiedSubscribers.add(subscriber)
            }
          } else {
            subscriber()
            notifiedSubscribers.add(subscriber)
          }
        }
      })
    })
  }

  private notifyKeySubscribers(
    key: StateKey,
    prevValue: StateProps[StateKey]
  ): void {
    this.subscribers.forEach((subscriber, id) => {
      const selector = this.selectors.get(id)
      if (selector) {
        const selectedPrevValue = selector({ ...this.state, [key]: prevValue })
        const selectedNewValue = selector(this.state)
        if (!this.isEqual(selectedPrevValue, selectedNewValue)) {
          subscriber()
        }
      }
    })
  }

  private isEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (typeof a !== typeof b) return false
    if (typeof a !== 'object') return false
    if (Array.isArray(a) !== Array.isArray(b)) return false

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    return keysA.every(key => this.isEqual(a[key], b[key]))
  }

  public subscribe(
    selector: StateSelector<any>,
    subscriber: Subscriber
  ): Unsubscribe {
    const id = crypto.randomUUID()
    this.subscribers.set(id, subscriber)

    if (selector) {
      this.selectors.set(id, selector)
    }

    return () => {
      this.subscribers.delete(id)
      this.selectors.delete(id)
    }
  }

  public resetState(): void {
    this.state = {
      todoItems: [],
      selectedItem: null
    }
    this.notifySubscribers(this.prevState)
    this.prevState = { ...this.state }
  }
}
