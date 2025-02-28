'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Move } from 'lucide-react';

interface Props {
  message: string;
  isGoodPosition: boolean;
  isFaceDetected: boolean;
}

export default function FaceInstructions({ message, isGoodPosition, isFaceDetected }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={message}
        className="absolute left-0 right-0 bottom-28 md:bottom-32 z-20 flex justify-center px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className={`
            px-4 py-2.5 rounded-xl backdrop-blur-md text-sm font-medium
            flex items-center gap-2.5 shadow-lg
            ${isGoodPosition 
              ? 'bg-emerald-500/80 text-white' 
              : isFaceDetected
                ? 'bg-amber-500/80 text-white'
                : 'bg-neutral-800/80 text-white'}
          `}
        >
          {!isFaceDetected ? (
            <AlertCircle size={16} className="flex-shrink-0" />
          ) : isGoodPosition ? (
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