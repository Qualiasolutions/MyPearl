'use client';

import React, { useRef, useEffect } from 'react';
import { useFaceDetectionStore } from '@/store/FaceDetectionStore';
import { Shade } from '@/types/shades';

interface DetectedFace {
  box: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
    xMax?: number;
    yMax?: number;
  };
  landmarks?: Array<{ x: number; y: number; z: number }>;
  boundingBox?: {
    topLeft: number[];
    bottomRight: number[];
  };
}

interface Props {
  detectedFace: DetectedFace;
  selectedShade: Shade;
  isMirrored: boolean;
  opacity: number;
}

// Constants for face outline parts
const FACE_OUTLINE_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS_LANDMARKS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];

// Concealer-specific landmarks for targeted areas
const UNDER_EYE_LEFT = [247, 30, 29, 27, 28, 56, 190, 243, 112, 117, 118, 119, 120, 121, 128, 126, 25, 110, 24, 23, 22, 26, 112];
const UNDER_EYE_RIGHT = [467, 260, 259, 257, 258, 286, 414, 463, 341, 346, 347, 348, 349, 350, 357, 359, 255, 339, 254, 253, 252, 256, 341];
const FOREHEAD = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 67, 109, 10];
const NASOLABIAL_LEFT = [36, 205, 50, 116, 123, 147, 213, 177, 83];
const NASOLABIAL_RIGHT = [266, 425, 280, 345, 352, 376, 433, 397, 313];
const CHIN = [18, 200, 199, 175, 152, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

export default function FaceOverlay({ detectedFace, selectedShade, isMirrored, opacity = 0.65 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isFaceDetected } = useFaceDetectionStore();
  
  // Parse the shade color to get RGBA values
  const getRGBAComponents = (color: string): [number, number, number, number] => {
    // Handle hex format
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return [r, g, b, opacity];
    }
    // Handle rgb/rgba format
    else if (color.startsWith('rgb')) {
      const parts = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
      if (parts) {
        return [
          parseInt(parts[1]),
          parseInt(parts[2]),
          parseInt(parts[3]),
          opacity // Use the passed opacity
        ];
      }
    }
    // Default fallback
    return [245, 230, 224, opacity]; // Default light peach color
  };
  
  // Extract color from shader
  const getShadeColor = (): string => {
    // The Shade type uses colorHex, not color
    return selectedShade.colorHex;
  };
  
  // Handle canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !detectedFace || !detectedFace.landmarks) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get dimensions from box
    const { box } = detectedFace;
    const landmarks = detectedFace.landmarks;
    
    // Calculate scaling and offsets
    const videoWidth = canvas.width;
    const videoHeight = canvas.height;
    
    // Set dimensions
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Get RGBA components
    const [r, g, b, a] = getRGBAComponents(getShadeColor());
    
    // Apply the mask
    renderConcealerMask(ctx, landmarks, videoWidth, videoHeight, 1, 0, 0, r, g, b, a);
    
    // Cut out eyes and lips
    cutoutFacialFeature(ctx, landmarks, LEFT_EYE_LANDMARKS, videoWidth, videoHeight, 1, 0, 0);
    cutoutFacialFeature(ctx, landmarks, RIGHT_EYE_LANDMARKS, videoWidth, videoHeight, 1, 0, 0);
    cutoutFacialFeature(ctx, landmarks, LIPS_LANDMARKS, videoWidth, videoHeight, 1, 0, 0);
    
    // Apply additional effects for a more natural look
    applyTextureEffect(ctx, videoWidth, videoHeight, 0.03);
    
  }, [detectedFace, selectedShade, opacity]);
  
  // Render concealer mask
  const renderConcealerMask = (
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    imageWidth: number,
    imageHeight: number,
    scaleFactor: number,
    offsetX: number,
    offsetY: number,
    r: number,
    g: number,
    b: number,
    a: number
  ) => {
    // Save context state
    ctx.save();
    
    // Create a clipping path for the face area
    ctx.beginPath();
    
    // Draw face outline path
    FACE_OUTLINE_LANDMARKS.forEach((index, i) => {
      const point = landmarks[index];
      if (!point) return;
      
      const x = point.x * scaleFactor + offsetX;
      const y = point.y * scaleFactor + offsetY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.clip();
    
    // Fill with concealer color
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillRect(0, 0, imageWidth, imageHeight);
    
    // Apply targeted concealer to specific areas
    applyTargetedConcealer(ctx, landmarks, UNDER_EYE_LEFT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a + 0.1);
    applyTargetedConcealer(ctx, landmarks, UNDER_EYE_RIGHT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a + 0.1);
    applyTargetedConcealer(ctx, landmarks, NASOLABIAL_LEFT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a + 0.05);
    applyTargetedConcealer(ctx, landmarks, NASOLABIAL_RIGHT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a + 0.05);
    
    // Restore context
    ctx.restore();
  };
  
  // Helper function to cut out facial features
  const cutoutFacialFeature = (
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    featureLandmarks: number[],
    imageWidth: number,
    imageHeight: number,
    scaleFactor: number,
    offsetX: number,
    offsetY: number
  ) => {
    ctx.save();
    
    // Set composite operation to destination-out to cut out the feature
    ctx.globalCompositeOperation = 'destination-out';
    
    // Draw feature path
    ctx.beginPath();
    featureLandmarks.forEach((index, i) => {
      const point = landmarks[index];
      if (!point) return;
      
      const x = point.x * scaleFactor + offsetX;
      const y = point.y * scaleFactor + offsetY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };
  
  // Apply targeted concealer to specific face areas
  const applyTargetedConcealer = (
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    targetLandmarks: number[],
    imageWidth: number,
    imageHeight: number,
    scaleFactor: number,
    offsetX: number,
    offsetY: number,
    r: number,
    g: number,
    b: number,
    a: number
  ) => {
    ctx.save();
    
    // Draw targeted area
    ctx.beginPath();
    targetLandmarks.forEach((index, i) => {
      const point = landmarks[index];
      if (!point) return;
      
      const x = point.x * scaleFactor + offsetX;
      const y = point.y * scaleFactor + offsetY;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    
    // Fill with slightly increased opacity
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fill();
    
    ctx.restore();
  };
  
  // Add texture effect for more natural look
  const applyTextureEffect = (
    ctx: CanvasRenderingContext2D,
    imageWidth: number,
    imageHeight: number,
    intensity: number
  ) => {
    // Add a subtle noise texture for more realistic appearance
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Skip fully transparent pixels
      if (data[i + 3] === 0) continue;
      
      // Add subtle random variation to each color channel
      const noise = Math.random() * intensity * 255;
      data[i] = Math.min(255, Math.max(0, data[i] + noise - (intensity * 255) / 2));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise - (intensity * 255) / 2));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - (intensity * 255) / 2));
    }
    
    ctx.putImageData(imageData, 0, 0);
  };
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-30 pointer-events-none"
      style={{
        transform: isMirrored ? 'scaleX(-1)' : 'none'
      }}
    />
  );
}

// We'll need to define these connections
const FACE_LANDMARKS_CONNECTORS = [
  // ... face landmark connection pairs
]; 