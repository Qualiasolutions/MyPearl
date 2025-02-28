'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  message: string;
  isGoodPosition: boolean;
}

export default function FaceInstructions({ message, isGoodPosition }: Props) {
  return (
    <AnimatePresence>
      <motion.div 
        className="absolute left-0 right-0 bottom-32 z-20 flex justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div 
          className={`
            px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium
            ${isGoodPosition 
              ? 'bg-emerald-500/80 text-white' 
              : 'bg-amber-500/80 text-white'}
          `}
        >
          {message}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 