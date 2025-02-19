import { render } from '@testing-library/react';
import FaceOverlay from '../FaceOverlay';

describe('FaceOverlay', () => {
  it('renders canvas element', () => {
    const { container } = render(
      <FaceOverlay
        landmarks={[]}
        imageWidth={640}
        imageHeight={480}
        mode="livestream"
      />
    );

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('draws landmarks when provided', () => {
    const mockLandmarks = [
      { x: 0.5, y: 0.5, z: 0 },
      { x: 0.6, y: 0.6, z: 0 }
    ];

    const { container } = render(
      <FaceOverlay
        landmarks={mockLandmarks}
        imageWidth={640}
        imageHeight={480}
        mode="livestream"
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
}); 