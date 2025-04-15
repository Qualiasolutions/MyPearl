'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
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

  // Handle window resize to adjust slides per view - improved for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 375) {
        setSlidesPerView(4);
      } else if (width < 480) {
        setSlidesPerView(5);
      } else if (width < 640) {
        setSlidesPerView(6);
      } else if (width < 768) {
        setSlidesPerView(7);
      } else if (width < 1024) {
        setSlidesPerView(8);
      } else {
        setSlidesPerView(9);
      }
    };
    
    // Initial call immediately
    handleResize();
    
    // Debounced event listener for performance
    const debouncedResize = debounce(handleResize, 200);
    window.addEventListener('resize', debouncedResize);
    
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
  
  // Render shade item with improved accessibility and sizing
  const renderShadeItem = useCallback((shade: Shade) => {
    const isSelected = selectedShade?.id === shade.id;
    
    return (
      <SwiperSlide key={shade.id} className="py-1">
        <button
          onClick={() => handleSelectShade(shade)}
          className={classNames(
            "flex flex-col items-center w-full transition-all",
            isSelected ? "scale-110" : "hover:scale-105"
          )}
          aria-label={`Select ${shade.name} shade`}
        >
          <div 
            className={classNames(
              "w-10 h-10 rounded-full transition-all",
              isSelected 
                ? "ring-2 ring-white shadow-lg" 
                : "ring-1 ring-white/30"
            )}
            style={{ backgroundColor: shade.colorHex }}
          />
          <span className="text-[9px] text-white/80 mt-0.5 text-center truncate w-full">
            {shade.name}
          </span>
        </button>
      </SwiperSlide>
    );
  }, [selectedShade, handleSelectShade]);
  
  return (
    <div className="w-full">
      {/* Compact tab selector */}
      <div className="flex justify-center mb-1.5">
        <div className="inline-flex bg-white/10 rounded-full p-0.5">
          <button
            onClick={() => setActiveTab('default')}
            className={classNames(
              "px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors",
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
              "px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors",
              activeTab === 'custom' 
                ? "bg-white text-black" 
                : "text-white/80 hover:text-white"
            )}
          >
            Custom {customShades.length > 0 && `(${customShades.length})`}
          </button>
        </div>
      </div>
      
      {/* Shades swiper with improved touch sensitivity */}
      {currentShades.length > 0 ? (
        <Swiper
          ref={swiperRef}
          slidesPerView={slidesPerView}
          spaceBetween={8}
          freeMode={{
            enabled: true,
            minimumVelocity: 0.02,
            momentum: true,
            momentumBounce: false
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
            type: 'bullets',
            dynamicBullets: true,
            dynamicMainBullets: 3
          }}
          modules={[FreeMode, Pagination]}
          className="shade-swiper px-1.5"
          touchEventsTarget="container"
          threshold={5} // More sensitive touch detection
        >
          {currentShades.map(renderShadeItem)}
          <div className="swiper-pagination mt-1 h-3"></div>
        </Swiper>
      ) : (
        <div className="text-center py-2 text-white/60 text-xs">
          {activeTab === 'custom' 
            ? "No custom shades yet" 
            : "No shades available"}
        </div>
      )}
      
      <style jsx global>{`
        .shade-swiper .swiper-pagination {
          position: relative;
          bottom: 0;
          margin-top: 2px;
        }
        .shade-swiper .swiper-pagination-bullet {
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          opacity: 1;
        }
        .shade-swiper .swiper-pagination-bullet-active {
          background: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
} 