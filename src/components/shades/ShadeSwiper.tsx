'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(4);
  const swiperRef = useRef<any>(null);
  
  // Handle window resize to adjust slides per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setSlidesPerView(3);
      } else if (width < 640) {
        setSlidesPerView(4);
      } else if (width < 768) {
        setSlidesPerView(5);
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
    
    // Reset active index when changing tabs
    setActiveIndex(0);
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
        // Ignore if vibration API is not available or fails
      }
    }
    
    // Add animation to indicate selection
    const element = document.getElementById(`shade-${shade.id}`);
    if (element) {
      element.classList.add('scale-pulse');
      setTimeout(() => element.classList.remove('scale-pulse'), 300);
    }
    
    onSelectShade(shade);
  }, [onSelectShade]);
  
  // Render a shade item with improved visual feedback
  const renderShadeItem = useCallback((shade: Shade, index: number) => {
    const isSelected = selectedShade?.id === shade.id;
    
    return (
      <motion.div
        id={`shade-${shade.id}`}
        className={cn(
          "h-full flex flex-col items-center justify-center px-1 py-2 transition-all",
          isSelected ? "scale-110" : "scale-100 hover:scale-105"
        )}
        onClick={() => handleSelectShade(shade)}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-full mb-2 border-2 transition-all cursor-pointer shadow",
            isSelected 
              ? "border-blue-500 shadow-lg ring-2 ring-blue-300 ring-opacity-50" 
              : "border-transparent hover:border-gray-600"
          )}
          style={{ backgroundColor: shade.colorHex }}
        >
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-white drop-shadow" size={14} />
            </div>
          )}
        </div>
        <span className={cn(
          "text-xs font-medium text-center line-clamp-1 transition-all w-full px-1",
          isSelected ? "text-white" : "text-gray-300"
        )}>
          {shade.name}
        </span>
        {shade.category && (
          <span className="text-[10px] text-gray-400 line-clamp-1 w-full px-1 text-center">
            {shade.category}
          </span>
        )}
      </motion.div>
    );
  }, [selectedShade, handleSelectShade]);
  
  // Render tab button with improved accessibility
  const TabButton = ({
    type,
    label,
    count
  }: {
    type: 'default' | 'custom';
    label: string;
    count: number;
  }) => (
    <button
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center",
        activeTab === type
          ? "bg-gray-800 text-white shadow-md"
          : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/70"
      )}
      onClick={() => setActiveTab(type)}
      aria-pressed={activeTab === type}
      aria-label={`${label} shades tab with ${count} items`}
    >
      {label}
      {count > 0 && (
        <span className="ml-1.5 text-xs bg-gray-700 rounded-full px-1.5 py-0.5 min-w-5 inline-flex justify-center">
          {count}
        </span>
      )}
    </button>
  );
  
  return (
    <div className="w-full bg-gray-900/70 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-800">
      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <TabButton type="default" label="Built-in" count={builtInShades.length} />
        <TabButton type="custom" label="Custom" count={customShades.length} />
      </div>
      
      {/* Swiper */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Swiper
              ref={swiperRef}
              modules={[Pagination, Navigation, FreeMode]}
              spaceBetween={8}
              slidesPerView={slidesPerView}
              freeMode={{ enabled: true, sticky: true }}
              pagination={{ clickable: true, dynamicBullets: true }}
              className="shade-swiper py-2"
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              breakpoints={{
                320: { slidesPerView: 3, spaceBetween: 4 },
                480: { slidesPerView: 4, spaceBetween: 6 },
                640: { slidesPerView: 5, spaceBetween: 8 },
                768: { slidesPerView: 6, spaceBetween: 10 },
                1024: { slidesPerView: 8, spaceBetween: 12 },
              }}
            >
              {currentShades.map((shade, index) => (
                <SwiperSlide key={shade.id} className="h-24">
                  {renderShadeItem(shade, index)}
                </SwiperSlide>
              ))}
              
              {/* Empty slate if no custom shades */}
              {activeTab === 'custom' && customShades.length === 0 && (
                <SwiperSlide className="flex flex-col items-center justify-center h-24">
                  <div className="text-sm text-gray-500 text-center p-4">
                    <p>No custom shades yet</p>
                    <p className="text-xs mt-1">Create one with the + button</p>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation buttons - only show if there are enough slides */}
        {currentShades.length > slidesPerView && (
          <>
            <button
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center transition-opacity",
                activeIndex === 0 ? "opacity-50 cursor-not-allowed" : "opacity-90 hover:opacity-100 hover:bg-gray-700"
              )}
              onClick={() => {
                if (swiperRef.current?.swiper) {
                  swiperRef.current.swiper.slidePrev();
                }
              }}
              disabled={activeIndex === 0}
              aria-label="Previous shades"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center transition-opacity",
                activeIndex >= currentShades.length - slidesPerView ? "opacity-50 cursor-not-allowed" : "opacity-90 hover:opacity-100 hover:bg-gray-700"
              )}
              onClick={() => {
                if (swiperRef.current?.swiper) {
                  swiperRef.current.swiper.slideNext();
                }
              }}
              disabled={activeIndex >= currentShades.length - slidesPerView}
              aria-label="Next shades"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      
      {/* Add some helper text */}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-400">
          Tap a shade to apply it to your face
        </p>
      </div>
    </div>
  );
} 