'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onPermissionGranted: () => void;
}

export default function PermissionsHandler({ onPermissionGranted }: Props) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      stream.getTracks().forEach(track => track.stop());
      onPermissionGranted();
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionStatus('denied');
    }
  };

  useEffect(() => {
    // Check if permissions are already granted
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        onPermissionGranted();
      })
      .catch(() => {
        // Will need to request permissions
      });
  }, [onPermissionGranted]);

  if (permissionStatus === 'granted') return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="max-w-md p-6 rounded-xl bg-white/10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gold">Camera Permission Required</h2>
        <p className="text-white/80">
          This app needs camera access to detect facial features for the virtual try-on experience.
        </p>
        
        {permissionStatus === 'denied' ? (
          <div className="space-y-2">
            <p className="text-rose-500">Camera access was denied</p>
            <p className="text-white/60 text-sm">
              Please enable camera access in your browser settings to continue
            </p>
          </div>
        ) : (
          <button
            onClick={requestPermissions}
            className="px-6 py-3 bg-gold text-white rounded-full hover:bg-gold/80 transition-colors"
          >
            Allow Camera Access
          </button>
        )}
      </div>
    </motion.div>
  );
} 