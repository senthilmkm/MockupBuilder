import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:5' | '4:3' | '3:4' | 'AppStore' | 'iPadStore';
export type FrameType = 'iPhone16Pro' | 'MacbookPro' | 'SafariBrowser' | 'None';

export interface AnnotationElement {
  id: string;
  type: 'Text' | 'Arrow' | 'Spotlight';
  x: number; // Percentage coordinate (0-100) for screen responsiveness
  y: number; // Percentage coordinate (0-100)
  scale: number;
  text?: string;
  color?: string;
  arrowDirection?: number; // angle in degrees
  zoomFactor?: number; // magnifier zoom (e.g. 1.5)
  rotation?: number; // rotation in degrees
  fontFamily?: string; // custom font family
}

export interface ExportHistoryItem {
  id: string;
  fileName: string;
  timestamp: string;
  frameType: string;
  aspectRatio: string;
  imageUri: string;
}

export interface CanvasSnapshot {
  imageUri: string | null;
  beforeImageUri: string | null;
  isSplitSliderEnabled: boolean;
  sliderPosition: number;
  aspectRatio: AspectRatioType;
  backgroundColor: string;
  frameType: FrameType;
  frameColor: string;
  padding: number;
  shadowIntensity: number;
  rotation3D: number;
  screenshotScale: number;
  screenshotOffsetX: number;
  screenshotOffsetY: number;
  beforeScreenshotScale: number;
  beforeScreenshotOffsetX: number;
  beforeScreenshotOffsetY: number;
  annotations: AnnotationElement[];
  showNotch: boolean;
  backgroundType: 'gradient' | 'color' | 'image';
  backgroundImageUri: string | null;
  feedMode: 'None' | 'Twitter' | 'LinkedIn' | 'ProductHunt';
  hasBorderGlow: boolean;
}

export interface CanvasState {
  imageUri: string | null;
  beforeImageUri: string | null;
  isSplitSliderEnabled: boolean;
  sliderPosition: number; // 0 to 100
  aspectRatio: AspectRatioType;
  backgroundColor: string; // Gradient preset ID or solid hex
  frameType: FrameType;
  frameColor: string; // Bezel color variant
  padding: number; // Padding percentage
  shadowIntensity: number; // Shadow opacity (0-1)
  rotation3D: number; // Y-rotation angle in degrees
  screenshotScale: number; // scale (0.5 to 2.5)
  screenshotOffsetX: number; // horizontal translation
  screenshotOffsetY: number; // vertical translation
  beforeScreenshotScale: number; // before scale (0.5 to 2.5)
  beforeScreenshotOffsetX: number; // before horizontal translation
  beforeScreenshotOffsetY: number; // before vertical translation
  annotations: AnnotationElement[];
  exportsHistory: ExportHistoryItem[];
  isPro: boolean;
  showNotch: boolean;
  backgroundType: 'gradient' | 'color' | 'image';
  backgroundImageUri: string | null;
  feedMode: 'None' | 'Twitter' | 'LinkedIn' | 'ProductHunt';
  hasBorderGlow: boolean;

  // History stacks (in-memory)
  undoStack: CanvasSnapshot[];
  redoStack: CanvasSnapshot[];
  
  // Actions
  setImageUri: (uri: string | null) => void;
  setBeforeImageUri: (uri: string | null) => void;
  setIsSplitSliderEnabled: (enabled: boolean) => void;
  setSliderPosition: (pos: number) => void;
  setAspectRatio: (ratio: AspectRatioType) => void;
  setBackgroundColor: (color: string) => void;
  setFrameType: (frame: FrameType) => void;
  setFrameColor: (color: string) => void;
  setPadding: (pad: number) => void;
  setShadowIntensity: (shadow: number) => void;
  setRotation3D: (rotation: number) => void;
  setScreenshotScale: (scale: number) => void;
  setScreenshotOffsetX: (x: number) => void;
  setScreenshotOffsetY: (y: number) => void;
  setBeforeScreenshotScale: (scale: number) => void;
  setBeforeScreenshotOffsetX: (x: number) => void;
  setBeforeScreenshotOffsetY: (y: number) => void;
  setProStatus: (status: boolean) => void;
  setShowNotch: (show: boolean) => void;
  setBackgroundType: (type: 'gradient' | 'color' | 'image') => void;
  setBackgroundImageUri: (uri: string | null) => void;
  setFeedMode: (mode: 'None' | 'Twitter' | 'LinkedIn' | 'ProductHunt') => void;
  setHasBorderGlow: (glow: boolean) => void;
  
  // History Actions
  saveHistoryState: () => void;
  undo: () => void;
  redo: () => void;
  
