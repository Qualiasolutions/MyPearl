'use client';

import React, { useState, useEffect } from 'react';
import IntroAnimation from '../intro/IntroAnimation';

interface ShadeLayoutProps {
  children: React.ReactNode;
}

export default function ShadeLayout({ children }: ShadeLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <div className="text-gold text-xl">Loading My Pearl...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pearl to-pearl-light">
      <IntroAnimation />
      <header className="bg-white/50 backdrop-blur-sm border-b border-gold/10">
        <nav className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold to-rose" />
            <div>
              <h1 className="text-xl font-bold text-gold">MY PEARL</h1>
              <p className="text-xs text-rose">Virtual Try-On</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="gold-button">
              <span className="mr-2">↺</span>
              Switch Camera
            </button>
          </div>
        </nav>
      </header>

      <main className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        {children}
      </main>
    </div>
  );
} 