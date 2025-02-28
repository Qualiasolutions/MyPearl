'use client';

import React, { useRef, useEffect } from 'react';
import { useFaceDetectionStore } from '@/store/FaceDetectionStore';

interface Props {
  landmarks?: Array<{ x: number; y: number; z: number }>;
  imageWidth: number;
  imageHeight: number;
  mode: 'image' | 'video' | 'livestream';
  shade?: string;
  opacity?: number;
}

// Constants for face outline parts
const FACE_OUTLINE_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS_LANDMARKS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];

export default function FaceOverlay({ landmarks, imageWidth, imageHeight, mode, shade = 'rgba(255, 220, 200, 0.5)', opacity = 0.65 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !landmarks || landmarks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor
    const scaleFactor = mode === 'livestream' 
      ? Math.max(canvas.width / imageWidth, canvas.height / imageHeight)
      : Math.min(canvas.width / imageWidth, canvas.height / imageHeight);

    // Calculate offsets to center the drawing
    const offsetX = (canvas.width - imageWidth * scaleFactor) / 2;
    const offsetY = (canvas.height - imageHeight * scaleFactor) / 2;

    // Draw face shade with improved blending
    if (shade && landmarks.length > 100) { // Make sure we have enough landmarks
      applyShadeWithBlending(ctx, landmarks, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, shade, opacity);
    }
  }, [landmarks, imageWidth, imageHeight, mode, shade, opacity]);

  // Function to apply shade with improved blending
  const applyShadeWithBlending = (
    ctx: CanvasRenderingContext2D, 
    landmarks: Array<{ x: number; y: number; z: number }>, 
    imageWidth: number, 
    imageHeight: number,
    scaleFactor: number,
    offsetX: number,
    offsetY: number,
    shadeColor: string,
    opacity: number
  ) => {
    // Create face mask
    ctx.save();
    
    // Draw face outline as a path
    ctx.beginPath();
    
    // Map the first point of face outline
    const firstPoint = landmarks[FACE_OUTLINE_LANDMARKS[0]];
    const firstX = firstPoint.x * imageWidth * scaleFactor + offsetX;
    const firstY = firstPoint.y * imageHeight * scaleFactor + offsetY;
    ctx.moveTo(firstX, firstY);
    
    // Map the rest of the face outline points
    for (let i = 1; i < FACE_OUTLINE_LANDMARKS.length; i++) {
      const landmark = landmarks[FACE_OUTLINE_LANDMARKS[i]];
      const x = landmark.x * imageWidth * scaleFactor + offsetX;
      const y = landmark.y * imageHeight * scaleFactor + offsetY;
      
      if (i === 1) {
        ctx.lineTo(x, y);
      } else {
        const prevLandmark = landmarks[FACE_OUTLINE_LANDMARKS[i-1]];
        const prevX = prevLandmark.x * imageWidth * scaleFactor + offsetX;
        const prevY = prevLandmark.y * imageHeight * scaleFactor + offsetY;
        
        // Use quadratic curves for smoother edges
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
      }
    }
    ctx.closePath();
    
    // Create gradient for more natural blending
    const centerX = imageWidth * scaleFactor / 2 + offsetX;
    const centerY = imageHeight * scaleFactor / 2 + offsetY;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, imageWidth * 0.3 * scaleFactor
    );
    
    // Parse the RGBA values from the shade color
    let r = 255, g = 220, b = 200, a = opacity;
    if (shadeColor.startsWith('rgba(')) {
      const parts = shadeColor.replace('rgba(', '').replace(')', '').split(',');
      r = parseInt(parts[0].trim());
      g = parseInt(parts[1].trim());
      b = parseInt(parts[2].trim());
      a = parseFloat(parts[3].trim()) * opacity;
    } else if (shadeColor.startsWith('rgb(')) {
      const parts = shadeColor.replace('rgb(', '').replace(')', '').split(',');
      r = parseInt(parts[0].trim());
      g = parseInt(parts[1].trim());
      b = parseInt(parts[2].trim());
    }
    
    // Create gradient stops for more realistic skin tone blending
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${a * 0.9})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a * 0.5})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Create cutouts for eyes and lips
    cutoutFacialFeature(ctx, landmarks, LEFT_EYE_LANDMARKS, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
    cutoutFacialFeature(ctx, landmarks, RIGHT_EYE_LANDMARKS, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
    cutoutFacialFeature(ctx, landmarks, LIPS_LANDMARKS, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
    
    ctx.restore();
  };
  
  // Function to create cutouts for facial features
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
    if (featureLandmarks.length === 0) return;
    
    ctx.beginPath();
    
    // Map the first point
    const firstPoint = landmarks[featureLandmarks[0]];
    const firstX = firstPoint.x * imageWidth * scaleFactor + offsetX;
    const firstY = firstPoint.y * imageHeight * scaleFactor + offsetY;
    ctx.moveTo(firstX, firstY);
    
    // Map the rest of the points with smoothing
    for (let i = 1; i < featureLandmarks.length; i++) {
      const landmark = landmarks[featureLandmarks[i]];
      const x = landmark.x * imageWidth * scaleFactor + offsetX;
      const y = landmark.y * imageHeight * scaleFactor + offsetY;
      
      const prevLandmark = landmarks[featureLandmarks[i-1]];
      const prevX = prevLandmark.x * imageWidth * scaleFactor + offsetX;
      const prevY = prevLandmark.y * imageHeight * scaleFactor + offsetY;
      
      // Use quadratic curves for smoother edges
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
    }
    
    // Connect back to the first point
    const lastPoint = landmarks[featureLandmarks[featureLandmarks.length - 1]];
    const lastX = lastPoint.x * imageWidth * scaleFactor + offsetX;
    const lastY = lastPoint.y * imageHeight * scaleFactor + offsetY;
    ctx.quadraticCurveTo(lastX, lastY, firstX, firstY);
    
    ctx.closePath();
    // Use "destination-out" to create a cutout
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ 
        width: imageWidth, 
        height: imageHeight,
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
}

// We'll need to define these connections
const FACE_LANDMARKS_CONNECTORS = [
  // ... face landmark connection pairs
]; 