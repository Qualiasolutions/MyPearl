'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, Heart } from 'lucide-react';
import { Shade } from '@/types/shades';

interface Props {
  shade: Shade | null;
  onClose: () => void;
  onSave: (shade: Shade) => void;
  savedShades: Shade[];
}

export default function ShadeDetails({ shade, onClose, onSave, savedShades }: Props) {
  if (!shade) return null;
  
  const isSaved = savedShades.some(s => s.id === shade.id);
  
  const handleSave = () => {
    onSave(shade);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="relative h-32 flex items-center justify-center" style={{ backgroundColor: shade.colorHex }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition"
          >
            <X size={18} />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">{shade.name}</h2>
            <p className="text-white/80 text-sm mt-1">{shade.category}</p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Color Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-full shadow-md mr-3"
                style={{ backgroundColor: shade.colorHex }}
              />
              <div>
                <p className="text-sm text-neutral-500">Color Code</p>
                <p className="font-mono font-medium">{shade.colorHex}</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              className={`
                p-3 rounded-full transition
                ${isSaved 
                  ? 'bg-rose-50 text-rose-500' 
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}
              `}
            >
              <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          {/* Shade Details */}
          <div className="bg-neutral-50 rounded-xl p-4 mb-5">
            <div className="flex items-center mb-3">
              <Info size={16} className="text-neutral-500 mr-2" />
              <h3 className="text-sm font-medium text-neutral-700">Shade Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-neutral-500 mb-1">Category</p>
                <p className="font-medium">{shade.category}</p>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-neutral-500 mb-1">ID</p>
                <p className="font-medium">{shade.id}</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
            >
              Close
            </button>
            
            <button
              onClick={handleSave}
              className={`
                flex-1 py-3 rounded-lg font-medium transition
                ${isSaved 
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'}
              `}
            >
              {isSaved ? 'Saved' : 'Save Shade'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 