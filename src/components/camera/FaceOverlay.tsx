'use client';

import React, { useRef, useEffect, useMemo } from 'react';
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
  detectedFace: DetectedFace | null;
  selectedShade: Shade | null;
  facePosition: {
    isGood: boolean;
    message: string;
    center?: { x: number; y: number };
  };
  isMirrored: boolean;
  opacity?: number;
  isFaceDetected: boolean;
  videoWidth: number;
  videoHeight: number;
}

// Constants for face outline parts
const FACE_OUTLINE_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS_LANDMARKS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];

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
  
  // Parse selected shade color for efficient rendering
  const shadeColor = useMemo(() => {
    if (!selectedShade) return { r: 0, g: 0, b: 0, a: 0 };
    
    const hex = selectedShade.colorHex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
      a: opacity
    };
  }, [selectedShade, opacity]);
  
  // Main rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    if (videoWidth > 0 && videoHeight > 0) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    } else {
      // Use container dimensions as fallback
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Skip rendering if no face is detected or no shade is selected
    if (!detectedFace || !detectedFace.landmarks || !selectedShade) return;
    
    const landmarks = detectedFace.landmarks;
    
    // Draw face mask with selected shade
    drawFaceMask(ctx, landmarks, canvas.width, canvas.height, isMirrored, shadeColor);
    
    // Cut out eyes and lips
    cutOutFeature(ctx, landmarks, canvas.width, canvas.height, LEFT_EYE_LANDMARKS, isMirrored);
    cutOutFeature(ctx, landmarks, canvas.width, canvas.height, RIGHT_EYE_LANDMARKS, isMirrored);
    cutOutFeature(ctx, landmarks, canvas.width, canvas.height, LIPS_LANDMARKS, isMirrored);
  }, [detectedFace, selectedShade, videoWidth, videoHeight, shadeColor, isMirrored]);
  
  // Draw face mask with shade
  function drawFaceMask(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    width: number,
    height: number,
    isMirrored: boolean,
    color: { r: number, g: number, b: number, a: number }
  ) {
    ctx.save();
    
    // Apply mirroring if needed
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    
    // Draw face outline path
    ctx.beginPath();
    
    const firstPoint = landmarks[FACE_OUTLINE_LANDMARKS[0]];
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < FACE_OUTLINE_LANDMARKS.length; i++) {
      const point = landmarks[FACE_OUTLINE_LANDMARKS[i]];
      ctx.lineTo(point.x, point.y);
    }
    
    ctx.closePath();
    
    // Fill with the selected shade color
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    ctx.fill();
    
    ctx.restore();
  }
  
  // Cut out features like eyes and lips
  function cutOutFeature(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    width: number,
    height: number,
    featureLandmarks: number[],
    isMirrored: boolean
  ) {
    ctx.save();
    
    // Apply mirroring if needed
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    
    // Set composite operation to cut out
    ctx.globalCompositeOperation = 'destination-out';
    
    // Draw feature outline path
    ctx.beginPath();
    
    const firstPoint = landmarks[featureLandmarks[0]];
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < featureLandmarks.length; i++) {
      const point = landmarks[featureLandmarks[i]];
      ctx.lineTo(point.x, point.y);
    }
    
    ctx.closePath();
    
    // Fill with black to cut out the feature
    ctx.fillStyle = 'black';
    ctx.fill();
    
    ctx.restore();
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
} 