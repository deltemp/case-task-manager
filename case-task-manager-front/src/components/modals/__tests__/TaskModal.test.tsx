import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskModal } from '../TaskModal'
import { Task, TaskStatus, TaskPriority } from '@/types'

// Mock the TaskForm component
jest.mock('../../forms/TaskForm', () => ({
  TaskForm: ({ onSubmit, onCancel, mode, loading }: any) => (
    <div data-testid="task-form">
      <p>Mode: {mode}</p>
      <p>Loading: {loading ? 'true' : 'false'}</p>
      <button onClick={() => onSubmit({ title: 'Test Task' })}>Submit Form</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  )
}))

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'pending',
  priority: 'medium',
  dueDate: '2024-12-31',
  assigneeId: null,
  userId: 'user1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

describe('TaskModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    mode: 'create' as const,
    loading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    render(<TaskModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal when isOpen is true', () => {
    render(<TaskModal {...defaultProps} />)
    expect(screen.getByText('Nova Tarefa')).toBeInTheDocument()
    expect(screen.getByTestId('task-form')).toBeInTheDocument()
  })

  it('shows correct title for create mode', () => {
    render(<TaskModal {...defaultProps} mode="create" />)
    expect(screen.getByText('Nova Tarefa')).toBeInTheDocument()
  })

  it('shows correct title for edit mode', () => {
    render(<TaskModal {...defaultProps} mode="edit" task={mockTask} />)
    expect(screen.getByText('Editar Tarefa')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<TaskModal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
    fireEvent.click(closeButton!)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn()
    render(<TaskModal {...defaultProps} onClose={onClose} />)
    
    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn()
    render(<TaskModal {...defaultProps} onClose={onClose} />)
    
    const overlay = screen.getByText('Nova Tarefa').closest('[style*="rgba(0, 0, 0, 0.5)"]')
    fireEvent.click(overlay!)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal content is clicked', () => {
    const onClose = jest.fn()
    render(<TaskModal {...defaultProps} onClose={onClose} />)
    
    const modalContent = screen.getByText('Nova Tarefa').closest('.bg-white')
    fireEvent.click(modalContent!)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = jest.fn()
    render(<TaskModal {...defaultProps} onSubmit={onSubmit} />)
    
    const submitButton = screen.getByText('Submit Form')
    fireEvent.click(submitButton)
    
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Test Task' })
  })

  it('shows loading state correctly', () => {
    render(<TaskModal {...defaultProps} loading={true} />)
    
    expect(screen.getByText('Loading: true')).toBeInTheDocument()
    expect(screen.getByText('Salvando...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled()
  })

  it('shows correct button text for create mode', () => {
    render(<TaskModal {...defaultProps} mode="create" />)
    expect(screen.getByText('Criar Tarefa')).toBeInTheDocument()
  })

  it('shows correct button text for edit mode', () => {
    render(<TaskModal {...defaultProps} mode="edit" />)
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(<TaskModal {...defaultProps} loading={true} />)
    
    const cancelButton = screen.getByText('Cancelar')
    const submitButton = screen.getByRole('button', { name: /salvando/i })
    const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
    
    expect(cancelButton).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(closeButton).toBeDisabled()
  })

  it('does not close on overlay click when loading', () => {
    const onClose = jest.fn()
    render(<TaskModal {...defaultProps} onClose={onClose} loading={true} />)
    
    const overlay = screen.getByRole('dialog').parentElement
    fireEvent.click(overlay!)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('passes correct props to TaskForm', () => {
    render(<TaskModal {...defaultProps} mode="edit" task={mockTask} loading={true} />)
    
    expect(screen.getByText('Mode: edit')).toBeInTheDocument()
    expect(screen.getByText('Loading: true')).toBeInTheDocument()
  })

  it('has proper modal structure and styling', () => {
    render(<TaskModal {...defaultProps} />)
    
    const modal = screen.getByText('Nova Tarefa').closest('.fixed')
    expect(modal).toHaveClass('inset-0', 'z-50', 'flex', 'items-center', 'justify-center')
    
    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('bg-white', 'rounded-xl', 'shadow-2xl', 'w-full', 'max-w-2xl')
  })
})