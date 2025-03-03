'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import { Shade } from '@/types/shades';
import cn from 'classnames';

interface ShadeSwiperProps {
  onSelectShade: (shade: Shade) => void;
  selectedShade: Shade | null;
  customShades: Shade[];
  builtInShades: Shade[];
}

export default function ShadeSwiper({
  onSelectShade,
  selectedShade,
  customShades,
  builtInShades
}: ShadeSwiperProps) {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [currentShades, setCurrentShades] = useState<Shade[]>(builtInShades);
  const [slidesPerView, setSlidesPerView] = useState(5);
  const swiperRef = useRef<any>(null);
  
  // Handle window resize to adjust slides per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setSlidesPerView(4);
      } else if (width < 640) {
        setSlidesPerView(5);
      } else if (width < 768) {
        setSlidesPerView(6);
      } else if (width < 1024) {
        setSlidesPerView(7);
      } else {
        setSlidesPerView(8);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update displayed shades based on active tab
  useEffect(() => {
    setCurrentShades(activeTab === 'default' ? builtInShades : customShades);
    
    // Reset swiper position when changing tabs
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(0);
    }
  }, [activeTab, customShades, builtInShades]);
  
  // Handle shade selection with haptic feedback if available
  const handleSelectShade = useCallback((shade: Shade) => {
    // Provide haptic feedback on mobile if available
    if (window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate(50);
      } catch (e) {
        // Ignore if vibration API is not available
      }
    }
    
    onSelectShade(shade);
  }, [onSelectShade]);
  
  return (
    <div className="w-full">
      {/* Tab selector */}
      <div className="flex justify-center mb-3">
        <div className="flex bg-white/10 rounded-full p-1">
          <button
            onClick={() => setActiveTab('default')}
            className={cn(
              "px-4 py-1 text-xs font-medium rounded-full transition-colors",
              activeTab === 'default' 
                ? "bg-white text-black" 
                : "text-white/80 hover:text-white"
            )}
          >
            Default
          </button>
          
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              "px-4 py-1 text-xs font-medium rounded-full transition-colors",
              activeTab === 'custom' 
                ? "bg-white text-black" 
                : "text-white/80 hover:text-white"
            )}
            disabled={customShades.length === 0}
          >
            Custom
          </button>
        </div>
      </div>
      
      {/* Shades swiper */}
      <Swiper
        ref={swiperRef}
        slidesPerView={slidesPerView}
        spaceBetween={8}
        freeMode={true}
        modules={[FreeMode, Pagination]}
        className="w-full"
      >
        {currentShades.map((shade) => (
          <SwiperSlide key={shade.id}>
            <button
              onClick={() => handleSelectShade(shade)}
              className={cn(
                "flex flex-col items-center w-full",
                selectedShade?.id === shade.id ? "scale-110" : ""
              )}
            >
              <div 
                className={cn(
                  "w-12 h-12 rounded-full border-2 transition-transform",
                  selectedShade?.id === shade.id 
                    ? "border-white shadow-lg" 
                    : "border-transparent"
                )}
                style={{ backgroundColor: shade.colorHex }}
              />
              <span className="text-[10px] text-white mt-1 truncate max-w-full">
                {shade.name}
              </span>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Empty state for custom shades */}
      {activeTab === 'custom' && customShades.length === 0 && (
        <div className="text-center py-4 text-white/60 text-xs">
          No custom shades yet. Create one using the palette button.
        </div>
      )}
    </div>
  );
} 