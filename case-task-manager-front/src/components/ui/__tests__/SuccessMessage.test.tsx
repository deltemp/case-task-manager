import { render, screen, fireEvent } from '@testing-library/react'
import { SuccessMessage } from '../SuccessMessage'

describe('SuccessMessage Component', () => {
  it('renders success message', () => {
    render(<SuccessMessage message="Operation completed successfully" />)
    
    const message = screen.getByText('Operation completed successfully')
    const container = message.closest('div')
    const icon = container?.querySelector('svg')
    
    expect(message).toBeInTheDocument()
    expect(container).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
    expect(icon).toBeInTheDocument()
  })

  it('renders without dismiss button when onDismiss is not provided', () => {
    render(<SuccessMessage message="No dismiss button" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders with dismiss button when onDismiss is provided', () => {
    const handleDismiss = jest.fn()
    render(<SuccessMessage message="With dismiss" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    expect(dismissButton).toBeInTheDocument()
    expect(dismissButton.querySelector('svg')).toBeInTheDocument() // X icon
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = jest.fn()
    render(<SuccessMessage message="Dismissible" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    fireEvent.click(dismissButton)
    
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<SuccessMessage message="Custom class" className="custom-success" />)
    
    const container = screen.getByText('Custom class').closest('div')
    expect(container).toHaveClass('custom-success')
  })

  it('maintains base classes with custom className', () => {
    render(<SuccessMessage message="Base classes" className="additional-class" />)
    
    const container = screen.getByText('Base classes').closest('div')
    expect(container).toHaveClass(
      'flex', 
      'items-center', 
      'gap-3', 
      'p-4', 
      'border', 
      'rounded-lg',
      'bg-green-50',
      'border-green-200',
      'text-green-800',
      'additional-class'
    )
  })

  it('displays CheckCircle icon', () => {
    render(<SuccessMessage message="Icon test" />)
    
    const container = screen.getByText('Icon test').closest('div')
    const checkIcon = container?.querySelector('svg')
    
    expect(checkIcon).toBeInTheDocument()
    expect(checkIcon).toHaveClass('w-5', 'h-5', 'flex-shrink-0')
  })

  it('has proper accessibility structure', () => {
    render(<SuccessMessage message="Accessibility test" />)
    
    const message = screen.getByText('Accessibility test')
    expect(message).toHaveClass('flex-1', 'text-sm', 'font-medium')
  })

  it('dismiss button has hover styles', () => {
    const handleDismiss = jest.fn()
    render(<SuccessMessage message="Hover test" onDismiss={handleDismiss} />)
    
    const dismissButton = screen.getByRole('button')
    expect(dismissButton).toHaveClass('hover:bg-black/10', 'rounded', 'transition-colors')
  })

  it('has consistent styling with success theme', () => {
    render(<SuccessMessage message="Success styling" />)
    
    const container = screen.getByText('Success styling').closest('div')
    expect(container).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
  })
})