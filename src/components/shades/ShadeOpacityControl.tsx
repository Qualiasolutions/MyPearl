'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';

interface Props {
  opacity: number;
  setOpacity: (opacity: number) => void;
  onClose: () => void;
}

export default function ShadeOpacityControl({ opacity, setOpacity, onClose }: Props) {
  const [localOpacity, setLocalOpacity] = useState(opacity);
  
  // Preset opacity levels for quick selection
  const opacityPresets = [0.25, 0.5, 0.75, 1.0];
  
  // Apply local opacity to parent state when component unmounts
  useEffect(() => {
    return () => {
      setOpacity(localOpacity);
    };
  }, [localOpacity, setOpacity]);
  
  // Handle slider change
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOpacity(parseFloat(e.target.value));
  };
  
  // Adjust opacity with buttons by 0.05 (5%) increments
  const adjustOpacity = (amount: number) => {
    const newOpacity = Math.max(0.05, Math.min(1, localOpacity + amount));
    setLocalOpacity(newOpacity);
  };
  
  // Apply current opacity immediately
  const applyOpacity = () => {
    setOpacity(localOpacity);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-0 z-30 bg-black/95 backdrop-blur-sm border-t border-white/20 rounded-t-3xl shadow-xl" 
    >
      <div className="flex flex-col px-4 pb-safe overflow-hidden max-h-[50vh]">
        {/* Drag handle */}
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Adjust Opacity</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Opacity control */}
        <div className="flex flex-col gap-6">
          {/* Slider with value display */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustOpacity(-0.05)}
              className="p-2 bg-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Decrease opacity"
            >
              <Minus size={16} />
            </button>
            
            <div className="flex-grow relative">
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.01"
                value={localOpacity}
                onChange={handleOpacityChange}
                onMouseUp={applyOpacity}
                onTouchEnd={applyOpacity}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
              />
            </div>
            
            <button
              onClick={() => adjustOpacity(0.05)}
              className="p-2 bg-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Increase opacity"
            >
              <Plus size={16} />
            </button>
            
            <div className="w-16 text-center">
              <span className="text-sm font-medium text-white">
                {Math.round(localOpacity * 100)}%
              </span>
            </div>
          </div>
          
          {/* Preset buttons */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {opacityPresets.map(preset => (
              <button
                key={preset}
                onClick={() => {
                  setLocalOpacity(preset);
                  setOpacity(preset);
                }}
                className={`py-2 rounded-lg text-sm transition-colors ${
                  Math.abs(localOpacity - preset) < 0.02
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {Math.round(preset * 100)}%
              </button>
            ))}
          </div>
          
          {/* Apply button */}
          <button
            onClick={() => {
              setOpacity(localOpacity);
              onClose();
            }}
            className="w-full py-3 bg-white text-black rounded-lg font-medium mb-6 hover:bg-white/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
} 