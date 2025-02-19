import { render, screen, fireEvent } from '@testing-library/react';
import MainLayout from '../MainLayout';

// Mock the store
jest.mock('../../../store/FaceDetectionStore', () => ({
  useFaceDetectionStore: () => ({
    delegate: 'GPU',
    maxFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFaceTrackingConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    inferenceTime: 0,
    setDelegate: jest.fn(),
    setMaxFaces: jest.fn(),
    setMinFaceDetectionConfidence: jest.fn(),
    setMinFaceTrackingConfidence: jest.fn(),
    setMinFacePresenceConfidence: jest.fn(),
  }),
}));

// Mock child components
jest.mock('../../camera/FaceDetectionCamera', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-camera">Camera View</div>,
}));

jest.mock('../../gallery/GalleryView', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-gallery">Gallery View</div>,
}));

describe('MainLayout', () => {
  it('renders navigation items', () => {
    render(<MainLayout />);
    
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('switches views when clicking navigation items', () => {
    render(<MainLayout />);
    
    // Should start with camera view
    expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    
    // Click gallery
    fireEvent.click(screen.getByText('Gallery'));
    expect(screen.getByTestId('mock-gallery')).toBeInTheDocument();
  });

  it('shows permissions handler when no permissions', () => {
    // Mock permissions state
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [false, jest.fn()]);
    
    render(<MainLayout />);
    
    expect(screen.getByText(/camera permission required/i)).toBeInTheDocument();
  });
}); 