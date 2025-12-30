/**
 * ============================================
 * HOOK - AUTO UPDATER
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Hook React para gerenciar atualizações automáticas
 * Escuta eventos do electron-updater
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond?: number;
}

export function useAutoUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mandatory, setMandatory] = useState(false);

  // Verificar atualização
  const checkForUpdates = useCallback(async () => {
    if (!window.electron?.update?.autoUpdater) {
      console.warn('[AutoUpdater] APIs não disponíveis');
      return;
    }

    try {
      const result = await window.electron.update.autoUpdater.check();
      if (result.success) {
        console.log('[AutoUpdater] Verificação iniciada');
      }
    } catch (err: any) {
      console.error('[AutoUpdater] Erro ao verificar:', err);
      setError(err.message || 'Erro ao verificar atualização');
    }
  }, []);

  // Baixar atualização
  const downloadUpdate = useCallback(async () => {
    if (!window.electron?.update?.autoUpdater) {
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);
      const result = await window.electron.update.autoUpdater.download();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao baixar atualização');
      }
    } catch (err: any) {
      console.error('[AutoUpdater] Erro ao baixar:', err);
      setError(err.message || 'Erro ao baixar atualização');
      setIsDownloading(false);
    }
  }, []);

  // Instalar atualização
  const installUpdate = useCallback(async () => {
    if (!window.electron?.update?.autoUpdater) {
      return;
    }

    try {
      const result = await window.electron.update.autoUpdater.install();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao instalar atualização');
      }
    } catch (err: any) {
      console.error('[AutoUpdater] Erro ao instalar:', err);
      setError(err.message || 'Erro ao instalar atualização');
    }
  }, []);

  // Configurar listeners
  useEffect(() => {
    if (!window.electron?.update?.autoUpdater) {
      return;
    }

    // Nova atualização disponível
    const removeUpdateAvailable = window.electron.update.autoUpdater.onUpdateAvailable?.((data: UpdateInfo) => {
      console.log('[AutoUpdater] Nova atualização disponível:', data);
      setUpdateAvailable(true);
      setUpdateInfo(data);
      setError(null);
    });

    // Nenhuma atualização disponível
    const removeUpdateNotAvailable = window.electron.update.autoUpdater.onUpdateNotAvailable?.((data: { version: string }) => {
      console.log('[AutoUpdater] Sistema atualizado:', data.version);
      setUpdateAvailable(false);
      setUpdateInfo(null);
    });

    // Progresso do download
    const removeProgress = window.electron.update.autoUpdater.onDownloadProgress?.((progress: DownloadProgress) => {
      console.log('[AutoUpdater] Progresso:', progress.percent + '%');
      setDownloadProgress(progress.percent);
      setIsDownloading(true);
    });

    // Download concluído
    const removeDownloaded = window.electron.update.autoUpdater.onUpdateDownloaded?.((data: UpdateInfo) => {
      console.log('[AutoUpdater] Download concluído!');
      setIsDownloading(false);
      setIsDownloaded(true);
      setUpdateInfo(data);
    });

    // Erro
    const removeError = window.electron.update.autoUpdater.onError?.((err: { error: string }) => {
      console.error('[AutoUpdater] Erro:', err.error);
      setError(err.error);
      setIsDownloading(false);
    });

    // Cleanup
    return () => {
      removeUpdateAvailable?.();
      removeUpdateNotAvailable?.();
      removeProgress?.();
      removeDownloaded?.();
      removeError?.();
    };
  }, []);

  return {
    updateAvailable,
    updateInfo,
    downloadProgress,
    isDownloading,
    isDownloaded,
    error,
    mandatory,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  };
}

