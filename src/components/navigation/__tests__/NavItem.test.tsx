import { render, screen, fireEvent } from '@testing-library/react';
import NavItem from '../NavItem';
import { Camera } from 'lucide-react';

describe('NavItem', () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    icon: Camera,
    label: 'Test Label',
    isActive: false,
    onClick: mockOnClick,
  };

  it('renders correctly', () => {
    render(<NavItem {...defaultProps} />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('text-gold');
  });

  it('shows active state correctly', () => {
    render(<NavItem {...defaultProps} isActive={true} />);
    
    expect(screen.getByRole('button')).toHaveClass('text-white');
  });

  it('calls onClick when clicked', () => {
    render(<NavItem {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
}); 