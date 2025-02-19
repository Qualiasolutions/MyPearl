'use client';

import React from 'react';
import FaceBlendshapeResult from './FaceBlendshapeResult';

interface Props {
  blendshapes: Array<{
    categoryName: string;
    score: number;
  }>;
}

export default function FaceBlendshapes({ blendshapes }: Props) {
  return (
    <div className="absolute bottom-20 left-4 right-4 space-y-2 max-h-48 overflow-y-auto">
      {blendshapes.map((shape) => (
        <FaceBlendshapeResult
          key={shape.categoryName}
          label={shape.categoryName}
          score={shape.score}
        />
      ))}
    </div>
  );
} 