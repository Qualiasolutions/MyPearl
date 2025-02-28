'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import IntroAnimation from '../intro/IntroAnimation';
import { Camera } from 'lucide-react';
import Image from 'next/image';

interface FacePosition {
  isGood: boolean;
  message: string;
  center?: { x: number; y: number };
}

interface Shade {
  id: string;
  name: string;
  color: string;
}

interface CapturedPhoto {
  imageUrl: string;
  shade: Shade | null;
  timestamp: number;
}

interface CustomShade extends Shade {
  isCustom: true;
  blendedFrom: Shade[];
}

interface Category {
  name: string;
  shades: Shade[];
}

interface FaceBox {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
  xMax?: number;
  yMax?: number;
}

interface DetectedFace {
  box: FaceBox;
  landmarks?: Array<{ x: number; y: number; z: number }>;
  boundingBox?: {
    topLeft: number[];
    bottomRight: number[];
  };
}

const SAMPLE_SHADES: Shade[] = [
  // Fair
  { id: 'ivory-cool', name: 'Ivory Cool', color: 'rgba(245, 230, 224, 0.6)' },
  { id: 'porcelain-neutral', name: 'Porcelain Neutral', color: 'rgba(243, 224, 216, 0.6)' },
  { id: 'snow-warm', name: 'Snow Warm', color: 'rgba(245, 225, 213, 0.6)' },
  { id: 'pearl-olive', name: 'Pearl Olive', color: 'rgba(240, 222, 210, 0.6)' },

  // Light
  { id: 'sand-neutral', name: 'Sand Neutral', color: 'rgba(230, 200, 175, 0.6)' },
  { id: 'shell-warm', name: 'Shell Warm', color: 'rgba(225, 190, 165, 0.6)' },
  { id: 'beige-cool', name: 'Beige Cool', color: 'rgba(220, 185, 160, 0.6)' },
  { id: 'nude-olive', name: 'Nude Olive', color: 'rgba(215, 180, 155, 0.6)' },

  // Medium
  { id: 'honey-warm', name: 'Honey Warm', color: 'rgba(205, 170, 140, 0.6)' },
  { id: 'desert-caramel', name: 'Desert Caramel', color: 'rgba(201, 168, 146, 0.6)' },
  { id: 'beige-olive', name: 'Beige Olive', color: 'rgba(192, 160, 138, 0.6)' },
  { id: 'golden-falcon', name: 'Golden Falcon', color: 'rgba(184, 155, 133, 0.6)' },

  // Medium Deep
  { id: 'amber-glow', name: 'Amber Glow', color: 'rgba(176, 139, 115, 0.6)' },
  { id: 'chestnut-neutral', name: 'Chestnut Neutral', color: 'rgba(166, 132, 112, 0.6)' },
  { id: 'toffee-palm', name: 'Toffee Palm', color: 'rgba(156, 123, 104, 0.6)' },
  { id: 'cinnamon-glow', name: 'Cinnamon Glow', color: 'rgba(143, 111, 92, 0.6)' },

  // Deep
  { id: 'mocha-desert', name: 'Mocha Desert', color: 'rgba(124, 91, 74, 0.6)' },
  { id: 'cocoa-warm', name: 'Cocoa Warm', color: 'rgba(107, 75, 60, 0.6)' },
  { id: 'hazel-golden', name: 'Hazel Golden', color: 'rgba(94, 66, 53, 0.6)' },
  { id: 'mahogany-oasis', name: 'Mahogany Oasis', color: 'rgba(78, 51, 40, 0.6)' },
];

// Update the SHADE_CATEGORIES array with color representations
const SHADE_CATEGORIES = [
  {
    name: '●○○○○',
    displayName: 'Lightest',
    shades: SAMPLE_SHADES.slice(0, 4),
    color: 'rgba(245, 230, 224, 1)' // Lightest shade color
  },
  {
    name: '●●○○○',
    displayName: 'Light',
    shades: SAMPLE_SHADES.slice(4, 8),
    color: 'rgba(230, 200, 175, 1)' // Light shade color
  },
  {
    name: '●●●○○',
    displayName: 'Medium',
    shades: SAMPLE_SHADES.slice(8, 12),
    color: 'rgba(205, 170, 140, 1)' // Medium shade color
  },
  {
    name: '●●●●○',
    displayName: 'Tan',
    shades: SAMPLE_SHADES.slice(12, 16),
    color: 'rgba(176, 139, 115, 1)' // Tan shade color
  },
  {
    name: '●●●●●',
    displayName: 'Deep',
    shades: SAMPLE_SHADES.slice(16, 20),
    color: 'rgba(124, 91, 74, 1)' // Deep shade color
  }
];

