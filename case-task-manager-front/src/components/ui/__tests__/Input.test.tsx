import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input Component', () => {
  it('renders basic input', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-lg')
  })

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />)
    const label = screen.getByText('Username')
    const input = screen.getByPlaceholderText('Enter username')
    
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', input.id)
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-neutral-700')
  })

  it('renders with error message', () => {
    render(<Input error="This field is required" placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    const errorMessage = screen.getByText('This field is required')
    
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveClass('text-sm', 'text-red-600')
    expect(input).toHaveClass('border-red-500', 'focus:ring-red-400')
  })

  it('renders with helper text', () => {
    render(<Input helperText="This is a helpful hint" placeholder="Enter text" />)
    const helperText = screen.getByText('This is a helpful hint')
    
    expect(helperText).toBeInTheDocument()
    expect(helperText).toHaveClass('text-sm', 'text-neutral-500')
  })

  it('prioritizes error over helper text', () => {
    render(
      <Input 
        error="Error message" 
        helperText="Helper text" 
        placeholder="Enter text" 
      />
    )
    
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
  })

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" placeholder="Number" />)
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number')
  })

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} placeholder="Type here" />)
    const input = screen.getByPlaceholderText('Type here')
    
    fireEvent.change(input, { target: { value: 'test value' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('test value')
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    render(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        placeholder="Focus test" 
      />
    )
    const input = screen.getByPlaceholderText('Focus test')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />)
    expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} placeholder="Ref test" />)
    expect(ref).toHaveBeenCalled()
  })

  it('uses custom id when provided', () => {
    render(<Input id="custom-id" label="Custom ID" />)
    const input = screen.getByRole('textbox')
    const label = screen.getByText('Custom ID')
    
    expect(input).toHaveAttribute('id', 'custom-id')
    expect(label).toHaveAttribute('for', 'custom-id')
  })

  it('generates unique id when not provided', () => {
    render(<Input label="Auto ID" />)
    const input = screen.getByRole('textbox')
    const label = screen.getByText('Auto ID')
    
    expect(input.id).toBeTruthy()
    expect(label).toHaveAttribute('for', input.id)
  })
})