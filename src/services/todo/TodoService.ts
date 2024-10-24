import { Todo } from '../../types/todo'

export class TodoService {
  private readonly STORAGE_KEY = 'todos'

  async getTodos(): Promise<Todo[]> {
    const todos = localStorage.getItem(this.STORAGE_KEY)
    return todos ? JSON.parse(todos) : []
  }

  async addTodo(title: string): Promise<Todo> {
    const todos = await this.getTodos()
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      isCompleted: false,
      createdAt: new Date()
    }

    todos.push(newTodo)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos))
    return newTodo
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const todos = await this.getTodos()
    const targetIndex = todos.findIndex(todo => todo.id === id)
    if (targetIndex === -1) {
      throw new Error(`ToDoList에 없습니다: ${id}`)
    }
    todos[targetIndex] = { ...todos[targetIndex], ...updates }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos))
    return todos[targetIndex]
  }

  async deleteTodo(id: string): Promise<boolean> {
    const todos = await this.getTodos()
    const targetIndex = todos.findIndex(todo => todo.id === id)
    if (targetIndex === -1) {
      throw new Error(`ToDoList에 없습니다: ${id}`)
    }
    const filteredTodos = todos.filter(todo => todo.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTodos))
    return true
  }
}
