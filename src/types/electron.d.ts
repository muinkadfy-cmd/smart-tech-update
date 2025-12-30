/**
 * ============================================
 * TIPOS TYPESCRIPT - ELECTRON
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Definições de tipos para APIs do Electron
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

export interface ElectronAPI {
  platform: string;
  versions: NodeJS.ProcessVersions;
  isElectron: boolean;
  
  shell: {
    openExternal: (url: string) => Promise<{ success: boolean }>;
  };
  
  license: {
    getMachineId: () => Promise<{ success: boolean; machineId?: string; error?: string }>;
    check: () => Promise<{
      valid: boolean;
      reason?: string;
      message?: string;
      expires?: string;
      daysRemaining?: number;
    }>;
    activate: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
    getInfo: () => Promise<{ success: boolean; info?: any; error?: string }>;
    remove: () => Promise<{ success: boolean; error?: string }>;
  };
  
  update: {
    getCurrentVersion: () => Promise<string>;
    checkOnlineRailway: () => Promise<{
      available: boolean;
      version?: string;
      url?: string;
      notes?: string;
      error?: string;
    }>;
    downloadRailway: (downloadUrl: string) => Promise<{ success: boolean; error?: string }>;
    
    autoUpdater: {
      check: () => Promise<{ success: boolean; error?: string }>;
      download: () => Promise<{ success: boolean; error?: string }>;
      install: () => Promise<{ success: boolean; error?: string }>;
      onUpdateAvailable: (callback: (data: {
        version: string;
        releaseDate?: string;
        releaseNotes?: string;
      }) => void) => (() => void) | undefined;
      onUpdateNotAvailable: (callback: (data: { version: string }) => void) => (() => void) | undefined;
      onDownloadProgress: (callback: (progress: {
        percent: number;
        transferred: number;
        total: number;
        bytesPerSecond?: number;
      }) => void) => (() => void) | undefined;
      onUpdateDownloaded: (callback: (data: {
        version: string;
        releaseDate?: string;
        releaseNotes?: string;
      }) => void) => (() => void) | undefined;
      onError: (callback: (error: { error: string }) => void) => (() => void) | undefined;
    };
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};

