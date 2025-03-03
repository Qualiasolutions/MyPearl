'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  const requestAnimationRef = useRef<number>();
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
  const [isCameraMirrored, setIsCameraMirrored] = useState(true); // Use front camera by default (mirrored)
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
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
  
  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate camera height to be 60-75% of screen height
  const getCameraContainerStyle = () => {
    const heightPercentage = isMobile ? 70 : 65; // 70% on mobile, 65% on desktop
    return {
      height: `${heightPercentage}vh`,
      maxHeight: `${heightPercentage}vh`
    };
  };

  // Video constraints for portrait mode with front camera
  const videoConstraints = {
    width: isMobile ? { ideal: 1080 } : { ideal: 1280 },
    height: isMobile ? { ideal: 1920 } : { ideal: 720 },
    facingMode: 'user', // Always use front camera
    aspectRatio: isMobile ? 9/16 : 16/9, // Portrait mode
  };
  
  // Load TensorFlow and face detection
  useEffect(() => {
    const setupCamera = async () => {
      try {
        await initializeTensorFlow();
        await setupFaceDetection();
        setIsCameraInitialized(true);
      } catch (err) {
        console.error('Error setting up face detection:', err);
        setError('Failed to initialize camera. Please try again.');
        setIsModelLoading(false);
      }
    };
    
    setupCamera();
    
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      if (model) {
        model.dispose();
      }
    };
  }, [retryCount]);

  const initializeTensorFlow = async () => {
    try {
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow initialized with backend:', tf.getBackend());
    } catch (err) {
      console.error('Error initializing TensorFlow:', err);
      throw new Error('Failed to initialize TensorFlow');
    }
  };

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

  const detectFace = async () => {
    if (
      model && 
      webcamRef.current && 
      webcamRef.current.video && 
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      
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
      
      // Continue detection loop
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    } else {
      // If model or video is not ready, try again in the next frame
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    }
  };

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
    
    // Calculate maximum allowed distance (30% of dimensions - more forgiving)
    const maxDistanceX = videoWidth * 0.3;
    const maxDistanceY = videoHeight * 0.3;
    
    // Check if face is centered enough
    const isCentered = distanceX <= maxDistanceX && distanceY <= maxDistanceY;
    
    // Check if face is large enough (at least 20% of screen height - more forgiving)
    const isLargeEnough = face.box.height >= videoHeight * 0.2;
    
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

  const handleShadeSelection = (shade: Shade) => {
    setSelectedShade(shade);
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
  };

  const toggleOpacityControl = () => {
    setIsOpacityControlOpen(!isOpacityControlOpen);
  };

  const toggleCreateShade = () => {
    setIsCreateShadeOpen(!isCreateShadeOpen);
  };

  const createCustomShade = (name: string, blendedShades: Shade[]) => {
    if (blendedShades.length === 0) return;
    
    // Calculate blended color
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
  };

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

  const handleRetryModelLoading = () => {
    setError(null);
    setRetryCount(prevCount => prevCount + 1);
  };

  const toggleCameraMirroring = () => {
    setIsCameraMirrored(!isCameraMirrored);
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `pearl-beauty-${new Date().toISOString()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeModal = () => {
    setCapturedImage(null);
  };

  const renderMainInterface = () => (
    <div className="relative w-full h-full flex flex-col">
      {/* Camera and Face Detection */}
      <div 
        className="relative flex-grow overflow-hidden"
        style={getCameraContainerStyle()}
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={videoConstraints}
          mirrored={true} // Always mirror for front camera
          className="w-full h-full object-cover"
          onUserMedia={() => setIsCameraInitialized(true)}
        />
        
        {/* Overlay for face detection and visualization */}
        <FaceOverlay
          facePosition={facePosition}
          detectedFace={detectedFace}
          selectedShade={selectedShade}
          opacity={opacity}
          isFaceDetected={isFaceDetected}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          isMirrored={true} // Always mirror for consistent UI
        />
        
        {/* Status indicators */}
        <StatusIndicators
          isModelLoading={isModelLoading}
          isGoodPosition={facePosition.isGood}
          message={facePosition.message}
          selectedShade={selectedShade?.name}
        />
      </div>
      
      {/* Bottom Toolbar - take remaining height */}
      <div className="relative bg-black bg-opacity-80 px-2 py-3 flex-grow">
        {/* Shade swiper */}
        <ShadeSwiper
          onSelectShade={handleShadeSelection}
          selectedShade={selectedShade}
          customShades={customShades}
          builtInShades={SHADE_DATA}
        />
        
        {/* Camera controls */}
        <div className="flex justify-between items-center mt-4 px-2">
          <button
            onClick={toggleCreateShade}
            className="rounded-full p-3 bg-white/10 text-white"
            aria-label="Create custom shade"
          >
            <Palette size={24} />
          </button>
          
          <button
            onClick={captureImage}
            className="rounded-full p-4 bg-white text-black"
            aria-label="Take photo"
            disabled={!isFaceDetected}
          >
            <Camera size={32} />
          </button>
          
          <button
            onClick={toggleCameraMirroring}
            className="rounded-full p-3 bg-white/10 text-white"
            aria-label="Toggle camera mode"
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </div>
      
      {/* Opacity Control Sheet */}
      <AnimatePresence>
        {isOpacityControlOpen && (
          <ShadeOpacityControl
            opacity={opacity}
            onOpacityChange={handleOpacityChange}
            onClose={toggleOpacityControl}
          />
        )}
      </AnimatePresence>
      
      {/* Create Shade Panel */}
      <AnimatePresence>
        {isCreateShadeOpen && (
          <CreateShadePanel
            onClose={toggleCreateShade}
            onCreateShade={createCustomShade}
            existingShades={customShades}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const renderCapturedImage = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-grow">
        <img src={capturedImage || ''} alt="Captured" className="w-full h-full object-contain" />
      </div>
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-80">
        <button
          onClick={closeModal}
          className="rounded-full p-3 bg-white/10 text-white"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        <button
          onClick={downloadImage}
          className="rounded-full p-3 bg-white text-black"
          aria-label="Download image"
        >
          <Download size={24} />
        </button>
      </div>
    </div>
  );

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-center mb-4">{error}</p>
        <button
          onClick={handleRetryModelLoading}
          className="px-4 py-2 bg-white text-black rounded-full font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="relative h-full w-full overflow-hidden bg-black">
      {capturedImage ? renderCapturedImage() : renderMainInterface()}
    </main>
  );
}