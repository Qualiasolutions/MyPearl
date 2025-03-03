'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { Shade } from '@/types/shades';
import classNames from 'classnames';

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
  const [slidesPerView, setSlidesPerView] = useState(5);
  const swiperRef = useRef<any>(null);
  
  // Memoized current shades based on active tab
  const currentShades = useMemo(() => {
    return activeTab === 'default' ? builtInShades : customShades;
  }, [activeTab, builtInShades, customShades]);

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
    
    const debouncedResize = debounce(handleResize, 200);
    window.addEventListener('resize', debouncedResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);
  
  // Reset swiper position when changing tabs
  useEffect(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(0);
    }
  }, [activeTab]);
  
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

  // Simple debounce function
  function debounce(fn: Function, ms: number) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  }
  
  // Render shade item
  const renderShadeItem = useCallback((shade: Shade) => {
    const isSelected = selectedShade?.id === shade.id;
    
    return (
      <SwiperSlide key={shade.id}>
        <button
          onClick={() => handleSelectShade(shade)}
          className={classNames(
            "flex flex-col items-center w-full",
            isSelected ? "scale-110" : ""
          )}
        >
          <div 
            className={classNames(
              "w-12 h-12 rounded-full border-2 transition-transform",
              isSelected 
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
    );
  }, [selectedShade, handleSelectShade]);
  
  return (
    <div className="w-full">
      {/* Tab selector */}
      <div className="flex justify-center mb-3">
        <div className="flex bg-white/10 rounded-full p-1">
          <button
            onClick={() => setActiveTab('default')}
            className={classNames(
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
            className={classNames(
              "px-4 py-1 text-xs font-medium rounded-full transition-colors",
              activeTab === 'custom' 
                ? "bg-white text-black" 
                : "text-white/80 hover:text-white"
            )}
          >
            Custom {customShades.length > 0 && `(${customShades.length})`}
          </button>
        </div>
      </div>
      
      {/* Shades swiper */}
      {currentShades.length > 0 ? (
        <Swiper
          ref={swiperRef}
          slidesPerView={slidesPerView}
          spaceBetween={8}
          freeMode={true}
          modules={[FreeMode]}
          className="w-full"
        >
          {currentShades.map(renderShadeItem)}
        </Swiper>
      ) : (
        <div className="text-center py-4 text-white/60 text-xs">
          {activeTab === 'custom' 
            ? "No custom shades yet. Create one using the palette button." 
            : "No default shades available."}
        </div>
      )}
    </div>
  );
} 