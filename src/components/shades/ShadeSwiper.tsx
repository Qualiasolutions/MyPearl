'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Shade, SHADE_DATA, ShadeCategory } from '@/types/shades';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

interface Props {
  onSelectShade: (shade: Shade) => void;
  selectedShade?: Shade;
}

export default function ShadeSwiper({ onSelectShade, selectedShade }: Props) {
  const [activeCategory, setActiveCategory] = useState<ShadeCategory>('Fair');
  const categories: ShadeCategory[] = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep'];

  return (
    <div className="h-full flex flex-col">
      {/* Category Selector */}
      <div className="flex overflow-x-auto px-4 py-2 gap-4 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium
              ${activeCategory === category 
                ? 'bg-gold text-white shadow-md' 
                : 'text-gold hover:bg-gold/10'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Shades Swiper */}
      <div className="flex-1 px-4">
        <Swiper
          modules={[Pagination]}
          spaceBetween={12}
          slidesPerView={3.5}
          breakpoints={{
            640: { slidesPerView: 5.5 },
            1024: { slidesPerView: 7.5 },
          }}
        >
          {SHADE_DATA.filter(shade => shade.category === activeCategory).map((shade) => (
            <SwiperSlide key={shade.id}>
              <button
                onClick={() => onSelectShade(shade)}
                className={`
                  w-full p-3 rounded-lg text-sm transition-all
                  ${selectedShade?.id === shade.id 
                    ? 'ring-2 ring-gold bg-pearl-light shadow-lg' 
                    : 'hover:bg-pearl-light shadow'
                  }
                `}
                style={{
                  backgroundColor: `${shade.colorHex}20`
                }}
              >
                <div 
                  className="w-full h-8 rounded mb-2 shadow-inner"
                  style={{ backgroundColor: shade.colorHex }}
                />
                <span className="text-xs font-medium truncate block">{shade.name}</span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
} 