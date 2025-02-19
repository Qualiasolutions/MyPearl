import '@testing-library/jest-dom';

// Mock canvas
const mockContext = {
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext); 