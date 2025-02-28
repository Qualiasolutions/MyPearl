'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, Palette, RefreshCw, Repeat, Sliders, Settings, PlusCircle, XCircle, Download, X } from 'lucide-react';
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
  const requestAnimationRef = useRef<number>();
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
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  
  // Load custom shades from localStorage
  useEffect(() => {
    try {
      const savedShades = localStorage.getItem('customShades');
      if (savedShades) {
        setCustomShades(JSON.parse(savedShades));
      }
    } catch (err) {
      console.error('Error loading custom shades:', err);
    }
    
    return () => {
      // Clean up animation frame on unmount
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, []);
  
  // Initialize TensorFlow and load the face detection model
  useEffect(() => {
    initializeTensorFlow();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Calculate responsive dimensions when camera is initialized
  useEffect(() => {
    if (isCameraInitialized) {
      calculateResponsiveDimensions();
    }
  }, [isCameraInitialized]);
  
  const initializeTensorFlow = async () => {
    try {
      setIsModelLoading(true);
      setError(null);
      
      // Ensure TensorFlow.js is initialized with WebGL backend
      await tf.setBackend('webgl');
      await tf.ready();
      
      // Load face detection model more efficiently
      await setupFaceDetection();
      
      setIsModelLoading(false);
    } catch (err) {
      console.error('Error initializing TensorFlow:', err);
      setError('Failed to initialize face detection. Please try again or check your device compatibility.');
      setIsModelLoading(false);
    }
  };
  
  // Handle window resize and recalculate dimensions
  const handleResize = useCallback(() => {
    if (isCameraInitialized) {
      calculateResponsiveDimensions();
    }
  }, [isCameraInitialized]);
  
  // Calculate responsive dimensions based on window size
  const calculateResponsiveDimensions = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video) return;
    
    const video = webcamRef.current.video;
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let newWidth, newHeight;
    
    // Check if we're on mobile (portrait orientation)
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Use nearly full width on mobile, maintain aspect ratio
      newWidth = Math.min(window.innerWidth * 0.95, 480);
      newHeight = newWidth / videoAspectRatio;
      
      // Make sure height isn't too tall for the viewport
      if (newHeight > window.innerHeight * 0.6) {
        newHeight = window.innerHeight * 0.6;
        newWidth = newHeight * videoAspectRatio;
      }
    } else {
      // On desktop, use reasonable dimensions
      newWidth = Math.min(window.innerWidth * 0.7, 640);
      newHeight = newWidth / videoAspectRatio;
      
      // Make sure height isn't too tall for the viewport
      if (newHeight > window.innerHeight * 0.7) {
        newHeight = window.innerHeight * 0.7;
        newWidth = newHeight * videoAspectRatio;
      }
    }
    
    setVideoWidth(newWidth);
    setVideoHeight(newHeight);
    
    // Update canvas dimensions to match
    if (canvasRef.current) {
      canvasRef.current.width = newWidth;
      canvasRef.current.height = newHeight;
    }
  }, []);
  
  const setupFaceDetection = async () => {
    try {
      // Load the MediaPipe FaceMesh model for more accurate facial landmark detection
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1
      };
      
      const detector = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );
      
      setModel(detector);
      
      if (webcamRef.current && webcamRef.current.video) {
        setIsCameraInitialized(true);
        
        // Start detection loop using requestAnimationFrame for better performance
        startFaceDetection(detector);
      }
    } catch (err) {
      console.error('Error setting up face detection:', err);
      setError('Failed to setup face detection. Please refresh the page or try a different browser.');
      setIsModelLoading(false);
    }
  };
  
  // Face detection loop using requestAnimationFrame
  const startFaceDetection = useCallback(async (detector: faceLandmarksDetection.FaceLandmarksDetector) => {
    const detectFace = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        try {
          const video = webcamRef.current.video;
          
          // Perform face detection
          const faces = await detector.estimateFaces(video);
          
          if (faces && faces.length > 0) {
            // Extract face data
            const face = faces[0];
            
            // Convert to our DetectedFace format
            const detectedFace: DetectedFace = {
              box: {
                xMin: face.box.xMin,
                yMin: face.box.yMin,
                width: face.box.width,
                height: face.box.height,
                xMax: face.box.xMin + face.box.width,
                yMax: face.box.yMin + face.box.height
              },
              landmarks: face.keypoints as any
            };
            
            setDetectedFace(detectedFace);
            setFaceDetected(true);
            
            // Check if face is positioned correctly
            checkFacePosition(detectedFace);
          } else {
            setFaceDetected(false);
            setFacePosition({ isGood: false, message: 'No face detected' });
          }
        } catch (err) {
          console.error('Error in face detection loop:', err);
        }
      }
      
      // Continue detection loop
      requestAnimationRef.current = requestAnimationFrame(detectFace);
    };
    
    // Start the detection loop
    detectFace();
  }, [setFaceDetected]);
  
  // Analyze face position and provide feedback
  const checkFacePosition = (face: DetectedFace) => {
    if (!webcamRef.current || !webcamRef.current.video) return;
    
    const video = webcamRef.current.video;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Calculate center of face
    const faceX = face.box.xMin + face.box.width / 2;
    const faceY = face.box.yMin + face.box.height / 2;
    
    // Calculate center of video
    const centerX = videoWidth / 2;
    const centerY = videoHeight / 2;
    
    // Calculate distance from center (normalized by video dimensions)
    const distanceX = Math.abs(faceX - centerX) / videoWidth;
    const distanceY = Math.abs(faceY - centerY) / videoHeight;
    
    // Calculate face size relative to video
    const faceSize = (face.box.width * face.box.height) / (videoWidth * videoHeight);
    
    let isGood = false;
    let message = '';
    
    // Check if face is centered and at a good size
    if (distanceX > 0.15) {
      message = faceX < centerX ? 'Move right' : 'Move left';
    } else if (distanceY > 0.15) {
      message = faceY < centerY ? 'Move down' : 'Move up';
    } else if (faceSize < 0.05) {
      message = 'Move closer';
    } else if (faceSize > 0.35) {
      message = 'Move farther away';
    } else {
      isGood = true;
      message = 'Perfect! Face aligned';
    }
    
    setFacePosition({
      isGood,
      message,
      center: { x: faceX, y: faceY }
    });
  };
  
  // Handle shade selection
  const handleShadeSelection = (shade: Shade) => {
    setSelectedShade(shade);
  };
  
  // Create a custom shade
  const createCustomShade = (name: string, blendedShades: Shade[]) => {
    try {
      // Validate input
      if (!name || name.trim() === '') {
        throw new Error('Please provide a name for your custom shade');
      }
      
      if (!blendedShades || blendedShades.length === 0) {
        throw new Error('Please select at least one shade to blend');
      }
      
      // Create a new custom shade
      const newShade: Shade = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        color: blendedShades.length > 1 
          ? 'linear-gradient(to right, ' + blendedShades.map(s => s.color).join(', ') + ')'
          : blendedShades[0].color,
        isCustom: true,
        blendedFrom: blendedShades.map(s => s.id)
      };
      
      // Update custom shades state
      const updatedShades = [...customShades, newShade];
      setCustomShades(updatedShades);
      
      // Save to localStorage
      localStorage.setItem('customShades', JSON.stringify(updatedShades));
      
      // Select the new shade
      setSelectedShade(newShade);
      
      // Close create panel
      setIsCreateShadeOpen(false);
      
      return true;
    } catch (err) {
      console.error('Error creating custom shade:', err);
      setError(err instanceof Error ? err.message : 'Failed to create custom shade');
      return false;
    }
  };
  
  // Handle retry when model loading fails
  const handleRetryModelLoading = () => {
    setRetryCount(prev => prev + 1);
    initializeTensorFlow();
  };
  
  // Toggle camera mirroring
  const toggleCameraMirroring = () => {
    setIsCameraMirrored(prev => !prev);
  };
  
  // Capture image
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setShowCaptureModal(true);
    }
  };
  
  // Download captured image
  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `shade-tryout-${new Date().toISOString()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Close capture modal
  const closeModal = () => {
    setShowCaptureModal(false);
    setCapturedImage(null);
  };
  
  // Render the component
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden">
      {/* Status indicators */}
      <StatusIndicators 
        isModelLoading={isModelLoading} 
        isFaceDetected={isFaceDetected}
        facePosition={facePosition}
        error={error}
      />
      
      {/* Main camera container */}
      <div className="relative flex items-center justify-center w-full md:w-auto">
        {/* Camera */}
        <div 
          className="relative overflow-hidden rounded-2xl shadow-xl"
          style={{ 
            width: videoWidth || 'auto', 
            height: videoHeight || 'auto',
            maxWidth: '100vw',
            maxHeight: '70vh'
          }}
        >
          {isModelLoading ? (
            <div className="flex flex-col items-center justify-center bg-black aspect-video rounded-2xl animate-pulse">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={48} className="text-white opacity-50" />
              </motion.div>
              <p className="mt-4 text-white/70">Loading face detection model...</p>
            </div>
          ) : (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                mirrored={isCameraMirrored}
                screenshotFormat="image/png"
                videoConstraints={{
                  facingMode: "user",
                }}
                onUserMedia={() => setIsCameraInitialized(true)}
                className="w-full h-full object-cover"
                style={{
                  transform: isCameraMirrored ? 'scaleX(-1)' : 'none',
                }}
              />
              
              {/* Face guides and overlay */}
              <FaceGuide 
                isModelLoading={isModelLoading} 
                facePosition={facePosition}
                isFaceDetected={isFaceDetected}
              />
              
              {detectedFace && selectedShade && (
                <FaceOverlay 
                  detectedFace={detectedFace}
                  selectedShade={selectedShade}
                  isMirrored={isCameraMirrored}
                  opacity={opacity}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Controls and UI */}
      <div className="w-full max-w-md mt-4 px-2">
        {/* Error message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center gap-2"
          >
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-sm text-red-100">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-100"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
        
        {/* Loading retry */}
        {isModelLoading && retryCount < 3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5 }}
            className="mt-2 text-center"
          >
            <p className="text-sm text-gray-400 mb-2">Taking longer than expected?</p>
            <button 
              onClick={handleRetryModelLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Retry Loading
            </button>
          </motion.div>
        )}
        
        {/* Face instructions */}
        {!isModelLoading && !error && (
          <FaceInstructions 
            isFaceDetected={isFaceDetected}
            facePosition={facePosition}
          />
        )}
        
        {/* Controls and shade selection */}
        {!isModelLoading && isFaceDetected && (
          <div className="mt-4">
            {/* Buttons */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex space-x-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleCameraMirroring}
                  className="p-2 bg-gray-800/70 hover:bg-gray-700/70 rounded-full"
                  title="Toggle camera mirroring"
                >
                  <Repeat size={20} />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpacityControlOpen(!isOpacityControlOpen)}
                  className={`p-2 ${isOpacityControlOpen ? 'bg-purple-600/70' : 'bg-gray-800/70 hover:bg-gray-700/70'} rounded-full`}
                  title="Adjust opacity"
                >
                  <Sliders size={20} />
                </motion.button>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={captureImage}
                disabled={!isFaceDetected || !selectedShade}
                className={`p-3 rounded-full ${
                  !isFaceDetected || !selectedShade
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
                title="Take screenshot"
              >
                <Camera size={24} />
              </motion.button>
              
              <div className="flex space-x-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreateShadeOpen(true)}
                  className="p-2 bg-gray-800/70 hover:bg-gray-700/70 rounded-full"
                  title="Create custom shade"
                >
                  <PlusCircle size={20} />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedShade(null)}
                  disabled={!selectedShade}
                  className={`p-2 ${
                    !selectedShade
                      ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800/70 hover:bg-gray-700/70'
                  } rounded-full`}
                  title="Remove shade"
                >
                  <XCircle size={20} />
                </motion.button>
              </div>
            </div>
            
            {/* Shades carousel */}
            <ShadeSwiper 
              selectedShade={selectedShade}
              onSelectShade={handleShadeSelection}
              builtInShades={SHADE_DATA}
              customShades={customShades}
            />
            
            {/* Opacity control */}
            <AnimatePresence>
              {isOpacityControlOpen && (
                <ShadeOpacityControl 
                  opacity={opacity}
                  setOpacity={setOpacity}
                  onClose={() => setIsOpacityControlOpen(false)}
                />
              )}
            </AnimatePresence>
            
            {/* Create shade panel */}
            <AnimatePresence>
              {isCreateShadeOpen && (
                <CreateShadePanel
                  builtInShades={SHADE_DATA}
                  onCreateShade={createCustomShade}
                  onClose={() => setIsCreateShadeOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Capture modal */}
      <AnimatePresence>
        {showCaptureModal && capturedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 rounded-2xl overflow-hidden max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-medium">Captured Image</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <img 
                  src={capturedImage} 
                  alt="Captured shade try-on" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              <div className="p-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}