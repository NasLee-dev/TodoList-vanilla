import TodoView from './pages/todo/TodoList'
import './style.css'

const todoView = TodoView('app')
await todoView.render()
