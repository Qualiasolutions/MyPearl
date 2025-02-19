'use client';

import { create } from 'zustand';

interface FaceDetectionState {
  isFaceDetected: boolean;
  cameraPermission: PermissionState;
  setFaceDetected: (detected: boolean) => void;
  setCameraPermission: (status: PermissionState) => void;
}

export const useFaceDetectionStore = create<FaceDetectionState>((set) => ({
  isFaceDetected: false,
  cameraPermission: 'prompt',
  setFaceDetected: (detected) => set({ isFaceDetected: detected }),
  setCameraPermission: (status) => set({ cameraPermission: status }),
})); 