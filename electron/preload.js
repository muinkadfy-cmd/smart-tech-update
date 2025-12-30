const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: process.versions,
  shell: {
    openExternal: async (url) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        console.error('[Preload] Erro ao abrir URL externa:', error);
        throw error;
      }
    },
  },
  // Expor ipcRenderer para listeners de eventos
  ipcRenderer: {
    on: (channel, callback) => {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
    removeListener: (channel, callback) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },
  // Função para limpar dados do AppData
  clearAppData: () => {
    return ipcRenderer.invoke('clear-app-data');
  },
  // Controles de janela
  window: {
    toggleFullscreen: () => ipcRenderer.invoke('window-toggle-fullscreen'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close: () => ipcRenderer.invoke('window-close'),
    getState: () => ipcRenderer.invoke('window-get-state'),
    setZoom: (level) => ipcRenderer.invoke('window-set-zoom', level),
    getZoom: () => ipcRenderer.invoke('window-get-zoom'),
  },
  // Verificar se está em Electron
  isElectron: true,
  // Sistema de atualização padronizado
  update: {
    // Versão atual
    getCurrentVersion: () => ipcRenderer.invoke('update-get-current-version'),
    
    // Verificar atualização online (padronizado)
    check: () => ipcRenderer.invoke('update-check-online'),
    checkOnlineStatus: () => ipcRenderer.invoke('update-check-online-status'),
    
    // Download de atualização (manual via shell.openExternal)
    download: (downloadUrl) => ipcRenderer.invoke('update-download', downloadUrl),
    
    // Download assistido (MODO 1 - apenas baixa ZIP)
    downloadAssistido: (downloadUrl) => ipcRenderer.invoke('update-download-assistido', downloadUrl),
    
    // Instalar atualização
    install: (downloadPath) => ipcRenderer.invoke('update-install', downloadPath),
    
    // Backup e restauração
    createBackup: () => ipcRenderer.invoke('update-create-backup'),
    restoreBackup: (backupPath) => ipcRenderer.invoke('update-restore-backup', backupPath),
    getLogs: () => ipcRenderer.invoke('update-get-logs'),
    
    // Atualização offline (pendrive) - mantido para compatibilidade
    detectDrives: () => ipcRenderer.invoke('update-detect-drives'),
    checkOffline: (drivePath) => ipcRenderer.invoke('update-check', drivePath),
    applyOffline: (updatePath) => ipcRenderer.invoke('update-apply', updatePath),
    
    // Listeners para progresso
    onCheckProgress: (callback) => {
      ipcRenderer.on('update-check-progress', (_, percent) => callback(percent));
      return () => ipcRenderer.removeAllListeners('update-check-progress');
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('update-download-progress', (_, percent) => callback(percent));
      return () => ipcRenderer.removeAllListeners('update-download-progress');
    },
  },
  
  // Controle de aplicativo
  app: {
    restart: () => ipcRenderer.invoke('app-restart'),
    quit: () => ipcRenderer.invoke('app-quit'),
  },
  // Listener para evento de fechamento do app
  onAppWillQuit: (callback) => {
    ipcRenderer.on('app-will-quit', callback);
    // Retornar função de cleanup
    return () => {
      ipcRenderer.removeListener('app-will-quit', callback);
    };
  },
  // Sistema de persistência de dados em arquivo
  storage: {
    save: (data) => ipcRenderer.invoke('storage-save', data),
    load: () => ipcRenderer.invoke('storage-load'),
    clear: () => ipcRenderer.invoke('storage-clear'),
    getInfo: () => ipcRenderer.invoke('storage-info'),
  },
});

