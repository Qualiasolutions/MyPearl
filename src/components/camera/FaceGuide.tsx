'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle } from 'lucide-react';

interface FacePosition {
  isGood: boolean;
  message: string;
  center?: { x: number; y: number };
}

interface Props {
  facePosition: FacePosition;
  isFaceDetected: boolean;
}

export default function FaceGuide({ facePosition, isFaceDetected }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Face Guide Circle */}
      <motion.div 
        className="w-64 h-64 md:w-72 md:h-72 rounded-full border-2 border-dashed transition-colors"
        animate={{
          borderColor: isFaceDetected 
            ? facePosition.isGood 
              ? 'rgba(16, 185, 129, 0.7)' 
              : 'rgba(245, 158, 11, 0.7)' 
            : 'rgba(255, 255, 255, 0.5)',
          scale: isFaceDetected && facePosition.isGood ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          duration: 0.5, 
          repeat: isFaceDetected && facePosition.isGood ? Infinity : 0,
          repeatType: "reverse"
        }}
      />
      
      {/* Initial Camera Icon (when no face detected) */}
      <AnimatePresence>
        {!isFaceDetected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute flex flex-col items-center"
          >
            <Camera size={40} className="text-white/70 mb-3" />
            <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-white text-sm font-medium">Position your face in the circle</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Face Position Indicator */}
      {isFaceDetected && facePosition.center && (
        <motion.div 
          className={`
            w-28 h-28 rounded-full absolute border-2
            ${facePosition.isGood ? 'border-emerald-400/70' : 'border-amber-400/70'}
          `}
          animate={{
            x: `calc(${(facePosition.center.x - 0.5) * 200}px)`,
            y: `calc(${(facePosition.center.y - 0.5) * 200}px)`,
            scale: facePosition.isGood ? [1, 1.05, 1] : 1,
            opacity: 0.7,
          }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 20,
            scale: {
              duration: 0.5,
              repeat: facePosition.isGood ? Infinity : 0,
              repeatType: "reverse"
            }
          }}
          style={{
            top: '50%',
            left: '50%',
            marginLeft: '-3.5rem',
            marginTop: '-3.5rem',
          }}
        />
      )}
      
      {/* Face Detected Success Indicator */}
      <AnimatePresence>
        {isFaceDetected && facePosition.isGood && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle size={16} className="animate-pulse" />
            Face Detected
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 