'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Shade } from '@/types/shades';
import { SHADE_DATA } from '@/data/ShadeData';
import cn from 'classnames';

interface ShadeSwiperProps {
  onSelectShade: (shade: Shade) => void;
  selectedShade: Shade | null;
  customShades: Shade[];
}

export default function ShadeSwiper({ onSelectShade, selectedShade, customShades }: ShadeSwiperProps) {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const [currentShades, setCurrentShades] = useState<Shade[]>(SHADE_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Update displayed shades based on active tab
  useEffect(() => {
    setCurrentShades(activeTab === 'default' ? SHADE_DATA : customShades);
  }, [activeTab, customShades]);
  
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
            "w-12 h-12 rounded-full mb-2 border-2 transition-all cursor-pointer",
            isSelected ? "border-black shadow-lg" : "border-transparent"
          )}
          style={{ backgroundColor: shade.colorHex }}
        />
        <p className="text-xs font-medium text-neutral-800 text-center line-clamp-1 max-w-[80px]">
          {shade.name}
        </p>
      </div>
    );
  }, [handleSelectShade, selectedShade]);
  
  // Show empty state for custom shades
  const renderEmptyCustomShades = useCallback(() => {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 mb-3 flex items-center justify-center">
          <span className="text-neutral-400 text-xl">+</span>
        </div>
        <p className="text-neutral-500 text-sm text-center">
          No custom shades yet.<br />Create your own shade to see it here.
        </p>
      </div>
    );
  }, []);
  
  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 w-full">
        <div className="flex mx-auto">
          <button
            onClick={() => setActiveTab('default')}
            className={cn(
              "px-4 py-3 text-sm font-medium relative",
              activeTab === 'default' ? "text-black" : "text-neutral-500"
            )}
          >
            Default Shades
            {activeTab === 'default' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              "px-4 py-3 text-sm font-medium relative",
              activeTab === 'custom' ? "text-black" : "text-neutral-500"
            )}
          >
            My Shades
            {activeTab === 'custom' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
              />
            )}
          </button>
        </div>
      </div>
      
      {/* Shade Swiper */}
      <div className="flex-1 flex items-center relative">
        {/* Navigation Arrows */}
        <button 
          className="absolute left-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center text-neutral-700 hover:bg-white transition"
          onClick={() => (document.querySelector('.swiper-button-prev') as HTMLElement)?.click()}
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          className="absolute right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center text-neutral-700 hover:bg-white transition"
          onClick={() => (document.querySelector('.swiper-button-next') as HTMLElement)?.click()}
        >
          <ChevronRight size={16} />
        </button>
        
        {/* Swiper */}
        {activeTab === 'custom' && customShades.length === 0 ? (
          renderEmptyCustomShades()
        ) : (
          <Swiper
            modules={[Navigation]}
            spaceBetween={5}
            slidesPerView={4}
            centeredSlides={false}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className="w-full h-full"
            navigation={{
              prevEl: '.swiper-button-prev',
              nextEl: '.swiper-button-next',
            }}
            breakpoints={{
              640: {
                slidesPerView: 6,
              },
              768: {
                slidesPerView: 8,
              }
            }}
          >
            {currentShades.map((shade, index) => (
              <SwiperSlide key={shade.id} className="h-full flex items-center justify-center">
                {renderShadeItem(shade, index)}
              </SwiperSlide>
            ))}
            <div className="swiper-button-prev" style={{ display: 'none' }}></div>
            <div className="swiper-button-next" style={{ display: 'none' }}></div>
          </Swiper>
        )}
      </div>
    </div>
  );
} 