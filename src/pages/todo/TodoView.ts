import View from '../../lib/view'
import { TodoService } from '../../services/todo/TodoService'
import { Todo } from '../../types/todo'

export default class TodoView extends View {
  private todos: Todo[] = []
  private todoService: TodoService

  constructor() {
    super({
      containerId: 'app',
      template: `
        <div class="max-w-2xl mx-auto p-4">
          <h1 class="text-2xl font-bold mb-4 flex justify-center items-center">To Do List</h1>
          <form id="todo-form" class="mb-4">
            <div class="flex gap-2">
              <input
                type="text"
                id="todo-input"
                class="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="할 일을 입력하세요"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                추가
              </button>
            </div>
          </form>
          <div id="todo-list" class="space-y-2">
            <!-- 할 일 목록이 여기에 렌더링됩니다 -->
          </div>
        </div>
      `
    })

    this.todoService = new TodoService()
    this.initializeView()
  }

  private async initializeView(): Promise<void> {
    await this.loadTodos()
    this.bindEvents()
  }

  private async loadTodos(): Promise<void> {
    try {
      this.todos = await this.todoService.getTodos()
      await this.renderTodos()
    } catch (error) {
      console.error('할 일 목록 로드 실패:', error)
    }
  }

  private bindEvents(): void {
    const form = this.querySelector<HTMLFormElement>('#todo-form')
    if (!form) return

    form.addEventListener('submit', async e => {
      e.preventDefault()

      const input = this.querySelector<HTMLInputElement>('#todo-input')
      if (!input) return

      const title = input.value.trim()
      if (!title) return

      try {
        const newTodo = await this.todoService.addTodo(title)
        this.todos.unshift(newTodo)
        input.value = ''
        await this.renderTodos()
      } catch (error) {
        console.error('할 일 추가 실패:', error)
      }
    })

    const todoList = this.querySelector<HTMLDivElement>('#todo-list')
    if (!todoList) return

    todoList.addEventListener('click', async e => {
      const target = e.target as HTMLElement
      const todoItem = target.closest('[data-todo-id]')
      if (!todoItem) return

      const todoId = todoItem.getAttribute('data-todo-id')
      if (!todoId) return

      if (target.matches('.todo-delete-btn')) {
        await this.deleteTodo(todoId)
      } else if (target.matches('.todo-checkbox')) {
        const checkbox = target as HTMLInputElement
        await this.toggleTodo(todoId, checkbox.checked)
      }
    })
  }

  private async toggleTodo(todoId: string, completed: boolean): Promise<void> {
    try {
      const updatedTodo = await this.todoService.updateTodo(todoId, {
        isCompleted: completed
      })
      if (updatedTodo) {
        const todoIndex = this.todos.findIndex(t => t.id === todoId)
        if (todoIndex !== -1) {
          this.todos[todoIndex] = updatedTodo
          await this.renderTodos()
        }
      }
    } catch (error) {
      console.error('할 일 상태 업데이트 실패:', error)
    }
  }

  private async deleteTodo(todoId: string): Promise<void> {
    try {
      if (!confirm('정말 삭제하시겠습니까?')) return

      await this.todoService.deleteTodo(todoId)
      this.todos = this.todos.filter(todo => todo.id !== todoId)
      await this.renderTodos()
    } catch (error) {
      console.error('할 일 삭제 실패:', error)
    }
  }

  private createTodoElement(todo: Todo): HTMLDivElement {
    const div = document.createElement('div')
    div.className =
      'flex items-center justify-between p-3 bg-white rounded shadow'
    div.dataset.todoId = todo.id

    div.innerHTML = `
      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          class="todo-checkbox w-5 h-5 text-blue-500"
          ${todo.isCompleted ? 'checked' : ''}
        />
        <span class="todo-title ${todo.isCompleted ? 'line-through text-gray-400' : ''}">
          ${this.escapeHtml(todo.title)}
        </span>
      </div>
      <button class="todo-delete-btn text-red-500 hover:text-red-600">
        삭제
      </button>
    `

    return div
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  private async renderTodos(): Promise<void> {
    const todoList = this.querySelector<HTMLDivElement>('#todo-list')
    if (!todoList) return

    todoList.innerHTML = ''

    this.todos.forEach(todo => {
      const todoElement = this.createTodoElement(todo)
      todoList.appendChild(todoElement)
    })
  }

  public async render(): Promise<void> {
    await this.updateView()
    await this.loadTodos()
  }

  public async cleanup(): Promise<void> {
    const form = this.querySelector<HTMLFormElement>('#todo-form')
    form?.removeEventListener('submit', () => {})

    const todoList = this.querySelector<HTMLDivElement>('#todo-list')
    todoList?.removeEventListener('click', () => {})

    await super.cleanup()
  }
}
