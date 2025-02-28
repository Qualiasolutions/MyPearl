export interface FacePositionType {
  isGood: boolean;
  message: string;
  center?: { x: number; y: number };
}

export interface FaceDetectionResult {
  landmarks: any;
  boundingBox?: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  };
} 