'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Update displayed shades based on active tab
  useEffect(() => {
    setCurrentShades(activeTab === 'default' ? builtInShades : customShades);
  }, [activeTab, customShades, builtInShades]);
  
  // Handle shade selection
  const handleSelectShade = useCallback((shade: Shade) => {
    onSelectShade(shade);
  }, [onSelectShade]);
  
  // Render a shade item
  const renderShadeItem = useCallback((shade: Shade, index: number) => {
    const isSelected = selectedShade?.id === shade.id;
    
    return (
      <div 
        className={cn(
          "h-full flex flex-col items-center justify-center p-1 transition-all",
          isSelected ? "scale-105" : "scale-100"
        )}
        onClick={() => handleSelectShade(shade)}
      >
        <div 
          className={cn(
            "w-12 h-12 rounded-full mb-2 border-2 transition-all cursor-pointer shadow",
            isSelected ? "border-blue-500 shadow-lg" : "border-transparent"
          )}
          style={{ backgroundColor: shade.colorHex }}
        ></div>
        <span className={cn(
          "text-xs font-medium text-center line-clamp-2 transition-all",
          isSelected ? "text-white" : "text-gray-300"
        )}>
          {shade.name}
        </span>
      </div>
    );
  }, [selectedShade, handleSelectShade]);
  
  // Render tab button
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
          ? "bg-gray-800 text-white" 
          : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/70"
      )}
      onClick={() => setActiveTab(type)}
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
    <div className="w-full">
      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <TabButton type="default" label="Built-in" count={builtInShades.length} />
        <TabButton type="custom" label="Custom" count={customShades.length} />
      </div>
      
      {/* Swiper */}
      <div className="relative">
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={4}
          slidesPerView={4}
          pagination={{ clickable: true }}
          className="shade-swiper"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          breakpoints={{
            320: { slidesPerView: 4 },
            640: { slidesPerView: 6 },
            768: { slidesPerView: 8 },
          }}
        >
          {currentShades.map((shade, index) => (
            <SwiperSlide key={shade.id}>
              {renderShadeItem(shade, index)}
            </SwiperSlide>
          ))}
          
          {/* Empty slate if no custom shades */}
          {activeTab === 'custom' && customShades.length === 0 && (
            <SwiperSlide className="flex flex-col items-center justify-center h-32">
              <div className="text-sm text-gray-500 text-center p-4">
                <p>No custom shades yet.</p>
                <p className="text-xs mt-1">Create one with the + button.</p>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
        
        {/* Navigation buttons */}
        {currentShades.length > 4 && (
          <>
            <button
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center transition-opacity",
                activeIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-gray-700/80"
              )}
              onClick={() => {
                const swiperElement = document.querySelector('.shade-swiper') as any;
                if (swiperElement?.swiper) {
                  swiperElement.swiper.slidePrev();
                }
              }}
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center transition-opacity",
                activeIndex >= currentShades.length - 4 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-gray-700/80"
              )}
              onClick={() => {
                const swiperElement = document.querySelector('.shade-swiper') as any;
                if (swiperElement?.swiper) {
                  swiperElement.swiper.slideNext();
                }
              }}
              disabled={activeIndex >= currentShades.length - 4}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
} 