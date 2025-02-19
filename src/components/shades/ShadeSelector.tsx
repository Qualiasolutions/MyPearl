import React from 'react';
import { Shade, SHADE_DATA, ShadeCategory } from '@/types/shades';

interface Props {
  onSelectShade: (shade: Shade) => void;
  selectedShade?: Shade;
}

export default function ShadeSelector({ onSelectShade, selectedShade }: Props) {
  const categories: ShadeCategory[] = ['Fair', 'Light', 'Medium', 'Medium Deep', 'Deep'];

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-medium text-gold">{category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SHADE_DATA.filter(shade => shade.category === category).map((shade) => (
              <button
                key={shade.id}
                onClick={() => onSelectShade(shade)}
                className={`
                  p-3 rounded-lg text-sm transition-all
                  ${selectedShade?.id === shade.id 
                    ? 'ring-2 ring-gold bg-pearl-light' 
                    : 'hover:bg-pearl-light'
                  }
                `}
                style={{
                  backgroundColor: `${shade.colorHex}20`
                }}
              >
                <div 
                  className="w-full h-6 rounded mb-2"
                  style={{ backgroundColor: shade.colorHex }}
                />
                {shade.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 