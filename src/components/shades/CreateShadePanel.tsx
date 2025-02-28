'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shade } from '@/types/shades';
import { X, AlertCircle, Palette, RefreshCw, Check } from 'lucide-react';

interface Props {
  shades: Shade[];
  onCreateShade: (name: string, blendedShades: Shade[]) => void;
  onClose: () => void;
}

export interface CustomShade {
  id: string;
  name: string;
  color: string;
  isCustom: true;
  blendedFrom: Shade[];
}

export default function CreateShadePanel({ shades, onCreateShade, onClose }: Props) {
  const [selectedShades, setSelectedShades] = useState<Shade[]>([]);
  const [shadeName, setShadeName] = useState('');
  const [previewColor, setPreviewColor] = useState('#F3E0D8');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Update preview color when selected shades change
  useEffect(() => {
    if (selectedShades.length === 0) {
      setPreviewColor('#F3E0D8');
      return;
    }
    
    // Simple color blending algorithm
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 244, b: 216 };
    };
    
    // Blend the colors
    const colors = selectedShades.map(shade => hexToRgb(shade.colorHex));
    const blended = colors.reduce((acc, color) => {
      return {
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b
      };
    }, { r: 0, g: 0, b: 0 });
    
    const r = Math.round(blended.r / colors.length);
    const g = Math.round(blended.g / colors.length);
    const b = Math.round(blended.b / colors.length);
    
    setPreviewColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }, [selectedShades]);
  
  const toggleShade = (shade: Shade) => {
    if (selectedShades.find(s => s.id === shade.id)) {
      setSelectedShades(prev => prev.filter(s => s.id !== shade.id));
    } else {
      if (selectedShades.length >= 3) {
        setErrorMessage('You can only select up to 3 shades to blend');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      setSelectedShades(prev => [...prev, shade]);
    }
  };
  
  const createShade = () => {
    if (selectedShades.length === 0) {
      setErrorMessage('Please select at least one shade to blend');
      return;
    }
    
    if (!shadeName.trim()) {
      setErrorMessage('Please enter a name for your custom shade');
      return;
    }
    
    onCreateShade(shadeName, selectedShades);
    onClose();
  };
  
  const generateRandomName = () => {
    const adjectives = ['Silky', 'Dewy', 'Velvet', 'Matte', 'Glowing', 'Radiant', 'Luminous', 'Soft'];
    const nouns = ['Pearl', 'Caramel', 'Sunset', 'Horizon', 'Dune', 'Sand', 'Nectar', 'Honey'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    setShadeName(`${randomAdjective} ${randomNoun}`);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/50"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Create Custom Shade</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>
        
        {/* Preview */}
        <div className="p-6 flex items-center justify-center bg-neutral-50">
          <div className="flex flex-col items-center">
            <div 
              className="w-20 h-20 rounded-full shadow-lg border border-neutral-200"
              style={{ backgroundColor: previewColor }}
            />
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={shadeName}
                onChange={(e) => setShadeName(e.target.value)}
                placeholder="Name your shade"
                className="px-3 py-2 border rounded text-sm"
              />
              <button 
                onClick={generateRandomName}
                className="p-2 text-neutral-600 hover:text-neutral-900"
                title="Generate random name"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}
        
        {/* Shade selection */}
        <div className="p-4 border-t border-neutral-100">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Palette size={16} />
            Select shades to blend (max 3)
          </h3>
          
          <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
            {shades.map(shade => (
              <button
                key={shade.id}
                onClick={() => toggleShade(shade)}
                className={`
                  group relative p-0.5 rounded-full transition-all
                  ${selectedShades.find(s => s.id === shade.id) 
                    ? 'ring-2 ring-rose scale-110' 
                    : 'hover:scale-105'}
                `}
              >
                <div 
                  className="w-8 h-8 rounded-full shadow-lg"
                  style={{ backgroundColor: shade.colorHex }}
                />
                {selectedShades.find(s => s.id === shade.id) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                    {shade.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 flex gap-3 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={createShade}
            disabled={selectedShades.length === 0 || !shadeName.trim()}
            className="flex-1 py-2 px-4 bg-neutral-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition"
          >
            Create Shade
          </button>
        </div>
      </div>
    </motion.div>
  );
} 