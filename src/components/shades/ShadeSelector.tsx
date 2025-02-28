'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shade, SHADE_DATA, ShadeCategory } from '@/types/shades';
import { AlertCircle, Info } from 'lucide-react';

interface Props {
  onSelectShade: (shade: Shade) => void;
  selectedShade?: Shade | null;
  onClose?: () => void;
}

export default function ShadeSelector({ onSelectShade, selectedShade, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<ShadeCategory>('Fair');
  const categories: ShadeCategory[] = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep'];
  const [showInfo, setShowInfo] = useState(false);
  
  // Group shades by category
  const shadesByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = SHADE_DATA.filter(shade => shade.category === category);
      return acc;
    }, {} as Record<ShadeCategory, Shade[]>);
  }, [categories]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur-sm border-t border-neutral-200 rounded-t-3xl shadow-xl"
      style={{ maxHeight: '60vh' }}
    >
      <div className="flex flex-col h-full max-h-[60vh]">
        {/* Drag handle */}
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Header with title and info */}
        <div className="px-6 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-800">Select Concealer</h2>
          <button 
            onClick={() => setShowInfo(!showInfo)} 
            className="p-2 text-neutral-600 hover:text-neutral-900 transition"
          >
            <Info size={20} />
          </button>
        </div>
        
        {/* Info panel */}
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-6 py-3 mb-3 bg-neutral-100 text-sm text-neutral-700"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-neutral-500 mt-0.5" />
              <div>
                <p className="mb-1">Find your perfect concealer match by selecting a shade that's 1-2 shades lighter than your foundation.</p>
                <p>For under-eye areas, choose warmer tones to counteract dark circles. For blemishes, match your skin tone exactly.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category selection */}
        <div className="px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  px-4 py-2 rounded-full text-sm whitespace-nowrap transition
                  ${activeCategory === category 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Shades grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {shadesByCategory[activeCategory].map((shade) => (
              <button
                key={shade.id}
                onClick={() => onSelectShade(shade)}
                className="flex flex-col items-center"
              >
                <div 
                  className={`
                    w-14 h-14 rounded-full mb-1 transition
                    ${selectedShade?.id === shade.id 
                      ? 'ring-3 ring-neutral-900 scale-110' 
                      : 'ring-1 ring-neutral-200 hover:scale-105'}
                  `}
                  style={{ backgroundColor: shade.colorHex }}
                />
                <span className="text-xs text-center text-neutral-700 font-medium line-clamp-2">
                  {shade.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="p-4 border-t border-neutral-200">
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => selectedShade && onSelectShade(selectedShade)}
              disabled={!selectedShade}
              className="flex-1 py-3 px-4 bg-neutral-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition"
            >
              Apply Shade
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 