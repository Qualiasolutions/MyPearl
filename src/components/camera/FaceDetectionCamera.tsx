'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, Palette, RefreshCw, Repeat, Sliders, Settings, PlusCircle, XCircle } from 'lucide-react';
import FaceOverlay from './FaceOverlay';
import FaceInstructions from './FaceInstructions';
import FaceGuide from './FaceGuide';
import StatusIndicators from './StatusIndicators';
import ShadeSwiper from '../shades/ShadeSwiper';
import ShadeOpacityControl from '../shades/ShadeOpacityControl';
import CreateShadePanel from '../shades/CreateShadePanel';
import { Shade } from '@/types/shades';
import { SHADE_DATA } from '@/data/ShadeData';
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
  const [isOpacityControlOpen, setIsOpacityControlOpen] = useState(false);
  const [customShades, setCustomShades] = useState<Shade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [opacity, setOpacity] = useState(0.65);
  const [retryCount, setRetryCount] = useState(0);
  const [isCameraMirrored, setIsCameraMirrored] = useState(true);
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
        // Wait for backend initialization
        await tf.ready();
        await tf.setBackend('webgl');
        console.log('TensorFlow backend initialized:', tf.getBackend());
        
        // Setup face detection with automatic retry
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
  }, [retryCount]);

  // Save custom shades to localStorage when they change
  useEffect(() => {
    if (customShades.length > 0) {
      try {
        localStorage.setItem('customShades', JSON.stringify(customShades));
      } catch (error) {
        console.error('Failed to save custom shades:', error);
      }
    }
  }, [customShades]);

  // Handle window resize to maintain aspect ratio
  useEffect(() => {
    const handleResize = () => {
      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        setVideoWidth(video.videoWidth);
        setVideoHeight(video.videoHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      
      // Clear any existing model
      if (model) {
        model.dispose();
      }
      
      // Configure MediaPipe FaceMesh model with latest API
      const modelConfig = {
        runtime: 'tfjs' as const,
        refineLandmarks: true,
        maxFaces: 1
      };
      
      // Create a detector using the FaceLandmarksDetection API
      console.log('Creating face detector...');
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        modelConfig
      );
      
      console.log('Face detector created successfully');
      setModel(detector);
      setIsModelLoading(false);
      setError(null);
      
      // Start detection loop once model is loaded
      if (isCameraInitialized) {
        detectFaceLoop();
      }
    } catch (error) {
      console.error('Failed to load face detection model:', error);
      setIsModelLoading(false);
      setError('Failed to load face detection model. Please try again.');
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
      
      // Perform face detection using the correct API parameters
      const faces = await model.estimateFaces(video);
      
      if (faces && faces.length > 0) {
        // Convert to our DetectedFace format
        const face = faces[0];
        const detectedFace: DetectedFace = {
          box: {
            xMin: face.box.xMin,
            yMin: face.box.yMin,
            width: face.box.width,
            height: face.box.height
          },
          landmarks: face.keypoints.map(kp => ({ 
            x: kp.x / video.videoWidth, 
            y: kp.y / video.videoHeight,
            z: (kp as any).z || 0
          })),
          boundingBox: face.box as any
        };
        
        setDetectedFace(detectedFace);
        setFaceDetected(true);
        
        // Check face position
        checkFacePosition(detectedFace);
      } else {
        setDetectedFace(null);
        setFaceDetected(false);
        setFacePosition({ isGood: false, message: 'No face detected' });
      }
    } catch (error) {
      console.error('Error in face detection:', error);
      // Don't set error state to avoid interrupting the loop
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

  // Check face position relative to the guide
  const checkFacePosition = (face: DetectedFace) => {
    const { box } = face;
    
    // Calculate the center of the face
    const centerX = (box.xMin + box.xMin + box.width) / 2;
    const centerY = (box.yMin + box.yMin + box.height) / 2;
    
    // Get dimensions
    const videoWidth = webcamRef.current?.video?.videoWidth || 640;
    const videoHeight = webcamRef.current?.video?.videoHeight || 480;
    
    // Normalize coordinates to 0-1 range
    const normalizedX = centerX / videoWidth;
    const normalizedY = centerY / videoHeight;
    
    // Check if the face is well-positioned (near center)
    const isGoodPosition = 
      normalizedX > 0.35 && normalizedX < 0.65 && 
      normalizedY > 0.35 && normalizedY < 0.65;
    
    // Set message based on position
    let message = 'Position your face within the circle';
    
    if (isGoodPosition) {
      message = 'Perfect! Face detected';
    } else if (normalizedX < 0.4) {
      message = 'Move your face right';
    } else if (normalizedX > 0.6) {
      message = 'Move your face left';
    } else if (normalizedY < 0.4) {
      message = 'Move your face down';
    } else if (normalizedY > 0.6) {
      message = 'Move your face up';
    }
    
    setFacePosition({
      isGood: isGoodPosition,
      message,
      center: { x: normalizedX, y: normalizedY }
    });
    
    return isGoodPosition;
  };

  // Apply shade to face
  const handleShadeSelection = (shade: Shade) => {
    setSelectedShade(shade);
    setIsCreateShadeOpen(false); // Close create panel if open
  };

  // Create a custom shade from blended shades
  const createCustomShade = (name: string, blendedShades: Shade[]) => {
    if (blendedShades.length === 0) return;
    
    // Calculate average RGB color from the selected shades
    const rgbValues = blendedShades.map(shade => {
      const hex = shade.colorHex.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    });
    
    const avgR = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.r, 0) / rgbValues.length);
    const avgG = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.g, 0) / rgbValues.length);
    const avgB = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.b, 0) / rgbValues.length);
    
    const blendedColorHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
    
    // Create a new custom shade
    const newShade: Shade = {
      id: Date.now(), // Use timestamp as ID
      name,
      category: 'Custom' as any, // Add Custom to the ShadeCategory type
      colorHex: blendedColorHex
    };
    
    // Add to custom shades
    const updatedShades = [...customShades, newShade];
    setCustomShades(updatedShades);
    
    // Auto-select the new shade
    setSelectedShade(newShade);
    
    // Close the create panel
    setIsCreateShadeOpen(false);
  };

  // Retry loading the model
  const handleRetryModelLoading = () => {
    setError(null);
    setIsModelLoading(true);
    setRetryCount(retryCount + 1);
  };

  // Toggle camera mirroring
  const toggleCameraMirroring = () => {
    setIsCameraMirrored(!isCameraMirrored);
  };

  // Calculate responsive dimensions
  const calculateResponsiveDimensions = () => {
    if (!webcamRef.current || !webcamRef.current.video) {
      return { width: '100%', height: 'auto', padding: 0 };
    }
    
    const video = webcamRef.current.video;
    const videoRatio = video.videoWidth / video.videoHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    
    if (windowRatio > videoRatio) {
      // Window is wider than video
      const height = Math.min(windowHeight, windowWidth / videoRatio);
      return { 
        width: height * videoRatio, 
        height, 
        padding: `0 ${(windowWidth - (height * videoRatio)) / 2}px` 
      };
    } else {
      // Window is taller than video
      const width = Math.min(windowWidth, windowHeight * videoRatio);
      return { 
        width, 
        height: width / videoRatio, 
        padding: `${(windowHeight - (width / videoRatio)) / 2}px 0` 
      };
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 text-white">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Camera Error</h2>
        <p className="text-center mb-6">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={handleRetryModelLoading}
            className="bg-neutral-700 text-white font-medium px-6 py-2 rounded-full flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry Loading
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-neutral-900 font-medium px-6 py-2 rounded-full"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[100dvh] bg-black overflow-hidden">
      {/* Camera View with Face Detection */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        {/* Webcam */}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }}
          mirrored={isCameraMirrored}
          className="absolute max-h-full max-w-full object-contain z-10"
          onUserMedia={(stream) => {
            setIsCameraInitialized(true);
            // Get video dimensions once the camera is initialized
            const video = webcamRef.current?.video;
            if (video) {
              setVideoWidth(video.videoWidth);
              setVideoHeight(video.videoHeight);
            }
          }}
        />
        
        {/* Loading/Error Overlay */}
        <AnimatePresence>
          {(isModelLoading || error) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 text-center"
            >
              {isModelLoading && !error && (
                <>
                  <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mb-6"></div>
                  <h2 className="text-white text-lg font-medium mb-2">Setting Up Face Detection</h2>
                  <p className="text-neutral-400 text-sm mb-4">This may take a moment...</p>
                </>
              )}
              
              {error && (
                <>
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={24} className="text-red-500" />
                  </div>
                  <h2 className="text-white text-lg font-medium mb-2">Face Detection Error</h2>
                  <p className="text-neutral-400 text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRetryModelLoading}
                    className="px-4 py-2 bg-white text-black rounded-full font-medium flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Retry
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Face Detection UI Elements */}
        {!isModelLoading && !error && (
          <>
            {/* Canvas for face overlay */}
            <canvas
              ref={canvasRef}
              className={`absolute top-0 left-0 z-20 ${isFaceDetected ? 'opacity-100' : 'opacity-0'}`}
              style={{
                width: videoWidth > 0 ? '100%' : '640px',
                height: videoHeight > 0 ? 'auto' : '480px',
              }}
            />
            
            {/* Face Detection Guides */}
            <FaceGuide facePosition={facePosition} isFaceDetected={isFaceDetected} />
            <FaceInstructions 
              message={facePosition.message} 
              isGoodPosition={facePosition.isGood} 
              isFaceDetected={isFaceDetected}
            />
            
            {/* Control Icons */}
            <div className="absolute top-4 left-4 z-30 flex space-x-3">
              <button
                onClick={toggleCameraMirroring}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition"
              >
                <Repeat size={18} />
              </button>
              <button
                onClick={() => setIsOpacityControlOpen(!isOpacityControlOpen)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition"
              >
                <Sliders size={18} />
              </button>
            </div>
          </>
        )}
        
        {/* Face Overlay with Selected Shade */}
        {selectedShade && isFaceDetected && detectedFace && (
          <FaceOverlay
            landmarks={detectedFace.landmarks}
            imageWidth={videoWidth}
            imageHeight={videoHeight}
            mode="livestream"
            shade={selectedShade.colorHex}
            opacity={opacity}
          />
        )}
        
        {/* Opacity Control */}
        <AnimatePresence>
          {isOpacityControlOpen && (
            <ShadeOpacityControl
              opacity={opacity}
              setOpacity={setOpacity}
              onClose={() => setIsOpacityControlOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Bottom Shade Selection & Controls */}
      <div className="bg-white border-t border-neutral-200 min-h-[120px] sm:min-h-[150px] z-40">
        <div className="flex items-stretch h-full">
          {/* Shades Swiper */}
          <div className="flex-1 overflow-hidden">
            <ShadeSwiper 
              onSelectShade={handleShadeSelection}
              selectedShade={selectedShade}
              customShades={customShades}
            />
          </div>
          
          {/* Create Custom Shade Button */}
          <div className="w-16 border-l border-neutral-200 flex flex-col items-center justify-center">
            <button
              onClick={() => setIsCreateShadeOpen(true)}
              className="flex flex-col items-center justify-center w-full h-full p-2 hover:bg-neutral-50 transition"
            >
              <PlusCircle size={24} className="mb-1 text-neutral-700" />
              <span className="text-[10px] text-center text-neutral-600 font-medium">Create Shade</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Create Shade Panel */}
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