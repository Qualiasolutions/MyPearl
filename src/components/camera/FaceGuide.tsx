'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FacePositionType } from '@/types/faceDetection';

interface FaceGuideProps {
  facePosition: FacePositionType;
  isFaceDetected: boolean;
}

export default function FaceGuide({ facePosition, isFaceDetected }: FaceGuideProps) {
  // Determine the color based on position status
  const guideColor = facePosition.isGood ? 'border-green-500' : 'border-yellow-400';
  
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-20 pointer-events-none">
      <div className="h-full w-full flex items-center justify-center">
        {/* Face Guide Circle - Always visible */}
        <motion.div
          initial={{ opacity: 0.4, scale: 0.9 }}
          animate={{ 
            opacity: isFaceDetected ? 0.9 : 0.5,
            scale: isFaceDetected ? (facePosition.isGood ? 1.05 : 1) : 0.95,
            borderColor: isFaceDetected ? (facePosition.isGood ? 'rgb(34, 197, 94)' : 'rgb(250, 204, 21)') : 'rgb(229, 231, 235)'
          }}
          transition={{ duration: 0.3 }}
          className={`
            relative w-64 h-64 rounded-full border-4 backdrop-blur-sm
            ${isFaceDetected ? guideColor : 'border-gray-200'}
            flex items-center justify-center
          `}
        >
          {/* Center Face Indicator - Only shown when no face is detected */}
          {!isFaceDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute flex flex-col items-center justify-center gap-2"
            >
              <div className="w-16 h-16 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </motion.div>
              </div>
              <p className="text-white text-xs font-medium px-4 py-1 bg-black/30 backdrop-blur-sm rounded-full shadow-sm">
                Center your face
              </p>
            </motion.div>
          )}
          
          {/* Face Position Status - Only shown when face is detected */}
          {isFaceDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                scale: facePosition.isGood ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
              className={`
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                w-8 h-8 rounded-full flex items-center justify-center
                ${facePosition.isGood ? 'bg-green-500' : 'bg-yellow-400'}
              `}
            >
              {facePosition.isGood ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 