'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import { Shade, SHADE_DATA, ShadeCategory } from '@/types/shades';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

interface Props {
  onSelectShade: (shade: Shade) => void;
  selectedShade?: Shade | null;
}

export default function ShadeSwiper({ onSelectShade, selectedShade }: Props) {
  const [activeCategory, setActiveCategory] = useState<ShadeCategory>('Fair');
  const categories: ShadeCategory[] = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep'];

  // Filter shades by active category
  const shades = SHADE_DATA.filter(shade => shade.category === activeCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Category Selector */}
      <div className="flex overflow-x-auto pb-2 pt-1 px-4 gap-2 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`
              whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${activeCategory === category 
                ? 'bg-neutral-800 text-white shadow-md' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Shades Swiper */}
      <div className="flex-1 px-2 pb-2">
        <Swiper
          modules={[FreeMode, Pagination]}
          freeMode={{
            enabled: true,
            sticky: false,
            momentumRatio: 0.25
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            dynamicMainBullets: 3
          }}
          spaceBetween={10}
          slidesPerView={3.5}
          breakpoints={{
            640: { slidesPerView: 5 },
            768: { slidesPerView: 6 },
            1024: { slidesPerView: 8 }
          }}
          className="h-full"
        >
          {shades.map((shade) => (
            <SwiperSlide key={shade.id} className="h-full flex items-center">
              <button
                onClick={() => onSelectShade(shade)}
                className={`
                  w-full h-16 rounded-lg flex flex-col items-center justify-center transition-all
                  ${selectedShade?.id === shade.id 
                    ? 'ring-2 ring-neutral-900 shadow-md transform scale-105' 
                    : 'hover:bg-neutral-50 hover:shadow'
                  }
                `}
                style={{
                  backgroundColor: `${shade.colorHex}50`
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full mb-1 shadow-inner"
                  style={{ 
                    backgroundColor: shade.colorHex,
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                />
                <span className="text-[10px] font-medium text-neutral-800 truncate max-w-full px-2">
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