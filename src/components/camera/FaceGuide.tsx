'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  isDetected: boolean;
  isLoading: boolean;
  status: {
    lighting: 'Good' | 'Not Good';
    lookStraight: 'Good' | 'Not Good';
    facePosition: 'Good' | 'Not Good' | 'Come Closer';
  };
}

export default function FaceGuide({ isDetected, isLoading, status }: Props) {
  const isAllGood = 
    status.lighting === 'Good' && 
    status.lookStraight === 'Good' && 
    status.facePosition === 'Good';

  if (isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Guide Circle */}
        <div 
          className={`
            w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] rounded-full 
            transition-all duration-300
            ${isDetected ? (
              isAllGood 
                ? 'border-[3px] border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                : 'border-[3px] border-white/80'
            ) : 'border-[3px] border-dashed border-white/60'}
          `}
        />

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white/90 text-lg font-medium">
              {!isDetected ? (
                "Keep your face inside the circle"
              ) : !isAllGood ? (
                "Adjust position"
              ) : (
                "Perfect!"
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 