'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Guide Circle */}
      <div className="w-64 h-64 rounded-full border-2 border-dashed border-white/50"></div>
      
      {/* Face Position Indicator */}
      {isFaceDetected && facePosition.center && (
        <motion.div 
          className={`
            w-24 h-24 rounded-full absolute border-2
            ${facePosition.isGood ? 'border-emerald-400' : 'border-amber-400'}
          `}
          animate={{
            x: `calc(${(facePosition.center.x - 0.5) * 200}px)`,
            y: `calc(${(facePosition.center.y - 0.5) * 200}px)`,
            scale: facePosition.isGood ? 1.2 : 1,
            opacity: 0.7,
          }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 20
          }}
          style={{
            top: '50%',
            left: '50%',
            marginLeft: '-3rem',
            marginTop: '-3rem',
          }}
        />
      )}
      
      {/* Status Indicator */}
      {isFaceDetected && facePosition.isGood && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Face Detected
        </motion.div>
      )}
    </div>
  );
} 