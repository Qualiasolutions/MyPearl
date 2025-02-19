import { render, screen, fireEvent, act } from '@testing-library/react';
import PermissionsHandler from '../PermissionsHandler';

describe('PermissionsHandler', () => {
  const mockOnPermissionGranted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permission request screen', () => {
    render(<PermissionsHandler onPermissionGranted={mockOnPermissionGranted} />);
    
    expect(screen.getByText(/camera permission required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /allow camera/i })).toBeInTheDocument();
  });

  it('handles permission grant', async () => {
    // Mock getUserMedia
    const mockGetUserMedia = jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
    
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    render(<PermissionsHandler onPermissionGranted={mockOnPermissionGranted} />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /allow camera/i }));
    });

    expect(mockOnPermissionGranted).toHaveBeenCalled();
  });

  it('handles permission denial', async () => {
    // Mock getUserMedia to reject
    const mockGetUserMedia = jest.fn().mockRejectedValue(new Error('Permission denied'));
    
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    render(<PermissionsHandler onPermissionGranted={mockOnPermissionGranted} />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /allow camera/i }));
    });

    expect(screen.getByText(/camera access was denied/i)).toBeInTheDocument();
  });
}); 