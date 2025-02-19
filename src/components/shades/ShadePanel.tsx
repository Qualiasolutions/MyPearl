'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ShadeSwiper from './ShadeSwiper';
import { Shade } from '@/types/shades';

interface Props {
  onSelectShade: (shade: string) => void;
}

export default function ShadePanel({ onSelectShade }: Props) {
  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gold/10 shadow-lg"
      style={{ height: "auto", maxHeight: "40vh" }}
    >
      <div className="flex flex-col h-full">
        {/* Drag handle */}
        <div className="py-2 flex justify-center">
          <div className="w-12 h-1 bg-gold/20 rounded-full" />
        </div>

        {/* Title */}
        <div className="text-center pb-2">
          <h2 className="text-lg font-medium text-gray-800">shape tape™ concealer</h2>
          <p className="text-sm text-gray-500">select a shade</p>
        </div>

        {/* Shades */}
        <div className="flex-1 overflow-y-auto">
          <ShadeSwiper
            onSelectShade={onSelectShade}
          />
        </div>
      </div>
    </motion.div>
  );
} 