// Add this new component for the shade grid
const ShadeGrid = ({ shades, selectedShade, onSelect }: {
  shades: Shade[];
  selectedShade: Shade | null;
  onSelect: (shade: Shade) => void;
}) => (
  <div className="grid grid-cols-5 gap-2">
    {shades.map((shade) => (
      <button
        key={shade.id}
        onClick={() => onSelect(shade)}
        className={`
          group relative p-0.5 rounded-full transition-all
          ${selectedShade?.id === shade.id 
            ? 'ring-2 ring-rose scale-110' 
            : 'hover:scale-105'}
        `}
      >
        <div 
          className="w-8 h-8 rounded-full shadow-lg"
          style={{ backgroundColor: shade.color.replace('0.5', '1') }}
        />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
            {shade.name}
          </div>
        </div>
      </button>
    ))}
  </div>
);

// Get stored custom shades from localStorage
const getStoredCustomShades = (): CustomShade[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('customShades');
  return stored ? JSON.parse(stored) : [];
};

export default function FaceDetectionCamera() {
  const webcamRef = useRef<Webcam>(null);
  const detector = useRef<any>(null);
  const requestRef = useRef<number | null>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<FacePosition>({
    isGood: false,
    message: "Position your face in the circle",
    center: undefined
  });
  
  const [selectedShade, setSelectedShade] = useState<Shade | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [customShades, setCustomShades] = useState<CustomShade[]>(getStoredCustomShades());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [showCreateShade, setShowCreateShade] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  const lastDetectionTime = useRef<number>(0);
  const detectionInterval = useRef<number>(detectionQuality === 'high' ? 0 : detectionQuality === 'medium' ? 100 : 200);
  const faceDetectionAttempts = useRef<number>(0);
  const maxConsecutiveFailures = 5;
  const consecutiveFailures = useRef<number>(0);
  
  // Combine sample and custom shades
  const allShades = useMemo(() => {
    return [...SAMPLE_SHADES, ...customShades];
  }, [customShades]);
  
  // Video constraints
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };
  
  const handleUserMedia = () => {
    setIsCameraReady(true);
  };
  
  const handleCameraError = (error: string | DOMException) => {
    console.error('Camera error:', error);
  };
  
  // Setup face detection
  useEffect(() => {
    const setupFaceDetection = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        console.log('TensorFlow.js initialized with WebGL backend');
  
        // Create the face detector with enhanced configuration
        detector.current = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            maxFaces: 1,
            refineLandmarks: true, // Enhanced landmark detection
          }
        );
  
        console.log('Face detection model loaded successfully');
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        setIsModelLoading(false);
        setModelError(true);
      }
    };
  
    if (isCameraReady) {
      setupFaceDetection();
    }
  
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isCameraReady]);
  
  // Custom shades persistence
  useEffect(() => {
    localStorage.setItem('customShades', JSON.stringify(customShades));
  }, [customShades]);
  
  // Face detection function
  const detectFaces = useCallback(async () => {
    if (!detector.current || !webcamRef.current?.video) {
      requestRef.current = requestAnimationFrame(detectFaces);
      return;
    }
    
    const now = performance.now();
    const timeSinceLastDetection = now - lastDetectionTime.current;
    
    if (timeSinceLastDetection < detectionInterval.current) {
      requestRef.current = requestAnimationFrame(detectFaces);
      return;
    }
    
    lastDetectionTime.current = now;
    faceDetectionAttempts.current++;

    try {
      const video = webcamRef.current.video;
      
      if (video.readyState === 4) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        video.width = videoWidth;
        video.height = videoHeight;

        const faces = await detector.current.estimateFaces(video) as DetectedFace[];

        const hasFaces = faces && faces.length > 0;
        setIsFaceDetected(hasFaces);
        
        if (hasFaces) {
          consecutiveFailures.current = 0;
          const face = faces[0];
          
          // Ensure we have a valid box object
          let box;
          if (face.box) {
            box = face.box;
          } else if (face.boundingBox) {
            box = {
              xMin: face.boundingBox.topLeft[0],
              yMin: face.boundingBox.topLeft[1],
              width: face.boundingBox.bottomRight[0] - face.boundingBox.topLeft[0],
              height: face.boundingBox.bottomRight[1] - face.boundingBox.topLeft[1]
            };
          } else {
            throw new Error('Invalid face detection format');
          }

          const faceWidth = box.width || (box.xMax ? box.xMax - box.xMin : 0);
          const faceHeight = box.height || (box.yMax ? box.yMax - box.yMin : 0);
          const faceCenterX = box.xMin + faceWidth / 2;
          const faceCenterY = box.yMin + faceHeight / 2;
          
          const relativeX = faceCenterX / videoWidth;
          const relativeY = faceCenterY / videoHeight;
          const relativeSize = Math.max(faceWidth, faceHeight) / Math.min(videoWidth, videoHeight);

          // Enhanced positioning algorithm
          const idealRelativeSize = 0.5;
          const sizeThreshold = 0.15;
          
          // More precise position thresholds for better positioning
          const centerXThreshold = 0.12;
          const centerYThreshold = 0.12;

          const isGoodSize = Math.abs(relativeSize - idealRelativeSize) < sizeThreshold;
          const isGoodPosition = 
            Math.abs(relativeX - 0.5) < centerXThreshold && 
            Math.abs(relativeY - 0.5) < centerYThreshold;

          const distanceFromCenter = Math.sqrt(
            Math.pow(relativeX - 0.5, 2) + 
            Math.pow(relativeY - 0.5, 2)
          );

          // Dynamic message based on face position
          let positionMessage = "Position your face in the center";
          if (relativeX < 0.5 - centerXThreshold) positionMessage = "Move your face to the right";
          else if (relativeX > 0.5 + centerXThreshold) positionMessage = "Move your face to the left";
          else if (relativeY < 0.5 - centerYThreshold) positionMessage = "Move your face down";
          else if (relativeY > 0.5 + centerYThreshold) positionMessage = "Move your face up";
          else positionMessage = "Move your face to the center of the circle";

          setFacePosition({
            isGood: isGoodSize && isGoodPosition,
            message: !isGoodSize 
              ? (relativeSize < idealRelativeSize 
                  ? "Move closer to the camera" 
                  : "Move back from the camera")
              : !isGoodPosition
              ? positionMessage
              : "Perfect! Hold still",
            center: {
              x: relativeX,
              y: relativeY
            }
          });
          
          // Adjust detection quality based on face size and position
          if (isGoodSize && isGoodPosition) {
            if (detectionQuality !== 'high') {
              setDetectionQuality('high');
              detectionInterval.current = 0; // Continuous detection for precise positioning
            }
          } else if (distanceFromCenter < 0.3) {
            if (detectionQuality !== 'medium') {
              setDetectionQuality('medium');
              detectionInterval.current = 100;
            }
          } else {
            if (detectionQuality !== 'low') {
              setDetectionQuality('low');
              detectionInterval.current = 200;
            }
          }
        } else {
          consecutiveFailures.current++;
          
          if (consecutiveFailures.current >= maxConsecutiveFailures) {
            // If we have consecutive failures, drop detection quality to save resources
            if (detectionQuality !== 'low') {
              setDetectionQuality('low');
              detectionInterval.current = 200;
            }
          }
          
          setFacePosition({
            isGood: false,
            message: "Position your face in the circle",
            center: undefined
          });
        }
      }
    } catch (error) {
      consecutiveFailures.current++;
      console.error('Error during face detection:', error);
      
      if (consecutiveFailures.current > maxConsecutiveFailures * 2) {
        // If we have too many consecutive errors, attempt to restart the detector
        try {
          detector.current = null;
          setupFaceDetection();
        } catch (e) {
          console.error('Failed to restart face detector:', e);
        }
        consecutiveFailures.current = 0;
      }
    }

    requestRef.current = requestAnimationFrame(detectFaces);
  }, []);
  
  // Start face detection loop
  useEffect(() => {
    if (!isModelLoading && isCameraReady) {
      console.log('Starting face detection loop');
      detectFaces();
      
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
      };
    }
  }, [isModelLoading, isCameraReady, detectFaces]);
  
  // Capture photo function
  const capturePhoto = () => {
    if (webcamRef.current && facePosition.isGood) {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
          console.error('Failed to capture screenshot');
          return;
        }
        
        const newPhoto: CapturedPhoto = {
          imageUrl: imageSrc,
          shade: selectedShade,
          timestamp: Date.now()
        };
        
        setPhotos(prev => [...prev, newPhoto]);
        setLastCapturedPhoto(newPhoto);
        setShowPhotoPreview(true);
      } catch (error) {
        console.error('Error capturing photo:', error);
      }
    }
  };
  
  // Setup face detection function
  const setupFaceDetection = async () => {
    try {
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow.js initialized with WebGL backend');

      // Create the face detector with enhanced configuration
      detector.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          maxFaces: 1,
          refineLandmarks: true, // Enhanced landmark detection
        }
      );

      console.log('Face detection model loaded successfully');
      setIsModelLoading(false);
    } catch (error) {
      console.error('Error loading model:', error);
      setIsModelLoading(false);
      setModelError(true);
    }
  };

  // Rest of the component implementation...
  // The rest of the UI render code would go here
}