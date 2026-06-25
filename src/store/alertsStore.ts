import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import defaultAlerts from '../constants/alerts.json';

export interface AlertItem {
  id: string;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  enabled?: boolean;
}

interface AlertsState {
  alerts: AlertItem[];
  addAlert: (title: string, body: string, time?: string) => void;
  deleteAlert: (id: string) => void;
  toggleRead: (id: string) => void;
  markAllRead: () => void;
  clearAlerts: () => void;
  syncRemoteAlerts: () => Promise<void>;
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

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],

      addAlert: (title, body, time) => set((state) => {
        const newAlert: AlertItem = {
          id: Math.random().toString(36).substring(2, 9),
          title,
          body,
          time: time || 'Just now',
          isRead: false,
          enabled: true,
        };
        return { alerts: [newAlert, ...state.alerts] };
      }),

      deleteAlert: (id) => set((state) => ({
        alerts: state.alerts.filter((item) => item.id !== id),
      })),

      toggleRead: (id) => set((state) => ({
        alerts: state.alerts.map((item) =>
          item.id === id ? { ...item, isRead: !item.isRead } : item
        ),
      })),

      markAllRead: () => set((state) => ({
        alerts: state.alerts.map((item) => ({ ...item, isRead: true })),
      })),

      clearAlerts: () => set({ alerts: [] }),

      syncRemoteAlerts: async () => {
        try {
          // In a production build, this would fetch from a CDN URL:
          // const res = await fetch('https://cdn.mockuppro.com/config/alerts.json');
          // const remoteData = await res.json();
          
          const remoteData = defaultAlerts;
          
          set((state) => {
            const currentAlerts = [...state.alerts];
            
            // Loop through remote alerts and add if they don't already exist
            remoteData.forEach((item) => {
              const existingIndex = currentAlerts.findIndex((existing) => existing.id === item.id);
              if (existingIndex === -1) {
                currentAlerts.push({
                  ...item,
                  isRead: false,
                });
              } else {
                // Update fields (including enabled property) from remote data
                currentAlerts[existingIndex] = {
                  ...currentAlerts[existingIndex],
                  title: item.title,
                  body: item.body,
                  time: item.time,
                  enabled: item.enabled,
                };
              }
            });
            
            return { alerts: currentAlerts };
          });
        } catch (error) {
          console.warn('Failed to sync remote alerts:', error);
        }
      },
    }),
    {
      name: 'mockupbuilder-alerts-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
