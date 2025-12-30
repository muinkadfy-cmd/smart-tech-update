/**
 * ============================================
 * AUTO UPDATER - Atualização Automática
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Sistema de atualização automática usando electron-updater
 * Consome endpoint /update/latest do servidor Railway
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { autoUpdater } from 'electron-updater';
import { app } from 'electron';

// URL do servidor de atualizações (Railway)
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://smart-tech-server.up.railway.app';

// Configurar autoUpdater
autoUpdater.setFeedURL({
  provider: 'generic',
  url: `${UPDATE_SERVER_URL}/update`
});

// Configurações adicionais
autoUpdater.autoDownload = false; // Não baixar automaticamente (pedir permissão)
autoUpdater.autoInstallOnAppQuit = true; // Instalar automaticamente ao fechar app

/**
 * Verifica atualizações disponíveis
 * @param {BrowserWindow} mainWindow - Janela principal para enviar eventos
 * @returns {Promise<void>}
 */
export async function checkForUpdatesAndNotify(mainWindow) {
  try {
    console.log('[AutoUpdater] Verificando atualizações...');
    
    // Configurar listeners para eventos
    setupAutoUpdaterListeners(mainWindow);
    
    // Verificar atualizações
    const result = await autoUpdater.checkForUpdates();
    
    console.log('[AutoUpdater] Resultado da verificação:', {
      updateInfo: result?.updateInfo,
      downloadPromise: !!result?.downloadPromise
    });
    
    return result;
  } catch (error) {
    console.error('[AutoUpdater] Erro ao verificar atualizações:', error);
    
    // Enviar erro para renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-error', {
        error: error.message || 'Erro ao verificar atualizações'
      });
    }
    
    throw error;
  }
}

/**
 * Configura listeners para eventos do autoUpdater
 * @param {BrowserWindow} mainWindow - Janela principal
 */
function setupAutoUpdaterListeners(mainWindow) {
  // Atualização disponível
  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Atualização disponível:', info);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes || info.releaseName || 'Correções e melhorias'
      });
    }
  });
  
  // Atualização não disponível
  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Nenhuma atualização disponível:', info);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-update-not-available', {
        version: info.version
      });
    }
  });
  
  // Erro ao verificar atualização
  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Erro:', error);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-error', {
        error: error.message || 'Erro ao verificar atualizações'
      });
    }
  });
  
  // Progresso do download
  autoUpdater.on('download-progress', (progress) => {
    console.log('[AutoUpdater] Progresso do download:', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    });
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-download-progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      });
    }
  });
  
  // Download concluído
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Download concluído:', info);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-updater-update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes || info.releaseName || 'Correções e melhorias'
      });
    }
  });
}

/**
 * Baixa atualização disponível
 * @returns {Promise<void>}
 */
export async function downloadUpdate() {
  try {
    console.log('[AutoUpdater] Iniciando download da atualização...');
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error('[AutoUpdater] Erro ao baixar atualização:', error);
    throw error;
  }
}

/**
 * Instala atualização baixada e reinicia app
 */
export function quitAndInstall() {
  console.log('[AutoUpdater] Instalando atualização e reiniciando app...');
  autoUpdater.quitAndInstall(false, true); // isSilent, isForceRunAfter
}

/**
 * Verifica atualizações periodicamente
 * @param {BrowserWindow} mainWindow - Janela principal
 * @param {number} intervalMinutes - Intervalo em minutos (padrão: 60)
 */
export function startPeriodicCheck(mainWindow, intervalMinutes = 60) {
  console.log(`[AutoUpdater] Iniciando verificação periódica a cada ${intervalMinutes} minutos`);
  
  // Verificar imediatamente
  checkForUpdatesAndNotify(mainWindow);
  
  // Verificar periodicamente
  setInterval(() => {
    checkForUpdatesAndNotify(mainWindow);
  }, intervalMinutes * 60 * 1000);
}

