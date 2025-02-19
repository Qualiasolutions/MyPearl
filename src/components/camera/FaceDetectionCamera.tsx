'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
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

export default function FaceDetectionCamera() {
  const webcamRef = useRef<Webcam>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState<FacePosition>({
    isGood: false,
    message: "Position your face in the circle"
  });
  const detector = useRef<faceLandmarksDetection.FaceLandmarksDetector>(null);
  const requestRef = useRef<number>();
  const [selectedShade, setSelectedShade] = useState<Shade | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [showCreateShade, setShowCreateShade] = useState(false);
  const [customShades, setCustomShades] = useState<CustomShade[]>([]);

  // Combine sample and custom shades
  const allShades = useMemo(() => [...SAMPLE_SHADES, ...customShades], [customShades]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  const handleUserMedia = () => {
    console.log('Camera initialized');
    setIsCameraReady(true);
  };

  const handleCameraError = (error: string | DOMException) => {
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

        const faces = await detector.current.estimateFaces(video) as DetectedFace[];

        const hasFaces = faces && faces.length > 0;
        setIsFaceDetected(hasFaces);
        
        if (hasFaces) {
          const face = faces[0];
          const box = face.box || {
            xMin: face.boundingBox.topLeft[0],
            yMin: face.boundingBox.topLeft[1],
            width: face.boundingBox.bottomRight[0] - face.boundingBox.topLeft[0],
            height: face.boundingBox.bottomRight[1] - face.boundingBox.topLeft[1]
          };

          const faceWidth = box.width || box.xMax - box.xMin;
          const faceHeight = box.height || box.yMax - box.yMin;
          const faceCenterX = box.xMin + faceWidth / 2;
          const faceCenterY = box.yMin + faceHeight / 2;
          
          const relativeX = faceCenterX / videoWidth;
          const relativeY = faceCenterY / videoHeight;
          const relativeSize = Math.max(faceWidth, faceHeight) / Math.min(videoWidth, videoHeight);

          const idealRelativeSize = 0.5;
          const sizeThreshold = 0.15;
          const positionThreshold = 0.15;

          const isGoodSize = Math.abs(relativeSize - idealRelativeSize) < sizeThreshold;
          const isGoodPosition = 
            Math.abs(relativeX - 0.5) < positionThreshold && 
            Math.abs(relativeY - 0.5) < positionThreshold;

          setFacePosition({
            isGood: isGoodSize && isGoodPosition,
            message: !isGoodSize 
              ? (relativeSize < idealRelativeSize 
                  ? "Move closer to the camera" 
                  : "Move back from the camera")
              : !isGoodPosition
              ? "Move your face to the center of the circle"
              : "Perfect! Hold still",
            center: {
              x: relativeX,
              y: relativeY
            }
          });
        } else {
          setFacePosition({
            isGood: false,
            message: "Position your face in the circle",
            center: undefined
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
  }, [isModelLoading, isCameraReady, detectFaces]);

  const capturePhoto = () => {
    if (webcamRef.current && facePosition.isGood) {
      const imageSrc = webcamRef.current.getScreenshot();
      const newPhoto: CapturedPhoto = {
        imageUrl: imageSrc || '',
        shade: selectedShade,
        timestamp: Date.now()
      };
      setPhotos(prev => [...prev, newPhoto]);
      setLastCapturedPhoto(newPhoto);
      setShowPhotoPreview(true);
    }
  };

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

            {/* Shade Overlay */}
            {isFaceDetected && selectedShade && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(
                    ellipse at 50% 50%,
                    ${selectedShade.color.replace('0.5', '0.8')} 0%,
                    ${selectedShade.color.replace('0.5', '0.6')} 25%,
                    ${selectedShade.color.replace('0.5', '0.3')} 45%,
                    transparent 60%
                  )`,
                  mixBlendMode: 'multiply',
                  width: '240px',
                  height: '340px',
                  position: 'absolute',
                  left: `${(1 - (facePosition.center?.x || 0.5)) * 100}%`,
                  top: `${(facePosition.center?.y || 0.5) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  maskImage: `radial-gradient(
                    ellipse at 50% 50%,
                    black 0%,
                    black 45%,
                    transparent 60%
                  )`,
                  WebkitMaskImage: `radial-gradient(
                    ellipse at 50% 50%,
                    black 0%,
                    black 45%,
                    transparent 60%
                  )`,
                  transition: 'left 0.1s ease-out, top 0.1s ease-out'
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
          <div className="h-full p-4 flex flex-col">
            {!selectedCategory ? (
              <div className="flex flex-col gap-4">
                {/* Create Your Own Shade Button - More Elegant */}
                <button
                  onClick={() => setShowCreateShade(true)}
                  className="relative group overflow-hidden"
                >
                  <div className="relative px-8 py-4 bg-gradient-to-r from-gold/90 via-rose/90 to-gold/90 
                                  rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl
                                  group-hover:scale-[1.02] border border-white/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose via-gold to-rose 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center justify-center gap-3">
                      <span className="text-sm font-medium tracking-wide text-white">
                        Create Your Perfect Blend
                      </span>
                      <span className="w-px h-4 bg-white/30" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" style={{ animationDelay: '200ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" style={{ animationDelay: '400ms' }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Categories - Fixed Grid with Color Representation */}
                <div className="grid grid-cols-5 gap-3 px-4">
                  {SHADE_CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category)}
                      className="group relative flex flex-col items-center gap-2 p-3 
                                 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <div className="w-12 h-12 rounded-full shadow-lg transition-transform duration-300
                                    group-hover:scale-110 group-hover:shadow-xl border border-white/20"
                           style={{ backgroundColor: category.color }}
                      />
                      <div className="text-[10px] font-medium tracking-wider text-rose-dark/70 
                                    transition-colors duration-300 group-hover:text-rose-dark">
                        {category.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
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

        {/* Debug Panel - Moved to bottom left */}
        <div className="absolute bottom-[28vh] left-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 
                        text-[10px] text-rose-dark/60 tracking-wider border border-rose/10 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span>Camera {isCameraReady ? '✓' : '×'}</span>
            <span className="w-[1px] h-2 bg-rose-dark/20" />
            <span>Model {!isModelLoading ? '✓' : '×'}</span>
            <span className="w-[1px] h-2 bg-rose-dark/20" />
            <span>Face {isFaceDetected ? '✓' : '×'}</span>
            <span className="w-[1px] h-2 bg-rose-dark/20" />
            <span>Position {facePosition.isGood ? '✓' : '×'}</span>
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-[28vh] right-4">
          <button
            onClick={capturePhoto}
            disabled={!facePosition.isGood}
            className={`
              p-3 rounded-full transition-all
              ${facePosition.isGood 
                ? 'bg-rose text-white hover:bg-rose-dark' 
                : 'bg-rose/30 text-white/50 cursor-not-allowed'}
            `}
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Photo Preview */}
      <AnimatePresence>
        {showPhotoPreview && lastCapturedPhoto && (
          <PhotoPreview 
            photo={lastCapturedPhoto} 
            onClose={() => setShowPhotoPreview(false)} 
          />
        )}
      </AnimatePresence>

   {/* Create Shade Modal */}
<AnimatePresence>
  {showCreateShade && (
    <CreateShadeModal 
      onClose={() => setShowCreateShade(false)}
      onSave={(newShade) => {
        setCustomShades(prev => [...prev, newShade]);
        setSelectedShade(newShade);
        setShowCreateShade(false);
      }}
    />
  )}
</AnimatePresence>
</>
);
}

const PhotoPreview = ({ photo, onClose }: { photo: CapturedPhoto; onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <motion.div 
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="bg-white rounded-2xl overflow-hidden max-w-md w-full"
    >
      <div className="relative">
        <Image 
          src={photo.imageUrl} 
          alt="Captured look" 
          width={400}
          height={533}
          className="w-full aspect-[3/4] object-cover"
        />
        {photo.shade && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5">
            <p className="text-sm text-rose-dark">Shade: {photo.shade.name}</p>
          </div>
        )}
      </div>
      <div className="p-4 flex gap-2 justify-end">
        <button
          onClick={() => {
            // Download functionality
            const link = document.createElement('a');
            link.href = photo.imageUrl;
            link.download = `my-pearl-look-${photo.timestamp}.jpg`;
            link.click();
          }}
          className="px-4 py-2 text-sm text-rose hover:text-rose-dark transition-colors"
        >
          Download
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-rose-dark/60 hover:text-rose-dark transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const CreateShadeModal = ({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void;
  onSave: (shade: CustomShade) => void;
}) => {
  const [selectedShades, setSelectedShades] = useState<Shade[]>([]);
  const [customName, setCustomName] = useState('');

  // Use SAMPLE_SHADES directly
  const availableShades = SAMPLE_SHADES;

  // Calculate blended color whenever selected shades change
  const blendedColor = useMemo(() => {
    if (selectedShades.length === 0) return null;
    
    const blended = selectedShades.reduce((acc, shade) => {
      const rgba = shade.color.match(/[\d.]+/g)?.map(Number) || [];
      return acc.map((v, i) => v + rgba[i] / selectedShades.length);
    }, [0, 0, 0, 0]);

    return `rgba(${blended[0]}, ${blended[1]}, ${blended[2]}, ${blended[3]})`;
  }, [selectedShades]);

  const handleShadeSelect = (shade: Shade) => {
    if (selectedShades.includes(shade)) {
      setSelectedShades(prev => prev.filter(s => s.id !== shade.id));
    } else if (selectedShades.length < 4) {
      setSelectedShades(prev => [...prev, shade]);
    }
  };

  const handleSave = () => {
    if (!blendedColor || !customName) return;
    
    const newShade: CustomShade = {
      id: `custom-${Date.now()}`,
      name: customName,
      color: blendedColor,
      isCustom: true,
      blendedFrom: selectedShades
    };
    
    onSave(newShade);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-xl max-h-[90vh]"
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-rose-dark">
              Create Your Perfect Blend
            </h2>
            <button
              onClick={onClose}
              className="text-rose-dark/60 hover:text-rose-dark"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-[1.5fr,1fr] gap-4 h-full">
            {/* Left side - Shade Selection */}
            <div className="flex flex-col">
              <p className="text-sm text-rose-dark/60 mb-2">
                Select up to 4 shades to blend ({selectedShades.length}/4 selected)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 h-[260px] overflow-y-auto p-1">
                {availableShades.map((shade) => (
                  <button
                    key={shade.id}
                    onClick={() => handleShadeSelect(shade)}
                    className={`
                      group relative p-1 rounded-xl transition-all
                      ${selectedShades.includes(shade) 
                        ? 'bg-rose/10 ring-1 ring-rose'
                        : 'hover:bg-rose/5 border border-rose/10'}
                    `}
                  >
                    <div 
                      className="w-full aspect-square rounded-full mb-1 shadow-sm"
                      style={{ backgroundColor: shade.color.replace('0.5', '1') }}
                    />
                    <p className="text-[10px] text-rose-dark/80 text-center truncate px-1">{shade.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side - Preview and Controls */}
            <div className="flex flex-col gap-2">
              {/* Selected Shades Pills */}
              <div>
                <label className="text-xs text-rose-dark/80 block mb-1">
                  Selected Shades
                </label>
                <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                  {selectedShades.map((shade) => (
                    <div 
                      key={shade.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full 
                               bg-rose/5 border border-rose/10"
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: shade.color.replace('0.5', '1') }}
                      />
                      <span className="text-[10px] text-rose-dark">{shade.name}</span>
                      <button
                        onClick={() => handleShadeSelect(shade)}
                        className="ml-0.5 text-rose-dark/40 hover:text-rose-dark"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {blendedColor && (
                <div className="text-center py-1">
                  <h3 className="text-sm font-light text-rose-dark mb-1">
                    Your Custom Blend
                  </h3>
                  <div className="relative mx-auto w-16 h-16">
                    <div 
                      className="w-full h-full rounded-full shadow-lg"
                      style={{ backgroundColor: blendedColor.replace('0.5', '1') }}
                    />
                    <div className="absolute inset-0 rounded-full shadow-inner" />
                  </div>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="text-xs text-rose-dark/80 block mb-1">
                  Name Your Custom Shade
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., My Perfect Pearl"
                  className="w-full px-2 py-1 rounded-lg border border-rose/20 
                           focus:outline-none focus:ring-1 focus:ring-rose/20 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-1 text-xs text-rose-dark/60 
                           hover:text-rose-dark transition-colors border 
                           border-rose/10 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!blendedColor || !customName}
                  className={`
                    flex-1 px-4 py-1 text-xs rounded-lg transition-all
                    ${blendedColor && customName
                      ? 'bg-rose text-white hover:bg-rose-dark'
                      : 'bg-rose/30 text-white/50 cursor-not-allowed'}
                  `}
                >
                  Save Custom Shade
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};