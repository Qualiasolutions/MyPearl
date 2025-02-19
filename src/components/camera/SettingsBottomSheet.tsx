'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  settings: {
    maxFaces: number;
    minFaceDetectionConfidence: number;
    minFaceTrackingConfidence: number;
    minFacePresenceConfidence: number;
    inferenceTime: number;
    delegate: 'CPU' | 'GPU';
  };
  onSettingsChange: (settings: Props['settings']) => void;
}

export default function SettingsBottomSheet({ settings, onSettingsChange }: Props) {
  const handleConfidenceChange = (
    key: keyof typeof settings,
    delta: number
  ) => {
    if (typeof settings[key] === 'number') {
      onSettingsChange({
        ...settings,
        [key]: Math.max(0, Math.min(1, (settings[key] as number) + delta))
      });
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md rounded-t-xl"
    >
      <div className="p-6 space-y-6">
        {/* Chevron */}
        <div className="flex justify-center">
          <motion.div 
            animate={{ y: [0, 2, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-12 h-1 bg-gold/20 rounded-full"
          />
        </div>

        {/* Inference Time */}
        <div className="flex justify-between items-center">
          <span className="text-gold">Inference Time</span>
          <span className="text-white">{settings.inferenceTime}ms</span>
        </div>

        {/* Face Detection Confidence */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gold">Detection Confidence</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleConfidenceChange('minFaceDetectionConfidence', -0.1)}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                -
              </button>
              <span className="text-white w-16 text-center">
                {(settings.minFaceDetectionConfidence * 100).toFixed(0)}%
              </span>
              <button 
                onClick={() => handleConfidenceChange('minFaceDetectionConfidence', 0.1)}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Tracking Confidence */}
          <div className="flex justify-between items-center">
            <span className="text-gold">Tracking Confidence</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleConfidenceChange('minFaceTrackingConfidence', -0.1)}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                -
              </button>
              <span className="text-white w-16 text-center">
                {(settings.minFaceTrackingConfidence * 100).toFixed(0)}%
              </span>
              <button 
                onClick={() => handleConfidenceChange('minFaceTrackingConfidence', 0.1)}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Presence Confidence */}
          <div className="flex justify-between items-center">
            <span className="text-gold">Presence Confidence</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleConfidenceChange('minFacePresenceConfidence', -0.1)}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                -
              </button>
              <span className="text-white w-16 text-center">
                {(settings.minFacePresenceConfidence * 100).toFixed(0)}%
              </span>
              <button 
                onClick={() => handleConfidenceChange('minFacePresenceConfidence', 0.1)}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Max Faces */}
          <div className="flex justify-between items-center">
            <span className="text-gold">Max Faces</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onSettingsChange({ ...settings, maxFaces: Math.max(1, settings.maxFaces - 1) })}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                -
              </button>
              <span className="text-white w-16 text-center">{settings.maxFaces}</span>
              <button 
                onClick={() => onSettingsChange({ ...settings, maxFaces: Math.min(4, settings.maxFaces + 1) })}
                className="w-8 h-8 rounded bg-gold/10 text-gold hover:bg-gold/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Delegate Selection */}
          <div className="flex justify-between items-center">
            <span className="text-gold">Delegate</span>
            <select
              value={settings.delegate}
              onChange={(e) => onSettingsChange({ ...settings, delegate: e.target.value as 'CPU' | 'GPU' })}
              className="px-4 py-2 rounded bg-gold/10 text-gold border border-gold/20 focus:outline-none focus:border-gold"
            >
              <option value="CPU">CPU</option>
              <option value="GPU">GPU</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 