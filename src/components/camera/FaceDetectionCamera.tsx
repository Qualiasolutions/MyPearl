'use client';

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import IntroAnimation from '../intro/IntroAnimation';

interface FacePosition {
  isGood: boolean;
  message: string;
}

interface Shade {
  id: string;
  name: string;
  color: string;
}

const SAMPLE_SHADES: Shade[] = [
  // Fair
  { id: 'ivory-cool', name: 'Ivory Cool', color: 'rgba(245, 230, 224, 0.5)' },
  { id: 'porcelain-neutral', name: 'Porcelain Neutral', color: 'rgba(243, 224, 216, 0.5)' },
  { id: 'snow-warm', name: 'Snow Warm', color: 'rgba(245, 225, 213, 0.5)' },
  { id: 'pearl-olive', name: 'Pearl Olive', color: 'rgba(240, 222, 210, 0.5)' },

  // Light
  { id: 'sand-neutral', name: 'Sand Neutral', color: 'rgba(230, 200, 175, 0.5)' },
  { id: 'shell-warm', name: 'Shell Warm', color: 'rgba(225, 190, 165, 0.5)' },
  { id: 'beige-cool', name: 'Beige Cool', color: 'rgba(220, 185, 160, 0.5)' },
  { id: 'nude-olive', name: 'Nude Olive', color: 'rgba(215, 180, 155, 0.5)' },

  // Medium
  { id: 'honey-warm', name: 'Honey Warm', color: 'rgba(205, 170, 140, 0.5)' },
  { id: 'desert-caramel', name: 'Desert Caramel', color: 'rgba(201, 168, 146, 0.5)' },
  { id: 'beige-olive', name: 'Beige Olive', color: 'rgba(192, 160, 138, 0.5)' },
  { id: 'golden-falcon', name: 'Golden Falcon', color: 'rgba(184, 155, 133, 0.5)' },

  // Medium Deep
  { id: 'amber-glow', name: 'Amber Glow', color: 'rgba(176, 139, 115, 0.5)' },
  { id: 'chestnut-neutral', name: 'Chestnut Neutral', color: 'rgba(166, 132, 112, 0.5)' },
  { id: 'toffee-palm', name: 'Toffee Palm', color: 'rgba(156, 123, 104, 0.5)' },
  { id: 'cinnamon-glow', name: 'Cinnamon Glow', color: 'rgba(143, 111, 92, 0.5)' },

  // Deep
  { id: 'mocha-desert', name: 'Mocha Desert', color: 'rgba(124, 91, 74, 0.5)' },
  { id: 'cocoa-warm', name: 'Cocoa Warm', color: 'rgba(107, 75, 60, 0.5)' },
  { id: 'hazel-golden', name: 'Hazel Golden', color: 'rgba(94, 66, 53, 0.5)' },
  { id: 'mahogany-oasis', name: 'Mahogany Oasis', color: 'rgba(78, 51, 40, 0.5)' },
];

