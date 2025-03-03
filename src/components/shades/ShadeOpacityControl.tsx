'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, EyeOff, Eye, X } from 'lucide-react';

interface Props {
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onClose: () => void;
}

export default function ShadeOpacityControl({ opacity, onOpacityChange, onClose }: Props) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOpacityChange(parseFloat(e.target.value));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs"
    >
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center">
            <Sliders size={16} className="text-neutral-500 mr-2" />
            <span className="text-sm font-medium text-neutral-800">Opacity Control</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium bg-neutral-100 px-2 py-1 rounded-full text-neutral-700">
              {Math.round(opacity * 100)}%
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-3">
            <EyeOff size={16} className="text-neutral-400" />
            
            <div className="relative flex-1 h-6">
              {/* Track */}
              <div className="absolute inset-0 h-1 top-1/2 -translate-y-1/2 bg-neutral-200 rounded-full overflow-hidden">
                {/* Fill */}
                <motion.div 
                  className="h-full bg-gradient-to-r from-neutral-400 to-neutral-700"
                  initial={{ width: `${opacity * 100}%` }}
                  animate={{ width: `${opacity * 100}%` }}
                  transition={{ type: 'spring', damping: 15 }}
                />
              </div>
              
              {/* Thumb */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center"
                style={{ left: `calc(${opacity * 100}% - ${opacity * 24}px)` }}
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                whileTap={{ scale: 1.1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              </motion.div>
              
              {/* Actual input slider (invisible but functional) */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            
            <Eye size={16} className="text-neutral-700" />
          </div>
          
          {/* Preset buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[0.25, 0.5, 0.75].map((value) => (
              <button
                key={value}
                onClick={() => onOpacityChange(value)}
                className={`
                  py-1.5 text-xs font-medium rounded-md transition
                  ${Math.abs(opacity - value) < 0.05
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}
                `}
              >
                {Math.round(value * 100)}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 