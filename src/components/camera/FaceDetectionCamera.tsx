'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, Palette, RefreshCw, X, Download } from 'lucide-react';
import FaceOverlay from './FaceOverlay';
import FaceInstructions from './FaceInstructions';
import StatusIndicators from './StatusIndicators';
import ShadeSwiper from '../shades/ShadeSwiper';
import ShadeOpacityControl from '../shades/ShadeOpacityControl';
import CreateShadePanel from '../shades/CreateShadePanel';
import { Shade, ShadeCategory } from '@/types/shades';
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
  const requestAnimationRef = useRef<number>();
  const lastDetectionTimeRef = useRef<number>(0);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [model, setModel] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [facePosition, setFacePosition] = useState<FacePosition>({ isGood: false, message: 'Align your face in center' });
  const [selectedShade, setSelectedShade] = useState<Shade | null>(null);
  const [isCreateShadeOpen, setIsCreateShadeOpen] = useState(false);
  const [isOpacityControlOpen, setIsOpacityControlOpen] = useState(false);
  const [customShades, setCustomShades] = useState<Shade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [opacity, setOpacity] = useState(0.65);
  const [retryCount, setRetryCount] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShadeCategory>('Fair');
  
  // Use the face detection store
  const { isFaceDetected, setFaceDetected } = useFaceDetectionStore();
  
  // Video dimensions state
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  
  // Get window dimensions for responsive camera
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter shades by category
  const filteredBuiltInShades = useMemo(() => {
    return SHADE_DATA.filter(shade => 
      activeCategory === 'All' ? true : shade.category === activeCategory
    );
  }, [activeCategory]);
  
  // Update window dimensions on resize - use a debounced version to prevent excessive re-renders
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
        setIsMobile(window.innerWidth <= 768);
      }, 200); // 200ms debounce
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Calculate camera height to be 60-75% of screen height
  const getCameraContainerStyle = useCallback(() => {
    const heightPercentage = isMobile ? 70 : 65; // 70% on mobile, 65% on desktop
    return {
      height: `${heightPercentage}vh`,
      maxHeight: `${heightPercentage}vh`
    };
  }, [isMobile]);

  // Video constraints - more relaxed for better compatibility
  const videoConstraints = {
    width: { ideal: isMobile ? 640 : 1280 },
    height: { ideal: isMobile ? 480 : 720 },
    facingMode: "user", // Use "user" instead of exact constraint for better compatibility
    aspectRatio: isMobile ? 3/4 : 16/9,
  };
  
  // Initialize TensorFlow with optimized settings
  const initializeTensorFlow = async () => {
    try {
      // Wait for TensorFlow to be ready with WebGL backend
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow initialized with backend:', tf.getBackend());
    } catch (err) {
      console.error('Error initializing TensorFlow:', err);
      throw new Error('Failed to initialize TensorFlow');
    }
  };

  // Setup face detection with optimized settings
  const setupFaceDetection = async () => {
    try {
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'mediapipe' as const,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        maxFaces: 1,
        refineLandmarks: true,
      };
      
      setIsModelLoading(true);
      const detector = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );
      setModel(detector);
      setIsModelLoading(false);
      
      if (webcamRef.current && webcamRef.current.video) {
        detectFace();
      }
    } catch (err) {
      console.error('Error setting up face detection:', err);
      setError('Failed to load face detection model. Please try again.');
      setIsModelLoading(false);
      throw err;
    }
  };

  // Load TensorFlow and face detection
  useEffect(() => {
    let isActive = true;
    
    const setupCamera = async () => {
      try {
        if (!isActive) return;
        
        await initializeTensorFlow();
        await setupFaceDetection();
        if (isActive) {
          setIsCameraInitialized(true);
        }
      } catch (err) {
        console.error('Error setting up face detection:', err);
        if (isActive) {
          setError('Failed to initialize camera. Please try again.');
          setIsModelLoading(false);
        }
      }
    };
    
    setupCamera();
    
    return () => {
      isActive = false;
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      if (model) {
        model.dispose();
      }
    };
  }, [retryCount]);

  // Throttled face detection to reduce CPU/GPU load
  const detectFace = async () => {
    if (
      model && 
      webcamRef.current && 
      webcamRef.current.video && 
      webcamRef.current.video.readyState === 4
    ) {
      const now = performance.now();
      const video = webcamRef.current.video;
      
      // Throttle detection to 15 FPS max (66ms between frames)
      const timeSinceLastDetection = now - lastDetectionTimeRef.current;
      if (timeSinceLastDetection > 66) {
        lastDetectionTimeRef.current = now;
        
        try {
          // Update video dimensions for accurate detection
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          setVideoWidth(videoWidth);
          setVideoHeight(videoHeight);
          
          // Get face predictions
          const faces = await model.estimateFaces(video);
          
          if (faces && faces.length > 0) {
            const face = faces[0];
            setFaceDetected(true);
            
            // Format detected face data
            const detectedFace: DetectedFace = {
              box: {
                xMin: face.box.xMin,
                yMin: face.box.yMin,
                width: face.box.width,
                height: face.box.height,
                xMax: face.box.xMin + face.box.width,
                yMax: face.box.yMin + face.box.height
              },
              landmarks: face.keypoints.map(keypoint => ({
                x: keypoint.x,
                y: keypoint.y,
                z: keypoint.z || 0 // Provide a default value for z if undefined
              })),
              boundingBox: {
                topLeft: [face.box.xMin, face.box.yMin],
                bottomRight: [face.box.xMin + face.box.width, face.box.yMin + face.box.height]
              }
            };
            
            setDetectedFace(detectedFace);
            checkFacePosition(detectedFace);
          } else {
            setFaceDetected(false);
            setDetectedFace(null);
            setFacePosition({
              isGood: false,
              message: 'No face detected'
            });
          }
        } catch (err) {
          console.error('Error detecting face:', err);
        }
      }
      
      // Continue detection loop
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    } else {
      // If model or video is not ready, try again in the next frame
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    }
  };

  // More lenient face position checking for better UX
  const checkFacePosition = (face: DetectedFace) => {
    if (!face || !face.box || !webcamRef.current || !webcamRef.current.video) {
      return;
    }
    
    const video = webcamRef.current.video;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Calculate face center point
    const faceCenterX = face.box.xMin + face.box.width / 2;
    const faceCenterY = face.box.yMin + face.box.height / 2;
    
    // Calculate ideal face center (middle of the screen)
    const idealCenterX = videoWidth / 2;
    const idealCenterY = videoHeight / 2;
    
    // Calculate distance from ideal center
    const distanceX = Math.abs(faceCenterX - idealCenterX);
    const distanceY = Math.abs(faceCenterY - idealCenterY);
    
    // Calculate maximum allowed distance (35% of dimensions - even more forgiving)
    const maxDistanceX = videoWidth * 0.35;
    const maxDistanceY = videoHeight * 0.35;
    
    // Check if face is centered enough
    const isCentered = distanceX <= maxDistanceX && distanceY <= maxDistanceY;
    
    // Check if face is large enough (at least 15% of screen height - more forgiving)
    const isLargeEnough = face.box.height >= videoHeight * 0.15;
    
    // Consider face position good if either criteria is met - more lenient
    const isGoodPosition = isCentered || isLargeEnough;
    
    // Update face position state
    setFacePosition({
      isGood: isGoodPosition,
      message: isGoodPosition ? 'Face detected' : 'Center your face',
      center: { x: faceCenterX, y: faceCenterY }
    });
    
    // Always consider face as detected if any face is found
    setFaceDetected(true);
  };

  const handleShadeSelection = useCallback((shade: Shade) => {
    setSelectedShade(shade);
  }, []);

  const handleOpacityChange = useCallback((newOpacity: number) => {
    setOpacity(newOpacity);
  }, []);

  const toggleOpacityControl = useCallback(() => {
    setIsOpacityControlOpen(prev => !prev);
  }, []);

  const toggleCreateShade = useCallback(() => {
    setIsCreateShadeOpen(prev => !prev);
  }, []);

  const createCustomShade = useCallback((name: string, blendedShades: Shade[]) => {
    if (blendedShades.length === 0) return;
    
    // Calculate weighted RGB values based on equal weights
    const rgbValues = blendedShades.map(shade => {
      const hex = shade.colorHex.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    });
    
    // Calculate average RGB values
    const avgR = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.r, 0) / rgbValues.length);
    const avgG = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.g, 0) / rgbValues.length);
    const avgB = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.b, 0) / rgbValues.length);
    
    const colorHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
    
    // Find highest ID in existing custom shades
    const highestId = Math.max(
      ...customShades.map(s => s.id),
      ...SHADE_DATA.map(s => s.id),
      0
    );
    
    // Create new shade
    const newShade: Shade = {
      id: highestId + 1,
      name: name,
      category: 'Custom',
      colorHex: colorHex
    };
    
    // Add to custom shades
    const updatedCustomShades = [...customShades, newShade];
    setCustomShades(updatedCustomShades);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('customShades', JSON.stringify(updatedCustomShades));
    } catch (error) {
      console.error('Error saving custom shades:', error);
    }
    
    // Select the new shade
    setSelectedShade(newShade);
    
    // Close create shade panel
    setIsCreateShadeOpen(false);
  }, [customShades]);

  // Load custom shades from localStorage on mount
  useEffect(() => {
    try {
      const savedShades = localStorage.getItem('customShades');
      if (savedShades) {
        setCustomShades(JSON.parse(savedShades));
      }
    } catch (error) {
      console.error('Error loading custom shades:', error);
    }
  }, []);

  const handleRetryModelLoading = useCallback(() => {
    setError(null);
    setRetryCount(prevCount => prevCount + 1);
  }, []);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, []);

  const downloadImage = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `pearl-beauty-${new Date().toISOString()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [capturedImage]);

  const closeModal = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Render camera UI
  if (error) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white p-4">
        <div className="bg-white/10 rounded-xl p-6 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-rose-500" />
          <h2 className="text-xl font-bold mb-2">Camera Error</h2>
          <p className="mb-4 text-white/80">{error}</p>
          <button
            onClick={handleRetryModelLoading}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white font-medium"
          >
            <RefreshCw size={18} className="inline mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <button 
            onClick={closeModal}
            className="p-2 -m-2 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg font-medium text-white">Captured Image</h2>
          <button
            onClick={downloadImage}
            className="p-2 -m-2 text-white/70 hover:text-white"
          >
            <Download size={24} />
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center p-4">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black relative overflow-hidden">
      {/* Camera preview container with responsive height */}
      <div className="relative flex-grow flex justify-center items-center max-h-[75vh] overflow-hidden">
        {/* Face detection mode */}
        {!capturedImage && (
          <>
            {/* Webcam container - position cover and keep aspect */}
            <div className="relative w-full h-full">
              <Webcam
                ref={webcamRef}
                videoConstraints={videoConstraints}
                audio={false}
                screenshotFormat="image/jpeg"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: 'rotateY(180deg)' // Mirror horizontally
                }}
              />
              
              {/* Canvas overlay for debug */}
              <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: 'rotateY(180deg)', // Mirror to match webcam
                  display: 'none' // Hide debug canvas
                }}
              />
              
              {/* Face overlay - shows detected face and applied shade */}
              {detectedFace && selectedShade && (
                <FaceOverlay 
                  face={detectedFace}
                  shade={selectedShade}
                  videoWidth={videoWidth}
                  videoHeight={videoHeight}
                  opacity={opacity}
                />
              )}
              
              {/* Face position guidance */}
              {isCameraInitialized && (
                <FaceInstructions
                  facePosition={facePosition}
                  isFaceDetected={isFaceDetected}
                />
              )}
              
              {/* Status indicators */}
              <StatusIndicators
                isModelLoading={isModelLoading}
                isFaceDetected={isFaceDetected}
                selectedShade={selectedShade}
                error={error}
              />
            </div>
          </>
        )}
        
        {/* Result mode (showing captured image) */}
        {capturedImage && (
          <div className="relative w-full h-full flex justify-center items-center bg-black">
            <img 
              src={capturedImage} 
              alt="Captured selfie with makeup" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
      
      {/* Redesigned bottom control panel */}
      <div className="relative bg-black/90 backdrop-blur-sm border-t border-white/10 pt-2 pb-3 flex flex-col z-10">
        {/* Error message - now floating above the navbar */}
        {error && (
          <div className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-red-900/80 backdrop-blur-sm border border-red-500/50 rounded-lg p-3 flex items-center gap-2 shadow-lg">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm flex-grow">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        {!capturedImage && (
          <>
            {/* Main action bar - Always visible */}
            <div className="flex items-center justify-between px-3 mb-1">
              {/* Category dropdown/select */}
              <div className="relative">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as ShadeCategory)}
                  className="appearance-none bg-white/10 text-white/90 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium cursor-pointer border border-white/20 pr-8 focus:outline-none focus:ring-1 focus:ring-white/30"
                >
                  <option value="All">All Shades</option>
                  <option value="Fair">Fair</option>
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Medium Deep">Medium Deep</option>
                  <option value="Deep">Deep</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/70">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Create custom shade button */}
                <button
                  onClick={() => setIsCreateShadeOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 rounded-full text-white/80 hover:text-white text-xs sm:text-sm transition-colors"
                >
                  <Palette size={14} />
                  <span className="hidden sm:inline">Custom</span>
                </button>
                
                {/* Opacity slider - simplified inline version */}
                {selectedShade && (
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1">
                    <span className="text-xs text-white/80">{Math.round(opacity * 100)}%</span>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-16 sm:w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                    />
                  </div>
                )}
                
                {/* Capture button */}
                <button
                  onClick={captureImage}
                  disabled={!selectedShade || !isFaceDetected || !facePosition.isGood}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    !selectedShade || !isFaceDetected || !facePosition.isGood
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  <Camera size={14} />
                  <span>Capture</span>
                </button>
              </div>
            </div>
          
            {/* Compact shade swiper */}
            <ShadeSwiper
              onSelectShade={setSelectedShade}
              selectedShade={selectedShade}
              customShades={customShades}
              builtInShades={filteredBuiltInShades}
            />
          </>
        )}
        
        {/* Captured image controls */}
        {capturedImage && (
          <div className="flex justify-between items-center px-4 py-2">
            <button
              onClick={() => setCapturedImage(null)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white text-xs sm:text-sm transition-colors"
            >
              <RefreshCw size={14} />
              <span>Retake</span>
            </button>
            
            <button
              onClick={downloadImage}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-full text-xs sm:text-sm font-medium transition-colors hover:bg-white/90"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {isCreateShadeOpen && (
        <CreateShadePanel
          onClose={() => setIsCreateShadeOpen(false)}
          onCreateShade={createCustomShade}
          existingShades={SHADE_DATA}
        />
      )}
    </div>
  );
}