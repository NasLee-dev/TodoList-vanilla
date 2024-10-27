import { Todo } from './todo'

export interface StateProps {
  todoItems: Todo[]
  selectedItem: Todo | null
}

export type StateKey = keyof StateProps
export type Subscriber = (Todo: Todo[]) => void
export type StateSelector<T> = (state: StateProps) => T
export type Unsubscribe = () => void