  // Annotation Actions
  addAnnotation: (type: 'Text' | 'Arrow' | 'Spotlight') => void;
  updateAnnotation: (id: string, updates: Partial<AnnotationElement>, saveToHistory?: boolean) => void;
  deleteAnnotation: (id: string) => void;
  setAnnotations: (annotations: AnnotationElement[]) => void;
  addExportToHistory: (fileName: string, frameType: string, aspectRatio: string, imageUri: string) => void;
  clearExportsHistory: () => void;
  deleteExportFromHistory: (id: string) => void;
  clearAll: () => void;
}

// Platform safe storage wrapper
let nativeStorage: any = null;
if (Platform.OS !== 'web' && process.env.NODE_ENV !== 'test') {
  try {
    const MMKVClass = require('react-native-mmkv').MMKV;
    if (MMKVClass) {
      nativeStorage = new MMKVClass();
    }
  } catch (error) {
    console.warn('Failed to load MMKV:', error);
  }
}

const memoryCache: Record<string, string> = {};

const customStorage = {
  setItem: (name: string, value: string) => {
    if (nativeStorage) {
      nativeStorage.set(name, value);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(name, value);
    } else {
      memoryCache[name] = value;
    }
  },
  getItem: (name: string) => {
    if (nativeStorage) {
      return nativeStorage.getString(name) ?? null;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(name);
    }
    return memoryCache[name] ?? null;
  },
  removeItem: (name: string) => {
    if (nativeStorage) {
      nativeStorage.delete(name);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(name);
    } else {
      delete memoryCache[name];
    }
  },
};

