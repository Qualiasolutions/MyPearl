'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BookmarkX } from 'lucide-react';
import { Shade } from '@/types/shades';

interface Props {
  savedShades: Shade[];
  onRemove: (shadeId: number) => void;
  onSelect: (shade: Shade) => void;
  selectedShadeId: number | null;
}

export default function SavedShades({ savedShades, onRemove, onSelect, selectedShadeId }: Props) {
  if (savedShades.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-5 text-center">
        <div className="flex justify-center mb-3">
          <BookmarkX size={24} className="text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-700 mb-1">No Saved Shades</h3>
        <p className="text-xs text-neutral-500">
          Your saved shades will appear here
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-3 border-b border-neutral-100">
        <h3 className="text-sm font-medium text-neutral-700">Saved Shades</h3>
      </div>
      
      <div className="p-2">
        <AnimatePresence initial={false}>
          {savedShades.map((shade) => (
            <motion.div
              key={shade.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div 
                className={`
                  flex items-center p-2 rounded-lg cursor-pointer transition
                  ${selectedShadeId === shade.id 
                    ? 'bg-neutral-100' 
                    : 'hover:bg-neutral-50'}
                `}
                onClick={() => onSelect(shade)}
              >
                <div 
                  className="w-8 h-8 rounded-full shadow-sm mr-3"
                  style={{ backgroundColor: shade.colorHex }}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{shade.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{shade.category}</p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(shade.id);
                  }}
                  className="p-2 text-neutral-400 hover:text-red-500 transition rounded-full hover:bg-neutral-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 