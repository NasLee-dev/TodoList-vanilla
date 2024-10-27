import { TodoService } from '../../services/todo/TodoService'
import { Todo } from '../../types/todo'

export default function TodoView(containerId: string) {
  const todoService = new TodoService()

  const renderTodos = (todos: Todo[]) => {
    const todoList = document.querySelector('#todo-list')
    if (!todoList) return

    todoList.innerHTML = ''
    todos.forEach(todo => {
      const todoElement = createTodoElement(todo)
      todoList.appendChild(todoElement)
    })
  }

  // StateManager를 통한 상태 구독
  const unsubscribe = todoService.subscribe(
    state => state.todoItems,
    renderTodos
  )

  const render = () => {
    const container = document.getElementById(containerId)
    if (!container) return

    container.innerHTML = `
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
        </div>
      </div>
    `
  }

  const bindEvents = (): void => {
    const form = document.querySelector('#todo-form')
    const todoList = document.querySelector('#todo-list')

    if (!form || !todoList) return

    form.addEventListener('submit', handleSubmit)
    todoList.addEventListener('click', handleTodoListClick)
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()

    const input = document.querySelector<HTMLInputElement>('#todo-input')
    if (!input) return

    const content = input.value.trim()
    if (!content) return

    try {
      await todoService.addTodo(content)
      input.value = ''
    } catch (error) {
      console.error('할 일 추가 실패:', error)
    }
  }

  const handleTodoListClick = async (e: Event) => {
    const target = e.target as HTMLElement
    const todoItem = target.closest('[data-todo-id]')
    if (!todoItem) return

    const todoId = todoItem.getAttribute('data-todo-id')
    if (!todoId) return

    if (target.matches('.todo-delete-btn')) {
      await deleteTodo(todoId)
    } else if (target.matches('.todo-checkbox')) {
      const checkbox = target as HTMLInputElement
      await toggleTodo(todoId, checkbox.checked)
    }
  }

  const toggleTodo = async (id: string, isCompleted: boolean) => {
    try {
      await todoService.updateTodo(id, { isCompleted })
    } catch (error) {
      console.error('할 일 토글 실패:', error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      if (!confirm('정말 삭제하시겠습니까?')) return
      await todoService.deleteTodo(id)
    } catch (error) {
      console.error('할 일 삭제 실패:', error)
    }
  }

  const initializeView = async (): Promise<void> => {
    render()
    await todoService.getTodos()
    bindEvents()
  }

  const createTodoElement = (todo: Todo) => {
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
          ${escapeHtml(todo.title)}
        </span>
      </div>
      <button class="todo-delete-btn text-red-500 hover:text-red-600">
        삭제
      </button>
    `
    return div
  }

  const escapeHtml = (str: string): string => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  const cleanup = () => {
    unsubscribe()
    const form = document.querySelector('#todo-form')
    const todoList = document.querySelector('#todo-list')

    if (!form || !todoList) return

    form.removeEventListener('submit', handleSubmit)
    todoList.removeEventListener('click', handleTodoListClick)
  }

  initializeView()

  return {
    render: async () => {
      render()
      await todoService.getTodos()
    },
    cleanup
  }
}
