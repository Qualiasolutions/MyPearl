'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Plus, Minus } from 'lucide-react';
import { Shade, ShadeCategory } from '@/types/shades';

interface ShadeWithWeight {
  shade: Shade;
  weight: number;
}

interface Props {
  onClose: () => void;
  onCreateShade: (name: string, blendedShades: Shade[]) => void;
  existingShades: Shade[];
}

export default function CreateShadePanel({ onClose, onCreateShade, existingShades }: Props) {
  const [selectedShades, setSelectedShades] = useState<ShadeWithWeight[]>([]);
  const [shadeName, setShadeName] = useState('Custom Shade');
  const [previewColor, setPreviewColor] = useState('#f5e6e0');
  const [activeCategory, setActiveCategory] = useState<ShadeCategory>('Fair');
  const maxSelection = 4; // Max 4 shades for blending
  const categories: ShadeCategory[] = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep', 'Custom'];

  // Calculate RGB values for selected shades taking weight into account
  const calculateBlendedColor = () => {
    if (selectedShades.length === 0) {
      return '#f5e6e0';
    }
    
    // Calculate weighted average of colors
    const totalWeight = selectedShades.reduce((sum, item) => sum + item.weight, 0);
    
    // Calculate weighted RGB values
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    
    selectedShades.forEach(item => {
      const hex = item.shade.colorHex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      const normalizedWeight = item.weight / totalWeight;
      
      totalR += r * normalizedWeight;
      totalG += g * normalizedWeight;
      totalB += b * normalizedWeight;
    });
    
    const avgR = Math.round(totalR);
    const avgG = Math.round(totalG);
    const avgB = Math.round(totalB);
    
    return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  };

  // Update preview color when selected shades change
  useEffect(() => {
    setPreviewColor(calculateBlendedColor());
  }, [selectedShades]);

  const toggleShadeSelection = (shade: Shade) => {
    if (selectedShades.some(s => s.shade.id === shade.id)) {
      setSelectedShades(selectedShades.filter(s => s.shade.id !== shade.id));
    } else {
      if (selectedShades.length < maxSelection) {
        setSelectedShades([...selectedShades, { shade, weight: 1 }]);
      }
    }
  };

  const removeSelectedShade = (shade: Shade) => {
    setSelectedShades(selectedShades.filter(s => s.shade.id !== shade.id));
  };

  const adjustShadeWeight = (shadeId: number, increment: number) => {
    setSelectedShades(selectedShades.map(item => {
      if (item.shade.id === shadeId) {
        // Allow adjustments in 0.1 (10%) increments between 0.1 and 2.0
        const newWeight = Math.max(0.1, Math.min(2.0, item.weight + increment));
        return { ...item, weight: newWeight };
      }
      return item;
    }));
  };

  const handleCreate = () => {
    if (selectedShades.length === 0) return;
    
    // Pass all selected shades to create function (the parent will handle the blending)
    onCreateShade(shadeName, selectedShades.map(item => item.shade));
  };

  // Filter shades by active category
  const filteredShades = useMemo(() => {
    if (!existingShades) return [];
    return existingShades.filter(shade => shade.category === activeCategory);
  }, [existingShades, activeCategory]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col"
      style={{ overflowY: 'auto', maxHeight: '100vh' }}
    >
      <div className="bg-black flex-grow">
        {/* Header - Make it sticky */}
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
        
        <div className="overflow-auto pb-20" style={{ maxHeight: 'calc(100vh - 60px)' }}>
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
          
          {/* Selected shades with weight adjustment */}
          {selectedShades.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-white/70 mb-2">Selected Shades:</h3>
              <div className="space-y-2">
                {selectedShades.map(item => (
                  <div 
                    key={item.shade.id} 
                    className="flex items-center justify-between bg-white/10 rounded-lg p-2"
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full mr-2"
                        style={{ backgroundColor: item.shade.colorHex }}
                      />
                      <span className="text-sm text-white">{item.shade.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/70 w-8 text-center">
                        {Math.round(item.weight * 10) * 10}%
                      </span>
                      
                      <button
                        onClick={() => adjustShadeWeight(item.shade.id, -0.1)}
                        className="p-1 bg-white/20 rounded-full text-white/70 hover:text-white"
                        aria-label="Decrease weight"
                      >
                        <Minus size={14} />
                      </button>
                      
                      <button
                        onClick={() => adjustShadeWeight(item.shade.id, 0.1)}
                        className="p-1 bg-white/20 rounded-full text-white/70 hover:text-white"
                        aria-label="Increase weight"
                      >
                        <Plus size={14} />
                      </button>
                      
                      <button
                        onClick={() => removeSelectedShade(item.shade)}
                        className="p-1 bg-white/20 rounded-full text-white/70 hover:text-white"
                        aria-label="Remove shade"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="px-4 mt-2 mb-4">
            <h3 className="text-sm font-medium text-white/70 mb-2">Shade Categories:</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm ${
                    activeCategory === category
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Available shades */}
          <div className="px-4 pb-20">
            <h3 className="text-sm font-medium text-white/70 mb-2">Available Shades:</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredShades.map(shade => (
                <button
                  key={shade.id}
                  onClick={() => toggleShadeSelection(shade)}
                  className="flex flex-col items-center"
                  disabled={selectedShades.length >= maxSelection && !selectedShades.some(s => s.shade.id === shade.id)}
                >
                  <div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full transition ${
                      selectedShades.some(s => s.shade.id === shade.id)
                        ? 'ring-2 ring-white scale-110'
                        : 'ring-1 ring-white/30'
                    }`}
                    style={{ backgroundColor: shade.colorHex }}
                  />
                  <span className="text-[10px] sm:text-xs text-white/80 mt-1 text-center line-clamp-1">
                    {shade.name}
                  </span>
                </button>
              ))}
              
              {filteredShades.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-white/60 text-sm">No shades available in this category</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}