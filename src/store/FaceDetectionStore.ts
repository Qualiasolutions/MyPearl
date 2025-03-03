'use client';

import { create } from 'zustand';

type PermissionState = 'prompt' | 'granted' | 'denied';
type Delegate = 'gpu' | 'webgl' | 'cpu';

interface FaceDetectionState {
  isFaceDetected: boolean;
  cameraPermission: PermissionState;
  inferenceTime: number;
  delegate: Delegate;
  maxFaces: number;
  minFaceDetectionConfidence: number;
  minFaceTrackingConfidence: number;
  minFacePresenceConfidence: number;
  setFaceDetected: (detected: boolean) => void;
  setCameraPermission: (status: PermissionState) => void;
  setInferenceTime: (time: number) => void;
  setDelegate: (delegate: Delegate) => void;
  setMaxFaces: (maxFaces: number) => void;
  setMinFaceDetectionConfidence: (confidence: number) => void;
  setMinFaceTrackingConfidence: (confidence: number) => void;
  setMinFacePresenceConfidence: (confidence: number) => void;
}

export const useFaceDetectionStore = create<FaceDetectionState>((set) => ({
  isFaceDetected: false,
  cameraPermission: 'prompt',
  inferenceTime: 0,
  delegate: 'webgl',
  maxFaces: 1,
  minFaceDetectionConfidence: 0.5,
  minFaceTrackingConfidence: 0.5,
  minFacePresenceConfidence: 0.5,
  setFaceDetected: (detected) => set({ isFaceDetected: detected }),
  setCameraPermission: (status) => set({ cameraPermission: status }),
  setInferenceTime: (time) => set({ inferenceTime: time }),
  setDelegate: (delegate) => set({ delegate }),
  setMaxFaces: (maxFaces) => set({ maxFaces }),
  setMinFaceDetectionConfidence: (confidence) => set({ minFaceDetectionConfidence: confidence }),
  setMinFaceTrackingConfidence: (confidence) => set({ minFaceTrackingConfidence: confidence }),
  setMinFacePresenceConfidence: (confidence) => set({ minFacePresenceConfidence: confidence }),
})); 