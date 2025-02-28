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

// Concealer-specific landmarks for targeted areas
const UNDER_EYE_LEFT = [247, 30, 29, 27, 28, 56, 190, 243, 112, 117, 118, 119, 120, 121, 128, 126, 25, 110, 24, 23, 22, 26, 112];
const UNDER_EYE_RIGHT = [467, 260, 259, 257, 258, 286, 414, 463, 341, 346, 347, 348, 349, 350, 357, 359, 255, 339, 254, 253, 252, 256, 341];
const FOREHEAD = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 67, 109, 10];
const NASOLABIAL_LEFT = [36, 205, 50, 116, 123, 147, 213, 177, 83];
const NASOLABIAL_RIGHT = [266, 425, 280, 345, 352, 376, 433, 397, 313];
const CHIN = [18, 200, 199, 175, 152, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

export default function FaceOverlay({ landmarks, imageWidth, imageHeight, mode, shade = '#f5e6e0', opacity = 0.65 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isFaceDetected } = useFaceDetectionStore();
  
  // Parse the shade color to get RGBA values
  const getRGBAComponents = (shadeColor: string): [number, number, number, number] => {
    // Handle hex format
    if (shadeColor.startsWith('#')) {
      const r = parseInt(shadeColor.slice(1, 3), 16);
      const g = parseInt(shadeColor.slice(3, 5), 16);
      const b = parseInt(shadeColor.slice(5, 7), 16);
      return [r, g, b, opacity];
    }
    // Handle rgba format
    else if (shadeColor.startsWith('rgba')) {
      const parts = shadeColor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
      if (parts) {
        return [
          parseInt(parts[1]),
          parseInt(parts[2]),
          parseInt(parts[3]),
          opacity // Use the passed opacity instead of the one in the color string
        ];
      }
    }
    // Handle rgb format
    else if (shadeColor.startsWith('rgb')) {
      const parts = shadeColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (parts) {
        return [
          parseInt(parts[1]),
          parseInt(parts[2]),
          parseInt(parts[3]),
          opacity
        ];
      }
    }
    // Default fallback
    return [245, 230, 224, opacity];
  };
  
  useEffect(() => {
    if (!canvasRef.current || !landmarks || landmarks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match the image
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor based on mode
    const scaleFactor = mode === 'livestream' 
      ? Math.max(canvas.width / imageWidth, canvas.height / imageHeight)
      : 1;

    // Calculate offsets to center the drawing
    const offsetX = (canvas.width - imageWidth * scaleFactor) / 2;
    const offsetY = (canvas.height - imageHeight * scaleFactor) / 2;

    // Get RGBA components for the shade
    const [r, g, b, a] = getRGBAComponents(shade);

    // Apply concealer with improved blending
    renderConcealerMask(ctx, landmarks, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a);
    
    // Apply targeted concealer for specific areas with enhanced shader effect
    applyTargetedConcealer(ctx, landmarks, UNDER_EYE_LEFT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a * 1.2);
    applyTargetedConcealer(ctx, landmarks, UNDER_EYE_RIGHT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a * 1.2);
    applyTargetedConcealer(ctx, landmarks, NASOLABIAL_LEFT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a * 0.9);
    applyTargetedConcealer(ctx, landmarks, NASOLABIAL_RIGHT, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a * 0.9);
    applyTargetedConcealer(ctx, landmarks, FOREHEAD, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a * 0.7);
    applyTargetedConcealer(ctx, landmarks, CHIN, imageWidth, imageHeight, scaleFactor, offsetX, offsetY, r, g, b, a * 0.8);
    
  }, [landmarks, imageWidth, imageHeight, mode, shade, opacity]);

  // Function to render the base concealer mask
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
    try {
      // Create base face mask
      ctx.save();
      
      // Create clip path for the face outline
      ctx.beginPath();
      
      // Map the first point of face outline
      const firstPoint = landmarks[FACE_OUTLINE_LANDMARKS[0]];
      ctx.moveTo(
        firstPoint.x * imageWidth * scaleFactor + offsetX,
        firstPoint.y * imageHeight * scaleFactor + offsetY
      );
      
      // Connect the rest of the face outline points
      for (let i = 1; i < FACE_OUTLINE_LANDMARKS.length; i++) {
        const landmark = landmarks[FACE_OUTLINE_LANDMARKS[i]];
        ctx.lineTo(
          landmark.x * imageWidth * scaleFactor + offsetX,
          landmark.y * imageHeight * scaleFactor + offsetY
        );
      }
      
      // Close the path
      ctx.closePath();
      ctx.clip();
      
      // Fill with a gradient for more realistic blending
      const faceCenterX = imageWidth * scaleFactor / 2 + offsetX;
      const faceCenterY = imageHeight * scaleFactor / 2 + offsetY;
      const faceRadius = imageWidth * scaleFactor * 0.4;
      
      // Create a radial gradient for natural falloff
      const gradient = ctx.createRadialGradient(
        faceCenterX, faceCenterY, 0,
        faceCenterX, faceCenterY, faceRadius
      );
      
      // Set gradient colors with improved blending
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a * 0.8})`);
      gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${a * 0.5})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a * 0.2})`);
      
      ctx.fillStyle = gradient;
      if (canvasRef.current) {
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      
      // Cut out eyes, mouth
      cutoutFacialFeature(ctx, landmarks, LEFT_EYE_LANDMARKS, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
      cutoutFacialFeature(ctx, landmarks, RIGHT_EYE_LANDMARKS, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
      cutoutFacialFeature(ctx, landmarks, LIPS_LANDMARKS, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
      
      // Apply composite operation for better blending
      ctx.globalCompositeOperation = 'source-atop';
      
      // Apply a subtle texture for skin-like appearance
      applyTextureEffect(ctx, imageWidth, imageHeight, a * 0.2);
      
      ctx.restore();
    } catch (error) {
      console.error('Error rendering concealer mask:', error);
    }
  };

  // Function to cut out facial features
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

    // Ensure we have the first landmark
    const firstLandmark = landmarks[featureLandmarks[0]];
    if (!firstLandmark) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    
    // Move to the first point
    ctx.moveTo(
      firstLandmark.x * imageWidth * scaleFactor + offsetX,
      firstLandmark.y * imageHeight * scaleFactor + offsetY
    );
    
    // Connect the rest of the feature outline points
    for (let i = 1; i < featureLandmarks.length; i++) {
      const landmark = landmarks[featureLandmarks[i]];
      if (!landmark) continue;
      
      ctx.lineTo(
        landmark.x * imageWidth * scaleFactor + offsetX,
        landmark.y * imageHeight * scaleFactor + offsetY
      );
    }
    
    // Close the path
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Function to apply targeted concealer to specific areas
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
    if (targetLandmarks.length === 0) return;

    // Ensure we have the first landmark
    const firstLandmark = landmarks[targetLandmarks[0]];
    if (!firstLandmark) return;

    ctx.save();
    
    // Create path for the target area
    ctx.beginPath();
    
    // Move to the first point
    ctx.moveTo(
      firstLandmark.x * imageWidth * scaleFactor + offsetX,
      firstLandmark.y * imageHeight * scaleFactor + offsetY
    );
    
    // Connect the rest of the target area points
    for (let i = 1; i < targetLandmarks.length; i++) {
      const landmark = landmarks[targetLandmarks[i]];
      if (!landmark) continue;
      
      ctx.lineTo(
        landmark.x * imageWidth * scaleFactor + offsetX,
        landmark.y * imageHeight * scaleFactor + offsetY
      );
    }
    
    // Close the path
    ctx.closePath();
    
    // Fill with the concealer color, slightly increased opacity for these targeted areas
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    
    // Use composition mode for realistic blending
    ctx.globalCompositeOperation = 'multiply';
    ctx.fill();
    
    // Apply a soft blur effect for targeted areas
    applyBlurEffect(ctx, targetLandmarks, landmarks, imageWidth, imageHeight, scaleFactor, offsetX, offsetY);
    
    ctx.restore();
  };

  // Function to apply a blur effect for smoother edges
  const applyBlurEffect = (
    ctx: CanvasRenderingContext2D,
    targetLandmarks: number[],
    landmarks: Array<{ x: number; y: number; z: number }>,
    imageWidth: number,
    imageHeight: number,
    scaleFactor: number,
    offsetX: number,
    offsetY: number
  ) => {
    // Calculate the center point of the target area
    let centerX = 0;
    let centerY = 0;
    let count = 0;
    
    for (const landmarkIndex of targetLandmarks) {
      const landmark = landmarks[landmarkIndex];
      if (!landmark) continue;
      
      centerX += landmark.x * imageWidth * scaleFactor + offsetX;
      centerY += landmark.y * imageHeight * scaleFactor + offsetY;
      count++;
    }
    
    if (count === 0) return;
    
    centerX /= count;
    centerY /= count;
    
    // Apply radial gradient blur
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, 50 * scaleFactor
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    if (canvasRef.current) {
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    ctx.restore();
  };

  // Function to apply a subtle texture effect
  const applyTextureEffect = (
    ctx: CanvasRenderingContext2D,
    imageWidth: number,
    imageHeight: number,
    intensity: number
  ) => {
    // Create a noise pattern for skin texture
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Skip transparent pixels
      if (data[i + 3] === 0) continue;
      
      // Add subtle random noise
      const noise = (Math.random() - 0.5) * intensity * 10;
      
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  );
}

// We'll need to define these connections
const FACE_LANDMARKS_CONNECTORS = [
  // ... face landmark connection pairs
]; 