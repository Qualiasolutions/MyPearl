'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mix, Check } from 'lucide-react';
import { Shade } from '@/types/shades';

interface Props {
  onClose: () => void;
  onCreateShade: (name: string, blendedShades: Shade[]) => void;
  existingShades: Shade[];
}

export default function CreateShadePanel({ onClose, onCreateShade, existingShades }: Props) {
  const [selectedShades, setSelectedShades] = useState<Shade[]>([]);
  const [shadeName, setShadeName] = useState('Custom Shade');
  const [previewColor, setPreviewColor] = useState('#f5e6e0');
  const maxSelection = 3;

  // Update preview color when selected shades change
  useEffect(() => {
    if (selectedShades.length === 0) {
      setPreviewColor('#f5e6e0');
      return;
    }

    // Calculate average color
    const rgbValues = selectedShades.map(shade => {
      const hex = shade.colorHex.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    });

    const avgR = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.r, 0) / rgbValues.length);
    const avgG = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.g, 0) / rgbValues.length);
    const avgB = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.b, 0) / rgbValues.length);

    setPreviewColor(`#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`);
  }, [selectedShades]);

  const toggleShadeSelection = (shade: Shade) => {
    if (selectedShades.some(s => s.id === shade.id)) {
      setSelectedShades(selectedShades.filter(s => s.id !== shade.id));
    } else {
      if (selectedShades.length < maxSelection) {
        setSelectedShades([...selectedShades, shade]);
      }
    }
  };

  const handleCreate = () => {
    if (selectedShades.length === 0) return;
    onCreateShade(shadeName, selectedShades);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col"
    >
      <div className="flex-1" onClick={onClose} />
      
      <div className="bg-white rounded-t-3xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <button
            onClick={onClose}
            className="p-2 text-neutral-600 hover:text-neutral-900 transition rounded-full hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-800">Create Custom Shade</h2>
          <button
            onClick={handleCreate}
            disabled={selectedShades.length === 0}
            className={`
              p-2 rounded-full transition
              ${selectedShades.length > 0 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-neutral-400'}
            `}
          >
            <Check size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {/* Preview & Name Input */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-16 h-16 rounded-full shadow-md"
              style={{ backgroundColor: previewColor }}
            />
            <div className="flex-1">
              <label htmlFor="shade-name" className="block text-sm font-medium text-neutral-600 mb-1">
                Name your shade
              </label>
              <input
                id="shade-name"
                type="text"
                value={shadeName}
                onChange={(e) => setShadeName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
                placeholder="Custom Shade"
              />
            </div>
          </div>
          
          {/* Selection Instructions */}
          <div className="bg-neutral-50 rounded-lg p-3 mb-4 flex items-center">
            <Mix size={18} className="text-neutral-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-neutral-600">
              Select up to {maxSelection} shades to blend together (selected: {selectedShades.length}/{maxSelection})
            </p>
          </div>
          
          {/* Shade Selection Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {existingShades.map((shade) => (
              <button
                key={shade.id}
                onClick={() => toggleShadeSelection(shade)}
                className={`
                  aspect-square rounded-lg relative p-2 transition
                  ${selectedShades.some(s => s.id === shade.id)
                    ? 'ring-2 ring-neutral-900 shadow' 
                    : 'hover:bg-neutral-50'}
                `}
              >
                <div 
                  className="w-full h-full rounded-full shadow-inner"
                  style={{ backgroundColor: shade.colorHex }}
                />
                {selectedShades.some(s => s.id === shade.id) && (
                  <div className="absolute top-1 right-1 bg-neutral-900 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-medium">
                    {selectedShades.findIndex(s => s.id === shade.id) + 1}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 text-center">
                  <span className="text-[10px] font-medium truncate block px-1">
                    {shade.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Create Button */}
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={handleCreate}
            disabled={selectedShades.length === 0}
            className={`
              w-full py-3 rounded-lg font-medium transition
              ${selectedShades.length > 0
                ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}
            `}
          >
            Create Custom Shade
          </button>
        </div>
      </div>
    </motion.div>
  );
}