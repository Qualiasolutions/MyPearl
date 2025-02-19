'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FaceDetectionCamera from '../camera/FaceDetectionCamera';
import GalleryView from '../gallery/GalleryView';
import SettingsBottomSheet from '../camera/SettingsBottomSheet';
import { useFaceDetectionStore } from '@/store/FaceDetectionStore';
import PermissionsHandler from '../permissions/PermissionsHandler';
import { Camera, Image, Settings } from 'lucide-react';
import NavItem from '../navigation/NavItem';

type View = 'camera' | 'gallery' | 'settings';

interface Props {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
  const [currentView, setCurrentView] = useState<View>('camera');
  const [hasPermissions, setHasPermissions] = useState(false);

  const {
    delegate,
    maxFaces,
    minFaceDetectionConfidence,
    minFaceTrackingConfidence,
    minFacePresenceConfidence,
    inferenceTime,
    setDelegate,
    setMaxFaces,
    setMinFaceDetectionConfidence,
    setMinFaceTrackingConfidence,
    setMinFacePresenceConfidence,
  } = useFaceDetectionStore();

  const handleSettingsChange = (newSettings: any) => {
    setDelegate(newSettings.delegate);
    setMaxFaces(newSettings.maxFaces);
    setMinFaceDetectionConfidence(newSettings.minFaceDetectionConfidence);
    setMinFaceTrackingConfidence(newSettings.minFaceTrackingConfidence);
    setMinFacePresenceConfidence(newSettings.minFacePresenceConfidence);
  };

  const navItems = [
    { id: 'camera', icon: Camera, label: 'Camera' },
    { id: 'gallery', icon: Image, label: 'Gallery' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ] as const;

  if (!hasPermissions) {
    return (
      <PermissionsHandler 
        onPermissionGranted={() => setHasPermissions(true)} 
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Top Toolbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-sm border-b border-gold/10 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold to-rose" />
            <div>
              <h1 className="text-xl font-bold text-gold">MY PEARL</h1>
              <p className="text-xs text-rose">Virtual Try-On</p>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors">
              <span className="mr-2">↺</span>
              Switch Camera
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 h-[calc(100vh-4rem)]">
        {children}
        {currentView === 'settings' && (
          <SettingsBottomSheet
            settings={{
              delegate,
              maxFaces,
              minFaceDetectionConfidence,
              minFaceTrackingConfidence,
              minFacePresenceConfidence,
              inferenceTime,
            }}
            onSettingsChange={handleSettingsChange}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm border-t border-gold/10"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-around">
          {navItems.map(({ id, icon, label }) => (
            <NavItem
              key={id}
              icon={icon}
              label={label}
              isActive={currentView === id}
              onClick={() => setCurrentView(id)}
            />
          ))}
        </div>
      </motion.nav>
    </div>
  );
} 