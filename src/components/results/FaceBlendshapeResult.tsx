'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  label: string;
  score: number;
}

export default function FaceBlendshapeResult({ label, score }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg"
    >
      <span className="text-sm text-gold">
        {label}
      </span>
      <span className="text-sm font-medium text-white">
        {(score * 100).toFixed(1)}%
      </span>
    </motion.div>
  );
} 