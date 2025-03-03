'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Trash2, ArrowLeft } from 'lucide-react';
import { Shade, ShadeCategory } from '@/types/shades';

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
  const maxSelection = 5;
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
  const filteredShades = useMemo(() => {
    return [...existingShades].filter(shade => shade.category === activeCategory);
  }, [existingShades, activeCategory]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col"
    >
      <div className="bg-black flex-grow overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black border-b border-white/10 p-4 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="p-2 -m-2 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg font-medium text-white">Create Custom Shade</h2>
          <button
            onClick={handleCreate}
            disabled={selectedShades.length === 0}
            className={`p-2 -m-2 ${selectedShades.length === 0 ? 'text-white/30' : 'text-white/70 hover:text-white'}`}
          >
            <Check size={24} />
          </button>
        </div>
        
        {/* Preview */}
        <div className="p-4 flex flex-col items-center">
          <div 
            className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg"
            style={{ backgroundColor: previewColor }}
          />
          <input
            type="text"
            value={shadeName}
            onChange={(e) => setShadeName(e.target.value)}
            className="mt-4 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center w-full max-w-xs"
            placeholder="Shade Name"
          />
          
          <div className="mt-4 text-sm text-white/70 text-center">
            <p>Select up to {maxSelection} shades to blend</p>
            <p className="text-xs mt-1">Selected: {selectedShades.length}/{maxSelection}</p>
          </div>
        </div>
        
        {/* Selected shades */}
        {selectedShades.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-sm font-medium text-white/70 mb-2">Selected Shades:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedShades.map(shade => (
                <div 
                  key={shade.id} 
                  className="flex items-center bg-white/10 rounded-full pl-2 pr-1 py-1"
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-1"
                    style={{ backgroundColor: shade.colorHex }}
                  />
                  <span className="text-xs text-white mr-1">{shade.name}</span>
                  <button
                    onClick={() => removeSelectedShade(shade)}
                    className="p-1 text-white/70 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Category tabs */}
        <div className="px-4 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  activeCategory === category 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Shade grid */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {filteredShades.map(shade => (
            <button
              key={shade.id}
              onClick={() => toggleShadeSelection(shade)}
              className="flex flex-col items-center"
            >
              <div 
                className={`w-14 h-14 rounded-full ${
                  selectedShades.some(s => s.id === shade.id)
                    ? 'ring-2 ring-white scale-110'
                    : 'border border-white/20'
                }`}
                style={{ backgroundColor: shade.colorHex }}
              />
              <span className="text-xs text-white/80 mt-1 text-center line-clamp-1">
                {shade.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}