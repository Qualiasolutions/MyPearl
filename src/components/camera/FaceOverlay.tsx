'use client';

import React, { useRef, useEffect } from 'react';
import { useFaceDetectionStore } from '@/store/FaceDetectionStore';

interface Props {
  landmarks?: Array<{ x: number; y: number; z: number }>;
  imageWidth: number;
  imageHeight: number;
  mode: 'image' | 'video' | 'livestream';
}

export default function FaceOverlay({ landmarks, imageWidth, imageHeight, mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const LANDMARK_STROKE_WIDTH = 8;

  useEffect(() => {
    if (!canvasRef.current || !landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor
    const scaleFactor = mode === 'livestream' 
      ? Math.max(canvas.width / imageWidth, canvas.height / imageHeight)
      : Math.min(canvas.width / imageWidth, canvas.height / imageHeight);

    // Calculate offsets to center the drawing
    const offsetX = (canvas.width - imageWidth * scaleFactor) / 2;
    const offsetY = (canvas.height - imageHeight * scaleFactor) / 2;

    // Draw landmarks
    ctx.fillStyle = '#FFFF00';
    ctx.strokeStyle = '#4285F4';
    ctx.lineWidth = LANDMARK_STROKE_WIDTH;

    landmarks.forEach(landmark => {
      const x = landmark.x * imageWidth * scaleFactor + offsetX;
      const y = landmark.y * imageHeight * scaleFactor + offsetY;
      
      ctx.beginPath();
      ctx.arc(x, y, LANDMARK_STROKE_WIDTH / 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw connectors (we'll need to add the FACE_LANDMARKS_CONNECTORS data)
    ctx.beginPath();
    FACE_LANDMARKS_CONNECTORS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end) {
        const startX = start.x * imageWidth * scaleFactor + offsetX;
        const startY = start.y * imageHeight * scaleFactor + offsetY;
        const endX = end.x * imageWidth * scaleFactor + offsetX;
        const endY = end.y * imageHeight * scaleFactor + offsetY;

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }
    });
    ctx.stroke();
  }, [landmarks, imageWidth, imageHeight, mode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// We'll need to define these connections
const FACE_LANDMARKS_CONNECTORS = [
  // ... face landmark connection pairs
]; 