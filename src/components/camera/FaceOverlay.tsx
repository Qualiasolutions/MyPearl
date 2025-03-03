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

interface FacePosition {
  isGood: boolean;
  message: string;
  center?: { x: number; y: number };
}

interface Props {
  detectedFace: DetectedFace | null;
  selectedShade: Shade | null;
  facePosition: FacePosition;
  isMirrored: boolean;
  opacity: number;
  isFaceDetected: boolean;
  videoWidth: number;
  videoHeight: number;
}

// Constants for face outline parts - optimized landmarks for better mapping
const FACE_OUTLINE_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS_LANDMARKS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];

// Enhanced concealer-specific landmarks for a more natural look
const UNDER_EYE_LEFT = [247, 30, 29, 27, 28, 56, 190, 243, 112, 117, 118, 119, 120, 121, 128, 126, 25, 110, 24, 23, 22, 26, 112];
const UNDER_EYE_RIGHT = [467, 260, 259, 257, 258, 286, 414, 463, 341, 346, 347, 348, 349, 350, 357, 359, 255, 339, 254, 253, 252, 256, 341];
const FOREHEAD = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 67, 109, 10];
const NASOLABIAL_LEFT = [36, 205, 50, 116, 123, 147, 213, 177, 83];
const NASOLABIAL_RIGHT = [266, 425, 280, 345, 352, 376, 433, 397, 313];
const CHIN = [18, 200, 199, 175, 152, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

// Cheek areas for better shade application
const LEFT_CHEEK = [123, 50, 36, 49, 48, 115, 131, 142, 214, 212, 216, 206, 203, 129, 114, 121, 120, 119, 118, 117, 111, 116, 123];
const RIGHT_CHEEK = [352, 280, 266, 279, 278, 344, 353, 363, 434, 432, 436, 426, 423, 358, 343, 351, 350, 349, 348, 347, 346, 345, 352];

export default function FaceOverlay({ 
  detectedFace, 
  selectedShade, 
  facePosition,
  isMirrored, 
  opacity = 0.65,
  isFaceDetected,
  videoWidth,
  videoHeight
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Parse the shade color to get RGBA values with better alpha handling
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
          parts[4] ? parseFloat(parts[4]) * opacity : opacity // Multiply by the passed opacity for better control
        ];
      }
    }
    // Default fallback
    return [245, 230, 224, opacity];
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Clear canvas for new rendering
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only render shade if face is detected and shade is selected
    if (detectedFace && selectedShade && isFaceDetected) {
      renderCanvas();
    } else {
      // Draw face position guide if no shade is applied
      if (facePosition.center && !selectedShade) {
        drawFacePositionGuide(ctx, facePosition);
      }
    }
  }, [detectedFace, selectedShade, isFaceDetected, opacity, isMirrored, videoWidth, videoHeight, facePosition]);
  
  // Draw a guide to help users position their face
  const drawFacePositionGuide = (
    ctx: CanvasRenderingContext2D, 
    facePosition: FacePosition
  ) => {
    if (!facePosition.center) return;
    
    // Draw a circle around the detected face
    const { x, y } = facePosition.center;
    const radius = videoHeight * 0.15; // Adjust size based on video height
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = facePosition.isGood ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw crosshair for center targeting
    if (!facePosition.isGood) {
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(x - radius / 2, y);
      ctx.lineTo(x + radius / 2, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, y - radius / 2);
      ctx.lineTo(x, y + radius / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };
  
  const getShadeColor = (): string => {
    return selectedShade ? selectedShade.colorHex : 'rgba(255, 255, 255, 0)';
  };
  
  // Handle canvas drawing with requestAnimationFrame for smoother rendering
  const renderCanvas = () => {
    let animationFrameId: number;
    
    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || !detectedFace || !detectedFace.landmarks) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get dimensions
      const { box } = detectedFace;
      const landmarks = detectedFace.landmarks;
      
      // Set dimensions
      const videoWidth = canvas.width;
      const videoHeight = canvas.height;
      
      // Get RGBA components
      const [r, g, b, a] = getRGBAComponents(getShadeColor());
      
      // Apply the mask with mirroring support
      renderConcealerMask(ctx, landmarks, videoWidth, videoHeight, 1, 0, 0, r, g, b, a, isMirrored);
      
      // Apply targeted concealer for more natural look
      applyTargetedConcealer(ctx, landmarks, LEFT_CHEEK, videoWidth, videoHeight, 1, 0, 0, r, g, b, a * 0.8, isMirrored);
      applyTargetedConcealer(ctx, landmarks, RIGHT_CHEEK, videoWidth, videoHeight, 1, 0, 0, r, g, b, a * 0.8, isMirrored);
      
      // Cut out eyes and lips
      cutoutFacialFeature(ctx, landmarks, LEFT_EYE_LANDMARKS, videoWidth, videoHeight, 1, 0, 0, isMirrored);
      cutoutFacialFeature(ctx, landmarks, RIGHT_EYE_LANDMARKS, videoWidth, videoHeight, 1, 0, 0, isMirrored);
      cutoutFacialFeature(ctx, landmarks, LIPS_LANDMARKS, videoWidth, videoHeight, 1, 0, 0, isMirrored);
      
      // Apply additional effects for a more natural look
      applyTextureEffect(ctx, videoWidth, videoHeight, 0.03);
      
      // Request next frame for smooth animation if face is detected
      if (isFaceDetected) {
        animationFrameId = requestAnimationFrame(renderCanvas);
      }
    };
    
    // Start rendering loop
    renderCanvas();
    
    // Cleanup on unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  };
  
  // Render concealer mask with improved blending
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
    a: number,
    isMirrored: boolean
  ) => {
    if (!landmarks || landmarks.length === 0) return;
    
    ctx.save();
    
    // Apply mirroring if needed
    if (isMirrored) {
      ctx.translate(imageWidth, 0);
      ctx.scale(-1, 1);
    }
    
    // Begin a path for the face mask
    ctx.beginPath();
    
    // Start from the first point of the face outline
    const startLandmark = landmarks[FACE_OUTLINE_LANDMARKS[0]];
    const startX = startLandmark.x * scaleFactor + offsetX;
    const startY = startLandmark.y * scaleFactor + offsetY;
    
    ctx.moveTo(startX, startY);
    
    // Draw the face outline
    for (let i = 1; i < FACE_OUTLINE_LANDMARKS.length; i++) {
      const landmark = landmarks[FACE_OUTLINE_LANDMARKS[i]];
      const x = landmark.x * scaleFactor + offsetX;
      const y = landmark.y * scaleFactor + offsetY;
      
      // Use quadratic curves for smoother edges
      if (i % 2 === 0 && i < FACE_OUTLINE_LANDMARKS.length - 1) {
        const nextLandmark = landmarks[FACE_OUTLINE_LANDMARKS[i + 1]];
        const nextX = nextLandmark.x * scaleFactor + offsetX;
        const nextY = nextLandmark.y * scaleFactor + offsetY;
        
        const controlX = (x + nextX) / 2;
        const controlY = (y + nextY) / 2;
        
        ctx.quadraticCurveTo(x, y, controlX, controlY);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Close the path
    ctx.closePath();
    
    // Fill with the selected shade color
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fill();
    
    // Use composite operation for smoother blending
    ctx.globalCompositeOperation = "source-atop";
    
    // Apply a gradient for more natural look
    const gradient = ctx.createRadialGradient(
      imageWidth / 2, imageHeight / 2, 0,
      imageWidth / 2, imageHeight / 2, imageWidth / 2
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
    gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${a * 0.9})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a * 0.7})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  };
  
  // Improved cutout for facial features with antialiasing
  const cutoutFacialFeature = (
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    featureLandmarks: number[],
    imageWidth: number,
    imageHeight: number,
    scaleFactor: number,
    offsetX: number,
    offsetY: number,
    isMirrored: boolean
  ) => {
    if (!landmarks || landmarks.length === 0) return;
    
    ctx.save();
    
    // Apply mirroring if needed
    if (isMirrored) {
      ctx.translate(imageWidth, 0);
      ctx.scale(-1, 1);
    }
    
    // Set composite operation to cut out
    ctx.globalCompositeOperation = 'destination-out';
    
    // Begin path for feature
    ctx.beginPath();
    
    // Start from the first point
    const startLandmark = landmarks[featureLandmarks[0]];
    const startX = startLandmark.x * scaleFactor + offsetX;
    const startY = startLandmark.y * scaleFactor + offsetY;
    
    ctx.moveTo(startX, startY);
    
    // Draw the feature outline with bezier curves for smoother edges
    for (let i = 1; i < featureLandmarks.length; i++) {
      const landmark = landmarks[featureLandmarks[i]];
      const x = landmark.x * scaleFactor + offsetX;
      const y = landmark.y * scaleFactor + offsetY;
      
      if (i % 2 === 0 && i < featureLandmarks.length - 1) {
        const nextLandmark = landmarks[featureLandmarks[i + 1]];
        const nextX = nextLandmark.x * scaleFactor + offsetX;
        const nextY = nextLandmark.y * scaleFactor + offsetY;
        
        const controlX = (x + nextX) / 2;
        const controlY = (y + nextY) / 2;
        
        ctx.quadraticCurveTo(x, y, controlX, controlY);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Close the path
    ctx.closePath();
    
    // Fill with a gradient for feathered edges
    const featherSize = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = featherSize;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fill();
    
    ctx.restore();
  };
  
  // Enhanced targeted concealer application with better blending
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
    a: number,
    isMirrored: boolean
  ) => {
    if (!landmarks || landmarks.length === 0) return;
    
    ctx.save();
    
    // Apply mirroring if needed
    if (isMirrored) {
      ctx.translate(imageWidth, 0);
      ctx.scale(-1, 1);
    }
    
    // Set blend mode for better integration
    ctx.globalCompositeOperation = "source-over";
    
    // Begin path for the target area
    ctx.beginPath();
    
    // Start from the first point
    const startLandmark = landmarks[targetLandmarks[0]];
    const startX = startLandmark.x * scaleFactor + offsetX;
    const startY = startLandmark.y * scaleFactor + offsetY;
    
    ctx.moveTo(startX, startY);
    
    // Draw the target area with bezier curves
    for (let i = 1; i < targetLandmarks.length; i++) {
      const landmark = landmarks[targetLandmarks[i]];
      const x = landmark.x * scaleFactor + offsetX;
      const y = landmark.y * scaleFactor + offsetY;
      
      if (i % 2 === 0 && i < targetLandmarks.length - 1) {
        const nextLandmark = landmarks[targetLandmarks[i + 1]];
        const nextX = nextLandmark.x * scaleFactor + offsetX;
        const nextY = nextLandmark.y * scaleFactor + offsetY;
        
        const controlX = (x + nextX) / 2;
        const controlY = (y + nextY) / 2;
        
        ctx.quadraticCurveTo(x, y, controlX, controlY);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Close the path
    ctx.closePath();
    
    // Fill with color
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    
    // Add feathered edges
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${a/4})`;
    ctx.shadowBlur = 15;
    ctx.fill();
    
    ctx.restore();
  };
  
  // Improved texture effect for a more realistic finish
  const applyTextureEffect = (
    ctx: CanvasRenderingContext2D,
    imageWidth: number,
    imageHeight: number,
    intensity: number
  ) => {
    // Save current composite operation
    const currentComposite = ctx.globalCompositeOperation;
    
    // Set blend mode for texture
    ctx.globalCompositeOperation = "overlay";
    
    // Apply a subtle noise texture
    for (let x = 0; x < imageWidth; x += 4) {
      for (let y = 0; y < imageHeight; y += 4) {
        const value = Math.random() * intensity;
        ctx.fillStyle = `rgba(255, 255, 255, ${value})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    
    // Restore previous composite operation
    ctx.globalCompositeOperation = currentComposite;
  };
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 w-full h-full pointer-events-none"
    />
  );
}

// We'll need to define these connections
const FACE_LANDMARKS_CONNECTORS = [
  // ... face landmark connection pairs
]; 