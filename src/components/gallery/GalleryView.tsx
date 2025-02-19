'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FaceOverlay from '../camera/FaceOverlay';
import FaceBlendshapes from '../results/FaceBlendshapes';

interface Props {
  onImageSelect: (file: File) => void;
}

export default function GalleryView({ onImageSelect }: Props) {
  const [selectedImage, setSelectedImage] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [blendshapes, setBlendshapes] = useState<any[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSelectedImage(URL.createObjectURL(file));
    onImageSelect(file);
  };

  return (
    <div className="relative h-full bg-black">
      {/* Main Content */}
      <div className="relative h-full">
        {!selectedImage ? (
          <div className="h-full flex items-center justify-center text-gold/50">
            Select an image to analyze face landmarks
          </div>
        ) : (
          <div className="relative h-full">
            <img 
              src={selectedImage}
              alt="Selected"
              className="h-full w-full object-contain"
            />
            <FaceOverlay
              landmarks={landmarks}
              imageWidth={0} // Need to get actual image dimensions
              imageHeight={0}
              mode="image"
            />
          </div>
        )}

        {/* Loading Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results ScrollView */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 h-20 bg-black/50 backdrop-blur-sm"
      >
        <div className="h-full overflow-x-auto">
          {blendshapes.length > 0 && (
            <div className="flex gap-2 p-4 h-full items-center">
              {blendshapes.map((shape) => (
                <div 
                  key={shape.categoryName}
                  className="flex-none px-4 py-2 bg-white/10 rounded-lg"
                >
                  <div className="text-xs text-gold">{shape.categoryName}</div>
                  <div className="text-sm text-white font-medium">
                    {(shape.score * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gold/20" />
      </motion.div>

      {/* Add Image Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-24 right-4 w-14 h-14 rounded-full bg-gold text-white flex items-center justify-center shadow-lg"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <span className="text-2xl">+</span>
      </motion.button>
      <input 
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
} 