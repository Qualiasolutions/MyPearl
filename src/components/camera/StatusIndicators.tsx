'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  isModelLoading: boolean;
  isFaceDetected: boolean;
  facePosition: {
    isGood: boolean;
    message: string;
  };
  error: string | null;
}

export default function StatusIndicators({ isModelLoading, isFaceDetected, facePosition, error }: Props) {
  return (
    <motion.div 
      className="absolute top-4 left-4 flex flex-col gap-2 z-50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Model Status */}
      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        {!isModelLoading ? (
          <CheckCircle size={16} className="text-emerald-400" />
        ) : (
          <Loader2 size={16} className="text-amber-400 animate-spin" />
        )}
        <span className="text-xs text-white">AI Model</span>
      </div>
      
      {/* Face Detection Status */}
      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        {isFaceDetected ? (
          <CheckCircle size={16} className="text-emerald-400" />
        ) : (
          <XCircle size={16} className="text-rose-400" />
        )}
        <span className="text-xs text-white">Face Detected</span>
      </div>
      
      {/* Face Position Status */}
      {isFaceDetected && (
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          {facePosition.isGood ? (
            <CheckCircle size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-amber-400" />
          )}
          <span className="text-xs text-white">Positioning</span>
        </div>
      )}
      
      {/* Error Indicator */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-600/30 backdrop-blur-sm px-3 py-1 rounded-full">
          <AlertCircle size={16} className="text-rose-400" />
          <span className="text-xs text-white">Error</span>
        </div>
      )}
    </motion.div>
  );
} 