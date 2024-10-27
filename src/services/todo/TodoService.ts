import StateManager from '../../lib/stateManager'
import { StateSelector, Subscriber } from '../../types/state'
import { Todo } from '../../types/todo'

export class TodoService {
  private readonly STORAGE_KEY = 'todos'
  private todoState = StateManager.getInstance()

  constructor() {
    this.initializeState()
  }

  private initializeState(): void {
    const currentState = this.todoState.getState().todoItems
    if (!currentState || currentState.length === 0) {
      const storedTodos = localStorage.getItem(this.STORAGE_KEY)
      if (storedTodos) {
        this.todoState.setState({ todoItems: JSON.parse(storedTodos) })
      } else {
        this.todoState.setState({ todoItems: [] })
      }
    }
  }

  private persisteState(todos: Todo[]): void {
    this.todoState.setState({ todoItems: todos })
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos))
  }

  async getTodos(): Promise<Todo[]> {
    return this.todoState.getState().todoItems || []
  }

  async addTodo(title: string): Promise<Todo> {
    const todos = await this.getTodos()
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      isCompleted: false,
      createdAt: new Date()
    }

    const updatedTodos = [...todos, newTodo]
    this.persisteState(updatedTodos) //  todoState와 localStorage에 같이 저장, 업데이트
    return newTodo
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const todos = await this.getTodos()
    const targetIndex = todos.findIndex(todo => todo.id === id)
    if (targetIndex === -1) {
      throw new Error(`ToDoList에 없습니다: ${id}`)
    }
    const updatedTodo = { ...todos[targetIndex], ...updates }
    const updatedTodos = todos.map(todo =>
      todo.id === id ? updatedTodo : todo
    ) //  업데이트된 할 일을 찾아서 업데이트
    this.persisteState(updatedTodos)
    return updatedTodo
  }

  async deleteTodo(id: string): Promise<boolean> {
    const todos = await this.getTodos()
    const targetIndex = todos.findIndex(todo => todo.id === id)
    if (targetIndex === -1) {
      throw new Error(`ToDoList에 없습니다: ${id}`)
    }
    const filteredTodos = todos.filter(todo => todo.id !== id)
    this.persisteState(filteredTodos)
    return true
  }

  subscribe(
    selector: StateSelector<Todo[]>,
    subscriber: Subscriber
  ): () => void {
    return this.todoState.subscribe(selector, subscriber)
  }
}
