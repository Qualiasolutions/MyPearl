import { render, screen, act } from '@testing-library/react';
import FaceDetectionCamera from '../FaceDetectionCamera';
import '@tensorflow/tfjs-core';

// Mock TensorFlow.js and face-landmarks-detection
jest.mock('@tensorflow/tfjs-core', () => ({
  ready: jest.fn().mockResolvedValue(true),
  setBackend: jest.fn().mockResolvedValue(true),
}));

jest.mock('@tensorflow-models/face-landmarks-detection', () => ({
  createDetector: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn().mockResolvedValue([])
  }),
  SupportedModels: {
    MediaPipeFaceMesh: 'MediaPipeFaceMesh'
  }
}));

describe('FaceDetectionCamera', () => {
  it('initializes camera and face detection', async () => {
    await act(async () => {
      render(<FaceDetectionCamera />);
    });

    // Should show loading initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles face detection states', async () => {
    await act(async () => {
      render(<FaceDetectionCamera />);
    });

    // Should update face status
    expect(screen.getByText(/keep your face inside/i)).toBeInTheDocument();
  });
}); 