import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage } from '../ErrorMessage'

describe('ErrorMessage Component', () => {
  it('renders error message with default variant', () => {
    render(<ErrorMessage message="Something went wrong" />)
    
    const message = screen.getByText('Something went wrong')
    const container = message.closest('div')
    const icon = container?.querySelector('svg')
    
    expect(message).toBeInTheDocument()
    expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
    expect(icon).toBeInTheDocument()
  })

  it('renders with default variant when specified', () => {
    render(<ErrorMessage message="Warning message" variant="default" />)
    
    const container = screen.getByText('Warning message').closest('div')
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800')
  })

  it('renders with destructive variant', () => {
    render(<ErrorMessage message="Error message" variant="destructive" />)
    
    const container = screen.getByText('Error message').closest('div')
    expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
  })

  it('renders without dismiss button when onDismiss is not provided', () => {
    render(<ErrorMessage message="No dismiss button" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders with dismiss button when onDismiss is provided', () => {
    const handleDismiss = jest.fn()
    render(<ErrorMessage message="With dismiss" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    expect(dismissButton).toBeInTheDocument()
    expect(dismissButton.querySelector('svg')).toBeInTheDocument() // X icon
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = jest.fn()
    render(<ErrorMessage message="Dismissible" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    fireEvent.click(dismissButton)
    
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<ErrorMessage message="Custom class" className="custom-error" />)
    
    const container = screen.getByText('Custom class').closest('div')
    expect(container).toHaveClass('custom-error')
  })

  it('maintains base classes with custom className', () => {
    render(<ErrorMessage message="Base classes" className="additional-class" />)
    
    const container = screen.getByText('Base classes').closest('div')
    expect(container).toHaveClass(
      'flex', 
      'items-center', 
      'gap-3', 
      'p-4', 
      'border', 
      'rounded-lg',
      'additional-class'
    )
  })

  it('displays AlertCircle icon', () => {
    render(<ErrorMessage message="Icon test" />)
    
    const container = screen.getByText('Icon test').closest('div')
    const alertIcon = container?.querySelector('svg')
    
    expect(alertIcon).toBeInTheDocument()
    expect(alertIcon).toHaveClass('w-5', 'h-5', 'flex-shrink-0')
  })

  it('has proper accessibility structure', () => {
    render(<ErrorMessage message="Accessibility test" />)
    
    const message = screen.getByText('Accessibility test')
    expect(message).toHaveClass('flex-1', 'text-sm', 'font-medium')
  })

  it('dismiss button has hover styles', () => {
    const handleDismiss = jest.fn()
    render(<ErrorMessage message="Hover test" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    expect(dismissButton).toHaveClass('hover:bg-black/10', 'rounded', 'transition-colors')
  })
})