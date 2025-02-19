'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function NavItem({ icon: Icon, label, isActive, onClick }: Props) {
  return (
    <motion.button
      whileHover={{ scale: isActive ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-colors
        ${isActive ? 'text-white' : 'text-gold hover:text-white/80'}`}
    >
      <Icon 
        className={`w-6 h-6 transition-transform ${
          isActive ? 'scale-110' : ''
        }`}
      />
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
} 