// Group shades by category for the swiper
const SHADE_CATEGORIES = [
  {
    name: 'Fair',
    shades: SAMPLE_SHADES.slice(0, 4)
  },
  {
    name: 'Light',
    shades: SAMPLE_SHADES.slice(4, 8)
  },
  {
    name: 'Medium',
    shades: SAMPLE_SHADES.slice(8, 12)
  },
  {
    name: 'Medium Deep',
    shades: SAMPLE_SHADES.slice(12, 16)
  },
  {
    name: 'Deep',
    shades: SAMPLE_SHADES.slice(16, 20)
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

export default function FaceDetectionCamera() {
  const webcamRef = useRef<Webcam>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<FacePosition>({
    isGood: false,
    message: "Position your face in the circle"
  });
  const detector = useRef<any>(null);
  const requestRef = useRef<number>();
  const [selectedShade, setSelectedShade] = useState<Shade | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; shades: Shade[] } | null>(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  const handleUserMedia = () => {
    console.log('Camera initialized');
    setIsCameraReady(true);
  };

  const handleCameraError = (error: string | null) => {
    console.error('Camera error:', error);
  };

  useEffect(() => {
    const setupFaceDetection = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        console.log('TensorFlow.js initialized with WebGL backend');

        // Create the face detector with minimal configuration
        detector.current = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            maxFaces: 1,
            refineLandmarks: false,
          }
        );

        console.log('Face detection model loaded successfully');
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        setIsModelLoading(false); // Set to false even on error to show error state
      }
    };

    if (isCameraReady) {
      setupFaceDetection();
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraReady]);

  const detectFaces = async () => {
    if (!detector.current || !webcamRef.current?.video) {
      requestRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      const video = webcamRef.current.video;
      
      if (video.readyState === 4) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        video.width = videoWidth;
        video.height = videoHeight;

        const faces = await detector.current.estimateFaces(video, {
          flipHorizontal: false,
          staticImageMode: false,
        });

        const hasFaces = faces && faces.length > 0;
        setIsFaceDetected(hasFaces);
        
        if (hasFaces) {
          const face = faces[0];
          // Get face bounding box
          const box = face.box || {
            xMin: face.boundingBox.topLeft[0],
            yMin: face.boundingBox.topLeft[1],
            width: face.boundingBox.bottomRight[0] - face.boundingBox.topLeft[0],
            height: face.boundingBox.bottomRight[1] - face.boundingBox.topLeft[1]
          };

          // Calculate face center and size
          const faceWidth = box.width || box.xMax - box.xMin;
          const faceHeight = box.height || box.yMax - box.yMin;
          const faceCenterX = box.xMin + faceWidth / 2;
          const faceCenterY = box.yMin + faceHeight / 2;
          
          // Calculate relative positions (0 to 1)
          const relativeX = faceCenterX / videoWidth;
          const relativeY = faceCenterY / videoHeight;
          const relativeSize = Math.max(faceWidth, faceHeight) / Math.min(videoWidth, videoHeight);

          // Adjust these thresholds to make it easier to get in position
          const idealRelativeSize = 0.5; // Face should take up about 50% of the smaller dimension
          const sizeThreshold = 0.15; // More tolerance for size
          const positionThreshold = 0.15; // More tolerance for position

          const isGoodSize = Math.abs(relativeSize - idealRelativeSize) < sizeThreshold;
          const isGoodPosition = 
            Math.abs(relativeX - 0.5) < positionThreshold && 
            Math.abs(relativeY - 0.5) < positionThreshold;

          console.log('Face metrics:', {
            size: relativeSize,
            x: relativeX,
            y: relativeY,
            isGoodSize,
            isGoodPosition
          });

          setFacePosition({
            isGood: isGoodSize && isGoodPosition,
            message: !isGoodSize 
              ? (relativeSize < idealRelativeSize 
                  ? "Move closer to the camera" 
                  : "Move back from the camera")
              : !isGoodPosition
              ? "Move your face to the center of the circle"
              : "Perfect! Hold still"
          });
        } else {
          setFacePosition({
            isGood: false,
            message: "Position your face in the circle"
          });
        }
      }
    } catch (error) {
      console.error('Error during face detection:', error);
    }

    requestRef.current = requestAnimationFrame(detectFaces);
  };

  useEffect(() => {
    if (!isModelLoading && isCameraReady) {
      console.log('Starting face detection loop');
      detectFaces();
    }
  }, [isModelLoading, isCameraReady]);

  return (
    <>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      <div className="relative w-full h-screen bg-gradient-to-b from-pearl-light via-rose-light/10 to-rose/5">
        {/* Main Camera Section - 75% height */}
        <div className="relative w-full h-[75vh]">
          {/* Camera View */}
          <div className="absolute inset-0">
            <Webcam
              ref={webcamRef}
              className="w-full h-full object-cover"
              mirrored
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleCameraError}
            />

            {/* Shade Overlay - Add this back */}
            {isFaceDetected && selectedShade && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(
                    circle at 50% 50%,
                    ${selectedShade.color} 0%,
                    transparent 70%
                  )`,
                  mixBlendMode: 'multiply'
                }}
              />
            )}
          </div>

          {/* Elegant Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            className="absolute top-6 left-0 right-0 text-center z-10"
          >
            <div className="inline-block">
              <h1 className="text-3xl font-light tracking-wider text-white mb-2">
                MY <span className="font-semibold bg-gradient-to-r from-gold to-rose bg-clip-text text-transparent">PEARL</span>
              </h1>
              <p className="text-sm text-white/80 tracking-widest uppercase">
                Virtual Concealer Experience
              </p>
            </div>
          </motion.div>

          {/* Face Guide Circle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div 
                className={`
                  w-[280px] h-[280px] rounded-full 
                  transition-all duration-300
                  ${isFaceDetected 
                    ? (facePosition.isGood 
                      ? 'border-[3px] border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                      : 'border-[3px] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]')
                    : 'border-[3px] border-dashed border-white/60'}
                `}
              />
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-32 left-0 right-0 flex justify-center"
          >
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <p className={`text-sm ${facePosition.isGood ? 'text-rose' : 'text-rose-dark'}`}>
                {facePosition.message}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Control Section - 25% height */}
        <div className="absolute bottom-0 left-0 right-0 h-[25vh] bg-white/90 backdrop-blur-md border-t border-rose/10">
          {/* Selected Shade Info - Compact Version */}
          {selectedShade && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-16 left-0 right-0 mx-auto w-full max-w-md bg-white/90 
                       backdrop-blur-md rounded-t-xl p-3 border border-rose/10 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-rose-dark font-medium text-sm">{selectedShade.name}</h3>
                  <p className="text-rose-dark/60 text-xs">Perfect match for your skin tone</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 bg-rose text-white text-xs rounded-full 
                                   hover:bg-rose-dark transition-colors">
                    Add to Cart
                  </button>
                  <button
                    onClick={() => setSelectedShade(null)}
                    className="px-2 py-1.5 text-rose-dark/60 text-xs hover:text-rose transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Shade Selection */}
          <div className="h-full p-4">
            {!selectedCategory ? (
              // Category Selection
              <Swiper
                slidesPerView={3.5}
                spaceBetween={10}
                className="h-full"
                breakpoints={{
                  640: { slidesPerView: 4.5 },
                  768: { slidesPerView: 5.5 },
                }}
              >
                {SHADE_CATEGORIES.map((category) => (
                  <SwiperSlide key={category.name}>
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className="w-full h-full bg-white/50 rounded-xl p-4 hover:bg-white/80 
                               transition-colors group border border-rose/10"
                    >
                      <h3 className="text-rose-dark font-medium mb-2">{category.name}</h3>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {category.shades.slice(0, 4).map((shade) => (
                          <div
                            key={shade.id}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: shade.color.replace('0.5', '1') }}
                          />
                        ))}
                      </div>
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              // Shade Selection for Category
              <div className="h-full">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mb-4 px-3 py-1.5 text-xs text-rose-dark hover:text-rose 
                           flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Categories
                </button>
                <Swiper
                  slidesPerView={4.5}
                  spaceBetween={10}
                  className="h-[calc(100%-2rem)]"
                  breakpoints={{
                    640: { slidesPerView: 5.5 },
                    768: { slidesPerView: 6.5 },
                  }}
                >
                  {selectedCategory.shades.map((shade) => (
                    <SwiperSlide key={shade.id}>
                      <button
                        onClick={() => setSelectedShade(shade)}
                        className={`
                          group relative w-full aspect-square rounded-full p-1 transition-all
                          ${selectedShade?.id === shade.id 
                            ? 'ring-2 ring-rose scale-110 shadow-lg' 
                            : 'hover:scale-105'}
                        `}
                      >
                        <div 
                          className="w-full h-full rounded-full shadow-inner"
                          style={{ 
                            backgroundColor: shade.color.replace('0.5', '1'),
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-max opacity-0 
                                      group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/75 text-white text-[10px] px-2 py-1 
                                        rounded-full whitespace-nowrap">
                            {shade.name}
                          </div>
                        </div>
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}
          </div>
        </div>

        {/* Debug Panel */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 
                        text-[10px] text-rose-dark/60 tracking-wider border border-rose/10">
          <div className="flex items-center gap-3">
            <span>Camera {isCameraReady ? '✓' : '×'}</span>
            <span>Model {!isModelLoading ? '✓' : '×'}</span>
            <span>Face {isFaceDetected ? '✓' : '×'}</span>
            <span>Position {facePosition.isGood ? '✓' : '×'}</span>
          </div>
        </div>
      </div>
    </>
  );
} 