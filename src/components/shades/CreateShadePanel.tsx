'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, ArrowLeft } from 'lucide-react';
import { Shade, ShadeCategory } from '@/types/shades';
import { SHADE_DATA } from '@/data/ShadeData';

interface Props {
  onClose: () => void;
  onCreateShade: (name: string, blendedShades: Shade[]) => void;
  existingShades: Shade[];
}

export default function CreateShadePanel({ onClose, onCreateShade, existingShades }: Props) {
  const [selectedShades, setSelectedShades] = useState<Shade[]>([]);
  const [shadeName, setShadeName] = useState('Custom Shade');
  const [previewColor, setPreviewColor] = useState('#f5e6e0');
  const [activeCategory, setActiveCategory] = useState<ShadeCategory>('Fair');
  const maxSelection = 10;
  const percentPerShade = Math.floor(100 / Math.max(selectedShades.length, 1));
  const categories: ShadeCategory[] = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep'];

  // Calculate RGB values for selected shades
  const rgbValues = useMemo(() => {
    return selectedShades.map(shade => {
      const hex = shade.colorHex.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    });
  }, [selectedShades]);

  // Update preview color when selected shades change
  useEffect(() => {
    if (selectedShades.length === 0) {
      setPreviewColor('#f5e6e0');
      return;
    }

    // Calculate average color
    const avgR = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.r, 0) / rgbValues.length);
    const avgG = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.g, 0) / rgbValues.length);
    const avgB = Math.round(rgbValues.reduce((sum, rgb) => sum + rgb.b, 0) / rgbValues.length);

    setPreviewColor(`#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`);
  }, [rgbValues, selectedShades]);

  const toggleShadeSelection = (shade: Shade) => {
    if (selectedShades.some(s => s.id === shade.id)) {
      setSelectedShades(selectedShades.filter(s => s.id !== shade.id));
    } else {
      if (selectedShades.length < maxSelection) {
        setSelectedShades([...selectedShades, shade]);
      }
    }
  };

  const removeSelectedShade = (shade: Shade) => {
    setSelectedShades(selectedShades.filter(s => s.id !== shade.id));
  };

  const handleCreate = () => {
    if (selectedShades.length === 0) return;
    onCreateShade(shadeName, selectedShades);
  };

  // Filter shades by active category
  const filteredShades = SHADE_DATA.filter(shade => shade.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col"
    >
      <div className="flex-1" onClick={onClose} />
      
      <div className="bg-white rounded-t-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
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
                : 'text-neutral-400 cursor-not-allowed'}
            `}
          >
            <Check size={20} />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="overflow-y-auto flex-1 pb-safe">
          {/* Preview & Name Input */}
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center gap-4 mb-2">
              <div 
                className="w-16 h-16 rounded-full shadow-md"
                style={{ backgroundColor: previewColor }}
              />
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1 block">Shade Name</label>
                <input
                  type="text"
                  value={shadeName}
                  onChange={(e) => setShadeName(e.target.value)}
                  className="w-full bg-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  placeholder="Custom Shade Name"
                  maxLength={30}
                />
              </div>
            </div>
            
            {/* Selected shade count */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-neutral-500">
                {selectedShades.length} of {maxSelection} shades selected
              </span>
              <span className="text-xs font-medium text-neutral-700">
                {selectedShades.length > 0 ? `${percentPerShade}% per shade` : ''}
              </span>
            </div>
          </div>

          {/* Selected Shades */}
          {selectedShades.length > 0 && (
            <div className="p-4 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Selected Shades</h3>
              <div className="flex flex-wrap gap-2">
                {selectedShades.map((shade) => (
                  <div 
                    key={shade.id} 
                    className="flex items-center bg-neutral-100 rounded-full pr-2 pl-1 py-1"
                  >
                    <div 
                      className="w-5 h-5 rounded-full mr-1.5"
                      style={{ backgroundColor: shade.colorHex }}
                    />
                    <span className="text-xs font-medium mr-1.5">{shade.name}</span>
                    <span className="text-xs text-neutral-500 mr-2">{percentPerShade}%</span>
                    <button 
                      onClick={() => removeSelectedShade(shade)}
                      className="p-1 text-neutral-400 hover:text-neutral-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category selection */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Choose from shades</h3>
            <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0
                    ${activeCategory === category 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Available Shades Grid */}
          <div className="p-4 grid grid-cols-4 md:grid-cols-5 gap-3">
            {filteredShades.map((shade) => {
              const isSelected = selectedShades.some(s => s.id === shade.id);
              return (
                <button
                  key={shade.id}
                  onClick={() => toggleShadeSelection(shade)}
                  disabled={selectedShades.length >= maxSelection && !isSelected}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`
                      w-14 h-14 rounded-full mb-1.5 transition-all relative
                      ${isSelected 
                        ? 'ring-2 ring-neutral-900 scale-105' 
                        : selectedShades.length >= maxSelection 
                          ? 'opacity-40' 
                          : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: shade.colorHex }}
                  >
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-neutral-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedShades.findIndex(s => s.id === shade.id) + 1}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">
                    {shade.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}