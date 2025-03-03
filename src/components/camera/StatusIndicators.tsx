'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  isModelLoading: boolean;
  isGoodPosition: boolean;
  message: string;
  selectedShade?: string;
}

export default function StatusIndicators({ 
  isModelLoading, 
  isGoodPosition, 
  message,
  selectedShade
}: Props) {
  // More helpful messages based on state
  const getStatusMessage = () => {
    if (isModelLoading) return 'Loading face detection...';
    if (!isGoodPosition) return 'Keep your face centered';
    if (selectedShade) return `${selectedShade} applied`;
    return 'Face detected - Select a shade';
  };

  return (
    <motion.div 
      className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main status indicator */}
      <div 
        className={`bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 ${
          isGoodPosition && !isModelLoading ? 'border border-green-500/50' : ''
        }`}
      >
        {isModelLoading ? (
          <Loader2 size={16} className="text-white animate-spin" />
        ) : isGoodPosition ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <XCircle size={16} className="text-white" />
        )}
        <span className="text-sm text-white font-medium">{getStatusMessage()}</span>
      </div>
    </motion.div>
  );
} 