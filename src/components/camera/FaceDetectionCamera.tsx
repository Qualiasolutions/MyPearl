'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, Palette } from 'lucide-react';
import FaceOverlay from './FaceOverlay';
import FaceInstructions from './FaceInstructions';
import FaceGuide from './FaceGuide';
import StatusIndicators from './StatusIndicators';
import ShadeSwiper from '../shades/ShadeSwiper';
import CreateShadePanel from '../shades/CreateShadePanel';
import { Shade, SHADE_DATA } from '@/types/shades';
import { useFaceDetectionStore } from '@/store/FaceDetectionStore';

interface FacePosition {
  isGood: boolean;
  message: string;
  center?: { x: number; y: number };
}

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

export default function FaceDetectionCamera() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [facePosition, setFacePosition] = useState<FacePosition>({ isGood: false, message: 'Align your face in the circle' });
  const [selectedShade, setSelectedShade] = useState<Shade | null>(null);
  const [isCreateShadeOpen, setIsCreateShadeOpen] = useState(false);
  const [customShades, setCustomShades] = useState<Shade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [opacity, setOpacity] = useState(0.65);
  const { isFaceDetected, setFaceDetected } = useFaceDetectionStore();
  
  // Video dimensions state
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  
  // Load custom shades from localStorage
  useEffect(() => {
    try {
      const storedShades = localStorage.getItem('customShades');
      if (storedShades) {
        setCustomShades(JSON.parse(storedShades));
      }
    } catch (error) {
      console.error('Failed to load custom shades:', error);
    }
  }, []);

  // Initialize TensorFlow.js and the face detection model
  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        await tf.setBackend('webgl');
        await setupFaceDetection();
      } catch (error) {
        console.error('Failed to initialize TensorFlow:', error);
        setError('Failed to initialize face detection. Please check your device compatibility.');
      }
    };

    initializeTensorFlow();
    
    // Cleanup function
    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, []);

  const handleUserMedia = useCallback(() => {
    setIsCameraInitialized(true);
    setError(null);
    
    // Set video dimensions for better face detection
    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      setVideoWidth(video.videoWidth);
      setVideoHeight(video.videoHeight);
    }
  }, []);

  const handleCameraError = useCallback((error: string | DOMException) => {
    console.error('Camera error:', error);
    setError(typeof error === 'string' ? error : 'Failed to access camera. Please check permissions.');
    setIsCameraInitialized(false);
  }, []);

  const setupFaceDetection = async () => {
    try {
      setIsModelLoading(true);
      
      // Using the latest TensorFlow.js face-landmarks-detection model
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );
      
      setModel(model);
      setIsModelLoading(false);
      
      // Start detection loop once model is loaded
      if (isCameraInitialized) {
        detectFaceLoop();
      }
    } catch (error) {
      console.error('Failed to load face detection model:', error);
      setError('Failed to load face detection model. Please try again.');
      setIsModelLoading(false);
    }
  };

  const detectFaceLoop = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video || !model) return;
    
    try {
      const video = webcamRef.current.video;
      
      // Check if video is ready
      if (video.readyState !== 4) {
        requestAnimationFrame(detectFaceLoop);
        return;
      }
      
      // Perform face detection
      const faces = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: true
      });
      
      if (faces && faces.length > 0) {
        const face = faces[0];
        setDetectedFace(face as DetectedFace);
        setFaceDetected(true);
        
        // Check face position
        checkFacePosition(face as DetectedFace);
      } else {
        setDetectedFace(null);
        setFaceDetected(false);
        setFacePosition({ isGood: false, message: 'No face detected' });
      }
    } catch (error) {
      console.error('Error in face detection:', error);
    }
    
    // Continue detection loop
    requestAnimationFrame(detectFaceLoop);
  }, [model, setFaceDetected]);

  // Start detection loop when camera is initialized and model is loaded
  useEffect(() => {
    if (isCameraInitialized && model && !isModelLoading) {
      detectFaceLoop();
    }
  }, [isCameraInitialized, model, isModelLoading, detectFaceLoop]);

  const checkFacePosition = (face: DetectedFace) => {
    if (!webcamRef.current || !webcamRef.current.video) return;
    
    const video = webcamRef.current.video;
    const { width, height } = video.getBoundingClientRect();
    
    // Calculate face position relative to camera frame
    const centerX = face.box.xMin + face.box.width / 2;
    const centerY = face.box.yMin + face.box.height / 2;
    const boxArea = face.box.width * face.box.height;
    const frameArea = width * height;
    
    // Calculate center point of face relative to frame (0-1)
    const relativeCenterX = centerX / width;
    const relativeCenterY = centerY / height;
    
    // Calculate face size relative to frame
    const relativeSize = boxArea / frameArea;
    
    // Determine if face position is good for makeup application
    const isGoodPosition = 
      relativeCenterX > 0.4 && relativeCenterX < 0.6 &&  // Centered horizontally
      relativeCenterY > 0.4 && relativeCenterY < 0.6 &&  // Centered vertically
      relativeSize > 0.1;                                // Face is large enough
    
    // Update face position state
    if (isGoodPosition) {
      setFacePosition({ 
        isGood: true, 
        message: 'Perfect! Keep still.',
        center: { x: relativeCenterX, y: relativeCenterY }
      });
    } else {
      let message = 'Move your face to the center';
      
      if (relativeSize < 0.1) {
        message = 'Move closer to the camera';
      } else if (relativeCenterX <= 0.4) {
        message = 'Move your face to the right';
      } else if (relativeCenterX >= 0.6) {
        message = 'Move your face to the left';
      } else if (relativeCenterY <= 0.4) {
        message = 'Move your face down';
      } else if (relativeCenterY >= 0.6) {
        message = 'Move your face up';
      }
      
      setFacePosition({
        isGood: false,
        message,
        center: { x: relativeCenterX, y: relativeCenterY }
      });
    }
  };

  const handleShadeSelection = (shade: Shade) => {
    setSelectedShade(shade);
  };

  const createCustomShade = (name: string, blendedShades: Shade[]) => {
    try {
      // Calculate blended color
      const rgbValues = blendedShades.map(shade => hexToRgbObj(shade.colorHex));
      
      // Average the RGB values
      const avgR = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.r, 0) / rgbValues.length);
      const avgG = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.g, 0) / rgbValues.length);
      const avgB = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.b, 0) / rgbValues.length);
      
      // Create hex color
      const blendedHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
      
      // Create new custom shade
      const newShade: Shade = {
        id: Date.now(),
        name,
        category: 'Custom',
        colorHex: blendedHex
      };
      
      // Update custom shades
      const updatedCustomShades = [...customShades, newShade];
      setCustomShades(updatedCustomShades);
      setSelectedShade(newShade);
      
      // Save to localStorage
      localStorage.setItem('customShades', JSON.stringify(updatedCustomShades));
      
      // Close custom shade panel
      setIsCreateShadeOpen(false);
    } catch (error) {
      console.error('Failed to create custom shade:', error);
    }
  };

  const hexToRgbObj = (hex: string) => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse hex values to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 text-white">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Camera Error</h2>
        <p className="text-center mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-neutral-900 font-medium px-6 py-2 rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Main Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading Indicator */}
        <AnimatePresence>
          {isModelLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-neutral-900 flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-t-gold border-neutral-500 rounded-full animate-spin mb-4" />
              <p className="text-white font-medium">Loading face detection...</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Camera & Face Overlay Container */}
        <div className="relative h-full w-full flex items-center justify-center">
          {/* Webcam */}
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: 'user',
              aspectRatio: 3/4,
            }}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleCameraError}
            className="h-full w-full object-cover"
          />
          
          {/* Face Overlay */}
          {detectedFace && detectedFace.landmarks && selectedShade && (
            <FaceOverlay
              landmarks={detectedFace.landmarks}
              imageWidth={videoWidth}
              imageHeight={videoHeight}
              mode="livestream"
              shade={selectedShade.colorHex}
              opacity={opacity}
            />
          )}
          
          {/* Face Guide */}
          <FaceGuide 
            facePosition={facePosition} 
            isFaceDetected={isFaceDetected}
          />
          
          {/* Status Indicators */}
          <StatusIndicators
            isModelLoaded={!isModelLoading && model !== null}
            isCameraInitialized={isCameraInitialized}
            isFaceDetected={isFaceDetected}
          />
          
          {/* Face Instructions */}
          <FaceInstructions
            message={facePosition.message}
            isGoodPosition={facePosition.isGood}
          />
        </div>
      </div>
      
      {/* Bottom Navigation Bar */}
      <div className="bg-white border-t border-neutral-200">
        {/* Instructions */}
        <div className="px-4 py-2 text-center text-sm text-neutral-600">
          Select a concealer shade below to try it on
        </div>
        
        {/* Shade Swiper */}
        <div className="h-24">
          <ShadeSwiper
            onSelectShade={handleShadeSelection}
            selectedShade={selectedShade}
          />
        </div>
        
        {/* Bottom Controls */}
        <div className="flex items-center justify-between p-4 pb-safe">
          {/* Custom Shade Button */}
          <button
            onClick={() => setIsCreateShadeOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-800"
          >
            <Palette size={18} />
            <span>Custom</span>
          </button>
          
          {/* Opacity Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Opacity</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
          
          {/* Capture Button */}
          <button
            disabled={!isFaceDetected || !facePosition.isGood || !selectedShade}
            className={`
              rounded-full p-3
              ${
                !isFaceDetected || !facePosition.isGood || !selectedShade
                  ? 'bg-neutral-200 text-neutral-400'
                  : 'bg-gold text-white shadow-lg'
              }
            `}
          >
            <Camera size={24} />
          </button>
        </div>
      </div>
      
      {/* Create Custom Shade Panel */}
      <AnimatePresence>
        {isCreateShadeOpen && (
          <CreateShadePanel
            onClose={() => setIsCreateShadeOpen(false)}
            onCreateShade={createCustomShade}
            existingShades={SHADE_DATA}
          />
        )}
      </AnimatePresence>
    </div>
  );
}