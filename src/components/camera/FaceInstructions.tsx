'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Move, Camera, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Maximize, Minimize } from 'lucide-react';

interface Props {
  isFaceDetected: boolean;
  facePosition: {
    isGood: boolean;
    message: string;
  };
}

export default function FaceInstructions({ isFaceDetected, facePosition }: Props) {
  const { isGood, message } = facePosition;
  const [showInitialHelp, setShowInitialHelp] = useState(!isFaceDetected);
  
  // Reset initial help when face detection state changes
  useEffect(() => {
    if (!isFaceDetected) {
      setShowInitialHelp(true);
    } else if (showInitialHelp) {
      // Hide initial help after a short delay once face is detected
      const timer = setTimeout(() => setShowInitialHelp(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isFaceDetected, showInitialHelp]);
  
  // Get the appropriate direction icon based on the message
  const getDirectionIcon = () => {
    if (!isFaceDetected) return <Camera size={18} className="flex-shrink-0" />;
    if (isGood) return <CheckCircle size={18} className="flex-shrink-0" />;
    
    if (message.includes('right')) return <ArrowRight size={18} className="flex-shrink-0" />;
    if (message.includes('left')) return <ArrowLeft size={18} className="flex-shrink-0" />;
    if (message.includes('up')) return <ArrowUp size={18} className="flex-shrink-0" />;
    if (message.includes('down')) return <ArrowDown size={18} className="flex-shrink-0" />;
    if (message.includes('closer')) return <Maximize size={18} className="flex-shrink-0" />;
    if (message.includes('farther')) return <Minimize size={18} className="flex-shrink-0" />;
    
    return <Move size={18} className="flex-shrink-0" />;
  };
  
  return (
    <div className="relative" aria-live="polite">
      <AnimatePresence mode="wait">
        {showInitialHelp && !isGood && (
          <motion.div
            key="initial-help"
            className="absolute inset-x-0 bottom-full mb-2 flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-900/80 backdrop-blur-sm text-gray-200 text-xs md:text-sm px-4 py-3 rounded-lg shadow-lg max-w-xs md:max-w-sm mx-auto border border-gray-700">
              <h3 className="font-bold mb-1.5 flex items-center">
                <Camera size={14} className="mr-1.5" /> Face Detection Guide
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Position your face in the center of the frame</li>
                <li>Ensure good lighting on your face</li>
                <li>Keep a neutral expression</li>
                <li>Follow the directional guidance below</li>
              </ul>
            </div>
          </motion.div>
        )}
      
        <motion.div 
          key={message}
          className="flex justify-center my-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className={`
              px-4 py-2.5 rounded-xl text-sm font-medium
              flex items-center gap-2.5 shadow-lg backdrop-blur-sm
              ${isGood 
                ? 'bg-emerald-500/30 border border-emerald-500/40 text-emerald-200' 
                : isFaceDetected
                  ? 'bg-amber-500/30 border border-amber-500/40 text-amber-200'
                  : 'bg-neutral-800/90 border border-neutral-700 text-gray-300'}
            `}
            role="status"
          >
            {getDirectionIcon()}
            <span className="flex-1">{message}</span>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Visual indicator when position is good */}
      <AnimatePresence>
        {isGood && (
          <motion.div 
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle className="text-emerald-400 drop-shadow-glow" size={24} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 