const takeSnapshot = (state: CanvasState): CanvasSnapshot => ({
  imageUri: state.imageUri,
  beforeImageUri: state.beforeImageUri,
  isSplitSliderEnabled: state.isSplitSliderEnabled,
  sliderPosition: state.sliderPosition,
  aspectRatio: state.aspectRatio,
  backgroundColor: state.backgroundColor,
  frameType: state.frameType,
  frameColor: state.frameColor,
  padding: state.padding,
  shadowIntensity: state.shadowIntensity,
  rotation3D: state.rotation3D,
  screenshotScale: state.screenshotScale,
  screenshotOffsetX: state.screenshotOffsetX,
  screenshotOffsetY: state.screenshotOffsetY,
  beforeScreenshotScale: state.beforeScreenshotScale,
  beforeScreenshotOffsetX: state.beforeScreenshotOffsetX,
  beforeScreenshotOffsetY: state.beforeScreenshotOffsetY,
  annotations: state.annotations.map((ann) => ({ ...ann })),
  showNotch: state.showNotch,
  backgroundType: state.backgroundType || 'gradient',
  backgroundImageUri: state.backgroundImageUri || null,
  feedMode: state.feedMode || 'None',
  hasBorderGlow: state.hasBorderGlow || false,
});

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      imageUri: null,
      beforeImageUri: null,
      isSplitSliderEnabled: false,
      sliderPosition: 50,
      aspectRatio: '16:9',
      backgroundColor: 'gradient-sunset', // Default gradient id
      frameType: 'iPhone16Pro',
      frameColor: '#000000',
      padding: 15,
      shadowIntensity: 0.5,
      rotation3D: 0,
      screenshotScale: 1.0,
      screenshotOffsetX: 0,
      screenshotOffsetY: 0,
      beforeScreenshotScale: 1.0,
      beforeScreenshotOffsetX: 0,
      beforeScreenshotOffsetY: 0,
      annotations: [],
      exportsHistory: [],
      isPro: false,
      showNotch: true,
      backgroundType: 'gradient',
      backgroundImageUri: null,
      feedMode: 'None',
      hasBorderGlow: false,

      // History stacks
      undoStack: [],
      redoStack: [],

      // Setters with automatic Undo tracking
      setImageUri: (uri) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          imageUri: uri,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBeforeImageUri: (uri) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          beforeImageUri: uri,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setIsSplitSliderEnabled: (enabled) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          isSplitSliderEnabled: enabled,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setSliderPosition: (pos) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          sliderPosition: pos,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setAspectRatio: (ratio) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          aspectRatio: ratio,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBackgroundColor: (color) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          backgroundColor: color,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setFrameType: (frame) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          frameType: frame,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setFrameColor: (color) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          frameColor: color,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setPadding: (pad) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          padding: pad,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setShadowIntensity: (shadow) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          shadowIntensity: shadow,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setRotation3D: (rotation) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          rotation3D: rotation,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setScreenshotScale: (scale) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          screenshotScale: scale,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setScreenshotOffsetX: (x) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          screenshotOffsetX: x,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setScreenshotOffsetY: (y) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          screenshotOffsetY: y,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBeforeScreenshotScale: (scale) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          beforeScreenshotScale: scale,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBeforeScreenshotOffsetX: (x) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          beforeScreenshotOffsetX: x,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBeforeScreenshotOffsetY: (y) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          beforeScreenshotOffsetY: y,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setProStatus: (status) => set({ isPro: status }),

      setShowNotch: (show) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          showNotch: show,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBackgroundType: (type) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          backgroundType: type,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setBackgroundImageUri: (uri) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          backgroundImageUri: uri,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setFeedMode: (mode) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          feedMode: mode,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setHasBorderGlow: (glow) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          hasBorderGlow: glow,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      // Undo/Redo core mechanics
      saveHistoryState: () => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      undo: () => set((state) => {
        if (state.undoStack.length === 0) return {};
        const previousSnapshot = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);
        const currentSnapshot = takeSnapshot(state);
        return {
          ...previousSnapshot,
          undoStack: newUndoStack,
          redoStack: [currentSnapshot, ...state.redoStack].slice(0, 30),
        };
      }),

      redo: () => set((state) => {
        if (state.redoStack.length === 0) return {};
        const nextSnapshot = state.redoStack[0];
        const newRedoStack = state.redoStack.slice(1);
        const currentSnapshot = takeSnapshot(state);
        return {
          ...nextSnapshot,
          undoStack: [...state.undoStack, currentSnapshot].slice(-30),
          redoStack: newRedoStack,
        };
      }),

      addAnnotation: (type) => set((state) => {
        const snapshot = takeSnapshot(state);
        const newElement: AnnotationElement = {
          id: Math.random().toString(36).substring(2, 9),
          type,
          x: 50,
          y: 50,
          scale: 1,
          text: type === 'Text' ? 'Double tap to edit' : undefined,
          color: '#ffffff',
          arrowDirection: type === 'Arrow' ? 45 : undefined,
          zoomFactor: type === 'Spotlight' ? 1.5 : undefined,
          rotation: type === 'Arrow' ? 45 : 0,
          fontFamily: type === 'Text' ? 'System' : undefined,
        };
        return {
          annotations: [...state.annotations, newElement],
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      updateAnnotation: (id, updates, saveToHistory = false) => set((state) => {
        const nextAnnotations = state.annotations.map((ann) => 
          ann.id === id ? { ...ann, ...updates } : ann
        );
        if (saveToHistory) {
          const snapshot = takeSnapshot(state);
          return {
            annotations: nextAnnotations,
            undoStack: [...state.undoStack, snapshot].slice(-30),
            redoStack: [],
          };
        }
        return { annotations: nextAnnotations };
      }),

      deleteAnnotation: (id) => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          annotations: state.annotations.filter((ann) => ann.id !== id),
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),

      setAnnotations: (annotations) => set({ annotations }),

      addExportToHistory: (fileName, frameType, aspectRatio, imageUri) => set((state) => {
        const newItem: ExportHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          fileName,
          timestamp: new Date().toISOString(),
          frameType,
          aspectRatio,
          imageUri,
        };
        const updatedHistory = [newItem, ...state.exportsHistory].slice(0, 10);
        return { exportsHistory: updatedHistory };
      }),

      clearExportsHistory: () => set({ exportsHistory: [] }),

      deleteExportFromHistory: (id) => set((state) => ({
        exportsHistory: state.exportsHistory.filter((item) => item.id !== id),
      })),

      clearAll: () => set((state) => {
        const snapshot = takeSnapshot(state);
        return {
          imageUri: null,
          beforeImageUri: null,
          isSplitSliderEnabled: false,
          sliderPosition: 50,
          annotations: [],
          padding: 15,
          rotation3D: 0,
          shadowIntensity: 0.5,
          screenshotScale: 1.0,
          screenshotOffsetX: 0,
          screenshotOffsetY: 0,
          beforeScreenshotScale: 1.0,
          beforeScreenshotOffsetX: 0,
          beforeScreenshotOffsetY: 0,
          frameType: 'iPhone16Pro',
          showNotch: true,
          backgroundType: 'gradient',
          backgroundImageUri: null,
          feedMode: 'None',
          hasBorderGlow: false,
          undoStack: [...state.undoStack, snapshot].slice(-30),
          redoStack: [],
        };
      }),
    }),
    {
      name: 'mockupbuilder-storage',
      storage: createJSONStorage(() => customStorage),
      // Prevent undoStack and redoStack from bloating the persistent local storage
      partialize: (state) => {
        const { undoStack, redoStack, ...rest } = state;
        return rest;
      },
    }
  )
);
