'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Move } from 'lucide-react';

interface Props {
  isFaceDetected: boolean;
  facePosition: {
    isGood: boolean;
    message: string;
  };
}

export default function FaceInstructions({ isFaceDetected, facePosition }: Props) {
  const { isGood, message } = facePosition;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={message}
        className="flex justify-center mt-4 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className={`
            px-4 py-2.5 rounded-xl text-sm font-medium
            flex items-center gap-2.5 shadow-lg
            ${isGood 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200' 
              : isFaceDetected
                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200'
                : 'bg-neutral-800/80 text-gray-300'}
          `}
        >
          {!isFaceDetected ? (
            <AlertCircle size={16} className="flex-shrink-0" />
          ) : isGood ? (
            <CheckCircle size={16} className="flex-shrink-0" />
          ) : (
            <Move size={16} className="flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 