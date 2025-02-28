'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination, Navigation } from 'swiper/modules';
import { Shade } from '@/types/shades';
import { SHADE_DATA } from '@/data/ShadeData';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Props {
  onSelectShade: (shade: Shade) => void;
  selectedShade?: Shade | null;
  customShades?: Shade[];
}

export default function ShadeSwiper({ onSelectShade, selectedShade, customShades = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<'Default' | 'Custom'>('Default');
  const categories = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep'];
  
  // Filter shades by active category
  const shades = activeCategory === 'Custom' 
    ? customShades 
    : SHADE_DATA;

  return (
    <div className="h-full flex flex-col">
      {/* Category Selector */}
      <div className="flex space-x-2 pb-3 px-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveCategory('Default')}
          className={`
            whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0
            ${activeCategory === 'Default' 
              ? 'bg-neutral-900 text-white shadow-md' 
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }
          `}
        >
          Default Shades
        </button>
        {customShades.length > 0 && (
          <button
            onClick={() => setActiveCategory('Custom')}
            className={`
              whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0
              ${activeCategory === 'Custom' 
                ? 'bg-neutral-900 text-white shadow-md' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
            `}
          >
            My Shades
          </button>
        )}
      </div>
      
      {/* Shades Swiper */}
      <div className="flex-1 px-2 pb-2">
        <Swiper
          modules={[FreeMode, Pagination, Navigation]}
          freeMode={{
            enabled: true,
            sticky: true,
            momentumRatio: 0.25
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3
          }}
          spaceBetween={8}
          slidesPerView={4.5}
          breakpoints={{
            320: { slidesPerView: 4.5, spaceBetween: 8 },
            480: { slidesPerView: 5.5, spaceBetween: 10 },
            640: { slidesPerView: 6.5, spaceBetween: 12 },
            768: { slidesPerView: 7, spaceBetween: 12 },
            1024: { slidesPerView: 9, spaceBetween: 14 }
          }}
          className="h-full w-full"
        >
          {shades.map((shade) => (
            <SwiperSlide key={shade.id} className="h-full flex items-center">
              <button
                onClick={() => onSelectShade(shade)}
                className={`
                  w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all
                  ${selectedShade?.id === shade.id 
                    ? 'ring-2 ring-neutral-900 shadow-md transform scale-105' 
                    : 'hover:bg-neutral-50 hover:shadow'
                  }
                `}
                style={{
                  backgroundColor: `${shade.colorHex}40`
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full mb-1 shadow-inner"
                  style={{ 
                    backgroundColor: shade.colorHex,
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                />
                <span className="text-[10px] font-medium text-neutral-800 truncate max-w-full px-1">
                  {shade.name}
                </span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
} 