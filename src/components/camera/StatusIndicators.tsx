'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  lighting: 'Good' | 'Not Good';
  lookStraight: 'Good' | 'Not Good';
  facePosition: 'Good' | 'Not Good' | 'Come Closer';
}

export default function StatusIndicators({ lighting, lookStraight, facePosition }: Props) {
  const allGood = lighting === 'Good' && lookStraight === 'Good' && facePosition === 'Good';

  if (allGood) return null;

  return (
    <div className="absolute top-safe left-0 right-0 z-10 px-4 pt-2">
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-sm rounded-2xl overflow-hidden"
        >
          <div className="flex divide-x divide-white/10">
            {lighting === 'Not Good' && (
              <div className="px-4 py-2">
                <div className="text-red-500 text-center">
                  <div className="text-sm font-medium">Lighting</div>
                  <div className="text-xs">Not Good</div>
                </div>
              </div>
            )}
            {lookStraight === 'Not Good' && (
              <div className="px-4 py-2">
                <div className="text-red-500 text-center">
                  <div className="text-sm font-medium">Look</div>
                  <div className="text-xs">Straight</div>
                </div>
              </div>
            )}
            {facePosition === 'Come Closer' && (
              <div className="px-4 py-2">
                <div className="text-red-500 text-center">
                  <div className="text-sm font-medium">Position</div>
                  <div className="text-xs">Come Closer</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 