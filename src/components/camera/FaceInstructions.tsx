'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceDetectionStore } from '@/store/FaceDetectionStore';

interface Props {
  isVisible: boolean;
  lighting: 'Good' | 'Not Good';
  lookStraight: 'Good' | 'Not Good';
  facePosition: 'Good' | 'Not Good' | 'Come Closer';
}

export default function FaceInstructions({ isVisible, lighting, lookStraight, facePosition }: Props) {
  const { cameraPermission } = useFaceDetectionStore();

  if (cameraPermission !== 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-white/60"
      >
        Please allow camera access to continue
      </motion.div>
    );
  }

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2"
      >
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-white text-sm">Keep your face inside the circle</p>
        </div>
        <div className="flex gap-2">
          {lighting === 'Not Good' && (
            <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <p className="text-white text-xs">Improve Lighting</p>
            </div>
          )}
          {lookStraight === 'Not Good' && (
            <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <p className="text-white text-xs">Look Straight</p>
            </div>
          )}
          {facePosition === 'Come Closer' && (
            <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <p className="text-white text-xs">Come Closer</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 