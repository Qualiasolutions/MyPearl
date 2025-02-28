'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  isModelLoaded: boolean;
  isCameraInitialized: boolean;
  isFaceDetected: boolean;
}

export default function StatusIndicators({ isModelLoaded, isCameraInitialized, isFaceDetected }: Props) {
  return (
    <motion.div 
      className="absolute top-4 left-4 flex flex-col gap-2 z-10"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Camera Status */}
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
        {isCameraInitialized ? (
          <CheckCircle size={16} className="text-emerald-400" />
        ) : (
          <Loader2 size={16} className="text-amber-400 animate-spin" />
        )}
        <span className="text-xs text-white">Camera</span>
      </div>
      
      {/* Model Status */}
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
        {isModelLoaded ? (
          <CheckCircle size={16} className="text-emerald-400" />
        ) : (
          <Loader2 size={16} className="text-amber-400 animate-spin" />
        )}
        <span className="text-xs text-white">AI Model</span>
      </div>
      
      {/* Face Detection Status */}
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
        {isFaceDetected ? (
          <CheckCircle size={16} className="text-emerald-400" />
        ) : (
          <XCircle size={16} className="text-rose-400" />
        )}
        <span className="text-xs text-white">Face Detected</span>
      </div>
    </motion.div>
  );
} 